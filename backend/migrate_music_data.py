"""
Migration script to update MiHimno data from old format (list of IDs) to new format (list of objects)
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from src.core.config import settings


async def migrate_music_data():
    """Migrate old MiHimno data to new format"""
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    profiles_collection = db.profiles
    
    print("🔄 Starting migration...")
    
    # Find all profiles with mi_himno data
    cursor = profiles_collection.find({"mi_himno": {"$exists": True}})
    updated_count = 0
    
    async for profile in cursor:
        mi_himno = profile.get("mi_himno", {})
        if not mi_himno:
            continue
        
        needs_update = False
        
        # Preserve the 'connected' and 'service' fields
        connected = mi_himno.get("connected")
        service = mi_himno.get("service")
        
        # Check if favorite_artists is a list of strings (old format)
        favorite_artists = mi_himno.get("favorite_artists", [])
        if favorite_artists and isinstance(favorite_artists[0] if len(favorite_artists) > 0 else None, str):
            print(f"  Profile {profile['_id']}: Converting favorite_artists from IDs to empty list")
            mi_himno["favorite_artists"] = []
            needs_update = True
        
        # Check if featured_songs is a list of strings (old format)
        featured_songs = mi_himno.get("featured_songs", [])
        if featured_songs and isinstance(featured_songs[0] if len(featured_songs) > 0 else None, str):
            print(f"  Profile {profile['_id']}: Converting featured_songs from IDs to empty list")
            mi_himno["featured_songs"] = []
            needs_update = True
        
        # Restore connection status if it was set
        if connected:
            mi_himno["connected"] = connected
        if service:
            mi_himno["service"] = service
        
        # Update profile if needed
        if needs_update:
            await profiles_collection.update_one(
                {"_id": profile["_id"]},
                {"$set": {"mi_himno": mi_himno}}
            )
            updated_count += 1
    
    print(f"✅ Migration complete! Updated {updated_count} profiles.")
    client.close()


if __name__ == "__main__":
    asyncio.run(migrate_music_data())
