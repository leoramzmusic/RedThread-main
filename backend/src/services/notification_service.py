"""Emisión directa de notificaciones (Fase A, enfoque 1a + 2a).

Reglas: agrupación rodante con bump (ventana 24h), cap de 3 actores,
silencio = filtro al mostrar (el doc se crea igual), DND solo suprime push.
"""

from datetime import datetime, time, timedelta
from typing import Any, Dict, List, Optional

from src.models.conversation import Conversation
from src.models.media import MediaItem, MediaType
from src.models.notification import Notification
from src.models.profile import Profile
from src.services.connection_manager import manager
from src.services.smart_photos import SmartPhotosService

GROUP_WINDOW_HOURS = 24
MAX_ACTORS = 3
PREVIEW_MAX = 80
RETENTION_DAYS = 30

ALL_NOTIF_TYPES = ["like", "match", "message", "system", "survey", "promo"]
FILTER_TYPES = {
    "social": ["like", "match"],
    "messages": ["message"],
    "system": ["system", "survey", "promo"],
}


def bucket_for(notif_type: str) -> str:
    if notif_type in ("like", "match"):
        return "social"
    if notif_type == "message":
        return "messages"
    if notif_type == "promo":
        return "promos"
    return "system"


def is_muted_type(mutes: Optional[Dict[str, bool]], notif_type: str) -> bool:
    if not mutes:
        return False
    bucket = bucket_for(notif_type)
    if bucket == "promos":
        return bool(mutes.get("promos") or mutes.get("system"))
    return bool(mutes.get(bucket))


def _is_dnd_active(dnd: Optional[Dict[str, Any]], now: time) -> bool:
    if not dnd or not dnd.get("enabled"):
        return False
    try:
        start = time.fromisoformat(dnd.get("start_time", "22:00"))
        end = time.fromisoformat(dnd.get("end_time", "08:00"))
    except ValueError:
        return False
    if start <= end:
        return start <= now <= end
    return now >= start or now <= end  # cruza medianoche


def should_push(
    settings, notif_type: str, metadata: Optional[dict], now: Optional[time] = None
) -> bool:
    important = bool((metadata or {}).get("important"))
    if important:
        return True
    if settings is None:
        return True
    if not getattr(settings, "notifications_enabled", True):
        return False
    if is_muted_type(getattr(settings, "notification_mutes", None), notif_type):
        return False
    return not _is_dnd_active(
        getattr(settings, "do_not_disturb", None), now or datetime.utcnow().time()
    )


def visibility_query(
    user_id: str, flt: str, mutes: Optional[Dict[str, bool]], master_enabled: bool
) -> dict:
    q: dict = {"user_id": user_id}
    types = FILTER_TYPES.get(flt)
    if types:
        q["type"] = {"$in": types}
    if not master_enabled:
        q["metadata.important"] = True
        return q
    muted = [t for t in ALL_NOTIF_TYPES if is_muted_type(mutes, t)]
    if muted:
        q["$or"] = [{"type": {"$nin": muted}}, {"metadata.important": True}]
    return q


def serialize_notification(doc: Notification) -> dict:
    data = doc.dict()
    data["id"] = str(doc.id)
    return data


async def actor_snapshot(user_id: str) -> dict:
    profile = await Profile.find_one({"user_id": user_id})
    return {
        "user_id": user_id,
        "name": profile.display_name if profile else "Usuario",
        "photo": (profile.photos[0] if profile and profile.photos else None),
        "nickname": getattr(profile, "nickname", None) if profile else None,
    }


def _group_query(user_id: str, group_key: str, now: datetime) -> dict:
    return {
        "user_id": user_id,
        "group_key": group_key,
        "updated_at": {"$gte": now - timedelta(hours=GROUP_WINDOW_HOURS)},
    }


async def _push_new_notification(doc: Notification) -> None:
    from src.models.user_settings import UserSettings

    settings = await UserSettings.find_one({"user_id": doc.user_id})
    if not should_push(settings, doc.type, doc.metadata):
        return
    await manager.send_personal_message(
        doc.user_id,
        {"action": "new_notification", "notification": serialize_notification(doc)},
    )


