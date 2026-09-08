from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, status, Depends
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime
from src.models.user import User
from src.models.match import Match, MatchStatus
from src.models.message import Message, MessageType
from src.models.conversation import Conversation, ConversationType
from src.models.relationship import Relationship, RelationshipType, RelationshipStatus
from src.models.profile import Profile
from src.api.auth import get_current_user
from src.services.kafka_service import kafka_service
from src.services.kafka_topics import KafkaTopic, KafkaEventType
import json


router = APIRouter()


# Active WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        # await redis_service.set_user_online(user_id)
    
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
    conversation_id: Optional[str] = None  # New system
    match_id: Optional[str] = None  # Legacy support
    content: str
    message_type: MessageType = MessageType.TEXT


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for real-time chat"""
    
    await manager.connect(user_id, websocket)
    
    # Update user online status atomically
    await User.find_one(User.id == user_id).update({"$set": {"last_active": datetime.utcnow()}})
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            
            # Update activity on any message atomically
            await User.find_one(User.id == user_id).update({"$set": {"last_active": datetime.utcnow()}})
                
            message_data = json.loads(data)
            
            action = message_data.get("action")
            
            if action == "send_message":
                # Handle sending message
                match_id = message_data.get("match_id")
                content = message_data.get("content")
                message_type = message_data.get("message_type", "text")
                temp_id = message_data.get("temp_id")
                
                # Verify match exists and user is part of it
                match = await Match.get(match_id)
                if not match or (match.user_id_1 != user_id and match.user_id_2 != user_id):
                    await websocket.send_json({"error": "Invalid match"})
                    continue
                
                if match.status == MatchStatus.BLOCKED:
                    await websocket.send_json({"error": "Conversation is blocked"})
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
                # await redis_service.cache_message(str(message.id), message.dict())
                
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
                    "message_id": str(message.id),
                    "temp_id": temp_id
                })

                # Publish to Kafka
                try:
                    await kafka_service.publish(
                        topic=KafkaTopic.CHAT_MESSAGES,
                        event_type=KafkaEventType.MESSAGE_SENT,
                        payload={
                            "message_id": str(message.id),
                            "match_id": match_id,
                            "sender_id": user_id,
                            "recipient_id": receiver_id,
                            "content": content,
                            "created_at": message.created_at.isoformat(),
                        },
                        key=match_id or user_id,
                    )
                except Exception as k_err:
                    print(f"Kafka publish error (ws chat): {k_err}")
            
            elif action == "typing":
                # Handle typing indicator
                match_id = message_data.get("match_id")
                is_typing = message_data.get("is_typing", False)
                
                match = await Match.get(match_id)
                if match:
                    receiver_id = match.user_id_2 if match.user_id_1 == user_id else match.user_id_1
                    
                    if is_typing:
                        # await redis_service.set_typing(user_id, match_id)
                        pass
                    
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
                    
                    # Notify sender
                    await manager.send_personal_message(message.sender_id, {
                        "action": "message_read",
                        "message_id": message_id
                    })

                    # Publish read event to Kafka
                    try:
                        await kafka_service.publish(
                            topic=KafkaTopic.CHAT_MESSAGES,
                            event_type=KafkaEventType.MESSAGE_READ,
                            payload={
                                "message_id": message_id,
                                "match_id": message.match_id,
                                "reader_id": user_id,
                            },
                            key=message.match_id or user_id,
                        )
                    except Exception as k_err:
                        pass
    
    except WebSocketDisconnect:
        manager.disconnect(user_id)
        # Last active is already updated atomically during the connection

@router.get("/conversations")
async def get_conversations(current_user: User = Depends(get_current_user)):
    """Get all conversations for current user (supports Match, Friend, Partner)"""
    
    # Get all conversations where user is a participant
    conversations = await Conversation.find(
        {"participants": str(current_user.id)}
    ).sort(-Conversation.last_message_at).to_list()
    
    result = []
    
    for conv in conversations:
        # Get the relationship details
        relationship = await Relationship.get(conv.relationship_id)
        if not relationship:
            continue
        
        # Get other user ID
        other_user_id = relationship.get_other_user_id(str(current_user.id))
        
        # Get other user details
        other_user = await User.get(other_user_id)
        
        # Get profile for display info
        profile = await Profile.find_one(Profile.user_id == other_user_id)
        display_name = profile.display_name if profile else "Usuario"
        photo = profile.photos[0] if profile and profile.photos else None
        
        # Get unread count for current user
        unread_count = conv.get_unread_count(str(current_user.id))
        
        # Check if user is online
        is_online = other_user_id in manager.active_connections
        
        # Determine conversation label based on type
        type_label = {
            ConversationType.MATCH: "Match",
            ConversationType.FRIEND: "Amigo",
            ConversationType.PARTNER: "Pareja"
        }.get(conv.type, "Conversación")
        
        result.append({
            "conversation_id": str(conv.id),
            "relationship_id": conv.relationship_id,
            "type": conv.type,
            "type_label": type_label,
            "other_user_id": other_user_id,
            "display_name": display_name,
            "photo": photo,
            "last_message_at": conv.last_message_at,
            "last_message_content": conv.last_message_content,
            "last_message_sender_id": conv.last_message_sender_id,
            "unread_count": unread_count,
            "is_online": is_online,
            "last_active": other_user.last_active if other_user else None,
            "show_online_status": other_user.show_online_status if other_user else True,
            "is_archived": conv.is_archived_by(str(current_user.id)),
            "is_muted": conv.is_muted_by(str(current_user.id)),
            "relationship_status": relationship.status,
            # Emotional Dynamics
            "emotional_status": "neutral", # Default
            "theme_color": "#FF6B6B" # Default Red
        })
        
        # Calculate Emotional Status based on relationship
        # If confirmed date or relationship -> Red/Passionate
        if relationship.status == RelationshipStatus.ACTIVE and conv.type == ConversationType.PARTNER:
             result[-1]["emotional_status"] = "passionate"
             result[-1]["theme_color"] = "#E74C3C" # Deep Red
        elif relationship.status == RelationshipStatus.ACTIVE and conv.type == ConversationType.MATCH:
             # Check if they have exchanged many messages?
             # For now, simple logic: if match is active -> Flirty/Pink
             result[-1]["emotional_status"] = "flirty"
             result[-1]["theme_color"] = "#FF4081" # Pink
        elif conv.type == ConversationType.FRIEND:
             result[-1]["emotional_status"] = "friendly"
             result[-1]["theme_color"] = "#3498DB" # Blue
    
    return result


@router.get("/messages/{conversation_id}")
async def get_messages(
    conversation_id: str,
    limit: int = 50,
    offset: int = 0,
    match_id: Optional[str] = None,  # Legacy support
    current_user: User = Depends(get_current_user)
):
    """Get messages for a specific conversation (supports both conversation_id and legacy match_id)"""
    
    # Try new system first (conversation_id)
    conversation = await Conversation.get(conversation_id)
    
    if conversation:
        # Verify user is a participant
        if str(current_user.id) not in conversation.participants:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this conversation"
            )
        
        # Get messages by conversation_id
        messages = await Message.find({
            "conversation_id": conversation_id,
            "$or": [
                {"sender_id": str(current_user.id), "deleted_by_sender": {"$ne": True}},
                {"receiver_id": str(current_user.id), "deleted_by_receiver": {"$ne": True}}
            ]
        }).sort(-Message.created_at).skip(offset).limit(limit).to_list()
        
        # Mark messages as read
        await Message.find(
            Message.conversation_id == conversation_id,
            Message.receiver_id == str(current_user.id),
            Message.is_read == False
        ).update({"$set": {"is_read": True, "read_at": datetime.utcnow()}})
        
        # Reset unread count for this user
        conversation.reset_unread(str(current_user.id))
        await conversation.save()
        
        return messages
    
    # Fallback to legacy match_id system
    if match_id:
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
        
        # Get messages by match_id (legacy)
        messages = await Message.find({
            "match_id": match_id,
            "$or": [
                {"sender_id": str(current_user.id), "deleted_by_sender": {"$ne": True}},
                {"receiver_id": str(current_user.id), "deleted_by_receiver": {"$ne": True}}
            ]
        }).sort(-Message.created_at).skip(offset).limit(limit).to_list()
        
        return messages
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Conversation not found"
    )


@router.post("/send")
async def send_message(
    request: SendMessageRequest,
    current_user: User = Depends(get_current_user)
):
    """Send a message (supports both conversation_id and legacy match_id)"""
    
    # Try new conversation system first
    if request.conversation_id:
        conversation = await Conversation.get(request.conversation_id)
        
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        # Verify user is a participant
        if str(current_user.id) not in conversation.participants:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized"
            )
        
        # Get relationship to verify it's active
        relationship = await Relationship.get(conversation.relationship_id)
        if relationship and relationship.status == RelationshipStatus.BLOCKED:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Conversation is blocked"
            )
        
        # Get receiver ID
        receiver_id = conversation.participants[0] if conversation.participants[1] == str(current_user.id) else conversation.participants[1]
        
        # Create message
        message = Message(
            conversation_id=request.conversation_id,
            sender_id=str(current_user.id),
            receiver_id=receiver_id,
            message_type=request.message_type,
            content=request.content,
            created_at=datetime.utcnow()
        )
        await message.insert()
        
        # Update conversation metadata
        conversation.last_message_at = message.created_at
        conversation.last_message_content = request.content
        conversation.last_message_sender_id = str(current_user.id)
        conversation.increment_unread(receiver_id)
        await conversation.save()
        
        # Try to send via WebSocket if receiver is online
        await manager.send_personal_message(receiver_id, {
            "action": "new_message",
            "message": message.dict()
        })

        # Publish to Kafka
        try:
            await kafka_service.publish(
                topic=KafkaTopic.CHAT_MESSAGES,
                event_type=KafkaEventType.MESSAGE_SENT,
                payload={
                    "message_id": str(message.id),
                    "conversation_id": request.conversation_id,
                    "sender_id": str(current_user.id),
                    "recipient_id": receiver_id,
                    "content": request.content,
                    "created_at": message.created_at.isoformat(),
                },
                key=request.conversation_id or str(current_user.id),
            )
        except Exception as k_err:
            print(f"Kafka publish error (http chat conv): {k_err}")
        
        return message
    
    # Fallback to legacy match system
    elif request.match_id:
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

        # Publish to Kafka
        try:
            await kafka_service.publish(
                topic=KafkaTopic.CHAT_MESSAGES,
                event_type=KafkaEventType.MESSAGE_SENT,
                payload={
                    "message_id": str(message.id),
                    "match_id": request.match_id,
                    "sender_id": str(current_user.id),
                    "recipient_id": receiver_id,
                    "content": request.content,
                    "created_at": message.created_at.isoformat(),
                },
                key=request.match_id or str(current_user.id),
            )
        except Exception as k_err:
            print(f"Kafka publish error (http chat match): {k_err}")
        
        return message
    
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either conversation_id or match_id must be provided"
        )


@router.post("/clear/{match_id}")
async def clear_chat(
    match_id: str,
    current_user: User = Depends(get_current_user)
):
    """Clear chat history for the current user"""
    
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
            detail="Not authorized"
        )
        
    # Soft delete messages where user is sender
    await Message.find(
        Message.match_id == match_id,
        Message.sender_id == str(current_user.id)
    ).update({"$set": {"deleted_by_sender": True}})
    
    # Soft delete messages where user is receiver
    await Message.find(
        Message.match_id == match_id,
        Message.receiver_id == str(current_user.id)
    ).update({"$set": {"deleted_by_receiver": True}})
    
    return {"message": "Chat cleared successfully"}


@router.get("/suggestions")
async def get_chat_suggestions(
    target_user_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get smart reply suggestions based on affinity and context.
    """
    target_profile = await Profile.find_one(Profile.user_id == target_user_id)
    if not target_profile:
        return []
        
    suggestions = [
        "Hola! 👋",
        "¿Cómo va tu día?",
    ]
    
    # Context-aware suggestions based on interests
    my_profile = await Profile.find_one(Profile.user_id == str(current_user.id))
    
    if my_profile and target_profile:
        # Find common interests
        common_interests = set(my_profile.interests) & set(target_profile.interests)
        
        for interest in list(common_interests)[:3]:
            suggestions.append(f"¡Vi que también te gusta {interest}!")
            
        # If high affinity
        # score = AffinityService.calculate_score(my_profile, target_profile)
        # if score > 80:
        #    suggestions.append("Tenemos mucho en común 😊")
            
    return suggestions

@router.get("/{conversation_id}/unread-count")
async def get_chat_unread_count(
    conversation_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get unread message count for a specific conversation"""
    conversation = await Conversation.get(conversation_id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
        
    if str(current_user.id) not in conversation.participants:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
        
    count = conversation.get_unread_count(str(current_user.id))
    return {"count": count}

