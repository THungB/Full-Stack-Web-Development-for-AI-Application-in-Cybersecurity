from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from database.database import get_db
from database.schema import Scan
from routes.common import serialize_scan

router = APIRouter()

TELEGRAM_SOURCE = "telegram"


@router.get("/telegram/messages")
async def get_telegram_messages(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    filter: str = Query(default=""),
    db: AsyncSession = Depends(get_db),
):
    """Return paginated scan records that came from the Telegram bot."""
    base_stmt = select(Scan).where(Scan.source == TELEGRAM_SOURCE)
    count_stmt = select(func.count(Scan.id)).where(Scan.source == TELEGRAM_SOURCE)

    if filter:
        normalized = filter.strip().lower()
        if normalized in {"spam", "ham"}:
            base_stmt = base_stmt.where(Scan.result == normalized)
            count_stmt = count_stmt.where(Scan.result == normalized)

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


@router.delete("/telegram/messages/{record_id}")
async def delete_telegram_message(record_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a single Telegram scan record by ID."""
    result = await db.execute(
        select(Scan).where(Scan.id == record_id, Scan.source == TELEGRAM_SOURCE)
    )
    record = result.scalar_one_or_none()

    if record is None:
        raise HTTPException(
            status_code=404,
            detail="Telegram record not found.",
        )

    await db.delete(record)
    await db.commit()
    return {"success": True, "deleted_id": record_id}