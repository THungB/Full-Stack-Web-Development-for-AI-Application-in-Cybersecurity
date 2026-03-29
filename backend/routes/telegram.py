from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from database.database import get_db
from database.schema import Scan
from routes.common import serialize_scan

router = APIRouter()

TELEGRAM_SOURCE = "telegram"


@router.get("/telegram/messages")
def get_telegram_messages(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    filter: str = Query(default=""),
    db: Session = Depends(get_db),
):
    """Return paginated scan records that came from the Telegram bot."""
    query = db.query(Scan).filter(Scan.source == TELEGRAM_SOURCE)

    if filter:
        normalized = filter.strip().lower()
        if normalized in {"spam", "ham"}:
            query = query.filter(Scan.result == normalized)

    total = query.with_entities(func.count(Scan.id)).scalar() or 0
    records = (
        query.order_by(Scan.timestamp.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return {
        "data": [serialize_scan(record) for record in records],
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.delete("/telegram/messages/{record_id}")
def delete_telegram_message(record_id: int, db: Session = Depends(get_db)):
    """Delete a single Telegram scan record by ID."""
    record = (
        db.query(Scan)
        .filter(Scan.id == record_id, Scan.source == TELEGRAM_SOURCE)
        .first()
    )

    if record is None:
        raise HTTPException(
            status_code=404,
            detail="Telegram record not found.",
        )

    db.delete(record)
    db.commit()
    return {"success": True, "deleted_id": record_id}