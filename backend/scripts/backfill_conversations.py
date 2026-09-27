r"""CARE F0 backfill: create Relationship+Conversation for existing connections.

Idempotent — safe to re-run. From backend/ with Mongo running:
    $env:PYTHONPATH="."; .\venv\Scripts\python scripts\backfill_conversations.py
"""

import asyncio
import sys

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from src.core.config import settings
from src.models.conversation import Conversation
from src.models.match import Match, MatchStatus
from src.models.relationship import (
    Relationship,
    RelationshipStatus,
    RelationshipType,
)
from src.services.conversation_service import (
    ensure_friend_conversation,
    ensure_match_conversation,
)


async def main() -> int:
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(
        database=client[settings.MONGODB_DB_NAME],
        document_models=[Match, Relationship, Conversation],
    )

    before = await Conversation.find_all().count()

    matches = await Match.find({"status": MatchStatus.MATCHED}).to_list()
    match_errors = 0
    for match in matches:
        try:
            await ensure_match_conversation(match)
        except Exception as err:
            match_errors += 1
            print(f"match {match.id}: {err}")

    friend_relationships = await Relationship.find({
        "type": RelationshipType.FRIEND,
        "status": RelationshipStatus.ACTIVE,
    }).to_list()
    friend_errors = 0
    for relationship in friend_relationships:
        try:
            await ensure_friend_conversation(relationship)
        except Exception as err:
            friend_errors += 1
            print(f"relationship {relationship.id}: {err}")

    after = await Conversation.find_all().count()
    print(f"MATCHED matches processed: {len(matches)} ({match_errors} errors)")
    print(f"ACTIVE friend relationships processed: {len(friend_relationships)} ({friend_errors} errors)")
    print(f"Conversations: {before} -> {after} (+{after - before})")

    client.close()
    return 1 if (match_errors or friend_errors) else 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
