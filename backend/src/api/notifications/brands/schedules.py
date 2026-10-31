from typing import Any, Dict, Optional
from datetime import datetime
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, ConfigDict

from src.models.admin_rbac import Permission
from src.models.employee import Employee
from src.models.notification_schedule import NotificationSchedule
from src.models.notification_campaign import NotificationCampaign
from src.core.middleware.employee_rbac import require_employee_permission

router = APIRouter()


class ScheduleCreate(BaseModel):
    campaign_id: str
    schedule_type: str = "once"
    schedule_expression: str
    start_date: datetime
    end_date: Optional[datetime] = None
    is_active: bool = True

    model_config = ConfigDict(populate_by_name=True)


class ScheduleUpdate(BaseModel):
    campaign_id: Optional[str] = None
    schedule_type: Optional[str] = None
    schedule_expression: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: Optional[bool] = None

    model_config = ConfigDict(populate_by_name=True)


class ScheduleOut(BaseModel):
    id: str
    campaign_id: str
    schedule_type: str
    schedule_expression: str
    start_date: datetime
    end_date: Optional[datetime] = None
    is_active: bool = True
    last_run: Optional[datetime] = None
    next_run: Optional[datetime] = None
    deleted_at: Optional[datetime] = None

    model_config = ConfigDict(populate_by_name=True)


def _schedule_out(doc: NotificationSchedule) -> ScheduleOut:
    return ScheduleOut(
        id=str(doc.id),
        campaign_id=str(doc.campaign_id),
        schedule_type=doc.schedule_type,
        schedule_expression=doc.schedule_expression,
        start_date=doc.start_date,
        end_date=doc.end_date,
        is_active=doc.is_active,
        last_run=doc.last_run,
        next_run=doc.next_run,
        deleted_at=doc.deleted_at,
    )


def _require_object_id(value: str) -> None:
    if not ObjectId.is_valid(value):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule not found",
        )


@router.get("", response_model=Dict[str, Any])
async def list_schedules(
    employee: Employee = Depends(require_employee_permission(Permission.SEND_NOTIFICATIONS)),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    query: Dict[str, Any] = {"deleted_at": None}
    total = await NotificationSchedule.find(query).count()
    docs = (
        await NotificationSchedule.find(query)
        .sort("-created_at")
        .skip(skip)
        .limit(limit)
        .to_list()
    )
    return {
        "items": [_schedule_out(d) for d in docs],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.post("", response_model=ScheduleOut, status_code=status.HTTP_201_CREATED)
async def create_schedule(
    payload: ScheduleCreate,
    employee: Employee = Depends(require_employee_permission(Permission.SEND_NOTIFICATIONS)),
):
    if not ObjectId.is_valid(payload.campaign_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid campaign_id")
    campaign = await NotificationCampaign.get(ObjectId(payload.campaign_id))
    if not campaign or campaign.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Campaign not found")
    doc = NotificationSchedule(
        campaign_id=ObjectId(payload.campaign_id),
        schedule_type=payload.schedule_type,
        schedule_expression=payload.schedule_expression,
        start_date=payload.start_date,
        end_date=payload.end_date,
        is_active=payload.is_active,
    )
    await doc.insert()
    return _schedule_out(doc)


@router.get("/{schedule_id}", response_model=ScheduleOut)
async def get_schedule(
    schedule_id: str,
    employee: Employee = Depends(require_employee_permission(Permission.SEND_NOTIFICATIONS)),
):
    _require_object_id(schedule_id)
    doc = await NotificationSchedule.get(ObjectId(schedule_id))
    if not doc or doc.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found"
        )
    return _schedule_out(doc)


@router.put("/{schedule_id}", response_model=ScheduleOut)
async def update_schedule(
    schedule_id: str,
    payload: ScheduleUpdate,
    employee: Employee = Depends(require_employee_permission(Permission.SEND_NOTIFICATIONS)),
):
    _require_object_id(schedule_id)
    doc = await NotificationSchedule.get(ObjectId(schedule_id))
    if not doc or doc.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found"
        )
    update_data = payload.model_dump(exclude_unset=True)
    if "campaign_id" in update_data and update_data["campaign_id"] is not None:
        if not ObjectId.is_valid(update_data["campaign_id"]):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid campaign_id")
        update_data["campaign_id"] = ObjectId(update_data["campaign_id"])
    update_data["updated_at"] = datetime.utcnow()
    await doc.update({"$set": update_data})
    await doc.save()
    return _schedule_out(doc)


@router.delete("/{schedule_id}", status_code=status.HTTP_200_OK)
async def delete_schedule(
    schedule_id: str,
    employee: Employee = Depends(require_employee_permission(Permission.SEND_NOTIFICATIONS)),
):
    _require_object_id(schedule_id)
    doc = await NotificationSchedule.get(ObjectId(schedule_id))
    if not doc or doc.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found"
        )
    doc.deleted_at = datetime.utcnow()
    doc.deleted_by = employee.id
    doc.updated_at = datetime.utcnow()
    await doc.save()
    return {"ok": True, "id": schedule_id}
