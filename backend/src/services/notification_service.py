"""Emisión directa de notificaciones (Fase A, enfoque 1a + 2a).

Reglas: agrupación rodante con bump (ventana 24h), cap de 3 actores,
silencio = filtro al mostrar (el doc se crea igual), DND solo suprime push.
"""

from datetime import date, datetime, time, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple
from uuid import uuid4

from bson import ObjectId

try:  # tzdata no está garantizada en Windows; el offset del cliente hace de fallback
    from zoneinfo import ZoneInfo
except ImportError:  # pragma: no cover - Python < 3.9
    ZoneInfo = None  # type: ignore[assignment]

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
MAX_BULK = 100
PAUSE_SCHEDULE_MAX_RULES = 3
PAUSE_WEEKDAYS = (0, 1, 2, 3, 4, 5, 6)
PAUSE_ALLOWED_TYPES = (
    "message",
    "system",
    "survey",
    "like",
    "match",
    "promo",
    "comment",
)

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


def resolve_dnd_status(settings, now: Optional[datetime] = None) -> Dict[str, Any]:
    """Calcula el estado efectivo de DND y el origen exacto (manual o routine).

    Algoritmo con estados explícitos:
    1. Si manual_pause_until está vigente → DND manual (origen manual).
    2. Si selected_routine_id existe → comprobar si está dentro de su ventana:
       - Dentro de ventana → routine_state = "active", dnd_active = True
       - Fuera de ventana → routine_state = "scheduled" | "waiting", dnd_active = False
    3. Si no existe ninguna fuente → DND desactivado.

    Retorna un diccionario completo:
    {
        'dnd_active': bool,
        'dnd_source': 'manual' | 'routine' | None,
        'selected_routine_id': str | None,
        'effective_active_routine_id': str | None,
        'routine_state': 'scheduled' | 'active' | 'waiting' | None,
        'active_routine_name': str | None,
        'window_end': str | None,
        'next_start': str | None,
    }
    """
    if settings is None:
        return {
            "dnd_active": False,
            "dnd_source": None,
            "selected_routine_id": None,
            "effective_active_routine_id": None,
            "routine_state": None,
            "active_routine_name": None,
            "window_end": None,
            "next_start": None,
        }

    reference = _naive_utc(now or datetime.utcnow())

    # 1. Pausa manual activa (tiene prioridad si está vigente)
    manual_until = getattr(settings, "manual_pause_until", None)
    if manual_until is not None and _naive_utc(manual_until) > reference:
        until_iso = (
            manual_until.isoformat()
            if hasattr(manual_until, "isoformat")
            else str(manual_until)
        )
        return {
            "dnd_active": True,
            "dnd_source": "manual",
            "selected_routine_id": None,
            "effective_active_routine_id": None,
            "routine_state": "active",
            "active_routine_name": None,
            "window_end": until_iso,
            "next_start": None,
        }

    # 2. Rutina personalizada seleccionada explícitamente (exclusividad mutua)
    selected_routine_id = getattr(settings, "selected_routine_id", None)
    if selected_routine_id:
        routines = getattr(settings, "dnd_routines", None) or []
        target_rule = None
        for rule in routines:
            if rule.get("id") == selected_routine_id:
                target_rule = rule
                break

        if target_rule is None:
            # El ID ya no existe, limpiarlo
            return {
                "dnd_active": False,
                "dnd_source": None,
                "selected_routine_id": selected_routine_id,
                "effective_active_routine_id": None,
                "routine_state": "waiting",
                "active_routine_name": None,
                "window_end": None,
                "next_start": None,
            }

        window = pause_rule_window(target_rule, reference)
        if window is not None:
            _win_start, win_end = window
            end_label = target_rule.get("end") or "—"
            return {
                "dnd_active": True,
                "dnd_source": "routine",
                "selected_routine_id": selected_routine_id,
                "effective_active_routine_id": selected_routine_id,
                "routine_state": "active",
                "active_routine_name": target_rule.get("name") or "Rutina",
                "window_end": end_label,
                "next_start": None,
            }

        # Fuera de ventana: calcular próximo start buscando hacia adelante
        start_t = parse_clock(target_rule.get("start", "00:00"))
        end_t = parse_clock(target_rule.get("end", "00:00"))
        tz = _rule_timezone(target_rule)
        local_now = reference.replace(tzinfo=timezone.utc).astimezone(tz)
        days = {int(day) for day in (target_rule.get("days") or []) if int(day) in PAUSE_WEEKDAYS}

        next_start_dt = None
        next_start_offset = None
        for offset in range(0, 8):
            candidate_day = local_now.date() + timedelta(days=offset)
            if candidate_day.weekday() not in days:
                continue
            candidate_start = _to_utc(candidate_day, start_t, tz)
            if offset == 0 and local_now.time() >= start_t:
                # Ya pasó el start de hoy, seguir buscando
                continue
            next_start_dt = candidate_start
            next_start_offset = offset
            break

        next_start_label = None
        if next_start_dt is not None:
            weekday_labels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
            next_start_utc = next_start_dt.replace(tzinfo=timezone.utc)
            next_start_local = next_start_utc.astimezone(tz)
            next_start_label = (
                f"{weekday_labels[next_start_local.weekday()]} "
                f"{next_start_local.strftime('%H:%M')}"
            )

        # Determinar routine_state: scheduled = empieza hoy, waiting = empieza otro día
        if next_start_offset == 0:
            routine_state = "scheduled"
        else:
            routine_state = "waiting"

        return {
            "dnd_active": False,
            "dnd_source": "routine",
            "selected_routine_id": selected_routine_id,
            "effective_active_routine_id": None,
            "routine_state": routine_state,
            "active_routine_name": target_rule.get("name") or "Rutina",
            "window_end": None,
            "next_start": next_start_label,
        }

    # 3. Ningún DND activo
    return {
        "dnd_active": False,
        "dnd_source": None,
        "selected_routine_id": None,
        "effective_active_routine_id": None,
        "routine_state": None,
        "active_routine_name": None,
        "window_end": None,
        "next_start": None,
    }


