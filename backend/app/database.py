"""Database engine, session factory and FastAPI dependency."""

from __future__ import annotations

from collections.abc import Iterator

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import settings


class Base(DeclarativeBase):
    """Declarative base shared by every model."""


def _engine_options(url: str) -> dict:
    if url.startswith("sqlite"):
        # SQLite needs check_same_thread=False when used from the threadpool.
        return {"connect_args": {"check_same_thread": False}}
    return {"pool_pre_ping": True}


engine = create_engine(
    settings.database_url, future=True, **_engine_options(settings.database_url)
)

SessionLocal = sessionmaker(
    bind=engine, autoflush=False, autocommit=False, expire_on_commit=False
)

_MOOD_SENTIMENT_COLUMNS = (
    "sentiment_positive",
    "sentiment_negative",
    "sentiment_neutral",
    "sentiment_compound",
)


def get_db() -> Iterator[Session]:
    """Yield a database session and always close it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def migrate_mood_entry_sentiment_columns(bind: Engine) -> None:
    """Idempotently add nullable VADER score columns to existing databases."""
    with bind.begin() as connection:
        inspector = inspect(connection)
        if not inspector.has_table("mood_entries"):
            return

        existing = {
            column["name"] for column in inspector.get_columns("mood_entries")
        }
        for column_name in _MOOD_SENTIMENT_COLUMNS:
            if column_name not in existing:
                connection.execute(
                    text(f"ALTER TABLE mood_entries ADD COLUMN {column_name} FLOAT")
                )
                existing.add(column_name)


def init_db() -> None:
    """Create missing tables and apply the additive check-in score migration.

    Deliberately dependency free (no Alembic) so the project can be started with
    a single command. This targeted migration only adds nullable columns and
    preserves existing check-in rows.
    """
    from . import models  # noqa: F401  (import registers the mappers)

    Base.metadata.create_all(bind=engine)
    migrate_mood_entry_sentiment_columns(engine)
