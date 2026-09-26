"""CARE F0 tests for conversation_service: pure builders + mocked orchestration."""

from datetime import datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from pymongo.errors import DuplicateKeyError

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
async def test_ensure_match_upserts_relationship_and_conversation_when_missing():
    match = SimpleNamespace(user_id_1="u2", user_id_2="u1", matched_at=None)
    rel = Relationship(
        user_a_id="u1", user_b_id="u2",
        type=RelationshipType.MATCH,
        status=RelationshipStatus.ACTIVE,
        origin=RelationshipOrigin.DISCOVER,
    )
    conv = Conversation(
        relationship_id=str(rel.id),
        type=ConversationType.MATCH,
        participants=["u1", "u2"],
    )
    rel_col = MagicMock()
    rel_col.find_one_and_update = AsyncMock(return_value={"_id": "r1"})
    conv_col = MagicMock()
    conv_col.find_one_and_update = AsyncMock(return_value={"_id": "c1"})
    with patch.object(Relationship, "get_motor_collection", return_value=rel_col), \
            patch.object(Relationship, "find_one", new=AsyncMock(return_value=rel)) as rel_find, \
            patch.object(Conversation, "get_motor_collection", return_value=conv_col), \
            patch.object(Conversation, "find_one", new=AsyncMock(return_value=conv)) as conv_find:
        result = await ensure_match_conversation(match)

    rel_col.find_one_and_update.assert_awaited_once()
    rel_query, rel_update = rel_col.find_one_and_update.await_args.args
    assert rel_query == {
        "user_a_id": "u1",
        "user_b_id": "u2",
        "type": RelationshipType.MATCH,
    }
    assert rel_col.find_one_and_update.await_args.kwargs == {"upsert": True}
    rel_insert = rel_update["$setOnInsert"]
    assert rel_insert["user_a_id"] == "u1"
    assert rel_insert["user_b_id"] == "u2"
    assert rel_insert["type"] == RelationshipType.MATCH
    assert rel_insert["status"] == RelationshipStatus.ACTIVE
    assert rel_insert["origin"] == RelationshipOrigin.DISCOVER
    assert isinstance(rel_insert["created_at"], datetime)
    assert "matched_at" not in rel_insert
    rel_find.assert_awaited_once_with(rel_query)

    conv_col.find_one_and_update.assert_awaited_once()
    conv_query, conv_update = conv_col.find_one_and_update.await_args.args
    assert conv_query == {"relationship_id": str(rel.id)}
    assert conv_col.find_one_and_update.await_args.kwargs == {"upsert": True}
    conv_insert = conv_update["$setOnInsert"]
    assert conv_insert["relationship_id"] == str(rel.id)
    assert conv_insert["type"] == ConversationType.MATCH
    assert conv_insert["participants"] == ["u1", "u2"]
    assert isinstance(conv_insert["created_at"], datetime)
    conv_find.assert_awaited_once_with(conv_query)
    assert result is conv


@pytest.mark.asyncio
async def test_ensure_match_includes_matched_at_when_provided():
    matched_at = datetime(2026, 9, 26, 12, 0, 0)
    match = SimpleNamespace(user_id_1="u1", user_id_2="u2", matched_at=matched_at)
    rel = Relationship(
        user_a_id="u1", user_b_id="u2",
        type=RelationshipType.MATCH,
        status=RelationshipStatus.ACTIVE,
        origin=RelationshipOrigin.DISCOVER,
    )
    conv = Conversation(
        relationship_id=str(rel.id),
        type=ConversationType.MATCH,
        participants=["u1", "u2"],
    )
    rel_col = MagicMock()
    rel_col.find_one_and_update = AsyncMock(return_value={})
    conv_col = MagicMock()
    conv_col.find_one_and_update = AsyncMock(return_value={})
    with patch.object(Relationship, "get_motor_collection", return_value=rel_col), \
            patch.object(Relationship, "find_one", new=AsyncMock(return_value=rel)), \
            patch.object(Conversation, "get_motor_collection", return_value=conv_col), \
            patch.object(Conversation, "find_one", new=AsyncMock(return_value=conv)):
        await ensure_match_conversation(match)

    rel_insert = rel_col.find_one_and_update.await_args.args[1]["$setOnInsert"]
    assert rel_insert["matched_at"] == matched_at