def is_dnd_active(settings, now: Optional[datetime] = None) -> bool:
    """Estado efectivo booleano de DND."""
    return resolve_dnd_status(settings, now)["dnd_active"]


def parse_clock(value: str) -> time:
    try:
        hours_text, minutes_text = str(value).split(":")
        hours = int(hours_text)
        minutes = int(minutes_text)
    except (AttributeError, ValueError):
        raise ValueError("Invalid pause time")
    if not (0 <= hours <= 23 and 0 <= minutes <= 59):
        raise ValueError("Invalid pause time")
    return time(hour=hours, minute=minutes)


def normalize_pause_allow(allow: Optional[List[str]]) -> List[str]:
    """Keep only known notification types that may still come through."""
    return sorted(
        {str(item) for item in (allow or []) if str(item) in PAUSE_ALLOWED_TYPES}
    )


def normalize_pause_rule(
    days: Optional[List[int]],
    start: str,
    end: str,
    timezone_name: Optional[str] = None,
    utc_offset_minutes: Optional[int] = None,
    name: Optional[str] = None,
    allow: Optional[List[str]] = None,
    rule_id: Optional[str] = None,
    enabled: bool = True,
) -> Dict[str, Any]:
    """Build a normalized recurring pause rule (weekdays + local time window)."""
    start_t = parse_clock(start)
    end_t = parse_clock(end)
    day_list = sorted({int(day) for day in (days or []) if int(day) in PAUSE_WEEKDAYS})
    if not day_list:
        raise ValueError("Invalid pause days")
    now = datetime.utcnow()
    rule: Dict[str, Any] = {
        "id": str(rule_id) if rule_id else uuid4().hex,
        "name": (name or "").strip()[:60],
        "days": day_list,
        "start": start_t.strftime("%H:%M"),
        "end": end_t.strftime("%H:%M"),
        "enabled": bool(enabled),
        "allow": normalize_pause_allow(allow),
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }
    if timezone_name:
        rule["timezone"] = str(timezone_name)
    if utc_offset_minutes is not None:
        try:
            rule["utc_offset_minutes"] = int(utc_offset_minutes)
        except (TypeError, ValueError):
            raise ValueError("Invalid pause offset")
    return rule


def _rule_timezone(rule: Dict[str, Any]):
    name = rule.get("timezone")
    if name and ZoneInfo is not None:
        try:
            return ZoneInfo(str(name))
        except Exception:
            pass
    offset = rule.get("utc_offset_minutes")
    if offset is not None:
        try:
            return timezone(timedelta(minutes=int(offset)))
        except (TypeError, ValueError):
            pass
    return timezone.utc


