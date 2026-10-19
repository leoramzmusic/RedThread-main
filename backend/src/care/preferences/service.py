"""Preferencias CARE: validación, CRUD por usuario y consultas admin."""
from datetime import datetime
from typing import Any, Dict, List, Optional

from beanie import PydanticObjectId
from pymongo.errors import DuplicateKeyError

from src.care.formula.service import CANONICAL_BLOCKS
from src.care.models.care_dimension_map import CareDimensionMap
from src.care.models.care_user_preference import CareUserPreference

CARE_DIMENSION_KEYS: tuple[str, ...] = tuple(CANONICAL_BLOCKS.keys())
NOT_FOUND_MESSAGE = "Preferencia no encontrada."
DUPLICATE_MESSAGE = "Ya existe una preferencia para esa dimensión."


class PreferenceValidationError(ValueError):
    """Uno o más campos de la preferencia no son válidos."""

    def __init__(self, errors: List[str]):
        super().__init__("; ".join(errors))
        self.errors = errors


class PreferenceDuplicateError(ValueError):
    """Ya existe una fila (user_id, dimension)."""


def _validate_dimension(dimension: Any) -> None:
    if dimension not in CARE_DIMENSION_KEYS:
        raise PreferenceValidationError(["La dimensión no es válida."])


def _validate_score(score: Any) -> None:
    if isinstance(score, bool) or not isinstance(score, int) or not 0 <= score <= 100:
        raise PreferenceValidationError(["El score debe estar entre 0 y 100."])


async def _normalize_tag(dimension: str, tag: Any) -> Optional[str]:
    if tag is None:
        return None
    if not isinstance(tag, str):
        raise PreferenceValidationError(["Etiqueta desconocida."])
    cleaned = tag.strip()
    if not cleaned:
        return None
    entry = await CareDimensionMap.find_one({"tag": cleaned})
    if entry is None:
        raise PreferenceValidationError(["Etiqueta desconocida."])
    if entry.care_dimension != dimension:
        raise PreferenceValidationError(
            ["La etiqueta no corresponde a esa dimensión."]
        )
    return cleaned


def _object_id(value: Any) -> Optional[PydanticObjectId]:
    try:
        return PydanticObjectId(value)
    except Exception:
        return None


async def _get_owned(preference_id: str, user_id: str) -> CareUserPreference:
    object_id = _object_id(preference_id)
    doc = await CareUserPreference.get(object_id) if object_id else None
    if doc is None or doc.user_id != user_id:
        raise LookupError(NOT_FOUND_MESSAGE)
    return doc


async def list_user_preferences(user_id: str) -> List[CareUserPreference]:
    return await CareUserPreference.find({"user_id": user_id}).sort(
        "dimension"
    ).to_list()


async def create_preference(
    user_id: str, dimension: Any, score: Any, tag: Any = None
) -> CareUserPreference:
    _validate_dimension(dimension)
    _validate_score(score)
    cleaned_tag = await _normalize_tag(dimension, tag)
    existing = await CareUserPreference.find_one(
        {"user_id": user_id, "dimension": dimension}
    )
    if existing is not None:
        raise PreferenceDuplicateError(DUPLICATE_MESSAGE)
    now = datetime.utcnow()
    doc = CareUserPreference(
        user_id=user_id,
        dimension=dimension,
        tag=cleaned_tag,
        score=score,
        created_at=now,
        updated_at=now,
    )
    try:
        await doc.insert()
    except DuplicateKeyError:
        raise PreferenceDuplicateError(DUPLICATE_MESSAGE)
    return doc


async def update_preference(
    preference_id: str, user_id: str, payload: Dict[str, Any]
) -> CareUserPreference:
    doc = await _get_owned(preference_id, user_id)
    if "score" in payload:
        _validate_score(payload["score"])
        doc.score = payload["score"]
    if "tag" in payload:
        doc.tag = await _normalize_tag(doc.dimension, payload["tag"])
    doc.updated_at = datetime.utcnow()
    await doc.save()
    return doc


async def delete_preference(preference_id: str, user_id: str) -> None:
    doc = await _get_owned(preference_id, user_id)
    await doc.delete()
