from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from src.models.user import User
from src.models.profile import Profile
from src.models.match import Match, InteractionType, MatchStatus
from src.services.auth.routes import get_current_user
from src.services.affinity import affinity_calculator
from src.services.redis_service import redis_service
import random


router = APIRouter()


# Request/Response Models
class SwipeRequest(BaseModel):
    target_user_id: str
    interaction: InteractionType


class DiscoveryProfile(BaseModel):
    user_id: str
    display_name: str
    age: int
    bio: Optional[str]
    photos: List[str]
    interests: List[str]
    affinity_score: float
    affinity_breakdown: dict
    distance_km: Optional[float] = None


@router.get("/queue", response_model=List[DiscoveryProfile])
async def get_discovery_queue(
    limit: int = 10,
    current_user: User = Depends(get_current_user)
):
    """Get discovery queue with affinity scores"""
    
    # Check cache first
    cached_queue = await redis_service.get_discovery_queue(str(current_user.id))
    if cached_queue:
        # Return cached profiles
        profiles = []
        for user_id in cached_queue[:limit]:
            profile = await Profile.find_one(Profile.user_id == user_id)
            if profile:
                profiles.append(await _build_discovery_profile(current_user, profile))
        return profiles
    
    # Get current user's profile
    my_profile = await Profile.find_one(Profile.user_id == str(current_user.id))
    
    if not my_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Get users already interacted with
    existing_matches = await Match.find(
        {"$or": [
            {"user_id_1": str(current_user.id)},
            {"user_id_2": str(current_user.id)}
        ]}
    ).to_list()
    
    interacted_user_ids = set()
    for match in existing_matches:
        if match.user_id_1 == str(current_user.id):
            interacted_user_ids.add(match.user_id_2)
        else:
            interacted_user_ids.add(match.user_id_1)
    
    # Find potential matches
    all_profiles = await Profile.find(
        Profile.user_id != str(current_user.id),
        Profile.profile_visible == True
    ).to_list()
    
    # Filter out already interacted users
    candidate_profiles = [
        p for p in all_profiles
        if p.user_id not in interacted_user_ids
    ]
    
    # Calculate affinity scores
    scored_profiles = []
    for profile in candidate_profiles:
        affinity = affinity_calculator.calculate_affinity(
            my_profile,
            profile,
            radar_encounter=False  # TODO: Check if met via radar
        )
        
        scored_profiles.append({
            "profile": profile,
            "affinity": affinity
        })
    
    # Sort by affinity score (highest first)
    scored_profiles.sort(key=lambda x: x["affinity"]["total"], reverse=True)
    
    # Take top candidates
    top_profiles = scored_profiles[:limit * 2]  # Get more for caching
    
    # Cache the queue
    cache_ids = [p["profile"].user_id for p in top_profiles]
    await redis_service.cache_discovery_queue(str(current_user.id), cache_ids)
    
    # Build response
    result = []
    for item in top_profiles[:limit]:
        discovery_profile = await _build_discovery_profile(
            current_user,
            item["profile"],
            item["affinity"]
        )
        result.append(discovery_profile)
    
    return result


@router.post("/swipe")
async def swipe(
    request: SwipeRequest,
    current_user: User = Depends(get_current_user)
):
    """Perform swipe action (like, pass, superlike)"""
    
    # Validate target user exists
    target_profile = await Profile.find_one(Profile.user_id == request.target_user_id)
    if not target_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target user not found"
        )
    
    # Check if interaction already exists
    existing_match = await Match.find_one({
        "$or": [
            {"user_id_1": str(current_user.id), "user_id_2": request.target_user_id},
            {"user_id_1": request.target_user_id, "user_id_2": str(current_user.id)}
        ]
    })
    
    if existing_match:
        # Update existing match
        if existing_match.user_id_1 == str(current_user.id):
            existing_match.user_1_interaction = request.interaction
        else:
            existing_match.user_2_interaction = request.interaction
        
        # Check if it's a match
        if (existing_match.user_1_interaction == InteractionType.LIKE or
            existing_match.user_1_interaction == InteractionType.SUPERLIKE) and \
           (existing_match.user_2_interaction == InteractionType.LIKE or
            existing_match.user_2_interaction == InteractionType.SUPERLIKE):
            existing_match.status = MatchStatus.MATCHED
            existing_match.matched_at = datetime.utcnow()
        
        await existing_match.save()
        
        return {
            "match_id": str(existing_match.id),
            "is_match": existing_match.status == MatchStatus.MATCHED,
            "message": "It's a match!" if existing_match.status == MatchStatus.MATCHED else "Interaction recorded"
        }
    
    # Create new match record
    my_profile = await Profile.find_one(Profile.user_id == str(current_user.id))
    
    # Calculate affinity
    affinity = affinity_calculator.calculate_affinity(my_profile, target_profile)
    
    match = Match(
        user_id_1=str(current_user.id),
        user_id_2=request.target_user_id,
        user_1_interaction=request.interaction,
        status=MatchStatus.PENDING,
        affinity_score=affinity["total"],
        affinity_breakdown=affinity,
        is_superlike=(request.interaction == InteractionType.SUPERLIKE),
        created_at=datetime.utcnow()
    )
    
    await match.insert()
    
    return {
        "match_id": str(match.id),
        "is_match": False,
        "message": "Interaction recorded"
    }


@router.get("/matches")
async def get_matches(current_user: User = Depends(get_current_user)):
    """Get all matches for current user"""
    
    matches = await Match.find({
        "$or": [
            {"user_id_1": str(current_user.id)},
            {"user_id_2": str(current_user.id)}
        ],
        "status": MatchStatus.MATCHED
    }).to_list()
    
    # Build response with profile info
    result = []
    for match in matches:
        # Get the other user's ID
        other_user_id = match.user_id_2 if match.user_id_1 == str(current_user.id) else match.user_id_1
        
        # Get their profile
        other_profile = await Profile.find_one(Profile.user_id == other_user_id)
        
        if other_profile:
            result.append({
                "match_id": str(match.id),
                "user_id": other_user_id,
                "display_name": other_profile.display_name,
                "age": other_profile.age,
                "photos": other_profile.photos,
                "bio": other_profile.bio,
                "affinity_score": match.affinity_score,
                "matched_at": match.matched_at
            })
    
    return result


@router.delete("/matches/{match_id}")
async def unmatch(match_id: str, current_user: User = Depends(get_current_user)):
    """Unmatch with a user"""
    
    match = await Match.get(match_id)
    
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found"
        )
    
    # Verify user is part of the match
    if match.user_id_1 != str(current_user.id) and match.user_id_2 != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to unmatch"
        )
    
    match.status = MatchStatus.UNMATCHED
    match.unmatched_at = datetime.utcnow()
    await match.save()
    
    return {"message": "Unmatched successfully"}


async def _build_discovery_profile(
    current_user: User,
    profile: Profile,
    affinity: dict = None
) -> DiscoveryProfile:
    """Build discovery profile with affinity score"""
    
    if not affinity:
        my_profile = await Profile.find_one(Profile.user_id == str(current_user.id))
        affinity = affinity_calculator.calculate_affinity(my_profile, profile)
    
    return DiscoveryProfile(
        user_id=profile.user_id,
        display_name=profile.display_name,
        age=profile.age if profile.show_age else None,
        bio=profile.bio,
        photos=profile.photos[:5],  # Limit to first 5 photos
        interests=profile.interests,
        affinity_score=affinity["total"],
        affinity_breakdown=affinity
    )

