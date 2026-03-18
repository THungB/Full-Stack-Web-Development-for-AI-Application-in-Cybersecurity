import csv
import io

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

from database.database import get_db
from database.schema import Scan
from ml.predictor import predict
from routes.common import serialize_scan

try:
    import pytesseract
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


class ScanRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    source: str = Field(default="website")
    username: str | None = Field(default=None, max_length=255)

    @field_validator("message")
    @classmethod
    def validate_message(cls, value: str):
        trimmed = value.strip()
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
    trimmed = value.strip()
    if not trimmed:
        raise ValueError("Message cannot be empty.")
    if len(trimmed) < 10:
        raise ValueError("Message is too short (min 10 characters).")
    if len(trimmed) > 2000:
        raise ValueError("Message exceeds 2000 character limit.")
    return trimmed


def validate_source_value(value: str):
    normalized = value.strip().lower()
    if normalized not in ALLOWED_SOURCES:
        raise ValueError("Invalid source.")
    return normalized


def create_scan_record(
    *,
    db: Session,
    message: str,
    source: str,
    username: str | None = None,
):
    result, confidence, keywords = predict(message)
    record = Scan(
        message=message,
        result=result,
        confidence=round(float(confidence), 4),
        source=source,
        username=username,
        keywords=",".join(keywords),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def parse_bool_form_value(value: str | None, default: bool):
    if value is None:
        return default

    normalized = value.strip().lower()
    if normalized in {"1", "true", "yes", "on"}:
        return True
    if normalized in {"0", "false", "no", "off"}:
        return False
    raise HTTPException(status_code=400, detail="Invalid boolean form value.")


@router.post("/scan")
def scan_message(payload: ScanRequest, db: Session = Depends(get_db)):
    try:
        record = create_scan_record(
            db=db,
            message=payload.message,
            source=payload.source,
            username=payload.username,
        )
        return serialize_scan(record)
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error)) from error


@router.post("/scan/ocr")
async def scan_ocr(image: UploadFile = File(...), db: Session = Depends(get_db)):
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
        extracted_text = pytesseract.image_to_string(pil_image).strip()
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"OCR failed. Check Tesseract installation. {error}",
        ) from error

    if not extracted_text:
        raise HTTPException(status_code=400, detail="No text detected in the image.")

    if len(extracted_text) > 2000:
        extracted_text = extracted_text[:2000]

    record = create_scan_record(
        db=db,
        message=extracted_text,
        source="ocr",
    )
    response = serialize_scan(record)
    response["extracted_text"] = extracted_text
    return response


@router.post("/scan/batch")
async def scan_batch(
    file: UploadFile = File(...),
    store_results: str | None = Form(default="false"),
    default_source: str | None = Form(default="batch"),
    db: Session = Depends(get_db),
):
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

    should_store = parse_bool_form_value(store_results, default=False)

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

    items = []
    processed_count = 0
    failed_count = 0
    spam_count = 0
    ham_count = 0
    correct_count = 0
    labeled_count = 0
    confusion = {
        "true_spam_pred_spam": 0,
        "true_spam_pred_ham": 0,
        "true_ham_pred_spam": 0,
        "true_ham_pred_ham": 0,
    }

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

        raw_message = str(row.get("message", "") or "")
        raw_source = str(row.get("source", "") or normalized_default_source)
        raw_expected = str(row.get("expected_label", "") or "").strip().lower()
        raw_username = str(row.get("username", "") or "").strip() or None

        try:
            message = validate_message_text(raw_message)
            source = validate_source_value(raw_source)
            if raw_expected and raw_expected not in EXPECTED_LABELS:
                raise ValueError("expected_label must be either spam or ham.")

            if should_store:
                record = create_scan_record(
                    db=db,
                    message=message,
                    source=source,
                    username=raw_username,
                )
                result_payload = serialize_scan(record)
                predicted_label = result_payload["result"]
                confidence = result_payload["confidence"]
                keywords = result_payload["keywords"]
                record_id = result_payload["id"]
            else:
                predicted_label, confidence, keywords = predict(message)
                confidence = round(float(confidence), 4)
                record_id = None

            processed_count += 1
            if predicted_label == "spam":
                spam_count += 1
            else:
                ham_count += 1

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

            items.append(
                {
                    "row": index,
                    "record_id": record_id,
                    "message": message,
                    "source": source,
                    "username": raw_username,
                    "predicted_label": predicted_label,
                    "confidence": confidence,
                    "keywords": keywords,
                    "expected_label": raw_expected or None,
                    "correct": is_correct,
                    "status": "processed",
                    "error": None,
                }
            )
        except ValueError as error:
            failed_count += 1
            items.append(
                {
                    "row": index,
                    "record_id": None,
                    "message": raw_message,
                    "source": raw_source.strip().lower() or normalized_default_source,
                    "username": raw_username,
                    "predicted_label": None,
                    "confidence": None,
                    "keywords": [],
                    "expected_label": raw_expected or None,
                    "correct": None,
                    "status": "failed",
                    "error": str(error),
                }
            )
        except Exception as error:
            failed_count += 1
            items.append(
                {
                    "row": index,
                    "record_id": None,
                    "message": raw_message,
                    "source": raw_source.strip().lower() or normalized_default_source,
                    "username": raw_username,
                    "predicted_label": None,
                    "confidence": None,
                    "keywords": [],
                    "expected_label": raw_expected or None,
                    "correct": None,
                    "status": "failed",
                    "error": str(error),
                }
            )

    if not items:
        raise HTTPException(status_code=400, detail="Batch file has no data rows.")

    precision_denominator = (
        confusion["true_spam_pred_spam"] + confusion["true_ham_pred_spam"]
    )
    recall_denominator = (
        confusion["true_spam_pred_spam"] + confusion["true_spam_pred_ham"]
    )
    precision = (
        confusion["true_spam_pred_spam"] / precision_denominator
        if precision_denominator
        else None
    )
    recall = (
        confusion["true_spam_pred_spam"] / recall_denominator
        if recall_denominator
        else None
    )
    f1_score = (
        (2 * precision * recall) / (precision + recall)
        if precision is not None and recall is not None and (precision + recall)
        else None
    )

    return {
        "summary": {
            "total": len(items),
            "processed": processed_count,
            "failed": failed_count,
            "spam_count": spam_count,
            "ham_count": ham_count,
            "labeled_count": labeled_count,
            "correct_count": correct_count,
            "accuracy": (correct_count / labeled_count) if labeled_count else None,
            "precision": precision,
            "recall": recall,
            "f1_score": f1_score,
            "stored_results": should_store,
            "default_source": normalized_default_source,
        },
        "confusion_matrix": confusion if labeled_count else None,
        "items": items,
    }
