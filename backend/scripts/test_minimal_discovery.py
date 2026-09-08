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

async def test_minimal():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(
        database=client[settings.MONGODB_DB_NAME],
        document_models=[User, Profile, Match, AlgorithmFactor, AlgorithmHistory, ABTest]
    )
    
    admin = await User.find_one(User.email == "admin@testemail.com")
    print(f"Admin found: {admin is not None}")
    
    try:
        print("Calling get_discovery_queue...")
        results = await get_discovery_queue(
            limit=10,
            mode="suggested",
            curiosity_mode=False,
            current_user=admin
        )
        print(f"Call successful. Results type: {type(results)}")
        print(f"Results: {results}")
    except Exception as e:
        print(f"Caught exception: {type(e)} - {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_minimal())
