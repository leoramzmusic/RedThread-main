"""Unit tests for CARE Engine Phase 3 - A/B testing and safety."""

import pytest
from uuid import uuid4
from src.care.experiments.ab_testing import assign_variant, ExperimentConfig, ExperimentVariant
from src.care.experiments.safety_guards import ExposureTracker, HighPopularityLimiter, prevent_metric_gaming
from src.care.models.candidate_profile import CandidateProfile, PopularitySignals, AuthenticitySignals
from src.care.models.system_params import SystemParams, ScoringWeights


def test_consistent_variant_assignment():
    """Test that same user always gets same variant."""
    experiment = ExperimentConfig(
        experiment_id="test_001",
        name="Test Experiment",
        description="Test",
        variant_params={
            ExperimentVariant.CONTROL: SystemParams(),
            ExperimentVariant.TREATMENT_A: SystemParams()
        }
    )
    
    user_id = "user_123"
    
    # Assign multiple times
    variant1 = assign_variant(user_id, experiment)
    variant2 = assign_variant(user_id, experiment)
    variant3 = assign_variant(user_id, experiment)
    
    # Should always be the same
    assert variant1 == variant2 == variant3


def test_exposure_tracking():
    """Test that exposure tracker prevents repeated showings."""
    tracker = ExposureTracker()
    
    user_id = "user_123"
    candidate_id = "candidate_456"
    
    # First time: should allow
    assert tracker.can_show(user_id, candidate_id, min_interval_days=7)
    
    # Record exposure
    tracker.record_exposure(user_id, candidate_id)
    
    # Immediately after: should not allow
    assert not tracker.can_show(user_id, candidate_id, min_interval_days=7)


def test_high_pop_limiting():
    """Test that high-popularity profiles are limited."""
    limiter = HighPopularityLimiter(max_per_feed=2)
    
    # Create mix of candidates
    candidates = []
    
    # 5 high-pop candidates
    for i in range(5):
        candidates.append({
            'candidate_id': f"high_{i}",
            'candidate': CandidateProfile(
                id=uuid4(),
                age=28,
                location=(19.4, -99.1),
                popularity_signals=PopularitySignals(likes_received=150 + i)
            ),
            'score': 0.8
        })
    
    # 5 normal candidates
    for i in range(5):
        candidates.append({
            'candidate_id': f"normal_{i}",
            'candidate': CandidateProfile(
                id=uuid4(),
                age=28,
                location=(19.4, -99.1),
                popularity_signals=PopularitySignals(likes_received=50 + i)
            ),
            'score': 0.7
        })
    
    filtered = limiter.filter_high_pop(candidates, high_pop_threshold=100)
    
    # Count high-pop in results
    high_pop_count = sum(
        1 for item in filtered
        if item['candidate'].popularity_signals.likes_received > 100
    )
    
    # Should be limited to max_per_feed
    assert high_pop_count <= 2


def test_metric_gaming_detection():
    """Test detection of suspicious gaming behavior."""
    # Collector profile: high likes, low responsiveness
    collector = CandidateProfile(
        id=uuid4(),
        age=28,
        location=(19.4, -99.1),
        popularity_signals=PopularitySignals(likes_received=250),
        responsiveness_score=0.1,
        authenticity_signals=AuthenticitySignals(ghosting_rate=0.3)
    )
    
    assert prevent_metric_gaming(collector) == True
    
    # Normal profile
    normal = CandidateProfile(
        id=uuid4(),
        age=28,
        location=(19.4, -99.1),
        popularity_signals=PopularitySignals(likes_received=50),
        responsiveness_score=0.7,
        authenticity_signals=AuthenticitySignals(ghosting_rate=0.2)
    )
    
    assert prevent_metric_gaming(normal) == False
