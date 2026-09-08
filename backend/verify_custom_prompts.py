import asyncio
from src.core.database import init_db
from src.models.user import User
from src.models.profile import Profile, CreativeIdentity
from src.api.games import create_custom_prompt, CreatePromptRequest, GameType
from src.models.creative_identity import GamePrompt

async def verify_custom_prompts():
    await init_db()
    
    # Mock User & Profile
    user_id = "test_editor_user"
    user = User(id=user_id, email="test_ed@test.com", password_hash="hash", nickname="editor", display_name="Editor")
    profile = Profile(
        user_id=user_id, 
        creative_identity=CreativeIdentity()
    )
    await user.save()
    await profile.save()
    
    print("🚀 Testing Custom Prompts...")
    
    # Create Request
    req = CreatePromptRequest(
        text="My custom dare script",
        game_type=GameType.TRUTH_OR_DARE,
        category="custom"
    )
    
    # Call Endpoint
    new_prompt = await create_custom_prompt(req, user)
    
    print(f"✅ Prompt Created: {new_prompt.id}")
    assert new_prompt.text == "My custom dare script"
    
    # Verify Persistence
    updated_profile = await Profile.find_one(Profile.user_id == user_id)
    assert len(updated_profile.creative_identity.custom_prompts) == 1
    saved_prompt = updated_profile.creative_identity.custom_prompts[0]
    assert saved_prompt.text == "My custom dare script"
    
    print("🎉 Custom Prompt Verification Successful!")
    
    # Cleanup
    await profile.delete()
    await user.delete()

if __name__ == "__main__":
    asyncio.run(verify_custom_prompts())
