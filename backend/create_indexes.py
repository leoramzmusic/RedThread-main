import asyncio
from src.db.utils.connection import init_db
from src.db.schemas.profile import Profile
import pymongo

async def create_indexes():
    print("Initializing DB...")
    await init_db()
    
    print("Creating 2dsphere index on Profile.location...")
    try:
        # Beanie uses the underlying motor collection
        await Profile.get_motor_collection().create_index([("location", pymongo.GEOSPHERE)])
        print("✅ Index created successfully!")
    except Exception as e:
        print(f"❌ Error creating index: {e}")

if __name__ == "__main__":
    asyncio.run(create_indexes())
