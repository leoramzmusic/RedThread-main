
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

async def inspect() :
    db_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name = "redthread"
    client = AsyncIOMotorClient(db_url)
    db = client[db_name]
    
    # User
    user = await db.users.find_one({"email": "maria@redthread.com"})
    if not user:
        print("User not found")
        return
        
    profile = await db.profiles.find_one({"user_id": str(user["_id"])})
    if not profile:
        print("Profile not found")
        return
        
    print(f"RAW GENDER: '{profile.get('gender')}'")
    print(f"RAW ATTRACTION PREFS: {profile.get('attraction_preferences')}")
    
    # Check another random profile
    other = await db.profiles.find_one({"user_id": {"$ne": str(user["_id"])}})
    if other:
        print(f"OTHER RAW GENDER: '{other.get('gender')}'")

if __name__ == "__main__":
    asyncio.run(inspect())
