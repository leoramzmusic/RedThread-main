from beanie import Document, Indexed
from pydantic import Field
from datetime import datetime
from typing import List, Optional


class IntegrationConfig(Document):
    """
    Configuración editable desde el portal para integraciones externas
    (ej. Spotify). El secret nunca se expone al frontend (ver public_dict).
    """

    provider: Indexed(str, unique=True)  # "spotify" | "apple_music" | ...
    display_name: str = "Spotify"

    # Credenciales (None = usar variables de entorno del servidor)
    client_id: Optional[str] = None
    client_secret: Optional[str] = None
    redirect_uri: Optional[str] = None
    scopes: List[str] = Field(
        default_factory=lambda: ["user-read-private", "user-read-email"]
    )

    # Control
    enabled: bool = True
    # Si True, la sección cuenta como completa aunque el usuario no conecte.
    # Evita perfiles bloqueados por integraciones rotas.
    fallback_complete: bool = True

    # Estado de la última prueba de conexión
    # pending | ok | blocked_premium_required | error
    status: str = "pending"
    status_detail: Optional[str] = None
    last_tested_at: Optional[datetime] = None

    updated_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "integration_configs"
        indexes = ["provider"]

    @classmethod
    async def get_provider(cls, provider: str) -> Optional["IntegrationConfig"]:
        return await cls.find_one({"provider": provider})

    def public_dict(self) -> dict:
        """Vista segura para el frontend (sin secret; el id es público en OAuth)."""
        return {
            "provider": self.provider,
            "display_name": self.display_name,
            "client_id": self.client_id,
            "has_client_id": bool(self.client_id),
            "has_secret": bool(self.client_secret),
            "redirect_uri": self.redirect_uri,
            "scopes": self.scopes,
            "enabled": self.enabled,
            "fallback_complete": self.fallback_complete,
            "status": self.status,
            "status_detail": self.status_detail,
            "last_tested_at": (
                self.last_tested_at.isoformat() if self.last_tested_at else None
            ),
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def has_credentials(self) -> bool:
        return bool(self.client_id and self.client_secret)
