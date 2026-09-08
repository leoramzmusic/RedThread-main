import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from src.core.config import settings

async def check_indexes():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    profiles_col = db["profiles"]
    
    indexes = await profiles_col.index_information()
    print("ALL INDEXES FOR 'profiles':")
    for name, info in indexes.items():
        print(f"Index Name: {name}")
        print(f"  Key: {info.get('key')}")
        if '2dsphere' in str(info):
            print("  ★ PROBABLE 2DSPHERE INDEX DETECTED ★")
        print("-" * 20)

if __name__ == "__main__":
    asyncio.run(check_indexes())
