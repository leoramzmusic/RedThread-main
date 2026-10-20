"""Tests de la notificacion viva de mensajes en los paths de envio."""

import json
from contextlib import ExitStack
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import WebSocketDisconnect

import src.api.chat as chat
from src.models.conversation import ConversationType
from src.models.match import MatchStatus
from src.models.relationship import RelationshipStatus
from src.services import notification_service as ns


class FakeWebSocket:
    def __init__(self, messages):
        self._messages = list(messages)
        self.sent = []

    async def receive_text(self):
        if not self._messages:
            raise WebSocketDisconnect()
        return self._messages.pop(0)

    async def send_json(self, data):
        self.sent.append(data)


def chat_patches():
    return [
        patch.object(
            chat.User,
            "find_one",
            new=MagicMock(return_value=SimpleNamespace(update=AsyncMock())),
        ),
        patch.object(chat.manager, "connect", new=AsyncMock()),
        patch.object(chat.manager, "disconnect", new=MagicMock()),
        patch.object(chat.manager, "send_personal_message", new=AsyncMock()),
        patch.object(chat, "Message", new=MagicMock(side_effect=fake_message)),
        patch.object(chat.redis_service, "invalidar_usuario", new=AsyncMock()),
        patch.object(chat.kafka_service, "publish", new=AsyncMock()),
    ]


def fake_message(**kwargs):
    return SimpleNamespace(
        id="m1",
        created_at=kwargs["created_at"],
        insert=AsyncMock(),
        dict=MagicMock(return_value={}),
    )


@pytest.mark.asyncio
async def test_notify_new_message_full_doc():
    conv = SimpleNamespace(id="c1", is_muted_by=[])
    with patch.object(ns, "actor_snapshot", new=AsyncMock(return_value={"user_id": "him", "name": "El", "photo": None, "nickname": "el"})), \
         patch.object(ns, "emit_notification", new=AsyncMock(return_value="DOC")) as emit:
        result = await ns.notify_new_message(
            sender_id="him", recipient_id="me", conversation=conv,
            preview="hola" * 30, can_reply=True,
        )
    assert result == "DOC"
    kwargs = emit.await_args.kwargs
    assert kwargs["group_key"] == "message:c1"
    assert kwargs["user_id"] == "me"
    assert kwargs["metadata"]["conversation_id"] == "c1"
    assert kwargs["metadata"]["can_reply"] is True
    assert len(kwargs["metadata"]["preview"]) == 80
    assert kwargs["lock_actor"] is True


@pytest.mark.asyncio
async def test_self_send_is_ignored():
    conv = SimpleNamespace(id="c1", is_muted_by=[])
    assert await ns.notify_new_message(
        sender_id="me", recipient_id="me", conversation=conv, preview="x", can_reply=True
    ) is None


def make_conversation(cid="c1"):
    return SimpleNamespace(
        id=cid,
        type=ConversationType.FRIEND,
        participants=["me", "them"],
        relationship_id="r1",
        is_muted_by=[],
        increment_unread=MagicMock(),
        save=AsyncMock(),
    )


@pytest.mark.asyncio
async def test_rest_conversation_send_emits_notification():
    conv = make_conversation()
    with ExitStack() as stack:
        for patcher in chat_patches():
            stack.enter_context(patcher)
        stack.enter_context(
            patch.object(chat.Conversation, "get", new=AsyncMock(return_value=conv))
        )
        stack.enter_context(
            patch.object(
                chat.Relationship,
                "get",
                new=AsyncMock(
                    return_value=SimpleNamespace(status=RelationshipStatus.ACTIVE)
                ),
            )
        )
        notify = stack.enter_context(
            patch.object(ns, "notify_new_message", new=AsyncMock())
        )
        await chat.send_message(
            chat.SendMessageRequest(conversation_id="c1", content="hola"),
            current_user=SimpleNamespace(id="me"),
        )

    notify.assert_awaited_once_with(
        sender_id="me",
        recipient_id="them",
        conversation=conv,
        preview="hola",
        can_reply=True,
    )


@pytest.mark.asyncio
async def test_ws_conversation_send_emits_notification():
    conv = make_conversation()
    ws = FakeWebSocket(
        [
            json.dumps(
                {
                    "action": "send_message",
                    "conversation_id": "c1",
                    "content": "hola",
                    "temp_id": "t1",
                }
            )
        ]
    )
    with ExitStack() as stack:
        for patcher in chat_patches():
            stack.enter_context(patcher)
        stack.enter_context(
            patch.object(chat.Conversation, "get", new=AsyncMock(return_value=conv))
        )
        stack.enter_context(
            patch.object(
                chat.Relationship,
                "get",
                new=AsyncMock(
                    return_value=SimpleNamespace(status=RelationshipStatus.ACTIVE)
                ),
            )
        )
        notify = stack.enter_context(
            patch.object(ns, "notify_new_message", new=AsyncMock())
        )
        await chat.websocket_endpoint(ws, "me")

    notify.assert_awaited_once_with(
        sender_id="me",
        recipient_id="them",
        conversation=conv,
        preview="hola",
        can_reply=True,
    )


def make_match(status=MatchStatus.MATCHED):
    return SimpleNamespace(user_id_1="me", user_id_2="them", status=status)


@pytest.mark.asyncio
async def test_ws_legacy_without_conversation_skips_notification():
    ws = FakeWebSocket(
        [
            json.dumps(
                {
                    "action": "send_message",
                    "match_id": "m1",
                    "content": "hola",
                    "temp_id": "t1",
                }
            )
        ]
    )
    find = AsyncMock(return_value=None)
    with ExitStack() as stack:
        for patcher in chat_patches():
            stack.enter_context(patcher)
        stack.enter_context(
            patch.object(chat.Match, "get", new=AsyncMock(return_value=make_match()))
        )
        stack.enter_context(patch.object(ns, "find_conversation_between", new=find))
        notify = stack.enter_context(
            patch.object(ns, "notify_new_message", new=AsyncMock())
        )
        await chat.websocket_endpoint(ws, "me")

    find.assert_awaited_once_with("me", "them")
    notify.assert_not_awaited()


@pytest.mark.asyncio
async def test_ws_legacy_with_conversation_emits_notification():
    conv = make_conversation()
    ws = FakeWebSocket(
        [
            json.dumps(
                {
                    "action": "send_message",
                    "match_id": "m1",
                    "content": "hola",
                    "temp_id": "t1",
                }
            )
        ]
    )
    with ExitStack() as stack:
        for patcher in chat_patches():
            stack.enter_context(patcher)
        stack.enter_context(
            patch.object(chat.Match, "get", new=AsyncMock(return_value=make_match()))
        )
        stack.enter_context(
            patch.object(
                ns, "find_conversation_between", new=AsyncMock(return_value=conv)
            )
        )
        notify = stack.enter_context(
            patch.object(ns, "notify_new_message", new=AsyncMock())
        )
        await chat.websocket_endpoint(ws, "me")

    notify.assert_awaited_once_with(
        sender_id="me",
        recipient_id="them",
        conversation=conv,
        preview="hola",
        can_reply=True,
    )
