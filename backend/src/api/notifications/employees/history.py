from typing import Any, Dict, List, Optional
from datetime import datetime
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status as http_status
from pydantic import BaseModel, ConfigDict

from src.models.admin_rbac import Permission
from src.models.employee import Employee
from src.models.notification_history import NotificationHistory
from src.core.middleware.employee_rbac import require_employee_permission

router = APIRouter()

RECIPIENT_TYPE = "employee"


class HistoryItem(BaseModel):
    id: str
    template_id: Optional[str] = None
    campaign_id: Optional[str] = None
    recipient_type: str
    recipient_id: str
    sender_id: str
    status: str
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    error_message: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(populate_by_name=True)


@router.get("", response_model=Dict[str, Any])
async def list_history(
    employee: Employee = Depends(require_employee_permission(Permission.SEND_NOTIFICATIONS)),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    recipient_type: Optional[str] = Query(None),
    recipient_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    template_id: Optional[str] = Query(None),
    campaign_id: Optional[str] = Query(None),
    sender_id: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
):
    query: Dict[str, Any] = {"recipient_type": recipient_type or RECIPIENT_TYPE}
    if recipient_id:
        query["recipient_id"] = recipient_id
    if status:
        query["status"] = status
    if template_id:
        if not ObjectId.is_valid(template_id):
            raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail="Invalid template_id")
        query["template_id"] = ObjectId(template_id)
    if campaign_id:
        if not ObjectId.is_valid(campaign_id):
            raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail="Invalid campaign_id")
        query["campaign_id"] = ObjectId(campaign_id)
    if sender_id:
        if not ObjectId.is_valid(sender_id):
            raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail="Invalid sender_id")
        query["sender_id"] = ObjectId(sender_id)
    if date_from or date_to:
        date_query: Dict[str, Any] = {}
        if date_from:
            date_query["$gte"] = date_from
        if date_to:
            date_query["$lte"] = date_to
        query["created_at"] = date_query

    total = await NotificationHistory.find(query).count()
    docs = (
        await NotificationHistory.find(query)
        .sort("-created_at")
        .skip(skip)
        .limit(limit)
        .to_list()
    )
    items: List[HistoryItem] = []
    for d in docs:
        items.append(
            HistoryItem(
                id=str(d.id),
                template_id=str(d.template_id) if d.template_id else None,
                campaign_id=str(d.campaign_id) if d.campaign_id else None,
                recipient_type=d.recipient_type,
                recipient_id=d.recipient_id,
                sender_id=str(d.sender_id),
                status=d.status,
                sent_at=d.sent_at,
                delivered_at=d.delivered_at,
                read_at=d.read_at,
                error_message=d.error_message,
                created_at=d.created_at,
            )
        )
    return {
        "items": [item.model_dump() for item in items],
        "total": total,
        "skip": skip,
        "limit": limit,
    }
