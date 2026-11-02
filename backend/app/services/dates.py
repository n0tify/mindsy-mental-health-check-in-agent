"""Small date helpers."""

from __future__ import annotations

from datetime import datetime, timezone


def utcnow() -> datetime:
    """Naive UTC now, matching how timestamps are stored."""
    return datetime.now(timezone.utc).replace(tzinfo=None)
