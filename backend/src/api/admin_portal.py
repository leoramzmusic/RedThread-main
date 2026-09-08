from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from src.models.user import User
from src.api.auth import get_current_user


router = APIRouter()


@router.get("/")
async def admin_portal_home(current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    """Admin portal home - Overview dashboard"""
    
    # TODO: Add admin role verification
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="Admin access required")
    
    return {
        "message": "Admin Portal - Red Thread",
        "version": "1.0.0",
        "modules": [
            {"name": "eventos", "path": "/portal-redthread/eventos", "description": "Event management"},
            {"name": "empleados", "path": "/portal-redthread/empleados", "description": "Employee management"},
            {"name": "metricas", "path": "/portal-redthread/metricas", "description": "Metrics and analytics"},
            {"name": "denuncias", "path": "/portal-redthread/denuncias", "description": "Reports and moderation"},
            {"name": "usuarios", "path": "/portal-redthread/usuarios", "description": "User management"}
        ]
    }

