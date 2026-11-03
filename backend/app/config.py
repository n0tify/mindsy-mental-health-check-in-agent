"""Runtime configuration for the Mindsy API.

Everything is read from environment variables so the same code runs against
SQLite in development and PostgreSQL in production without edits.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from urllib.parse import urlsplit

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


def _bool_env(name: str, default: bool = False) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    app_name: str = "Mindsy API"
    app_env: str = field(
        default_factory=lambda: os.getenv("APP_ENV", "production").strip().lower()
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
    azure_openai_enabled: bool = field(
        default_factory=lambda: _bool_env("AZURE_OPENAI_ENABLED")
    )
    azure_openai_endpoint: str = field(
        default_factory=lambda: os.getenv("AZURE_OPENAI_ENDPOINT", "").strip()
    )
    azure_openai_api_key: str = field(
        default_factory=lambda: os.getenv("AZURE_OPENAI_API_KEY", "").strip()
    )
    azure_openai_deployment: str = field(
        default_factory=lambda: os.getenv("AZURE_OPENAI_DEPLOYMENT", "").strip()
    )
    azure_openai_api_version: str = field(
        default_factory=lambda: os.getenv("AZURE_OPENAI_API_VERSION", "").strip()
    )

    @property
    def uses_default_secret(self) -> bool:
        return self.jwt_secret == DEFAULT_JWT_SECRET

    @property
    def azure_openai_configured(self) -> bool:
        return all(
            (
                self.azure_openai_endpoint,
                self.azure_openai_api_key,
                self.azure_openai_deployment,
                self.azure_openai_api_version,
            )
        )

    def validate(self) -> None:
        if self.app_env not in {"development", "test", "staging", "production"}:
            raise RuntimeError(
                "APP_ENV must be development, test, staging, or production."
            )
        if self.app_env != "development" and (
            self.uses_default_secret
            or len(self.jwt_secret) < 32
            or self.jwt_secret.lower().startswith("replace-with-")
        ):
            raise RuntimeError(
                "Non-development environments require a unique JWT_SECRET of at least 32 characters."
            )
        if self.app_env in {"production", "staging"} and not self.database_url.startswith(
            "postgresql+psycopg://"
        ):
            raise RuntimeError(
                "Production and staging require DATABASE_URL using the postgresql+psycopg:// driver."
            )
        if self.app_env in {"production", "staging"}:
            if not self.cors_origins or "*" in self.cors_origins:
                raise RuntimeError(
                    "Production and staging require explicit CORS_ORIGINS without a wildcard."
                )
            for origin in self.cors_origins:
                try:
                    parsed_origin = urlsplit(origin)
                    _ = parsed_origin.port
                except ValueError:
                    raise RuntimeError(
                        "Production and staging CORS_ORIGINS must be exact public HTTPS origins."
                    ) from None
                hostname = (parsed_origin.hostname or "").lower()
                if (
                    parsed_origin.scheme != "https"
                    or not parsed_origin.netloc
                    or parsed_origin.path
                    or parsed_origin.query
                    or parsed_origin.fragment
                    or parsed_origin.username
                    or parsed_origin.password
                    or hostname == "localhost"
                    or hostname.endswith(".localhost")
                    or hostname == "::1"
                    or hostname == "0.0.0.0"
                    or hostname.startswith("127.")
                ):
                    raise RuntimeError(
                        "Production and staging CORS_ORIGINS must be exact public HTTPS origins."
                    )


settings = Settings()
