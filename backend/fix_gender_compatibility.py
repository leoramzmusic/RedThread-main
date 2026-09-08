"""
Fix gender compatibility - ensure admin is looking for females
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

async def fix_gender_compatibility():
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.redthread
    
    print("🔍 Fixing gender compatibility...")
    
    # Find admin user
    admin = await db.users.find_one({"email": {"$in": ["admin@testemail.com", "admin@redthread.com"]}})
    
    if not admin:
        print("❌ Admin user not found!")
        return
    
    admin_id = str(admin["_id"])
    admin_email = admin["email"]
    print(f"✅ Found admin: {admin_email}")
    
    # Get admin profile
    admin_profile = await db.profiles.find_one({"user_id": admin_id})
    
    if admin_profile:
        print(f"\n📋 Current Admin Profile:")
        print(f"  Gender: {admin_profile.get('gender')}")
        print(f"  Looking for gender: {admin_profile.get('looking_for_gender', [])}")
        print(f"  Intentions: {admin_profile.get('intentions', [])}")
        print(f"  Interests: {admin_profile.get('interests', [])[:5]}...")
        print(f"  Languages: {admin_profile.get('languages', [])}")
    
    # Update admin to look for females and have compatible intentions
    print("\n🔄 Updating admin profile...")
    result = await db.profiles.update_one(
        {"user_id": admin_id},
        {
            "$set": {
                "looking_for_gender": ["female", "non_binary"],  # Include both
                "intentions": ["friendship", "romance", "conversation"],  # Compatible with Sophie & María
                "interests": ["travel", "photography", "music", "art", "technology", "coffee", "cinema", "gaming"],
                "languages": ["en", "es", "fr"],  # All three languages
                "profile_visible": True,
                "show_me_in_discovery": True,
                "age_range_min": 18,
                "age_range_max": 35,  # Include Sophie (27) and María (25)
                "updated_at": datetime.utcnow()
            }
        }
    )
    print(f"  ✅ Admin updated: {result.modified_count} document(s)")
    
    # Verify Sophie and María profiles
    print("\n🔍 Verifying Sophie and María...")
    
    sophie = await db.users.find_one({"email": "sophie@redthread.com"})
    if sophie:
        sophie_profile = await db.profiles.find_one({"user_id": str(sophie["_id"])})
        if sophie_profile:
            print(f"\n  Sophie:")
            print(f"    Gender: {sophie_profile.get('gender')}")
            print(f"    Intentions: {sophie_profile.get('intentions', [])}")
            print(f"    Profile visible: {sophie_profile.get('profile_visible')}")
            print(f"    Show in discovery: {sophie_profile.get('show_me_in_discovery')}")
    
    maria = await db.users.find_one({"email": "maria@redthread.com"})
    if maria:
        maria_profile = await db.profiles.find_one({"user_id": str(maria["_id"])})
        if maria_profile:
            print(f"\n  María:")
            print(f"    Gender: {maria_profile.get('gender')}")
            print(f"    Intentions: {maria_profile.get('intentions', [])}")
            print(f"    Profile visible: {maria_profile.get('profile_visible')}")
            print(f"    Show in discovery: {maria_profile.get('show_me_in_discovery')}")
    
    print("\n✨ Done! Admin should now see Sophie and María in discovery.")
    print("   Clear Redis cache if using: redis-cli FLUSHALL")
    print("   Then refresh the Discover page.")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_gender_compatibility())
