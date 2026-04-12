import os
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from config import settings


BASE_DIR = Path(__file__).resolve().parent.parent

# Use settings for database URL (with automatic async upgrade)
DATABASE_URL = settings.database_url

engine = create_async_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    # echo=True,  # Uncomment to log all SQL queries during development
)

SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,  # Avoids lazy-load errors after commit in async context
)

Base = declarative_base()

async def get_db():
    async with SessionLocal() as db:
        try:
            yield db
        finally:
            await db.close()


async def migrate_add_ai_label(engine_to_use=None):
    """Add scans.ai_label for existing SQLite DBs that predate this column."""
    """Add new migration columns for existing SQLite DBs that predate them."""
    active_engine = engine_to_use or engine
    async with active_engine.connect() as conn:
        result = await conn.execute(text("PRAGMA table_info(scans)"))
        columns = [row[1] for row in result.fetchall()]
        if "ai_label" not in columns:
            await conn.execute(text("ALTER TABLE scans ADD COLUMN ai_label TEXT"))
            await conn.commit()

        if "chat_id" not in columns:
            await conn.execute(text("ALTER TABLE scans ADD COLUMN chat_id TEXT"))
        if "user_id" not in columns:
            await conn.execute(text("ALTER TABLE scans ADD COLUMN user_id TEXT"))
            
        await conn.commit()