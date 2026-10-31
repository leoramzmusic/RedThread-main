from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from src.models.notification import Notification
from src.models.employee import Employee
from src.core.middleware.employee_rbac import get_current_employee

router = APIRouter(prefix="/employee/notifications", tags=["Employee Notifications"])

@router.get("/inbox")
async def get_employee_inbox(
    is_read: Optional[bool] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    archived: Optional[bool] = None,
    limit: int = Query(50, le=100),
    offset: int = 0,
    employee: Employee = Depends(get_current_employee)
):
    """Get employee notification inbox"""
    emp_ids = [employee.employee_id, str(employee.id), employee.email]
    query = {
        "recipient_type": "employee",
        "recipient_id": {"$in": [i for i in emp_ids if i]}
    }
    if is_read is not None:
        query["is_read"] = is_read
    if priority:
        query["priority"] = priority
    if category:
        query["category"] = category
    if archived is not None:
        if archived:
            query["archived_at"] = {"$ne": None}
        else:
            query["archived_at"] = None

    notifications = await Notification.find(query).sort("-created_at").skip(offset).limit(limit).to_list()
    
    result = []
    for n in notifications:
        result.append({
            "id": str(n.id),
            "recipient_type": n.recipient_type,
            "recipient_id": n.recipient_id,
            "category": n.category,
            "content": n.content,
            "priority": n.priority,
            "is_read": n.is_read,
            "seen_at": n.seen_at,
            "read_at": n.read_at,
            "archived_at": getattr(n, "archived_at", None),
            "snoozed_until": getattr(n, "snoozed_until", None),
            "expires_at": n.expires_at,
            "action_url": n.action_url,
            "action_label": n.action_label,
            "created_at": n.created_at,
        })
    return {"notifications": result}

async def _get_employee_notification(notification_id: str, employee: Employee) -> Notification:
    notif = await Notification.get(notification_id)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notif

@router.post("/{notification_id}/seen")
@router.post("/inbox/{notification_id}/seen")
async def mark_notification_seen(
    notification_id: str,
    employee: Employee = Depends(get_current_employee)
):
    notif = await _get_employee_notification(notification_id, employee)
    if not notif.seen_at:
        notif.seen_at = datetime.utcnow()
        notif.updated_at = datetime.utcnow()
        await notif.save()
    return {"success": True, "message": "Notification marked as seen"}

@router.post("/seen")
async def mark_seen_body(
    payload: Dict[str, Any] = Body(...),
    employee: Employee = Depends(get_current_employee)
):
    notif_id = payload.get("notification_id") or payload.get("id")
    if not notif_id:
        raise HTTPException(status_code=400, detail="notification_id is required")
    notif = await _get_employee_notification(notif_id, employee)
    if not notif.seen_at:
        notif.seen_at = datetime.utcnow()
        notif.updated_at = datetime.utcnow()
        await notif.save()
    return {"success": True}

@router.post("/{notification_id}/read")
@router.post("/inbox/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    employee: Employee = Depends(get_current_employee)
):
    notif = await _get_employee_notification(notification_id, employee)
    notif.is_read = True
    notif.read_at = datetime.utcnow()
    if not notif.seen_at:
        notif.seen_at = datetime.utcnow()
    notif.updated_at = datetime.utcnow()
    await notif.save()
    return {"success": True, "message": "Notification marked as read"}

@router.post("/read")
async def mark_read_body(
    payload: Dict[str, Any] = Body(...),
    employee: Employee = Depends(get_current_employee)
):
    notif_id = payload.get("notification_id") or payload.get("id")
    if not notif_id:
        raise HTTPException(status_code=400, detail="notification_id is required")
    notif = await _get_employee_notification(notif_id, employee)
    notif.is_read = True
    notif.read_at = datetime.utcnow()
    if not notif.seen_at:
        notif.seen_at = datetime.utcnow()
    notif.updated_at = datetime.utcnow()
    await notif.save()
    return {"success": True}

@router.post("/{notification_id}/archive")
@router.post("/inbox/{notification_id}/archive")
async def archive_notification(
    notification_id: str,
    employee: Employee = Depends(get_current_employee)
):
    notif = await _get_employee_notification(notification_id, employee)
    notif.archived_at = datetime.utcnow()
    notif.updated_at = datetime.utcnow()
    await notif.save()
    return {"success": True, "message": "Notification archived"}

@router.post("/archive")
async def archive_body(
    payload: Dict[str, Any] = Body(...),
    employee: Employee = Depends(get_current_employee)
):
    notif_id = payload.get("notification_id") or payload.get("id")
    if not notif_id:
        raise HTTPException(status_code=400, detail="notification_id is required")
    notif = await _get_employee_notification(notif_id, employee)
    notif.archived_at = datetime.utcnow()
    notif.updated_at = datetime.utcnow()
    await notif.save()
    return {"success": True}

@router.post("/{notification_id}/snooze")
@router.post("/inbox/{notification_id}/snooze")
async def snooze_notification(
    notification_id: str,
    payload: Dict[str, Any] = Body(default_factory=dict),
    employee: Employee = Depends(get_current_employee)
):
    notif = await _get_employee_notification(notification_id, employee)
    duration = payload.get("duration", "1h")
    delta = timedelta(hours=1)
    if duration.endswith("m"):
        delta = timedelta(minutes=int(duration[:-1]))
    elif duration.endswith("h"):
        delta = timedelta(hours=int(duration[:-1]))
    elif duration.endswith("d"):
        delta = timedelta(days=int(duration[:-1]))
    
    notif.snoozed_until = datetime.utcnow() + delta
    notif.updated_at = datetime.utcnow()
    await notif.save()
    return {"success": True, "snoozed_until": notif.snoozed_until}

@router.post("/snooze")
async def snooze_body(
    payload: Dict[str, Any] = Body(...),
    employee: Employee = Depends(get_current_employee)
):
    notif_id = payload.get("notification_id") or payload.get("id")
    if not notif_id:
        raise HTTPException(status_code=400, detail="notification_id is required")
    notif = await _get_employee_notification(notif_id, employee)
    duration = payload.get("duration", "1h")
    delta = timedelta(hours=1)
    if duration.endswith("m"):
        delta = timedelta(minutes=int(duration[:-1]))
    elif duration.endswith("h"):
        delta = timedelta(hours=int(duration[:-1]))
    elif duration.endswith("d"):
        delta = timedelta(days=int(duration[:-1]))
    
    notif.snoozed_until = datetime.utcnow() + delta
    notif.updated_at = datetime.utcnow()
    await notif.save()
    return {"success": True, "snoozed_until": notif.snoozed_until}
