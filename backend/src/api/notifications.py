from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field

from src.api.auth import get_current_user
from src.core.middleware.employee_rbac import require_employee_permission
from src.models.admin_rbac import Permission
from src.models.notification import Notification
from src.models.profile import Profile
from src.models.user import User
from src.models.user_settings import UserSettings
from src.services import notification_service as ns
from src.services.connection_manager import manager

router = APIRouter()

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
    model_config = ConfigDict(populate_by_name=True)

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


class BulkRequest(BaseModel):
    ids: List[str]
    action: str


def _scoped_query(user_id: str, flt: str, mutes: dict, master: bool) -> dict:
    return {
        "$and": [
            ns.visible_filter(user_id),
            ns.visibility_query(user_id, flt, mutes, master),
        ]
    }


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


def decode_cursor(raw: str) -> tuple[datetime, str]:
    iso, _, doc_id = raw.partition("|")
    return datetime.fromisoformat(iso), doc_id


def _pinned_first(docs: list) -> list:
    ordered = sorted(docs, key=lambda d: d.updated_at or datetime.min, reverse=True)
    ordered.sort(key=lambda d: d.pinned_at is not None, reverse=True)
    return ordered


async def _notification_settings(user_id: str) -> Dict[str, Any]:
    """Mutes, pause state and scheduled rules of a user."""
    settings = await UserSettings.find_one({"user_id": user_id})
    mutes = getattr(settings, "notification_mutes", None) or {}
    master = getattr(settings, "notifications_enabled", True)
    schedule = [
        dict(item)
        for item in (getattr(settings, "notification_pause_schedule", None) or [])
    ]
    allow = list(getattr(settings, "notifications_pause_allow", None) or [])
    window = ns.effective_pause_window(settings)
    raw_from = getattr(settings, "notifications_paused_from", None)
    raw_until = getattr(settings, "notifications_paused_until", None)
    pauses = ns.active_pauses(settings)
    if settings is not None and ns.remember_active_pause(settings, pauses):
        await settings.save()
    return {
        "mutes": mutes,
        "master": master,
        "paused_until": window["end"] if window else None,
        "paused_from": window["start"] if window else None,
        "pause_allow": allow,
        "pause_schedule": schedule,
        "pause_window": {
            "start": _iso_utc(raw_from) if raw_from else None,
            "end": _iso_utc(raw_until) if raw_until else None,
        },
        "active_pauses": _serialize_active_pauses(pauses),
        "pause_shortcut_id": getattr(
            settings, "notification_pause_last_used_id", None
        ),
    }


