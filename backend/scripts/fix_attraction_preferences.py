import asyncio
import sys
from pathlib import Path

# Add parent directory to path to allow imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from src.core.config import settings
from src.models.user import User
from src.models.profile import Profile
from beanie import init_beanie

async def fix_attraction_preferences():
    """Fix attraction preferences for admin and test profiles"""
    
    # Initialize Beanie
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(
        database=client[settings.MONGODB_DB_NAME],
        document_models=[User, Profile]
    )
    
    print(f"\n{'='*80}")
    print(f"ARREGLANDO PREFERENCIAS DE ATRACCIÓN")
    print(f"{'='*80}\n")
    
    # Find admin user
    admin_user = await User.find_one(User.email == "admin@testemail.com")
    if not admin_user:
        print("❌ Usuario admin@testemail.com no encontrado")
        return
    
    admin_profile = await Profile.find_one(Profile.user_id == str(admin_user.id))
    if not admin_profile:
        print("❌ Perfil de admin no encontrado")
        return
    
    print(f"📊 Perfil de Admin:")
    print(f"   Género: {admin_profile.gender}")
    print(f"   Orientación: {admin_profile.sexual_orientation}")
    
    # Set admin's attraction preferences
    # If gender is male, assume seeking female (straight) or both for better test coverage
    if admin_profile.gender == "male":
        admin_profile.attraction_preferences = ["female", "non_binary", "other"]
        seek_gender = "female"
    elif admin_profile.gender == "female":
        admin_profile.attraction_preferences = ["male", "non_binary", "other"]
        seek_gender = "male"
    else:
        admin_profile.attraction_preferences = ["male", "female", "non_binary", "other"]
        seek_gender = "female"

    await admin_profile.save()
    print(f"✅ Perfil de admin actualizado. Busca: {admin_profile.attraction_preferences}")
    
    # Now update test profiles to be attracted to admin's gender
    admin_gender = admin_profile.gender
    
    test_users = await User.find({"email": {"$regex": "@test\\.com$"}}).to_list()
    count = 0
    for user in test_users:
        profile = await Profile.find_one(Profile.user_id == str(user.id))
        if profile:
            # All test profiles will now be attracted to admin's gender to ensure they show up
            profile.attraction_preferences = [admin_gender, "non_binary", "other"]
            profile.profile_visible = True
            profile.show_me_in_discovery = True
            await profile.save()
            count += 1
            
    print(f"✅ {count} perfiles de prueba actualizados para ser compatibles con admin@testemail.com")
    print(f"\n💡 EXPLICACIÓN: Discovery requiere atracción MUTUA. Admin debe buscar el género de Prueba, y Prueba debe buscar el género de Admin.")
    print(f"Ahora recarga (F5) la página de Descubrimiento.")

if __name__ == "__main__":
    asyncio.run(fix_attraction_preferences())
