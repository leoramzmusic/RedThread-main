"""
Migration script to convert existing Match system to new Relationship system.

This script:
1. Converts all Match documents to Relationship documents
2. Creates Conversation documents for each active relationship
3. Updates Message documents to use conversation_id
4. Preserves all existing data and functionality

Run with: python -m src.db.migrations.migrate_to_relationships
"""

import asyncio
from datetime import datetime
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from src.models.user import User
from src.models.profile import Profile
from src.models.match import Match, MatchStatus
from src.models.message import Message
from src.models.relationship import (
    Relationship,
    RelationshipType,
    RelationshipStatus,
    RelationshipOrigin
)
from src.models.conversation import Conversation, ConversationType
from src.core.config import settings


async def migrate_matches_to_relationships():
    """Convert all Match documents to Relationship documents"""
    
    print("🔄 Starting migration: Match → Relationship")
    
    matches = await Match.find_all().to_list()
    print(f"📊 Found {len(matches)} matches to migrate")
    
    migrated_count = 0
    skipped_count = 0
    
    for match in matches:
        # Normalize user IDs
        user_a_id, user_b_id = Relationship.normalize_user_ids(
            match.user_id_1,
            match.user_id_2
        )
        
        # Check if relationship already exists
        existing = await Relationship.find_one({
            "user_a_id": user_a_id,
            "user_b_id": user_b_id,
            "type": RelationshipType.MATCH
        })
        
        if existing:
            print(f"⏭️  Skipping existing relationship: {user_a_id} ↔ {user_b_id}")
            skipped_count += 1
            continue
        
        # Map Match status to Relationship status
        if match.status == MatchStatus.MATCHED:
            rel_status = RelationshipStatus.ACTIVE
        elif match.status == MatchStatus.BLOCKED:
            rel_status = RelationshipStatus.BLOCKED
        else:
            rel_status = RelationshipStatus.PENDING
        
        # Create Relationship
        relationship = Relationship(
            user_a_id=user_a_id,
            user_b_id=user_b_id,
            type=RelationshipType.MATCH,
            status=rel_status,
            origin=RelationshipOrigin.DISCOVER,
            user_a_interaction=match.user_1_interaction,
            user_b_interaction=match.user_2_interaction,
            blocked_by=match.blocked_by,
            affinity_score=match.affinity_score,
            affinity_breakdown=match.affinity_breakdown,
            created_at=match.matched_at or match.created_at,
            matched_at=match.matched_at,
            blocked_at=match.unmatched_at if match.status == MatchStatus.BLOCKED else None,
            is_superlike=match.is_superlike
        )
        
        await relationship.insert()
        migrated_count += 1
        
        print(f"✅ Migrated match {match.id} → relationship {relationship.id}")
    
    print(f"\n✨ Migration complete: {migrated_count} migrated, {skipped_count} skipped")
    return migrated_count


