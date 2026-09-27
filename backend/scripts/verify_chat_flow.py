r"""CARE F0: verify Relationship+Conversation lifecycle against real Mongo.

Uses synthetic user ids (no FK constraints) and cleans up after itself.
From backend/ with Mongo running:
    $env:PYTHONPATH="."; .\venv\Scripts\python scripts\verify_chat_flow.py
Exit code 0 = all checks passed.

NOTE: init_beanie builds the unique indexes as a side effect (it does not need
ensure_indexes() -- no such function exists in this codebase; see the note in
backfill_conversations.py). This script therefore leaves those indexes in place.
It only removes the documents it creates.
"""

import asyncio
import sys
from datetime import datetime, timezone
from types import SimpleNamespace

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from src.core.config import settings
from src.models.conversation import Conversation, ConversationType
from src.models.match import Match
from src.models.relationship import (
    Relationship,
    RelationshipOrigin,
    RelationshipStatus,
    RelationshipType,
)
from src.services.conversation_service import (
    ensure_friend_conversation,
    ensure_match_conversation,
)

U1 = "verify_f0_user_a"
U2 = "verify_f0_user_b"

# Any synthetic relationship has U1 and U2 as its two participants, in whichever
# order the normalization decides. Filtering on "$in" for BOTH sides keeps the
# cleanup independent of that order -- otherwise the script would leak exactly
# the document whose broken normalization it is trying to detect.
_PAIR = {"$in": [U1, U2]}


async def cleanup() -> None:
    await Relationship.find({"user_a_id": _PAIR, "user_b_id": _PAIR}).delete()
    await Conversation.find({"participants": _PAIR}).delete()


async def count_residue() -> int:
    rels = await Relationship.find({"user_a_id": _PAIR, "user_b_id": _PAIR}).count()
    convs = await Conversation.find({"participants": _PAIR}).count()
    return rels + convs


async def main() -> int:
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(
        database=client[settings.MONGODB_DB_NAME],
        document_models=[Match, Relationship, Conversation],
    )
    failures = []

    try:
        await cleanup()

        # Scenario 1: match pair — create twice, must stay at exactly 1+1 docs
        # naive UTC, same value as the utcnow() production callers use, without
        # the deprecation warning a brand-new file should not add.
        match = SimpleNamespace(
            user_id_1=U2,
            user_id_2=U1,
            matched_at=datetime.now(timezone.utc).replace(tzinfo=None),
        )
        conv1 = await ensure_match_conversation(match)
        conv2 = await ensure_match_conversation(match)

        rels = await Relationship.find({
            "user_a_id": U1, "user_b_id": U2, "type": RelationshipType.MATCH,
        }).to_list()
        if len(rels) != 1:
            failures.append(f"expected 1 MATCH relationship, got {len(rels)}")
        else:
            convs = await Conversation.find({"relationship_id": str(rels[0].id)}).to_list()
            if len(convs) != 1:
                failures.append(f"expected 1 MATCH conversation, got {len(convs)}")
        if conv1.id != conv2.id:
            failures.append("second ensure returned a different conversation")
        if conv1.participants != [U1, U2]:
            failures.append(f"participants not normalized: {conv1.participants}")
        if conv1.type != ConversationType.MATCH:
            failures.append(f"expected MATCH conversation type, got {conv1.type}")

        # Scenario 2: friend conversation on an existing relationship.
        # A MATCH and a FRIEND conversation for the same pair coexisting is by
        # design -- the chat UI has a match/friend sub-tab that filters on
        # Conversation.type. This asserts the FRIEND contract, not uniqueness
        # of conversation per pair.
        friend_rel = Relationship(
            user_a_id=U1,
            user_b_id=U2,
            type=RelationshipType.FRIEND,
            status=RelationshipStatus.ACTIVE,
            origin=RelationshipOrigin.FRIEND_REQUEST,
        )
        await friend_rel.insert()
        fconv1 = await ensure_friend_conversation(friend_rel)
        fconv2 = await ensure_friend_conversation(friend_rel)
        fconvs = await Conversation.find({"relationship_id": str(friend_rel.id)}).to_list()
        if len(fconvs) != 1:
            failures.append(f"expected 1 FRIEND conversation, got {len(fconvs)}")
        if fconv1.id != fconv2.id:
            failures.append("second friend ensure returned a different conversation")
        if fconv1.type != ConversationType.FRIEND:
            failures.append(f"expected FRIEND conversation type, got {fconv1.type}")
        if fconv1.participants != [U1, U2]:
            failures.append(f"friend participants not normalized: {fconv1.participants}")

    except Exception as exc:  # noqa: BLE001 - the point is to report, not to crash
        failures.append(f"unexpected {type(exc).__name__}: {exc}")
    finally:
        try:
            await cleanup()
            residue = await count_residue()
            if residue:
                failures.append(
                    f"cleanup left {residue} synthetic document(s) behind"
                )
        finally:
            client.close()

    if failures:
        for failure in failures:
            print(f"FAIL: {failure}")
        return 1
    print("OK: match creates exactly 1 relationship + 1 conversation, idempotent;")
    print("OK: friend relationship gets exactly 1 conversation, idempotent;")
    print("OK: cleanup done (synthetic documents removed).")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
