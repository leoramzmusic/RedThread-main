import asyncio
import sys
from pathlib import Path

# Add parent directory to path to allow imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from src.core.config import settings
from src.models.user import User
from src.models.match import Match, MatchStatus, InteractionType
from beanie import init_beanie
from datetime import datetime

async def create_test_match():
    # Initialize Beanie
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(
        database=client[settings.MONGODB_DB_NAME],
        document_models=[User, Match]
    )
    
    # Find both users
    maria = await User.find_one(User.email == "maria@redthread.com")
    admin = await User.find_one(User.email == "admin@testemail.com")
    
    if not maria:
        print("❌ Usuario maria@redthread.com no encontrado")
        return
    
    if not admin:
        print("❌ Usuario admin@testemail.com no encontrado")
        return
    
    print(f"✓ Maria encontrada: {maria.id}")
    print(f"✓ Admin encontrado: {admin.id}")
    
    # Check if match already exists
    existing_match = await Match.find_one({
        "$or": [
            {"user_id_1": str(maria.id), "user_id_2": str(admin.id)},
            {"user_id_1": str(admin.id), "user_id_2": str(maria.id)}
        ]
    })
    
    if existing_match:
        print(f"\n⚠️  Ya existe un match entre estos usuarios (ID: {existing_match.id})")
        print(f"   Estado: {existing_match.status}")
        print(f"   Maria interacción: {existing_match.user_1_interaction}")
        print(f"   Admin interacción: {existing_match.user_2_interaction}")
        
        # Update to matched if not already
        if existing_match.status != MatchStatus.MATCHED:
            existing_match.user_1_interaction = InteractionType.LIKE
            existing_match.user_2_interaction = InteractionType.LIKE
            existing_match.status = MatchStatus.MATCHED
            existing_match.matched_at = datetime.utcnow()
            await existing_match.save()
            print("\n✅ Match actualizado a MATCHED")
        else:
            print("\n✅ El match ya está activo")
        return
    
    # Create new match
    new_match = Match(
        user_id_1=str(maria.id),
        user_id_2=str(admin.id),
        user_1_interaction=InteractionType.LIKE,
        user_2_interaction=InteractionType.LIKE,
        status=MatchStatus.MATCHED,
        affinity_score=85.0,
        matched_at=datetime.utcnow(),
        is_superlike=False
    )
    
    await new_match.save()
    
    print(f"\n✅ Match creado exitosamente!")
    print(f"   Match ID: {new_match.id}")
    print(f"   Estado: {new_match.status}")
    print(f"   Afinidad: {new_match.affinity_score}%")
    print(f"\n🎉 Maria y Admin ahora pueden chatear!")

if __name__ == "__main__":
    asyncio.run(create_test_match())
