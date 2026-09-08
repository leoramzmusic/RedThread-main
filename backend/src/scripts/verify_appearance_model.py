import asyncio
import sys
import os

# Add project root to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from src.models.appearance import AppearanceResource, AppearanceType, Platform
from src.core.database import init_db, close_db
from src.core.config import settings

async def verify_appearance_model():
    print("Verifying Appearance Model...")
    await init_db()
    
    # Create a test resource
    resource = AppearanceResource(
        type=AppearanceType.LOGO,
        platform=Platform.WEB,
        url="/static/test_logo.png",
        metadata={"variant": "main"},
        is_active=True
    )
    
    try:
        await resource.insert()
        print(f"Created resource: {resource.id}")
        
        # Retrieve
        saved = await AppearanceResource.get(resource.id)
        assert saved is not None
        assert saved.url == "/static/test_logo.png"
        print("Retrieved resource successfully")
        
        # Cleanup
        await saved.delete()
        print("Deleted resource successfully")
        
    except Exception as e:
        print(f"Error: {e}")
        raise
    finally:
        await close_db()

if __name__ == "__main__":
    asyncio.run(verify_appearance_model())