def _naive_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value
    return value.astimezone(timezone.utc).replace(tzinfo=None)


def _to_utc(local_day: date, clock: time, tz) -> datetime:
    return (
        datetime.combine(local_day, clock, tzinfo=tz)
        .astimezone(timezone.utc)
        .replace(tzinfo=None)
    )


def pause_rule_window(
    rule: Dict[str, Any], now: Optional[datetime] = None
) -> Optional[Tuple[datetime, datetime]]:
    """(start, end) in UTC naive of the active window of a rule, or None."""
    if not rule.get("enabled", True):
        return None
    try:
        start_t = parse_clock(rule.get("start", ""))
        end_t = parse_clock(rule.get("end", ""))
    except ValueError:
        return None
    days = {int(day) for day in (rule.get("days") or []) if int(day) in PAUSE_WEEKDAYS}
    if not days:
        return None

    now_utc = _naive_utc(now or datetime.utcnow())
    tz = _rule_timezone(rule)
    local = now_utc.replace(tzinfo=timezone.utc).astimezone(tz)
    local_now = local.time()
    weekday = local.weekday()
    today = local.date()

    if start_t < end_t:
        if weekday in days and start_t <= local_now < end_t:
            return _to_utc(today, start_t, tz), _to_utc(today, end_t, tz)
        return None

    if weekday in days and local_now >= start_t:
        return _to_utc(today, start_t, tz), _to_utc(
            today + timedelta(days=1), end_t, tz
        )
    previous_day = (weekday - 1) % 7
    if previous_day in days and local_now < end_t:
        return _to_utc(today - timedelta(days=1), start_t, tz), _to_utc(
            today, end_t, tz
        )
    return None


def next_pause_rule_end(
    rule: Dict[str, Any], now: Optional[datetime] = None
) -> Optional[datetime]:
    """End of the current or next window of a recurring rule, in UTC naive."""
    try:
        start_t = parse_clock(rule.get("start", ""))
        end_t = parse_clock(rule.get("end", ""))
    except ValueError:
        return None
    days = {int(day) for day in (rule.get("days") or []) if int(day) in PAUSE_WEEKDAYS}
    if not days:
        return None

    reference = _naive_utc(now or datetime.utcnow())
    tz = _rule_timezone(rule)
    local_today = reference.replace(tzinfo=timezone.utc).astimezone(tz).date()
    for offset in range(-1, 8):
        local_day = local_today + timedelta(days=offset)
        if local_day.weekday() not in days:
            continue
        end_day = local_day + timedelta(days=1 if end_t <= start_t else 0)
        end = _to_utc(end_day, end_t, tz)
        if end > reference:
            return end
    return None


def schedule_pause_windows(
    settings, now: Optional[datetime] = None
) -> List[Tuple[Dict[str, Any], datetime, datetime]]:
    """Active windows of the recurring DND routines."""
    windows: List[Tuple[Dict[str, Any], datetime, datetime]] = []
    for rule in getattr(settings, "dnd_routines", None) or []:
        window = pause_rule_window(rule, now)
        if window is not None:
            windows.append((rule, window[0], window[1]))
    return windows






def should_push(
    settings, notif_type: str, metadata: Optional[dict], now: Optional[datetime] = None
) -> bool:
    important = bool((metadata or {}).get("important"))
    if important:
        return True
    if settings is None:
        return True
    if not getattr(settings, "notifications_enabled", True):
        return False
    if is_dnd_active(settings, now or datetime.utcnow()):
        return False
    if is_muted_type(getattr(settings, "notification_mutes", None), notif_type):
        return False
    return True


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
    "30m": timedelta(minutes=30),
    "1h": timedelta(hours=1),
    "2h": timedelta(hours=2),
    "4h": timedelta(hours=4),
    "8h": timedelta(hours=8),
    "1d": timedelta(days=1),
}


def visible_filter(
    user_id: str, in_trash: bool = False, now: Optional[datetime] = None
) -> dict:
    now = now or datetime.utcnow()
    return {
        "user_id": user_id,
        "status": "trash" if in_trash else "active",
        "permanently_deleted_at": None,
        "$or": [{"snoozed_until": None}, {"snoozed_until": {"$lte": now}}],
    }


async def _owned(notification_id: str, user_id: str) -> Optional[Notification]:
    doc = await Notification.get(notification_id)
    if doc is None or doc.user_id != user_id:
        return None
    return doc


