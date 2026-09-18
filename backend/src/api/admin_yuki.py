from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Body
from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel
from src.models.yuki_config import YukiConfig, YukiSkin, YukiAppearanceRule
from src.models.employee import Employee
from src.models.admin_rbac import Permission
from src.core.middleware.employee_rbac import require_employee_permission, require_any_employee_permission
from src.core.config import settings
import os
import uuid

router = APIRouter()

UPLOAD_DIR = "static/uploads/yuki"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".svg", ".json"}
ALLOWED_MIME_TYPES = {"image/png", "image/jpeg", "image/webp", "image/svg+xml", "application/json"}


class YukiConfigUpdate(BaseModel):
    environment: Optional[str] = None
    yarn_color: Optional[str] = None
    yuki_style: Optional[str] = None
    custom_skin_id: Optional[str] = None
    animation_speed: Optional[float] = None
    idle_animation: Optional[str] = None
    loading_animation: Optional[str] = None
    success_animation: Optional[str] = None
    error_animation: Optional[str] = None
    enable_loader: Optional[bool] = None
    enable_onboarding: Optional[bool] = None
    enable_notifications: Optional[bool] = None
    enable_error_pages: Optional[bool] = None
    enable_easter_eggs: Optional[bool] = None
    enabled: Optional[bool] = None
    allowed_screens: Optional[List[str]] = None
    blocked_screens: Optional[List[str]] = None


class YukiSkinCreate(BaseModel):
    name: str
    unlocked_by: Optional[str] = None


class YukiRuleCreate(BaseModel):
    condition: str
    action: str
    value: Optional[str] = None
    priority: int = 0


def _config_to_dict(config: YukiConfig) -> Dict[str, Any]:
    return {
        "id": str(config.id),
        "environment": config.environment,
        "yarn_color": config.yarn_color,
        "yuki_style": config.yuki_style,
        "custom_skin_id": config.custom_skin_id,
        "animation_speed": config.animation_speed,
        "idle_animation": config.idle_animation,
        "loading_animation": config.loading_animation,
        "success_animation": config.success_animation,
        "error_animation": config.error_animation,
        "enable_loader": config.enable_loader,
        "enable_onboarding": config.enable_onboarding,
        "enable_notifications": config.enable_notifications,
        "enable_error_pages": config.enable_error_pages,
        "enable_easter_eggs": config.enable_easter_eggs,
        "enabled": config.enabled,
        "allowed_screens": config.allowed_screens,
        "blocked_screens": config.blocked_screens,
        "updated_by": config.updated_by,
        "created_at": config.created_at.isoformat() if config.created_at else None,
        "updated_at": config.updated_at.isoformat() if config.updated_at else None,
    }


# ─── Config Endpoints ─────────────────────────────────────────────

@router.get("/config")
async def get_yuki_config(
    env: Optional[str] = None,
) -> Dict[str, Any]:
    """Get Yuki config (public endpoint for frontend consumption)"""
    query = {}
    if env:
        query["environment"] = env

    config = await YukiConfig.find_one(query)
    if not config:
        # Return defaults
        config = YukiConfig()
        await config.insert()
    return _config_to_dict(config)


@router.put("/config")
async def update_yuki_config(
    update: YukiConfigUpdate,
    employee: Employee = Depends(require_employee_permission(Permission.EDIT_CONFIG)),
) -> Dict[str, Any]:
    """Update Yuki config (admin only)"""
    config = await YukiConfig.find_one({})
    if not config:
        config = YukiConfig()

    update_data = update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(config, field, value)
    config.updated_at = datetime.utcnow()
    config.updated_by = employee.user_id
    await config.save()

    return {"message": "Config updated", "config": _config_to_dict(config)}


@router.get("/config/history")
async def get_config_history(
    employee: Employee = Depends(require_employee_permission(Permission.EDIT_CONFIG)),
) -> List[Dict[str, Any]]:
    """Get config change history"""
    # For now return the single config's update history
    config = await YukiConfig.find_one({})
    if not config:
        return []
    return [{
        "updated_by": config.updated_by,
        "updated_at": config.updated_at.isoformat() if config.updated_at else None,
        "environment": config.environment,
    }]


# ─── Skins Endpoints ──────────────────────────────────────────────

@router.get("/skins")
async def list_skins(
    employee: Employee = Depends(require_employee_permission(Permission.EDIT_CONFIG)),
) -> List[Dict[str, Any]]:
    """List all Yuki skins"""
    skins = await YukiSkin.find_all().to_list()
    return [
        {
            "id": str(s.id),
            "name": s.name,
            "image_url": s.image_url,
            "unlocked_by": s.unlocked_by,
            "is_active": s.is_active,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        }
        for s in skins
    ]


