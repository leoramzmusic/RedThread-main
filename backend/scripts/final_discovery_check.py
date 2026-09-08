import asyncio
import sys
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

async def final_check():
    # Initialize Beanie
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(
    database=client[settings.MONGODB_DB_NAME],
    document_models=[User, Profile, Match, AlgorithmFactor, AlgorithmHistory, ABTest]
    )
    
    admin_email = "admin@testemail.com"
    admin = await User.find_one(User.email == admin_email)
    
    for mode in ["suggested", "opposites"]:
        print(f"\nMode: {mode.upper()}")
        results = await get_discovery_queue(limit=10, mode=mode, current_user=admin)
        print(f"Results found: {len(results)}")
        for i, res in enumerate(results[:5]):
            score = getattr(res, 'affinity_score', 0)
            print(f"  [{i+1}] {res.display_name} - Score: {score:.1f}%")

if __name__ == "__main__":
    asyncio.run(final_check())
