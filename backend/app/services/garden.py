"""Deterministic Living Garden derivation.

The garden is *derived* rather than stored: a check-in's UUID always maps to the
same species, variant, size and position, so refreshing the page can never
duplicate or reshuffle a plant.

``frontend/src/lib/garden.ts`` mirrors this algorithm exactly. Keep the two in
sync: the API result is what logged-in gardens render, and guest gardens are
derived in the browser from locally stored check-ins.
"""

from __future__ import annotations

from datetime import datetime

from ..constants import MOOD_PLANTS
from ..models import MoodEntry
from ..schemas.garden import GardenPlant
from .dates import utcnow

ROW_Y = (62.0, 72.0, 82.0)
ROW_SCALE = (0.86, 0.96, 1.06)
GROWTH_SCALE = {"seedling": 0.62, "growing": 0.82, "bloom": 1.0}


def fnv1a(value: str) -> int:
    """32-bit FNV-1a hash, identical to the TypeScript implementation."""
    digest = 0x811C9DC5
    for char in value:
        digest ^= ord(char)
        digest = (digest * 0x01000193) & 0xFFFFFFFF
    return digest


def plant_type_for(entry: MoodEntry) -> str:
    emotions = entry.emotions or []
    if len(set(emotions)) > 2:
        return MOOD_PLANTS["mixed"]
    return MOOD_PLANTS.get(entry.primary_mood, MOOD_PLANTS["mixed"])


def growth_for(entry: MoodEntry, now: datetime | None = None) -> str:
    now = now or utcnow()
    hours = max((now - entry.created_at).total_seconds() / 3600.0, 0.0)
    if hours < 24:
        return "seedling"
    if hours < 24 * 7:
        return "growing"
    return "bloom"


def build_plant(entry: MoodEntry, now: datetime | None = None) -> GardenPlant:
    digest = fnv1a(entry.id)
    row = (digest >> 8) % 3
    growth = growth_for(entry, now)
    jitter = ((digest >> 16) % 9) - 4  # -4 .. +4 percent of scale

    return GardenPlant(
        entry_id=entry.id,
        plant_type=plant_type_for(entry),
        variant=(digest >> 4) % 4,
        position_x=round(8 + (digest % 85), 2),
        position_y=round(ROW_Y[row] + ((digest >> 12) % 5), 2),
        scale=round(ROW_SCALE[row] * GROWTH_SCALE[growth] * (1 + jitter / 100), 3),
        growth=growth,
        z_index=row,
        created_at=entry.created_at,
        primary_mood=entry.primary_mood,
        emotions=entry.emotions or [],
        energy=entry.energy,
        tags=entry.tags or [],
        note=entry.note,
    )


def build_garden(entries: list[MoodEntry], now: datetime | None = None) -> list[GardenPlant]:
    now = now or utcnow()
    plants = [build_plant(entry, now) for entry in entries]
    plants.sort(key=lambda plant: (plant.z_index, plant.position_x))
    return plants
