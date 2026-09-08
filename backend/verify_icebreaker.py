import asyncio
from src.core.database import init_db
from src.services.icebreaker_service import IcebreakerService
from src.models.message import Message, MessageType
from src.models.profile import Profile
from src.models.user import User

async def verify_icebreaker_flow():
    await init_db()
    
    # Setup Test Data
    print("🚀 Starting Icebreaker Verification...")
    
    # 1. Fetch Questions
    questions = IcebreakerService.get_questions()
    print(f"✅ Questions loaded: {len(questions)}")
    assert len(questions) == 36
    
    # 2. Mock Users (IDs)
    sender_id = "user_test_A"
    receiver_id = "user_test_B"
    match_id = "match_test_1"
    question_id = "q_13" # Level 2 question
    
    # 3. Simulate Invite (Message Creation)
    print("\n📩 Creating Invite...")
    invite_msg = Message(
        match_id=match_id,
        sender_id=sender_id,
        receiver_id=receiver_id,
        message_type=MessageType.ICEBREAKER,
        content="Invite Pending",
        icebreaker_data={
            "question_id": question_id,
            "stage": "invite",
            "answers": {}
        }
    )
    await invite_msg.save()
    print(f"✅ Invite Message Created: {invite_msg.id}")
    
    # 4. User B Answers
    print("\n✍️ User B answers...")
    msg_after_b = await IcebreakerService.process_chat_answer(
        str(invite_msg.id),
        receiver_id,
        "I would want to know if I'm happy."
    )
    
    # Verify State: Answering (Hidden)
    assert msg_after_b.icebreaker_data["stage"] == "answering"
    assert "✨" not in msg_after_b.content
    print("✅ Stage is 'answering' (Hidden)")
    
    # 5. User A Answers
    print("\n✍️ User A answers...")
    msg_after_a = await IcebreakerService.process_chat_answer(
        str(invite_msg.id),
        sender_id,
        "I want to know where I live."
    )
    
    # Verify State: Revealed
    assert msg_after_a.icebreaker_data["stage"] == "revealed"
    assert "✨" in msg_after_a.content
    assert msg_after_a.icebreaker_data["answers"][sender_id] == "I want to know where I live."
    assert msg_after_a.icebreaker_data["answers"][receiver_id] == "I would want to know if I'm happy."
    
    print("✅ Stage is 'revealed' and answers match!")
    print("🎉 Verification Successful!")

if __name__ == "__main__":
    asyncio.run(verify_icebreaker_flow())
