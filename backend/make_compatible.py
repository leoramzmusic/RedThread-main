"""
Make Sophie and Maria compatible with admin user for testing
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

async def make_compatible():
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.redthread
    
    print("🔍 Checking admin profile...")
    
    # Find admin user (try both emails)
    admin = await db.users.find_one({"email": {"$in": ["admin@testemail.com", "admin@redthread.com"]}})
    
    if not admin:
        print("❌ Admin user not found!")
        return
    
    admin_email = admin["email"]
    admin_id = str(admin["_id"])
    print(f"✅ Found admin: {admin_email} (ID: {admin_id})")
    
    # Get admin profile
    admin_profile = await db.profiles.find_one({"user_id": admin_id})
    
    if admin_profile:
        print(f"\n📋 Admin Profile:")
        print(f"  Interests: {admin_profile.get('interests', [])}")
        print(f"  Languages: {admin_profile.get('languages', [])}")
        print(f"  Age: {admin_profile.get('age')}")
    
    # Common interests to add (ensure at least 3 match with admin)
    common_interests = ["travel", "photography", "music", "technology", "art", "coffee", "cinema"]
    
    # Update Sophie
    print("\n🔄 Updating Sophie...")
    sophie = await db.users.find_one({"email": "sophie@redthread.com"})
    if sophie:
        sophie_id = str(sophie["_id"])
        result = await db.profiles.update_one(
            {"user_id": sophie_id},
            {
                "$set": {
                    "profile_visible": True,
                    "show_me_in_discovery": True,
                    "interests": ["yoga", "meditation", "nature", "travel", "wellness", "photography", "cooking", "music", "art"],
                    "languages": ["en", "fr", "es"],  # Added Spanish
                    "updated_at": datetime.utcnow()
                }
            }
        )
        print(f"  ✅ Sophie updated: {result.modified_count} document(s)")
    else:
        print("  ❌ Sophie not found")
    
    # Update María
    print("\n🔄 Updating María...")
    maria = await db.users.find_one({"email": "maria@redthread.com"})
    if maria:
        maria_id = str(maria["_id"])
        result = await db.profiles.update_one(
            {"user_id": maria_id},
            {
                "$set": {
                    "profile_visible": True,
                    "show_me_in_discovery": True,
                    "interests": ["art", "gaming", "anime", "design", "technology", "music", "cinema", "photography", "travel"],
                    "languages": ["es", "en", "fr"],  # Added French
                    "updated_at": datetime.utcnow()
                }
            }
        )
        print(f"  ✅ María updated: {result.modified_count} document(s)")
    else:
        print("  ❌ María not found")
    
    # Verify no existing matches
    print("\n🔍 Checking for existing matches...")
    matches = await db.matches.find({
        "$or": [
            {"user_id_1": admin_id},
            {"user_id_2": admin_id}
        ]
    }).to_list(length=100)
    
    if matches:
        print(f"  ⚠️  Found {len(matches)} existing matches for admin")
        for match in matches:
            other_id = match["user_id_2"] if match["user_id_1"] == admin_id else match["user_id_1"]
            other_user = await db.users.find_one({"_id": other_id})
            if other_user:
                print(f"    - {other_user.get('email')} (Status: {match.get('status')})")
    else:
        print("  ✅ No existing matches found")
    
    print("\n✨ Done! Sophie and María should now appear in admin's discovery queue.")
    print("   Refresh the Discover page to see them.")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(make_compatible())