@router.post("/skins")
async def create_skin(
    skin_data: YukiSkinCreate,
    file: UploadFile = File(...),
    employee: Employee = Depends(require_employee_permission(Permission.EDIT_CONFIG)),
) -> Dict[str, Any]:
    """Upload a new Yuki skin"""
    file_ext = os.path.splitext(file.filename or "")[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="File extension not allowed")

    filename = f"skin_{uuid.uuid4().hex}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    skin = YukiSkin(
        name=skin_data.name,
        image_url=f"/static/uploads/yuki/{filename}",
        unlocked_by=skin_data.unlocked_by,
    )
    await skin.insert()

    return {
        "message": "Skin created",
        "id": str(skin.id),
        "image_url": skin.image_url,
    }


@router.delete("/skins/{skin_id}")
async def delete_skin(
    skin_id: str,
    employee: Employee = Depends(require_employee_permission(Permission.EDIT_CONFIG)),
):
    """Delete a Yuki skin"""
    skin = await YukiSkin.get(skin_id)
    if not skin:
        raise HTTPException(status_code=404, detail="Skin not found")
    await skin.delete()
    return {"message": "Skin deleted"}


# ─── Rules Endpoints ──────────────────────────────────────────────

@router.get("/rules")
async def list_rules(
    employee: Employee = Depends(require_employee_permission(Permission.EDIT_CONFIG)),
) -> List[Dict[str, Any]]:
    """List all appearance rules"""
    rules = await YukiAppearanceRule.find_all().sort([("priority", -1)]).to_list()
    return [
        {
            "id": str(r.id),
            "condition": r.condition,
            "action": r.action,
            "value": r.value,
            "priority": r.priority,
            "is_active": r.is_active,
        }
        for r in rules
    ]


@router.post("/rules")
async def create_rule(
    rule_data: YukiRuleCreate,
    employee: Employee = Depends(require_employee_permission(Permission.EDIT_CONFIG)),
) -> Dict[str, Any]:
    """Create a new appearance rule"""
    rule = YukiAppearanceRule(
        condition=rule_data.condition,
        action=rule_data.action,
        value=rule_data.value,
        priority=rule_data.priority,
    )
    await rule.insert()
    return {"message": "Rule created", "id": str(rule.id)}


@router.put("/rules/{rule_id}")
async def update_rule(
    rule_id: str,
    update_data: Dict[str, Any],
    employee: Employee = Depends(require_employee_permission(Permission.EDIT_CONFIG)),
):
    """Update an appearance rule"""
    rule = await YukiAppearanceRule.get(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    for field in ["condition", "action", "value", "priority", "is_active"]:
        if field in update_data:
            setattr(rule, field, update_data[field])
    await rule.save()
    return {"message": "Rule updated"}


@router.delete("/rules/{rule_id}")
async def delete_rule(
    rule_id: str,
    employee: Employee = Depends(require_employee_permission(Permission.EDIT_CONFIG)),
):
    """Delete an appearance rule"""
    rule = await YukiAppearanceRule.get(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    await rule.delete()
    return {"message": "Rule deleted"}


# ─── Assets Upload ────────────────────────────────────────────────

@router.post("/assets")
async def upload_asset(
    file: UploadFile = File(...),
    employee: Employee = Depends(require_employee_permission(Permission.EDIT_CONFIG)),
) -> Dict[str, Any]:
    """Upload a Yuki asset (SVG, PNG, Lottie JSON)"""
    file_ext = os.path.splitext(file.filename or "")[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="File extension not allowed")

    filename = f"asset_{uuid.uuid4().hex}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    asset_type = "lottie" if file_ext == ".json" else "image"

    return {
        "id": filename,
        "filename": filename,
        "original_name": file.filename,
        "url": f"/static/uploads/yuki/{filename}",
        "type": asset_type,
        "size": len(content),
    }


@router.get("/assets")
async def list_assets(
    employee: Employee = Depends(require_employee_permission(Permission.EDIT_CONFIG)),
) -> List[Dict[str, Any]]:
    """List all uploaded Yuki assets"""
    assets = []
    if os.path.exists(UPLOAD_DIR):
        for fname in os.listdir(UPLOAD_DIR):
            fpath = os.path.join(UPLOAD_DIR, fname)
            if os.path.isfile(fpath):
                ext = os.path.splitext(fname)[1].lower()
                assets.append({
                    "id": fname,
                    "filename": fname,
                    "url": f"/static/uploads/yuki/{fname}",
                    "type": "lottie" if ext == ".json" else "image",
                    "size": os.path.getsize(fpath),
                })
    return assets


@router.delete("/assets/{asset_id}")
async def delete_asset(
    asset_id: str,
    employee: Employee = Depends(require_employee_permission(Permission.EDIT_CONFIG)),
):
    """Delete a Yuki asset"""
    file_path = os.path.join(UPLOAD_DIR, asset_id)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Asset not found")
    os.remove(file_path)
    return {"message": "Asset deleted"}
