"""Presence helpers: derive a connection status from ``User.last_seen``.

Timestamps are naive UTC (``datetime.utcnow()``), matching the rest of the
codebase. Statuses:
    online        < 1 min
    active_recent < 5 min
    away          < 15 min
    idle          < 30 min
    offline       >= 30 min (or unknown)
"""

from datetime import datetime
from typing import Optional, Tuple

from src.models.user import User

CONNECTION_STATUSES = ("online", "active_recent", "away", "idle", "offline")


def compute_connection_status(last_seen: Optional[datetime]) -> str:
    """Derive connection status from a last_seen timestamp (naive UTC)."""
    if last_seen is None:
        return "offline"

    minutes = (datetime.utcnow() - last_seen).total_seconds() / 60.0

    # Negative means clock skew in the future - treat as online
    if minutes < 1:
        return "online"
    if minutes < 5:
        return "active_recent"
    if minutes < 15:
        return "away"
    if minutes < 30:
        return "idle"
    return "offline"


def presence_for_user(user: Optional[User]) -> Tuple[Optional[datetime], str]:
    """Return ``(last_seen, connection_status)`` for a user.

    Respects the ``show_online_status`` privacy flag: users who hide their
    online status always expose ``last_seen=None`` / ``offline``.
    """
    if user is None or not user.show_online_status:
        return None, "offline"
    return user.last_seen, compute_connection_status(user.last_seen)
