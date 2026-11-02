from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import MoodEntry, User
from ..schemas.garden import GardenResponse
from ..services.garden import build_garden

router = APIRouter(prefix="/api", tags=["garden"])


@router.get("/garden", response_model=GardenResponse)
def read_garden(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> GardenResponse:
    """Return one stable plant per check-in, oldest first.

    Plants are derived from the entry id, never created on read, so repeated
    requests return identical geometry.
    """
    entries = list(
        db.scalars(
            select(MoodEntry)
            .where(MoodEntry.user_id == user.id)
            .order_by(MoodEntry.created_at.asc())
        ).all()
    )
    plants = build_garden(entries)
    return GardenResponse(plants=plants, count=len(plants))
