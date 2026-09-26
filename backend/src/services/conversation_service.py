"""CARE F0: Relationship + Conversation lifecycle.

Pure builders are unit-tested without Mongo; ensure_* orchestrators are
idempotent (safe to call from every match-transition hook and from backfill).
"""

from typing import TYPE_CHECKING, Any

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


async def ensure_match_conversation(match: "Match") -> Conversation:
    """Idempotently create Relationship(MATCH) + Conversation for a matched pair."""
    fields = build_match_relationship_fields(match.user_id_1, match.user_id_2)

    relationship = await Relationship.find_one({
        "user_a_id": fields["user_a_id"],
        "user_b_id": fields["user_b_id"],
        "type": RelationshipType.MATCH,
    })
    if not relationship:
        relationship = Relationship(**fields)
        if match.matched_at:
            relationship.matched_at = match.matched_at
        await relationship.insert()

    conversation = await Conversation.find_one({"relationship_id": str(relationship.id)})
    if not conversation:
        conversation = Conversation(**build_conversation_fields(
            str(relationship.id),
            relationship.user_a_id,
            relationship.user_b_id,
            ConversationType.MATCH,
        ))
        await conversation.insert()
    return conversation


async def ensure_friend_conversation(relationship: "Relationship") -> Conversation:
    """Idempotently create the Conversation for an accepted FRIEND relationship."""
    conversation = await Conversation.find_one({"relationship_id": str(relationship.id)})
    if not conversation:
        conversation = Conversation(**build_conversation_fields(
            str(relationship.id),
            relationship.user_a_id,
            relationship.user_b_id,
            ConversationType.FRIEND,
        ))
        await conversation.insert()
    return conversation
