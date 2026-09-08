import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from src.core.config import settings
from src.models.user import User
from src.models.profile import Profile
from src.api.discovery import get_discovery_queue
from beanie import init_beanie

async def debug_discovery():
    # Initialize Beanie
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    from src.core.database import init_db
    # We can't easily call init_db because it imports everything, 
    # but we can do a minimal init for this test
    from src.models.user import User
    from src.models.profile import Profile
    from src.models.match import Match
    from src.models.algorithm_management import AlgorithmFactor
    
    await init_beanie(
        database=client[settings.MONGODB_DB_NAME],
        document_models=[User, Profile, Match, AlgorithmFactor]
    )
    
    # Get a user (leora)
    u_data = await client[settings.MONGODB_DB_NAME]["users"].find_one({"email": {"$regex": "leoramirez"}})
    if not u_data:
        print("User data not found in users collection!")
        return
    user = await User.find_one(User.id == u_data["_id"])
    if not user:
        print("User not found!")
        return

    print(f"Testing discovery for user: {user.email} (ID: {user.id})")
    
    try:
        # Mock the Dependency 'current_user' if needed, 
        # but here we can just call it directly since we have the user object
        # Note: get_discovery_queue is an async function
        
        # We might need to mock 'mode' if frontend sends it
        # The user mentioned 'Exploracion libre' which is mode='free'
        
        result = await get_discovery_queue(
            mode="suggested",
            current_user=user
        )
        print(f"Success! Found {len(result)} profiles.")
    except Exception as e:
        print(f"Caught error: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_discovery())
