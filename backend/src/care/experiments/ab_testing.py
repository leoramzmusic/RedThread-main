"""
A/B testing framework for CARE Engine.

Allows running controlled experiments to test different:
- Scoring weights
- Diversity quotas
- Penalty/boost values
- Ranking algorithms
"""

from typing import Dict, Optional
from enum import Enum
from pydantic import BaseModel
from src.care.models.system_params import SystemParams, ScoringWeights, DiversityParams


class ExperimentVariant(str, Enum):
    """Experiment variant identifiers."""
    CONTROL = "control"
    TREATMENT_A = "treatment_a"
    TREATMENT_B = "treatment_b"
    TREATMENT_C = "treatment_c"


class ExperimentConfig(BaseModel):
    """Configuration for an A/B test experiment."""
    
    experiment_id: str
    name: str
    description: str
    
    # Variant distribution (must sum to 1.0)
    variant_distribution: Dict[ExperimentVariant, float] = {
        ExperimentVariant.CONTROL: 0.5,
        ExperimentVariant.TREATMENT_A: 0.5
    }
    
    # System params per variant
    variant_params: Dict[ExperimentVariant, SystemParams]
    
    # Metrics to track
    metrics: list = [
        "match_rate",
        "message_rate",
        "conversation_length",
        "user_satisfaction"
    ]
    
    # Experiment status
    is_active: bool = True
    start_date: Optional[str] = None
    end_date: Optional[str] = None


def assign_variant(user_id: str, experiment: ExperimentConfig) -> ExperimentVariant:
    """
    Assign a user to an experiment variant.
    
    Uses consistent hashing to ensure same user always gets same variant.
    
    Args:
        user_id: User ID
        experiment: Experiment configuration
    
    Returns:
        Assigned variant
    """
    import hashlib
    
    # Hash user_id + experiment_id for consistency
    hash_input = f"{user_id}:{experiment.experiment_id}"
    hash_value = int(hashlib.md5(hash_input.encode()).hexdigest(), 16)
    
    # Map to [0, 1]
    normalized = (hash_value % 10000) / 10000.0
    
    # Assign based on distribution
    cumulative = 0.0
    for variant, probability in experiment.variant_distribution.items():
        cumulative += probability
        if normalized < cumulative:
            return variant
    
    # Fallback to control
    return ExperimentVariant.CONTROL


def get_params_for_user(
    user_id: str,
    active_experiments: list[ExperimentConfig],
    default_params: SystemParams
) -> SystemParams:
    """
    Get system parameters for a user based on active experiments.
    
    If user is in multiple experiments, uses the first one.
    
    Args:
        user_id: User ID
        active_experiments: List of active experiments
        default_params: Default system parameters
    
    Returns:
        SystemParams for the user
    """
    if not active_experiments:
        return default_params
    
    # Use first active experiment
    experiment = active_experiments[0]
    variant = assign_variant(user_id, experiment)
    
    return experiment.variant_params.get(variant, default_params)


# Example experiment configurations

WEIGHT_EXPERIMENT = ExperimentConfig(
    experiment_id="weight_test_001",
    name="Compatibility vs Dynamic Weight Test",
    description="Test if increasing dynamic weight improves engagement",
    variant_distribution={
        ExperimentVariant.CONTROL: 0.5,
        ExperimentVariant.TREATMENT_A: 0.5
    },
    variant_params={
        ExperimentVariant.CONTROL: SystemParams(
            weights=ScoringWeights(compat=0.6, dynamic=0.3, human=0.1)
        ),
        ExperimentVariant.TREATMENT_A: SystemParams(
            weights=ScoringWeights(compat=0.5, dynamic=0.4, human=0.1)
        )
    }
)

DIVERSITY_EXPERIMENT = ExperimentConfig(
    experiment_id="diversity_test_001",
    name="Diversity Quota Test",
    description="Test if more low-pop profiles improves discovery",
    variant_distribution={
        ExperimentVariant.CONTROL: 0.5,
        ExperimentVariant.TREATMENT_A: 0.5
    },
    variant_params={
        ExperimentVariant.CONTROL: SystemParams(
            diversity=DiversityParams(
                bucket_sizes={"low_pop": 0.4, "mid_pop": 0.4, "high_pop": 0.2}
            )
        ),
        ExperimentVariant.TREATMENT_A: SystemParams(
            diversity=DiversityParams(
                bucket_sizes={"low_pop": 0.5, "mid_pop": 0.3, "high_pop": 0.2}
            )
        )
    }
)