def _serialize_active_pauses(pauses: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    serialized: List[Dict[str, Any]] = []
    for pause in pauses or []:
        item = dict(pause)
        if item.get("window_start") is not None:
            item["window_start"] = _iso_utc(item["window_start"])
        if item.get("window_end") is not None:
            item["window_end"] = _iso_utc(item["window_end"])
        if item.get("start") is not None and not isinstance(item["start"], str):
            item["start"] = _iso_utc(item["start"])
        if item.get("end") is not None and not isinstance(item["end"], str):
            item["end"] = _iso_utc(item["end"])
        serialized.append(item)
    return serialized


async def _backfill_updated_at(user_id: str, limit: int = 500) -> int:
    docs = (
        await Notification.find(
            {"user_id": user_id, "updated_at": {"$exists": False}}
        )
        .limit(limit)
        .to_list()
    )
    for doc in docs:
        doc.updated_at = doc.created_at or datetime.utcnow()
        await doc.save()
    return len(docs)


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


async def _pause_summary(
    user_id: str, start: datetime, end: datetime
) -> Dict[str, Any]:
    """Grouped counts of notifications received inside a pause window."""
    base = ns.visible_filter(user_id)
    base["created_at"] = {"$gte": start, "$lte": end}
    social = await Notification.find(
        {**base, "type": {"$in": _bucket_types("social")}}
    ).count()
    messages = await Notification.find(
        {**base, "type": {"$in": ["message"]}}
    ).count()
    system = await Notification.find(
        {**base, "type": {"$in": _bucket_types("system")}}
    ).count()
    return {
        "from": _iso_utc(start),
        "to": _iso_utc(end),
        "messages": messages,
        "social": social,
        "system": system,
        "total": messages + social + system,
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


@router.get("")
async def get_notifications(
    filter: str = "all",
    cursor: Optional[str] = None,
    limit: int = DEFAULT_LIMIT,
    unread: bool = False,
    current_user: User = Depends(get_current_user),
):
    """Paginated notification inbox with bucket filters and cursor."""
    limit = max(1, min(limit, MAX_LIMIT))
    uid = str(current_user.id)

    if cursor is None:  # Retención lazy solo en la primera página
        await _backfill_updated_at(uid)
        cutoff = datetime.utcnow() - timedelta(days=ns.RETENTION_DAYS)
        await Notification.find(
            {"user_id": uid, "updated_at": {"$lt": cutoff}}
        ).delete()

    context = await _notification_settings(uid)
    mutes, master = context["mutes"], context["master"]
    if filter == "archived":
        query = ns.visible_filter(uid, archived_only=True)
    elif filter == "trash":
        query = {"user_id": uid, "deleted_at": {"$ne": None}}
    else:
        query = _scoped_query(uid, filter, mutes, master)
    if unread:
        query["is_read"] = False

    if cursor:
        cur_dt, cur_id = decode_cursor(cursor)
        query.setdefault("$and", []).append(
            {
                "$or": [
                    {"updated_at": {"$lt": cur_dt}},
                    {"updated_at": cur_dt, "_id": {"$lt": ObjectId(cur_id)}},
                ]
            }
        )

    docs = (
        await Notification.find(query)
        .sort("-updated_at", "-_id")
        .limit(limit + 1)
        .to_list()
    )
    has_more = len(docs) > limit
    docs = docs[:limit]

    next_cursor = None
    if has_more and docs:
        last = docs[-1]
        next_cursor = encode_cursor(last.updated_at, str(last.id))

    docs = _pinned_first(docs)
    related_ids = list({d.related_user_id for d in docs if d.related_user_id})
    profiles = (
        await Profile.find({"user_id": {"$in": related_ids}}).to_list()
        if related_ids
        else []
    )
    by_user = {p.user_id: p for p in profiles}

    items = [_serialize_item(doc, by_user.get(doc.related_user_id)) for doc in docs]

    return {"items": items, "next_cursor": next_cursor}


@router.get("/unread-count")
async def get_unread_count(current_user: User = Depends(get_current_user)):
    """Unread counts per bucket (visibility-aware)."""
    uid = str(current_user.id)
    context = await _notification_settings(uid)
    mutes, master = context["mutes"], context["master"]
    base = _scoped_query(uid, "all", mutes, master)
    base["is_read"] = False

    social = await Notification.find(
        {**base, "type": {"$in": _bucket_types("social")}}
    ).count()
    messages = await Notification.find(
        {**base, "type": {"$in": ["message"]}}
    ).count()
    system_docs = await Notification.find(
        {**base, "type": {"$in": _bucket_types("system")}}
    ).count()
    survey_pending = await _survey_pending(uid)

    return {
        **_compose_counts(
            social=social,
            messages=messages,
            system_docs=system_docs,
            survey_pending=survey_pending,
        ),
        "paused_until": _iso_utc(context["paused_until"]),
        "paused_from": _iso_utc(context["paused_from"]),
        "pause_allow": context["pause_allow"],
        "pause_schedule": context["pause_schedule"],
        "pause_window": context["pause_window"],
        "active_pauses": context["active_pauses"],
        "pause_shortcut_id": context["pause_shortcut_id"],
    }


def _as_utc_naive(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value
    return value.astimezone(timezone.utc).replace(tzinfo=None)


def _iso_utc(value: Optional[datetime]) -> Optional[str]:
    """Serialize a UTC datetime with an explicit offset so clients parse it right."""
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    else:
        value = value.astimezone(timezone.utc)
    return value.isoformat()


async def _pause_state(user_id: str) -> Dict[str, Any]:
    context = await _notification_settings(user_id)
    return {
        "paused_until": _iso_utc(context["paused_until"]),
        "paused_from": _iso_utc(context["paused_from"]),
        "pause_allow": context["pause_allow"],
        "pause_schedule": context["pause_schedule"],
        "pause_window": context["pause_window"],
        "active_pauses": context["active_pauses"],
        "pause_shortcut_id": context["pause_shortcut_id"],
    }


@router.get("/pause/summary")
async def pause_summary_route(current_user: User = Depends(get_current_user)):
    """Consume the grouped summary of a pause that has already ended."""
    uid = str(current_user.id)
    settings = await UserSettings.find_one({"user_id": uid})
    if settings is None or not getattr(
        settings, "notification_pause_summary_pending", False
    ):
        return {"summary": None}

    start = getattr(settings, "notification_pause_summary_from", None)
    end = getattr(settings, "notification_pause_summary_until", None)
    if start is None or end is None or end > datetime.utcnow():
        return {"summary": None}

    summary = await _pause_summary(uid, start, end)
    settings.notification_pause_summary_pending = False
    settings.notification_pause_summary_from = None
    settings.notification_pause_summary_until = None
    await settings.save()
    return {"summary": summary if summary["total"] else None}


@router.post("/pause")
async def pause_notifications_route(
    payload: PauseRequest, current_user: User = Depends(get_current_user)
):
    """Pause push notifications until a preset or explicit time."""
    if payload.until is not None:
        until = _as_utc_naive(payload.until)
    elif payload.duration in ns.SNOOZE_DURATIONS:
        until = datetime.utcnow() + ns.SNOOZE_DURATIONS[payload.duration]
    else:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid pause duration",
        )
    if until <= datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Pause must end in the future",
        )
    await ns.pause_notifications(str(current_user.id), until)
    return await _pause_state(str(current_user.id))


@router.delete("/pause")
async def resume_notifications_route(
    current_user: User = Depends(get_current_user),
):
    """Resume push notifications immediately and return the grouped summary."""
    uid = str(current_user.id)
    context = await _notification_settings(uid)
    start = context.get("paused_from")
    summary = None
    if start is not None:
        summary = await _pause_summary(uid, start, datetime.utcnow())
        settings = await UserSettings.find_one({"user_id": uid})
        if settings is not None:
            settings.notification_pause_summary_pending = False
            settings.notification_pause_summary_from = None
            settings.notification_pause_summary_until = None
            await settings.save()
    await ns.resume_notifications(uid)
    state = await _pause_state(uid)
    return {**state, "summary": summary if summary and summary["total"] else None}


@router.post("/pause/schedule")
async def create_pause_schedule_route(
    payload: PauseScheduleRequest, current_user: User = Depends(get_current_user)
):
    """Configure the silence plan: a one-off window or a recurring rule."""
    uid = str(current_user.id)
    try:
        if payload.mode == "single":
            if payload.from_ is None or payload.to is None:
                raise ValueError("Invalid pause window")
            start = _as_utc_naive(payload.from_)
            end = _as_utc_naive(payload.to)
            if end <= start:
                raise ValueError("Invalid pause window")
            await ns.set_pause_window(uid, start, end, payload.allow)
        else:
            if not payload.start or not payload.end:
                raise ValueError("Invalid pause time")
            rule = ns.normalize_pause_rule(
                payload.days,
                payload.start,
                payload.end,
                payload.timezone,
                payload.utc_offset_minutes,
                payload.name,
                payload.allow,
                payload.id,
            )
            await ns.upsert_pause_schedule(uid, rule)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )
    return await _pause_state(uid)


