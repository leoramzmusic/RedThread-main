"""Admin: listado, insights y export de preferencias CARE."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException

from src.api.admin_algorithms import admin_required
from src.care.preferences import export as export_service
from src.care.preferences import service
from src.models.employee import Employee

router = APIRouter()


@router.get("")
async def list_all_preferences(
    admin: Employee = Depends(admin_required),
    limit: int = 200,
    offset: int = 0,
    dimension: Optional[str] = None,
    user_id: Optional[str] = None,
):
    if limit < 1 or limit > 1000:
        raise HTTPException(
            status_code=422, detail=["El límite debe estar entre 1 y 1000."]
        )
    if offset < 0:
        raise HTTPException(
            status_code=422, detail=["El desplazamiento no puede ser negativo."]
        )
    if dimension is not None and dimension not in service.CARE_DIMENSION_KEYS:
        raise HTTPException(
            status_code=422, detail=["La dimensión no es válida."]
        )
    return await service.list_all_preferences(
        limit=limit, offset=offset, dimension=dimension, user_id=user_id
    )


@router.get("/insights")
async def preference_insights(admin: Employee = Depends(admin_required)):
    return await service.get_insights()


@router.post("/export")
async def export_preferences(admin: Employee = Depends(admin_required)):
    return await export_service.build_export()
