from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import List
from src.models.user import User, SubscriptionTier
from src.models.profile import Profile
from src.api.auth import get_current_user
from src.core.config import settings
import math


router = APIRouter()


class NearbyUser(BaseModel):
    user_id: str
    display_name: str
    age: int
    photos: List[str]
    distance_km: float
    interests: List[str]


@router.get("/nearby", response_model=List[NearbyUser])
async def get_nearby_users(current_user: User = Depends(get_current_user)):
    """Get nearby users based on location"""
    
    # Get current user's profile
    my_profile = await Profile.find_one(Profile.user_id == str(current_user.id))
    
    if not my_profile or not my_profile.location_sharing_enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Location sharing is not enabled"
        )
    
    if not my_profile.location:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Location not set"
        )
    
    # Determine radar range based on subscription
    max_range = settings.PREMIUM_RADAR_RANGE_KM if current_user.subscription_tier == SubscriptionTier.PREMIUM else settings.BASIC_RADAR_RANGE_KM
    
    my_coords = my_profile.location["coordinates"]
    my_lon, my_lat = my_coords[0], my_coords[1]
    
    # Find nearby profiles
    nearby_profiles = await Profile.find(
        Profile.user_id != str(current_user.id),
        Profile.location_sharing_enabled == True,
        Profile.profile_visible == True
    ).to_list()
    
    nearby_users = []
    
    for profile in nearby_profiles:
        if not profile.location:
            continue
        
        coords = profile.location["coordinates"]
        lon, lat = coords[0], coords[1]
        
        # Calculate distance
        distance = calculate_distance(my_lat, my_lon, lat, lon)
        
        if distance <= max_range:
            nearby_users.append(NearbyUser(
                user_id=profile.user_id,
                display_name=profile.display_name,
                age=profile.age,
                photos=profile.photos[:3],
                distance_km=round(distance, 2),
                interests=profile.interests
            ))
    
    # Sort by distance
    nearby_users.sort(key=lambda x: x.distance_km)
    
    return nearby_users


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two coordinates in kilometers using Haversine formula"""
    
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    distance = R * c
    return distance

