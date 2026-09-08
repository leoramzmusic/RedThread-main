import asyncio
from src.core.database import init_db
from src.services.game_engine_service import GameEngineService
from src.models.message import Message, MessageType
from src.models.creative_identity import GameType

async def verify_game_engine_flow():
    await init_db()
    
    print("🚀 Starting Game Engine Verification...")
    
    # 1. Fetch Prompts
    prompts = GameEngineService.get_prompts(GameType.TRUTH_OR_DARE)
    print(f"✅ Truth/Dare Prompts loaded: {len(prompts)}")
    assert len(prompts) > 0
    prompt_id = prompts[0]["id"]
    
    # 2. Mock Users
    sender_id = "user_game_A"
    receiver_id = "user_game_B"
    match_id = "match_game_1"
    
    # 3. Create Session (Invite)
    print("\n📩 Creating Game Invite (Truth/Dare)...")
    invite_msg = await GameEngineService.create_game_session(
        match_id=match_id,
        sender_id=sender_id,
        receiver_id=receiver_id,
        game_type=GameType.TRUTH_OR_DARE,
        prompt_id=prompt_id
    )
    
    assert invite_msg.game_session["state"] == "INVITE"
    assert invite_msg.message_type == MessageType.GAME
    print(f"✅ Game Session Created: {invite_msg.id}, State: INVITE")
    
    # 4. Accept Game
    print("\n🤝 User B Accepts...")
    msg_accepted = await GameEngineService.handle_game_action(
        str(invite_msg.id),
        receiver_id,
        "ACCEPT"
    )
    assert msg_accepted.game_session["state"] == "PLAYING"
    print("✅ State: PLAYING")
    
    # 5. User B Answers
    print("\n✍️ User B Answers...")
    msg_ans_b = await GameEngineService.handle_game_action(
        str(invite_msg.id),
        receiver_id,
        "ANSWER",
        {"text": "My truth answer"}
    )
    assert msg_ans_b.game_session["state"] == "PLAYING" # Waiting for A
    
    # 6. User A Answers
    print("\n✍️ User A Answers...")
    msg_ans_a = await GameEngineService.handle_game_action(
        str(invite_msg.id),
        sender_id,
        "ANSWER",
        {"text": "My own truth"}
    )
    
    # Verify Auto-Reveal logic (Simultaneous)
    assert msg_ans_a.game_session["state"] == "REVEALED"
    assert msg_ans_a.game_session["responses"][sender_id] == "My own truth"
    assert msg_ans_a.game_session["responses"][receiver_id] == "My truth answer"
    
    print("✅ State: REVEALED and answers visible!")
    print("🎉 Game Engine Verification Successful!")

if __name__ == "__main__":
    asyncio.run(verify_game_engine_flow())
