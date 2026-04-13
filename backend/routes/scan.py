"""Scan endpoints for text, OCR, and batch workflows.

This module is the primary ingestion surface for spam detection. It handles:
1) Validation and normalization of client payloads.
2) Prediction execution (CPU-bound model inference).
3) Optional persistence to the historical ledger with AI labels.
"""

import asyncio
import csv
import io
import re
import unicodedata

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.ext.asyncio import AsyncSession

from database.database import get_db
from database.schema import Scan
from ml.predictor import predict
from routes.common import serialize_scan
from services.ai_labeler import _format_warning_label, get_ai_label

try:
    import pytesseract
    import os
    from config import settings
    
    if settings.tesseract_cmd_path and os.path.exists(settings.tesseract_cmd_path):
        pytesseract.pytesseract.tesseract_cmd = settings.tesseract_cmd_path
except ImportError:  # pragma: no cover
    pytesseract = None


router = APIRouter()

ALLOWED_SOURCES = {"website", "telegram", "extension", "ocr", "batch"}
ALLOWED_IMAGE_TYPES = {"image/png", "image/jpeg", "image/webp"}
ALLOWED_BATCH_TYPES = {
    "text/csv",
    "application/vnd.ms-excel",
    "application/csv",
    "text/plain",
}
MAX_IMAGE_SIZE = 5 * 1024 * 1024
MAX_BATCH_ROWS = 500
EXPECTED_LABELS = {"spam", "ham"}
ZERO_WIDTH_RE = re.compile(r"[\u200B-\u200D\uFEFF]")
WHITESPACE_RE = re.compile(r"\s+")


def normalize_message_text(value: str):
    """Normalize incoming text to reduce Unicode/whitespace ambiguity."""
    normalized = unicodedata.normalize("NFKC", value or "")
    normalized = normalized.replace("\u00A0", " ")
    normalized = ZERO_WIDTH_RE.sub("", normalized)
    normalized = WHITESPACE_RE.sub(" ", normalized).strip()
    return normalized


class ScanRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    source: str = Field(default="website")
    username: str | None = Field(default=None, max_length=255)
    chat_id: str | None = Field(default=None, max_length=50)
    user_id: str | None = Field(default=None, max_length=50)

    @field_validator("message")
    @classmethod
    def validate_message(cls, value: str):
        trimmed = normalize_message_text(value)
        if not trimmed:
            raise ValueError("Message cannot be empty.")
        if len(trimmed) < 10:
            raise ValueError("Message is too short (min 10 characters).")
        return trimmed

    @field_validator("source")
    @classmethod
    def validate_source(cls, value: str):
        normalized = value.strip().lower()
        if normalized not in ALLOWED_SOURCES:
            raise ValueError("Invalid source.")
        return normalized


def validate_message_text(value: str):
    """Shared text validation for non-Pydantic inputs (batch rows, OCR output)."""
    trimmed = normalize_message_text(value)
    if not trimmed:
        raise ValueError("Message cannot be empty.")
    if len(trimmed) < 10:
        raise ValueError("Message is too short (min 10 characters).")
    if len(trimmed) > 2000:
        raise ValueError("Message exceeds 2000 character limit.")
    return trimmed


def validate_source_value(value: str):
    """Normalize and validate accepted source identifiers."""
    normalized = value.strip().lower()
    if normalized not in ALLOWED_SOURCES:
        raise ValueError("Invalid source.")
    return normalized


def parse_bool_form_value(value: str | None, default: bool):
    """Parse HTML form boolean strings into strict bool values."""
    if value is None:
        return default
    normalized = value.strip().lower()
    if normalized in {"1", "true", "yes", "on"}:
        return True
    if normalized in {"0", "false", "no", "off"}:
        return False
    raise HTTPException(status_code=400, detail="Invalid boolean form value.")


