from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import MoodEntry, User
from ..schemas.mood import MoodEntryCreate, MoodEntryRead

router = APIRouter(prefix="/api", tags=["check-ins"])


def _owned_entry(db: Session, user: User, entry_id: str) -> MoodEntry:
    entry = db.scalar(
        select(MoodEntry).where(
            MoodEntry.id == entry_id, MoodEntry.user_id == user.id
        )
    )
    if entry is None:
        # Deliberately 404 rather than 403: never reveal that someone else's
        # record exists with this id.
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Check-in not found."
        )
    return entry


@router.get("/entries", response_model=list[MoodEntryRead])
def list_entries(
    limit: int = Query(default=200, ge=1, le=500),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[MoodEntryRead]:
    rows = db.scalars(
        select(MoodEntry)
        .where(MoodEntry.user_id == user.id)
        .order_by(MoodEntry.created_at.desc())
        .limit(limit)
    ).all()
    return [MoodEntryRead.model_validate(row) for row in rows]


@router.post("/entries", response_model=MoodEntryRead, status_code=status.HTTP_201_CREATED)
def create_entry(
    payload: MoodEntryCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MoodEntryRead:
    entry = MoodEntry(
        user_id=user.id,
        primary_mood=payload.primary_mood,
        emotions=payload.emotions,
        energy=payload.energy,
        note=payload.note,
        tags=payload.tags,
        # Guest check-ins carry the moment they were actually written, so
        # history survives the move into a new account.
        **({"created_at": payload.created_at} if payload.created_at else {}),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return MoodEntryRead.model_validate(entry)


@router.get("/entries/{entry_id}", response_model=MoodEntryRead)
def read_entry(
    entry_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MoodEntryRead:
    return MoodEntryRead.model_validate(_owned_entry(db, user, entry_id))


@router.delete(
    "/entries/{entry_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_model=None,
)
def delete_entry(
    entry_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    entry = _owned_entry(db, user, entry_id)
    db.delete(entry)
    db.commit()
