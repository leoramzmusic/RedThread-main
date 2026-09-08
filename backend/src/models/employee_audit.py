from datetime import datetime
from typing import Optional, Any, Dict
from beanie import Document, Indexed
from pydantic import Field

class EmployeeAudit(Document):
    employee_id: Indexed(str)
    admin_id: str
    admin_name: str
    action: str  # e.g., "update", "suspend", "activate", "password_reset"
    field_name: Optional[str] = None
    old_value: Optional[Any] = None
    new_value: Optional[Any] = None
    change_summary: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "employee_audit"
        indexes = [
            "employee_id",
            "created_at",
            "admin_id"
        ]
