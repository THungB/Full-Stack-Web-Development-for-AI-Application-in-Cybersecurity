from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from fastapi_cache2.decorator import cache
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database.database import get_db
from database.schema import Scan


router = APIRouter()

BUCKETS = [
    ("0-20%",   0.0, 0.2),
    ("20-40%",  0.2, 0.4),
    ("40-60%",  0.4, 0.6),
    ("60-80%",  0.6, 0.8),
    ("80-100%", 0.8, 1.01),
]


@router.get("/stats")
@cache(expire=settings.cache_ttl_seconds)  # Cache using TTL from settings
async def get_stats(db: AsyncSession = Depends(get_db)):

    # FIX: Single SQL aggregation — no rows transferred to Python memory
    spam_ham_result = await db.execute(
        select(
            func.sum(case((Scan.result == "spam", 1), else_=0)).label("spam_count"),
            func.sum(case((Scan.result == "ham",  1), else_=0)).label("ham_count"),
        )
    )
    spam_ham   = spam_ham_result.one()
    spam_count = spam_ham.spam_count or 0
    ham_count  = spam_ham.ham_count  or 0

    # FIX: Daily stats via GROUP BY — only 14 aggregate rows returned
    start_date = datetime.now(timezone.utc).date() - timedelta(days=13)
    start_dt   = datetime.combine(start_date, datetime.min.time())

    daily_result = await db.execute(
        select(
            func.date(Scan.timestamp).label("date"),
            func.count(Scan.id).label("total"),
            func.sum(case((Scan.result == "spam", 1), else_=0)).label("spam"),
        )
        .where(Scan.timestamp >= start_dt)
        .group_by(func.date(Scan.timestamp))
    )
    daily_rows = daily_result.all()

    daily_map = {
        (start_date + timedelta(days=i)).isoformat(): {"total": 0, "spam": 0}
        for i in range(14)
    }
    for row in daily_rows:
        date_key = str(row.date)
        if date_key in daily_map:
            daily_map[date_key]["total"] = row.total or 0
            daily_map[date_key]["spam"]  = row.spam  or 0

    # FIX: Confidence buckets via SQL CASE WHEN — no per-record Python loop
    bucket_case = case(
        *[
            (
                (Scan.confidence >= lower) & (Scan.confidence < upper),
                label,
            )
            for label, lower, upper in BUCKETS
        ],
        else_=None,
    )

    bucket_result = await db.execute(
        select(
            bucket_case.label("bucket"),
            func.sum(case((Scan.result == "spam", 1), else_=0)).label("spam"),
            func.sum(case((Scan.result == "ham",  1), else_=0)).label("ham"),
        )
        .where(bucket_case.isnot(None))
        .group_by(bucket_case)
    )
    bucket_rows = bucket_result.all()

    bucket_map = {label: {"spam": 0, "ham": 0} for label, _, _ in BUCKETS}
    for row in bucket_rows:
        if row.bucket in bucket_map:
            bucket_map[row.bucket]["spam"] = row.spam or 0
            bucket_map[row.bucket]["ham"]  = row.ham  or 0

    return {
        "spam_count": spam_count,
        "ham_count":  ham_count,
        "daily_stats": [
            {
                "date":  date_key,
                "total": values["total"],
                "spam":  values["spam"],
            }
            for date_key, values in daily_map.items()
        ],
        "buckets": [
            {
                "range": label,
                "spam":  bucket_map[label]["spam"],
                "ham":   bucket_map[label]["ham"],
            }
            for label, _, _ in BUCKETS
        ],
    }