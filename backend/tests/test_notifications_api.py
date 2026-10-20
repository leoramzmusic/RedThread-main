"""Tests for notifications API 2.0 (F1): buckets, counts, survey pending, sync."""

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


@pytest.mark.asyncio
async def test_survey_pending_counts_missing_dimensions():
    prefs = [SimpleNamespace(dimension="a"), SimpleNamespace(dimension="b")]
    with patch(
        "src.care.preferences.service.list_user_preferences",
        new=AsyncMock(return_value=prefs),
    ), patch(
        "src.care.preferences.service.CARE_DIMENSION_KEYS", ("a", "b", "c", "d")
    ):
        assert await api._survey_pending("u1") == 2


@pytest.mark.asyncio
async def test_survey_pending_failure_returns_zero():
    with patch(
        "src.care.preferences.service.list_user_preferences",
        new=AsyncMock(side_effect=RuntimeError("db down")),
    ):
        assert await api._survey_pending("u1") == 0


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
