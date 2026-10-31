"""APIs de notificaciones para empleados del portal de administración.

Mueve la ruta de notificación de sistema para empleados (post_system_notification
con require_employee_permission) que previamente vivía en
backend/src/api/notifications.py.

Toda la lógica de negocio reside en backend/src/services/notification_service.py;
esta capa solo valida, autoriza y llama al servicio.
"""

from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, status

from src.api.auth import get_current_user
from src.core.middleware.employee_rbac import require_employee_permission
from src.models.admin_rbac import Permission
from src.models.user import User
from src.services import notification_service as ns
from src.services.connection_manager import manager

from .base import SystemNotificationRequest, _fan_out_system, _validate_notification_id

router = APIRouter(tags=["Notifications - Employees"])


@router.post("/system")
async def post_system_notification_employee(
    payload: SystemNotificationRequest,
    employee=Depends(require_employee_permission(Permission.EDIT_USERS)),
):
    return {
        "created": await _fan_out_system(
            payload.audience,
            payload.content,
            payload.type,
            payload.target_url,
            bool((payload.metadata or {}).get("important")),
        )
    }
