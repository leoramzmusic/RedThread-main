"""
Update admin profile to be compatible with test users
Makes admin a male heterosexual looking for females

Run with: python -m scripts.update_admin_profile
"""

import asyncio
from src.db.utils.connection import init_db
from src.db.schemas.user import User
from src.db.schemas.profile import Profile


async def update_admin_profile():
    """Update admin profile to be compatible with female test users"""
    
    print("👤 Updating Admin Profile...")
    print("=" * 60)
    
    # Find admin user
    admin_user = await User.find_one(User.email == "admin@redthread.com")
    
    if not admin_user:
        print("❌ Admin user not found. Please run the seed script first.")
        return
    
    # Find admin profile
    admin_profile = await Profile.find_one(Profile.user_id == str(admin_user.id))
    
    if not admin_profile:
        print("❌ Admin profile not found.")
        return
    
    print(f"📋 Current Profile:")
    print(f"   Name: {admin_profile.display_name}")
    print(f"   Gender: {admin_profile.gender}")
    print(f"   Sexual Orientation: {admin_profile.sexual_orientation}")
    print(f"   Looking for: {admin_profile.looking_for_gender}")
    print()
    
    # Update profile to be male heterosexual
    admin_profile.gender = "male"
    admin_profile.sexual_orientation = "heterosexual"
    admin_profile.looking_for_gender = ["female"]
    admin_profile.age = 30
    admin_profile.display_name = "Admin"
    admin_profile.bio = "System Administrator - Testing the app 🚀"
    admin_profile.interests = ["technology", "testing", "innovation"]
    admin_profile.hobbies = ["coding", "reading"]
    admin_profile.intentions = ["friendship", "conversation"]
    
    # Update location to Mexico City
    from src.db.schemas.profile import Location
    admin_profile.location = Location(
        type="Point",
        coordinates=[-99.1332, 19.4326],
        city="Ciudad de México",
        state="CDMX",
        country="México"
    )
    
    # Set age range preferences
    admin_profile.age_range_min = 18
    admin_profile.age_range_max = 45
    
    # Make profile visible
    admin_profile.profile_visible = True
    admin_profile.show_me_in_discovery = True
    
    await admin_profile.save()
    
    print(f"✅ Updated Profile:")
    print(f"   Name: {admin_profile.display_name}")
    print(f"   Gender: {admin_profile.gender}")
    print(f"   Sexual Orientation: {admin_profile.sexual_orientation}")
    print(f"   Looking for: {', '.join(admin_profile.looking_for_gender)}")
    print(f"   Age range: {admin_profile.age_range_min}-{admin_profile.age_range_max}")
    print(f"   Location: {admin_profile.location.city}")
    print()
    
    # Verify compatibility with test users
    print("🔍 Checking compatibility with test users...")
    print("-" * 60)
    
    from src.services.compatibility_service import CompatibilityService
    
    # Check compatibility with Sofia, Emma, and Isabella
    test_users = ["Sofía", "Emma", "Isabella"]
    
    for name in test_users:
        profile = await Profile.find_one(Profile.display_name == name)
        if profile:
            is_compat = CompatibilityService.is_compatible(admin_profile, profile)
            reason = CompatibilityService.get_compatibility_reason(admin_profile, profile)
            
            symbol = "✅" if is_compat else "❌"
            print(f"{symbol} Admin ↔️ {name}")
            if not is_compat:
                print(f"   {reason}")
    
    print()
    print("=" * 60)
    print("✅ Admin profile updated successfully!")


async def main():
    await init_db()
    await update_admin_profile()


if __name__ == "__main__":
    asyncio.run(main())
