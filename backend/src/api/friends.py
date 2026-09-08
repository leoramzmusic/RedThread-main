from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel
from src.models.user import User
from src.models.profile import Profile
from src.models.relationship import (
    Relationship,
    RelationshipType,
    RelationshipStatus,
    RelationshipOrigin
)
from src.api.auth import get_current_user
from src.models.user import SubscriptionTier
from src.models.message import Message, MessageType
import math

def calculate_distance(coord1: List[float], coord2: List[float]) -> float:
    """
    Calculate distance between two points (lon, lat) in km using Haversine formula
    """
    R = 6371  # Earth radius in km
    
    lon1, lat1 = coord1
    lon2, lat2 = coord2
    
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = math.sin(dlat/2) * math.sin(dlat/2) + \
        math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * \
        math.sin(dlon/2) * math.sin(dlon/2)
        
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c


router = APIRouter()


class FriendRequestCreate(BaseModel):
    """Request to send a friend request"""
    target_user_id: str
    message: Optional[str] = None


class FriendRequestResponse(BaseModel):
    """Response to a friend request"""
    relationship_id: str
    accept: bool  # True to accept, False to reject


@router.post("/request")
async def send_friend_request(
    request_data: FriendRequestCreate,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Send a friend request to another user.
    Creates a PENDING relationship of type FRIEND.
    """
    
    # Validate target user exists
    target_user = await User.get(request_data.target_user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Can't friend yourself
    if str(current_user.id) == request_data.target_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot send friend request to yourself"
        )
        
    # --- LOCATION & TIER CHECK ---
    # Get profiles for location data
    my_profile = await Profile.find_one(Profile.user_id == str(current_user.id))
    target_profile = await Profile.find_one(Profile.user_id == request_data.target_user_id)
    
    if not my_profile or not target_profile:
        # If profiles don't exist, we can't check location, but we shouldn't block
        # assuming basic user data exists. However, for strictness:
        pass 
        
    # Check if user is Premium/VIP (Global Access)
    is_premium = current_user.subscription_tier in [SubscriptionTier.PREMIUM, SubscriptionTier.VIP]
    
    if not is_premium and my_profile and target_profile and my_profile.location and target_profile.location:
        # Check location constraints: Same State OR < 100km
        
        # 1. Check State
        same_state = (
            my_profile.location.state and 
            target_profile.location.state and 
            my_profile.location.state.lower() == target_profile.location.state.lower()
        )
        
        # 2. Check Distance
        distance = 999999
        if my_profile.location.coordinates and target_profile.location.coordinates:
            distance = calculate_distance(
                my_profile.location.coordinates,
                target_profile.location.coordinates
            )
            
        if not same_state and distance > 100:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Free users can only add friends within 100km or the same state. Upgrade to Premium for global reach."
            )
    # -----------------------------
    
    # Check if relationship already exists
    user_a_id, user_b_id = Relationship.normalize_user_ids(
        str(current_user.id),
        request_data.target_user_id
    )
    
    existing = await Relationship.find_one({
        "user_a_id": user_a_id,
        "user_b_id": user_b_id,
        "type": RelationshipType.FRIEND
    })
    
    if existing:
        if existing.status == RelationshipStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Already friends with this user"
            )
        elif existing.status == RelationshipStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Friend request already pending"
            )
        elif existing.status == RelationshipStatus.BLOCKED:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot send friend request to blocked user"
            )
    
    # Create friend request
    relationship = Relationship(
        user_a_id=user_a_id,
        user_b_id=user_b_id,
        type=RelationshipType.FRIEND,
        status=RelationshipStatus.PENDING,
        origin=RelationshipOrigin.FRIEND_REQUEST,
        requester_id=str(current_user.id),
        created_at=datetime.utcnow()
    )
    
    await relationship.insert()
    
    # TODO: Send notification to target user
    
    return {
        "message": "Friend request sent successfully",
        "relationship_id": str(relationship.id)
    }


@router.get("/requests/pending")
async def get_pending_requests(
    current_user: User = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """
    Get all pending friend requests for the current user.
    Returns requests where current user is the recipient.
    """
    
    user_id = str(current_user.id)
    
    # Find all pending friend requests where current user is involved
    relationships = await Relationship.find({
        "$or": [
            {"user_a_id": user_id},
            {"user_b_id": user_id}
        ],
        "type": RelationshipType.FRIEND,
        "status": RelationshipStatus.PENDING
    }).to_list()
    
    # Filter to only requests where current user is the recipient (not requester)
    pending_requests = []
    for rel in relationships:
        if rel.requester_id != user_id:
            # Get the requester's profile
            requester_profile = await Profile.find_one(
                Profile.user_id == rel.requester_id
            )
            
            if requester_profile:
                pending_requests.append({
                    "relationship_id": str(rel.id),
                    "requester_id": rel.requester_id,
                    "requester_name": requester_profile.display_name,
                    "requester_photo": requester_profile.photos[0] if requester_profile.photos else None,
                    "created_at": rel.created_at.isoformat()
                })
    
    return pending_requests


@router.get("/requests/sent")
async def get_sent_requests(
    current_user: User = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """
    Get all pending friend requests sent BY the current user.
    """
    
    user_id = str(current_user.id)
    
    # Find all pending friend requests where current user is the requester
    relationships = await Relationship.find({
        "requester_id": user_id,
        "type": RelationshipType.FRIEND,
        "status": RelationshipStatus.PENDING
    }).to_list()
    
    sent_requests = []
    for rel in relationships:
        # Get the target user's ID
        target_id = rel.get_other_user_id(user_id)
        
        # Get target profile
        target_profile = await Profile.find_one(
            Profile.user_id == target_id
        )
        
        if target_profile:
            sent_requests.append({
                "relationship_id": str(rel.id),
                "target_id": target_id,
                "target_name": target_profile.display_name,
                "target_photo": target_profile.photos[0] if target_profile.photos else None,
                "created_at": rel.created_at.isoformat()
            })
    
    return sent_requests


@router.post("/respond")
async def respond_to_friend_request(
    response_data: FriendRequestResponse,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Accept or reject a friend request.
    """
    
    # Get the relationship
    relationship = await Relationship.get(response_data.relationship_id)
    if not relationship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Friend request not found"
        )
    
    # Verify current user is the recipient (not the requester)
    if relationship.requester_id == str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot respond to your own friend request"
        )
    
    # Verify current user is part of this relationship
    if not relationship.is_user_in_relationship(str(current_user.id)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to respond to this request"
        )
    
    # Verify status is pending
    if relationship.status != RelationshipStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Friend request is not pending"
        )
    
    if response_data.accept:
        # Accept the request
        relationship.status = RelationshipStatus.ACTIVE
        relationship.accepted_at = datetime.utcnow()
        await relationship.save()
        
        # TODO: Create conversation for friend chat
        # TODO: Send notification to requester
        
        return {
            "message": "Friend request accepted",
            "relationship_id": str(relationship.id)
        }
    else:
        # Reject the request - delete the relationship
        await relationship.delete()
        
        return {
            "message": "Friend request rejected"
        }


