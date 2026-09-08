"""
Script to insert test data for notifications and messages
Run this script to populate the database with sample data
"""
import asyncio
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.config import settings
from src.db.schemas.user import User
from src.db.schemas.profile import Profile
from src.db.schemas.notification import Notification
from src.db.schemas.message import Message
from src.db.schemas.match import Match


async def init_db():
    """Initialize database connection"""
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(
        database=client[settings.MONGODB_DB_NAME],
        document_models=[User, Profile, Notification, Message, Match]
    )
    print("✅ Connected to MongoDB")


async def create_test_notifications(user_id: str):
    """Create test notifications for a user"""
    
    # Get some other users for related_user_id
    other_users = await User.find().limit(3).to_list()
    
    notifications_data = [
        {
            "user_id": str(user_id),
            "type": "like",
            "content": "le gustó tu foto",
            "related_user_id": str(other_users[0].id) if len(other_users) > 0 else None,
            "is_read": False,
            "created_at": datetime.utcnow() - timedelta(minutes=5)
        },
        {
            "user_id": str(user_id),
            "type": "view",
            "content": "visitó tu perfil",
            "related_user_id": str(other_users[1].id) if len(other_users) > 1 else None,
            "is_read": False,
            "created_at": datetime.utcnow() - timedelta(hours=1)
        },
        {
            "user_id": str(user_id),
            "type": "match",
            "content": "¡Es un match! Escríbele ahora",
            "related_user_id": str(other_users[2].id) if len(other_users) > 2 else None,
            "is_read": True,
            "created_at": datetime.utcnow() - timedelta(hours=3)
        },
        {
            "user_id": str(user_id),
            "type": "system",
            "content": "¡Bienvenido a Red Thread! Completa tu perfil para empezar a conectar",
            "related_user_id": None,
            "is_read": True,
            "created_at": datetime.utcnow() - timedelta(days=1)
        },
        {
            "user_id": str(user_id),
            "type": "like",
            "content": "le gustó tu perfil",
            "related_user_id": str(other_users[0].id) if len(other_users) > 0 else None,
            "is_read": False,
            "created_at": datetime.utcnow() - timedelta(minutes=30)
        }
    ]
    
    for notif_data in notifications_data:
        notification = Notification(**notif_data)
        await notification.insert()
    
    print(f"✅ Created {len(notifications_data)} test notifications for user {user_id}")


async def create_test_messages(user_id: str):
    """Create test messages and matches for a user"""
    
    # Get some other users
    other_users = await User.find().limit(2).to_list()
    
    if len(other_users) < 2:
        print("⚠️  Not enough users in database to create test messages")
        print("   Please create at least 2 additional users first")
        return
    
    # Create matches first
    for other_user in other_users:
        # Check if match already exists
        existing_match = await Match.find_one(
            Match.user1_id == user_id,
            Match.user2_id == str(other_user.id)
        )
        
        if not existing_match:
            match = Match(
                user1_id=user_id,
                user2_id=str(other_user.id),
                matched_at=datetime.utcnow() - timedelta(days=2),
                is_active=True
            )
            await match.insert()
            match_id = str(match.id)
            print(f"✅ Created match between {user_id} and {other_user.id}")
        else:
            match_id = str(existing_match.id)
            print(f"ℹ️  Match already exists: {match_id}")
        
        # Create test messages
        messages_data = [
            {
                "match_id": match_id,
                "sender_id": str(other_user.id),
                "content": "¡Hola! ¿Cómo estás?",
                "message_type": "text",
                "created_at": datetime.utcnow() - timedelta(hours=2),
                "is_read": True
            },
            {
                "match_id": match_id,
                "sender_id": user_id,
                "content": "¡Muy bien! ¿Y tú?",
                "message_type": "text",
                "created_at": datetime.utcnow() - timedelta(hours=1, minutes=55),
                "is_read": True
            },
            {
                "match_id": match_id,
                "sender_id": str(other_user.id),
                "content": "Genial! Vi que te gusta el senderismo, ¿has ido a algún lugar interesante últimamente?",
                "message_type": "text",
                "created_at": datetime.utcnow() - timedelta(minutes=30),
                "is_read": False
            }
        ]
        
        for msg_data in messages_data:
            message = Message(**msg_data)
            await message.insert()
        
        print(f"✅ Created {len(messages_data)} test messages in match {match_id}")


async def main():
    """Main function"""
    await init_db()
    
    print("\n" + "="*50)
    print("TEST DATA INSERTION SCRIPT")
    print("="*50 + "\n")
    
    # Get the first user (or ask for user_id)
    users = await User.find().to_list()
    
    if not users:
        print("❌ No users found in database!")
        print("   Please create a user account first")
        return
    
    print(f"Found {len(users)} user(s) in database:\n")
    for i, user in enumerate(users):
        print(f"{i+1}. {user.email} (ID: {user.id})")
    
    print("\nEnter the number of the user to add test data for (or press Enter for user #1):")
    choice = input("> ").strip()
    
    if choice == "":
        selected_user = users[0]
    else:
        try:
            idx = int(choice) - 1
            selected_user = users[idx]
        except (ValueError, IndexError):
            print("❌ Invalid choice")
            return
    
    user_id = str(selected_user.id)
    print(f"\n📝 Creating test data for: {selected_user.email}\n")
    
    # Create test notifications
    await create_test_notifications(user_id)
    
    # Create test messages
    await create_test_messages(user_id)
    
    print("\n" + "="*50)
    print("✅ TEST DATA CREATED SUCCESSFULLY!")
    print("="*50)
    print("\nYou can now:")
    print("1. Go to /chat to see the test messages")
    print("2. Click on 'Notificaciones' tab to see test notifications")
    print("3. Badge counters should show unread counts")


if __name__ == "__main__":
    asyncio.run(main())
