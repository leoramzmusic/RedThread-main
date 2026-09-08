import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from src.core.config import settings

async def find_profile():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    profiles_col = db["profiles"]
    users_col = db["users"]
    
    # 1. Find user first
    user = await users_col.find_one({"email": {"$regex": "leora", "$options": "i"}})
    if not user:
        print("User leora not found!")
        return
        
    user_id_str = str(user["_id"])
    print(f"User ID from users collection (str): {user_id_str}")
    
    # 2. Search profile by user_id
    p = await profiles_col.find_one({"user_id": user_id_str})
    if p:
        print(f"Found profile by user_id string: {p.get('_id')}")
    else:
        # 3. Search profile by ObjectId of user_id (just in case)
        from bson import ObjectId
        p = await profiles_col.find_one({"user_id": user["_id"]})
        if p:
            print(f"Found profile by user_id ObjectId: {p.get('_id')}")
        else:
            # 4. Search profile by regex in display_name etc.
            p = await profiles_col.find_one({"display_name": {"$regex": "leora", "$options": "i"}})
            if p:
                print(f"Found profile by display_name: {p.get('_id')} (user_id: {p.get('user_id')})")
            else:
                print("Profile NOT FOUND by any means for leora.")

if __name__ == "__main__":
    asyncio.run(find_profile())
