from typing import Any, Dict, Optional
from datetime import datetime
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, ConfigDict

from src.models.admin_rbac import Permission
from src.models.employee import Employee
from src.models.notification_history import NotificationHistory
from src.core.middleware.employee_rbac import require_employee_permission

router = APIRouter()

RECIPIENT_TYPE = "brand"


class TestSendRequest(BaseModel):
    recipient_id: str
    template_id: Optional[str] = None
    content: str
    channel: str = "in_app"

    model_config = ConfigDict(populate_by_name=True)


class TestSendOut(BaseModel):
    ok: bool
    history_id: str
    recipient_id: str
    channel: str
    sent_at: datetime

    model_config = ConfigDict(populate_by_name=True)


class TestHistoryItem(BaseModel):
    id: str
    template_id: Optional[str] = None
    campaign_id: Optional[str] = None
    recipient_type: str
    recipient_id: str
    sender_id: str
    status: str
    sent_at: Optional[datetime] = None
    error_message: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(populate_by_name=True)


@router.post("/send", response_model=TestSendOut, status_code=status.HTTP_202_ACCEPTED)
async def send_test_notification(
    payload: TestSendRequest,
    employee: Employee = Depends(require_employee_permission(Permission.SEND_NOTIFICATIONS)),
):
    if payload.channel not in ("push", "in_app", "email"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid channel"
        )
    history = NotificationHistory(
        template_id=ObjectId(payload.template_id) if payload.template_id else None,
        campaign_id=None,
        recipient_type=RECIPIENT_TYPE,
        recipient_id=payload.recipient_id,
        sender_id=employee.id,
        status="sent",
        sent_at=datetime.utcnow(),
    )
    await history.insert()
    return TestSendOut(
        ok=True,
        history_id=str(history.id),
        recipient_id=payload.recipient_id,
        channel=payload.channel,
        sent_at=history.sent_at,
    )


@router.get("/history", response_model=Dict[str, Any])
async def list_test_history(
    employee: Employee = Depends(require_employee_permission(Permission.SEND_NOTIFICATIONS)),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    query: Dict[str, Any] = {"recipient_type": RECIPIENT_TYPE}
    total = await NotificationHistory.find(query).count()
    docs = (
        await NotificationHistory.find(query)
        .sort("-created_at")
        .skip(skip)
        .limit(limit)
        .to_list()
    )
    items = []
    for d in docs:
        items.append(
            TestHistoryItem(
                id=str(d.id),
                template_id=str(d.template_id) if d.template_id else None,
                campaign_id=str(d.campaign_id) if d.campaign_id else None,
                recipient_type=d.recipient_type,
                recipient_id=d.recipient_id,
                sender_id=str(d.sender_id),
                status=d.status,
                sent_at=d.sent_at,
                error_message=d.error_message,
                created_at=d.created_at,
            )
        )
    return {"items": items, "total": total, "skip": skip, "limit": limit}
