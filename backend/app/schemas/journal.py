from __future__ import annotations

from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_serializer,
    field_validator,
)

from ..constants import MOODS
from .common import iso_utc


def clean_mood(value: str | None) -> str | None:
    if value is None:
        return None
    mood = value.strip().lower()
    if not mood:
        return None
    if mood not in MOODS:
        raise ValueError(f"Unknown mood '{value}'.")
    return mood


class JournalCreate(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    body: str = Field(min_length=1, max_length=8000)
    mood: str | None = None

    @field_validator("title")
    @classmethod
    def clean_title(cls, value: str) -> str:
        cleaned = " ".join(value.split())
        if not cleaned:
            raise ValueError("Give your entry a title.")
        return cleaned

    @field_validator("body")
    @classmethod
    def clean_body(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Write a little something first.")
        return cleaned

    @field_validator("mood")
    @classmethod
    def validate_mood(cls, value: str | None) -> str | None:
        return clean_mood(value)


class JournalUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=120)
    body: str | None = Field(default=None, min_length=1, max_length=8000)
    mood: str | None = None


class JournalRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    body: str
    mood: str | None
    created_at: datetime
    updated_at: datetime

    @field_serializer("created_at", "updated_at")
    def serialise_timestamps(self, value: datetime) -> str:
        return iso_utc(value)
