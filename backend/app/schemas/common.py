from __future__ import annotations

from datetime import datetime, timezone


def iso_utc(value: datetime) -> str:
    """Serialise a stored naive UTC datetime as an explicit UTC ISO string.

    Without the explicit offset a browser would read the value as local time,
    which would shift every date by the viewer's timezone.
    """
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    else:
        value = value.astimezone(timezone.utc)
    return value.isoformat().replace("+00:00", "Z")
