from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
from src.api.auth import get_current_user
from src.services.icebreaker_service import IcebreakerService
from src.models.message import Message, MessageType
from src.models.user import User

router = APIRouter(prefix="/icebreaker", tags=["Icebreaker"])

class QuestionResponse(BaseModel):
    id: str
    set: int
    text: str

class ProfileAnswer(BaseModel):
    question_id: str
    answer: str
    public_in_chat: bool = False

class InviteRequest(BaseModel):
    match_id: str
    other_user_id: str
    question_id: str

class ChatAnswerRequest(BaseModel):
    message_id: str
    answer: str

@router.get("/questions", response_model=List[QuestionResponse])
async def get_questions():
    """Get the list of 36 questions"""
    return IcebreakerService.get_questions()

@router.post("/profile-answers")
async def save_profile_answers(answers: List[ProfileAnswer], user: User = Depends(get_current_user)):
    """Save answers to the user's profile"""
    profile = await IcebreakerService.save_profile_answers(str(user.id), [a.dict() for a in answers])
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"status": "success"}

@router.post("/chat/invite")
async def create_invite(request: InviteRequest, user: User = Depends(get_current_user)):
    """Send an icebreaker invite in chat"""
    # Create the message
    question = IcebreakerService.get_question_by_id(request.question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    message = Message(
        match_id=request.match_id, # Linking to match for legacy support
        sender_id=str(user.id),
        receiver_id=request.other_user_id,
        message_type=MessageType.ICEBREAKER,
        content=f"Te invito a responder: {question['text']}",
        icebreaker_data={
            "question_id": request.question_id,
            "stage": "invite",
            "answers": {}
        }
    )
    await message.save()
    
    # In a real app, we would emit a WebSocket event here
    return message

@router.post("/chat/answer")
async def submit_chat_answer(request: ChatAnswerRequest, user: User = Depends(get_current_user)):
    """Submit an answer to an active icebreaker in chat"""
    try:
        updated_message = await IcebreakerService.process_chat_answer(
            request.message_id, 
            str(user.id), 
            request.answer
        )
        # In a real app, we would emit a WebSocket event here `(action='message_updated')`
        return updated_message
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/profile-answer/{question_id}")
async def get_my_profile_answer(question_id: str, user: User = Depends(get_current_user)):
    """Get user's pre-saved answer for a specific question (helper for UI)"""
    answer = await IcebreakerService.get_profile_answer(str(user.id), question_id)
    return {"question_id": question_id, "answer": answer}
