from typing import Any, Dict, Optional
from datetime import datetime
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, ConfigDict, Field

from src.models.admin_rbac import Permission
from src.models.employee import Employee
from src.models.notification_audience import NotificationAudience
from src.core.middleware.employee_rbac import require_employee_permission

router = APIRouter()


class AudienceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    filters: Dict[str, Any] = Field(default_factory=dict)
    estimated_count: int = 0

    model_config = ConfigDict(populate_by_name=True)


class AudienceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    filters: Optional[Dict[str, Any]] = None
    estimated_count: Optional[int] = None

    model_config = ConfigDict(populate_by_name=True)


class AudienceOut(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    filters: Dict[str, Any] = Field(default_factory=dict)
    estimated_count: int = 0
    created_by: str
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    model_config = ConfigDict(populate_by_name=True)


def _audience_out(doc: NotificationAudience) -> AudienceOut:
    return AudienceOut(
        id=str(doc.id),
        name=doc.name,
        description=doc.description,
        filters=doc.filters or {},
        estimated_count=doc.estimated_count,
        created_by=str(doc.created_by),
        created_at=doc.created_at,
        updated_at=doc.updated_at,
        deleted_at=doc.deleted_at,
    )


def _require_object_id(value: str) -> None:
    if not ObjectId.is_valid(value):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audience not found",
        )


@router.get("", response_model=Dict[str, Any])
async def list_audiences(
    employee: Employee = Depends(require_employee_permission(Permission.SEND_NOTIFICATIONS)),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    query: Dict[str, Any] = {"deleted_at": None}
    total = await NotificationAudience.find(query).count()
    docs = (
        await NotificationAudience.find(query)
        .sort("-created_at")
        .skip(skip)
        .limit(limit)
        .to_list()
    )
    return {
        "items": [_audience_out(d) for d in docs],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.post("", response_model=AudienceOut, status_code=status.HTTP_201_CREATED)
async def create_audience(
    payload: AudienceCreate,
    employee: Employee = Depends(require_employee_permission(Permission.SEND_NOTIFICATIONS)),
):
    doc = NotificationAudience(
        name=payload.name,
        description=payload.description,
        filters=payload.filters,
        estimated_count=payload.estimated_count,
        created_by=employee.id,
    )
    await doc.insert()
    return _audience_out(doc)


@router.get("/{audience_id}", response_model=AudienceOut)
async def get_audience(
    audience_id: str,
    employee: Employee = Depends(require_employee_permission(Permission.SEND_NOTIFICATIONS)),
):
    _require_object_id(audience_id)
    doc = await NotificationAudience.get(ObjectId(audience_id))
    if not doc or doc.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Audience not found"
        )
    return _audience_out(doc)


@router.put("/{audience_id}", response_model=AudienceOut)
async def update_audience(
    audience_id: str,
    payload: AudienceUpdate,
    employee: Employee = Depends(require_employee_permission(Permission.SEND_NOTIFICATIONS)),
):
    _require_object_id(audience_id)
    doc = await NotificationAudience.get(ObjectId(audience_id))
    if not doc or doc.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Audience not found"
        )
    update_data = payload.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    await doc.update({"$set": update_data})
    await doc.save()
    return _audience_out(doc)


@router.delete("/{audience_id}", status_code=status.HTTP_200_OK)
async def delete_audience(
    audience_id: str,
    employee: Employee = Depends(require_employee_permission(Permission.SEND_NOTIFICATIONS)),
):
    _require_object_id(audience_id)
    doc = await NotificationAudience.get(ObjectId(audience_id))
    if not doc or doc.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Audience not found"
        )
    doc.deleted_at = datetime.utcnow()
    doc.deleted_by = employee.id
    doc.updated_at = datetime.utcnow()
    await doc.save()
    return {"ok": True, "id": audience_id}
