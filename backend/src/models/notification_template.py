from datetime import datetime
from typing import List, Dict, Any, Optional
from beanie import Document, PydanticObjectId
from pydantic import Field


class NotificationTemplate(Document):
    title: str
    body: str  # con variables {{variable}}
    icon: str
    icon_type: str = "system_icon"  # "system_icon" | "dynamic_avatar"
    action_url: Optional[str] = None
    category: str  # "match" | "like" | "message" | "survey" | "reminder" | "promo" | "system" | "security"
    priority: str  # "P0" | "P1" | "P2" | "P3"
    required_action: bool = False
    critical: bool = False
    variables: List[Dict[str, Any]] = Field(default_factory=list)  # [{name, type}]
    # ── Fase 2: identidad extendida ──
    color: Optional[str] = None  # color hex de la categoría
    # ── Fase 2: canales ──
    channels: List[str] = Field(default_factory=lambda: ["push", "panel"])  # push, panel, email, sms
    # ── Fase 2: acción ──
    action_type: Optional[str] = None  # url | screen | chat | profile | survey | none
    action_destination: Optional[str] = None  # destino de la acción
    # ── Fase 2: comportamiento ──
    persistent: bool = False  # permanece en el panel hasta leerla
    programmable: bool = False  # se puede programar
    silencable: bool = False  # el usuario puede silenciarla
    # ── Fase 3: ámbito de uso ──
    destinatarios: List[str] = Field(default_factory=lambda: ["usuarios"])  # usuarios, empleados, marcas
    evento_disparador: Optional[str] = None  # like_received, match_created, new_message, payment_successful, survey_completed, etc.
    uso_principal: Optional[str] = None  # portal_usuarios | portal_empleados | portal_marcas | global
    created_by: PydanticObjectId
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    deleted_at: Optional[datetime] = None
    deleted_by: Optional[PydanticObjectId] = None

    class Settings:
        name = "notification_templates"
        indexes = [
            "category",
            "priority",
            "created_by",
            [("category", 1), ("priority", 1)],
            [("created_at", -1)],
        ]
