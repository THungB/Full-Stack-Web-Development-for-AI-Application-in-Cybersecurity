"""
Configuration management using Pydantic Settings.

This module provides a centralized, validated configuration for the application,
automatically reading from environment variables and .env files.

Benefits:
- Single source of truth for all configuration
- Type validation on startup (catch config errors early)
- Clear defaults and documentation
- IDE autocomplete support
"""

from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent


class Settings(BaseSettings):
    """Application settings loaded from environment variables.
    
    Environment variables can be set via:
    1. .env file in the project root
    2. System environment variables
    3. Default values defined in this class
    """
    
    model_config = SettingsConfigDict(
        env_file=(BASE_DIR / ".env", BASE_DIR.parent / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        env_prefix="",
        extra="ignore",
    )
    
    # --- Database Configuration ---
    database_url: str = Field(
        default=f"sqlite+aiosqlite:///{BASE_DIR / 'spam_detection.db'}",
        description="Async database URL. Use sqlite+aiosqlite:// for SQLite with async support.",
    )
    
    @field_validator("database_url")
    @classmethod
    def upgrade_sqlite_to_async(cls, v: str) -> str:
        """Automatically upgrade sqlite:// to sqlite+aiosqlite:// for async support."""
        if v.startswith("sqlite:///") and "+aiosqlite" not in v:
            return v.replace("sqlite:///", "sqlite+aiosqlite:///", 1)
        return v
    
    # --- Seed Configuration ---
    app_seed_demo: bool = Field(
        default=True,
        description="Whether to seed demo data on startup if database is empty.",
    )
    
    @field_validator("app_seed_demo", mode="before")
    @classmethod
    def parse_bool_seed(cls, v):
        """Parse boolean from environment variable string."""
        if isinstance(v, bool):
            return v
        if isinstance(v, str):
            return v.strip().lower() not in {"0", "false", "no"}
        return v
    
    @field_validator("ai_label_enabled", mode="before")
    @classmethod
    def parse_bool_ai_label_enabled(cls, v):
        if isinstance(v, bool):
            return v
        if isinstance(v, str):
            return v.strip().lower() not in {"0", "false", "no"}
        return v
    
    # --- Telegram Bot Configuration ---
    telegram_bot_token: str | None = Field(
        default=None,
        description="Telegram bot token. If not set, Telegram integration is disabled.",
    )
    
    # --- OpenRouter AI Labeling ---
    openrouter_api_key: str | None = Field(
        default=None,
        description="OpenRouter API key for AI label generation.",
    )
    openrouter_model: str = Field(
        default="google/gemini-2.0-flash-lite-001",
        description="OpenRouter model ID to use for spam label generation.",
    )
    ai_label_enabled: bool = Field(
        default=True,
        description="Enable/disable AI label generation via OpenRouter.",
    )
    ai_label_min_confidence: float = Field(
        default=0.60,
        description="Minimum confidence threshold to trigger AI labeling.",
    )
    ai_label_timeout: float = Field(
        default=5.0,
        description="Timeout in seconds for OpenRouter API calls.",
    )
    
    # --- Rate Limiting Configuration ---
    rate_limit_max_requests: int = Field(
        default=5,
        description="Maximum number of requests per rate_limit_window_seconds.",
    )
    rate_limit_window_seconds: int = Field(
        default=60,
        description="Time window (in seconds) for rate limiting.",
    )
    
    @property
    def rate_limit_spec(self) -> str:
        """Return rate limit specification in the format expected by slowapi."""
        return f"{self.rate_limit_max_requests}/{self.rate_limit_window_seconds} second"
    
    # --- Cache Configuration ---
    cache_ttl_seconds: int = Field(
        default=120,
        description="Cache TTL (time-to-live) in seconds for /stats endpoint.",
    )
    
    # --- CORS Configuration ---
    cors_origins: list[str] = Field(
        default=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ],
        description="Allowed origins for CORS.",
    )
    
    # --- Application Metadata ---
    app_title: str = Field(
        default="Spam Detection API",
        description="API title for documentation.",
    )
    app_version: str = Field(
        default="1.0.0",
        description="API version.",
    )
# Global settings instance — use this throughout the application
settings = Settings()
