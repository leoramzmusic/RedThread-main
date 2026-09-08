from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime, timedelta
from src.models.user import User
from src.models.notification import Notification
from src.models.profile import Profile
from src.api.auth import get_current_user

router = APIRouter()

@router.get("", response_model=List[dict])
async def get_notifications(
    type: str = None, 
    limit: int = 50, 
    current_user: User = Depends(get_current_user)
):
    """
    Get notifications for the current user.
    Automatically deletes notifications older than 48 hours.
    Supports filtering by type.
    """
    # 1. Cleanup old notifications (older than 48h)
    cutoff_time = datetime.utcnow() - timedelta(hours=48)
    await Notification.find(
        Notification.user_id == str(current_user.id),
        Notification.created_at < cutoff_time
    ).delete()
    
    # 2. Build query
    query = {
        "user_id": str(current_user.id)
    }
    if type:
        query["type"] = type
        
    # 3. Fetch active notifications
    notifications = await Notification.find(query).sort(-Notification.created_at).limit(limit).to_list()
    
    # 4. Enrich with user data if needed
    result = []
    for notif in notifications:
        notif_dict = notif.dict()
        notif_dict['id'] = str(notif.id)
        
        # If there's a related user, fetch their basic info
        if notif.related_user_id:
            related_profile = await Profile.find_one(Profile.user_id == notif.related_user_id)
            if related_profile:
                notif_dict['user'] = {
                    'name': related_profile.display_name,
                    'photo': related_profile.photos[0] if related_profile.photos else None
                }
            else:
                notif_dict['user'] = {'name': 'Usuario', 'photo': None}
        else:
            # System notification
            notif_dict['user'] = {'name': 'Red Thread', 'photo': None}
            
        result.append(notif_dict)
        
    return result

@router.get("/unread-count")
async def get_unread_count(current_user: User = Depends(get_current_user)):
    """Get the count of unread notifications"""
    count = await Notification.find(
        Notification.user_id == str(current_user.id),
        Notification.is_read == False
    ).count()
    
    return {"count": count}

@router.post("/{notification_id}/read")
async def mark_as_read(notification_id: str, current_user: User = Depends(get_current_user)):
    """Mark a specific notification as read"""
    from bson import ObjectId
    
    notification = await Notification.get(ObjectId(notification_id))
    
    if not notification or notification.user_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
        
    notification.is_read = True
    await notification.save()
    
    return {"message": "Marked as read"}

@router.post("/read-all")
async def mark_all_as_read(current_user: User = Depends(get_current_user)):
    """Mark all notifications as read"""
    await Notification.find(
        Notification.user_id == str(current_user.id),
        Notification.is_read == False
    ).update({"$set": {"is_read": True}})
    
    return {"message": "All marked as read"}

