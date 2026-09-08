from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form, Body
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid
import shutil
import os

from src.models.user import User
from src.models.media import MediaItem, MediaType
from src.models.photo_metric import PhotoMetric
from src.api.auth import get_current_user

router = APIRouter()

# Constants
MAX_PHOTOS = 9
MAX_VIDEOS = 3
MAX_TIKTOK = 3
MAX_INSTAGRAM = 6
UPLOAD_DIR = "static/uploads"

@router.get("/{user_id}", response_model=List[MediaItem])
async def get_user_media(user_id: str):
    """Get all media items for a user, sorted by order_index"""
    media = await MediaItem.find(MediaItem.user_id == user_id).sort(+MediaItem.order_index).to_list()
    return media

from src.models.profile import Profile

async def sync_profile_photos(user_id: str):
    """Syncs MediaItems of type PHOTO to Profile.photos"""
    photos = await MediaItem.find(
        MediaItem.user_id == user_id,
        MediaItem.type == MediaType.PHOTO
    ).sort(+MediaItem.order_index).to_list()
    
    photo_urls = [p.url for p in photos]
    
    profile = await Profile.find_one(Profile.user_id == user_id)
    if profile:
        profile.photos = photo_urls
        await profile.save()

@router.post("/upload")
async def upload_media(
    file: UploadFile = File(...),
    type: MediaType = Form(...),
    current_user: User = Depends(get_current_user)
):
    """Upload a local photo or video"""
    
    # Check limits
    existing_media = await MediaItem.find(
        MediaItem.user_id == str(current_user.id),
        MediaItem.type == type
    ).to_list()
    
    if type == MediaType.PHOTO and len(existing_media) >= MAX_PHOTOS:
        raise HTTPException(status_code=400, detail=f"Maximum {MAX_PHOTOS} photos allowed")
    if type == MediaType.VIDEO and len(existing_media) >= MAX_VIDEOS:
        raise HTTPException(status_code=400, detail=f"Maximum {MAX_VIDEOS} video allowed")
    
    # Validate file type
    if type == MediaType.PHOTO and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type for photo")
    if type == MediaType.VIDEO and not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="Invalid file type for video")
        
    # Save file
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_extension = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = f"{UPLOAD_DIR}/{filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # URL (assuming local dev)
    url = f"http://localhost:8000/{file_path}"
    
    # Determine order index (append to end)
    all_media = await MediaItem.find(MediaItem.user_id == str(current_user.id)).to_list()
    order_index = len(all_media)
    
    # Create MediaItem
    item = MediaItem(
        user_id=str(current_user.id),
        type=type,
        url=url,
        order_index=order_index
    )
    await item.insert()
    
    # Sync if photo
    if type == MediaType.PHOTO:
        await sync_profile_photos(str(current_user.id))
    
    return item

@router.post("/link")
async def add_media_link(
    url: str = Body(..., embed=True),
    type: MediaType = Body(..., embed=True),
    current_user: User = Depends(get_current_user)
):
    """Add an external media link (TikTok/Instagram)"""
    
    # Check limits
    existing_media = await MediaItem.find(
        MediaItem.user_id == str(current_user.id),
        MediaItem.type == type
    ).to_list()
    
    if type == MediaType.TIKTOK and len(existing_media) >= MAX_TIKTOK:
        raise HTTPException(status_code=400, detail=f"Maximum {MAX_TIKTOK} TikTok links allowed")
    # Instagram logic might be different (selection of posts), but for link adding:
    if type == MediaType.INSTAGRAM and len(existing_media) >= MAX_INSTAGRAM:
         raise HTTPException(status_code=400, detail=f"Maximum {MAX_INSTAGRAM} Instagram links allowed")

    # Determine order index
    all_media = await MediaItem.find(MediaItem.user_id == str(current_user.id)).to_list()
    order_index = len(all_media)
    
    item = MediaItem(
        user_id=str(current_user.id),
        type=type,
        url=url,
        order_index=order_index
    )
    await item.insert()
    
    return item

@router.delete("/{media_id}")
async def delete_media(
    media_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a media item"""
    item = await MediaItem.get(media_id)
    
    if not item:
        raise HTTPException(status_code=404, detail="Media item not found")
        
    if item.user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
        
    # If local file, delete it
    if item.type in [MediaType.PHOTO, MediaType.VIDEO] and "localhost" in item.url:
        try:
            # Extract relative path
            # URL: http://localhost:8000/static/uploads/filename.ext
            # Path: static/uploads/filename.ext
            relative_path = item.url.split("8000/")[-1]
            if os.path.exists(relative_path):
                os.remove(relative_path)
        except Exception as e:
            print(f"Error deleting file: {e}")
            
    await item.delete()
    
    # Sync if photo
    if item.type == MediaType.PHOTO:
        await sync_profile_photos(str(current_user.id))
        
    return {"message": "Deleted successfully"}

@router.patch("/order")
async def reorder_media(
    media_ids: List[str] = Body(...),
    current_user: User = Depends(get_current_user)
):
    """Update order of media items"""
    
    for index, media_id in enumerate(media_ids):
        item = await MediaItem.get(media_id)
        if item and item.user_id == str(current_user.id):
            item.order_index = index
            await item.save()
            
    await sync_profile_photos(str(current_user.id))
            
    return {"message": "Order updated"}

class PhotoMetricRequest(BaseModel):
    media_id: str
    views: int = 0
    clicks: int = 0
    matches: int = 0
    view_time: float = 0.0
    conversions: int = 0

@router.post("/metrics/track")
async def track_photo_metrics(
    data: PhotoMetricRequest,
    current_user: User = Depends(get_current_user)
):
    """Update metrics for a specific photo"""
    metric = await PhotoMetric.find_one(
        PhotoMetric.user_id == str(current_user.id),
        PhotoMetric.media_id == data.media_id
    )
    
    if not metric:
        metric = PhotoMetric(
            user_id=str(current_user.id),
            media_id=data.media_id
        )
    
    metric.views += data.views
    metric.clicks += data.clicks
    metric.matches += data.matches
    metric.view_time += data.view_time
    metric.conversions += data.conversions
    
    await metric.save()
    return {"message": "Metrics tracked"}

@router.post("/smart-photos/evaluate")
async def evaluate_smart_photos(
    current_user: User = Depends(get_current_user)
):
    """Manually trigger Smart Photos evaluation for current user"""
    from src.services.smart_photos import SmartPhotosService
    await SmartPhotosService.evaluate_user_photos(str(current_user.id))
    return {"message": "Smart Photos evaluated and reordered if necessary"}
