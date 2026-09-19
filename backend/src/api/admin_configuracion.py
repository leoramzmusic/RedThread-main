from fastapi import APIRouter, Depends, HTTPException, status, Body
from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel
from src.models.system_options import SystemOption
from src.models.admin_rbac import AdminUser, Permission
from src.core.middleware.employee_rbac import require_employee_permission, log_employee_action
from src.api.auth import get_current_user
from src.core.config import settings


router = APIRouter()


class SystemSettingUpdate(BaseModel):
    category: str
    key: str
    value: Any
    description: Optional[str] = None


@router.get("/ajustes")
async def get_system_settings(
    admin_user: AdminUser = Depends(require_employee_permission(Permission.VIEW_CONFIG))
) -> Dict[str, Any]:
    """Get system configuration - Admin only"""
    
    # Get all system options
    options = await SystemOption.find_all().to_list()
    
    # Group by category
    settings_map = {}
    for opt in options:
        if opt.category not in settings_map:
            settings_map[opt.category] = []
        
        settings_map[opt.category].append({
            "id": str(opt.id),
            "value": opt.value,
            "label": opt.label,
            "is_active": opt.is_active
        })
    
    # Add environment config (read-only)
    env_config = {
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "debug": settings.DEBUG,
        "cors_origins": settings.CORS_ORIGINS
    }
    
    return {
        "system_options": settings_map,
        "environment": env_config
    }


@router.post("/ajustes/opcion")
async def create_system_option(
    option_data: Dict[str, Any],
    admin_user: AdminUser = Depends(require_employee_permission(Permission.EDIT_CONFIG))
) -> Dict[str, Any]:
    """Create new system option - Admin only"""
    
    # Check if exists
    existing = await SystemOption.find_one({
        "category": option_data["category"],
        "value": option_data["value"]
    })
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Option already exists"
        )
    
    option = SystemOption(
        category=option_data["category"],
        value=option_data["value"],
        label=option_data.get("label", option_data["value"]),
        is_active=True
    )
    await option.insert()
    
    # Log admin action
    await log_employee_action(
        employee_id=admin_user.user_id,
        action_type="create_system_option",
        description=f"Created system option: {option.category}/{option.value}",
        target_type="system_option",
        target_id=str(option.id)
    )
    
    return {"message": "Option created successfully", "id": str(option.id)}


@router.put("/ajustes/opcion/{option_id}")
async def update_system_option(
    option_id: str,
    update_data: Dict[str, Any],
    admin_user: AdminUser = Depends(require_employee_permission(Permission.EDIT_CONFIG))
) -> Dict[str, Any]:
    """Update system option - Admin only"""
    
    option = await SystemOption.get(option_id)
    if not option:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Option not found"
        )
    
    if "label" in update_data:
        option.label = update_data["label"]
    if "is_active" in update_data:
        option.is_active = update_data["is_active"]
        
    await option.save()
    
    # Log admin action
    await log_employee_action(
        employee_id=admin_user.user_id,
        action_type="update_system_option",
        description=f"Updated system option: {option.category}/{option.value}",
        target_type="system_option",
        target_id=option_id
    )
    
    return {"message": "Option updated successfully"}


@router.get("/feature-flags")
async def get_feature_flags(
    admin_user: AdminUser = Depends(require_employee_permission(Permission.VIEW_CONFIG))
) -> List[Dict[str, Any]]:
    """Get feature flags - Admin only"""
    
    # In a real system, these might be in a separate collection or service
    # For now, we'll use SystemOption with category "feature_flag"
    flags = await SystemOption.find(SystemOption.category == "feature_flag").to_list()
    
    return [
        {
            "id": str(f.id),
            "key": f.value,
            "name": f.label,
            "enabled": f.is_active
        }
        for f in flags
    ]


@router.post("/feature-flags/{flag_key}/toggle")
async def toggle_feature_flag(
    flag_key: str,
    enabled: bool = Body(..., embed=True),
    admin_user: AdminUser = Depends(require_employee_permission(Permission.MANAGE_INTEGRATIONS))
) -> Dict[str, Any]:
    """Toggle feature flag - Admin only"""
    
    flag = await SystemOption.find_one({
        "category": "feature_flag",
        "value": flag_key
    })
    
    if not flag:
        # Create if doesn't exist
        flag = SystemOption(
            category="feature_flag",
            value=flag_key,
            label=flag_key.replace("_", " ").title(),
            is_active=enabled
        )
        await flag.insert()
    else:
        flag.is_active = enabled
        await flag.save()
    
    # Log admin action
    await log_employee_action(
        employee_id=admin_user.user_id,
        action_type="toggle_feature_flag",
        description=f"Toggled feature flag {flag_key} to {enabled}",
        target_type="feature_flag",
        target_id=str(flag.id),
        metadata={"enabled": enabled}
    )
    
    return {"message": f"Feature flag {flag_key} is now {'enabled' if enabled else 'disabled'}"}

