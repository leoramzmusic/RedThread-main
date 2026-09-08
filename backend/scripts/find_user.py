import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from src.core.config import settings

async def find_user():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    users_col = db["users"]
    
    async for user in users_col.find({"email": {"$regex": "leo", "$options": "i"}}).limit(5):
         print(f"User Email: {user.get('email')} ID: {user.get('_id')}")

if __name__ == "__main__":
    asyncio.run(find_user())