def _add_actor(doc: Notification, actor: dict, lock_actor: bool) -> None:
    meta = doc.metadata or {}
    if lock_actor:
        # Grupos de mensajes: cada evento cuenta; actors = último remitente
        doc.actor_count += 1
        doc.actors = [actor]
        meta = {**meta, "last_actor_id": actor["user_id"]}
        doc.metadata = meta
        return
    seen: List[str] = list(meta.get("actor_ids") or [])
    if actor["user_id"] in seen:
        return
    seen.append(actor["user_id"])
    doc.actor_count += 1
    if len(doc.actors) < MAX_ACTORS:
        doc.actors = doc.actors + [actor]
    meta = {**meta, "actor_ids": seen, "last_actor_id": actor["user_id"]}
    doc.metadata = meta


async def emit_notification(
    *,
    user_id: str,
    type: str,
    content: str,
    related_user_id: Optional[str] = None,
    group_key: Optional[str] = None,
    target_type: Optional[str] = None,
    target_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    actor: Optional[dict] = None,
    group_target_type: Optional[str] = None,
    group_target_id: Optional[str] = None,
    lock_actor: bool = False,
) -> Notification:
    now = datetime.utcnow()
    if group_key:
        existing = await Notification.find_one(_group_query(user_id, group_key, now))
        if existing:
            existing.content = content
            existing.updated_at = now
            existing.is_read = False
            if related_user_id:
                existing.related_user_id = related_user_id
            if metadata:
                existing.metadata = {**(existing.metadata or {}), **metadata}
            if group_target_type:
                existing.target_type = group_target_type
                existing.target_id = group_target_id
            if actor:
                _add_actor(existing, actor, lock_actor)
            await existing.save()
            await _push_new_notification(existing)
            return existing
    doc = Notification(
        user_id=user_id,
        type=type,
        content=content,
        related_user_id=related_user_id,
        group_key=group_key,
        target_type=target_type,
        target_id=target_id,
        metadata=metadata or {},
        created_at=now,
        updated_at=now,
    )
    if actor:
        doc.actors = [actor]
        doc.actor_count = 1
        doc.metadata = {
            **(doc.metadata or {}),
            "actor_ids": [actor["user_id"]],
            "last_actor_id": actor["user_id"],
        }
    await doc.insert()
    await _push_new_notification(doc)
    return doc


async def emit_like_notification(
    *,
    liker_id: str,
    recipient_id: str,
    shown_media_id: Optional[str] = None,
    is_superlike: bool = False,
    shown_media_url: Optional[str] = None,
    shown_media_type: Optional[str] = None,
    shown_media_thumbnail_url: Optional[str] = None,
) -> Notification:
    actor = await actor_snapshot(liker_id)
    nickname = actor.get("nickname") or ""
    media_metadata = {}
    if shown_media_id:
        media_metadata = {
            "shown_media_id": shown_media_id,
            "shown_media_url": shown_media_url,
            "shown_media_type": shown_media_type,
            "shown_media_thumbnail_url": (
                shown_media_thumbnail_url or shown_media_url
            ),
        }
    if is_superlike:
        return await emit_notification(
            user_id=recipient_id,
            type="like",
            content=f"{actor['name']} te envió un Super Like",
            related_user_id=liker_id,
            group_key=None,
            target_type="profile",
            target_id=liker_id,
            metadata={
                "superlike": True,
                **media_metadata,
                "target_url": f"/profile/{nickname}",
            },
            actor=actor,
        )
    group_key = f"like:photo:{shown_media_id}" if shown_media_id else "like:profile"
    if shown_media_id:
        media_label = "video" if shown_media_type == "video" else "foto"
        content = f"A {actor['name']} le gustó tu {media_label}"
    else:
        content = f"A {actor['name']} le gustas"
    return await emit_notification(
        user_id=recipient_id,
        type="like",
        content=content,
        related_user_id=liker_id,
        group_key=group_key,
        target_type="profile",
        target_id=liker_id,
        group_target_type="likes",
        group_target_id=shown_media_id,
        metadata={
            **media_metadata,
            "target_url": f"/profile/{nickname}",
        },
        actor=actor,
    )


