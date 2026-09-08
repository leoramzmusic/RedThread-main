import asyncio
from src.db.utils.connection import init_db
from src.models.user import User
from src.models.admin_rbac import AdminUser, AdminRole

async def grant_permissions():
    print("🔌 Connecting to database...")
    await init_db()
    
    email = "admin@redthread.com"
    print(f"🔍 Finding user {email}...")
    
    user = await User.find_one(User.email == email)
    if not user:
        print(f"❌ User {email} not found!")
        return
        
    print(f"✅ Found user: {user.id}")
    
    # Check if AdminUser exists
    admin_user = await AdminUser.find_one(AdminUser.user_id == str(user.id))
    
    if admin_user:
        print(f"⚠️ AdminUser already exists with role: {admin_user.role}")
        admin_user.role = AdminRole.SUPER_ADMIN
        await admin_user.save()
        print(f"✅ Updated role to SUPER_ADMIN")
    else:
        print("🌱 Creating new AdminUser document...")
        admin_user = AdminUser(
            user_id=str(user.id),
            role=AdminRole.SUPER_ADMIN,
            is_active=True
        )
        await admin_user.insert()
        print(f"✅ Created AdminUser with SUPER_ADMIN role")
        
    print("🎉 Permissions granted successfully!")

if __name__ == "__main__":
    asyncio.run(grant_permissions())