@router.delete("/pause/schedule/{rule_id}")
async def delete_pause_schedule_route(
    rule_id: str, current_user: User = Depends(get_current_user)
):
    """Remove a scheduled pause by id."""
    uid = str(current_user.id)
    await ns.remove_pause_schedule(uid, rule_id)
    return await _pause_state(uid)


@router.post("/pause/schedule/{rule_id}/apply")
async def apply_pause_schedule_route(
    rule_id: str, current_user: User = Depends(get_current_user)
):
    """Apply a saved routine now, until its current or next window ends."""
    uid = str(current_user.id)
    settings = await UserSettings.find_one({"user_id": uid})
    schedule = getattr(settings, "notification_pause_schedule", None) or []
    rule = next((item for item in schedule if item.get("id") == rule_id), None)
    if rule is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pause schedule not found",
        )
    end = ns.next_pause_rule_end(rule)
    if end is None or end <= datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Pause schedule has no upcoming window",
        )
    settings.notification_pause_last_used_id = rule_id
    await settings.save()
    await ns.pause_notifications(uid, end)
    return await _pause_state(uid)


class ReadBucketRequest(BaseModel):
    bucket: str


@router.post("/read-bucket")
async def read_bucket(
    payload: ReadBucketRequest, current_user: User = Depends(get_current_user)
):
    """Mark every unread notification in a bucket as read."""
    try:
        types = _bucket_types(payload.bucket)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="bucket must be social or system",
        )

    uid = str(current_user.id)
    result = await Notification.find(
        {"user_id": uid, "type": {"$in": types}, "is_read": False}
    ).update({"$set": {"is_read": True}})
    await manager.send_personal_message(
        uid, {"action": "notifications_bucket_read", "bucket": payload.bucket}
    )
    return {"updated": result.modified_count if result else 0}


