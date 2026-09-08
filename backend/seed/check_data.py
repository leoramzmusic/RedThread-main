"""
Check data counts in the database
Run with: python -m src.db.seed.check_data
"""

import asyncio
from src.db.utils.connection import init_db
from src.models.user import User
from src.models.profile import Profile

async def check_data():
    print("🔍 Checking database counts...")
    
    user_count = await User.count()
    profile_count = await Profile.count()
    
    print(f"📊 Users in DB: {user_count}")
    print(f"📊 Profiles in DB: {profile_count}")
    
    if user_count > 0:
        print("\nLatest 5 users:")
        users = await User.find_all().sort("-created_at").limit(5).to_list()
        for user in users:
            print(f"   - {user.email} (Created: {user.created_at})")

async def main():
    await init_db()
    await check_data()

if __name__ == "__main__":
    asyncio.run(main())

