from datetime import datetime
from typing import List, Optional, Tuple

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from src.core.config import settings
from src.core.middleware.employee_rbac import (
    log_employee_action,
    require_employee_permission,
)
from src.models.admin_rbac import Permission
from src.models.employee import Employee
from src.models.integration_config import IntegrationConfig
from src.models.user import User
from src.api.auth import get_current_user

router = APIRouter(tags=["Admin - Integrations"])
public_router = APIRouter(tags=["Integrations"])

SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"


class IntegrationUpdate(BaseModel):
    display_name: Optional[str] = None
    client_id: Optional[str] = None
    # Vacío/null = conservar el secret guardado (nunca se devuelve al frontend)
    client_secret: Optional[str] = None
    redirect_uri: Optional[str] = None
    scopes: Optional[List[str]] = None
    enabled: Optional[bool] = None
    fallback_complete: Optional[bool] = None


class IntegrationTestRequest(BaseModel):
    # Si vienen, se prueban SIN guardar (dry-run antes de guardar)
    client_id: Optional[str] = None
    client_secret: Optional[str] = None


async def resolve_integration_creds(
    provider: str,
) -> Tuple[Optional[str], Optional[str], Optional[str], List[str]]:
    """
    Credenciales efectivas: config de BD (si enabled y con credenciales)
    o variables de entorno como fallback.
    Retorna (client_id, client_secret, redirect_uri, scopes).
    """
    try:
        cfg = await IntegrationConfig.get_provider(provider)
        if cfg and cfg.enabled and cfg.client_id and cfg.client_secret:
            return (
                cfg.client_id,
                cfg.client_secret,
                cfg.redirect_uri or settings.SPOTIFY_REDIRECT_URI,
                cfg.scopes or ["user-read-private", "user-read-email"],
            )
    except Exception as e:
        print(f"[integrations] No se pudo leer config de {provider}: {e}")
    return (
        settings.SPOTIFY_CLIENT_ID,
        settings.SPOTIFY_CLIENT_SECRET,
        settings.SPOTIFY_REDIRECT_URI,
        ["user-read-private", "user-read-email"],
    )


async def _test_client_credentials(
    client_id: str, client_secret: str
) -> Tuple[str, str]:
    """
    Valida id/secret contra Spotify en 2 fases:
    1) grant client_credentials (credenciales válidas),
    2) llamada real a Web API (detecta app bloqueada / Premium requerido).
    Retorna (status, message) con status en ok | blocked_premium_required | error.
    """
    import base64

    try:
        b64 = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                SPOTIFY_TOKEN_URL,
                data={"grant_type": "client_credentials"},
                headers={
                    "Authorization": f"Basic {b64}",
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                timeout=12.0,
            )
            if resp.status_code != 200:
                try:
                    detail = resp.json().get("error_description") or resp.text[:200]
                except Exception:
                    detail = resp.text[:200]
                return (
                    "error",
                    f"Spotify rechazó las credenciales ({resp.status_code}): {detail}",
                )

            token = resp.json().get("access_token")
            if not token:
                return "error", "Spotify no devolvió access_token."

            # Fase 2: llamada real para detectar bloqueo/Premium
            probe = await client.get(
                "https://api.spotify.com/v1/search",
                params={"q": "test", "type": "track", "limit": 1},
                headers={"Authorization": f"Bearer {token}"},
                timeout=12.0,
            )
            body = (probe.text or "").lower()
            if probe.status_code == 200:
                return "ok", "Conexión válida: la integración responde."
            if "premium subscription required" in body or "restricted" in body:
                return (
                    "blocked_premium_required",
                    "Bloqueada: Spotify requiere Premium para Web API.",
                )
            return (
                "error",
                f"Web API respondió {probe.status_code}: {probe.text[:200]}",
            )
    except Exception as e:
        return "error", f"No se pudo contactar a Spotify: {str(e)[:200]}"


def _public_status(cfg: Optional[IntegrationConfig]) -> dict:
    if not cfg:
        return {
            "provider": "spotify",
            "enabled": True,
            "fallback_complete": False,
            "status": "pending",
        }
    return {
        "provider": cfg.provider,
        "enabled": cfg.enabled,
        "fallback_complete": cfg.fallback_complete,
        "status": cfg.status,
    }


