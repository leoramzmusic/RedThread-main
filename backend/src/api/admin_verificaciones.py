from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel
from src.models.user import User
from src.models.profile import Profile
from src.models.employee import Employee
from src.models.admin_rbac import Permission
from src.core.middleware.employee_rbac import require_employee_permission, log_employee_action
from src.models.notification import Notification

from src.models.verification_log import VerificationLog



router = APIRouter()

class VerificationActionRequest(BaseModel):
    real_name: Optional[str] = None
    birth_date: Optional[str] = None
    reason: Optional[str] = None
    details: Optional[str] = None

@router.get("/pendientes")
async def pending_verifications(
    employee: Employee = Depends(require_employee_permission(Permission.VIEW_USERS))
) -> List[Dict[str, Any]]:
    """
    Get all pending identity verification requests.
    """
    # Find all users with pending verification status
    users = await User.find(User.identity_verification_status == "pending").to_list()
    
    print(f"[ADMIN QUERY] Found {len(users)} pending verifications")
    
    pending_verifications = []
    for user in users:
        # Get profile to fetch birth_date
        profile = await Profile.find_one(Profile.user_id == str(user.id))
        
        print(f"  - User {user.id}: {user.display_name} ({user.email})")
        
        pending_verifications.append({
            "user_id": str(user.id),
            "email": user.email,
            "display_name": user.display_name,
            "submitted_at": user.identity_submitted_at.isoformat() if user.identity_submitted_at else None,
            "document_type": user.identity_document_type,
            "document_url": user.identity_document_url,
            "current_real_name": user.real_name,
            "birth_date": profile.birth_date.strftime("%Y-%m-%d") if profile and profile.birth_date else None,
        })
    
    return pending_verifications

@router.post("/{user_id}/aprobar")
async def approve_verification(
    user_id: str,
    request: VerificationActionRequest,
    employee: Employee = Depends(require_employee_permission(Permission.EDIT_USERS))
) -> Dict[str, Any]:
    """
    Approve identity verification for a user.
    """
    user = await User.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Update user status
    user.identity_verification_status = "verified"
    user.verified = True  # This is the main flag for the app
    user.identity_verified_at = datetime.utcnow()
    
    # Update real name if provided (manual override)
    if request.real_name:
        user.real_name = request.real_name
        
    await user.save()
    
    # Update profile birth date if provided
    if request.birth_date:
        profile = await Profile.find_one(Profile.user_id == user_id)
        if profile:
            profile.birth_date = request.birth_date
            # Recalculate age
            birth_date_obj = datetime.fromisoformat(request.birth_date)
            today = datetime.now()
            age = today.year - birth_date_obj.year - ((today.month, today.day) < (birth_date_obj.month, birth_date_obj.day))
            profile.age = age
            await profile.save()
    
    # Create verification log for approval
    log_entry = VerificationLog(
        admin_id=str(employee.id),
        user_id=user_id,
        action="approved",
        reason="Documento válido",
        timestamp=datetime.utcnow()
    )
    await log_entry.insert()

    await log_employee_action(
        employee_id=str(employee.id),
        action_type="approve_verification",
        description=f"Approved identity verification for user {user_id}",
        target_type="user",
        target_id=user_id,
        metadata={"real_name": request.real_name, "birth_date": request.birth_date}
    )
    
    # Create notification for user
    notification = Notification(
        user_id=user_id,
        type="verification_approved",
        content="Tu documento de identidad ha sido aprobado. Tu perfil ahora está verificado.",
        created_at=datetime.utcnow()
    )
    await notification.insert()
    
    return {"message": "Verification approved successfully", "user_id": user_id}

