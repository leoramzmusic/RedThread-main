"""
Algorithm Management Models
Defines factors, history, and experimental configurations for CARE and Compatibility algorithms.
"""

from beanie import Document, Indexed
from pydantic import Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from enum import Enum


class AlgorithmType(str, Enum):
    CARE = "care"
    COMPATIBILITY = "compatibility"


class FactorStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    EXPERIMENTAL = "experimental"


class FactorDataType(str, Enum):
    BOOLEAN = "boolean"
    SCALE = "scale"
    MULTIPLE = "multiple"
    CATALOG = "catalog"


class AlgorithmFactor(Document):
    """
    Represents a single factor in an algorithm (CARE or Compatibility).
    """
    name: str
    description: str
    algorithm_type: AlgorithmType
    weight: float = 0.0  # Percentage or relative weight
    status: FactorStatus = FactorStatus.EXPERIMENTAL
    
    # Specific for Compatibility
    data_type: Optional[FactorDataType] = None
    formula_component: Optional[str] = None  # Reference for formula editor
    
    metadata: Dict[str, Any] = {}
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_modified_by: Optional[str] = None  # Employee ID

    class Settings:
        name = "algorithm_factors"
        indexes = [
            "algorithm_type",
            "status",
        ]


class AlgorithmHistory(Document):
    """
    Log of changes made to algorithm parameters.
    """
    algorithm_type: AlgorithmType
    factor_id: Optional[str] = None
    action: str  # "update_weight", "change_status", "add_factor", "update_formula"
    
    old_value: Any
    new_value: Any
    
    modified_by: str  # Employee ID
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    comment: Optional[str] = None

    class Settings:
        name = "algorithm_history"
        indexes = [
            "algorithm_type",
            "timestamp",
        ]


class ABTestStatus(str, Enum):
    DRAFT = "draft"
    RUNNING = "running"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ABTest(Document):
    """
    Configuration for algorithm A/B tests.
    """
    name: str
    description: Optional[str] = None
    algorithm_type: AlgorithmType
    
    # Configurations for each version
    config_a: Dict[str, Any]
    config_b: Dict[str, Any]
    
    status: ABTestStatus = ABTestStatus.DRAFT
    
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    
    # Results and metrics
    metrics: Dict[str, Any] = {}
    winner: Optional[str] = None  # "a" or "b"
    
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "algorithm_ab_tests"
        indexes = [
            "algorithm_type",
            "status",
        ]
