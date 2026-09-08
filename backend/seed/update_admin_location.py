"""
Update admin user location to Mexico City to see the new users.
Run with: python -m src.db.seed.update_admin_location
"""

import asyncio
from src.db.utils.connection import init_db
from src.models.user import User
from src.models.profile import Profile

ADMIN_EMAIL = "admin@redthread.com"
CDMX_COORDS = [-99.1332, 19.4326]

async def update_admin_location():
    print(f"📍 Updating location for {ADMIN_EMAIL}...")
    
    user = await User.find_one(User.email == ADMIN_EMAIL)
    if not user:
        print("❌ Admin user not found!")
        return
        
    profile = await Profile.find_one(Profile.user_id == str(user.id))
    if not profile:
        print("❌ Admin profile not found!")
        return
        
    # Update location
    if profile.location:
        profile.location.coordinates = CDMX_COORDS
        profile.location.city = "Mexico City"
        profile.location.country = "Mexico"
    else:
        # Create location if missing
        from src.models.profile import Location
        profile.location = Location(
            type="Point",
            coordinates=CDMX_COORDS,
            city="Mexico City",
            country="Mexico"
        )
        
    await profile.save()
    print(f"✅ Updated admin location to Mexico City: {CDMX_COORDS}")

async def main():
    await init_db()
    await update_admin_location()

if __name__ == "__main__":
    asyncio.run(main())

