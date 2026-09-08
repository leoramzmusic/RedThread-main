import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from src.config import settings
from src.db.schemas.user import User
from src.db.schemas.profile import Profile
from src.db.schemas.conversation import Conversation
from src.db.schemas.relationship import Relationship
from src.db.schemas.match import Match
from src.db.schemas.message import Message

async def verify_chat():
    # Initialize DB
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(
        database=client[settings.MONGODB_DB_NAME],
        document_models=[User, Profile, Conversation, Relationship, Match, Message]
    )

    # Find Admin User
    admin_user = await User.find_one(User.email == "admin@redthread.com")
    if not admin_user:
        print("❌ Admin user not found")
        return

    print(f"✅ Found Admin: {admin_user.email} (ID: {admin_user.id})")

    # Find Sofía
    # Assuming Sofía is a user, we look for a profile with display_name Sofía
    sofia_profile = await Profile.find_one(Profile.display_name == "Sofía")
    if not sofia_profile:
        # Try to find by user email if profile name doesn't match exactly or multiple exist
        # Let's search users/profiles generally
        print("⚠️  Profile 'Sofía' not found directly. Searching all profiles...")
        profiles = await Profile.find_all().to_list()
        for p in profiles:
            if "sofia" in p.display_name.lower():
                sofia_profile = p
                break
    
    if not sofia_profile:
        print("❌ User 'Sofía' not found")
        return

    print(f"✅ Found Sofía: {sofia_profile.display_name} (User ID: {sofia_profile.user_id})")

    # Check for Conversation
    conversation = await Conversation.find_one({
        "participants": {"$all": [str(admin_user.id), str(sofia_profile.user_id)]}
    })

    if conversation:
        print(f"✅ Conversation FOUND! ID: {conversation.id}")
        print(f"   Type: {conversation.type}")
        print(f"   Messages: {conversation.last_message_content}")
        print(f"   Last Active: {conversation.last_message_at}")
    else:
        print("❌ Conversation NOT found in new system.")
        
        # Check if Match exists (Old system)
        match = await Match.find_one({
            "$or": [
                {"user_id_1": str(admin_user.id), "user_id_2": str(sofia_profile.user_id)},
                {"user_id_1": str(sofia_profile.user_id), "user_id_2": str(admin_user.id)}
            ]
        })
        
        if match:
            print(f"⚠️  Match exists in OLD system (ID: {match.id}) but not migrated to Conversation.")
        else:
            print("❌ No Match found in old system either.")

if __name__ == "__main__":
    asyncio.run(verify_chat())
