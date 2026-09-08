import asyncio
import os
import sys

# Add backend root and src to path
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(current_dir, ".."))
sys.path.append(root_dir)

from src.core.database import init_db
from src.models.user import User

async def list_users():
    await init_db()
    
    users = await User.find_all().to_list()
    print(f"Total users: {len(users)}")
    for u in users:
        print(f" - {u.email} (Nickname: {u.nickname}, Active: {u.is_active})")

if __name__ == "__main__":
    asyncio.run(list_users())