@pytest.mark.asyncio
async def test_ensure_match_is_idempotent_when_both_exist():
    existing_rel = Relationship(
        user_a_id="u1", user_b_id="u2",
        type=RelationshipType.MATCH,
        status=RelationshipStatus.ACTIVE,
        origin=RelationshipOrigin.DISCOVER,
    )
    existing_conv = Conversation(
        relationship_id=str(existing_rel.id),
        type=ConversationType.MATCH,
        participants=["u1", "u2"],
    )
    match = SimpleNamespace(user_id_1="u1", user_id_2="u2", matched_at=None)
    rel_col = MagicMock()
    rel_col.find_one_and_update = AsyncMock(return_value={})
    conv_col = MagicMock()
    conv_col.find_one_and_update = AsyncMock(return_value={})
    with patch.object(Relationship, "get_motor_collection", return_value=rel_col), \
            patch.object(Relationship, "find_one", new=AsyncMock(return_value=existing_rel)), \
            patch.object(Conversation, "get_motor_collection", return_value=conv_col), \
            patch.object(Conversation, "find_one", new=AsyncMock(return_value=existing_conv)) as conv_find:
        result = await ensure_match_conversation(match)

    rel_col.find_one_and_update.assert_awaited_once()
    conv_col.find_one_and_update.assert_awaited_once()
    conv_find.assert_awaited_once_with({"relationship_id": str(existing_rel.id)})
    assert result is existing_conv


@pytest.mark.asyncio
async def test_ensure_match_relationship_duplicate_key_falls_back_to_find():
    match = SimpleNamespace(user_id_1="u1", user_id_2="u2", matched_at=None)
    existing_rel = Relationship(
        user_a_id="u1", user_b_id="u2",
        type=RelationshipType.MATCH,
        status=RelationshipStatus.ACTIVE,
        origin=RelationshipOrigin.DISCOVER,
    )
    existing_conv = Conversation(
        relationship_id=str(existing_rel.id),
        type=ConversationType.MATCH,
        participants=["u1", "u2"],
    )
    rel_col = MagicMock()
    rel_col.find_one_and_update = AsyncMock(side_effect=DuplicateKeyError("E11000 duplicate key"))
    conv_col = MagicMock()
    conv_col.find_one_and_update = AsyncMock(return_value={})
    with patch.object(Relationship, "get_motor_collection", return_value=rel_col), \
            patch.object(Relationship, "find_one", new=AsyncMock(return_value=existing_rel)) as rel_find, \
            patch.object(Conversation, "get_motor_collection", return_value=conv_col), \
            patch.object(Conversation, "find_one", new=AsyncMock(return_value=existing_conv)):
        result = await ensure_match_conversation(match)

    rel_col.find_one_and_update.assert_awaited_once()
    rel_find.assert_awaited_once_with({
        "user_a_id": "u1",
        "user_b_id": "u2",
        "type": RelationshipType.MATCH,
    })
    assert result is existing_conv


@pytest.mark.asyncio
async def test_ensure_friend_creates_conversation_when_missing():
    rel = SimpleNamespace(id="rel1", user_a_id="u1", user_b_id="u2")
    conv = Conversation(
        relationship_id="rel1",
        type=ConversationType.FRIEND,
        participants=["u1", "u2"],
    )
    conv_col = MagicMock()
    conv_col.find_one_and_update = AsyncMock(return_value={})
    with patch.object(Conversation, "get_motor_collection", return_value=conv_col), \
            patch.object(Conversation, "find_one", new=AsyncMock(return_value=conv)) as conv_find:
        result = await ensure_friend_conversation(rel)

    conv_query, conv_update = conv_col.find_one_and_update.await_args.args
    assert conv_query == {"relationship_id": "rel1"}
    assert conv_col.find_one_and_update.await_args.kwargs == {"upsert": True}
    conv_insert = conv_update["$setOnInsert"]
    assert conv_insert["relationship_id"] == "rel1"
    assert conv_insert["type"] == ConversationType.FRIEND
    assert conv_insert["participants"] == ["u1", "u2"]
    assert isinstance(conv_insert["created_at"], datetime)
    conv_find.assert_awaited_once_with(conv_query)
    assert result is conv


@pytest.mark.asyncio
async def test_ensure_friend_duplicate_key_falls_back_to_find():
    rel = SimpleNamespace(id="rel1", user_a_id="u1", user_b_id="u2")
    existing = Conversation(
        relationship_id="rel1",
        type=ConversationType.FRIEND,
        participants=["u1", "u2"],
    )
    conv_col = MagicMock()
    conv_col.find_one_and_update = AsyncMock(side_effect=DuplicateKeyError("E11000 duplicate key"))
    with patch.object(Conversation, "get_motor_collection", return_value=conv_col), \
            patch.object(Conversation, "find_one", new=AsyncMock(return_value=existing)) as conv_find:
        result = await ensure_friend_conversation(rel)

    conv_col.find_one_and_update.assert_awaited_once()
    conv_find.assert_awaited_once_with({"relationship_id": "rel1"})
    assert result is existing
