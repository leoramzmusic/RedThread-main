"""Tests for notifications API 2.0 (F1): buckets, counts, survey pending, sync."""

from datetime import datetime, timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest

from src.api import notifications as api
from src.services import notification_service as ns


def test_bucket_types_social():
    assert api._bucket_types("social") == ["like", "match"]


def test_bucket_types_system():
    assert api._bucket_types("system") == ["system", "survey", "promo"]


def test_bucket_types_rejects_messages():
    with pytest.raises(ValueError):
        api._bucket_types("messages")


def test_compose_counts_includes_survey_once():
    got = api._compose_counts(social=3, messages=2, system_docs=1, survey_pending=4)
    assert got == {
        "count": 7,
        "all": 7,
        "social": 3,
        "messages": 2,
        "system": 2,
        "survey_pending": 4,
    }


def test_compose_counts_without_survey():
    got = api._compose_counts(social=0, messages=0, system_docs=0, survey_pending=0)
    assert got == {
        "count": 0,
        "all": 0,
        "social": 0,
        "messages": 0,
        "system": 0,
        "survey_pending": 0,
    }


def _reminder_settings(mutes=None, snoozes=None):
    return SimpleNamespace(
        reminder_mutes=mutes or [],
        reminder_snoozes=snoozes or {},
        save=AsyncMock(),
    )


@pytest.mark.asyncio
async def test_survey_pending_counts_missing_dimensions():
    prefs = [SimpleNamespace(dimension="a"), SimpleNamespace(dimension="b")]
    settings = _reminder_settings()
    with patch(
        "src.care.preferences.service.list_user_preferences",
        new=AsyncMock(return_value=prefs),
    ), patch(
        "src.care.preferences.service.CARE_DIMENSION_KEYS", ("a", "b", "c", "d")
    ), patch.object(
        api.UserSettings, "find_one", new=AsyncMock(return_value=settings)
    ):
        assert await api._survey_pending("u1") == 2


@pytest.mark.asyncio
async def test_survey_pending_hidden_by_forever_reminder_mute():
    settings = _reminder_settings(mutes=["care_preferences"])
    prefs = [SimpleNamespace(dimension="a")]
    with patch(
        "src.care.preferences.service.list_user_preferences",
        new=AsyncMock(return_value=prefs),
    ), patch(
        "src.care.preferences.service.CARE_DIMENSION_KEYS", ("a", "b")
    ), patch.object(
        api.UserSettings, "find_one", new=AsyncMock(return_value=settings)
    ):
        assert await api._survey_pending("u1") == 0


@pytest.mark.asyncio
async def test_survey_pending_hidden_by_active_reminder_snooze():
    settings = _reminder_settings(
        snoozes={"care_preferences": datetime.utcnow() + timedelta(hours=1)}
    )
    prefs = [SimpleNamespace(dimension="a")]
    with patch(
        "src.care.preferences.service.list_user_preferences",
        new=AsyncMock(return_value=prefs),
    ), patch(
        "src.care.preferences.service.CARE_DIMENSION_KEYS", ("a", "b")
    ), patch.object(
        api.UserSettings, "find_one", new=AsyncMock(return_value=settings)
    ):
        assert await api._survey_pending("u1") == 0


@pytest.mark.asyncio
async def test_survey_pending_returns_after_reminder_snooze_expires():
    settings = _reminder_settings(
        snoozes={"care_preferences": datetime.utcnow() - timedelta(minutes=1)}
    )
    prefs = [SimpleNamespace(dimension="a")]
    with patch(
        "src.care.preferences.service.list_user_preferences",
        new=AsyncMock(return_value=prefs),
    ), patch(
        "src.care.preferences.service.CARE_DIMENSION_KEYS", ("a", "b")
    ), patch.object(
        api.UserSettings, "find_one", new=AsyncMock(return_value=settings)
    ):
        assert await api._survey_pending("u1") == 1


@pytest.mark.asyncio
async def test_survey_pending_failure_returns_zero():
    with patch(
        "src.care.preferences.service.list_user_preferences",
        new=AsyncMock(side_effect=RuntimeError("db down")),
    ):
        assert await api._survey_pending("u1") == 0


