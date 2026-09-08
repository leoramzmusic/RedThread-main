from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from beanie import Document
from pydantic import BaseModel, Field

class ReportStatus(str, Enum):
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"
    IN_PROCESS = "in_process"  # Keep for compatibility if any old records exist

class ReportPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class ReportCategory(str, Enum):
    CHAT = "chat"
    PROFILE = "profile"
    DISCOVER = "discover"
    OTHER = "other"

class ReportEvidence(BaseModel):
    screenshot_urls: List[str] = []
    chat_fragment: Optional[str] = None
    media_urls: List[str] = []

class ReportRefutation(BaseModel):
    explanation: Optional[str] = None
    action_taken_by_user: Optional[str] = None
    submitted_at: Optional[datetime] = None

class Report(Document):
    """Expanded User Report model"""
    reporter_id: str
    reported_user_id: str
    
    category: ReportCategory = ReportCategory.OTHER
    report_type: str  # e.g., "harassment", "spam", "explicit_content"
    
    reason: str
    description: Optional[str] = None
    
    status: ReportStatus = ReportStatus.PENDING
    priority: ReportPriority = ReportPriority.MEDIUM
    
    evidence: ReportEvidence = Field(default_factory=ReportEvidence)
    refutation: Optional[ReportRefutation] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    reviewed_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    
    # Assignment
    assigned_to: Optional[str] = None
    assigned_at: Optional[datetime] = None
    
    resolution_notes: Optional[str] = None
    
    class Settings:
        name = "reports"

