from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, status, Depends
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime
from src.models.user import User
from src.models.match import Match, MatchStatus
from src.models.message import Message, MessageType
from src.services.auth.routes import get_current_user
from src.services.redis_service import redis_service
import json


router = APIRouter()


# Active WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        await redis_service.set_user_online(user_id)
    
    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
    
    async def send_personal_message(self, user_id: str, message: dict):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(message)
    
    async def broadcast_typing(self, match_id: str, user_id: str, is_typing: bool):
        # Notify the other user in the match
        pass


manager = ConnectionManager()


# Request/Response Models
class SendMessageRequest(BaseModel):
    match_id: str
    content: str
    message_type: MessageType = MessageType.TEXT


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for real-time chat"""
    
    await manager.connect(user_id, websocket)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            action = message_data.get("action")
            
            if action == "send_message":
                # Handle sending message
                match_id = message_data.get("match_id")
                content = message_data.get("content")
                message_type = message_data.get("message_type", "text")
                
                # Verify match exists and user is part of it
                match = await Match.get(match_id)
                if not match or (match.user_id_1 != user_id and match.user_id_2 != user_id):
                    await websocket.send_json({"error": "Invalid match"})
                    continue
                
                # Get receiver ID
                receiver_id = match.user_id_2 if match.user_id_1 == user_id else match.user_id_1
                
                # Create message
                message = Message(
                    match_id=match_id,
                    sender_id=user_id,
                    receiver_id=receiver_id,
                    message_type=message_type,
                    content=content,
                    created_at=datetime.utcnow()
                )
                await message.insert()
                
                # Cache message
                await redis_service.cache_message(str(message.id), message.dict())
                
                # Invalidate dashboard cache for both users (new unread message)
                await redis_service.invalidar_usuario(["stats", "recent"], user_id)
                await redis_service.invalidar_usuario(["stats", "recent"], receiver_id)
                
                # Send to receiver if online
                await manager.send_personal_message(receiver_id, {
                    "action": "new_message",
                    "message": {
                        "id": str(message.id),
                        "match_id": match_id,
                        "sender_id": user_id,
                        "content": content,
                        "message_type": message_type,
                        "created_at": message.created_at.isoformat()
                    }
                })
                
                # Confirm to sender
                await websocket.send_json({
                    "action": "message_sent",
                    "message_id": str(message.id)
                })
            
            elif action == "typing":
                # Handle typing indicator
                match_id = message_data.get("match_id")
                is_typing = message_data.get("is_typing", False)
                
                match = await Match.get(match_id)
                if match:
                    receiver_id = match.user_id_2 if match.user_id_1 == user_id else match.user_id_1
                    
                    if is_typing:
                        await redis_service.set_typing(user_id, match_id)
                    
                    # Notify receiver
                    await manager.send_personal_message(receiver_id, {
                        "action": "typing",
                        "match_id": match_id,
                        "user_id": user_id,
                        "is_typing": is_typing
                    })
            
            elif action == "mark_read":
                # Mark messages as read
                message_id = message_data.get("message_id")
                message = await Message.get(message_id)
                
                if message and message.receiver_id == user_id:
                    message.is_read = True
                    message.read_at = datetime.utcnow()
                    await message.save()
                    
                    # Invalidate dashboard cache (unread count changed)
                    await redis_service.invalidar_usuario(["stats", "recent"], user_id)
                    
                    # Notify sender
                    await manager.send_personal_message(message.sender_id, {
                        "action": "message_read",
                        "message_id": message_id
                    })
    
    except WebSocketDisconnect:
        manager.disconnect(user_id)
        await redis_service.set_user_offline(user_id)


@router.get("/conversations")
async def get_conversations(current_user: User = Depends(get_current_user)):
    """Get all conversations for current user"""
    
    # Get all matches
    matches = await Match.find({
        "$or": [
            {"user_id_1": str(current_user.id)},
            {"user_id_2": str(current_user.id)}
        ],
        "status": MatchStatus.MATCHED
    }).to_list()
    
    conversations = []
    
    for match in matches:
        # Get last message
        last_message = await Message.find(
            Message.match_id == str(match.id)
        ).sort(-Message.created_at).limit(1).to_list()
        
        # Get other user ID
        other_user_id = match.user_id_2 if match.user_id_1 == str(current_user.id) else match.user_id_1
        
        # Get unread count
        unread_count = await Message.find(
            Message.match_id == str(match.id),
            Message.receiver_id == str(current_user.id),
            Message.is_read == False
        ).count()
        
        conversations.append({
            "match_id": str(match.id),
            "other_user_id": other_user_id,
            "last_message": last_message[0].dict() if last_message else None,
            "unread_count": unread_count,
            "is_online": await redis_service.is_user_online(other_user_id)
        })
    
    return conversations


@router.get("/messages/{match_id}")
async def get_messages(
    match_id: str,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user)
):
    """Get messages for a specific conversation"""
    
    # Verify match exists and user is part of it
    match = await Match.get(match_id)
    
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found"
        )
    
    if match.user_id_1 != str(current_user.id) and match.user_id_2 != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this conversation"
        )
    
    # Get messages
    messages = await Message.find(
        Message.match_id == match_id
    ).sort(-Message.created_at).skip(offset).limit(limit).to_list()
    
    return messages


@router.post("/send")
async def send_message(
    request: SendMessageRequest,
    current_user: User = Depends(get_current_user)
):
    """Send a message (REST endpoint alternative to WebSocket)"""
    
    # Verify match
    match = await Match.get(request.match_id)
    
    if not match or match.status != MatchStatus.MATCHED:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found or not active"
        )
    
    if match.user_id_1 != str(current_user.id) and match.user_id_2 != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    # Get receiver ID
    receiver_id = match.user_id_2 if match.user_id_1 == str(current_user.id) else match.user_id_1
    
    # Create message
    message = Message(
        match_id=request.match_id,
        sender_id=str(current_user.id),
        receiver_id=receiver_id,
        message_type=request.message_type,
        content=request.content,
        created_at=datetime.utcnow()
    )
    await message.insert()
    
    # Try to send via WebSocket if receiver is online
    await manager.send_personal_message(receiver_id, {
        "action": "new_message",
        "message": message.dict()
    })
    
    return message

