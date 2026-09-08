import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
import os
import sys
sys.path.insert(0, 'src')
from models.user import User
from models.profile import Profile

async def check():
    MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    MONGODB_DB = os.getenv("MONGODB_DB_NAME", "redthread")
    
    client = AsyncIOMotorClient(MONGODB_URL)
    await init_beanie(database=client[MONGODB_DB], document_models=[User, Profile])
    
    admin = await User.find_one(User.email == "admin@testemail.com")
    if not admin:
        print("Admin user not found")
        return
        
    p = await Profile.find_one(Profile.user_id == str(admin.id))
    print(f"ADMIN DATA:")
    print(f"  Gender: '{p.gender}'")
    print(f"  Looking for: {p.looking_for_gender}")
    print(f"  Location: {p.location.city if p.location else 'None'}, {p.location.coordinates if p.location else 'None'}")
    
    test_user = await User.find_one(User.email == "test_1@example.com")
    if test_user:
        tp = await Profile.find_one(Profile.user_id == str(test_user.id))
        print(f"\nTEST PROFILE (test_1@example.com):")
        print(f"  Gender: '{tp.gender}'")
        print(f"  Looking for: {tp.looking_for_gender}")
        print(f"  Location: {tp.location.city}, {tp.location.coordinates}")
    else:
        print("\nTest user test_1@example.com not found")

if __name__ == "__main__":
    asyncio.run(check())
