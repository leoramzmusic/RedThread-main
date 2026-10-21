"""Tests for notification_service: emision, agrupacion bump 24h, silencios."""

from datetime import datetime, time, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest

from src.models.notification import Notification
from src.services import notification_service as ns


def fake_profile(uid, name="Ana", nickname="ana"):
    return SimpleNamespace(
        user_id=uid, display_name=name, photos=["/p.jpg"], nickname=nickname
    )


@pytest.fixture
def db():
    with patch.object(
        Notification, "find_one", new=AsyncMock(return_value=None)
    ) as find_one, patch.object(
        Notification, "insert", new=AsyncMock()
    ) as insert, patch.object(
        Notification, "save", new=AsyncMock()
    ) as save, patch.object(
        ns, "_push_new_notification", new=AsyncMock()
    ) as push, patch.object(
        ns.Profile, "find_one", new=AsyncMock(return_value=fake_profile("liker"))
    ) as prof, patch.object(
        ns.Conversation,
        "find_one",
        new=AsyncMock(return_value=SimpleNamespace(id="conv1")),
    ):
        yield SimpleNamespace(
            find_one=find_one, insert=insert, save=save, push=push, prof=prof
        )


@pytest.mark.asyncio
async def test_like_creates_single_group_doc(db):
    doc = await ns.emit_like_notification(
        liker_id="liker", recipient_id="me", shown_media_id="m1"
    )
    db.insert.assert_awaited_once()
    assert doc.type == "like"
    assert doc.group_key == "like:photo:m1"
    assert doc.target_type == "profile"
    assert doc.target_id == "liker"
    assert doc.actor_count == 1
    assert doc.actors[0]["user_id"] == "liker"
    assert doc.actors[0]["nickname"] == "ana"
    assert doc.metadata["shown_media_id"] == "m1"
    db.push.assert_awaited_once()


@pytest.mark.asyncio
async def test_like_without_media_uses_profile_group(db):
    doc = await ns.emit_like_notification(liker_id="liker", recipient_id="me")
    assert doc.group_key == "like:profile"


@pytest.mark.asyncio
async def test_bump_within_window_updates_and_switches_target(db):
    existing = Notification(
        user_id="me",
        type="like",
        content="old",
        group_key="like:photo:m1",
        target_type="profile",
        target_id="liker",
        is_read=True,
        metadata={"actor_ids": ["liker"], "last_actor_id": "liker"},
    )
    existing.actors = [
        {"user_id": "liker", "name": "Ana", "photo": None, "nickname": "ana"}
    ]
    existing.actor_count = 1
    db.find_one.return_value = existing
    doc = await ns.emit_like_notification(
        liker_id="otro", recipient_id="me", shown_media_id="m1"
    )
    db.insert.assert_not_awaited()
    db.save.assert_awaited_once()
    assert doc is existing
    assert doc.actor_count == 2
    assert doc.is_read is False
    assert doc.target_type == "likes"
    assert doc.target_id == "m1"
    assert doc.related_user_id == "otro"
    assert doc.updated_at > doc.created_at
    db.push.assert_awaited_once()


@pytest.mark.asyncio
async def test_actor_already_seen_is_not_recounted(db):
    existing = Notification(
        user_id="me",
        type="like",
        content="x",
        group_key="like:profile",
        metadata={"actor_ids": ["liker"], "last_actor_id": "liker"},
    )
    existing.actors = [
        {"user_id": "liker", "name": "Ana", "photo": None, "nickname": "ana"}
    ]
    existing.actor_count = 1
    db.find_one.return_value = existing
    doc = await ns.emit_like_notification(liker_id="liker", recipient_id="me")
    assert doc.actor_count == 1


@pytest.mark.asyncio
async def test_actor_cap_keeps_three_but_counts_all(db):
    existing = Notification(
        user_id="me",
        type="like",
        content="x",
        group_key="like:profile",
        metadata={"actor_ids": ["a1", "a2", "a3", "a4"], "last_actor_id": "a4"},
    )
    existing.actors = [
        {"user_id": "a1", "name": "A", "photo": None, "nickname": "a"},
        {"user_id": "a2", "name": "B", "photo": None, "nickname": "b"},
        {"user_id": "a3", "name": "C", "photo": None, "nickname": "c"},
    ]
    existing.actor_count = 4
    db.find_one.return_value = existing
    doc = await ns.emit_like_notification(liker_id="a5", recipient_id="me")
    assert len(doc.actors) == 3
    assert doc.actor_count == 5


@pytest.mark.asyncio
async def test_superlike_never_groups(db):
    doc = await ns.emit_like_notification(
        liker_id="liker", recipient_id="me", shown_media_id="m1", is_superlike=True
    )
    assert doc.group_key is None
    assert doc.metadata["superlike"] is True
    assert "Super" in doc.content