async def resolve_recipient_media(
    media_ref: Optional[str], recipient_id: str
) -> Optional[MediaItem]:
    """Resolve an ObjectId or URL to media owned by the like recipient."""
    if not media_ref:
        return None

    media = None
    try:
        media = await MediaItem.get(media_ref)
    except Exception:
        pass
    if media is None:
        media = await MediaItem.find_one({"url": media_ref})
    if media is None or str(media.user_id) != recipient_id:
        return None
    return media


async def handle_swipe_notifications(
    *,
    swiper_id: str,
    target_id: str,
    interaction,
    is_match: bool,
    match_id: str,
    shown_media_id: Optional[str] = None,
    is_new_like: bool = True,
    was_matched: bool = False,
) -> None:
    """Record photo likes and emit like/match notifications exactly once."""
    interaction_value = getattr(interaction, "value", interaction)
    if interaction_value not in ("like", "superlike"):
        return

    new_match = is_match and not was_matched
    if not is_new_like and not new_match:
        return

    media = await resolve_recipient_media(shown_media_id, target_id)
    media_id = str(media.id) if media else None
    media_type = getattr(media.type, "value", media.type) if media else None

    if media and is_new_like and media_type == MediaType.PHOTO:
        await SmartPhotosService.record_photo_like(target_id, media_id)

    if new_match:
        await emit_match_notification(
            user_a_id=swiper_id,
            user_b_id=target_id,
            match_id=match_id,
        )
        return

    if not is_new_like:
        return

    await emit_like_notification(
        liker_id=swiper_id,
        recipient_id=target_id,
        shown_media_id=media_id,
        is_superlike=interaction_value == "superlike",
        shown_media_url=getattr(media, "url", None) if media else None,
        shown_media_type=media_type,
        shown_media_thumbnail_url=(
            getattr(media, "thumbnail_url", None) if media else None
        ),
    )


async def find_conversation_between(
    user_a_id: str, user_b_id: str
) -> Optional[Conversation]:
    return await Conversation.find_one(
        {"participants": {"$all": [user_a_id, user_b_id]}}
    )


async def emit_match_notification(
    *, user_a_id: str, user_b_id: str, match_id: str
) -> List[Notification]:
    conversation = await find_conversation_between(user_a_id, user_b_id)
    target_type = "chat" if conversation else "profile"
    docs = []
    for me, other in ((user_a_id, user_b_id), (user_b_id, user_a_id)):
        actor = await actor_snapshot(other)
        docs.append(
            await emit_notification(
                user_id=me,
                type="match",
                content=f"¡Nuevo match con {actor['name']}!",
                related_user_id=other,
                group_key=None,
                target_type=target_type,
                target_id=str(conversation.id) if conversation else other,
                metadata={"match_id": match_id, "can_reply": True},
                actor=actor,
            )
        )
    return docs


async def notify_new_message(
    *,
    sender_id: str,
    recipient_id: str,
    conversation,
    preview: str,
    can_reply: bool,
) -> Optional[Notification]:
    if sender_id == recipient_id:
        return None
    muted_by = getattr(conversation, "is_muted_by", None)
    if callable(muted_by):
        if muted_by(recipient_id):
            return None
    elif recipient_id in (muted_by or []):
        return None
    actor = await actor_snapshot(sender_id)
    short = (preview or "")[:PREVIEW_MAX]
    conv_id = str(conversation.id)
    return await emit_notification(
        user_id=recipient_id,
        type="message",
        content=short,
        related_user_id=sender_id,
        group_key=f"message:{conv_id}",
        target_type="chat",
        target_id=conv_id,
        metadata={"preview": short, "conversation_id": conv_id, "can_reply": can_reply},
        actor=actor,
        lock_actor=True,
    )


async def emit_system_notification(
    *,
    user_id: str,
    content: str,
    notif_type: str = "system",
    target_url: Optional[str] = None,
    important: bool = False,
) -> Notification:
    return await emit_notification(
        user_id=user_id,
        type=notif_type,
        content=content,
        target_type="url" if target_url else None,
        target_id=target_url,
        metadata={"important": True} if important else {},
    )


