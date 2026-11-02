from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import JournalEntry, User
from ..schemas.journal import JournalCreate, JournalRead, JournalUpdate, clean_mood
from ..services.dates import utcnow

router = APIRouter(prefix="/api", tags=["journal"])


def _owned_entry(db: Session, user: User, entry_id: str) -> JournalEntry:
    entry = db.scalar(
        select(JournalEntry).where(
            JournalEntry.id == entry_id, JournalEntry.user_id == user.id
        )
    )
    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Journal entry not found."
        )
    return entry


@router.get("/journal", response_model=list[JournalRead])
def list_journal(
    q: str | None = Query(default=None, max_length=120),
    mood: str | None = Query(default=None, max_length=32),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[JournalRead]:
    statement = select(JournalEntry).where(JournalEntry.user_id == user.id)
    if q and q.strip():
        needle = f"%{q.strip()}%"
        statement = statement.where(
            or_(JournalEntry.title.ilike(needle), JournalEntry.body.ilike(needle))
        )
    if mood and mood.strip():
        statement = statement.where(JournalEntry.mood == mood.strip().lower())

    rows = db.scalars(statement.order_by(JournalEntry.created_at.desc())).all()
    return [JournalRead.model_validate(row) for row in rows]


@router.post("/journal", response_model=JournalRead, status_code=status.HTTP_201_CREATED)
def create_journal_entry(
    payload: JournalCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> JournalRead:
    entry = JournalEntry(
        user_id=user.id,
        title=payload.title,
        body=payload.body,
        mood=payload.mood,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return JournalRead.model_validate(entry)


@router.patch("/journal/{entry_id}", response_model=JournalRead)
def update_journal_entry(
    entry_id: str,
    payload: JournalUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> JournalRead:
    entry = _owned_entry(db, user, entry_id)

    if payload.title is not None:
        entry.title = " ".join(payload.title.split())
    if payload.body is not None:
        cleaned = payload.body.strip()
        if not cleaned:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Journal entry cannot be empty.",
            )
        entry.body = cleaned
    if "mood" in payload.model_fields_set:
        entry.mood = clean_mood(payload.mood)

    entry.updated_at = utcnow()
    db.commit()
    db.refresh(entry)
    return JournalRead.model_validate(entry)


@router.delete(
    "/journal/{entry_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_model=None,
)
def delete_journal_entry(
    entry_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    entry = _owned_entry(db, user, entry_id)
    db.delete(entry)
    db.commit()
