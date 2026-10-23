from datetime import datetime, timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest

from src.models.notification import Notification
from src.services import notification_service as ns


def _doc(**kw):
    base = dict(user_id="u1", type="like", content="", metadata={}, is_read=False)
    base.update(kw)
    return Notification(**base)


def test_visible_filter_excludes_archived_deleted_snoozed():
    now = datetime.utcnow()
    q = ns.visible_filter("u1", now=now)
    assert q["user_id"] == "u1"
    assert q["deleted_at"] is None
    assert q["archived_at"] is None
    assert {"snoozed_until": None} in q["$or"]
    assert {"snoozed_until": {"$lte": now}} in q["$or"]


def test_visible_filter_archived_only():
    q = ns.visible_filter("u1", archived_only=True)
    assert q["archived_at"] == {"$ne": None}


@pytest.mark.asyncio
async def test_set_archived_sets_timestamp_and_pushes():
    doc = _doc()
    with patch.object(Notification, "get", new=AsyncMock(return_value=doc)), patch.object(
        Notification, "save", new=AsyncMock()
    ), patch.object(ns.manager, "send_personal_message", new=AsyncMock()) as push:
        got = await ns.set_archived("n1", "u1", True)
    assert got is doc and doc.archived_at is not None
    push.assert_awaited_once()
    assert push.await_args.args[1]["action"] == "notification_archived"


@pytest.mark.asyncio
async def test_set_archived_rejects_foreign_user():
    doc = _doc(user_id="other")
    with patch.object(Notification, "get", new=AsyncMock(return_value=doc)):
        assert await ns.set_archived("n1", "u1", True) is None


@pytest.mark.asyncio
async def test_set_deleted_and_restore_round_trip():
    doc = _doc()
    with patch.object(Notification, "get", new=AsyncMock(return_value=doc)), patch.object(
        Notification, "save", new=AsyncMock()
    ), patch.object(ns.manager, "send_personal_message", new=AsyncMock()) as push:
        await ns.set_deleted("n1", "u1")
        assert doc.deleted_at is not None
        await ns.restore_notification("n1", "u1")
        assert doc.deleted_at is None
    actions = [c.args[1]["action"] for c in push.await_args_list]
    assert actions == ["notification_deleted", "notification_restored"]


@pytest.mark.asyncio
async def test_snooze_sets_until_and_pushes_sync():
    doc = _doc()
    with patch.object(Notification, "get", new=AsyncMock(return_value=doc)), patch.object(
        Notification, "save", new=AsyncMock()
    ), patch.object(ns.manager, "send_personal_message", new=AsyncMock()) as push:
        before = datetime.utcnow()
        got = await ns.snooze_notification("n1", "u1", "1h")
    assert got.snoozed_until >= before + timedelta(minutes=59)
    actions = [c.args[1]["action"] for c in push.await_args_list]
    assert actions == ["notification_snoozed", "notifications_sync"]


@pytest.mark.asyncio
async def test_snooze_rejects_unknown_duration():
    with pytest.raises(ValueError):
        await ns.snooze_notification("n1", "u1", "3d")


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "duration,minimum",
    [
        ("30m", timedelta(minutes=29)),
        ("4h", timedelta(hours=3, minutes=59)),
    ],
)
async def test_snooze_supports_new_presets(duration, minimum):
    doc = _doc()
    with patch.object(Notification, "get", new=AsyncMock(return_value=doc)), patch.object(
        Notification, "save", new=AsyncMock()
    ), patch.object(ns.manager, "send_personal_message", new=AsyncMock()):
        before = datetime.utcnow()
        got = await ns.snooze_notification("n1", "u1", duration)
    assert got.snoozed_until >= before + minimum


@pytest.mark.asyncio
async def test_snooze_always_sets_mute_and_marks_read():
    doc = _doc(type="like")
    settings = SimpleNamespace(notification_mutes={}, save=AsyncMock())
    with patch.object(Notification, "get", new=AsyncMock(return_value=doc)), patch.object(
        Notification, "save", new=AsyncMock()
    ), patch(
        "src.models.user_settings.UserSettings.find_one",
        new=AsyncMock(return_value=settings),
    ), patch.object(ns.manager, "send_personal_message", new=AsyncMock()):
        await ns.snooze_notification("n1", "u1", "always")
    assert settings.notification_mutes == {"social": True}
    assert doc.is_read is True
    assert doc.snoozed_until is None


@pytest.mark.asyncio
async def test_set_pinned_sets_timestamp_and_pushes():
    doc = _doc()
    with patch.object(Notification, "get", new=AsyncMock(return_value=doc)), patch.object(
        Notification, "save", new=AsyncMock()
    ), patch.object(ns.manager, "send_personal_message", new=AsyncMock()) as push:
        got = await ns.set_pinned("n1", "u1", True)
    assert got is doc and doc.pinned_at is not None
    assert push.await_args.args[1]["action"] == "notification_pinned"


@pytest.mark.asyncio
async def test_set_pinned_false_clears_timestamp():
    doc = _doc(pinned_at=datetime.utcnow())
    with patch.object(Notification, "get", new=AsyncMock(return_value=doc)), patch.object(
        Notification, "save", new=AsyncMock()
    ), patch.object(ns.manager, "send_personal_message", new=AsyncMock()) as push:
        got = await ns.set_pinned("n1", "u1", False)
    assert got is doc and doc.pinned_at is None
    assert push.await_args.args[1]["action"] == "notification_unpinned"


@pytest.mark.asyncio
async def test_set_pinned_rejects_foreign_user():
    doc = _doc(user_id="other")
    with patch.object(Notification, "get", new=AsyncMock(return_value=doc)):
        assert await ns.set_pinned("n1", "u1", True) is None


@pytest.mark.asyncio
async def test_unsnooze_clears_field():
    doc = _doc(snoozed_until=datetime.utcnow() + timedelta(hours=1))
    with patch.object(Notification, "get", new=AsyncMock(return_value=doc)), patch.object(
        Notification, "save", new=AsyncMock()
    ), patch.object(ns.manager, "send_personal_message", new=AsyncMock()) as push:
        await ns.unsnooze_notification("n1", "u1")
    assert doc.snoozed_until is None
    actions = [c.args[1]["action"] for c in push.await_args_list]
    assert actions == ["notification_unsnoozed", "notifications_sync"]
