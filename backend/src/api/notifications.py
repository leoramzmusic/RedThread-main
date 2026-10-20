from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

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

SNOOZE_VALUES = ("15m", "1h", "2h", "8h", "1d", "always")


class SnoozeRequest(BaseModel):
    duration: str


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


async def _mute_context(user_id: str) -> tuple[Dict[str, bool], bool]:
    settings = await UserSettings.find_one({"user_id": user_id})
    mutes = getattr(settings, "notification_mutes", None) or {}
    master = getattr(settings, "notifications_enabled", True)
    return mutes, master


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


async def _survey_pending(user_id: str) -> int:
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

    mutes, master = await _mute_context(uid)
    if filter == "archived":
        query = ns.visible_filter(uid, archived_only=True)
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

    related_ids = list({d.related_user_id for d in docs if d.related_user_id})
    profiles = (
        await Profile.find({"user_id": {"$in": related_ids}}).to_list()
        if related_ids
        else []
    )
    by_user = {p.user_id: p for p in profiles}

    items = [_serialize_item(doc, by_user.get(doc.related_user_id)) for doc in docs]

    next_cursor = None
    if has_more and docs:
        last = docs[-1]
        next_cursor = encode_cursor(last.updated_at, str(last.id))

    return {"items": items, "next_cursor": next_cursor}


@router.get("/unread-count")
async def get_unread_count(current_user: User = Depends(get_current_user)):
    """Unread counts per bucket (visibility-aware)."""
    uid = str(current_user.id)
    mutes, master = await _mute_context(uid)
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

    return _compose_counts(
        social=social,
        messages=messages,
        system_docs=system_docs,
        survey_pending=survey_pending,
    )


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
async def mark_all_as_read(current_user: User = Depends(get_current_user)):
    """Mark all notifications as read."""
    uid = str(current_user.id)
    await Notification.find(
        Notification.user_id == uid, Notification.is_read == False
    ).update({"$set": {"is_read": True}})
    await manager.send_personal_message(uid, {"action": "notifications_read_all"})
    return {"message": "All marked as read"}


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
