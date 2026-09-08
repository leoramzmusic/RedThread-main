from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from datetime import datetime
from src.models.user import User, SubscriptionTier
from src.models.golth import GolthProfile, GolthInterest
from src.api.auth import get_current_user
from pydantic import BaseModel

router = APIRouter()

# Access middleware (pseudo-inline)
async def check_premium_access(current_user: User = Depends(get_current_user)):
    if current_user.subscription_tier not in [SubscriptionTier.PREMIUM, SubscriptionTier.VIP]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Golth access requires a Premium or VIP subscription."
        )
    return current_user

class CreateGolthProfileRequest(BaseModel):
    is_pair: bool = False
    pair_with_user_id: Optional[str] = None
    interest_ids: List[str] = []
    narrative: Optional[str] = None

class GolthInterestResponse(BaseModel):
    id: str
    name: str
    label: str
    description: Optional[str]
    color: str

@router.get("/interests", response_model=List[GolthInterestResponse])
async def get_golth_interests(user: User = Depends(check_premium_access)):
    """List abstract categories for Golth"""
    interests = await GolthInterest.find_all().to_list()
    return [
        GolthInterestResponse(
            id=str(i.id),
            name=i.name,
            label=i.label,
            description=i.description,
            color=i.color
        ) for i in interests
    ]

@router.get("/me")
async def get_my_golth_profile(user: User = Depends(check_premium_access)):
    """Get the current user's Golth profile"""
    profile = await GolthProfile.find_one(GolthProfile.user_id == str(user.id))
    if not profile:
        return {"active": False, "profile": None}
    return {"active": True, "profile": profile}

@router.post("/activate")
async def activate_golth(request: CreateGolthProfileRequest, user: User = Depends(check_premium_access)):
    """Activate Golth and create a profile"""
    existing = await GolthProfile.find_one(GolthProfile.user_id == str(user.id))
    
    if existing:
        existing.is_active = True
        existing.interest_ids = request.interest_ids
        existing.narrative = request.narrative
        existing.updated_at = datetime.utcnow()
        await existing.save()
        return existing

    new_profile = GolthProfile(
        user_id=str(user.id),
        is_pair=request.is_pair,
        pair_with_user_id=request.pair_with_user_id,
        interest_ids=request.interest_ids,
        narrative=request.narrative,
        is_active=True,
        activated_at=datetime.utcnow()
    )
    await new_profile.insert()
    return new_profile

@router.post("/match")
async def golth_match(user: User = Depends(check_premium_access)):
    """Golth affinity matchmaking based on shared abstract interests intersection"""
    my_profile = await GolthProfile.find_one(GolthProfile.user_id == str(user.id))
    if not my_profile or not my_profile.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Golth profile not active"
        )
    
    # Simple intersection logic: Find other active users who share at least one interest
    # Exclude self
    
    # Get my interest IDs as a set for operational efficiency
    my_interests = set(my_profile.interest_ids)
    
    # In a production environment with many users, this query should be optimized with MongoDB aggregation
    # For now, we fetch candidate active profiles and filter in Python
    candidates = await GolthProfile.find(
        GolthProfile.is_active == True,
        GolthProfile.user_id != str(user.id)
    ).to_list()
    
    matches = []
    
    for candidate in candidates:
        candidate_interests = set(candidate.interest_ids)
        intersection = my_interests.intersection(candidate_interests)
        
        if len(intersection) > 0:
            # Shared affinities found
            matches.append({
                "user_id": candidate.user_id,
                "shared_interests_count": len(intersection),
                "is_pair": candidate.is_pair,
                "compatibility_type": "abstract_affinity"
            })
            
    # Sort by number of shared affinities
    matches.sort(key=lambda x: x["shared_interests_count"], reverse=True)
    
    return {"matches": matches, "message": f"Found {len(matches)} potential golden threads."}
