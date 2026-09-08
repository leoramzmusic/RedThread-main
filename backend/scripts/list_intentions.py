import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from src.core.config import settings

async def list_intentions():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    profiles_collection = db["Profile"]
    
    cursor = profiles_collection.find()
    async for p in cursor:
        print(f"User: {p.get('user_id')}, Intentions: {p.get('intentions')}")

if __name__ == "__main__":
    asyncio.run(list_intentions())
