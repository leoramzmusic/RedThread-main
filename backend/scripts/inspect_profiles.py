import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from src.core.config import settings

async def inspect():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    profiles_col = db["profiles"]
    
    p = await profiles_col.find_one()
    if p:
        print(f"Sample User ID: {p.get('user_id')} Type: {type(p.get('user_id'))}")
    else:
        print("No profiles found!")

if __name__ == "__main__":
    asyncio.run(inspect())
