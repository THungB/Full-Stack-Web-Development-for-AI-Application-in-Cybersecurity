import os
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base


BASE_DIR = Path(__file__).resolve().parent.parent

# FIX: Use sqlite+aiosqlite:// instead of sqlite:// to enable async I/O.
# The sync driver blocks a thread on every DB read/write; the async driver
# releases the event loop while waiting, allowing FastAPI to handle other
# requests concurrently during DB operations.
_raw_url = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'spam_detection.db'}")

# Automatically upgrade a plain sqlite:// URL to sqlite+aiosqlite://
# so existing .env files / deployment configs don't need to be changed.
if _raw_url.startswith("sqlite:///") and "+aiosqlite" not in _raw_url:
    DATABASE_URL = _raw_url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)
else:
    DATABASE_URL = _raw_url

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