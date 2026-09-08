import asyncio
from src.db.utils.connection import init_db
from src.db.schemas.profile import Profile
from src.db.schemas.user import User

async def check_data():
    await init_db()
    
    # Count profiles
    profiles = await Profile.find().to_list()
    print(f"Total profiles in DB: {len(profiles)}")
    
    # Find admin user
    admin_user = await User.find_one(User.email == "admin@testemail.com")
    if admin_user:
        print(f"\nAdmin user found: {admin_user.email}")
        print(f"Admin user ID: {admin_user.id}")
        print(f"Admin display_name: {admin_user.display_name}")
        
        # Find admin profile
        admin_profile = await Profile.find_one(Profile.user_id == str(admin_user.id))
        if admin_profile:
            print(f"\nAdmin profile found!")
            print(f"Profile age: {admin_profile.age}")
            print(f"Profile gender: {admin_profile.gender}")
            print(f"Profile interests: {admin_profile.interests[:3]}")
            print(f"Profile photos: {len(admin_profile.photos)}")
        else:
            print("\nAdmin profile NOT found!")
    else:
        print("Admin user NOT found!")
    
    # Check sample profiles
    sample_profiles = await Profile.find().limit(5).to_list()
    print(f"\nSample of {len(sample_profiles)} profiles:")
    for p in sample_profiles:
        user = await User.find_one(User.id == p.user_id)
        if user:
            print(f"  - {user.email}: age={p.age}, gender={p.gender}")

if __name__ == "__main__":
    asyncio.run(check_data())
