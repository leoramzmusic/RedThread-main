from datetime import datetime
from typing import Optional, Dict, Any, List
from beanie import Document
from pydantic import Field


class Notification(Document):
    recipient_type: str = "user"  # "user" | "employee"
    recipient_id: Optional[str] = None
    user_id: Optional[str] = None  # Legacy support
    category: str = "announcement"  # "announcement" | "alert" | "operational" | "security" | "maintenance"
    content: str
    seen_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    priority: str = "P2"  # "P0" | "P1" | "P2" | "P3"
    action_url: Optional[str] = None
    action_label: Optional[str] = None
    is_read: bool = False
    # Estado de resolución de la tarea asociada (independiente de read)
    resolved: bool = False
    # Indica que la notificación requiere una acción del usuario (CARE, encuesta, etc.)
    required_action: bool = False
    # Indica que la notificación es crítica y no puede descartarse hasta resolverse
    critical: bool = False
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Legacy compatibility fields if needed by existing code
    type: Optional[str] = None
    related_user_id: Optional[str] = None
    group_key: Optional[str] = None
    actor_count: int = 1
    actors: List[Dict[str, Any]] = Field(default_factory=list)
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    # Estado del ciclo de vida: "active" | "trash" | "deleted"
    # active  = visible en el panel principal
    # trash   = movida a la papelera (soft delete, retención 30 días)
    # deleted = eliminada físicamente de la BD (job programado)
    status: str = "active"
    # Momento en que entró a la papelera (null si no está en ella)
    deleted_at: Optional[datetime] = None
    # Momento en que se eliminó definitivamente (job de retención)
    permanently_deleted_at: Optional[datetime] = None
    snoozed_until: Optional[datetime] = None
    pinned_at: Optional[datetime] = None

    class Settings:
        name = "notifications"
        indexes = [
            [("recipient_type", 1), ("recipient_id", 1), ("is_read", 1), ("created_at", -1)],
            [("user_id", 1), ("is_read", 1), ("created_at", -1)],
            [("user_id", 1), ("updated_at", -1)],
            [("user_id", 1), ("group_key", 1), ("updated_at", -1)],
            [("user_id", 1), ("status", 1), ("updated_at", -1)],
            [("user_id", 1), ("pinned_at", -1), ("updated_at", -1)],
        ]