@router.get("/historial/aprobados")
async def approved_history(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    employee: Employee = Depends(require_employee_permission(Permission.VIEW_USERS))
) -> Dict[str, Any]:
    """Get history of approved verifications"""
    try:
        skip = (page - 1) * limit
        
        # query users who are verified
        users = await User.find(User.identity_verification_status == "verified").skip(skip).limit(limit).sort(-User.identity_verified_at).to_list()
        total = await User.find(User.identity_verification_status == "verified").count()
        
        history_items = []
        for user in users:
            try:
                # Try to find the approval log to get the admin who approved it
                # Correct syntax: find().sort().first_or_none()
                approval_log = await VerificationLog.find(
                    VerificationLog.user_id == str(user.id),
                    VerificationLog.action == "approved"
                ).sort(-VerificationLog.timestamp).first_or_none()
                
                admin_name = "Sistema / Desconocido"
                if approval_log:
                     admin = await Employee.get(approval_log.admin_id)
                     if admin:
                         admin_name = admin.full_name
            except Exception as e:
                print(f"Error fetching verification log for user {user.id}: {e}")
                admin_name = "Error en log"
            
            history_items.append({
                "user_id": str(user.id),
                "display_name": user.display_name,
                "document_type": user.identity_document_type,
                "verified_at": user.identity_verified_at.isoformat() if user.identity_verified_at else None,
                "admin_name": admin_name
            })
            
        return {
            "items": history_items,
            "total": total,
            "page": page,
            "pages": (total + limit - 1) // limit
        }
    except Exception as e:
        print(f"Error in approved_history endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats/general")
async def verification_stats(
    employee: Employee = Depends(require_employee_permission(Permission.VIEW_USERS))
) -> Dict[str, Any]:
    """Get verification statistics for dashboard"""
    try:
        # General Counts
        total_verified = await User.find(User.identity_verification_status == "verified").count()
        total_rejected = await VerificationLog.find(VerificationLog.action == "rejected").count()
        total_pending = await User.find(User.identity_verification_status == "pending").count()
        
        # Rejection Reasons Distribution
        # MongoDB aggregation
        pipeline = [
            {"$match": {"action": "rejected"}},
            {"$group": {"_id": "$reason", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 5}
        ]
        # to_list(None) is required by motor to fetch all results
        rejection_stats = await VerificationLog.aggregate(pipeline).to_list(None)
        
        top_reasons = [{"reason": item["_id"] or "Sin razón", "count": item["count"]} for item in rejection_stats]
        
        # Approval Rate
        total_processed = total_verified + total_rejected
        approval_rate = 0
        if total_processed > 0:
            approval_rate = round((total_verified / total_processed) * 100, 1)
            
        return {
            "total_verified": total_verified,
            "total_rejected": total_rejected,
            "total_pending": total_pending,
            "approval_rate": approval_rate,
            "top_rejection_reasons": top_reasons
        }
    except Exception as e:
        print(f"Error in verification_stats endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{user_id}/rechazar")
async def reject_verification(
    user_id: str,
    request: VerificationActionRequest,
    employee: Employee = Depends(require_employee_permission(Permission.EDIT_USERS))
) -> Dict[str, Any]:
    """
    Reject identity verification for a user.
    Document data is kept so user can see what was rejected and decide to delete or replace.
    """
    user = await User.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Update status to rejected but KEEP document data
    user.identity_verification_status = "rejected"
    user.identity_rejection_reason = request.reason
    user.verified = False  # Reset verified flag to unlock fields
    user.identity_verified_at = None  # Clear verification timestamp
    # NOTE: We keep document_url, document_type, and submitted_at
    # so user can see what was rejected and decide what to do
    
    await user.save()
    
    # Debug logging
    print(f"[REJECTION] User {user_id} verification rejected:")
    print(f"  - verified: {user.verified}")
    print(f"  - identity_verification_status: {user.identity_verification_status}")
    print(f"  - identity_verified_at: {user.identity_verified_at}")
    print(f"  - document_url: {user.identity_document_url} (KEPT)")
    
    # Create verification log
    log_entry = VerificationLog(
        admin_id=str(employee.id),
        user_id=user_id,
        action="rejected",
        reason=request.reason,
        details=request.details,
        timestamp=datetime.utcnow()
    )
    await log_entry.insert()
    
    # Also log to standard employee action log
    await log_employee_action(
        employee_id=str(employee.id),
        action_type="reject_verification",
        description=f"Rejected identity verification for user {user_id}",
        target_type="user",
        target_id=user_id,
        metadata={
            "reason": request.reason,
            "details": request.details
        }
    )
    
    # Create notification for user with rejection reason
    reason_text = request.reason
    if request.reason == "Otro" and request.details:
        reason_text = f"{request.reason}: {request.details}"
        
    notification = Notification(
        user_id=user_id,
        type="verification_rejected",
        content=f"Tu documento de identidad ha sido rechazado. Razón: {reason_text}. Puedes eliminar el documento actual y subir uno nuevo, o reemplazarlo directamente.",
        created_at=datetime.utcnow()
    )
    await notification.insert()
    
    return {"message": "Verification rejected", "user_id": user_id}
