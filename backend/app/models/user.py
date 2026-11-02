from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base

if TYPE_CHECKING:  # pragma: no cover - typing only
    from .gratitude import GratitudeNote
    from .journal import JournalEntry
    from .mood import MoodEntry


def utcnow() -> datetime:
    """Naive UTC timestamp.

    SQLite drops timezone information, so the whole project stores naive UTC
    and converts to explicit UTC when serialising.
    """
    return datetime.now(timezone.utc).replace(tzinfo=None)


def new_id() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    email: Mapped[str] = mapped_column(
        String(255), nullable=False, unique=True, index=True
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=utcnow
    )

    mood_entries: Mapped[list[MoodEntry]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    journal_entries: Mapped[list[JournalEntry]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    gratitude_notes: Mapped[list[GratitudeNote]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