@router.get("/")
async def list_integrations(
    employee: Employee = Depends(
        require_employee_permission(Permission.VIEW_CONFIG)
    ),
):
    """Lista integraciones (sin secrets)."""
    configs = await IntegrationConfig.find_all().to_list()
    # Siempre expone spotify aunque no tenga fila (con defaults)
    providers = {c.provider: c for c in configs}
    if "spotify" not in providers:
        return [
            IntegrationConfig(
                provider="spotify",
                display_name="Spotify",
            ).public_dict()
        ] + [c.public_dict() for c in configs]
    return [c.public_dict() for c in configs]


@router.get("/{provider}")
async def get_integration(
    provider: str,
    employee: Employee = Depends(
        require_employee_permission(Permission.VIEW_CONFIG)
    ),
):
    """Configura segura de un provider (sin secret)."""
    cfg = await IntegrationConfig.get_provider(provider)
    if not cfg:
        cfg = IntegrationConfig(
            provider=provider, display_name=provider.capitalize()
        )
    return cfg.public_dict()


@router.put("/{provider}")
async def update_integration(
    provider: str,
    update: IntegrationUpdate,
    employee: Employee = Depends(
        require_employee_permission(Permission.MANAGE_INTEGRATIONS)
    ),
):
    """Crea/actualiza la config (el secret solo se sobrescribe si viene lleno)."""
    cfg = await IntegrationConfig.get_provider(provider)
    if not cfg:
        cfg = IntegrationConfig(provider=provider)

    data = update.model_dump(exclude_unset=True)
    if not data.get("client_secret"):
        data.pop("client_secret", None)
    for field, value in data.items():
        setattr(cfg, field, value)
    cfg.updated_at = datetime.utcnow()
    cfg.updated_by = str(employee.id)
    await cfg.save()

    await log_employee_action(
        employee_id=str(employee.id),
        action_type="update_integration",
        description=f"Updated integration {provider}",
        target_type="integration",
        target_id=provider,
    )
    return cfg.public_dict()


@router.post("/{provider}/test")
async def test_integration(
    provider: str,
    body: IntegrationTestRequest,
    employee: Employee = Depends(
        require_employee_permission(Permission.MANAGE_INTEGRATIONS)
    ),
):
    """
    Prueba la conexión. Con client_id/secret en el body hace dry-run sin
    guardar; sin ellos prueba la config guardada (o env) y persiste el estado.
    """
    if provider != "spotify":
        raise HTTPException(status_code=400, detail="Provider no soportado aún")

    dry_run = bool(body.client_id and body.client_secret)
    if dry_run:
        cid, csecret = body.client_id, body.client_secret
    else:
        cid, csecret, _, _ = await resolve_integration_creds(provider)

    if not cid or not csecret:
        raise HTTPException(
            status_code=400,
            detail="Sin credenciales para probar: configura Client ID y Secret.",
        )

    status, message = await _test_client_credentials(cid, csecret)
    ok = status == "ok"

    if not dry_run:
        cfg = await IntegrationConfig.get_provider(provider)
        if not cfg:
            cfg = IntegrationConfig(provider=provider, display_name="Spotify")
        cfg.status = status
        cfg.status_detail = message
        cfg.last_tested_at = datetime.utcnow()
        cfg.updated_by = str(employee.id)
        await cfg.save()

    await log_employee_action(
        employee_id=str(employee.id),
        action_type="test_integration",
        description=f"Tested integration {provider}: {status}",
        target_type="integration",
        target_id=provider,
    )
    return {"ok": ok, "status": status, "message": message, "dry_run": dry_run}


@public_router.get("/{provider}")
async def get_public_integration(
    provider: str, current_user: User = Depends(get_current_user)
):
    """Estado seguro para el frontend (sin secrets): scoring y UI."""
    if provider != "spotify":
        raise HTTPException(status_code=404, detail="Provider no encontrado")
    cfg = await IntegrationConfig.get_provider(provider)
    return _public_status(cfg)
