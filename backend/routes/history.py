from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from database.database import get_db
from database.schema import Scan
from routes.common import serialize_scan


router = APIRouter()


@router.get("/history")
def get_history(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    filter: str = Query(default=""),
    source: str = Query(default=""),
    db: Session = Depends(get_db),
):
    query = db.query(Scan)

    if filter:
        query = query.filter(Scan.result == filter.strip().lower())

    if source:
        query = query.filter(Scan.source == source.strip().lower())

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


@router.delete("/history/{record_id}")
def delete_history_record(record_id: int, db: Session = Depends(get_db)):
    record = db.query(Scan).filter(Scan.id == record_id).first()
    if record is None:
        raise HTTPException(status_code=404, detail="Record not found.")

    db.delete(record)
    db.commit()
    return {"success": True}