@pytest.mark.asyncio
async def test_match_creates_one_doc_per_user(db):
    docs = await ns.emit_match_notification(
        user_a_id="a", user_b_id="b", match_id="match1"
    )
    assert len(docs) == 2
    assert {d.user_id for d in docs} == {"a", "b"}
    assert all(d.group_key is None for d in docs)
    assert all(d.target_type == "chat" for d in docs)
    assert db.insert.await_count == 2


@pytest.mark.asyncio
async def test_message_muted_conversation_returns_none(db):
    conv = SimpleNamespace(id="c1", is_muted_by=["me"])
    result = await ns.notify_new_message(
        sender_id="him",
        recipient_id="me",
        conversation=conv,
        preview="hola",
        can_reply=True,
    )
    assert result is None
    db.insert.assert_not_awaited()


@pytest.mark.asyncio
async def test_message_bump_counts_messages_and_resets_read(db):
    conv = SimpleNamespace(id="c1", is_muted_by=[])
    existing = Notification(
        user_id="me",
        type="message",
        content="viejo",
        group_key="message:c1",
        is_read=True,
        metadata={"preview": "viejo"},
    )
    existing.actors = [
        {"user_id": "him", "name": "El", "photo": None, "nickname": "el"}
    ]
    existing.actor_count = 3
    db.find_one.return_value = existing
    doc = await ns.notify_new_message(
        sender_id="him",
        recipient_id="me",
        conversation=conv,
        preview="x" * 100,
        can_reply=False,
    )
    assert doc.actor_count == 4
    assert doc.is_read is False
    assert len(doc.metadata["preview"]) == 80
    assert doc.metadata["can_reply"] is False
    assert doc.metadata["conversation_id"] == "c1"


@pytest.mark.asyncio
async def test_system_notification_with_url_and_important(db):
    doc = await ns.emit_system_notification(
        user_id="me",
        content="Encuesta",
        notif_type="survey",
        target_url="/home?encuesta=1",
        important=True,
    )
    assert doc.type == "survey"
    assert doc.target_type == "url"
    assert doc.target_id == "/home?encuesta=1"
    assert doc.metadata["important"] is True


class TestShouldPush:
    def settings(self, **over):
        base = SimpleNamespace(
            notifications_enabled=True,
            notification_mutes={
                "social": False,
                "messages": False,
                "system": False,
                "promos": False,
            },
            do_not_disturb={
                "enabled": False,
                "start_time": "22:00",
                "end_time": "08:00",
            },
        )
        for k, v in over.items():
            setattr(base, k, v)
        return base

    def test_master_off_blocks_except_important(self):
        s = self.settings(notifications_enabled=False)
        assert ns.should_push(s, "like", None) is False
        assert ns.should_push(s, "system", {"important": True}) is True

    def test_muted_bucket_blocks(self):
        s = self.settings(
            notification_mutes={
                "social": True,
                "messages": False,
                "system": False,
                "promos": False,
            }
        )
        assert ns.should_push(s, "like", None) is False
        assert ns.should_push(s, "match", None) is False
        assert ns.should_push(s, "message", None) is True

    def test_important_ignores_mutes(self):
        s = self.settings(
            notification_mutes={
                "social": True,
                "messages": True,
                "system": True,
                "promos": True,
            }
        )
        assert ns.should_push(s, "system", {"important": True}) is True

    def test_promo_respects_promos_and_system_mutes(self):
        s1 = self.settings(
            notification_mutes={
                "social": False,
                "messages": False,
                "system": False,
                "promos": True,
            }
        )
        s2 = self.settings(
            notification_mutes={
                "social": False,
                "messages": False,
                "system": True,
                "promos": False,
            }
        )
        assert ns.should_push(s1, "promo", None) is False
        assert ns.should_push(s2, "promo", None) is False

    def test_dnd_window_crossing_midnight(self):
        s = self.settings(
            do_not_disturb={"enabled": True, "start_time": "22:00", "end_time": "08:00"}
        )
        assert ns.should_push(s, "like", None, now=time(23, 30)) is False
        assert ns.should_push(s, "like", None, now=time(12, 0)) is True

    def test_active_pause_blocks_push_except_important(self):
        s = self.settings(
            notifications_paused_until=datetime.utcnow() + timedelta(minutes=30)
        )
        assert ns.should_push(s, "like", None) is False
        assert ns.should_push(s, "message", None) is False
        assert ns.should_push(s, "system", {"important": True}) is True

    def test_expired_pause_allows_push(self):
        s = self.settings(
            notifications_paused_until=datetime.utcnow() - timedelta(minutes=1)
        )
        assert ns.should_push(s, "like", None) is True

    def test_aware_pause_blocks_push(self):
        s = self.settings(
            notifications_paused_until=datetime.now(timezone.utc)
            + timedelta(minutes=30)
        )
        assert ns.should_push(s, "like", None) is False

    def test_no_settings_pushes(self):
        assert ns.should_push(None, "like", None) is True


