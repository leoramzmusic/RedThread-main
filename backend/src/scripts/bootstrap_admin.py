"""
Bootstrap script to create initial super admin user.
Run with: python -m src.scripts.bootstrap_admin <email>
"""
import asyncio
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from src.models.user import User
from src.models.admin_rbac import AdminUser, AdminRole
from src.core.config import settings


async def create_super_admin(email: str):
    """Create or update a user to be a super admin"""
    # Initialize database connection
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    database = client[settings.MONGODB_DB_NAME]
    
    await init_beanie(
        database=database,
        document_models=[User, AdminUser]
    )
    
    # Find user by email
    user = await User.find_one(User.email == email)
    if not user:
        print(f"❌ User with email {email} not found")
        print(f"   Please create a user account first, then run this script again.")
        return
    
    # Check if already admin
    existing_admin = await AdminUser.find_one(AdminUser.user_id == str(user.id))
    if existing_admin:
        print(f"⚠️  User {email} is already an admin with role: {existing_admin.role}")
        print(f"   Updating to SUPER_ADMIN...")
        existing_admin.role = AdminRole.SUPER_ADMIN
        existing_admin.is_active = True
        await existing_admin.save()
        print(f"✅ Updated {email} to SUPER_ADMIN")
    else:
        # Create new admin user
        admin_user = AdminUser(
            user_id=str(user.id),
            role=AdminRole.SUPER_ADMIN,
            is_active=True
        )
        await admin_user.insert()
        print(f"✅ Created SUPER_ADMIN for {email}")
    
    print(f"\n📋 Admin Details:")
    print(f"   User ID: {user.id}")
    print(f"   Email: {user.email}")
    print(f"   Nickname: {user.nickname}")
    print(f"   Role: SUPER_ADMIN")
    print(f"   Permissions: ALL")
    print(f"\n🎉 You can now access the admin portal at /portal-redthread")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python -m src.scripts.bootstrap_admin <email>")
        print("Example: python -m src.scripts.bootstrap_admin admin@redthread.com")
        sys.exit(1)
    
    email = sys.argv[1]
    asyncio.run(create_super_admin(email))
