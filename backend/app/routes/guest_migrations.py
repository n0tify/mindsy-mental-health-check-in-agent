from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import GratitudeNote, JournalEntry, MoodEntry, User
from ..schemas.guest_migration import GuestMigrationCreate, GuestMigrationRead
from ..services.sentiment import SentimentResult, analyze_sentiment

router = APIRouter(prefix="/api", tags=["guest migration"])
logger = logging.getLogger("mindsy.guest_migration")


def _naive_utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is not None:
        return value.astimezone(timezone.utc).replace(tzinfo=None)
    return value


def _migration_conflict() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="Guest data could not be transferred. Refresh and retry.",
    )


@router.post(
    "/guest-migrations",
    response_model=GuestMigrationRead,
    status_code=status.HTTP_201_CREATED,
)
def migrate_guest_data(
    payload: GuestMigrationCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> GuestMigrationRead:
    entry_ids = [record.id for record in payload.entries]
    journal_ids = [record.id for record in payload.journal]
    gratitude_ids = [record.id for record in payload.gratitude]

    existing_entries = (
        {
            row.id: row
            for row in db.scalars(
                select(MoodEntry).where(MoodEntry.id.in_(entry_ids))
            ).all()
        }
        if entry_ids
        else {}
    )
    existing_journal = (
        {
            row.id: row
            for row in db.scalars(
                select(JournalEntry).where(JournalEntry.id.in_(journal_ids))
            ).all()
        }
        if journal_ids
        else {}
    )
    existing_gratitude = (
        {
            row.id: row
            for row in db.scalars(
                select(GratitudeNote).where(GratitudeNote.id.in_(gratitude_ids))
            ).all()
        }
        if gratitude_ids
        else {}
    )

    added_entries = 0
    added_journal = 0
    added_gratitude = 0

    for record in payload.entries:
        existing = existing_entries.get(record.id)
        created_at = _naive_utc(record.created_at)
        if existing is not None:
            if (
                existing.user_id != user.id
                or existing.primary_mood != record.primary_mood
                or existing.emotions != record.emotions
                or existing.energy != record.energy
                or existing.note != record.note
                or existing.tags != record.tags
                or existing.created_at != created_at
            ):
                raise _migration_conflict()
            continue

        sentiment: SentimentResult | None = None
        if record.note:
            try:
                sentiment = analyze_sentiment(record.note)
            except Exception as exc:
                logger.warning(
                    "Local sentiment analysis unavailable during guest migration (%s).",
                    type(exc).__name__,
                )
                sentiment = None
        db.add(
            MoodEntry(
                id=record.id,
                user_id=user.id,
                created_at=created_at,
                primary_mood=record.primary_mood,
                emotions=record.emotions,
                energy=record.energy,
                note=record.note,
                sentiment_positive=sentiment.positive if sentiment else None,
                sentiment_negative=sentiment.negative if sentiment else None,
                sentiment_neutral=sentiment.neutral if sentiment else None,
                sentiment_compound=sentiment.compound if sentiment else None,
                tags=record.tags,
            )
        )
        added_entries += 1

    for record in payload.journal:
        existing = existing_journal.get(record.id)
        created_at = _naive_utc(record.created_at)
        if existing is not None:
            if (
                existing.user_id != user.id
                or existing.title != record.title
                or existing.body != record.body
                or existing.mood != record.mood
                or (created_at is not None and existing.created_at != created_at)
            ):
                raise _migration_conflict()
            continue

        now = datetime.now(timezone.utc).replace(tzinfo=None)
        db.add(
            JournalEntry(
                id=record.id,
                user_id=user.id,
                title=record.title,
                body=record.body,
                mood=record.mood,
                created_at=created_at or now,
                updated_at=_naive_utc(record.updated_at) or now,
            )
        )
        added_journal += 1

    for record in payload.gratitude:
        existing = existing_gratitude.get(record.id)
        created_at = _naive_utc(record.created_at)
        if existing is not None:
            if (
                existing.user_id != user.id
                or existing.text != record.text
                or (created_at is not None and existing.created_at != created_at)
            ):
                raise _migration_conflict()
            continue

        db.add(
            GratitudeNote(
                id=record.id,
                user_id=user.id,
                text=record.text,
                created_at=created_at
                or datetime.now(timezone.utc).replace(tzinfo=None),
            )
        )
        added_gratitude += 1

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise _migration_conflict() from None

    return GuestMigrationRead(
        entries=added_entries,
        journal=added_journal,
        gratitude=added_gratitude,
    )