async def create_scan_record(
    *,
    db: AsyncSession,
    message: str,
    source: str,
    username: str | None = None,
    chat_id: str | None = None,
    user_id: str | None = None,
    prediction: tuple | None = None,
    skip_ai_label: bool = False,
):
    """
    Persist a Scan record asynchronously.
    Pass `prediction=(result, confidence, keywords)` when the caller has
    already awaited asyncio.to_thread(predict, ...) to avoid a double call.
    Set `skip_ai_label=True` for batch ingestion to bypass the OpenRouter
    HTTP call and use a local deterministic label instead, keeping batch
    throughput fast regardless of AI labeling configuration.
    """
    if prediction is None:
        prediction = await asyncio.to_thread(predict, message)

    result, confidence, keywords = prediction
    if skip_ai_label:
        ai_label = _format_warning_label(
            result=result, base_text=message, confidence=float(confidence)
        )
    else:
        ai_label = await get_ai_label(message, float(confidence), result=result)

    record = Scan(
        message=message,
        result=result,
        confidence=round(float(confidence), 4),
        source=source,
        username=username,
        chat_id=chat_id,
        user_id=user_id,
        keywords=",".join(keywords),
        ai_label=ai_label,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


@router.post("/scan")
async def scan_message(
    request: Request,
    payload: ScanRequest,
    db: AsyncSession = Depends(get_db),
):
    """Scan one message payload and persist the resulting classification record."""
    try:
        prediction = await asyncio.to_thread(predict, payload.message)
        record = await create_scan_record(
            db=db,
            message=payload.message,
            source=payload.source,
            username=payload.username,
            chat_id=payload.chat_id,
            user_id=payload.user_id,
            prediction=prediction,
        )
        return serialize_scan(record)
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error)) from error


