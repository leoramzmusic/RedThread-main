import asyncio
from src.core.database import init_db
from src.models.user import User
from src.models.profile import Profile, CreativeIdentity
from src.api.games import get_dashboard
from datetime import datetime

async def verify_dashboard():
    await init_db()
    
    # Mock User
    user = User(
        id="test_dashboard_user", 
        email="test@test.com", 
        password_hash="hash",
        nickname="testnick",
        display_name="Test User"
    )
    # Mock Profile with Level 3
    profile = Profile(
        user_id="test_dashboard_user", 
        birth_date=datetime(1990, 1, 1),
        gender="male",
        creative_identity=CreativeIdentity(unlocked_levels=3)
    )
    await user.save()
    await profile.save()
    
    print("🚀 Testing Dashboard...")
    dashboard_data = await get_dashboard(user)
    
    print(f"✅ Items returned: {len(dashboard_data)}")
    for item in dashboard_data:
        print(f"   - {item['title']} ({item['status']})")
        
        if item['id'] == 'never_have_i_ever':
            # Level 3 should unlock this
            assert item['status'] == 'available'
            print("     -> Correctly Unlocked!")
            
        if item['id'] == 'hot_questions':
             # Level 3 < 5 should lock this
             assert item['status'] == 'locked'
             print("     -> Correctly Locked!")

    print("🎉 Dashboard Verification Successful!")
    
    # Cleanup
    await profile.delete()
    await user.delete()

if __name__ == "__main__":
    asyncio.run(verify_dashboard())
