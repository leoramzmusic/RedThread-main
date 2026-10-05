from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from src.models.profile_module import ProfileModule
from src.models.admin_rbac import Permission
from src.core.middleware.employee_rbac import (
    require_employee_permission,
    log_employee_action,
)
from src.models.employee import Employee
from src.api.auth import get_current_user
from src.models.user import User

router = APIRouter(tags=["Admin - Profile Modules"])
public_router = APIRouter(tags=["Profile Modules"])


class ModuleCreate(BaseModel):
    key: str
    nombre: str
    descripcion: str = ""
    icono: str = "tune"
    orden: int = 0
    visible: bool = True
    origen: str = "integracion"
    requiere_premium: bool = False


class ModuleUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    icono: Optional[str] = None


class VisibilidadUpdate(BaseModel):
    visible: bool


class ReordenRequest(BaseModel):
    keys: List[str]


async def _get_by_key(key: str) -> Optional[ProfileModule]:
    return await ProfileModule.find_one({"key": key})


@router.get("/")
async def list_modules(
    admin: Employee = Depends(
        require_employee_permission(Permission.VIEW_PROFILE_MODULES)
    ),
):
    """List all profile modules ordered by `orden`"""
    modules = await ProfileModule.find_all().to_list()
    return sorted(modules, key=lambda m: m.orden)


@router.post("/", status_code=201)
async def create_module(
    module_in: ModuleCreate,
    admin: Employee = Depends(
        require_employee_permission(Permission.MANAGE_PROFILE_MODULES)
    ),
):
    """Create a new profile module (integracion origin)"""
    if await _get_by_key(module_in.key):
        raise HTTPException(status_code=400, detail="Ya existe un módulo con esta key")

    module = ProfileModule(**module_in.model_dump())
    await module.insert()

    await log_employee_action(
        employee_id=str(admin.id),
        action_type="create_profile_module",
        description=f"Created profile module {module.key}",
        target_type="profile_module",
        target_id=str(module.id),
    )

    return module


@router.patch("/{key}")
async def update_module(
    key: str,
    module_in: ModuleUpdate,
    admin: Employee = Depends(
        require_employee_permission(Permission.MANAGE_PROFILE_MODULES)
    ),
):
    """Edit nombre/descripcion/icono of a profile module"""
    module = await _get_by_key(key)
    if not module:
        raise HTTPException(status_code=404, detail="Módulo no encontrado")

    for field, value in module_in.model_dump(exclude_unset=True).items():
        setattr(module, field, value)
    module.updated_at = datetime.utcnow()
    await module.save()

    await log_employee_action(
        employee_id=str(admin.id),
        action_type="update_profile_module",
        description=f"Updated profile module {module.key}",
        target_type="profile_module",
        target_id=str(module.id),
    )

    return module


@router.patch("/{key}/visibilidad")
async def update_visibilidad(
    key: str,
    body: VisibilidadUpdate,
    admin: Employee = Depends(
        require_employee_permission(Permission.MANAGE_VISIBILITY_MODULES)
    ),
):
    """Toggle visibility; at least one core visible module must remain; trigger profile recalculation"""
    module = await _get_by_key(key)
    if not module:
        raise HTTPException(status_code=404, detail="Módulo no encontrado")

    if module.origen == "core" and module.visible and not body.visible:
        remaining = await ProfileModule.find(
            {"origen": "core", "visible": True}
        ).to_list()
        remaining = [m for m in remaining if m.key != key]
        if not remaining:
            raise HTTPException(
                status_code=400,
                detail="Debe existir al menos un módulo core visible",
            )

    module.visible = body.visible
    module.updated_at = datetime.utcnow()
    await module.save()

    await log_employee_action(
        employee_id=str(admin.id),
        action_type="update_profile_module_visibility",
        description=f"Set visibility of {module.key} to {body.visible}",
        target_type="profile_module",
        target_id=str(module.id),
    )

    # Trigger profile completion recalculation for all profiles
    # This ensures the completion percentage reflects the new hidden modules immediately
    from src.api.profiles import calculate_profile_completion
    from src.models.profile import Profile

    try:
        hidden_modules = await ProfileModule.find({"visible": False}).to_list()
        hidden_keys = [m.key for m in hidden_modules]

        # Recalculate completion for all profiles
        profiles = await Profile.find_all().to_list()
        for profile in profiles:
            new_completion = calculate_profile_completion(
                profile,
                hidden_sections=hidden_keys,
                music_fallback=get_spotify_fallback_status(),
            )
            if profile.profile_completion != new_completion:
                profile.profile_completion = new_completion
                await profile.save()
    except Exception as e:
        # Log error but don't fail the visibility toggle
        print(f"Profile recalculation error: {e}")

    return module


def get_spotify_fallback_status() -> bool:
    """Check if Spotify fallback_complete is enabled in config"""
    try:
        from src.models.integration_config import IntegrationConfig
        cfg = IntegrationConfig.find_one()
        return bool(cfg and cfg.fallback_complete) if cfg else False
    except Exception:
        return False


@router.put("/reorden")
async def reorder_modules(
    body: ReordenRequest,
    admin: Employee = Depends(
        require_employee_permission(Permission.MANAGE_VISIBILITY_MODULES)
    ),
):
    """Persist module order from an ordered list of keys"""
    if len(set(body.keys)) != len(body.keys):
        raise HTTPException(
            status_code=400, detail="Claves duplicadas en el orden"
        )
    modules = []
    for key in body.keys:
        module = await _get_by_key(key)
        if not module:
            raise HTTPException(
                status_code=400, detail=f"Módulo no encontrado: {key}"
            )
        modules.append(module)

    for index, module in enumerate(modules):
        module.orden = index
        module.updated_at = datetime.utcnow()
        await module.save()

    await log_employee_action(
        employee_id=str(admin.id),
        action_type="reorder_profile_modules",
        description=f"Reordered profile modules: {body.keys}",
        target_type="profile_module",
    )

    return modules


@router.delete("/{key}")
async def delete_module(
    key: str,
    admin: Employee = Depends(
        require_employee_permission(Permission.MANAGE_PROFILE_MODULES)
    ),
):
    """Delete a profile module (only `integracion` origin)"""
    module = await _get_by_key(key)
    if not module:
        raise HTTPException(status_code=404, detail="Módulo no encontrado")

    if module.origen != "integracion":
        raise HTTPException(
            status_code=400, detail="Solo se pueden eliminar módulos de integración"
        )

    await module.delete()

    await log_employee_action(
        employee_id=str(admin.id),
        action_type="delete_profile_module",
        description=f"Deleted profile module {module.key}",
        target_type="profile_module",
        target_id=key,
    )

    return {"status": "success"}


@public_router.get("/")
async def list_public_modules(current_user: User = Depends(get_current_user)):
    """List visible profile modules ordered by `orden` (authenticated users)"""
    modules = await ProfileModule.find({"visible": True}).to_list()
    return sorted(modules, key=lambda m: m.orden)


@public_router.get("/hidden")
async def list_hidden_modules(current_user: User = Depends(get_current_user)):
    """Keys ocultas (incluye sub-módulos): scoring y visibilidad granular."""
    modules = await ProfileModule.find({"visible": False}).to_list()
    return {"hidden": [m.key for m in modules]}
