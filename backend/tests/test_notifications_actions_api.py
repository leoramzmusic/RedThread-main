"""Tests for notification action endpoints and scoped counts (F2-2)."""

from datetime import datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

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
        api, "_mute_context", new=AsyncMock(return_value=({}, False))
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
        api, "_mute_context", new=AsyncMock(return_value=({}, True))
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

    with patch.object(api.Notification, "find", side_effect=fake_find), patch.object(
        api, "_mute_context", new=AsyncMock(return_value=({}, True))
    ), patch.object(api, "_survey_pending", new=AsyncMock(return_value=0)):
        out = await api.get_unread_count(current_user=_user())

    assert out["count"] == 0
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
