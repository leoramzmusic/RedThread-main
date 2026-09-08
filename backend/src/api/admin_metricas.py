from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from datetime import datetime, timedelta
from src.models.user import User
from src.models.profile import Profile
from src.api.auth import get_current_user


router = APIRouter()


@router.get("/usuarios")
async def metricas_usuarios(current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    """Get user metrics - Admin only"""
    
    # TODO: Add admin role verification
    
    # Get total users
    total_users = await User.count()
    
    # Get total profiles
    total_profiles = await Profile.count()
    
    # Get users created in last 30 days
    thirty_days_ago = datetime.now() - timedelta(days=30)
    recent_users = await User.find(
        {"created_at": {"$gte": thirty_days_ago}}
    ).count()
    
    # Get active users (users with profiles)
    active_users = total_profiles
    
    return {
        "total_usuarios": total_users,
        "usuarios_activos": active_users,
        "nuevos_usuarios_30d": recent_users,
        "tasa_activacion": round((active_users / total_users * 100) if total_users > 0 else 0, 2)
    }


@router.get("/actividad")
async def metricas_actividad(current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    """Get activity metrics - Admin only"""
    
    # TODO: Add admin role verification and actual activity metrics
    
    return {
        "matches_totales": 0,
        "mensajes_enviados": 0,
        "eventos_creados": 0,
        "usuarios_premium": 0,
        "periodo": "últimos 30 días"
    }


@router.get("/engagement")
async def metricas_engagement(current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    """Get engagement metrics - Admin only"""
    
    # TODO: Add admin role verification and actual engagement metrics
    
    return {
        "usuarios_activos_diarios": 0,
        "usuarios_activos_semanales": 0,
        "usuarios_activos_mensuales": 0,
        "tiempo_promedio_sesion": "0 min",
        "tasa_retencion": "0%"
    }


@router.get("/crecimiento")
async def metricas_crecimiento(current_user: User = Depends(get_current_user)) -> List[Dict[str, Any]]:
    """Get growth metrics over time - Admin only"""
    
    # TODO: Add admin role verification and actual growth data
    
    return [
        {"fecha": "2025-01", "nuevos_usuarios": 0, "usuarios_activos": 0},
        {"fecha": "2025-02", "nuevos_usuarios": 0, "usuarios_activos": 0}
    ]

