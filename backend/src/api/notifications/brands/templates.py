from typing import Any, Dict, List, Optional
from datetime import datetime
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, ConfigDict, Field

from src.models.admin_rbac import Permission
from src.models.employee import Employee
from src.models.notification_template import NotificationTemplate
from src.core.middleware.employee_rbac import require_employee_permission

router = APIRouter()


class TemplateVariable(BaseModel):
    name: str
    type: str


class TemplateCreate(BaseModel):
    title: str
    body: str
    icon: str
    icon_type: str = "system_icon"  # "system_icon" | "dynamic_avatar"
    action_url: Optional[str] = None
    category: str
    priority: str = "P2"
    required_action: bool = False
    critical: bool = False
    variables: List[TemplateVariable] = Field(default_factory=list)
    color: Optional[str] = None
    channels: List[str] = Field(default_factory=lambda: ["push", "panel"])
    action_type: Optional[str] = None
    action_destination: Optional[str] = None
    persistent: bool = False
    programmable: bool = False
    silencable: bool = False
    destinatarios: List[str] = Field(default_factory=lambda: ["usuarios"])  # usuarios, empleados, marcas
    evento_disparador: Optional[str] = None  # like_received, match_created, new_message, etc.
    uso_principal: Optional[str] = None  # portal_usuarios | portal_empleados | portal_marcas | global

    model_config = ConfigDict(populate_by_name=True)


class TemplateUpdate(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    icon: Optional[str] = None
    icon_type: Optional[str] = None
    action_url: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    required_action: Optional[bool] = None
    critical: Optional[bool] = None
    variables: Optional[List[TemplateVariable]] = None
    color: Optional[str] = None
    channels: Optional[List[str]] = None
    action_type: Optional[str] = None
    action_destination: Optional[str] = None
    persistent: Optional[bool] = None
    programmable: Optional[bool] = None
    silencable: Optional[bool] = None
    destinatarios: Optional[List[str]] = None
    evento_disparador: Optional[str] = None
    uso_principal: Optional[str] = None


class TemplateOut(BaseModel):
    id: str
    title: str
    body: str
    icon: str
    icon_type: str
    action_url: Optional[str] = None
    category: str
    priority: str
    required_action: bool
    critical: bool
    variables: List[TemplateVariable] = Field(default_factory=list)
    color: Optional[str] = None
    channels: List[str] = Field(default_factory=list)
    action_type: Optional[str] = None
    action_destination: Optional[str] = None
    persistent: bool
    programmable: bool
    silencable: bool
    destinatarios: List[str]
    evento_disparador: Optional[str] = None
    uso_principal: Optional[str] = None
    created_by: str
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    model_config = ConfigDict(populate_by_name=True)


def _template_out(doc: NotificationTemplate) -> TemplateOut:
    return TemplateOut(
        id=str(doc.id),
        title=doc.title,
        body=doc.body,
        icon=doc.icon,
        icon_type=doc.icon_type,
        action_url=doc.action_url,
        category=doc.category,
        priority=doc.priority,
        required_action=doc.required_action,
        critical=doc.critical,
        variables=[TemplateVariable(name=v.get("name", ""), type=v.get("type", "string")) for v in (doc.variables or [])],
        color=doc.color,
        channels=doc.channels or [],
        action_type=doc.action_type,
        action_destination=doc.action_destination,
        persistent=doc.persistent,
        programmable=doc.programmable,
        silencable=doc.silencable,
        destinatarios=doc.destinatarios or ["usuarios"],
        evento_disparador=doc.evento_disparador,
        uso_principal=doc.uso_principal,
        created_by=str(doc.created_by),
        created_at=doc.created_at,
        updated_at=doc.updated_at,
        deleted_at=doc.deleted_at,
    )


def _require_object_id(value: str) -> None:
    if not ObjectId.is_valid(value):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found",
        )


@router.get("", response_model=Dict[str, Any])
async def list_templates(
    employee: Employee = Depends(require_employee_permission(Permission.SEND_NOTIFICATIONS)),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    query: Dict[str, Any] = {"deleted_at": None}
    total = await NotificationTemplate.find(query).count()
    docs = (
        await NotificationTemplate.find(query)
        .sort("-created_at")
        .skip(skip)
        .limit(limit)
        .to_list()
    )
    return {
        "items": [_template_out(d) for d in docs],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.post("", response_model=TemplateOut, status_code=status.HTTP_201_CREATED)
async def create_template(
    payload: TemplateCreate,
    employee: Employee = Depends(require_employee_permission(Permission.SEND_NOTIFICATIONS)),
):
    doc = NotificationTemplate(
        title=payload.title,
        body=payload.body,
        icon=payload.icon,
        icon_type=payload.icon_type,
        action_url=payload.action_url,
        category=payload.category,
        priority=payload.priority,
        required_action=payload.required_action,
        critical=payload.critical,
        variables=[v.model_dump() for v in payload.variables],
        color=payload.color,
        channels=payload.channels,
        action_type=payload.action_type,
        action_destination=payload.action_destination,
        persistent=payload.persistent,
        programmable=payload.programmable,
        silencable=payload.silencable,
        destinatarios=payload.destinatarios,
        evento_disparador=payload.evento_disparador,
        created_by=employee.id,
    )
    await doc.insert()
    return _template_out(doc)


@router.post("/seed-defaults", status_code=status.HTTP_200_OK)
async def seed_default_templates(
    employee: Employee = Depends(require_employee_permission(Permission.SEND_NOTIFICATIONS)),
):
    from src.core.seed import ensure_notification_templates_seeded

    created = await ensure_notification_templates_seeded()
    return {"ok": True, "created": created}


@router.get("/{template_id}", response_model=TemplateOut)
async def get_template(
    template_id: str,
    employee: Employee = Depends(require_employee_permission(Permission.SEND_NOTIFICATIONS)),
):
    _require_object_id(template_id)
    doc = await NotificationTemplate.get(ObjectId(template_id))
    if not doc or doc.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Template not found"
        )
    return _template_out(doc)


@router.put("/{template_id}", response_model=TemplateOut)
async def update_template(
    template_id: str,
    payload: TemplateUpdate,
    employee: Employee = Depends(require_employee_permission(Permission.SEND_NOTIFICATIONS)),
):
    _require_object_id(template_id)
    doc = await NotificationTemplate.get(ObjectId(template_id))
    if not doc or doc.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Template not found"
        )
    update_data = payload.model_dump(exclude_unset=True)
    if "variables" in update_data and update_data["variables"] is not None:
        update_data["variables"] = [v.model_dump() for v in update_data["variables"]]
    update_data["updated_at"] = datetime.utcnow()
    await doc.update({"$set": update_data})
    await doc.save()
    return _template_out(doc)


@router.delete("/{template_id}", status_code=status.HTTP_200_OK)
async def delete_template(
    template_id: str,
    employee: Employee = Depends(require_employee_permission(Permission.SEND_NOTIFICATIONS)),
):
    _require_object_id(template_id)
    doc = await NotificationTemplate.get(ObjectId(template_id))
    if not doc or doc.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Template not found"
        )
    doc.deleted_at = datetime.utcnow()
    doc.deleted_by = employee.id
    doc.updated_at = datetime.utcnow()
    await doc.save()
    return {"ok": True, "id": template_id}
