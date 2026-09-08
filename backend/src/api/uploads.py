from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List
import os
import shutil
import uuid
from pathlib import Path
from src.models.user import User
from src.models.profile import Profile
from src.api.auth import get_current_user

router = APIRouter()

# Configuration
UPLOAD_DIR = Path("uploads")
PHOTOS_DIR = UPLOAD_DIR / "photos"
LOOPS_DIR = UPLOAD_DIR / "loops"
MAX_PHOTOS = 9
MAX_PHOTO_SIZE = 10 * 1024 * 1024  # 10MB
MAX_LOOP_SIZE = 50 * 1024 * 1024  # 50MB
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm", "video/quicktime"}

# Create upload directories
PHOTOS_DIR.mkdir(parents=True, exist_ok=True)
LOOPS_DIR.mkdir(parents=True, exist_ok=True)


class PhotoReorderRequest(BaseModel):
    photo_urls: List[str]


@router.post("/photo")
async def upload_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload a profile photo (max 9 photos)"""
    
    # Get user profile
    profile = await Profile.find_one(Profile.user_id == str(current_user.id))
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Check photo limit
    if len(profile.photos) >= MAX_PHOTOS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum {MAX_PHOTOS} photos allowed"
        )
    
    # Validate file type
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Allowed: JPEG, PNG, WebP"
        )
    
    # Read file and check size
    contents = await file.read()
    if len(contents) > MAX_PHOTO_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size: {MAX_PHOTO_SIZE / 1024 / 1024}MB"
        )
    
    # Generate unique filename
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = PHOTOS_DIR / unique_filename
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # Update profile
    photo_url = f"/uploads/photos/{unique_filename}"
    profile.photos.append(photo_url)
    await profile.save()
    
    return {
        "message": "Photo uploaded successfully",
        "photo_url": photo_url,
        "total_photos": len(profile.photos)
    }


@router.delete("/photo")
async def delete_photo(
    photo_url: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a profile photo"""
    
    # Get user profile
    profile = await Profile.find_one(Profile.user_id == str(current_user.id))
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Check if photo exists in profile
    if photo_url not in profile.photos:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo not found in profile"
        )
    
    # Delete file from filesystem
    try:
        filename = photo_url.split("/")[-1]
        file_path = PHOTOS_DIR / filename
        if file_path.exists():
            file_path.unlink()
    except Exception as e:
        print(f"Error deleting file: {e}")
    
    # Remove from profile
    profile.photos.remove(photo_url)
    await profile.save()
    
    return {
        "message": "Photo deleted successfully",
        "total_photos": len(profile.photos)
    }


@router.put("/photos/reorder")
async def reorder_photos(
    request: PhotoReorderRequest,
    current_user: User = Depends(get_current_user)
):
    """Reorder profile photos"""
    
    # Get user profile
    profile = await Profile.find_one(Profile.user_id == str(current_user.id))
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Validate that all photos belong to the user
    if set(request.photo_urls) != set(profile.photos):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Photo URLs do not match profile photos"
        )
    
    # Update order
    profile.photos = request.photo_urls
    await profile.save()
    
    return {
        "message": "Photos reordered successfully",
        "photos": profile.photos
    }


@router.post("/loop")
async def upload_loop(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload a video loop"""
    
    # Get user profile
    profile = await Profile.find_one(Profile.user_id == str(current_user.id))
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Validate file type
    if file.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Allowed: MP4, WebM, MOV"
        )
    
    # Read file and check size
    contents = await file.read()
    if len(contents) > MAX_LOOP_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size: {MAX_LOOP_SIZE / 1024 / 1024}MB"
        )
    
    # Generate unique filename
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = LOOPS_DIR / unique_filename
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # Update profile
    loop_url = f"/uploads/loops/{unique_filename}"
    profile.loops.append(loop_url)
    await profile.save()
    
    return {
        "message": "Loop uploaded successfully",
        "loop_url": loop_url,
        "total_loops": len(profile.loops)
    }


@router.delete("/loop")
async def delete_loop(
    loop_url: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a video loop"""
    
    # Get user profile
    profile = await Profile.find_one(Profile.user_id == str(current_user.id))
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Check if loop exists in profile
    if loop_url not in profile.loops:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loop not found in profile"
        )
    
    # Delete file from filesystem
    try:
        filename = loop_url.split("/")[-1]
        file_path = LOOPS_DIR / filename
        if file_path.exists():
            file_path.unlink()
    except Exception as e:
        print(f"Error deleting file: {e}")
    
    # Remove from profile
    profile.loops.remove(loop_url)
    await profile.save()
    
    return {
        "message": "Loop deleted successfully",
        "total_loops": len(profile.loops)
    }


# Serve uploaded files
@router.get("/photos/{filename}")
async def get_photo(filename: str):
    """Serve a photo file"""
    file_path = PHOTOS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Photo not found")
    return FileResponse(file_path)


@router.get("/loops/{filename}")
async def get_loop(filename: str):
    """Serve a loop video file"""
    file_path = LOOPS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Loop not found")
    return FileResponse(file_path)

