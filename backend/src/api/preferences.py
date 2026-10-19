"""Preferencias CARE del usuario autenticado."""
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException

from src.api.auth import get_current_user
from src.care.preferences import service
from src.models.user import User

router = APIRouter()


@router.get("")
async def list_my_preferences(current_user: User = Depends(get_current_user)):
    docs = await service.list_user_preferences(str(current_user.id))
    return [doc.model_dump(mode="json") for doc in docs]


@router.post("", status_code=201)
async def create_my_preference(
    body: Dict[str, Any], current_user: User = Depends(get_current_user)
):
    try:
        doc = await service.create_preference(
            str(current_user.id),
            body.get("dimension"),
            body.get("score"),
            body.get("tag"),
        )
    except service.PreferenceValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors)
    except service.PreferenceDuplicateError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    return doc.model_dump(mode="json")


@router.put("/{preference_id}")
async def update_my_preference(
    preference_id: str,
    body: Dict[str, Any],
    current_user: User = Depends(get_current_user),
):
    payload = {
        key: body[key] for key in ("score", "tag") if key in body
    }
    try:
        doc = await service.update_preference(
            preference_id, str(current_user.id), payload
        )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except service.PreferenceValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors)
    return doc.model_dump(mode="json")


@router.delete("/{preference_id}")
async def delete_my_preference(
    preference_id: str, current_user: User = Depends(get_current_user)
):
    try:
        await service.delete_preference(preference_id, str(current_user.id))
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return {"ok": True}
