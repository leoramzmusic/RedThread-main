from typing import Any, Dict, List, Optional
from datetime import datetime
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, ConfigDict

from src.models.admin_rbac import Permission
from src.models.employee import Employee
from src.models.notification_template import NotificationTemplate
from src.models.notification_audience import NotificationAudience
from src.models.notification_campaign import NotificationCampaign
from src.models.notification_schedule import NotificationSchedule
from src.core.middleware.employee_rbac import require_employee_permission

router = APIRouter()

_TRASH_MODELS = {
    "template": NotificationTemplate,
    "audience": NotificationAudience,
    "campaign": NotificationCampaign,
    "schedule": NotificationSchedule,
}


class TrashItem(BaseModel):
    id: str
    type: str
    name: Optional[str] = None
    title: Optional[str] = None
    deleted_at: Optional[datetime] = None
    deleted_by: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(populate_by_name=True)


def _get_model(item_type: str):
    model = _TRASH_MODELS.get(item_type)
    if model is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid type. Allowed: {', '.join(_TRASH_MODELS)}",
        )
    return model


def _require_object_id(value: str) -> None:
    if not ObjectId.is_valid(value):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found",
        )


def _trash_item(item_type: str, doc) -> TrashItem:
    return TrashItem(
        id=str(doc.id),
        type=item_type,
        name=getattr(doc, "name", None),
        title=getattr(doc, "title", None),
        deleted_at=doc.deleted_at,
        deleted_by=str(doc.deleted_by) if doc.deleted_by else None,
        created_at=doc.created_at,
    )


@router.get("", response_model=Dict[str, Any])
async def list_trash(
    employee: Employee = Depends(require_employee_permission(Permission.SEND_NOTIFICATIONS)),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    type: Optional[str] = Query(None),
):
    types = [type] if type else list(_TRASH_MODELS.keys())
    for t in types:
        _get_model(t)
    items: List[TrashItem] = []
    total = 0
    for item_type in types:
        model = _get_model(item_type)
        query = {"deleted_at": {"$ne": None}}
        total += await model.find(query).count()
        docs = (
            await model.find(query)
            .sort("-deleted_at")
            .skip(skip)
            .limit(limit)
            .to_list()
        )
        items.extend([_trash_item(item_type, d) for d in docs])
    items.sort(key=lambda x: x.deleted_at or x.created_at, reverse=True)
    items = items[skip : skip + limit]
    return {
        "items": [item.model_dump() for item in items],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.post("/{item_id}/restore", status_code=status.HTTP_200_OK)
async def restore_item(
    item_id: str,
    employee: Employee = Depends(require_employee_permission(Permission.SEND_NOTIFICATIONS)),
    type: str = Query(..., description="Tipo del elemento: template, audience, campaign, schedule"),
):
    _require_object_id(item_id)
    model = _get_model(type)
    doc = await model.get(ObjectId(item_id))
    if not doc or doc.deleted_at is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Item not found in trash"
        )
    doc.deleted_at = None
    doc.deleted_by = None
    doc.updated_at = datetime.utcnow()
    await doc.save()
    return {"ok": True, "id": item_id, "type": type, "restored": True}


@router.delete("/{item_id}", status_code=status.HTTP_200_OK)
async def delete_item_permanently(
    item_id: str,
    employee: Employee = Depends(require_employee_permission(Permission.SEND_NOTIFICATIONS)),
    type: str = Query(..., description="Tipo del elemento: template, audience, campaign, schedule"),
):
    _require_object_id(item_id)
    model = _get_model(type)
    doc = await model.get(ObjectId(item_id))
    if not doc or doc.deleted_at is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Item not found in trash"
        )
    await doc.delete()
    return {"ok": True, "id": item_id, "type": type, "deleted_permanently": True}
