from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, field_serializer

from .common import iso_utc


class GardenPlant(BaseModel):
    """One derived plant plus the check-in details its overlay needs."""

    model_config = ConfigDict(from_attributes=True)

    entry_id: str
    plant_type: str
    variant: int
    position_x: float
    position_y: float
    scale: float
    growth: Literal["seedling", "growing", "bloom"]
    z_index: int
    created_at: datetime
    primary_mood: str
    emotions: list[str]
    energy: str
    tags: list[str]
    note: str | None

    @field_serializer("created_at")
    def serialise_created_at(self, value: datetime) -> str:
        return iso_utc(value)


class GardenResponse(BaseModel):
    plants: list[GardenPlant]
    count: int