@router.post("/scan/ocr")
async def scan_ocr(
    request: Request,
    image: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Run OCR + spam prediction for one uploaded image and persist the result."""
    if image.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported image type. Use PNG, JPG, or WebP.",
        )

    if pytesseract is None:
        raise HTTPException(
            status_code=503,
            detail="pytesseract is not installed on the backend.",
        )

    contents = await image.read()
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail="Image must be under 5MB.")

    try:
        pil_image = Image.open(io.BytesIO(contents))
    except UnidentifiedImageError as error:
        raise HTTPException(status_code=400, detail="Invalid image file.") from error

    try:
        extracted_text = await asyncio.to_thread(
            pytesseract.image_to_string, pil_image
        )
        extracted_text = extracted_text.strip()
    except pytesseract.TesseractNotFoundError as error:
        raise HTTPException(
            status_code=503,
            detail="Tesseract is not installed or not in PATH. Please install Tesseract-OCR to use the image scan feature.",
        ) from error
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"OCR failed. Check Tesseract installation. {error}",
        ) from error

    if not extracted_text:
        raise HTTPException(status_code=400, detail="No text detected in the image.")

    if len(extracted_text) > 2000:
        extracted_text = extracted_text[:2000]

    prediction = await asyncio.to_thread(predict, extracted_text)

    record = await create_scan_record(
        db=db,
        message=extracted_text,
        source="ocr",
        prediction=prediction,
    )
    response = serialize_scan(record)
    response["extracted_text"] = extracted_text
    return response


@router.post("/scan/batch")
async def scan_batch(
    request: Request,
    file: UploadFile = File(...),
    store_results: str | None = Form(default="true"),
    default_source: str | None = Form(default="batch"),
    db: AsyncSession = Depends(get_db),
):
    """Validate, score, and optionally persist many CSV rows in one request."""
    file_name = (file.filename or "").lower()
    if file.content_type not in ALLOWED_BATCH_TYPES and not file_name.endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Unsupported batch file type. Upload a CSV file.",
        )

    try:
        normalized_default_source = validate_source_value(default_source or "batch")
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    should_store = parse_bool_form_value(store_results, default=True)

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Batch file is empty.")

    try:
        decoded = contents.decode("utf-8-sig")
    except UnicodeDecodeError as error:
        raise HTTPException(
            status_code=400,
            detail="Batch file must be UTF-8 encoded CSV.",
        ) from error

    reader = csv.DictReader(io.StringIO(decoded))
    if not reader.fieldnames or "message" not in reader.fieldnames:
        raise HTTPException(
            status_code=400,
            detail="CSV must include a 'message' column.",
        )

    # --- Parse and validate all rows first (pure Python, no I/O) ---
    validated_rows = []
    failed_rows    = []
    processed_rows = 0

    for index, row in enumerate(reader, start=1):
        if not any(str(value or "").strip() for value in row.values()):
            continue

        processed_rows += 1
        if processed_rows > MAX_BATCH_ROWS:
            raise HTTPException(
                status_code=400,
                detail=f"Batch size exceeds limit of {MAX_BATCH_ROWS} rows.",
            )

        raw_message  = str(row.get("message", "") or "")
        raw_source   = str(row.get("source", "") or normalized_default_source)
        raw_expected = str(row.get("expected_label", "") or "").strip().lower()
        raw_username = str(row.get("username", "") or "").strip() or None

        try:
            message = validate_message_text(raw_message)
            source  = validate_source_value(raw_source)
            if raw_expected and raw_expected not in EXPECTED_LABELS:
                raise ValueError("expected_label must be either spam or ham.")
            validated_rows.append((index, message, source, raw_expected, raw_username))
        except ValueError as error:
            failed_rows.append((index, raw_message, raw_source, raw_expected, raw_username, str(error)))

    if not validated_rows and not failed_rows:
        raise HTTPException(status_code=400, detail="Batch file has no data rows.")

    # Run all predictions concurrently in the thread pool
    predictions = await asyncio.gather(
        *[asyncio.to_thread(predict, row[1]) for row in validated_rows]
    )

    # --- Build results ---
    items              = []
    processed_count    = 0
    failed_count       = len(failed_rows)
    spam_count         = 0
    ham_count          = 0
    needs_review_count = 0
    correct_count      = 0
    labeled_count      = 0
    confusion = {
        "true_spam_pred_spam": 0,
        "true_spam_pred_ham":  0,
        "true_ham_pred_spam":  0,
        "true_ham_pred_ham":   0,
    }

    for (index, message, source, raw_expected, raw_username), (predicted_label, confidence, keywords) in zip(validated_rows, predictions):
        confidence = round(float(confidence), 4)
        record_id  = None

        if should_store:
            # skip_ai_label=True: use local deterministic label to avoid
            # blocking HTTP calls to OpenRouter for every row in the batch.
            record = await create_scan_record(
                db=db,
                message=message,
                source=source,
                username=raw_username,
                prediction=(predicted_label, confidence, keywords),
                skip_ai_label=True,
            )
            record_id = record.id

        processed_count += 1
        if predicted_label == "spam":
            spam_count += 1
        elif predicted_label == "ham":
            ham_count += 1
        else:
            needs_review_count += 1

        is_correct = None
        if raw_expected:
            labeled_count += 1
            is_correct = predicted_label == raw_expected
            if is_correct:
                correct_count += 1

            if raw_expected == "spam":
                if predicted_label == "spam":
                    confusion["true_spam_pred_spam"] += 1
                else:
                    confusion["true_spam_pred_ham"] += 1
            else:
                if predicted_label == "spam":
                    confusion["true_ham_pred_spam"] += 1
                else:
                    confusion["true_ham_pred_ham"] += 1

        items.append({
            "row":             index,
            "record_id":       record_id,
            "message":         message,
            "source":          source,
            "username":        raw_username,
            "predicted_label": predicted_label,
            "confidence":      confidence,
            "keywords":        keywords,
            "expected_label":  raw_expected or None,
            "correct":         is_correct,
            "status":          "processed",
            "error":           None,
        })

    for (index, raw_message, raw_source, raw_expected, raw_username, error_msg) in failed_rows:
        items.append({
            "row":             index,
            "record_id":       None,
            "message":         raw_message,
            "source":          raw_source.strip().lower() or normalized_default_source,
            "username":        raw_username,
            "predicted_label": None,
            "confidence":      None,
            "keywords":        [],
            "expected_label":  raw_expected or None,
            "correct":         None,
            "status":          "failed",
            "error":           error_msg,
        })

    items.sort(key=lambda x: x["row"])

    if not items:
        raise HTTPException(status_code=400, detail="Batch file has no data rows.")

    precision_denominator = confusion["true_spam_pred_spam"] + confusion["true_ham_pred_spam"]
    recall_denominator    = confusion["true_spam_pred_spam"] + confusion["true_spam_pred_ham"]
    precision = (
        confusion["true_spam_pred_spam"] / precision_denominator
        if precision_denominator else None
    )
    recall = (
        confusion["true_spam_pred_spam"] / recall_denominator
        if recall_denominator else None
    )
    f1_score = (
        (2 * precision * recall) / (precision + recall)
        if precision is not None and recall is not None and (precision + recall)
        else None
    )

    return {
        "summary": {
            "total":              len(items),
            "processed":          processed_count,
            "failed":             failed_count,
            "spam_count":         spam_count,
            "ham_count":          ham_count,
            "needs_review_count": needs_review_count,
            "labeled_count":      labeled_count,
            "correct_count":      correct_count,
            "accuracy":           (correct_count / labeled_count) if labeled_count else None,
            "precision":          precision,
            "recall":             recall,
            "f1_score":           f1_score,
            "stored_results":     should_store,
            "default_source":     normalized_default_source,
        },
        "confusion_matrix": confusion if labeled_count else None,
        "items": items,
    }