async def _push_action(user_id: str, action: str, **extra: Any) -> None:
    await manager.send_personal_message(user_id, {"action": action, **extra})


async def move_to_trash(
    notification_id: str, user_id: str
) -> Optional[Notification]:
    """Mueve una notificación a la papelera (soft delete).

    La notificación deja de ser visible en el panel principal pero se
    conserva durante 30 días para posible restauración.
    """
    doc = await _owned(notification_id, user_id)
    if doc is None:
        return None
    if doc.status == "deleted":
        return None
    doc.status = "trash"
    doc.deleted_at = datetime.utcnow()
    doc.permanently_deleted_at = None
    await doc.save()
    await _push_action(user_id, "notification_trashed", id=notification_id)
    return doc


async def hard_delete(
    notification_id: str, user_id: str
) -> Optional[Notification]:
    """Elimina físicamente una notificación de la papelera.

    Solo puede llamarse sobre notificaciones con status="trash".
    """
    doc = await _owned(notification_id, user_id)
    if doc is None:
        return None
    if doc.status != "trash":
        return None
    doc.status = "deleted"
    doc.permanently_deleted_at = datetime.utcnow()
    await doc.save()
    await _push_action(user_id, "notification_deleted", id=notification_id)
    return doc


async def restore_from_trash(
    notification_id: str, user_id: str
) -> Optional[Notification]:
    """Restaura una notificación de la papelera al panel principal."""
    doc = await _owned(notification_id, user_id)
    if doc is None:
        return None
    if doc.status != "trash":
        return None
    doc.status = "active"
    doc.deleted_at = None
    doc.permanently_deleted_at = None
    await doc.save()
    await _push_action(user_id, "notification_restored", id=notification_id)
    return doc


async def set_pinned(
    notification_id: str, user_id: str, pinned: bool
) -> Optional[Notification]:
    doc = await _owned(notification_id, user_id)
    if doc is None:
        return None
    doc.pinned_at = datetime.utcnow() if pinned else None
    await doc.save()
    await _push_action(
        user_id,
        "notification_pinned" if pinned else "notification_unpinned",
        id=notification_id,
    )
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


async def pause_notifications(user_id: str, until: datetime) -> datetime:
    from src.models.user_settings import UserSettings

    settings = await UserSettings.find_one({"user_id": user_id})
    if settings is None:
        settings = UserSettings(user_id=user_id)
    settings.manual_pause_until = until
    settings.selected_routine_id = None
    settings.force_notifications_until = None
    await settings.save()
    await _push_action(user_id, "notifications_paused", until=until.isoformat())
    await _push_action(user_id, "notifications_sync")
    return until


async def resume_notifications(user_id: str) -> None:
    from src.models.user_settings import UserSettings

    settings = await UserSettings.find_one({"user_id": user_id})
    if settings is None:
        return
    settings.manual_pause_until = None
    settings.selected_routine_id = None
    settings.force_notifications_until = None
    await settings.save()
    await _push_action(user_id, "notifications_resumed")
    await _push_action(user_id, "notifications_sync")


async def select_pause_routine(user_id: str, routine_id: str) -> None:
    """Selecciona una rutina como DND activo con exclusividad mutua.

    Desactiva todas las demás rutinas y cualquier pausa manual.
    Solo una rutina puede estar activa a la vez.
    """
    from src.models.user_settings import UserSettings

    settings = await UserSettings.find_one({"user_id": user_id})
    if settings is None:
        return
    routines = list(settings.dnd_routines or [])
    target = None
    for rule in routines:
        if rule.get("id") == routine_id:
            target = rule
            break
    if target is None:
        return
    settings.selected_routine_id = routine_id
    settings.manual_pause_until = None
    settings.force_notifications_until = None
    for rule in routines:
        rule["enabled"] = rule.get("id") == routine_id
    settings.dnd_routines = routines
    await settings.save()
    await _push_action(user_id, "notifications_resumed")
    await _push_action(user_id, "notifications_sync")


async def _settings_document(user_id: str):
    from src.models.user_settings import UserSettings

    settings = await UserSettings.find_one({"user_id": user_id})
    if settings is None:
        settings = UserSettings(user_id=user_id)
    return settings


