from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, Integer, String, Text

from database.database import Base


class Scan(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True)
    message = Column(Text, nullable=False)
    result = Column(String(20), nullable=False, index=True)
    confidence = Column(Float, nullable=False)
    source = Column(String(50), nullable=False, index=True)
    username = Column(String(255), nullable=True)
    chat_id = Column(String(50), nullable=True)  # New tracking column
    user_id = Column(String(50), nullable=True)  # New tracking column
    keywords = Column(Text, nullable=True)
    ai_label = Column(Text, nullable=True)
    timestamp = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

class SystemSettings(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    setting_key = Column(String(50), unique=True, nullable=False, index=True)
    setting_value = Column(String(255), nullable=False)
