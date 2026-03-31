import asyncio
import logging
import os
import threading
from contextlib import asynccontextmanager

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from config import settings
from database.database import Base, SessionLocal, engine
from routes import history, scan, stats
from routes import telegram
from services.demo_seed import seed_demo_data_if_empty

logger = logging.getLogger(__name__)


def _run_bot_in_thread():
    """Run the Telegram bot in its own asyncio event loop inside a daemon thread.

    python-telegram-bot v20+ is fully async. Running it inside FastAPI's thread
    directly causes event loop conflicts. Creating a fresh event loop in a
    dedicated thread avoids this entirely.
    """
    token = settings.telegram_bot_token or ""
    if not token:
        logger.warning(
            "TELEGRAM_BOT_TOKEN is not set. "
            "The Telegram bot will not start. "
            "Set the token in your .env file to enable it."
        )
        return

    async def _bot_runner():
        from telegram.ext import ApplicationBuilder, MessageHandler, filters
        from bot.telegram_bot import handle_message

        app = ApplicationBuilder().token(token).build()
        app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
        async with app:
            await app.start()
            logger.info("Telegram bot started successfully.")
            await app.updater.start_polling()
            # Keep running until the thread is killed (daemon=True handles cleanup)
            await asyncio.Event().wait()

    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(_bot_runner())
    except Exception as error:
        logger.error("Telegram bot stopped with error: %s", error)


def _start_telegram_bot():
    thread = threading.Thread(target=_run_bot_in_thread, daemon=True, name="telegram-bot")
    thread.start()


@asynccontextmanager
async def lifespan(_: FastAPI):
    logger.info("Application startup...")
    
    # Initialize async database tables at startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Seed demo data if database is empty
    async with SessionLocal() as db:
        await seed_demo_data_if_empty(db)

    _start_telegram_bot()
    logger.info("Application startup complete")

    yield
    
    logger.info("Application shutting down...")


app = FastAPI(
    title=settings.app_title,
    version=settings.app_version,
    lifespan=lifespan,
)

# Initialize rate limiter only if enabled
if settings.rate_limit_enabled:
    limiter = Limiter(key_func=get_remote_address, default_limits=[settings.rate_limit_spec])
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, lambda request, exc: JSONResponse(
        status_code=429,
        content={"detail": f"Rate limit exceeded. Maximum {settings.rate_limit_max_requests} requests per {settings.rate_limit_window_seconds} seconds per IP."},
    ))
    app.add_middleware(SlowAPIMiddleware)
    logger.info(f"Rate limiting enabled: {settings.rate_limit_max_requests} requests per {settings.rate_limit_window_seconds} seconds")
else:
    # Dummy limiter object so routes don't fail
    class DummyLimiter:
        def hit(self, request):
            pass
    app.state.limiter = DummyLimiter()
    logger.info("Rate limiting disabled")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"^https?://localhost(:\d+)?$|^https?://127\.0\.0\.1(:\d+)?$|^chrome-extension://.*$|^moz-extension://.*$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scan.router, tags=["scan"])
app.include_router(history.router, tags=["history"])
app.include_router(stats.router, tags=["stats"])
app.include_router(telegram.router, tags=["telegram"])


@app.get("/health")
def health_check():
    return {"status": "ok"}