from database.schema import Scan


def serialize_scan(record: Scan):
    keywords = []
    if record.keywords:
        keywords = [keyword.strip() for keyword in record.keywords.split(",") if keyword.strip()]

    return {
        "id": record.id,
        "message": record.message,
        "result": record.result,
        "confidence": round(float(record.confidence), 4),
        "source": record.source,
        "username": record.username,
        "keywords": keywords,
        "ai_label": record.ai_label,
        "timestamp": record.timestamp.isoformat() if record.timestamp else None,
    }
