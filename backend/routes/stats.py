from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import Integer, case, cast, func
from sqlalchemy.orm import Session

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
def get_stats(db: Session = Depends(get_db)):

    # FIX #1: Replace .all() + Python sum() with a single SQL aggregation query.
    # The DB engine does the counting — no rows are transferred to backend memory.
    spam_ham = (
        db.query(
            func.sum(case((Scan.result == "spam", 1), else_=0)).label("spam_count"),
            func.sum(case((Scan.result == "ham",  1), else_=0)).label("ham_count"),
        )
        .one()
    )
    spam_count = spam_ham.spam_count or 0
    ham_count  = spam_ham.ham_count  or 0

    # FIX #2: Compute daily stats directly in SQL with GROUP BY date.
    # Previously this fetched every row and iterated in Python.
    start_date = datetime.now(timezone.utc).date() - timedelta(days=13)
    start_dt   = datetime.combine(start_date, datetime.min.time())

    daily_rows = (
        db.query(
            func.date(Scan.timestamp).label("date"),
            func.count(Scan.id).label("total"),
            func.sum(case((Scan.result == "spam", 1), else_=0)).label("spam"),
        )
        .filter(Scan.timestamp >= start_dt)
        .group_by(func.date(Scan.timestamp))
        .all()
    )

    # Build a full 14-day map and merge DB results in
    daily_map = {
        (start_date + timedelta(days=i)).isoformat(): {"total": 0, "spam": 0}
        for i in range(14)
    }
    for row in daily_rows:
        date_key = str(row.date)
        if date_key in daily_map:
            daily_map[date_key]["total"] = row.total or 0
            daily_map[date_key]["spam"]  = row.spam  or 0

    # FIX #3: Compute confidence buckets in SQL using CASE WHEN expressions.
    # Previously every record was loaded into Python and bucketed with a for-loop.
    bucket_cases = case(
        *[
            (
                (Scan.confidence >= lower) & (Scan.confidence < upper),
                label,
            )
            for label, lower, upper in BUCKETS
        ],
        else_=None,
    )

    bucket_rows = (
        db.query(
            bucket_cases.label("bucket"),
            func.sum(case((Scan.result == "spam", 1), else_=0)).label("spam"),
            func.sum(case((Scan.result == "ham",  1), else_=0)).label("ham"),
        )
        .filter(bucket_cases.isnot(None))
        .group_by(bucket_cases)
        .all()
    )

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