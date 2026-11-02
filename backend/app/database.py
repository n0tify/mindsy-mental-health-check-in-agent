"""Database engine, session factory and FastAPI dependency."""

from __future__ import annotations

from collections.abc import Iterator

from sqlalchemy import create_engine
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


def get_db() -> Iterator[Session]:
    """Yield a database session and always close it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create tables that do not exist yet.

    Deliberately dependency free (no Alembic) so the project can be started with
    a single command. Swap in Alembic migrations for a long lived deployment.
    """
    from . import models  # noqa: F401  (import registers the mappers)

    Base.metadata.create_all(bind=engine)
