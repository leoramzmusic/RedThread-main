"""
Script to check users in the database
Run with: python check_users.py
"""

import asyncio
from src.db.utils.connection import init_db
from src.db.schemas.user import User

async def check_users():
    """List all users"""
    
    print("🔍 Checking users...")
    
    await init_db()
    
    print(f"📂 Database: {User.get_motor_collection().database.name}")
    print(f"📂 Collection: {User.get_motor_collection().name}")
    
    users = await User.find_all().to_list()
    print(f"📊 Found {len(users)} users.")
    
    for user in users:
        print(f"   - {user.email} (Admin: {getattr(user, 'is_admin', False)})")

if __name__ == "__main__":
    asyncio.run(check_users())
