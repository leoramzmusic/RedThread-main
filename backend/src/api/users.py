from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
import re
from src.models.user import User
from src.models.profile import Profile
from src.api.auth import get_current_user, get_current_user_optional
from src.core.utils.nickname_validator import validate_nickname
from src.models.profile_visit import ProfileVisit
from src.models.user_settings import UserSettings


router = APIRouter()


# Request/Response Models
class UpdateDisplayNameRequest(BaseModel):
    display_name: str


class UpdateNicknameRequest(BaseModel):
    nickname: str


class UpdateRealNameRequest(BaseModel):
    real_name: str


class NicknameAvailabilityResponse(BaseModel):
    available: bool
    message: str


@router.get("/check-nickname/{nickname}", response_model=NicknameAvailabilityResponse)
async def check_nickname_availability(nickname: str):
    """Check if a nickname is available"""
    
    # Validate nickname format
    is_valid, error_msg = validate_nickname(nickname)
    if not is_valid:
        return NicknameAvailabilityResponse(
            available=False,
            message=error_msg
        )
    
    # Check if nickname exists
    existing_user = await User.find_one(User.nickname == nickname)
    
    if existing_user:
        return NicknameAvailabilityResponse(
            available=False,
            message="Nickname is already taken"
        )
    
    return NicknameAvailabilityResponse(
        available=True,
        message="Nickname is available"
    )


@router.patch("/{user_id}/display-name")
async def update_display_name(
    user_id: str,
    request: UpdateDisplayNameRequest,
    current_user: User = Depends(get_current_user)
):
    """Update user's display name (can be changed anytime)"""
    
    # Ensure user can only update their own display name
    if str(current_user.id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own display name"
        )
    
    # Validate display name
    if not request.display_name or len(request.display_name.strip()) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Display name must be at least 2 characters long"
        )
    
    if len(request.display_name) > 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Display name must be at most 50 characters long"
        )
    
    # Update display name
    current_user.display_name = request.display_name.strip()
    current_user.updated_at = datetime.utcnow()
    await current_user.save()
    
    return {
        "message": "Display name updated successfully",
        "display_name": current_user.display_name
    }


@router.patch("/{user_id}/nickname")
async def update_nickname(
    user_id: str,
    request: UpdateNicknameRequest,
    current_user: User = Depends(get_current_user)
):
    """Update user's nickname (can only be changed once every 30 days)"""
    
    # Ensure user can only update their own nickname
    if str(current_user.id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own nickname"
        )
    
    # Check if 30 days have passed since last change
    if current_user.nickname_last_changed:
        days_since_change = (datetime.utcnow() - current_user.nickname_last_changed).days
        if days_since_change < 30:
            days_remaining = 30 - days_since_change
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"You can only change your nickname once every 30 days. Please wait {days_remaining} more days."
            )
    
    # Validate nickname
    is_valid, error_msg = validate_nickname(request.nickname)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )
    
    # Check if nickname is already taken
    existing_user = await User.find_one(User.nickname == request.nickname)
    if existing_user and str(existing_user.id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nickname is already taken"
        )
    
    # Update nickname
    current_user.nickname = request.nickname
    current_user.nickname_last_changed = datetime.utcnow()
    current_user.updated_at = datetime.utcnow()
    await current_user.save()
    
    return {
        "message": "Nickname updated successfully",
        "nickname": current_user.nickname,
        "next_change_available": (datetime.utcnow() + timedelta(days=30)).isoformat()
    }


@router.patch("/{user_id}/real-name")
async def update_real_name(
    user_id: str,
    request: UpdateRealNameRequest,
    current_user: User = Depends(get_current_user)
):
    """Update user's real name (for verification purposes)"""
    
    # Ensure user can only update their own real name
    if str(current_user.id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own real name"
        )
    
    # Validate real name
    if not request.real_name or len(request.real_name.strip()) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Real name must be at least 2 characters long"
        )
    
    if len(request.real_name) > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Real name must be at most 100 characters long"
        )
    
    # Update real name
    current_user.real_name = request.real_name.strip()
    current_user.updated_at = datetime.utcnow()
    await current_user.save()
    
    return {
        "message": "Real name updated successfully",
        "real_name": current_user.real_name
    }