@router.post("/read-all")
async def mark_all_as_read(
    filter: str = "all", current_user: User = Depends(get_current_user)
):
    """Mark notifications as read, optionally scoped to a bucket."""
    if filter not in READ_ALL_FILTERS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid filter",
        )
    uid = str(current_user.id)
    if filter == "all":
        query = {"user_id": uid, "is_read": False}
    else:
        context = await _notification_settings(uid)
        mutes, master = context["mutes"], context["master"]
        query = _scoped_query(uid, filter, mutes, master)
        query["is_read"] = False
    result = await Notification.find(query).update({"$set": {"is_read": True}})
    updated = result.modified_count if result else 0
    await manager.send_personal_message(uid, {"action": "notifications_read_all"})
    return {"updated": updated}


@router.post("/bulk")
async def bulk_action(
    payload: BulkRequest, current_user: User = Depends(get_current_user)
):
    """Apply an action to several owned notifications at once."""
    if payload.action not in BULK_ACTIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid action",
        )
    oids = [ObjectId(nid) for nid in payload.ids if ObjectId.is_valid(nid)]
    oids = oids[:MAX_BULK]
    if not oids:
        return {"updated": 0}

    uid = str(current_user.id)
    now = datetime.utcnow()
    query: Dict[str, Any] = {"_id": {"$in": oids}, "user_id": uid}
    if payload.action == "archive":
        query["deleted_at"] = None
        changes = {"archived_at": now}
    elif payload.action == "unarchive":
        changes = {"archived_at": None}
    elif payload.action == "delete":
        query["deleted_at"] = None
        changes = {"deleted_at": now}
    elif payload.action == "read":
        query["deleted_at"] = None
        changes = {"is_read": True}
    else:
        query["deleted_at"] = {"$ne": None}
        changes = {"deleted_at": None}

    result = await Notification.find(query).update({"$set": changes})
    updated = result.modified_count if result else 0
    await manager.send_personal_message(uid, {"action": "notifications_sync"})
    return {"updated": updated}


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


class SystemNotificationRequest(BaseModel):
    audience: Dict[str, Any]
    type: str = "system"
    content: str
    target_url: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


@router.post("/system")
async def post_system_notification(
    payload: SystemNotificationRequest,
    employee=Depends(require_employee_permission(Permission.EDIT_USERS)),
):
    return {
        "created": await _fan_out_system(
            payload.audience,
            payload.content,
            payload.type,
            payload.target_url,
            bool((payload.metadata or {}).get("important")),
        )
    }


async def _reminder_settings(user_id: str) -> UserSettings:
    settings = await UserSettings.find_one({"user_id": user_id})
    if settings is None:
        settings = UserSettings(user_id=user_id)
        await settings.insert()
    return settings


def _validate_reminder_key(reminder_key: str) -> None:
    if reminder_key not in REMINDER_KEYS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found",
        )


@router.post("/reminders/{reminder_key}/dismiss")
async def dismiss_reminder_route(
    reminder_key: str,
    payload: ReminderDismissRequest,
    current_user: User = Depends(get_current_user),
):
    """Hide a reminder for a duration or until the user re-enables it."""
    _validate_reminder_key(reminder_key)
    if (
        payload.duration is not None
        and payload.duration not in REMINDER_SNOOZE_VALUES
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid duration",
        )

    user_id = str(current_user.id)
    settings = await _reminder_settings(user_id)
    mutes = [key for key in (settings.reminder_mutes or []) if key != reminder_key]
    snoozes = dict(settings.reminder_snoozes or {})
    snoozes.pop(reminder_key, None)

    if payload.duration is None:
        mutes.append(reminder_key)
    else:
        snoozes[reminder_key] = (
            datetime.utcnow() + ns.SNOOZE_DURATIONS[payload.duration]
        )

    settings.reminder_mutes = mutes
    settings.reminder_snoozes = snoozes
    settings.updated_at = datetime.utcnow()
    await settings.save()
    await manager.send_personal_message(
        user_id,
        {
            "action": "reminder_dismissed",
            "key": reminder_key,
            "forever": payload.duration is None,
        },
    )
    await manager.send_personal_message(user_id, {"action": "notifications_sync"})
    return {"ok": True}


