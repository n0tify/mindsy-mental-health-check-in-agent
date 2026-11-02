from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import GratitudeNote, User
from ..schemas.gratitude import GratitudeCreate, GratitudeRead

router = APIRouter(prefix="/api", tags=["gratitude"])


@router.get("/gratitude", response_model=list[GratitudeRead])
def list_gratitude(
    limit: int = Query(default=60, ge=1, le=200),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[GratitudeRead]:
    rows = db.scalars(
        select(GratitudeNote)
        .where(GratitudeNote.user_id == user.id)
        .order_by(GratitudeNote.created_at.desc())
        .limit(limit)
    ).all()
    return [GratitudeRead.model_validate(row) for row in rows]


@router.post(
    "/gratitude", response_model=GratitudeRead, status_code=status.HTTP_201_CREATED
)
def create_gratitude(
    payload: GratitudeCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> GratitudeRead:
    note = GratitudeNote(user_id=user.id, text=payload.text)
    db.add(note)
    db.commit()
    db.refresh(note)
    return GratitudeRead.model_validate(note)


@router.delete(
    "/gratitude/{note_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_model=None,
)
def delete_gratitude(
    note_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    note = db.scalar(
        select(GratitudeNote).where(
            GratitudeNote.id == note_id, GratitudeNote.user_id == user.id
        )
    )
    if note is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Gratitude note not found."
        )
    db.delete(note)
    db.commit()