class TestPauseSchedule:
    RULE = {
        "days": [0, 1, 2, 3, 4],
        "start": "18:00",
        "end": "08:00",
        "utc_offset_minutes": 0,
    }

    def test_active_inside_window(self):
        now = datetime(2026, 10, 19, 19, 0)  # lunes
        assert ns.pause_rule_end(self.RULE, now) == datetime(2026, 10, 20, 8, 0)

    def test_inactive_outside_window(self):
        now = datetime(2026, 10, 19, 12, 0)  # lunes al mediodia
        assert ns.pause_rule_end(self.RULE, now) is None

    def test_inactive_on_unselected_day(self):
        now = datetime(2026, 10, 24, 19, 0)  # sábado
        assert ns.pause_rule_end(self.RULE, now) is None

    def test_window_from_previous_day(self):
        now = datetime(2026, 10, 20, 2, 0)  # martes de madrugada
        assert ns.pause_rule_end(self.RULE, now) == datetime(2026, 10, 20, 8, 0)

    def test_same_day_window(self):
        rule = {"days": [0], "start": "09:00", "end": "17:00"}
        now = datetime(2026, 10, 19, 10, 0)
        assert ns.pause_rule_end(rule, now) == datetime(2026, 10, 19, 17, 0)
        assert ns.pause_rule_end(rule, datetime(2026, 10, 19, 18, 0)) is None

    def test_offset_is_applied(self):
        rule = {
            "days": [0],
            "start": "18:00",
            "end": "08:00",
            "utc_offset_minutes": 120,
        }
        # 17:00 UTC son las 19:00 en +02:00 -> dentro de la ventana
        assert ns.pause_rule_end(rule, datetime(2026, 10, 19, 17, 0)) is not None
        # 15:00 UTC son las 17:00 locales -> fuera
        assert ns.pause_rule_end(rule, datetime(2026, 10, 19, 15, 0)) is None

    def test_schedule_pause_end_takes_latest(self):
        rules = [
            {"days": [0], "start": "09:00", "end": "12:00"},
            {"days": [0], "start": "10:00", "end": "18:00"},
        ]
        now = datetime(2026, 10, 19, 10, 30)
        assert ns.schedule_pause_end(rules, now) == datetime(2026, 10, 19, 18, 0)

    def test_effective_pause_until_combines_one_off_and_schedule(self):
        settings = SimpleNamespace(
            notifications_paused_until=datetime(2026, 10, 19, 23, 0),
            notification_pause_schedule=[
                {"days": [0], "start": "09:00", "end": "18:00"}
            ],
        )
        now = datetime(2026, 10, 19, 10, 30)
        assert ns.effective_pause_until(settings, now) == datetime(2026, 10, 19, 23, 0)

    def test_should_push_blocked_by_schedule(self):
        settings = SimpleNamespace(
            notifications_enabled=True,
            notification_mutes={},
            do_not_disturb={"enabled": False, "start_time": "22:00", "end_time": "08:00"},
            notifications_paused_until=None,
            # 00:00 -> 00:00 cubre las 24h de los días indicados
            notification_pause_schedule=[
                {"days": [0, 1, 2, 3, 4, 5, 6], "start": "00:00", "end": "00:00"}
            ],
        )
        assert ns.should_push(settings, "like", None) is False
        assert ns.should_push(settings, "system", {"important": True}) is True

    def test_normalize_pause_rule_validates(self):
        rule = ns.normalize_pause_rule(
            [5, 0, 0], "18:00", "08:00", "Europe/Madrid", 120
        )
        assert rule == {
            "days": [0, 5],
            "start": "18:00",
            "end": "08:00",
            "timezone": "Europe/Madrid",
            "utc_offset_minutes": 120,
        }
        with pytest.raises(ValueError):
            ns.normalize_pause_rule([], "18:00", "08:00")
        with pytest.raises(ValueError):
            ns.normalize_pause_rule([0], "25:00", "08:00")
        with pytest.raises(ValueError):
            ns.normalize_pause_rule([0], "18:00", "nope")


class TestVisibilityQuery:
    def test_filter_social_maps_types(self):
        q = ns.visibility_query("me", "social", {}, True)
        assert q["type"] == {"$in": ["like", "match"]}

    def test_master_off_only_important(self):
        q = ns.visibility_query("me", "all", {}, False)
        assert q["metadata.important"] is True

    def test_muted_bucket_excluded_unless_important(self):
        q = ns.visibility_query("me", "all", {"social": True}, True)
        assert q["$or"] == [
            {"type": {"$nin": ["like", "match"]}},
            {"metadata.important": True},
        ]

    def test_promos_mute_excludes_only_promo(self):
        q = ns.visibility_query("me", "system", {"promos": True}, True)
        assert {"type": {"$nin": ["promo"]}} in q.get("$or", [])
