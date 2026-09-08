"""
Migration script to convert pets field from string to list
Run this once to migrate existing data
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

async def migrate_pets_field():
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.redthread
    profiles = db.profiles
    
    # Find all profiles with pets as string (not list)
    cursor = profiles.find({"pets": {"$type": "string"}})
    
    count = 0
    async for profile in cursor:
        old_value = profile.get("pets")
        
        # Convert string to list
        if old_value:
            new_value = [old_value]
        else:
            new_value = []
        
        # Update the profile
        await profiles.update_one(
            {"_id": profile["_id"]},
            {
                "$set": {
                    "pets": new_value,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        count += 1
        print(f"Migrated profile {profile['_id']}: '{old_value}' -> {new_value}")
    
    # Also handle null/missing pets fields
    cursor2 = profiles.find({"$or": [{"pets": None}, {"pets": {"$exists": False}}]})
    async for profile in cursor2:
        await profiles.update_one(
            {"_id": profile["_id"]},
            {
                "$set": {
                    "pets": [],
                    "updated_at": datetime.utcnow()
                }
            }
        )
        count += 1
        print(f"Migrated profile {profile['_id']}: null -> []")
    
    print(f"\n✅ Migration complete! Updated {count} profiles.")
    client.close()

if __name__ == "__main__":
    print("🔄 Starting pets field migration...")
    asyncio.run(migrate_pets_field())
