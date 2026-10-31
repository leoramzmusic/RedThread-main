from typing import Any, Dict, Optional
from datetime import datetime
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, ConfigDict, Field

from src.models.admin_rbac import Permission
from src.models.employee import Employee
from src.models.notification_campaign import NotificationCampaign
from src.models.notification_template import NotificationTemplate
from src.models.notification_audience import NotificationAudience
from src.core.middleware.employee_rbac import require_employee_permission

router = APIRouter()


class CampaignCreate(BaseModel):
    name: str
    template_id: str
    audience_id: str
    status: str = "draft"
    scheduled_at: Optional[datetime] = None

    model_config = ConfigDict(populate_by_name=True)


class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    template_id: Optional[str] = None
    audience_id: Optional[str] = None
    status: Optional[str] = None
    scheduled_at: Optional[datetime] = None

    model_config = ConfigDict(populate_by_name=True)


class CampaignOut(BaseModel):
    id: str
    name: str
    template_id: str
    audience_id: str
    status: str
    scheduled_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    created_by: str
    created_at: datetime
    updated_at: datetime
    stats: Dict[str, int] = Field(default_factory=lambda: {"sent": 0, "delivered": 0, "read": 0, "failed": 0})
    deleted_at: Optional[datetime] = None

    model_config = ConfigDict(populate_by_name=True)


def _campaign_out(doc: NotificationCampaign) -> CampaignOut:
    return CampaignOut(
        id=str(doc.id),
        name=doc.name,
        template_id=str(doc.template_id),
        audience_id=str(doc.audience_id),
        status=doc.status,
        scheduled_at=doc.scheduled_at,
        sent_at=doc.sent_at,
        created_by=str(doc.created_by),
        created_at=doc.created_at,
        updated_at=doc.updated_at,
        stats=doc.stats or {"sent": 0, "delivered": 0, "read": 0, "failed": 0},
        deleted_at=doc.deleted_at,
    )


def _require_object_id(value: str) -> None:
    if not ObjectId.is_valid(value):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found",
        )


@router.get("", response_model=Dict[str, Any])
async def list_campaigns(
    employee: Employee = Depends(require_employee_permission(Permission.SEND_NOTIFICATIONS)),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    query: Dict[str, Any] = {"deleted_at": None}
    total = await NotificationCampaign.find(query).count()
    docs = (
        await NotificationCampaign.find(query)
        .sort("-created_at")
        .skip(skip)
        .limit(limit)
        .to_list()
    )
    return {
        "items": [_campaign_out(d) for d in docs],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.post("", response_model=CampaignOut, status_code=status.HTTP_201_CREATED)
async def create_campaign(
    payload: CampaignCreate,
    employee: Employee = Depends(require_employee_permission(Permission.SEND_NOTIFICATIONS)),
):
    if not ObjectId.is_valid(payload.template_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid template_id")
    if not ObjectId.is_valid(payload.audience_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid audience_id")
    template = await NotificationTemplate.get(ObjectId(payload.template_id))
    if not template or template.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Template not found")
    audience = await NotificationAudience.get(ObjectId(payload.audience_id))
    if not audience or audience.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Audience not found")
    doc = NotificationCampaign(
        name=payload.name,
        template_id=ObjectId(payload.template_id),
        audience_id=ObjectId(payload.audience_id),
        status=payload.status,
        scheduled_at=payload.scheduled_at,
        created_by=employee.id,
    )
    await doc.insert()
    return _campaign_out(doc)


@router.get("/{campaign_id}", response_model=CampaignOut)
async def get_campaign(
    campaign_id: str,
    employee: Employee = Depends(require_employee_permission(Permission.SEND_NOTIFICATIONS)),
):
    _require_object_id(campaign_id)
    doc = await NotificationCampaign.get(ObjectId(campaign_id))
    if not doc or doc.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found"
        )
    return _campaign_out(doc)


@router.put("/{campaign_id}", response_model=CampaignOut)
async def update_campaign(
    campaign_id: str,
    payload: CampaignUpdate,
    employee: Employee = Depends(require_employee_permission(Permission.SEND_NOTIFICATIONS)),
):
    _require_object_id(campaign_id)
    doc = await NotificationCampaign.get(ObjectId(campaign_id))
    if not doc or doc.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found"
        )
    update_data = payload.model_dump(exclude_unset=True)
    for key in ("template_id", "audience_id"):
        if key in update_data and update_data[key] is not None:
            if not ObjectId.is_valid(update_data[key]):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid {key}")
            update_data[key] = ObjectId(update_data[key])
    update_data["updated_at"] = datetime.utcnow()
    await doc.update({"$set": update_data})
    await doc.save()
    return _campaign_out(doc)


@router.delete("/{campaign_id}", status_code=status.HTTP_200_OK)
async def delete_campaign(
    campaign_id: str,
    employee: Employee = Depends(require_employee_permission(Permission.SEND_NOTIFICATIONS)),
):
    _require_object_id(campaign_id)
    doc = await NotificationCampaign.get(ObjectId(campaign_id))
    if not doc or doc.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found"
        )
    doc.deleted_at = datetime.utcnow()
    doc.deleted_by = employee.id
    doc.updated_at = datetime.utcnow()
    await doc.save()
    return {"ok": True, "id": campaign_id}


@router.post("/{campaign_id}/send", status_code=status.HTTP_202_ACCEPTED)
async def send_campaign(
    campaign_id: str,
    employee: Employee = Depends(require_employee_permission(Permission.SEND_NOTIFICATIONS)),
):
    _require_object_id(campaign_id)
    doc = await NotificationCampaign.get(ObjectId(campaign_id))
    if not doc or doc.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found"
        )
    if doc.status not in ("draft", "scheduled"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Campaign cannot be sent from status '{doc.status}'",
        )
    audience = await NotificationAudience.get(doc.audience_id)
    if not audience or audience.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Audience not found")
    template = await NotificationTemplate.get(doc.template_id)
    if not template or template.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Template not found")

    recipient_count = max(int(audience.estimated_count or 0), 0)
    now = datetime.utcnow()
    doc.status = "active"
    doc.sent_at = now
    doc.stats = {
        "sent": recipient_count,
        "delivered": 0,
        "read": 0,
        "failed": 0,
    }
    doc.updated_at = now
    await doc.save()
    return {
        "ok": True,
        "campaign_id": campaign_id,
        "status": doc.status,
        "sent_at": now.isoformat(),
        "recipients": recipient_count,
    }
