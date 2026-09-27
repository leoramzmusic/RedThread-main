import importlib.util
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from pymongo.errors import OperationFailure

from src.models.conversation import Conversation, ConversationType
from src.models.relationship import (
    Relationship,
    RelationshipOrigin,
    RelationshipStatus,
    RelationshipType,
)

SCRIPT_PATH = Path(__file__).resolve().parents[1] / "scripts" / "dedupe_relationship_conversations.py"


def _load_script():
    spec = importlib.util.spec_from_file_location("dedupe_relationship_conversations", SCRIPT_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


script = _load_script()


def _relationship(rel_id, created_at, **overrides):
    fields = {
        "user_a_id": "u1",
        "user_b_id": "u2",
        "type": RelationshipType.MATCH,
        "status": RelationshipStatus.ACTIVE,
        "origin": RelationshipOrigin.DISCOVER,
        "created_at": created_at,
    }
    fields.update(overrides)
    rel = Relationship(**fields)
    rel.id = rel_id
    return rel


def _patch_writes():
    query = MagicMock()
    query.update = AsyncMock()
    return (
        patch.object(Relationship, "save", new=AsyncMock()),
        patch.object(Relationship, "delete", new=AsyncMock()),
        patch.object(Conversation, "find", return_value=query),
    ), query


def test_naive_strips_tzinfo_and_passes_through_none():
    aware = datetime(2026, 9, 26, 12, 0, tzinfo=timezone.utc)
    naive = datetime(2026, 9, 26, 12, 0)
    assert script._naive(aware) == naive
    assert script._naive(naive) is naive
    assert script._naive(None) is None


@pytest.mark.asyncio
async def test_merge_keeps_earliest_created_and_max_aggregates():
    older = _relationship(
        "aaaaaaaaaaaaaaaaaaaaaaaa",
        datetime(2026, 1, 1),
        matched_at=datetime(2026, 1, 2),
        affinity_score=0.4,
        affinity_breakdown={"care": 0.4},
    )
    newer = _relationship(
        "bbbbbbbbbbbbbbbbbbbbbbbb",
        datetime(2026, 3, 1),
        matched_at=datetime(2026, 2, 1),
        affinity_score=0.9,
        affinity_breakdown={"care": 0.9},
        is_superlike=True,
    )
    patches, query = _patch_writes()
    with patches[0], patches[1], patches[2]:
        merged, manual, warnings = await script.merge_relationship_groups(
            {("u1", "u2", "match"): [older, newer]}, set()
        )

    assert (merged, manual, warnings) == (1, [], [])
    assert older.created_at == datetime(2026, 1, 1)
    assert older.matched_at == datetime(2026, 1, 2)
    assert older.affinity_score == 0.9
    assert older.affinity_breakdown == {"care": 0.9}
    assert older.is_superlike is True
    query.update.assert_awaited_once_with(
        {"$set": {"relationship_id": "aaaaaaaaaaaaaaaaaaaaaaaa"}}
    )


@pytest.mark.asyncio
async def test_merge_mixed_status_goes_to_manual_without_writes():
    blocked = _relationship(
        "aaaaaaaaaaaaaaaaaaaaaaaa",
        datetime(2026, 1, 1),
        status=RelationshipStatus.BLOCKED,
        blocked_by="u1",
    )
    active = _relationship("bbbbbbbbbbbbbbbbbbbbbbbb", datetime(2026, 2, 1))
    with patch.object(Relationship, "save", new=AsyncMock()) as save_mock, \
            patch.object(Relationship, "delete", new=AsyncMock()) as delete_mock:
        merged, manual, warnings = await script.merge_relationship_groups(
            {("u1", "u2", "match"): [blocked, active]}, set()
        )

    assert merged == 0
    assert warnings == []
    assert manual == [(("u1", "u2", "match"), [blocked, active])]
    save_mock.assert_not_awaited()
    delete_mock.assert_not_awaited()


@pytest.mark.asyncio
async def test_merge_reports_divergent_fields_as_warnings():
    discover = _relationship(
        "aaaaaaaaaaaaaaaaaaaaaaaa",
        datetime(2026, 1, 1),
        origin=RelationshipOrigin.DISCOVER,
        blocked_by="u1",
    )
    requested = _relationship(
        "bbbbbbbbbbbbbbbbbbbbbbbb",
        datetime(2026, 1, 5),
        origin=RelationshipOrigin.FRIEND_REQUEST,
        blocked_by="u2",
    )
    patches, _ = _patch_writes()
    with patches[0], patches[1], patches[2]:
        merged, manual, warnings = await script.merge_relationship_groups(
            {("u1", "u2", "match"): [discover, requested]}, set()
        )

    assert merged == 1
    assert manual == []
    assert any("divergent origin" in warning for warning in warnings)
    assert any("divergent blocked_by" in warning for warning in warnings)


@pytest.mark.asyncio
async def test_reconcile_resolves_custom_index_name_on_code_86():
    rel_coll = MagicMock()
    rel_coll.create_index = AsyncMock(return_value="user_a_id_1_user_b_id_1_type_1")
    rel_coll.index_information = AsyncMock(return_value={})
    conv_coll = MagicMock()
    conv_coll.create_index = AsyncMock(
        side_effect=[OperationFailure("IndexKeySpecsConflict", code=86), None]
    )
    conv_coll.index_information = AsyncMock(
        return_value={
            "relationship_id_custom": {"key": [("relationship_id", 1)], "unique": False},
        }
    )
    conv_coll.drop_index = AsyncMock()
    with patch.object(Relationship, "get_motor_collection", return_value=rel_coll), \
            patch.object(Conversation, "get_motor_collection", return_value=conv_coll):
        problems = await script.reconcile_indexes()

    conv_coll.drop_index.assert_awaited_once_with("relationship_id_custom")
    assert problems == []