async def create_conversations_for_relationships():
    """Create Conversation documents for all active relationships"""
    
    print("\n🔄 Starting: Creating Conversations")
    
    relationships = await Relationship.find({
        "type": RelationshipType.MATCH,
        "status": RelationshipStatus.ACTIVE
    }).to_list()
    
    print(f"📊 Found {len(relationships)} active relationships")
    
    created_count = 0
    skipped_count = 0
    
    for rel in relationships:
        # Check if conversation already exists
        existing = await Conversation.find_one({
            "relationship_id": str(rel.id)
        })
        
        if existing:
            print(f"⏭️  Skipping existing conversation for relationship {rel.id}")
            skipped_count += 1
            continue
        
        # Get last message for this match (if any)
        # We need to find messages using the old match_id system
        # First, find the original Match document
        original_match = await Match.find_one({
            "$or": [
                {"user_id_1": rel.user_a_id, "user_id_2": rel.user_b_id},
                {"user_id_1": rel.user_b_id, "user_id_2": rel.user_a_id}
            ]
        })
        
        last_message = None
        if original_match:
            last_message = await Message.find(
                Message.match_id == str(original_match.id)
            ).sort(-Message.created_at).limit(1).to_list()
        
        # Create conversation
        conversation = Conversation(
            relationship_id=str(rel.id),
            type=ConversationType.MATCH,
            participants=[rel.user_a_id, rel.user_b_id],
            created_at=rel.created_at,
            unread_count={rel.user_a_id: 0, rel.user_b_id: 0}
        )
        
        if last_message:
            msg = last_message[0]
            conversation.last_message_at = msg.created_at
            conversation.last_message_content = msg.content
            conversation.last_message_sender_id = msg.sender_id
            
            # Calculate unread counts
            unread_a = await Message.find({
                "match_id": str(original_match.id),
                "receiver_id": rel.user_a_id,
                "is_read": False
            }).count()
            
            unread_b = await Message.find({
                "match_id": str(original_match.id),
                "receiver_id": rel.user_b_id,
                "is_read": False
            }).count()
            
            conversation.unread_count = {
                rel.user_a_id: unread_a,
                rel.user_b_id: unread_b
            }
        
        await conversation.insert()
        created_count += 1
        
        print(f"✅ Created conversation {conversation.id} for relationship {rel.id}")
    
    print(f"\n✨ Conversations created: {created_count}, skipped: {skipped_count}")
    return created_count


async def update_messages_with_conversation_id():
    """Update Message documents to include conversation_id"""
    
    print("\n🔄 Starting: Updating Messages")
    
    # Get all conversations
    conversations = await Conversation.find_all().to_list()
    print(f"📊 Found {len(conversations)} conversations")
    
    updated_count = 0
    
    for conv in conversations:
        # Get the relationship
        relationship = await Relationship.get(conv.relationship_id)
        if not relationship:
            print(f"⚠️  Warning: Relationship {conv.relationship_id} not found")
            continue
        
        # Find the original Match
        original_match = await Match.find_one({
            "$or": [
                {"user_id_1": relationship.user_a_id, "user_id_2": relationship.user_b_id},
                {"user_id_1": relationship.user_b_id, "user_id_2": relationship.user_a_id}
            ]
        })
        
        if not original_match:
            print(f"⚠️  Warning: Original match not found for relationship {relationship.id}")
            continue
        
        # Update all messages for this match
        result = await Message.find(
            Message.match_id == str(original_match.id)
        ).update({"$set": {"conversation_id": str(conv.id)}})
        
        if result.modified_count > 0:
            updated_count += result.modified_count
            print(f"✅ Updated {result.modified_count} messages for conversation {conv.id}")
    
    print(f"\n✨ Messages updated: {updated_count}")
    return updated_count


async def run_migration():
    """Run the complete migration"""
    
    print("=" * 60)
    print("🚀 RedThread: Match → Relationship Migration")
    print("=" * 60)
    
    # Initialize database connection
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    database = client[settings.MONGODB_DB_NAME]
    
    await init_beanie(
        database=database,
        document_models=[
            User,
            Profile,
            Match,
            Message,
            Relationship,
            Conversation
        ]
    )
    
    print("✅ Database connection established\n")
    
    try:
        # Step 1: Migrate matches
        matches_migrated = await migrate_matches_to_relationships()
        
        # Step 2: Create conversations
        conversations_created = await create_conversations_for_relationships()
        
        # Step 3: Update messages
        messages_updated = await update_messages_with_conversation_id()
        
        print("\n" + "=" * 60)
        print("🎉 Migration Complete!")
        print("=" * 60)
        print(f"📊 Summary:")
        print(f"   - Relationships created: {matches_migrated}")
        print(f"   - Conversations created: {conversations_created}")
        print(f"   - Messages updated: {messages_updated}")
        print("\n✅ The old Match system is still intact for rollback if needed.")
        print("⚠️  Remember to update your application code to use the new system!")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        raise
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(run_migration())

