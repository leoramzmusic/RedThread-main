"""
Audit Log Model
Tracks access to sensitive user data for security and compliance.
"""

from beanie import Document
from pydantic import Field
from typing import List
from datetime import datetime


class AuditLog(Document):
    """
    Audit log for tracking access to sensitive user data.
    Used for security monitoring and compliance (GDPR, etc.)
    """
    
    user_id: str  # User whose data was accessed
    accessed_by: str  # User who accessed the data
    action: str  # Type of action (e.g., "view_profile", "view_identity_document")
    sensitive_fields: List[str] = []  # List of sensitive fields accessed
    
    # Request metadata
    ip_address: str = "unknown"
    user_agent: str = "unknown"
    
    # Timestamp
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "audit_logs"
        indexes = [
            "user_id",
            "accessed_by",
            "timestamp",
            "action"
        ]
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "507f1f77bcf86cd799439011",
                "accessed_by": "507f1f77bcf86cd799439012",
                "action": "view_sensitive_data",
                "sensitive_fields": ["email", "phone", "real_name"],
                "ip_address": "192.168.1.1",
                "user_agent": "Mozilla/5.0...",
                "timestamp": "2024-01-11T12:00:00Z"
            }
        }
