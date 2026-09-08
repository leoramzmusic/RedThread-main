from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from src.models.user import User
from src.models.profile import Profile
from src.services.auth.routes import get_current_user


router = APIRouter()


# Request/Response Models
class UpdateProfileRequest(BaseModel):
    display_name: Optional[str] = None
    bio: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    intentions: Optional[List[str]] = None
    interests: Optional[List[str]] = None
    favorite_interests: Optional[List[str]] = None
    hobbies: Optional[List[str]] = None
    languages: Optional[List[str]] = None
    mbti: Optional[str] = None
    mood: Optional[str] = None
    has_pets: Optional[bool] = None
    pet_types: Optional[List[str]] = None
    activity_pattern: Optional[str] = None
    location_sharing_enabled: Optional[bool] = None


class UpdateLocationRequest(BaseModel):
    latitude: float
    longitude: float
    city: Optional[str] = None
    country: Optional[str] = None


@router.get("/me")
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """Get current user's profile"""
    
    profile = await Profile.find_one(Profile.user_id == str(current_user.id))
    
    if not profile:
        # Auto-create profile if missing (self-healing)
        profile = Profile(
            user_id=str(current_user.id),
            display_name=current_user.email.split('@')[0] if current_user.email else "User",
            age=18,
            gender="prefer_not_to_say",
            created_at=datetime.utcnow()
        )
        await profile.insert()
    
    return profile


@router.put("/me")
async def update_my_profile(
    request: UpdateProfileRequest,
    current_user: User = Depends(get_current_user)
):
    """Update current user's profile"""
    
    profile = await Profile.find_one(Profile.user_id == str(current_user.id))
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Update fields
    update_data = request.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)
    
    profile.updated_at = datetime.utcnow()
    
    # Calculate profile completion
    profile.profile_completion = calculate_profile_completion(profile)
    
    await profile.save()
    
    return profile


@router.post("/location")
async def update_location(
    request: UpdateLocationRequest,
    current_user: User = Depends(get_current_user)
):
    """Update user location for proximity radar"""
    
    profile = await Profile.find_one(Profile.user_id == str(current_user.id))
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    if not profile.location_sharing_enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Location sharing is disabled"
        )
    
    # Update location
    profile.location = {
        "type": "Point",
        "coordinates": [request.longitude, request.latitude],
        "city": request.city,
        "country": request.country
    }
    profile.updated_at = datetime.utcnow()
    
    await profile.save()
    
    return {"message": "Location updated successfully"}


@router.get("/{user_id}")
async def get_profile(user_id: str, current_user: User = Depends(get_current_user)):
    """Get another user's profile"""
    
    profile = await Profile.find_one(Profile.user_id == user_id)
    
    if not profile or not profile.profile_visible:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found or not visible"
        )
    
    return profile


@router.post("/photos/upload")
async def upload_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload profile photo"""
    
    # TODO: Implement actual file upload to storage (S3, Azure Blob, etc.)
    # For now, return placeholder
    
    profile = await Profile.find_one(Profile.user_id == str(current_user.id))
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Placeholder URL
    photo_url = f"https://storage.example.com/photos/{current_user.id}/{file.filename}"
    
    profile.photos.append(photo_url)
    profile.updated_at = datetime.utcnow()
    await profile.save()
    
    return {"photo_url": photo_url, "message": "Photo uploaded successfully"}


@router.delete("/photos/{photo_index}")
async def delete_photo(
    photo_index: int,
    current_user: User = Depends(get_current_user)
):
    """Delete profile photo by index"""
    
    profile = await Profile.find_one(Profile.user_id == str(current_user.id))
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    if photo_index < 0 or photo_index >= len(profile.photos):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid photo index"
        )
    
    profile.photos.pop(photo_index)
    profile.updated_at = datetime.utcnow()
    await profile.save()
    
    return {"message": "Photo deleted successfully"}


def calculate_profile_completion(profile: Profile) -> int:
    """Calculate profile completion percentage"""
    
    total_fields = 15
    completed_fields = 0
    
    if profile.display_name:
        completed_fields += 1
    if profile.bio:
        completed_fields += 1
    if profile.age:
        completed_fields += 1
    if profile.gender:
        completed_fields += 1
    if profile.intentions:
        completed_fields += 1
    if profile.interests:
        completed_fields += 1
    if profile.hobbies:
        completed_fields += 1
    if profile.languages:
        completed_fields += 1
    if profile.mbti:
        completed_fields += 1
    if profile.activity_pattern:
        completed_fields += 1
    if profile.photos:
        completed_fields += 1
    if profile.spotify_playlists:
        completed_fields += 1
    if profile.favorite_songs:
        completed_fields += 1
    if profile.mood:
        completed_fields += 1
    if profile.location:
        completed_fields += 1
    
    return int((completed_fields / total_fields) * 100)

