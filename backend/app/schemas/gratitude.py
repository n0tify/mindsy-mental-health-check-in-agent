from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_serializer, field_validator

from .common import iso_utc


class GratitudeCreate(BaseModel):
    text: str = Field(min_length=1, max_length=280)

    @field_validator("text")
    @classmethod
    def clean_text(cls, value: str) -> str:
        cleaned = " ".join(value.split())
        if not cleaned:
            raise ValueError("Write down one small good thing.")
        return cleaned


class GratitudeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    text: str
    created_at: datetime

    @field_serializer("created_at")
    def serialise_created_at(self, value: datetime) -> str:
        return iso_utc(value)
