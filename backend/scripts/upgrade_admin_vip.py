import asyncio
import sys
from pathlib import Path

# Add parent directory to path to allow imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from src.core.config import settings
from src.models.user import User, SubscriptionTier
from src.models.profile import Profile
from beanie import init_beanie

async def upgrade_admin():
    """Upgrade admin@testemail.com to VIP tier"""
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(database=client[settings.MONGODB_DB_NAME], document_models=[User])
    
    admin_user = await User.find_one(User.email == "admin@testemail.com")
    if admin_user:
        admin_user.subscription_tier = SubscriptionTier.VIP
        await admin_user.save()
        print(f"✅ Usuario {admin_user.email} actualizado a tier VIP")
    else:
        print("❌ Usuario admin@testemail.com no encontrado")

if __name__ == "__main__":
    asyncio.run(upgrade_admin())