@router.get("/list")
async def get_friends_list(
    current_user: User = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """
    Get list of all active friends for the current user.
    """
    
    user_id = str(current_user.id)
    
    # Find all active friend relationships
    relationships = await Relationship.find({
        "$or": [
            {"user_a_id": user_id},
            {"user_b_id": user_id}
        ],
        "type": RelationshipType.FRIEND,
        "status": RelationshipStatus.ACTIVE
    }).to_list()
    
    friends = []
    for rel in relationships:
        # Get the other user's ID
        friend_id = rel.get_other_user_id(user_id)
        
        # Get friend's profile
        friend_profile = await Profile.find_one(Profile.user_id == friend_id)
        
        if friend_profile:
            friends.append({
                "relationship_id": str(rel.id),
                "user_id": friend_id,
                "display_name": friend_profile.display_name,
                "photo": friend_profile.photos[0] if friend_profile.photos else None,
                "age": friend_profile.age,
                "city": friend_profile.city,
                "since": rel.accepted_at.isoformat() if rel.accepted_at else rel.created_at.isoformat()
            })
    
    return friends


@router.delete("/{relationship_id}")
async def remove_friend(
    relationship_id: str,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Remove a friend (delete the friendship relationship).
    """
    
    relationship = await Relationship.get(relationship_id)
    if not relationship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Friendship not found"
        )
    
    # Verify current user is part of this relationship
    if not relationship.is_user_in_relationship(str(current_user.id)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to remove this friendship"
        )
    
    # Verify it's a friend relationship
    if relationship.type != RelationshipType.FRIEND:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not a friend relationship"
        )
    
    # Delete the relationship
    await relationship.delete()
    
    # TODO: Archive or delete the conversation
    
    return {
        "message": "Friend removed successfully"
    }

    return {
        "message": "Friend removed successfully"
    }


class RitualRequest(BaseModel):
    ritual_type: str  # "song", "question", "constellation"
    content: str
    metadata: Optional[dict] = None


@router.post("/ritual/{target_id}")
async def send_ritual(
    target_id: str, 
    request: RitualRequest,
    current_user: User = Depends(get_current_user)
):
    """Send a Ritual (Special Message)"""
    # Verify friendship
    user_a, user_b = Relationship.normalize_user_ids(str(current_user.id), target_id)
    rel = await Relationship.find_one(
        Relationship.user_a_id == user_a,
        Relationship.user_b_id == user_b,
        Relationship.status == RelationshipStatus.ACTIVE
    )
    if not rel:
        raise HTTPException(status_code=403, detail="Must be friends to send rituals")
        
    # Create Message
    msg = Message(
        sender_id=str(current_user.id),
        receiver_id=target_id,
        message_type=MessageType.RITUAL,
        content=f"Ritual: {request.ritual_type} - {request.content}",
        # We could store formatted metadata here or in content
        game_session={
            "type": "ritual",
            "subtype": request.ritual_type,
            "data": request.content,
            "meta": request.metadata
        }
    )
    await msg.create()
    
    return {"status": "ritual_sent", "message_id": str(msg.id)}
