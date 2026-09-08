from typing import Optional
from enum import Enum
from beanie import Document
from pydantic import Field

class RuleTrigger(str, Enum):
    COUNT_THRESHOLD = "count_threshold"
    CATEGORY = "category"
    TYPE = "type"

class RuleAction(str, Enum):
    HIDE = "hide"
    SUSPEND = "suspend"
    NOTIFY = "notify"
    BLOCK = "block"

class ReportRule(Document):
    """Model for automated moderation rules"""
    name: str
    description: Optional[str] = None
    
    trigger_type: RuleTrigger = RuleTrigger.COUNT_THRESHOLD
    threshold: int = 5
    
    # For category/type filters
    category_filter: Optional[str] = None
    type_filter: Optional[str] = None
    
    action: RuleAction = RuleAction.NOTIFY
    is_active: bool = True
    
    created_at: Optional[str] = None # Or use datetime
    
    class Settings:
        name = "report_rules"
