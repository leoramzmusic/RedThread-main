"""
Fix compatibility data (looking_for_gender) for all users.
Run with: python -m src.db.seed.fix_compatibility
"""

import asyncio
from src.db.utils.connection import init_db
from src.models.profile import Profile, Gender

async def fix_compatibility():
    print("🔧 Fixing compatibility data...")
    
    # 1. Fix Admin Profile
    admin_profile = await Profile.find_one(Profile.display_name == "Admin User")
    if admin_profile:
        print(f"   Updating admin: {admin_profile.display_name}")
        # Admin is interested in everyone
        admin_profile.looking_for_gender = [
            Gender.MALE, 
            Gender.FEMALE, 
            Gender.NON_BINARY, 
            Gender.OTHER,
            Gender.PREFER_NOT_TO_SAY
        ]
        await admin_profile.save()
    
    # 2. Fix All Other Profiles
    profiles = await Profile.find_all().to_list()
    count = 0
    
    for profile in profiles:
        if profile.display_name == "Admin User":
            continue
            
        # Make everyone interested in everyone for testing purposes
        # This ensures mutual compatibility with the admin (who is 'other')
        if not profile.looking_for_gender:
            profile.looking_for_gender = [
                Gender.MALE, 
                Gender.FEMALE, 
                Gender.NON_BINARY, 
                Gender.OTHER,
                Gender.PREFER_NOT_TO_SAY
            ]
            await profile.save()
            count += 1
            
    print(f"✅ Updated {count} profiles with default gender preferences.")
    print("   All users should now be mutually compatible.")

async def main():
    await init_db()
    await fix_compatibility()

if __name__ == "__main__":
    asyncio.run(main())

