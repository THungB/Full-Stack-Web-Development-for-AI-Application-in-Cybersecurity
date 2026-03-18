import io

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
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

ALLOWED_SOURCES = {"website", "telegram", "extension", "ocr"}
ALLOWED_IMAGE_TYPES = {"image/png", "image/jpeg", "image/webp"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024


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
