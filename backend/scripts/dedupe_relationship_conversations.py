r"""CARE F0 (R12): dedupe Relationship/Conversation duplicates and reconcile unique indexes.

Dry-run by default: prints a report and changes nothing. From backend/ with Mongo running:
    $env:PYTHONPATH="."; .\venv\Scripts\python scripts\dedupe_relationship_conversations.py
    $env:PYTHONPATH="."; .\venv\Scripts\python scripts\dedupe_relationship_conversations.py --apply

Run with --apply BEFORE the first boot with the R12 unique indexes whenever data may contain
duplicates: beanie creates model indexes at init and unique-index creation fails while
duplicates exist. Fresh databases need no data cleanup; --apply then only (re)creates indexes.

--apply is not transactional: if it aborts, re-run it. Every step reloads from the database, so
repeated runs converge to the same result; exit code 1 means manual relationship groups or index
problems are still pending.

The merged unread_count is the SUM of the duplicates' counters, so it can over-count a user who
already read one copy: treat it as an upper bound, not an authoritative count.
"""

import argparse
import asyncio
import sys
from collections import defaultdict
from datetime import datetime

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import OperationFailure

from src.core.config import settings
from src.models.conversation import Conversation
from src.models.message import Message
from src.models.relationship import Relationship


def pair_key(rel: Relationship) -> tuple[str, str, str]:
    user_lo, user_hi = sorted((rel.user_a_id, rel.user_b_id))
    return (user_lo, user_hi, str(rel.type))


def _naive(value):
    if value is None:
        return None
    return value.replace(tzinfo=None) if value.tzinfo else value


async def load() -> tuple[list, list]:
    relationships = await Relationship.find_all().to_list()
    conversations = await Conversation.find_all().to_list()
    return relationships, conversations


def relationship_groups(relationships: list) -> dict:
    groups: dict[tuple, list] = defaultdict(list)
    for rel in relationships:
        groups[pair_key(rel)].append(rel)
    return {k: v for k, v in groups.items() if len(v) > 1}


def conversation_groups(conversations: list) -> dict:
    groups: dict[str, list] = defaultdict(list)
    for conv in conversations:
        groups[conv.relationship_id].append(conv)
    return {k: v for k, v in groups.items() if len(v) > 1}


async def fix_orientation(unnormalized: list) -> int:
    for rel in unnormalized:
        user_lo, user_hi = sorted((rel.user_a_id, rel.user_b_id))
        rel.user_a_id = user_lo
        rel.user_b_id = user_hi
        await rel.save()
    return len(unnormalized)


async def merge_relationship_groups(rel_dups: dict, conv_rel_ids: set) -> tuple[int, list, list]:
    merged = 0
    manual = []
    warnings = []
    for key, group in rel_dups.items():
        if len({str(r.status) for r in group}) > 1:
            manual.append((key, group))
            continue
        candidates = [r for r in group if str(r.id) in conv_rel_ids] or group
        keeper = min(
            candidates,
            key=lambda r: (_naive(r.created_at) or datetime.min, str(r.id)),
        )
        best_affinity = max((r.affinity_score or 0.0 for r in group), default=0.0)
        if best_affinity > 0:
            keeper.affinity_score = best_affinity
            source = next(
                (r for r in group if (r.affinity_score or 0.0) == best_affinity),
                keeper,
            )
            keeper.affinity_breakdown = source.affinity_breakdown
        keeper.matched_at = min(
            (_naive(r.matched_at) for r in group if r.matched_at),
            default=None,
        )
        keeper.accepted_at = min(
            (_naive(r.accepted_at) for r in group if r.accepted_at),
            default=None,
        )
        keeper.is_superlike = any(r.is_superlike for r in group)
        for field in ("origin", "requester_id"):
            values = {str(getattr(r, field)) for r in group}
            if len(values) > 1:
                warnings.append(
                    f"{key}: divergent {field} {sorted(values)}; kept {getattr(keeper, field)}"
                )
        await keeper.save()
        for loser in group:
            if loser.id == keeper.id:
                continue
            await Conversation.find({"relationship_id": str(loser.id)}).update(
                {"$set": {"relationship_id": str(keeper.id)}}
            )
            await loser.delete()
            merged += 1
        print(f"merged relationship {key}: keeper={keeper.id}, removed={len(group) - 1}")
    return merged, manual, warnings


async def merge_conversation_groups(conv_dups: dict) -> int:
    merged = 0
    for rel_id, group in conv_dups.items():
        with_messages = [
            c
            for c in group
            if await Message.get_motor_collection().count_documents(
                {"conversation_id": str(c.id)}
            )
            > 0
        ]
        candidates = with_messages or group
        keeper = min(candidates, key=lambda c: c.id)
        losers = [c for c in group if c.id != keeper.id]
        for loser in losers:
            await Message.find({"conversation_id": str(loser.id)}).update(
                {"$set": {"conversation_id": str(keeper.id)}}
            )
        best = max(
            group,
            key=lambda c: (
                c.last_message_at is not None,
                _naive(c.last_message_at) or datetime.min,
            ),
        )
        keeper.last_message_at = _naive(best.last_message_at)
        keeper.last_message_content = best.last_message_content
        keeper.last_message_sender_id = best.last_message_sender_id
        unread: dict = {}
        archived: set = set()
        muted: set = set()
        for c in group:
            for uid, count in (c.unread_count or {}).items():
                unread[uid] = unread.get(uid, 0) + count
            archived.update(c.archived_by)
            muted.update(c.muted_by)
        keeper.unread_count = unread
        keeper.archived_by = sorted(archived)
        keeper.muted_by = sorted(muted)
        await keeper.save()
        for loser in losers:
            await loser.delete()
        merged += len(losers)
        print(f"merged conversations for {rel_id}: keeper={keeper.id}, removed={len(losers)}")
    return merged


