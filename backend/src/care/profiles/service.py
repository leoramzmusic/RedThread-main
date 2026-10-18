"""Named CARE formula profiles: CRUD over the `care_profiles` collection."""
from datetime import datetime
from typing import Any, Dict, List, Optional

from beanie import PydanticObjectId

from src.care.formula.service import FormulaValidationError, validate_formula_dict
from src.care.models.care_profile import CAREProfile

_NAME_MIN, _NAME_MAX = 1, 60


class ProfileNameError(ValueError):
    """Invalid (missing / empty / too long) profile name."""


class ProfileDuplicateError(ValueError):
    """Another profile already uses the requested name."""


def _clean_name(name: Any) -> str:
    if not isinstance(name, str):
        raise ProfileNameError("El nombre es requerido.")
    cleaned = name.strip()
    if not (_NAME_MIN <= len(cleaned) <= _NAME_MAX):
        raise ProfileNameError("El nombre debe tener entre 1 y 60 caracteres.")
    return cleaned


def _validate_payload(blocks: Any, chaos_factor: Any) -> None:
    errors = validate_formula_dict({"blocks": blocks, "chaos_factor": chaos_factor})
    if errors:
        raise FormulaValidationError(errors)


def _object_id(profile_id: str) -> Optional[PydanticObjectId]:
    try:
        return PydanticObjectId(profile_id)
    except Exception:
        return None


async def _get_or_raise(profile_id: str) -> CAREProfile:
    object_id = _object_id(profile_id)
    profile = await CAREProfile.get(object_id) if object_id else None
    if profile is None:
        raise LookupError("Perfil no encontrado.")
    return profile


async def list_profiles() -> List[CAREProfile]:
    return await CAREProfile.find_all().sort(+CAREProfile.name).to_list()


async def create_profile(
    name: Any, blocks: Any, chaos_factor: float = 0.0, admin_id: str = "system"
) -> CAREProfile:
    cleaned = _clean_name(name)
    _validate_payload(blocks, chaos_factor)
    existing = await CAREProfile.find_one(CAREProfile.name == cleaned)
    if existing is not None:
        raise ProfileDuplicateError("Ya existe un perfil con ese nombre.")
    now = datetime.utcnow()
    profile = CAREProfile(
        name=cleaned,
        blocks=dict(blocks),
        chaos_factor=float(chaos_factor),
        created_by=admin_id,
        created_at=now,
        updated_at=now,
    )
    await profile.insert()
    return profile


async def update_profile(
    profile_id: str,
    name: Optional[str] = None,
    blocks: Optional[Dict[str, float]] = None,
    chaos_factor: Optional[float] = None,
) -> CAREProfile:
    profile = await _get_or_raise(profile_id)
    if name is not None:
        cleaned = _clean_name(name)
        existing = await CAREProfile.find_one(CAREProfile.name == cleaned)
        if existing is not None and str(existing.id) != profile_id:
            raise ProfileDuplicateError("Ya existe un perfil con ese nombre.")
        profile.name = cleaned
    if blocks is not None or chaos_factor is not None:
        next_blocks = blocks if blocks is not None else profile.blocks
        next_chaos = (
            chaos_factor if chaos_factor is not None else profile.chaos_factor
        )
        _validate_payload(next_blocks, next_chaos)
        profile.blocks = dict(next_blocks)
        profile.chaos_factor = float(next_chaos)
    profile.updated_at = datetime.utcnow()
    await profile.save()
    return profile


async def delete_profile(profile_id: str) -> None:
    profile = await _get_or_raise(profile_id)
    await profile.delete()
