from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_serializer, field_validator

from ..constants import MOODS, TAGS
from .common import iso_utc


class MoodEntryCreate(BaseModel):
    primary_mood: str
    emotions: list[str] = Field(min_length=1, max_length=8)
    energy: Literal["low", "medium", "high"]
    note: str | None = Field(default=None, max_length=4000)
    tags: list[str] = Field(default_factory=list, max_length=8)
    # Optional so guest check-ins keep their original date when they are moved
    # into an account. Bounded so it cannot be used to backdate the distant past.
    created_at: datetime | None = None

    @field_validator("primary_mood")
    @classmethod
    def known_primary_mood(cls, value: str) -> str:
        mood = value.strip().lower()
        if mood not in MOODS:
            raise ValueError(f"Unknown mood '{value}'.")
        return mood

    @field_validator("emotions")
    @classmethod
    def known_emotions(cls, values: list[str]) -> list[str]:
        cleaned: list[str] = []
        for value in values:
            mood = value.strip().lower()
            if mood not in MOODS:
                raise ValueError(f"Unknown emotion '{value}'.")
            if mood not in cleaned:
                cleaned.append(mood)
        if not cleaned:
            raise ValueError("Select at least one feeling.")
        return cleaned

    @field_validator("tags")
    @classmethod
    def known_tags(cls, values: list[str]) -> list[str]:
        cleaned: list[str] = []
        for value in values:
            tag = value.strip().lower()
            if tag not in TAGS:
                raise ValueError(f"Unknown tag '{value}'.")
            if tag not in cleaned:
                cleaned.append(tag)
        return cleaned

    @field_validator("note")
    @classmethod
    def clean_note(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None

    @field_validator("created_at")
    @classmethod
    def bounded_created_at(cls, value: datetime | None) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is not None:
            value = value.astimezone(timezone.utc).replace(tzinfo=None)
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        if value > now + timedelta(minutes=5):
            raise ValueError("Check-ins cannot be in the future.")
        if value < now - timedelta(days=400):
            raise ValueError("Check-ins can be at most a year old.")
        return value


class MoodEntryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    primary_mood: str
    emotions: list[str]
    energy: str
    note: str | None
    sentiment_positive: float | None = None
    sentiment_negative: float | None = None
    sentiment_neutral: float | None = None
    sentiment_compound: float | None = None
    tags: list[str]

    @field_serializer("created_at")
    def serialise_created_at(self, value: datetime) -> str:
        return iso_utc(value)
