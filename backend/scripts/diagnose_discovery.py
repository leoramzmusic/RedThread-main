import asyncio
import sys
from pathlib import Path

# Add parent directory to path to allow imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from src.core.config import settings
from src.models.user import User, SubscriptionTier
from src.models.profile import Profile, Gender
from src.models.match import Match
from src.models.algorithm_management import AlgorithmFactor, AlgorithmHistory, ABTest
from beanie import init_beanie
from src.care.adapters import profile_to_user_profile, profile_to_candidate_profile
from src.care.scoring.compatibility import compatibility_score
from src.care.ranking.ranker import cold_start_recommendations, rank_candidates
from src.care.models.system_params import SystemParams

async def diagnose_discovery():
    """Diagnose why discovery is empty for admin"""
    
    # Initialize Beanie
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(
        database=client[settings.MONGODB_DB_NAME],
        document_models=[User, Profile, Match, AlgorithmFactor, AlgorithmHistory, ABTest]
    )
    
    admin_user = await User.find_one(User.email == "admin@testemail.com")
    if not admin_user:
        print("❌ Admin user not found")
        return
        
    admin_profile = await Profile.find_one(Profile.user_id == str(admin_user.id))
    if not admin_profile:
        print("❌ Admin profile not found")
        return
        
    print(f"\nDIAGNÓSTICO DE DISCOVERY PARA: {admin_user.email}")
    print(f"Tier: {admin_user.subscription_tier}")
    print(f"Género: {admin_profile.gender}")
    print(f"Busca: {admin_profile.attraction_preferences}")
    print(f"Ubicación: {admin_profile.city}, {admin_profile.location.country if admin_profile.location else 'N/A'}")
    
    # Modes to test
    modes = ['suggested', 'opposites', 'blind', 'free']
    
    for mode in modes:
        print(f"\n{'-'*40}")
        print(f"MODO: {mode.upper()}")
        print(f"{'-'*40}")
        
        # 1. Simulate Query
        excluded_ids = [str(admin_user.id)] # Simplified
        query = {
            "profile_visible": True,
            "show_me_in_discovery": True,
            "user_id": {"$nin": excluded_ids}
        }
        
        # Attraction filter (simplified from discovery.py)
        if admin_profile.attraction_preferences:
            query["gender"] = {"$in": admin_profile.attraction_preferences}
        
        # Mutual attraction
        if mode != "free" and admin_profile.gender != Gender.PREFER_NOT_TO_SAY:
            query["attraction_preferences"] = {"$in": [admin_profile.gender]}
            
        candidate_profiles = await Profile.find(query).to_list()
        print(f"1. Query DB encontró: {len(candidate_profiles)} candidatos raw")
        
        if not candidate_profiles:
            print("   No raw candidates found.")
            continue
            
        # 2. Ranking
        user_profile = profile_to_user_profile(admin_profile, admin_user)
        candidates = [profile_to_candidate_profile(p, admin_user) for p in candidate_profiles]
        params = SystemParams()
        strict_mode = (mode != "free")
        
        # Use cold start as user likely has few matches
        ranked = await cold_start_recommendations(user_profile, candidates, params, strict=strict_mode)
        print(f"2. Ranking CARE devolvio: {len(ranked)} candidatos")
        
        if not ranked:
            print("   WARNING: Ranking devolvio 0. Posiblemente por filtros de distancia o compatibilidad estricta.")
            continue
            
        # 3. Compatibility Filtering (Mode Specific)
        filtered = []
        scores = []
        for item in ranked:
            score = item['compat_score'] * 100
            scores.append(score)
            
            passed = False
            if mode == 'opposites':
                passed = score < 60 # Relaxed from 50
            elif mode == 'blind':
                passed = score >= 65 # Relaxed from 70
            elif mode == 'suggested':
                passed = score >= 35 # Relaxed from 40
            elif mode == 'free':
                passed = True
            
            if passed:
                filtered.append(item)
                
        print(f"3. Filtro de compatibilidad del modo: {len(filtered)}/{len(ranked)} pasaron")
        if scores:
            print(f"   Scores encontrados: [min: {min(scores):.1f}, max: {max(scores):.1f}, avg: {sum(scores)/len(scores):.1f}]")
        
        if not filtered and ranked:
            print(f"   FAIL: TODOS los candidatos fueron rechazados por el umbral de '{mode}'.")
            if mode == 'opposites':
                print("      Tip: Los perfiles son DEMASIADO compatibles para ser 'Opuestos'.")
            elif mode in ['suggested', 'blind']:
                print(f"      Tip: Los perfiles son POCO compatibles para ser '{mode}'.")

if __name__ == "__main__":
    asyncio.run(diagnose_discovery())