async def mark_message_notification_read(user_id: str, conversation_id: str) -> None:
    group_key = f"message:{conversation_id}"
    await Notification.find(
        {"user_id": user_id, "group_key": group_key, "is_read": False}
    ).update({"$set": {"is_read": True, "updated_at": datetime.utcnow()}})
    await manager.send_personal_message(user_id, {"action": "notifications_sync"})


SNOOZE_DURATIONS = {
    "15m": timedelta(minutes=15),
    "1h": timedelta(hours=1),
    "2h": timedelta(hours=2),
    "8h": timedelta(hours=8),
    "1d": timedelta(days=1),
}


def visible_filter(
    user_id: str, archived_only: bool = False, now: Optional[datetime] = None
) -> dict:
    now = now or datetime.utcnow()
    return {
        "user_id": user_id,
        "deleted_at": None,
        "archived_at": {"$ne": None} if archived_only else None,
        "$or": [{"snoozed_until": None}, {"snoozed_until": {"$lte": now}}],
    }


async def _owned(notification_id: str, user_id: str) -> Optional[Notification]:
    doc = await Notification.get(notification_id)
    if doc is None or doc.user_id != user_id:
        return None
    return doc


async def _push_action(user_id: str, action: str, **extra: Any) -> None:
    await manager.send_personal_message(user_id, {"action": action, **extra})


async def set_archived(
    notification_id: str, user_id: str, archived: bool
) -> Optional[Notification]:
    doc = await _owned(notification_id, user_id)
    if doc is None:
        return None
    doc.archived_at = datetime.utcnow() if archived else None
    await doc.save()
    await _push_action(
        user_id,
        "notification_archived" if archived else "notification_unarchived",
        id=notification_id,
    )
    return doc


async def set_deleted(notification_id: str, user_id: str) -> Optional[Notification]:
    doc = await _owned(notification_id, user_id)
    if doc is None:
        return None
    doc.deleted_at = datetime.utcnow()
    await doc.save()
    await _push_action(user_id, "notification_deleted", id=notification_id)
    return doc


async def restore_notification(
    notification_id: str, user_id: str
) -> Optional[Notification]:
    doc = await _owned(notification_id, user_id)
    if doc is None:
        return None
    doc.deleted_at = None
    await doc.save()
    await _push_action(user_id, "notification_restored", id=notification_id)
    return doc


async def _apply_always_mute(doc: Notification) -> None:
    from src.models.user_settings import UserSettings

    settings = await UserSettings.find_one({"user_id": doc.user_id})
    if settings is None:
        return
    mutes = dict(settings.notification_mutes or {})
    mutes[bucket_for(doc.type)] = True
    settings.notification_mutes = mutes
    await settings.save()


async def snooze_notification(
    notification_id: str, user_id: str, duration: str
) -> Optional[Notification]:
    if duration not in (*SNOOZE_DURATIONS.keys(), "always"):
        raise ValueError(f"Invalid snooze duration: {duration}")
    doc = await _owned(notification_id, user_id)
    if doc is None:
        return None
    if duration == "always":
        await _apply_always_mute(doc)
        doc.is_read = True
        doc.snoozed_until = None
    else:
        doc.snoozed_until = datetime.utcnow() + SNOOZE_DURATIONS[duration]
    await doc.save()
    await _push_action(
        user_id,
        "notification_snoozed",
        id=notification_id,
        duration=duration,
        until=doc.snoozed_until.isoformat() if doc.snoozed_until else None,
    )
    await _push_action(user_id, "notifications_sync")
    return doc


async def unsnooze_notification(
    notification_id: str, user_id: str
) -> Optional[Notification]:
    doc = await _owned(notification_id, user_id)
    if doc is None:
        return None
    doc.snoozed_until = None
    await doc.save()
    await _push_action(user_id, "notification_unsnoozed", id=notification_id)
    await _push_action(user_id, "notifications_sync")
    return doc