async def set_pause_window(
    user_id: str,
    start: datetime,
    end: datetime,
    allow: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Configure a one-off silence window (start → end) as a manual pause."""
    settings = await _settings_document(user_id)
    settings.manual_pause_until = end
    settings.force_notifications_until = None
    await settings.save()
    await _push_action(user_id, "notifications_sync")
    return {
        "paused_from": start,
        "paused_until": end,
        "pause_allow": [],
    }


async def upsert_pause_schedule(
    user_id: str, rule: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """Store a recurring DND routine, replacing the one with the same id."""
    settings = await _settings_document(user_id)
    routines = [dict(item) for item in (settings.dnd_routines or [])]
    rule_id = rule.get("id")
    replaced = False
    for index, item in enumerate(routines):
        if rule_id and item.get("id") == rule_id:
            routines[index] = dict(rule)
            replaced = True
            break
    if not replaced:
        if len(routines) >= PAUSE_SCHEDULE_MAX_RULES:
            raise ValueError("Maximum custom DND routines reached.")
        routines.append(dict(rule))
    settings.dnd_routines = routines
    if getattr(settings, "selected_routine_id", None) and not any(
        r.get("id") == getattr(settings, "selected_routine_id", None) for r in routines
    ):
        settings.selected_routine_id = None
    settings.force_notifications_until = None
    await settings.save()
    await _push_action(user_id, "notifications_sync")
    return routines


async def remove_pause_schedule(user_id: str, rule_id: str) -> List[Dict[str, Any]]:
    """Remove a recurring DND routine by id."""
    from src.models.user_settings import UserSettings

    settings = await UserSettings.find_one({"user_id": user_id})
    if settings is None:
        return []
    routines = [dict(item) for item in (settings.dnd_routines or [])]
    routines = [item for item in routines if item.get("id") != rule_id]
    settings.dnd_routines = routines
    if getattr(settings, "selected_routine_id", None) == rule_id:
        settings.selected_routine_id = None
    settings.force_notifications_until = None
    await settings.save()
    await _push_action(user_id, "notifications_sync")
    return routines


# ---------------------------------------------------------------------------
# Lectura de notificaciones (única fuente de verdad)
# ---------------------------------------------------------------------------

async def mark_notification_read(
    notification_id: str, user_id: str
) -> Optional[Notification]:
    """Marca una notificación individual como leída (is_read=True, read_at=ahora).

    Nunca toca resolved, required_action ni critical.
    """
    doc = await _owned(notification_id, user_id)
    if doc is None:
        return None
    doc.is_read = True
    doc.read_at = datetime.utcnow()
    doc.updated_at = datetime.utcnow()
    await doc.save()
    return doc


async def mark_all_read(
    user_id: str,
    filter: str = "all",
    mutes: Optional[Dict[str, bool]] = None,
    master_enabled: bool = True,
) -> int:
    """Marca todas las notificaciones visibles como leídas según el filtro.

    Aplica visibility_query para respetar bucket/mutes/master y visible_filter
    para excluir borradas/archivadas/snoozadas activas.
    Solo establece is_read=True y read_at=ahora.
    """
    now = datetime.utcnow()
    base = visible_filter(user_id, now=now)
    q = visibility_query(user_id, filter, mutes, master_enabled)
    # Combinar filtros de visibilidad y bucket
    query: Dict[str, Any] = {**base, **q}
    query["is_read"] = False

    result = await Notification.find(query).update(
        {"$set": {"is_read": True, "read_at": now, "updated_at": now}}
    )
    return result.modified_count if result else 0


async def mark_bucket_read(
    user_id: str,
    bucket: str,
    mutes: Optional[Dict[str, bool]] = None,
    master_enabled: bool = True,
) -> int:
    """Marca todas las notificaciones de un bucket como leídas."""
    return await mark_all_read(user_id, bucket, mutes, master_enabled)


async def mark_notifications_read(
    notification_ids: List[str], user_id: str
) -> int:
    """Marca varias notificaciones específicas como leídas (bulk read)."""
    now = datetime.utcnow()
    oids = [ObjectId(nid) for nid in notification_ids if ObjectId.is_valid(nid)]
    oids = oids[:MAX_BULK]
    if not oids:
        return 0

    query: Dict[str, Any] = {
        **visible_filter(user_id, now=now),
        "_id": {"$in": oids},
        "user_id": user_id,
        "is_read": False,
    }

    result = await Notification.find(query).update(
        {"$set": {"is_read": True, "read_at": now, "updated_at": now}}
    )
    return result.modified_count if result else 0
