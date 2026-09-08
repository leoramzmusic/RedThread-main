import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from src.core.config import settings

async def print_profile():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    profiles_col = db["profiles"]
    
    p = await profiles_col.find_one({"user_id": "67498b94e88dddfc8d370814"})
    if p:
        for k, v in p.items():
            print(f"{k}: {v}")
    else:
        print("Profile not found!")

if __name__ == "__main__":
    asyncio.run(print_profile())
