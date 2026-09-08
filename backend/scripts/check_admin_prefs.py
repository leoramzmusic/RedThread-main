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
    p = await Profile.find_one(Profile.user_id == str(admin.id))
    print(f"ADMIN PREFERENCES:")
    print(f"  Search States: {p.search_states}")
    print(f"  Search Countries: {p.search_countries}")
    print(f"  Search Radius: {p.search_radius_km}")
    print(f"  Looking For Gender: {p.looking_for_gender}")

if __name__ == "__main__":
    asyncio.run(check())
