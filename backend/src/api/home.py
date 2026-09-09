from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from datetime import datetime, timedelta
from src.models.user import User
from src.models.profile import Profile
from src.models.match import Match, MatchStatus, InteractionType
from src.models.message import Message
from src.models.profile_visit import ProfileVisit
from src.api.auth import get_current_user
from src.api.profiles import calculate_profile_completion


router = APIRouter()


@router.get("/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    """Get user dashboard statistics"""
    
    profile = await Profile.find_one(Profile.user_id == str(current_user.id))
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Get pending matches count (other user liked, current user hasn't decided yet)
    pending_matches = await Match.find(
        {
            "$or": [
                {
                    "user_id_1": str(current_user.id),
                    "user_1_interaction": None,
                    "user_2_interaction": {"$in": [InteractionType.LIKE, InteractionType.SUPERLIKE]},
                },
                {
                    "user_id_2": str(current_user.id),
                    "user_2_interaction": None,
                    "user_1_interaction": {"$in": [InteractionType.LIKE, InteractionType.SUPERLIKE]},
                },
            ],
            "status": MatchStatus.PENDING
        }
    ).to_list()
    
    # Get unread messages count
    unread_messages = await Message.find(
        {
            "receiver_id": str(current_user.id),
            "is_read": False
        }
    ).to_list()
    
    # Get profile visits count (distinct authenticated viewers, self-visits excluded)
    profile_visits = await ProfileVisit.get_motor_collection().distinct(
        "viewer_id", {"viewed_user_id": str(current_user.id)}
    )
    
    return {
        "matches_count": len(pending_matches),
        "unread_messages": len(unread_messages),
        "profile_completion": calculate_profile_completion(profile, current_user),
        "profile_visits": len(profile_visits)
    }


@router.get("/recent-activity")
async def get_recent_activity(current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    """Get recent matches and conversations"""
    
    # Get recent matches (last 3, only MATCHED status)
    recent_matches = await Match.find(
        {
            "$or": [
                {"user_id_1": str(current_user.id)},
                {"user_id_2": str(current_user.id)}
            ],
            "status": MatchStatus.MATCHED
        }
    ).sort("-matched_at").limit(3).to_list()
    
    # Get profile info for each match
    matches_with_profiles = []
    for match in recent_matches:
        other_user_id = match.user_id_2 if match.user_id_1 == str(current_user.id) else match.user_id_1
        other_profile = await Profile.find_one(Profile.user_id == other_user_id)
        other_user = await User.find_one(User.id == other_user_id)
        
        if other_profile and other_user:
            matches_with_profiles.append({
                "match_id": str(match.id),
                "user_id": other_user_id,
                "display_name": other_user.display_name,
                "photo": other_profile.photos[0] if other_profile.photos else None,
                "matched_at": match.matched_at.isoformat() if match.matched_at else match.created_at.isoformat()
            })
    
    # Get recent conversations (last 3 unique conversations)
    recent_messages = await Message.find(
        {"$or": [
            {"sender_id": str(current_user.id)},
            {"receiver_id": str(current_user.id)}
        ]}
    ).sort("-created_at").limit(10).to_list()
    
    # Group by conversation and get last message
    conversations_dict = {}
    for msg in recent_messages:
        other_user_id = msg.receiver_id if msg.sender_id == str(current_user.id) else msg.sender_id
        if other_user_id not in conversations_dict:
            conversations_dict[other_user_id] = msg
    
    # Get profiles for conversations
    conversations_with_profiles = []
    for user_id, last_msg in list(conversations_dict.items())[:3]:
        other_profile = await Profile.find_one(Profile.user_id == user_id)
        other_user = await User.find_one(User.id == user_id)
        
        if other_profile and other_user:
            conversations_with_profiles.append({
                "user_id": user_id,
                "display_name": other_user.display_name,
                "photo": other_profile.photos[0] if other_profile.photos else None,
                "last_message": last_msg.content[:50] + "..." if len(last_msg.content) > 50 else last_msg.content,
                "last_message_at": last_msg.created_at.isoformat(),
                "unread": not last_msg.is_read and last_msg.receiver_id == str(current_user.id)
            })
    
    return {
        "recent_matches": matches_with_profiles,
        "recent_conversations": conversations_with_profiles
    }


@router.get("/suggestions")
async def get_suggestions(current_user: User = Depends(get_current_user)) -> List[Dict[str, Any]]:
    """Get suggested users for the current user"""
    
    current_profile = await Profile.find_one(Profile.user_id == str(current_user.id))
    
    if not current_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Get users that match basic criteria
    # For now, simple matching - will be replaced with affinity algorithm
    suggested_profiles = await Profile.find(
        {
            "user_id": {"$ne": str(current_user.id)},
            "show_me_in_discovery": True,
            "profile_visible": True,
            "age": {
                "$gte": current_profile.age_range_min,
                "$lte": current_profile.age_range_max
            }
        }
    ).limit(5).to_list()
    
    suggestions = []
    for profile in suggested_profiles:
        # Get user for display_name
        user = await User.find_one(User.id == profile.user_id)
        if not user:
            continue
            
        # Calculate simple affinity (will be replaced with real algorithm)
        common_interests = set(current_profile.interests) & set(profile.interests)
        affinity = min(100, len(common_interests) * 20)  # Simple calculation
        
        suggestions.append({
            "user_id": profile.user_id,
            "display_name": user.display_name,
            "age": profile.age,
            "bio": profile.bio,
            "photo": profile.photos[0] if profile.photos else None,
            "interests": profile.interests[:3],  # First 3 interests
            "affinity": affinity
        })
    
    return suggestions

