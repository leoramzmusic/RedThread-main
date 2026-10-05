from datetime import datetime
from pathlib import Path
from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from src.models.profile_tip import ProfileTip, TipTranslation, Slide
from src.models.admin_rbac import Permission
from src.core.middleware.employee_rbac import require_employee_permission, log_employee_action
from src.models.employee import Employee
from src.api.auth import get_current_user
from src.models.user import User

router = APIRouter(tags=["Admin - Profile Tips"])
public_router = APIRouter(tags=["Profile Tips"])

class TipUpsert(BaseModel):
    tip_key: Optional[str] = None
    type: Optional[str] = None
    section_key: Optional[str] = None
    translations: Optional[dict] = None
    slides: Optional[list] = None
    is_active: Optional[bool] = None
    order: Optional[int] = None

async def _get_by_key(tip_key: str) -> Optional[ProfileTip]:
    return await ProfileTip.find_one({"tip_key": tip_key})

@router.get("/")
async def list_tips(admin: Employee = Depends(require_employee_permission(Permission.VIEW_PROFILE_TIPS))):
    tips = await ProfileTip.find_all().to_list()
    return sorted(tips, key=lambda t: t.order)

@router.post("/", status_code=201)
async def create_tip(body: TipUpsert, admin: Employee = Depends(require_employee_permission(Permission.MANAGE_PROFILE_TIPS))):
    if not body.tip_key:
        raise HTTPException(status_code=400, detail="tip_key requerido")
    if await _get_by_key(body.tip_key):
        raise HTTPException(status_code=400, detail="Ya existe un tip con esta key")
    tip = ProfileTip(tip_key=body.tip_key, type=body.type or "drawer", section_key=body.section_key or "", translations=body.translations or {}, slides=body.slides or [], is_active=True if body.is_active is None else body.is_active, order=body.order or 0)
    await tip.insert()
    await log_employee_action(employee_id=str(admin.id), action_type="create_profile_tip", description=f"Created tip {tip.tip_key}", target_type="profile_tip", target_id=str(tip.id))
    return tip

@router.put("/reorder")
async def reorder_tips(body: dict, admin: Employee = Depends(require_employee_permission(Permission.MANAGE_PROFILE_TIPS))):
    keys = body.get("keys", [])
    for index, key in enumerate(keys):
        tip = await _get_by_key(key)
        if tip:
            tip.order = index
            tip.updated_at = datetime.utcnow()
            await tip.save()
    return {"status": "success"}

@router.patch("/{tip_key}")
async def update_tip(tip_key: str, body: TipUpsert, admin: Employee = Depends(require_employee_permission(Permission.EDIT_PROFILE_TIPS))):
    tip = await _get_by_key(tip_key)
    if not tip:
        raise HTTPException(status_code=404, detail="Tip no encontrado")
    for field, value in body.model_dump(exclude_unset=True).items():
        if field == "tip_key":
            continue
        setattr(tip, field, value)
    tip.updated_at = datetime.utcnow()
    await tip.save()
    return tip

@router.delete("/{tip_key}")
async def delete_tip(tip_key: str, admin: Employee = Depends(require_employee_permission(Permission.MANAGE_PROFILE_TIPS))):
    tip = await _get_by_key(tip_key)
    if not tip:
        raise HTTPException(status_code=404, detail="Tip no encontrado")
    await tip.delete()
    return {"status": "success"}

TIPS_UPLOAD_DIR = Path("static/tips")
TIPS_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_TIP_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg", "image/gif"}
MAX_TIP_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/{tip_key}/images")
async def upload_tip_image(
    tip_key: str,
    file: UploadFile = File(...),
    admin: Employee = Depends(require_employee_permission(Permission.EDIT_PROFILE_TIPS)),
):
    tip = await _get_by_key(tip_key)
    if not tip:
        raise HTTPException(status_code=404, detail="Tip no encontrado")
    if file.content_type not in ALLOWED_TIP_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Tipo de archivo inválido. Permitidos: JPEG, PNG, WebP, GIF")
    contents = await file.read()
    if len(contents) > MAX_TIP_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail="Archivo demasiado grande. Máximo 10MB")
    ext = (file.filename or "jpg").split(".")[-1].lower()
    if ext not in {"jpg", "jpeg", "png", "webp", "gif"}:
        ext = "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    file_path = TIPS_UPLOAD_DIR / filename
    with open(file_path, "wb") as f:
        f.write(contents)
    url = f"/static/tips/{filename}"
    await log_employee_action(employee_id=str(admin.id), action_type="upload_profile_tip_image", description=f"Uploaded image for tip {tip_key}", target_type="profile_tip", target_id=str(tip.id))
    return {"url": url}

@public_router.get("/{tip_key}")
async def get_public_tip(tip_key: str, current_user: User = Depends(get_current_user)):
    tip = await _get_by_key(tip_key)
    if not tip or not tip.is_active:
        raise HTTPException(status_code=404, detail="Tip no encontrado")
    lang = getattr(current_user, "preferred_language", "es") or "es"
    tr = (tip.translations or {}).get(lang) or (tip.translations or {}).get("es") or {}
    return {"tip_key": tip.tip_key, "type": tip.type, "section_key": tip.section_key, "translation": tr, "translations": tip.translations, "slides": tip.slides}
