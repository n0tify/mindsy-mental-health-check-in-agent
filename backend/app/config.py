"""Runtime configuration for the Mindsy API.

Everything is read from environment variables so the same code runs against
SQLite in development and PostgreSQL in production without edits.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field

from dotenv import load_dotenv

load_dotenv()

DEFAULT_DATABASE_URL = "sqlite:///./mindsy.db"
DEFAULT_CORS_ORIGINS = "http://localhost:3000,http://127.0.0.1:3000"
DEFAULT_JWT_SECRET = "dev-only-secret-change-me"


def _int_env(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None or not raw.strip():
        return default
    try:
        return int(raw)
    except ValueError:
        return default


@dataclass(frozen=True)
class Settings:
    app_name: str = "Mindsy API"
    app_env: str = field(
        default_factory=lambda: os.getenv("APP_ENV", "development").strip().lower()
    )
    database_url: str = field(
        default_factory=lambda: os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)
    )
    jwt_secret: str = field(
        default_factory=lambda: os.getenv("JWT_SECRET", DEFAULT_JWT_SECRET)
    )
    jwt_algorithm: str = "HS256"
    access_token_days: int = field(
        default_factory=lambda: _int_env("ACCESS_TOKEN_DAYS", 7)
    )
    cors_origins: list[str] = field(
        default_factory=lambda: [
            origin.strip()
            for origin in os.getenv("CORS_ORIGINS", DEFAULT_CORS_ORIGINS).split(",")
            if origin.strip()
        ]
    )

    @property
    def uses_default_secret(self) -> bool:
        return self.jwt_secret == DEFAULT_JWT_SECRET

    def validate(self) -> None:
        if self.app_env == "production" and (
            self.uses_default_secret
            or len(self.jwt_secret) < 32
            or self.jwt_secret.lower().startswith("replace-with-")
        ):
            raise RuntimeError(
                "Production requires a JWT_SECRET of at least 32 characters."
            )


settings = Settings()
