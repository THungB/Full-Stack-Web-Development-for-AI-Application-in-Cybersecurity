import os
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database.schema import Scan


def _is_seed_enabled() -> bool:
    return settings.app_seed_demo


DEMO_DATA = [
    {
        "message": "Urgent account alert: verify your bank login immediately to avoid suspension.",
        "result": "spam",
        "confidence": 0.93,
        "source": "website",
        "keywords": ["urgent", "verify", "bank"],
    },
    {
        "message": "Team reminder: tomorrow's sprint review starts at 9:30 AM in Meeting Room B.",
        "result": "ham",
        "confidence": 0.14,
        "source": "website",
        "keywords": [],
    },
    {
        "message": "Congratulations, you won a free gift voucher. Claim your prize before midnight.",
        "result": "spam",
        "confidence": 0.89,
        "source": "telegram",
        "username": "promo_alerts",
        "keywords": ["congratulations", "free", "gift", "prize", "claim"],
    },
    {
        "message": "Please review the latest customer support transcript before the stand-up.",
        "result": "ham",
        "confidence": 0.19,
        "source": "extension",
        "keywords": [],
    },
    {
        "message": "Security team: reset your password using the internal portal before 5 PM today.",
        "result": "ham",
        "confidence": 0.41,
        "source": "website",
        "keywords": ["password"],
    },
    {
        "message": "Limited-time loan approval. Click now to get your instant cash offer.",
        "result": "spam",
        "confidence": 0.78,
        "source": "extension",
        "keywords": ["limited", "loan", "click", "offer"],
    },
    {
        "message": "OCR capture: delivery update from warehouse team, package moved to secure locker 14.",
        "result": "ham",
        "confidence": 0.28,
        "source": "ocr",
        "keywords": [],
    },
    {
        "message": "Act now to confirm your crypto refund and receive bonus tokens today.",
        "result": "spam",
        "confidence": 0.82,
        "source": "ocr",
        "keywords": ["act now", "crypto", "refund", "bonus"],
    },
    {
        "message": "Hi class, the assignment briefing slides are uploaded to Canvas.",
        "result": "ham",
        "confidence": 0.09,
        "source": "telegram",
        "username": "course_bot",
        "keywords": [],
    },
    {
        "message": "Winner notification: claim your free bitcoin starter pack via this link.",
        "result": "spam",
        "confidence": 0.95,
        "source": "telegram",
        "username": "win_now",
        "keywords": ["winner", "claim", "free", "bitcoin"],
    },
    {
        "message": "Extension capture: internal wiki article on phishing awareness and reporting flow.",
        "result": "ham",
        "confidence": 0.23,
        "source": "extension",
        "keywords": [],
    },
    {
        "message": "Your OTP has expired. Verify again using the secure banking shortcut.",
        "result": "spam",
        "confidence": 0.69,
        "source": "website",
        "keywords": ["otp", "verify", "bank"],
    },
    {
        "message": "Customer success note: your subscription renewal was processed successfully.",
        "result": "ham",
        "confidence": 0.12,
        "source": "website",
        "keywords": [],
    },
    {
        "message": "Free bonus upgrade available today only. Click to unlock your premium reward.",
        "result": "spam",
        "confidence": 0.74,
        "source": "extension",
        "keywords": ["free", "bonus", "click"],
    },
    {
        "message": "Telegram reminder: bring your student ID for tomorrow's cybersecurity lab.",
        "result": "ham",
        "confidence": 0.17,
        "source": "telegram",
        "username": "lab_assistant",
        "keywords": [],
    },
    {
        "message": "OCR capture: congratulations, your limited reward code is active for 2 hours.",
        "result": "spam",
        "confidence": 0.71,
        "source": "ocr",
        "keywords": ["congratulations", "limited", "reward"],
    },
    {
        "message": "Browser note: updated privacy policy for the student portal is now available.",
        "result": "ham",
        "confidence": 0.31,
        "source": "extension",
        "keywords": [],
    },
    {
        "message": "Claim your refund now to avoid account closure. Urgent action required.",
        "result": "spam",
        "confidence": 0.86,
        "source": "website",
        "keywords": ["claim", "refund", "urgent"],
    },
]


async def seed_demo_data_if_empty(db: AsyncSession) -> int:
    if not _is_seed_enabled():
        return 0

    result = await db.execute(select(func.count(Scan.id)))
    existing = result.scalar()
    if existing:
        return 0

    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    seeded_records = []

    for index, item in enumerate(DEMO_DATA):
        day_offset = 13 - (index % 14)
        hour_offset = 9 + (index % 5) * 2
        timestamp = now - timedelta(days=day_offset, hours=hour_offset)

        seeded_records.append(
            Scan(
                message=item["message"],
                result=item["result"],
                confidence=item["confidence"],
                source=item["source"],
                username=item.get("username"),
                keywords=",".join(item.get("keywords", [])),
                timestamp=timestamp,
            )
        )

    db.add_all(seeded_records)
    await db.commit()
    return len(seeded_records)
