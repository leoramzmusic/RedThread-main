import asyncio
import sys
import os
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from src.core.config import settings
from src.models.user import User
from src.models.profile import Profile
from src.models.match import Match
from src.models.algorithm_management import AlgorithmFactor, AlgorithmHistory, ABTest
from src.api.discovery import get_discovery_queue

async def verify():
    # Initialize Beanie
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(
        database=client[settings.MONGODB_DB_NAME],
        document_models=[User, Profile, Match, AlgorithmFactor, AlgorithmHistory, ABTest]
    )
    
    admin_email = "admin@testemail.com"
    admin = await User.find_one(User.email == admin_email)
    
    if not admin:
        print(f"Error: Admin user {admin_email} not found.")
        return

    print(f"--- Verifying Discovery for Admin: {admin_email} ---")
    
    modes = ["suggested", "opposites", "blind", "free"]
    curiosity_states = [False, True]
    
    for curious in curiosity_states:
        print(f"\n{'='*20} Curiosity Mode: {curious} {'='*20}")
        for mode in modes:
            print(f"\nTesting mode: {mode.upper()}")
            try:
                # Simulate API call
                print(f"Calling get_discovery_queue(mode={mode}, curious={curious})...")
                results = await get_discovery_queue(
                    limit=10,
                    mode=mode,
                    curiosity_mode=curious,
                    current_user=admin
                )
                
                print(f"Type of results: {type(results)}")
                print(f"Results found: {len(results)}")
                for i, res in enumerate(results[:3]):
                    # Check if res is a dict or object
                    if isinstance(res, dict):
                        name = res.get('display_name', 'Unknown')
                        age = res.get('age', 0)
                        score = res.get('affinity_score', 0)
                    else:
                        name = getattr(res, 'display_name', 'Unknown')
                        age = getattr(res, 'age', 0)
                        score = getattr(res, 'affinity_score', 0)
                    print(f"  [{i+1}] {name} (Age: {age}) - Compatibility: {score:.1f}%")
                
            except Exception as e:
                print(f"  [X] CAUGHT ERROR: {type(e).__name__}: {str(e)}")
                if hasattr(e, 'detail'):
                    print(f"      Detail: {e.detail}")
                import traceback
                traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(verify())
