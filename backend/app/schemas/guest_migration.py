from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field, model_validator

from .gratitude import GratitudeCreate
from .journal import JournalCreate
from .mood import MoodEntryCreate


class GuestMoodEntry(MoodEntryCreate):
    id: str = Field(min_length=1, max_length=36)
    created_at: datetime


class GuestJournalEntry(JournalCreate):
    id: str = Field(min_length=1, max_length=36)
    created_at: datetime | None = None
    updated_at: datetime | None = None


class GuestGratitudeNote(GratitudeCreate):
    id: str = Field(min_length=1, max_length=36)
    created_at: datetime | None = None


class GuestMigrationCreate(BaseModel):
    entries: list[GuestMoodEntry] = Field(default_factory=list, max_length=250)
    journal: list[GuestJournalEntry] = Field(default_factory=list, max_length=250)
    gratitude: list[GuestGratitudeNote] = Field(default_factory=list, max_length=250)

    @model_validator(mode="after")
    def unique_record_ids(self) -> GuestMigrationCreate:
        for records in (self.entries, self.journal, self.gratitude):
            ids = [record.id for record in records]
            if len(ids) != len(set(ids)):
                raise ValueError("Guest records must have unique identifiers.")
        return self


class GuestMigrationRead(BaseModel):
    entries: int
    journal: int
    gratitude: int
