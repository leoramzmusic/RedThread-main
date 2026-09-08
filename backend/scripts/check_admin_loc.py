import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def check_admin_loc():
    MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    MONGODB_DB = os.getenv("MONGODB_DB_NAME", "redthread")
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[MONGODB_DB]
    collection = db["profiles"]
    
    # Try finding by user email if stored in profile (legacy) or link by user_id
    admin_user = await db["users"].find_one({"email": "admin@testemail.com"})
    if admin_user:
        p = await collection.find_one({"user_id": str(admin_user["_id"])})
        if p:
            print(f"ADMIN LOCATION: {p.get('location')}")
        else:
            print("Admin profile not found")
    else:
        print("Admin user not found")

if __name__ == "__main__":
    asyncio.run(check_admin_loc())
