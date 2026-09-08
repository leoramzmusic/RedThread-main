from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from src.models.user import User
from src.models.profile import Profile
from src.services.interest_service import InterestService
from src.api.auth import get_current_user

router = APIRouter(prefix="/interests", tags=["interests"])


@router.get("/categories")
async def get_interest_categories():
    """
    Get all interests grouped by category
    
    Returns:
        {
            "creative": [{"name": "Música", "icon": "🎵"}, ...],
            "adventurous": [...],
            "digital": [...],
            "lifestyle": [...]
        }
    """
    return InterestService.get_categorized_interests()


@router.get("/suggestions")
async def get_interest_suggestions(
    limit: int = Query(8, ge=1, le=20),
    current_user: User = Depends(get_current_user)
):
    """
    Get personalized interest suggestions based on user's profile
    
    Args:
        limit: Maximum number of suggestions (default: 8)
        
    Returns:
        List of suggested interests with metadata
    """
    # Get user's profile
    profile = await Profile.find_one(Profile.user_id == str(current_user.id))
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    suggestions = InterestService.get_suggested_interests(profile, limit=limit)
    return suggestions


@router.get("/search")
async def search_interests(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(10, ge=1, le=50)
):
    """
    Search interests by name (autocomplete)
    
    Args:
        q: Search query
        limit: Maximum results
        
    Returns:
        List of matching interests
    """
    results = InterestService.search_interests(q, limit=limit)
    return results


@router.post("/add")
async def add_interest(
    interest_name: str,
    is_private: bool = False,
    current_user: User = Depends(get_current_user)
):
    """
    Add an interest to user's profile
    
    Args:
        interest_name: Name of the interest
        is_private: Whether to mark as private
        
    Returns:
        Updated profile
    """
    profile = await Profile.find_one(Profile.user_id == str(current_user.id))
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Validate interest exists in catalog
    metadata = InterestService.get_interest_metadata(interest_name)
    if not metadata:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Interest '{interest_name}' not found in catalog"
        )
    
    # Add to appropriate list
    if is_private:
        if interest_name not in profile.private_interests:
            profile.private_interests.append(interest_name)
    else:
        if interest_name not in profile.interests:
            profile.interests.append(interest_name)
    
    await profile.save()
    return {"success": True, "profile": profile}


@router.delete("/remove")
async def remove_interest(
    interest_name: str,
    current_user: User = Depends(get_current_user)
):
    """
    Remove an interest from user's profile
    
    Args:
        interest_name: Name of the interest to remove
        
    Returns:
        Updated profile
    """
    profile = await Profile.find_one(Profile.user_id == str(current_user.id))
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Remove from both lists
    if interest_name in profile.interests:
        profile.interests.remove(interest_name)
    if interest_name in profile.private_interests:
        profile.private_interests.remove(interest_name)
    
    await profile.save()
    return {"success": True, "profile": profile}


@router.patch("/toggle-privacy")
async def toggle_interest_privacy(
    interest_name: str,
    make_private: bool,
    current_user: User = Depends(get_current_user)
):
    """
    Toggle privacy setting for an interest
    
    Args:
        interest_name: Name of the interest
        make_private: True to make private, False to make public
        
    Returns:
        Updated profile
    """
    profile = await Profile.find_one(Profile.user_id == str(current_user.id))
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Move between lists
    if make_private:
        # Move from public to private
        if interest_name in profile.interests:
            profile.interests.remove(interest_name)
            if interest_name not in profile.private_interests:
                profile.private_interests.append(interest_name)
    else:
        # Move from private to public
        if interest_name in profile.private_interests:
            profile.private_interests.remove(interest_name)
            if interest_name not in profile.interests:
                profile.interests.append(interest_name)
    
    await profile.save()
    return {"success": True, "profile": profile}
