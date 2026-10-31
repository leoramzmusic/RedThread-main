"""Modelos, constantes y helpers compartidos por las APIs de notificaciones.

Esta capa NO contiene lógica de negocio; solo define los contratos de entrada/salida
y funciones de utilidad que consumen user.py, employee.py y manager.py.
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from bson import ObjectId
from fastapi import HTTPException, status
from pydantic import BaseModel, ConfigDict, Field

from src.models.profile import Profile
from src.models.user import User
from src.models.user_settings import UserSettings
from src.services import notification_service as ns

MAX_LIMIT = 50
DEFAULT_LIMIT = 20

SNOOZE_VALUES = ("15m", "30m", "1h", "2h", "4h", "8h", "1d", "always")
REMINDER_KEYS = ("care_preferences",)
REMINDER_SNOOZE_VALUES = tuple(v for v in SNOOZE_VALUES if v != "always")
MAX_BULK = 100
BULK_ACTIONS = ("archive", "unarchive", "delete", "restore", "read")
READ_ALL_FILTERS = ("all", "social", "messages", "system")


class SnoozeRequest(BaseModel):
    duration: str


class ReminderDismissRequest(BaseModel):
    duration: Optional[str] = None


class PauseRequest(BaseModel):
    duration: Optional[str] = None
    until: Optional[datetime] = None


class PauseScheduleRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    mode: str = "recurring"
    id: Optional[str] = None
    name: Optional[str] = None
    days: List[int] = Field(default_factory=list)
    start: Optional[str] = None
    end: Optional[str] = None
    from_: Optional[datetime] = Field(default=None, alias="from")
    to: Optional[datetime] = None
    timezone: Optional[str] = None
    utc_offset_minutes: Optional[int] = None
    allow: List[str] = Field(default_factory=list)
    enabled: bool = True


class BulkRequest(BaseModel):
    ids: List[str]
    action: str


class ReadBucketRequest(BaseModel):
    bucket: str


class SystemNotificationRequest(BaseModel):
    audience: Dict[str, Any]
    type: str = "system"
    content: str
    target_url: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


def _validate_notification_id(notification_id: str) -> None:
    if not ObjectId.is_valid(notification_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )


def _require_item(doc) -> None:
    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )


def encode_cursor(updated_at: datetime, doc_id: str) -> str:
    return f"{updated_at.isoformat()}|{doc_id}"


def decode_cursor(raw: str):
    iso, _, doc_id = raw.partition("|")
    return datetime.fromisoformat(iso), doc_id


def _pinned_first(docs: list):
    ordered = sorted(docs, key=lambda d: d.updated_at or datetime.min, reverse=True)
    ordered.sort(key=lambda d: d.pinned_at is not None, reverse=True)
    return ordered


def _bucket_types(bucket: str) -> List[str]:
    if bucket == "social":
        return ["like", "match"]
    if bucket == "system":
        return ["system", "survey", "promo"]
    raise ValueError(f"Unsupported bucket: {bucket}")


def _compose_counts(
    social: int, messages: int, system_docs: int, survey_pending: int
) -> dict:
    system = system_docs + (1 if survey_pending else 0)
    total = social + messages + system
    return {
        "count": total,
        "all": total,
        "social": social,
        "messages": messages,
        "system": system,
        "survey_pending": survey_pending,
    }


def _user_payload(profile) -> dict:
    if not profile:
        return {"name": "Usuario", "photo": None, "nickname": None}
    return {
        "name": profile.display_name,
        "photo": profile.photos[0] if profile.photos else None,
        "nickname": getattr(profile, "nickname", None),
    }


def _serialize_item(doc, profile) -> dict:
    data = ns.serialize_notification(doc)
    data["user"] = _user_payload(profile)
    return data


def _scoped_query(user_id: str, flt: str, mutes: dict, master: bool) -> dict:
    return {
        "$and": [
            ns.visible_filter(user_id),
            ns.visibility_query(user_id, flt, mutes, master),
        ]
    }


def _iso_utc(value: Optional[datetime]) -> Optional[str]:
    """Serialize a UTC datetime with an explicit offset so clients parse it right."""
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    else:
        value = value.astimezone(timezone.utc)
    return value.isoformat()


async def _notification_settings(user_id: str) -> Dict[str, Any]:
    """Mutes, pause state and scheduled DND routines of a user."""
    settings = await UserSettings.find_one({"user_id": user_id})
    mutes = getattr(settings, "notification_mutes", None) or {}
    master = getattr(settings, "notifications_enabled", True)
    routines = [
        dict(item)
        for item in (getattr(settings, "dnd_routines", None) or [])
    ]
    manual_until = getattr(settings, "manual_pause_until", None)
    force_until = getattr(settings, "force_notifications_until", None)
    now = datetime.utcnow()
    dnd_status = ns.resolve_dnd_status(settings, now)

    return {
        "mutes": mutes,
        "master": master,
        "dnd_active": dnd_status["dnd_active"],
        "dnd_source": dnd_status["dnd_source"],
        "routine_state": dnd_status["routine_state"],
        "selected_routine_id": dnd_status["selected_routine_id"],
        "effective_active_routine_id": dnd_status["effective_active_routine_id"],
        "active_routine_name": dnd_status["active_routine_name"],
        "window_end": dnd_status["window_end"],
        "next_start": dnd_status["next_start"],
        "manual_pause_until": manual_until,
        "force_notifications_until": force_until,
        "dnd_routines": routines,
        "paused_until": manual_until if dnd_status["dnd_source"] == "manual" else None,
        "paused_from": None,
        "pause_allow": [],
        "pause_schedule": routines,
        "pause_window": {"start": None, "end": None},
        "active_pauses": [],
        "pause_shortcut_id": None,
    }


async def _survey_pending(user_id: str) -> int:
    try:
        settings = await UserSettings.find_one({"user_id": user_id})
        if settings is not None:
            mutes = getattr(settings, "reminder_mutes", None) or []
            if "care_preferences" in mutes:
                return 0
            until = (getattr(settings, "reminder_snoozes", None) or {}).get(
                "care_preferences"
            )
            if until is not None and until > datetime.utcnow():
                return 0
    except Exception:
        pass

    try:
        from src.care.preferences.service import (
            CARE_DIMENSION_KEYS,
            list_user_preferences,
        )

        prefs = await list_user_preferences(user_id)
        known = set(CARE_DIMENSION_KEYS)
        completed = {getattr(p, "dimension", None) for p in prefs} & known
        return max(0, len(known) - len(completed))
    except Exception:
        return 0


async def _fan_out_system(
    audience: Dict[str, Any],
    content: str,
    notif_type: str,
    target_url: Optional[str],
    important: bool,
) -> int:
    if audience.get("all") is True:
        users = await User.find_all().to_list()
        user_ids = [str(u.id) for u in users]
    elif isinstance(audience.get("user_ids"), list):
        user_ids = [str(u) for u in audience["user_ids"]]
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid audience"
        )

    created = 0
    for chunk_start in range(0, len(user_ids), 500):
        for uid in user_ids[chunk_start : chunk_start + 500]:
            await ns.emit_system_notification(
                user_id=uid,
                content=content,
                notif_type=notif_type,
                target_url=target_url,
                important=important,
            )
            created += 1
    return created
