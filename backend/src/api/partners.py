from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
from src.models.user import User
from src.models.profile import Profile, RelationshipStatus
from src.api.auth import get_current_user

router = APIRouter()

class PartnerRequest(BaseModel):
    email: Optional[EmailStr] = None
    target_user_id: Optional[str] = None

class PartnerResponse(BaseModel):
    message: str
    partner_name: Optional[str] = None

@router.post("/request", response_model=PartnerResponse)
async def send_partner_request(
    request: PartnerRequest,
    current_user: User = Depends(get_current_user)
):
    """Send a partner request to another user by email or user_id"""
    
    target_user = None
    
    # 1. Find target user
    if request.target_user_id:
        from bson import ObjectId
        if not ObjectId.is_valid(request.target_user_id):
             raise HTTPException(status_code=400, detail="Invalid user ID format")
        target_user = await User.get(request.target_user_id)
    elif request.email:
        target_user = await User.find_one(User.email == request.email)
    else:
        raise HTTPException(status_code=400, detail="Must provide email or target_user_id")

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    if str(target_user.id) == str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot link with yourself"
        )

    # 2. Get profiles
    my_profile = await Profile.find_one(Profile.user_id == str(current_user.id))
    target_profile = await Profile.find_one(Profile.user_id == str(target_user.id))
    
    if not my_profile or not target_profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    # 3. Check if already linked
    if my_profile.partner_id:
        raise HTTPException(
            status_code=400, 
            detail="You are already linked to a partner. Unlink first."
        )
        
    if target_profile.partner_id:
        raise HTTPException(
            status_code=400, 
            detail="This user is already linked to a partner."
        )

    # 4. Check if I already sent a request
    if my_profile.sent_partner_request_to_uid:
        raise HTTPException(
            status_code=400,
            detail="You already have a pending request sent to someone."
        )

    # 5. Send Request (Update both profiles)
    target_profile.partner_request_uid = str(current_user.id)
    my_profile.sent_partner_request_to_uid = str(target_user.id)
    
    await target_profile.save()
    await my_profile.save()
    
    return {"message": f"Partner request sent to {target_profile.display_name}", "partner_name": target_profile.display_name}


@router.post("/accept", response_model=PartnerResponse)
async def accept_partner_request(
    current_user: User = Depends(get_current_user)
):
    """Accept a pending partner request"""
    
    my_profile = await Profile.find_one(Profile.user_id == str(current_user.id))
    
    if not my_profile.partner_request_uid:
        raise HTTPException(status_code=400, detail="No pending partner request")
        
    requester_id = my_profile.partner_request_uid
    requester_profile = await Profile.find_one(Profile.user_id == requester_id)
    
    if not requester_profile:
        # Cleanup invalid request
        my_profile.partner_request_uid = None
        await my_profile.save()
        raise HTTPException(status_code=404, detail="Requester profile not found")
        
    # Link both users
    my_profile.partner_id = requester_id
    my_profile.relationship_status = RelationshipStatus.IN_RELATIONSHIP
    my_profile.partner_request_uid = None
    
    requester_profile.partner_id = str(current_user.id)
    requester_profile.relationship_status = RelationshipStatus.IN_RELATIONSHIP
    requester_profile.partner_request_uid = None
    requester_profile.sent_partner_request_to_uid = None # Clear their sent status
    
    await my_profile.save()
    await requester_profile.save()
    
    return {"message": f"You are now linked with {requester_profile.display_name}", "partner_name": requester_profile.display_name}


@router.post("/reject", response_model=PartnerResponse)
async def reject_partner_request(
    current_user: User = Depends(get_current_user)
):
    """Reject a pending partner request"""
    
    my_profile = await Profile.find_one(Profile.user_id == str(current_user.id))
    
    if not my_profile.partner_request_uid:
        raise HTTPException(status_code=400, detail="No pending partner request")
        
    requester_id = my_profile.partner_request_uid
    requester_profile = await Profile.find_one(Profile.user_id == requester_id)
    
    my_profile.partner_request_uid = None
    await my_profile.save()
    
    # Clear sender's status if they still exist
    if requester_profile:
        requester_profile.sent_partner_request_to_uid = None
        await requester_profile.save()
    
    return {"message": "Partner request rejected"}


@router.post("/cancel", response_model=PartnerResponse)
async def cancel_partner_request(
    current_user: User = Depends(get_current_user)
):
    """Cancel a sent partner request"""
    
    my_profile = await Profile.find_one(Profile.user_id == str(current_user.id))
    
    if not my_profile.sent_partner_request_to_uid:
        raise HTTPException(status_code=400, detail="No pending request sent")
        
    target_id = my_profile.sent_partner_request_to_uid
    target_profile = await Profile.find_one(Profile.user_id == target_id)
    
    # Clear my sent status
    my_profile.sent_partner_request_to_uid = None
    await my_profile.save()
    
    # Clear target's received status if it matches me
    if target_profile and target_profile.partner_request_uid == str(current_user.id):
        target_profile.partner_request_uid = None
        await target_profile.save()
        
    return {"message": "Partner request canceled"}


@router.delete("/unlink", response_model=PartnerResponse)
async def unlink_partner(
    current_user: User = Depends(get_current_user)
):
    """Unlink from current partner"""
    
    my_profile = await Profile.find_one(Profile.user_id == str(current_user.id))
    
    if not my_profile.partner_id:
        raise HTTPException(status_code=400, detail="You are not linked to anyone")
        
    partner_id = my_profile.partner_id
    partner_profile = await Profile.find_one(Profile.user_id == partner_id)
    
    # Unlink me
    my_profile.partner_id = None
    my_profile.relationship_status = RelationshipStatus.SINGLE 
    await my_profile.save()
    
    # Unlink partner if they exist
    if partner_profile:
        partner_profile.partner_id = None
        partner_profile.relationship_status = RelationshipStatus.SINGLE
        await partner_profile.save()
        
    return {"message": "Unlinked successfully"}

