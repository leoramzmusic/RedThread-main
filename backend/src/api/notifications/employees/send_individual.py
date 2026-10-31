from typing import Optional
from datetime import datetime
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict

from src.models.admin_rbac import Permission
from src.models.employee import Employee
from src.models.notification_history import NotificationHistory
from src.core.middleware.employee_rbac import require_employee_permission

router = APIRouter()

RECIPIENT_TYPE = "employee"


class IndividualSendRequest(BaseModel):
    recipient_id: str
    template_id: Optional[str] = None
    content: str
    channel: str = "in_app"

    model_config = ConfigDict(populate_by_name=True)


class IndividualSendOut(BaseModel):
    ok: bool
    history_id: str
    recipient_id: str
    channel: str
    sent_at: datetime

    model_config = ConfigDict(populate_by_name=True)


@router.post("", response_model=IndividualSendOut, status_code=status.HTTP_202_ACCEPTED)
async def send_individual_notification(
    payload: IndividualSendRequest,
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
    return IndividualSendOut(
        ok=True,
        history_id=str(history.id),
        recipient_id=payload.recipient_id,
        channel=payload.channel,
        sent_at=history.sent_at,
    )
