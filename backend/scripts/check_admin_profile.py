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

async def check_admin_profile():
    """Check admin profile completeness and attributes"""
    
    # Initialize Beanie
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(
        database=client[settings.MONGODB_DB_NAME],
        document_models=[User, Profile]
    )
    
    # Find admin user
    admin_user = await User.find_one(User.email == "admin@testemail.com")
    if not admin_user:
        print("❌ Usuario admin@testemail.com no encontrado")
        return
    
    print(f"\n{'='*80}")
    print(f"PERFIL DE ADMIN")
    print(f"{'='*80}\n")
    
    # Get profile
    profile = await Profile.find_one(Profile.user_id == str(admin_user.id))
    if not profile:
        print("❌ Perfil de admin no encontrado")
        return
    
    print(f"📧 Email: {admin_user.email}")
    print(f"👤 Display Name: {admin_user.display_name}")
    print(f"🆔 User ID: {admin_user.id}")
    print(f"\n{'='*80}")
    print(f"ATRIBUTOS DEL PERFIL")
    print(f"{'='*80}\n")
    
    print(f"Género: {profile.gender}")
    print(f"Edad: {profile.age}")
    print(f"Orientación sexual: {profile.sexual_orientation}")
    print(f"Preferencias de atracción: {profile.attraction_preferences}")
    print(f"Intenciones: {profile.intentions}")
    print(f"Intereses: {profile.interests} ({len(profile.interests)} total)")
    print(f"\nPerfil visible: {profile.profile_visible}")
    print(f"Mostrar en descubrimiento: {profile.show_me_in_discovery}")
    
    # Location
    if profile.location:
        print(f"\nUbicación:")
        print(f"  Ciudad: {profile.city}")
        print(f"  Estado: {profile.location.state}")
        print(f"  País: {profile.location.country}")
        print(f"  Coordenadas: {profile.location.coordinates}")
        print(f"  Radio de búsqueda: {profile.distance_preference_km} km")
    else:
        print(f"\n⚠️  Sin ubicación configurada")
    
    # Calculate completeness
    completeness_fields = {
        "bio": bool(profile.bio),
        "photos": len(profile.photos) > 0,
        "interests": len(profile.interests) >= 3,
        "intentions": len(profile.intentions) > 0,
        "location": profile.location is not None,
        "gender": bool(profile.gender),
        "sexual_orientation": bool(profile.sexual_orientation),
    }
    
    completeness = sum(completeness_fields.values()) / len(completeness_fields) * 100
    
    print(f"\n{'='*80}")
    print(f"COMPLETITUD DEL PERFIL: {completeness:.1f}%")
    print(f"{'='*80}\n")
    
    for field, complete in completeness_fields.items():
        status = "✅" if complete else "❌"
        print(f"{status} {field}")
    
    # Count test profiles
    test_users = await User.find({"email": {"$regex": "@test\\.com$"}}).to_list()
    print(f"\n{'='*80}")
    print(f"PERFILES DE PRUEBA DISPONIBLES: {len(test_users)}")
    print(f"{'='*80}\n")
    
    # Check compatibility with test profiles
    if len(test_users) > 0:
        print("Verificando compatibilidad con perfiles de prueba...\n")
        compatible_count = 0
        
        for test_user in test_users[:5]:  # Check first 5
            test_profile = await Profile.find_one(Profile.user_id == str(test_user.id))
            if not test_profile:
                continue
            
            # Check mutual attraction
            admin_attracted = test_profile.gender in (profile.attraction_preferences or [])
            test_attracted = profile.gender in (test_profile.attraction_preferences or [])
            
            if admin_attracted and test_attracted:
                compatible_count += 1
                print(f"✅ Compatible con {test_user.email}")
                print(f"   {test_profile.gender} ({test_profile.sexual_orientation}) - {test_profile.city}")
            else:
                print(f"❌ NO compatible con {test_user.email}")
                print(f"   Admin atracción: {admin_attracted}, Test atracción: {test_attracted}")
        
        print(f"\nTotal compatibles (muestra): {compatible_count}/5")

if __name__ == "__main__":
    asyncio.run(check_admin_profile())
