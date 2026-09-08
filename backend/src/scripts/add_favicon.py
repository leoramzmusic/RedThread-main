import asyncio
import sys
import os

sys.path.append(os.path.join(os.getcwd(), 'backend'))

from src.models.appearance import AppearanceResource, AppearanceType, Platform
from src.core.database import init_db, close_db

async def add_favicon():
    await init_db()
    
    # Deactivate existing active favicons
    await AppearanceResource.find(
        AppearanceResource.type == AppearanceType.FAVICON,
        AppearanceResource.is_active == True
    ).update({"$set": {"is_active": False}})
    
    # Create new favicon resource
    resource = AppearanceResource(
        type=AppearanceType.FAVICON,
        platform=Platform.WEB,
        url="/static/uploads/appearance/favicon_main.png",
        resolution="512x512",
        is_active=True
    )
    await resource.insert()
    print("Favicon added and activated.")
    await close_db()

if __name__ == "__main__":
    asyncio.run(add_favicon())
