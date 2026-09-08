"""
Script to update admin user to VIP subscription tier
Run with: python backend/update_admin_vip.py
"""

import asyncio
from src.db.utils.connection import init_db
from src.db.schemas.user import User, SubscriptionTier

async def update_admin_vip():
    """Update admin user to VIP"""
    
    print("🔄 Connecting to database...")
    await init_db()
    
    print("🔍 Finding admin user...")
    admin_email = "admin@redthread.com"
    user = await User.find_one(User.email == admin_email)
    
    if not user:
        print(f"❌ Admin user {admin_email} not found")
        return

    print(f"👤 Found user: {user.email}")
    print(f"   Current Tier: {user.subscription_tier}")
    
    # Update to VIP
    user.subscription_tier = SubscriptionTier.VIP
    await user.save()
    
    print(f"✅ Updated to: {user.subscription_tier}")
    print("🎉 Admin is now VIP!")

if __name__ == "__main__":
    asyncio.run(update_admin_vip())
