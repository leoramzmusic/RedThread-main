import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def check_coords():
    MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    MONGODB_DB = os.getenv("MONGODB_DB_NAME", "redthread")
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[MONGODB_DB]
    collection = db["profiles"]
    
    one = await collection.find_one({"email": "test_1@example.com"})
    if one:
        print(f"EMAIL: {one['email']}")
        print(f"LOCATION FIELD: {one.get('location')}")
    else:
        # Try finding by looking_for_gender
        all_test = await collection.find({"looking_for_gender": "Masculino"}).to_list(length=5)
        print(f"FOUND {len(all_test)} test profiles")
        for p in all_test:
            print(f"  ID: {p['_id']}, LOCATION: {p.get('location')}")

if __name__ == "__main__":
    asyncio.run(check_coords())
