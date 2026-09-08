import asyncio
from src.core.database import init_db
from src.models.appearance import AppearanceResource

async def main():
    await init_db()
    
    web_count = await AppearanceResource.find(AppearanceResource.platform == "web").count()
    android_count = await AppearanceResource.find(AppearanceResource.platform == "android").count()
    ios_count = await AppearanceResource.find(AppearanceResource.platform == "ios").count()
    
    print(f"Web: {web_count}")
    print(f"Android: {android_count}")
    print(f"iOS: {ios_count}")

if __name__ == "__main__":
    asyncio.run(main())
