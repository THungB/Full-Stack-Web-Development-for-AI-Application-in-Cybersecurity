from collections import defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.database import get_db
from database.schema import Scan


router = APIRouter()

BUCKETS = [
    ("0-20%", 0.0, 0.2),
    ("20-40%", 0.2, 0.4),
    ("40-60%", 0.4, 0.6),
    ("60-80%", 0.6, 0.8),
    ("80-100%", 0.8, 1.01),
]


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    records = db.query(Scan).all()
    spam_count = sum(1 for record in records if record.result == "spam")
    ham_count = sum(1 for record in records if record.result == "ham")

    start_date = datetime.now(timezone.utc).date() - timedelta(days=13)
    daily_map = {
        (start_date + timedelta(days=offset)).isoformat(): {"total": 0, "spam": 0}
        for offset in range(14)
    }

    for record in records:
        if not record.timestamp:
            continue
        date_key = record.timestamp.date().isoformat()
        if date_key in daily_map:
            daily_map[date_key]["total"] += 1
            if record.result == "spam":
                daily_map[date_key]["spam"] += 1

    buckets = defaultdict(lambda: {"spam": 0, "ham": 0})
    for label, _, _ in BUCKETS:
        buckets[label]

    for record in records:
        confidence = max(0.0, min(float(record.confidence), 1.0))
        for label, lower, upper in BUCKETS:
            if lower <= confidence < upper:
                buckets[label][record.result if record.result in {"spam", "ham"} else "ham"] += 1
                break

    return {
        "spam_count": spam_count,
        "ham_count": ham_count,
        "daily_stats": [
            {
                "date": date_key,
                "total": values["total"],
                "spam": values["spam"],
            }
            for date_key, values in daily_map.items()
        ],
        "buckets": [
            {
                "range": label,
                "spam": buckets[label]["spam"],
                "ham": buckets[label]["ham"],
            }
            for label, _, _ in BUCKETS
        ],
    }