async def index_state() -> dict:
    rel_indexes = await Relationship.get_motor_collection().index_information()
    conv_indexes = await Conversation.get_motor_collection().index_information()
    rel_unique = any(
        info.get("unique")
        and list(info["key"]) == [("user_a_id", 1), ("user_b_id", 1), ("type", 1)]
        for info in rel_indexes.values()
    )
    conv_unique = bool(conv_indexes.get("relationship_id_1", {}).get("unique"))
    return {
        "relationships (user_a_id, user_b_id, type)": rel_unique,
        "conversations (relationship_id)": conv_unique,
    }


async def reconcile_indexes() -> list[str]:
    problems = []
    rel_coll = Relationship.get_motor_collection()
    try:
        await rel_coll.create_index(
            [("user_a_id", 1), ("user_b_id", 1), ("type", 1)], unique=True
        )
        print("created unique index: relationships (user_a_id, user_b_id, type)")
    except OperationFailure as err:
        if getattr(err, "code", None) == 11000:
            print("relationships still have duplicates — resolve manual groups first")
        problems.append(f"relationships unique index: {err}")
    rel_indexes = await rel_coll.index_information()
    if "user_a_id_1_user_b_id_1" in rel_indexes:
        try:
            await rel_coll.drop_index("user_a_id_1_user_b_id_1")
            print("dropped obsolete index: relationships (user_a_id, user_b_id)")
        except OperationFailure as err:
            problems.append(f"obsolete relationships index: {err}")
    conv_coll = Conversation.get_motor_collection()
    try:
        await conv_coll.create_index("relationship_id", unique=True)
        print("created unique index: conversations (relationship_id)")
    except OperationFailure as err:
        if getattr(err, "code", None) != 85:
            problems.append(f"conversations unique index: {err}")
            return problems
        conv_indexes = await conv_coll.index_information()
        conflicting = next(
            (
                name
                for name, info in conv_indexes.items()
                if list(info["key"]) == [("relationship_id", 1)]
            ),
            None,
        )
        if conflicting is None:
            problems.append("conversations index conflict without a matching key pattern")
            return problems
        await conv_coll.drop_index(conflicting)
        try:
            await conv_coll.create_index("relationship_id", unique=True)
            print(
                "recreated index as unique: conversations (relationship_id) "
                f"[dropped {conflicting}]"
            )
        except OperationFailure as err2:
            problems.append(f"conversations unique index: {err2}")
    return problems


async def main() -> int:
    parser = argparse.ArgumentParser(
        description="Dedupe relationships/conversations and reconcile unique indexes"
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="perform merges and index fixes (default: report only)",
    )
    args = parser.parse_args()

    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(
        database=client[settings.MONGODB_DB_NAME],
        document_models=[Relationship, Conversation, Message],
    )

    relationships, conversations = await load()
    unnormalized = [r for r in relationships if r.user_a_id > r.user_b_id]
    rel_dups = relationship_groups(relationships)
    conv_dups = conversation_groups(conversations)
    rel_ids = {str(r.id) for r in relationships}
    orphans = [c for c in conversations if c.relationship_id not in rel_ids]
    indexes = await index_state()

    print(f"relationships: {len(relationships)}, duplicate groups: {len(rel_dups)}")
    for key, group in rel_dups.items():
        statuses = sorted({str(r.status) for r in group})
        flag = "MANUAL" if len(statuses) > 1 else "auto-merge"
        print(f"  {key}: ids={[str(r.id) for r in group]} statuses={statuses} -> {flag}")
    print(f"unnormalized pairs: {len(unnormalized)}")
    print(f"conversations: {len(conversations)}, duplicate groups: {len(conv_dups)}")
    for rel_id, group in conv_dups.items():
        print(f"  relationship_id={rel_id}: ids={[str(c.id) for c in group]}")
    print(f"orphan conversations: {len(orphans)}")
    for name, ok in indexes.items():
        print(f"index {name} unique: {'yes' if ok else 'NO'}")

    if not args.apply:
        client.close()
        return 0

    if unnormalized:
        print(f"normalizing {await fix_orientation(unnormalized)} relationships")
    conv_rel_ids = {c.relationship_id for c in conversations}
    _, manual, warnings = await merge_relationship_groups(rel_dups, conv_rel_ids)
    conversations = (await load())[1]
    conv_dups = conversation_groups(conversations)
    merged = await merge_conversation_groups(conv_dups)
    print(f"conversations merged: {merged}")
    problems = await reconcile_indexes()
    print(f"manual relationship groups pending: {len(manual)}")
    for problem in problems:
        print(f"PROBLEM: {problem}")
    for warning in warnings:
        print(f"WARNING: {warning}")
    client.close()
    return 1 if (problems or manual) else 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
