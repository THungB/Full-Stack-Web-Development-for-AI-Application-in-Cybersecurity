from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from database.database import get_db
from database.schema import Scan
from routes.common import serialize_scan
from services.ai_labeler import get_ai_label


router = APIRouter()


@router.get("/history")
async def get_history(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    filter: str = Query(default=""),
    source: str = Query(default=""),
    db: AsyncSession = Depends(get_db),
):
    base_stmt = select(Scan)
    count_stmt = select(func.count(Scan.id)).select_from(Scan)

    if filter:
        normalized_filter = filter.strip().lower()
        base_stmt = base_stmt.where(Scan.result == normalized_filter)
        count_stmt = count_stmt.where(Scan.result == normalized_filter)

    if source:
        normalized_source = source.strip().lower()
        base_stmt = base_stmt.where(Scan.source == normalized_source)
        count_stmt = count_stmt.where(Scan.source == normalized_source)

    total_result = await db.execute(count_stmt)
    total = total_result.scalar() or 0

    records_result = await db.execute(
        base_stmt.order_by(Scan.timestamp.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    records = records_result.scalars().all()

    return {
        "data": [serialize_scan(record) for record in records],
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.delete("/history/{record_id}")
async def delete_history_record(record_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Scan).where(Scan.id == record_id))
    record = result.scalar_one_or_none()

    if record is None:
        raise HTTPException(status_code=404, detail="Record not found.")

    await db.delete(record)
    await db.commit()
    return {"success": True}


@router.post("/history/{record_id}/regenerate-label")
async def regenerate_ai_label(record_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Scan).where(Scan.id == record_id))
    record = result.scalar_one_or_none()

    if record is None:
        raise HTTPException(status_code=404, detail="Record not found.")

    ai_label = await get_ai_label(record.message, confidence=1.0, force=True)
    record.ai_label = ai_label
    await db.commit()
    await db.refresh(record)
    return serialize_scan(record)
