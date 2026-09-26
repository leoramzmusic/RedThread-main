"""CARE F0: Relationship + Conversation lifecycle.

Pure builders are unit-tested without Mongo; ensure_* orchestrators are
idempotent (safe to call from every match-transition hook and from backfill).
"""

from datetime import datetime
from typing import TYPE_CHECKING, Any

from pymongo.errors import DuplicateKeyError

from src.models.conversation import Conversation, ConversationType
from src.models.relationship import (
    Relationship,
    RelationshipOrigin,
    RelationshipStatus,
    RelationshipType,
)

if TYPE_CHECKING:
    from src.models.match import Match


def build_match_relationship_fields(user_id_1: str, user_id_2: str) -> dict[str, Any]:
    """Pure: kwargs to create a MATCH Relationship (normalized id order)."""
    user_a_id, user_b_id = Relationship.normalize_user_ids(str(user_id_1), str(user_id_2))
    return {
        "user_a_id": user_a_id,
        "user_b_id": user_b_id,
        "type": RelationshipType.MATCH,
        "status": RelationshipStatus.ACTIVE,
        "origin": RelationshipOrigin.DISCOVER,
    }


def build_conversation_fields(
    relationship_id: str,
    user_a_id: str,
    user_b_id: str,
    conversation_type: ConversationType,
) -> dict[str, Any]:
    """Pure: kwargs to create a Conversation linked to a relationship."""
    return {
        "relationship_id": relationship_id,
        "type": conversation_type,
        "participants": [user_a_id, user_b_id],
    }


async def _upsert_relationship(query: dict[str, Any], on_insert: dict[str, Any]) -> Relationship:
    """Atomic create-or-fetch: unique (user_a_id, user_b_id, type) index + upsert."""
    try:
        await Relationship.get_motor_collection().find_one_and_update(
            query, {"$setOnInsert": on_insert}, upsert=True
        )
    except DuplicateKeyError:
        pass
    relationship = await Relationship.find_one(query)
    if relationship is None:
        raise RuntimeError(f"upsert produced no relationship for {query}")
    return relationship


async def _upsert_conversation(query: dict[str, Any], on_insert: dict[str, Any]) -> Conversation:
    """Atomic create-or-fetch: unique relationship_id index + upsert."""
    try:
        await Conversation.get_motor_collection().find_one_and_update(
            query, {"$setOnInsert": on_insert}, upsert=True
        )
    except DuplicateKeyError:
        pass
    conversation = await Conversation.find_one(query)
    if conversation is None:
        raise RuntimeError(f"upsert produced no conversation for {query}")
    return conversation


async def ensure_match_conversation(match: "Match") -> Conversation:
    """Idempotently create Relationship(MATCH) + Conversation for a matched pair."""
    fields = build_match_relationship_fields(match.user_id_1, match.user_id_2)
    relationship = await _upsert_relationship(
        {
            "user_a_id": fields["user_a_id"],
            "user_b_id": fields["user_b_id"],
            "type": RelationshipType.MATCH,
        },
        {
            **fields,
            "created_at": datetime.utcnow(),
            **({"matched_at": match.matched_at} if match.matched_at else {}),
        },
    )

    conversation = await _upsert_conversation(
        {"relationship_id": str(relationship.id)},
        {
            **build_conversation_fields(
                str(relationship.id),
                relationship.user_a_id,
                relationship.user_b_id,
                ConversationType.MATCH,
            ),
            "created_at": datetime.utcnow(),
        },
    )
    return conversation


async def ensure_friend_conversation(relationship: "Relationship") -> Conversation:
    """Idempotently create the Conversation for an accepted FRIEND relationship."""
    return await _upsert_conversation(
        {"relationship_id": str(relationship.id)},
        {
            **build_conversation_fields(
                str(relationship.id),
                relationship.user_a_id,
                relationship.user_b_id,
                ConversationType.FRIEND,
            ),
            "created_at": datetime.utcnow(),
        },
    )
