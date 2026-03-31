import os
from pathlib import Path

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

# FIX: AsyncSession + async_sessionmaker instead of sync Session + sessionmaker.
SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,  # Avoids lazy-load errors after commit in async context
)

Base = declarative_base()


# FIX: get_db is now an async generator yielding AsyncSession.
# All route files that use `db: Session = Depends(get_db)` must be updated to
# `db: AsyncSession = Depends(get_db)` and use `await db.execute(...)` syntax.
async def get_db():
    async with SessionLocal() as db:
        try:
            yield db
        finally:
            await db.close()