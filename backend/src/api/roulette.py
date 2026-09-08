from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime
import random
from src.models.user import User
from src.models.profile import Profile
from src.models.match import Match
from src.api.auth import get_current_user

router = APIRouter()

class RouletteFilter(BaseModel):
    language: Optional[str] = None
    topic: Optional[str] = None

@router.post("/start")
async def start_roulette(
    filters: RouletteFilter = None,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Start a roulette session and find a match with filters"""
    
    # Get current user profile to check preferences
    current_profile = await Profile.find_one(Profile.user_id == str(current_user.id))
    if not current_profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    # Build query
    query = {
        "user_id": {"$ne": str(current_user.id)},
        "show_me_in_discovery": True,
        "profile_visible": True,
        "age": {
            "$gte": current_profile.age_range_min,
            "$lte": current_profile.age_range_max
        }
    }
    
    if filters:
        if filters.language:
            query["languages"] = filters.language
        if filters.topic:
            query["interests"] = filters.topic

    # Find potential matches
    candidates = await Profile.find(query).to_list()

    if not candidates:
        raise HTTPException(status_code=404, detail="No matches found with these criteria")

    # Pick a random candidate
    match_profile = random.choice(candidates)

    # Check if match already exists, if not create one
    existing_match = await Match.find_one(
        {
            "$or": [
                {"user1_id": str(current_user.id), "user2_id": match_profile.user_id},
                {"user1_id": match_profile.user_id, "user2_id": str(current_user.id)}
            ]
        }
    )

    if not existing_match:
        new_match = Match(
            user1_id=str(current_user.id),
            user2_id=match_profile.user_id,
            match_type="roulette",
            created_at=datetime.utcnow()
        )
        await new_match.insert()
        match_id = str(new_match.id)
    else:
        match_id = str(existing_match.id)

    return {
        "match_id": match_id,
        "user_id": match_profile.user_id,
        "display_name": match_profile.display_name,
        "photo": match_profile.photos[0] if match_profile.photos else None,
        "age": match_profile.age,
        "bio": match_profile.bio,
        "interests": match_profile.interests
    }

@router.post("/next")
async def next_match(
    filters: RouletteFilter = None,
    current_user: User = Depends(get_current_user)
):
    """Skip current match and find another one"""
    return await start_roulette(filters, current_user)

@router.post("/end")
async def end_roulette(current_user: User = Depends(get_current_user)):
    """End the roulette session"""
    return {"message": "Roulette session ended"}