def test_pinned_first_keeps_updated_order_within_groups():
    now = datetime.utcnow()
    newest = SimpleNamespace(id="newest", pinned_at=None, updated_at=now)
    pinned = SimpleNamespace(
        id="pinned", pinned_at=now - timedelta(days=1), updated_at=now - timedelta(days=2)
    )
    oldest = SimpleNamespace(
        id="oldest", pinned_at=None, updated_at=now - timedelta(days=3)
    )

    ordered = api._pinned_first([newest, pinned, oldest])

    assert [doc.id for doc in ordered] == ["pinned", "newest", "oldest"]


@pytest.mark.asyncio
async def test_backfill_updated_at_copies_created_at():
    created = datetime(2026, 9, 1, 12, 0, 0)
    docs = [
        SimpleNamespace(created_at=created, updated_at=None, save=AsyncMock()),
        SimpleNamespace(created_at=None, updated_at=None, save=AsyncMock()),
    ]
    to_list = AsyncMock(return_value=docs)

    def limit(n):
        assert n == 500
        return SimpleNamespace(to_list=to_list)

    chain = SimpleNamespace(limit=limit)
    with patch.object(api.Notification, "find", return_value=chain) as find:
        updated = await api._backfill_updated_at("u1")
    assert updated == 2
    find.assert_called_once_with(
        {"user_id": "u1", "updated_at": {"$exists": False}}
    )
    assert docs[0].updated_at == created
    assert isinstance(docs[1].updated_at, datetime)
    docs[0].save.assert_awaited_once()
    docs[1].save.assert_awaited_once()
    to_list.assert_awaited_once()


@pytest.mark.asyncio
async def test_read_bucket_updates_and_emits():
    result = SimpleNamespace(modified_count=2)
    chain = SimpleNamespace(update=AsyncMock(return_value=result))
    with patch.object(
        api.Notification, "find", return_value=chain
    ) as find, patch.object(
        api.manager, "send_personal_message", new=AsyncMock()
    ) as push:
        out = await api.read_bucket(
            api.ReadBucketRequest(bucket="social"), SimpleNamespace(id="u1")
        )
    assert out == {"updated": 2}
    find.assert_called_once()
    push.assert_awaited_once()
    assert push.await_args.args[1]["action"] == "notifications_bucket_read"


@pytest.mark.asyncio
async def test_read_bucket_rejects_messages():
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc:
        await api.read_bucket(
            api.ReadBucketRequest(bucket="messages"), SimpleNamespace(id="u1")
        )
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_read_all_uses_dict_query_and_emits():
    chain = SimpleNamespace(
        update=AsyncMock(return_value=SimpleNamespace(modified_count=2))
    )
    with patch.object(
        api.Notification, "find", return_value=chain
    ) as find, patch.object(
        api.manager, "send_personal_message", new=AsyncMock()
    ) as push:
        out = await api.mark_all_as_read("all", SimpleNamespace(id="u1"))
    assert out == {"updated": 2}
    find.assert_called_once_with({"user_id": "u1", "is_read": False})
    push.assert_awaited_once_with("u1", {"action": "notifications_read_all"})


@pytest.mark.asyncio
async def test_mark_message_notification_read_updates_and_syncs():
    chain = SimpleNamespace(update=AsyncMock(return_value=None))
    with patch.object(ns.Notification, "find", return_value=chain), patch.object(
        ns.manager, "send_personal_message", new=AsyncMock()
    ) as push:
        await ns.mark_message_notification_read("u1", "c1")
    assert chain.update.await_count == 1
    push.assert_awaited_once_with("u1", {"action": "notifications_sync"})


def test_user_payload_from_profile():
    profile = SimpleNamespace(
        display_name="Ana", photos=["/a.jpg"], nickname="ana"
    )
    assert api._user_payload(profile) == {
        "name": "Ana",
        "photo": "/a.jpg",
        "nickname": "ana",
    }
