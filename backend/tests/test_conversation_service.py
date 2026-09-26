"""CARE F0 tests for conversation_service: pure builders + mocked orchestration."""

from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest

from src.models.conversation import Conversation, ConversationType
from src.models.relationship import (
    Relationship,
    RelationshipOrigin,
    RelationshipStatus,
    RelationshipType,
)
from src.services.conversation_service import (
    build_conversation_fields,
    build_match_relationship_fields,
    ensure_friend_conversation,
    ensure_match_conversation,
)


class TestBuildMatchRelationshipFields:
    def test_normalizes_id_order(self):
        f1 = build_match_relationship_fields("user_b", "user_a")
        f2 = build_match_relationship_fields("user_a", "user_b")
        assert (f1["user_a_id"], f1["user_b_id"]) == ("user_a", "user_b")
        assert f1 == f2

    def test_enums(self):
        f = build_match_relationship_fields("u1", "u2")
        assert f["type"] == RelationshipType.MATCH
        assert f["status"] == RelationshipStatus.ACTIVE
        assert f["origin"] == RelationshipOrigin.DISCOVER

    def test_stringifies_ids(self):
        f = build_match_relationship_fields("abc", "def")
        assert (f["user_a_id"], f["user_b_id"]) == ("abc", "def")


class TestBuildConversationFields:
    def test_fields(self):
        f = build_conversation_fields("rel1", "u1", "u2", ConversationType.MATCH)
        assert f == {
            "relationship_id": "rel1",
            "type": ConversationType.MATCH,
            "participants": ["u1", "u2"],
        }


@pytest.mark.asyncio
async def test_ensure_match_creates_relationship_and_conversation_when_missing():
    match = SimpleNamespace(user_id_1="u2", user_id_2="u1", matched_at=None)
    with patch.object(Relationship, "find_one", new=AsyncMock(return_value=None)) as rel_find, \
            patch.object(Relationship, "insert", new=AsyncMock()) as rel_insert, \
            patch.object(Conversation, "find_one", new=AsyncMock(return_value=None)) as conv_find, \
            patch.object(Conversation, "insert", new=AsyncMock()) as conv_insert:
        result = await ensure_match_conversation(match)

    rel_find.assert_awaited_once_with({
        "user_a_id": "u1",
        "user_b_id": "u2",
        "type": RelationshipType.MATCH,
    })
    rel_insert.assert_awaited_once()
    conv_find.assert_awaited_once()
    conv_insert.assert_awaited_once()
    assert isinstance(result, Conversation)
    assert result.participants == ["u1", "u2"]
    assert result.type == ConversationType.MATCH


@pytest.mark.asyncio
async def test_ensure_match_reuses_existing_relationship():
    existing_rel = Relationship(
        user_a_id="u1", user_b_id="u2",
        type=RelationshipType.MATCH,
        status=RelationshipStatus.ACTIVE,
        origin=RelationshipOrigin.DISCOVER,
    )
    match = SimpleNamespace(user_id_1="u1", user_id_2="u2", matched_at=None)
    with patch.object(Relationship, "find_one", new=AsyncMock(return_value=existing_rel)), \
            patch.object(Relationship, "insert", new=AsyncMock()) as rel_insert, \
            patch.object(Conversation, "find_one", new=AsyncMock(return_value=None)), \
            patch.object(Conversation, "insert", new=AsyncMock()) as conv_insert:
        result = await ensure_match_conversation(match)

    rel_insert.assert_not_awaited()
    conv_insert.assert_awaited_once()
    assert result.participants == ["u1", "u2"]


@pytest.mark.asyncio
async def test_ensure_match_is_idempotent_when_both_exist():
    existing_rel = Relationship(
        user_a_id="u1", user_b_id="u2",
        type=RelationshipType.MATCH,
        status=RelationshipStatus.ACTIVE,
        origin=RelationshipOrigin.DISCOVER,
    )
    existing_conv = Conversation(
        relationship_id="whatever",
        type=ConversationType.MATCH,
        participants=["u1", "u2"],
    )
    match = SimpleNamespace(user_id_1="u1", user_id_2="u2", matched_at=None)
    with patch.object(Relationship, "find_one", new=AsyncMock(return_value=existing_rel)), \
            patch.object(Relationship, "insert", new=AsyncMock()) as rel_insert, \
            patch.object(Conversation, "find_one", new=AsyncMock(return_value=existing_conv)), \
            patch.object(Conversation, "insert", new=AsyncMock()) as conv_insert:
        result = await ensure_match_conversation(match)

    rel_insert.assert_not_awaited()
    conv_insert.assert_not_awaited()
    assert result is existing_conv


@pytest.mark.asyncio
async def test_ensure_friend_creates_conversation_when_missing():
    rel = SimpleNamespace(id="rel1", user_a_id="u1", user_b_id="u2")
    with patch.object(Conversation, "find_one", new=AsyncMock(return_value=None)) as conv_find, \
            patch.object(Conversation, "insert", new=AsyncMock()) as conv_insert:
        result = await ensure_friend_conversation(rel)

    conv_find.assert_awaited_once_with({"relationship_id": "rel1"})
    conv_insert.assert_awaited_once()
    assert isinstance(result, Conversation)
    assert result.type == ConversationType.FRIEND
    assert result.participants == ["u1", "u2"]


@pytest.mark.asyncio
async def test_ensure_friend_is_idempotent():
    rel = SimpleNamespace(id="rel1", user_a_id="u1", user_b_id="u2")
    existing = Conversation(
        relationship_id="rel1",
        type=ConversationType.FRIEND,
        participants=["u1", "u2"],
    )
    with patch.object(Conversation, "find_one", new=AsyncMock(return_value=existing)), \
            patch.object(Conversation, "insert", new=AsyncMock()) as conv_insert:
        result = await ensure_friend_conversation(rel)

    conv_insert.assert_not_awaited()
    assert result is existing