@router.delete("/reminders/{reminder_key}")
async def restore_reminder_route(
    reminder_key: str, current_user: User = Depends(get_current_user)
):
    """Undo a reminder dismissal or snooze."""
    _validate_reminder_key(reminder_key)
    user_id = str(current_user.id)
    settings = await _reminder_settings(user_id)
    settings.reminder_mutes = [
        key for key in (settings.reminder_mutes or []) if key != reminder_key
    ]
    snoozes = dict(settings.reminder_snoozes or {})
    snoozes.pop(reminder_key, None)
    settings.reminder_snoozes = snoozes
    settings.updated_at = datetime.utcnow()
    await settings.save()
    await manager.send_personal_message(
        user_id, {"action": "reminder_restored", "key": reminder_key}
    )
    await manager.send_personal_message(user_id, {"action": "notifications_sync"})
    return {"ok": True}


@router.post("/{notification_id}/pin")
async def pin_notification_route(
    notification_id: str, current_user: User = Depends(get_current_user)
):
    """Pin a notification to the top of the inbox."""
    _validate_notification_id(notification_id)
    doc = await ns.set_pinned(notification_id, str(current_user.id), True)
    _require_item(doc)
    return {"ok": True}


@router.post("/{notification_id}/unpin")
async def unpin_notification_route(
    notification_id: str, current_user: User = Depends(get_current_user)
):
    """Remove a notification pin."""
    _validate_notification_id(notification_id)
    doc = await ns.set_pinned(notification_id, str(current_user.id), False)
    _require_item(doc)
    return {"ok": True}


@router.post("/{notification_id}/archive")
async def archive_notification(
    notification_id: str, current_user: User = Depends(get_current_user)
):
    """Archive a notification for the current user."""
    _validate_notification_id(notification_id)
    doc = await ns.set_archived(notification_id, str(current_user.id), True)
    _require_item(doc)
    return {"ok": True}


@router.post("/{notification_id}/unarchive")
async def unarchive_notification(
    notification_id: str, current_user: User = Depends(get_current_user)
):
    """Remove a notification from the archive."""
    _validate_notification_id(notification_id)
    doc = await ns.set_archived(notification_id, str(current_user.id), False)
    _require_item(doc)
    return {"ok": True}


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str, current_user: User = Depends(get_current_user)
):
    """Soft-delete a notification for the current user."""
    _validate_notification_id(notification_id)
    doc = await ns.set_deleted(notification_id, str(current_user.id))
    _require_item(doc)
    return {"ok": True}


@router.post("/{notification_id}/restore")
async def restore_notification(
    notification_id: str, current_user: User = Depends(get_current_user)
):
    """Restore a soft-deleted notification."""
    _validate_notification_id(notification_id)
    doc = await ns.restore_notification(notification_id, str(current_user.id))
    _require_item(doc)
    return {"ok": True}


@router.post("/{notification_id}/snooze")
async def snooze_notification_route(
    notification_id: str,
    payload: SnoozeRequest,
    current_user: User = Depends(get_current_user),
):
    """Snooze a notification for a preset duration."""
    _validate_notification_id(notification_id)
    if payload.duration not in SNOOZE_VALUES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid duration",
        )
    doc = await ns.snooze_notification(
        notification_id, str(current_user.id), payload.duration
    )
    _require_item(doc)
    return {
        "snoozed_until": (
            doc.snoozed_until.isoformat() if doc.snoozed_until else None
        )
    }


@router.post("/{notification_id}/unsnooze")
async def unsnooze_notification_route(
    notification_id: str, current_user: User = Depends(get_current_user)
):
    """Cancel a notification snooze."""
    _validate_notification_id(notification_id)
    doc = await ns.unsnooze_notification(notification_id, str(current_user.id))
    _require_item(doc)
    return {"ok": True}


@router.post("/{notification_id}/read")
async def mark_as_read(
    notification_id: str, current_user: User = Depends(get_current_user)
):
    """Mark a specific notification as read."""
    notification = await Notification.get(ObjectId(notification_id))

    if not notification or notification.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found"
        )

    notification.is_read = True
    await notification.save()
    await manager.send_personal_message(
        notification.user_id,
        {"action": "notification_read", "id": str(notification.id)},
    )

    return {"message": "Marked as read"}
