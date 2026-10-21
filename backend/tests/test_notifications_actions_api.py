"""Tests for notification action endpoints and scoped counts (F2-2)."""

from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from bson import ObjectId
from fastapi import HTTPException

from src.api import notifications as api


def _user():
    return SimpleNamespace(id="u1")


def _oid():
    return str(ObjectId())


@pytest.mark.asyncio
async def test_archive_calls_service():
    nid = _oid()
    with patch.object(
        api.ns, "set_archived", new=AsyncMock(return_value=object())
    ) as svc:
        out = await api.archive_notification(nid, _user())
    assert out == {"ok": True}
    svc.assert_awaited_once_with(nid, "u1", True)


@pytest.mark.asyncio
async def test_archive_missing_raises_404():
    nid = _oid()
    with patch.object(api.ns, "set_archived", new=AsyncMock(return_value=None)):
        with pytest.raises(HTTPException) as exc:
            await api.archive_notification(nid, _user())
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_unarchive_calls_service():
    nid = _oid()
    with patch.object(
        api.ns, "set_archived", new=AsyncMock(return_value=object())
    ) as svc:
        out = await api.unarchive_notification(nid, _user())
    assert out == {"ok": True}
    svc.assert_awaited_once_with(nid, "u1", False)


@pytest.mark.asyncio
async def test_delete_calls_service():
    nid = _oid()
    with patch.object(
        api.ns, "set_deleted", new=AsyncMock(return_value=object())
    ) as svc:
        out = await api.delete_notification(nid, _user())
    assert out == {"ok": True}
    svc.assert_awaited_once_with(nid, "u1")


@pytest.mark.asyncio
async def test_restore_calls_service():
    nid = _oid()
    with patch.object(
        api.ns, "restore_notification", new=AsyncMock(return_value=object())
    ) as svc:
        out = await api.restore_notification(nid, _user())
    assert out == {"ok": True}
    svc.assert_awaited_once_with(nid, "u1")


@pytest.mark.asyncio
async def test_unsnooze_calls_service():
    nid = _oid()
    with patch.object(
        api.ns, "unsnooze_notification", new=AsyncMock(return_value=object())
    ) as svc:
        out = await api.unsnooze_notification_route(nid, _user())
    assert out == {"ok": True}
    svc.assert_awaited_once_with(nid, "u1")


@pytest.mark.asyncio
async def test_snooze_rejects_bad_duration():
    with pytest.raises(HTTPException) as exc:
        await api.snooze_notification_route(
            _oid(), api.SnoozeRequest(duration="3d"), _user()
        )
    assert exc.value.status_code == 422


@pytest.mark.asyncio
async def test_snooze_returns_until():
    doc = SimpleNamespace(snoozed_until=None)
    with patch.object(
        api.ns, "snooze_notification", new=AsyncMock(return_value=doc)
    ) as svc:
        out = await api.snooze_notification_route(
            _oid(), api.SnoozeRequest(duration="1h"), _user()
        )
    assert out == {"snoozed_until": None}
    assert svc.await_args.args[1] == "u1"
    assert svc.await_args.args[2] == "1h"


@pytest.mark.asyncio
async def test_snooze_returns_isoformat_until():
    until = datetime(2026, 10, 20, 12, 0, 0)
    doc = SimpleNamespace(snoozed_until=until)
    with patch.object(
        api.ns, "snooze_notification", new=AsyncMock(return_value=doc)
    ):
        out = await api.snooze_notification_route(
            _oid(), api.SnoozeRequest(duration="1h"), _user()
        )
    assert out == {"snoozed_until": until.isoformat()}


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "call",
    [
        lambda nid: api.archive_notification(nid, _user()),
        lambda nid: api.unarchive_notification(nid, _user()),
        lambda nid: api.delete_notification(nid, _user()),
        lambda nid: api.restore_notification(nid, _user()),
        lambda nid: api.snooze_notification_route(
            nid, api.SnoozeRequest(duration="1h"), _user()
        ),
        lambda nid: api.unsnooze_notification_route(nid, _user()),
    ],
)
async def test_invalid_object_id_raises_404(call):
    with pytest.raises(HTTPException) as exc:
        await call("not-an-object-id")
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_archived_filter_uses_archived_only_query():
    captured = {}

    class Chain:
        def __init__(self, items):
            self._items = items

        def sort(self, *_a, **_k):
            return self

        def limit(self, _n):
            return self

        async def to_list(self):
            return self._items

        async def delete(self):
            return None

    def fake_find(*args, **_kwargs):
        if len(args) == 1:
            captured["query"] = args[0]
        return Chain([])

    with patch.object(api.Notification, "find", side_effect=fake_find), patch.object(
        api, "_mute_context", new=AsyncMock(return_value=({}, False, None))
    ), patch.object(api, "_backfill_updated_at", new=AsyncMock()):
        out = await api.get_notifications(
            filter="archived",
            cursor=None,
            limit=20,
            unread=False,
            current_user=_user(),
        )
    assert out == {"items": [], "next_cursor": None}
    assert captured["query"]["archived_at"] == {"$ne": None}
    assert captured["query"]["deleted_at"] is None
    assert "metadata.important" not in captured["query"]


