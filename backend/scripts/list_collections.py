import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from src.core.config import settings

async def list_collections():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    cols = await db.list_collection_names()
    for col in sorted(cols):
        print(col)

if __name__ == "__main__":
    asyncio.run(list_collections())
