"""Router combinado del paquete notifications.

Expone un único router que agrega los sub-routers de cada audiencia y del módulo
padre (manager). Las rutas se registran en main.py con los prefijos adecuados.
"""

from fastapi import APIRouter

from .admin_kpis import router as admin_kpis_router
from .employee import router as employee_router
from .manager import router as manager_router
from .user import router as user_router

router = APIRouter(prefix="/notifications", tags=["Notifications"])

router.include_router(user_router)
router.include_router(employee_router)
router.include_router(manager_router)
router.include_router(admin_kpis_router)

__all__ = ["router"]