def test_scoped_query_ands_visibility():
    q = api._scoped_query("u1", "all", {}, True)
    assert "$and" in q
    assert any("deleted_at" in part for part in q["$and"])


@pytest.mark.asyncio
async def test_cursor_keeps_visibility_constraints():
    captured = {}
    cursor = api.encode_cursor(datetime.utcnow(), str(ObjectId()))

    class Chain:
        def sort(self, *_a, **_k):
            return self

        def limit(self, _n):
            return self

        async def to_list(self):
            return []

    def fake_find(query):
        captured["query"] = query
        return Chain()

    with patch.object(api.Notification, "find", side_effect=fake_find), patch.object(
        api, "_mute_context", new=AsyncMock(return_value=({}, True, None))
    ):
        out = await api.get_notifications(
            filter="all",
            cursor=cursor,
            limit=20,
            unread=False,
            current_user=_user(),
        )

    assert out == {"items": [], "next_cursor": None}
    parts = captured["query"]["$and"]
    assert any("deleted_at" in part for part in parts)
    assert any(
        "$or" in part
        and any("updated_at" in cond for cond in part["$or"])
        for part in parts
    )


@pytest.mark.asyncio
async def test_unread_count_uses_scoped_queries():
    queries = []

    def fake_find(query):
        queries.append(query)
        return SimpleNamespace(count=AsyncMock(return_value=0))

    paused_until = datetime(2026, 1, 1, 12, 0)
    with patch.object(api.Notification, "find", side_effect=fake_find), patch.object(
        api,
        "_mute_context",
        new=AsyncMock(return_value=({}, True, paused_until)),
    ), patch.object(api, "_survey_pending", new=AsyncMock(return_value=0)):
        out = await api.get_unread_count(current_user=_user())

    assert out["count"] == 0
    assert out["paused_until"] == paused_until.isoformat()
    assert len(queries) == 3
    for q in queries:
        assert q["is_read"] is False
        parts = q["$and"]
        assert any("deleted_at" in part for part in parts)
        assert any(
            "$or" in part
            and any("snoozed_until" in cond for cond in part["$or"])
            for part in parts
        )
    assert queries[0]["type"] == {"$in": ["like", "match"]}
    assert queries[1]["type"] == {"$in": ["message"]}
    assert queries[2]["type"] == {"$in": ["system", "survey", "promo"]}


@pytest.mark.asyncio
async def test_pause_accepts_preset():
    with patch.object(
        api.ns, "pause_notifications", new=AsyncMock()
    ) as pause:
        before = datetime.utcnow()
        out = await api.pause_notifications_route(
            api.PauseRequest(duration="30m"), _user()
        )
    until = datetime.fromisoformat(out["paused_until"])
    assert timedelta(minutes=29) < until - before < timedelta(minutes=31)
    pause.assert_awaited_once_with("u1", until)


@pytest.mark.asyncio
async def test_pause_accepts_explicit_utc_time():
    explicit = datetime(2030, 5, 1, 18, 30, tzinfo=timezone.utc)
    with patch.object(
        api.ns, "pause_notifications", new=AsyncMock()
    ) as pause:
        out = await api.pause_notifications_route(
            api.PauseRequest(until=explicit), _user()
        )
    expected = explicit.replace(tzinfo=None)
    assert out["paused_until"] == expected.isoformat()
    pause.assert_awaited_once_with("u1", expected)


@pytest.mark.asyncio
async def test_pause_rejects_invalid_duration():
    with pytest.raises(HTTPException) as exc:
        await api.pause_notifications_route(api.PauseRequest(duration="2w"), _user())
    assert exc.value.status_code == 422


@pytest.mark.asyncio
async def test_pause_rejects_past_time():
    with pytest.raises(HTTPException) as exc:
        await api.pause_notifications_route(
            api.PauseRequest(until=datetime.utcnow() - timedelta(minutes=1)),
            _user(),
        )
    assert exc.value.status_code == 422


@pytest.mark.asyncio
async def test_resume_clears_pause():
    with patch.object(
        api.ns, "resume_notifications", new=AsyncMock()
    ) as resume:
        out = await api.resume_notifications_route(_user())
    assert out == {"paused_until": None}
    resume.assert_awaited_once_with("u1")


@pytest.mark.asyncio
@pytest.mark.parametrize("duration", ["30m", "4h"])
async def test_snooze_accepts_new_presets(duration):
    doc = SimpleNamespace(snoozed_until=None)
    with patch.object(
        api.ns, "snooze_notification", new=AsyncMock(return_value=doc)
    ) as svc:
        await api.snooze_notification_route(
            _oid(), api.SnoozeRequest(duration=duration), _user()
        )
    assert svc.await_args.args[2] == duration