@router.get("/search")
async def search_users(
    q: str,
    limit: int = 10,
    current_user: User = Depends(get_current_user)
):
    """
    Search users by nickname or display_name.
    Useful for finding partners or friends.
    """
    if not q or len(q) < 2:
        return []

    # Case-insensitive search
    # Using regex via $regex operator for MongoDB (Beanie)
    import re
    safe_q = re.escape(q)
    
    users = await User.find(
        {
            "$or": [
                { "nickname": { "$regex": safe_q, "$options": "i" } },
                { "display_name": { "$regex": safe_q, "$options": "i" } }
            ]
        }
    ).limit(limit).to_list()
    
    results = []
    for user in users:
        # Don't return self
        if str(user.id) == str(current_user.id):
            continue
            
        results.append({
            "id": str(user.id),
            "nickname": user.nickname,
            "display_name": user.display_name,
        })
        
    return results


@router.get("/{nickname}")
async def get_user_by_nickname(
    nickname: str,
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    print(f"[DEBUG] Fetching user by nickname: '{nickname}'")
    # Find user by nickname (Case-insensitive)
    user = await User.find_one({"nickname": {"$regex": f"^{re.escape(nickname)}$", "$options": "i"}})
    
    if not user:
        print(f"[DEBUG] User not found for nickname: '{nickname}'")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    print(f"[DEBUG] User found: {user.id}")
    # Get profile
    profile = await Profile.find_one(Profile.user_id == str(user.id))
    
    if not profile:
        print(f"[DEBUG] Profile not found for user_id: {user.id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
        
    if not profile.profile_visible:
        print(f"[DEBUG] Profile exists but is hidden for user_id: {user.id}")
        # Make an exception for admins or self? The current endpoint is public.
        # Ideally we should allow if it's me viewing my own inactive profile, but this endpoint is generic.
        # For now, let's just log it.
        raise HTTPException(
             status_code=status.HTTP_404_NOT_FOUND,
             detail="Profile not visible"
        )
    
    # Record a profile visit (authenticated users viewing another user's profile)
    # Respect the viewer's privacy setting: hide_visit_activity = incognito mode
    if current_user and str(current_user.id) != str(user.id):
        viewer_settings = await UserSettings.find_one({"user_id": str(current_user.id)})
        if not (viewer_settings and getattr(viewer_settings, "hide_visit_activity", False)):
            try:
                await ProfileVisit(
                    viewer_id=str(current_user.id),
                    viewed_user_id=str(user.id)
                ).save()
            except Exception as e:
                print(f"[DEBUG] Failed to record profile visit for {user.id}: {e}")
    
    # Return flattened public information (exclude real_name, email, phone)
    return {
        "user_id": str(user.id),
        "nickname": user.nickname,
        "display_name": user.display_name,
        "verified": user.verified,
        "is_public_figure": user.is_public_figure,
        "subscription_tier": user.subscription_tier.value if user.subscription_tier else "free",
        # Profile fields at the same level
        "age": profile.age if profile.show_age else None,
        "gender": profile.gender,
        "bio": profile.bio,
        "interests": profile.interests,
        "hobbies": profile.hobbies,
        "lifestyle_interests": profile.lifestyle_interests,
        "photos": profile.photos,
        "city": profile.city if profile.show_location else None,
        "intentions": profile.intentions,
        "languages": profile.languages,
        "is_verified": profile.is_verified,
        "sexual_orientation": profile.sexual_orientation,
        "pronouns": profile.pronouns,
        "height_cm": profile.height_cm,
        "occupation": profile.occupation,
        "education_level": profile.education_level,
        "mood": profile.mood,
        "activity_pattern": profile.activity_pattern,
        "zodiac": profile.zodiac,
        "relationship_status": profile.relationship_status,
        "relationship_goals": profile.relationship_goals,
        "work_company": profile.work_company,
        "school": profile.school,
    }

