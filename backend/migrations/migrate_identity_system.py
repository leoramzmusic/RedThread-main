"""
Database migration script for three-tier identity system.

This script migrates existing users to the new identity system:
- Adds real_name (optional), display_name, and nickname fields to User documents
- Removes display_name from Profile documents
- Sets nickname to user ID for existing users (can be changed later)
"""
import asyncio
from datetime import datetime
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from src.models.user import User
from src.models.profile import Profile
from src.core.config import settings


async def migrate_identity_system():
    """Migrate existing users to three-tier identity system"""
    
    print("🔄 Starting identity system migration...")
    
    # Connect to database
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    database = client[settings.MONGODB_DB_NAME]
    
    # Initialize Beanie
    await init_beanie(
        database=database,
        document_models=[User, Profile]
    )
    
    # Get all users
    users = await User.find_all().to_list()
    print(f"📊 Found {len(users)} users to migrate")
    
    migration_count = 0
    error_count = 0
    
    for user in users:
        try:
            # Skip if already migrated
            if hasattr(user, 'nickname') and user.nickname and user.nickname != "user":
                print(f"⏭️  User {user.email or user.phone} already migrated")
                continue
            
            # Get user's profile
            profile = await Profile.find_one(Profile.user_id == str(user.id))
            
            if not profile:
                print(f"⚠️  No profile found for user {user.email or user.phone}, skipping")
                error_count += 1
                continue
            
            # Set display_name from profile's display_name or email
            if hasattr(profile, 'display_name') and profile.display_name:
                display_name = profile.display_name
            elif user.email:
                display_name = user.email.split('@')[0]
            elif user.phone:
                display_name = f"User {user.phone[-4:]}"
            else:
                display_name = "User"
            
            # Set nickname to user ID (unique by default, user can change later)
            nickname = str(user.id)
            
            # real_name is optional for now (will be filled during verification)
            real_name = None
            
            # Update user with new fields
            user.real_name = real_name
            user.display_name = display_name
            user.nickname = nickname
            user.nickname_last_changed = None  # No restriction on first change
            user.verified = False  # Default to not verified
            user.updated_at = datetime.utcnow()
            
            await user.save()
            
            print(f"✅ Migrated user: {user.email or user.phone} → nickname: {nickname}, display: {display_name}")
            migration_count += 1
            
        except Exception as e:
            print(f"❌ Error migrating user {user.email or user.phone}: {str(e)}")
            error_count += 1
            continue
    
    print(f"\n✨ Migration complete!")
    print(f"   - Successfully migrated: {migration_count} users")
    print(f"   - Errors: {error_count}")
    
    # Close connection
    client.close()


async def verify_migration():
    """Verify that migration was successful"""
    
    print("\n🔍 Verifying migration...")
    
    # Connect to database
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    database = client[settings.MONGODB_DB_NAME]
    
    # Initialize Beanie
    await init_beanie(
        database=database,
        document_models=[User, Profile]
    )
    
    # Check all users have required fields
    users = await User.find_all().to_list()
    
    missing_fields = []
    duplicate_nicknames = {}
    
    for user in users:
        # Check required fields
        if not hasattr(user, 'display_name') or not user.display_name:
            missing_fields.append(f"{user.email or user.phone}: missing display_name")
        
        if not hasattr(user, 'nickname') or not user.nickname:
            missing_fields.append(f"{user.email or user.phone}: missing nickname")
        else:
            # Check for duplicate nicknames
            if user.nickname in duplicate_nicknames:
                duplicate_nicknames[user.nickname].append(user.email or user.phone)
            else:
                duplicate_nicknames[user.nickname] = [user.email or user.phone]
    
    # Report results
    if missing_fields:
        print(f"⚠️  Found {len(missing_fields)} users with missing fields:")
        for issue in missing_fields[:10]:  # Show first 10
            print(f"   - {issue}")
    else:
        print("✅ All users have required identity fields")
    
    # Check for duplicates
    duplicates = {k: v for k, v in duplicate_nicknames.items() if len(v) > 1}
    if duplicates:
        print(f"⚠️  Found {len(duplicates)} duplicate nicknames:")
        for nickname, users_list in list(duplicates.items())[:10]:  # Show first 10
            print(f"   - {nickname}: {', '.join(users_list)}")
    else:
        print("✅ All nicknames are unique")
    
    print(f"\n📊 Migration Statistics:")
    print(f"   - Total users: {len(users)}")
    print(f"   - Unique nicknames: {len(duplicate_nicknames)}")
    
    # Close connection
    client.close()


if __name__ == "__main__":
    print("=" * 60)
    print("Three-Tier Identity System Migration")
    print("=" * 60)
    
    # Run migration
    asyncio.run(migrate_identity_system())
    
    # Verify migration
    asyncio.run(verify_migration())
    
    print("\n" + "=" * 60)
    print("Migration complete! Please review the results above.")
    print("=" * 60)

