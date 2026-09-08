import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from src.core.config import settings
from src.models.match import Match
from beanie import init_beanie
from pydantic import ValidationError

async def test_matches():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(
        database=client[settings.MONGODB_DB_NAME],
        document_models=[Match]
    )
    
    print("Fetching matches...")
    try:
        # This will trigger Pydantic validation for all documents
        matches = await Match.find().limit(100).to_list()
        print(f"Successfully loaded {len(matches)} matches.")
    except ValidationError as e:
        print(f"Validation Error caught: {e}")
    except Exception as e:
        print(f"Unexpected Error: {type(e).__name__}: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_matches())