@pytest.mark.asyncio
async def test_trash_filter_lists_deleted_only():
    captured = {}

    class Chain:
        def sort(self, *_a, **_k):
            return self

        def limit(self, _n):
            return self

        async def to_list(self):
            return []

        async def delete(self):
            return None

    def fake_find(*args, **_kwargs):
        if len(args) == 1:
            captured["query"] = args[0]
        return Chain()

    with patch.object(api.Notification, "find", side_effect=fake_find), patch.object(
        api, "_mute_context", new=AsyncMock(return_value=({}, False, None))
    ), patch.object(api, "_backfill_updated_at", new=AsyncMock()):
        out = await api.get_notifications(
            filter="trash",
            cursor=None,
            limit=20,
            unread=False,
            current_user=_user(),
        )
    assert out == {"items": [], "next_cursor": None}
    assert captured["query"] == {"user_id": "u1", "deleted_at": {"$ne": None}}


@pytest.mark.asyncio
async def test_read_all_all_filter_marks_every_unread():
    update = AsyncMock(return_value=SimpleNamespace(modified_count=4))
    find = MagicMock(return_value=SimpleNamespace(update=update))
    with patch.object(api.Notification, "find", find), patch.object(
        api.manager, "send_personal_message", new=AsyncMock()
    ):
        out = await api.mark_all_as_read(filter="all", current_user=_user())
    assert out == {"updated": 4}
    find.assert_called_once_with({"user_id": "u1", "is_read": False})
    update.assert_awaited_once_with({"$set": {"is_read": True}})


@pytest.mark.asyncio
async def test_read_all_filter_scopes_bucket():
    update = AsyncMock(return_value=SimpleNamespace(modified_count=2))
    find = MagicMock(return_value=SimpleNamespace(update=update))
    with patch.object(api.Notification, "find", find), patch.object(
        api, "_mute_context", new=AsyncMock(return_value=({}, True, None))
    ), patch.object(api.manager, "send_personal_message", new=AsyncMock()):
        out = await api.mark_all_as_read(filter="social", current_user=_user())
    assert out == {"updated": 2}
    query = find.call_args.args[0]
    assert query["is_read"] is False
    assert any("deleted_at" in part for part in query["$and"])


@pytest.mark.asyncio
async def test_read_all_rejects_unknown_filter():
    with pytest.raises(HTTPException) as exc:
        await api.mark_all_as_read(filter="nope", current_user=_user())
    assert exc.value.status_code == 400


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "action,field,value",
    [
        ("archive", "archived_at", "now"),
        ("unarchive", "archived_at", None),
        ("delete", "deleted_at", "now"),
        ("restore", "deleted_at", None),
    ],
)
async def test_bulk_action_updates_owned_ids(action, field, value):
    ids = [str(ObjectId()), str(ObjectId())]
    update = AsyncMock(return_value=SimpleNamespace(modified_count=2))
    find = MagicMock(return_value=SimpleNamespace(update=update))
    with patch.object(api.Notification, "find", find), patch.object(
        api.manager, "send_personal_message", new=AsyncMock()
    ) as push:
        out = await api.bulk_action(
            api.BulkRequest(ids=ids, action=action), _user()
        )
    assert out == {"updated": 2}
    query = find.call_args.args[0]
    assert query["user_id"] == "u1"
    assert len(query["_id"]["$in"]) == 2
    changes = update.call_args.args[0]["$set"]
    if value == "now":
        assert isinstance(changes[field], datetime)
    else:
        assert changes[field] is None
    assert push.await_args.args[1]["action"] == "notifications_sync"


@pytest.mark.asyncio
async def test_bulk_action_marks_owned_ids_read():
    ids = [str(ObjectId())]
    update = AsyncMock(return_value=SimpleNamespace(modified_count=1))
    find = MagicMock(return_value=SimpleNamespace(update=update))
    with patch.object(api.Notification, "find", find), patch.object(
        api.manager, "send_personal_message", new=AsyncMock()
    ):
        out = await api.bulk_action(
            api.BulkRequest(ids=ids, action="read"), _user()
        )
    assert out == {"updated": 1}
    query = find.call_args.args[0]
    assert query["deleted_at"] is None
    assert update.call_args.args[0]["$set"] == {"is_read": True}


@pytest.mark.asyncio
async def test_bulk_action_rejects_unknown_action():
    with pytest.raises(HTTPException) as exc:
        await api.bulk_action(
            api.BulkRequest(ids=[_oid()], action="nope"), _user()
        )
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_bulk_action_ignores_invalid_ids():
    find = MagicMock()
    with patch.object(api.Notification, "find", find):
        out = await api.bulk_action(
            api.BulkRequest(ids=["bad-id"], action="archive"), _user()
        )
    assert out == {"updated": 0}
    find.assert_not_called()


@pytest.mark.asyncio
async def test_bulk_action_caps_ids():
    ids = [str(ObjectId()) for _ in range(150)]
    update = AsyncMock(return_value=SimpleNamespace(modified_count=100))
    find = MagicMock(return_value=SimpleNamespace(update=update))
    with patch.object(api.Notification, "find", find), patch.object(
        api.manager, "send_personal_message", new=AsyncMock()
    ):
        await api.bulk_action(api.BulkRequest(ids=ids, action="archive"), _user())
    assert len(find.call_args.args[0]["_id"]["$in"]) == 100
