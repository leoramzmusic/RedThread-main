from typing import Optional, Dict, Any
from datetime import datetime
from beanie import Document
from pydantic import Field

class VerificationLog(Document):
    """
    Log of identity verification actions performed by admins/employees.
    """
    admin_id: str = Field(..., description="ID of the admin/employee who performed the action")
    user_id: str = Field(..., description="ID of the user being verified")
    action: str = Field(..., description="Action taken: approved, rejected")
    reason: Optional[str] = Field(None, description="Reason for rejection")
    details: Optional[str] = Field(None, description="Additional details or 'Other' reason text")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "verification_logs"
