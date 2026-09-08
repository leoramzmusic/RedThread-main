"""
SystemParams data model for CARE Engine.

Configurable weights, thresholds, and rules for the recommendation system.
"""

from pydantic import BaseModel, Field


class ScoringWeights(BaseModel):
    """Weights for combining different score components."""
    compat: float = Field(default=0.6, ge=0.0, le=1.0)
    dynamic: float = Field(default=0.3, ge=0.0, le=1.0)
    human: float = Field(default=0.1, ge=0.0, le=1.0)


class DiversityParams(BaseModel):
    """Diversity quota configuration."""
    bucket_sizes: dict = Field(default_factory=lambda: {
        "low_pop": 0.4,   # 40% from low-popularity profiles
        "mid_pop": 0.4,   # 40% from mid-popularity profiles
        "high_pop": 0.2   # 20% from high-popularity profiles
    })
    max_per_bucket: int = Field(default=10)


class FairnessParams(BaseModel):
    """Fairness and equity configuration."""
    gender_balance: bool = True
    exposure_floor_per_segment: dict = Field(default_factory=lambda: {
        "new_users": 0.3,      # New users get at least 30% of average exposure
        "low_activity": 0.4,   # Low activity users get 40%
        "standard": 1.0        # Standard users get 100%
    })


class AuthenticityParams(BaseModel):
    """Authenticity penalty configuration."""
    min_reply_rate: float = Field(default=0.2, ge=0.0, le=1.0)
    vanity_penalty: float = Field(default=0.5, ge=0.0, le=1.0)
    ghosting_penalty: float = Field(default=0.6, ge=0.0, le=1.0)


class ProximityParams(BaseModel):
    """Geographic proximity configuration."""
    decay_km: int = Field(default=50, ge=1)  # Distance at which proximity bonus decays to 50%


class SystemParams(BaseModel):
    """Global system parameters for CARE Engine."""
    
    weights: ScoringWeights = Field(default_factory=ScoringWeights)
    diversity: DiversityParams = Field(default_factory=DiversityParams)
    fairness: FairnessParams = Field(default_factory=FairnessParams)
    authenticity: AuthenticityParams = Field(default_factory=AuthenticityParams)
    proximity: ProximityParams = Field(default_factory=ProximityParams)
    
    # Cold start defaults
    cold_start_recommendation_count: int = 20
    
    class Config:
        json_schema_extra = {
            "example": {
                "weights": {
                    "compat": 0.6,
                    "dynamic": 0.3,
                    "human": 0.1
                },
                "diversity": {
                    "bucket_sizes": {
                        "low_pop": 0.4,
                        "mid_pop": 0.4,
                        "high_pop": 0.2
                    }
                }
            }
        }
