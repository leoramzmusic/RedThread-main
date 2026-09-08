"""
Human-centric adjustments for CARE Engine.

Applies fairness, authenticity, and diversity adjustments to scores:
- Vanity penalties (high likes, low responses)
- Ghosting penalties
- Diversity boosts for underexposed profiles
- Fairness balance across segments
"""

from src.care.models.candidate_profile import CandidateProfile
from src.care.models.system_params import SystemParams


def human_adjustment(
    candidate: CandidateProfile,
    params: SystemParams = None
) -> float:
    """
    Calculate human-centric adjustment to candidate score.
    
    This can be positive (diversity boost) or negative (authenticity penalty).
    
    Args:
        candidate: Candidate profile to evaluate
        params: System parameters (optional)
    
    Returns:
        Adjustment value (can be negative or positive)
    """
    if params is None:
        params = SystemParams()
    
    adjustment = 0.0
    
    # 1. Vanity penalty
    # Penalize profiles with high popularity but low responsiveness
    if (candidate.popularity_signals.likes_received > 100 and
        candidate.responsiveness_score < params.authenticity.min_reply_rate):
        adjustment -= params.authenticity.vanity_penalty
    
    # 2. Ghosting penalty
    # Penalize profiles with high ghosting rate
    if candidate.authenticity_signals.ghosting_rate > 0.5:
        adjustment -= params.authenticity.ghosting_penalty
    
    # 3. Diversity boost
    # Boost underexposed profiles
    # Note: exposure_metric would be computed by batch jobs
    # For now, use inverse of popularity as proxy
    if candidate.popularity_signals.likes_received < 20:
        # Low exposure = boost
        adjustment += 0.3
    elif candidate.popularity_signals.likes_received < 50:
        # Medium exposure = small boost
        adjustment += 0.15
    
    # 4. Fairness balance
    # In real implementation, would check segment-specific exposure floors
    # For now, provide small boost to maintain balance
    adjustment += 0.05
    
    return adjustment


def calculate_exposure_metric(candidate: CandidateProfile) -> float:
    """
    Calculate exposure metric for a candidate.
    
    This would be computed by batch jobs based on:
    - Number of times shown in feeds
    - Number of views received
    - Time since profile creation
    
    Args:
        candidate: Candidate profile
    
    Returns:
        Exposure metric (higher = more exposed)
    """
    # Simplified: use views as proxy
    views = candidate.popularity_signals.views
    
    # Normalize to [0, 1] range (assuming max 1000 views)
    return min(1.0, views / 1000.0)


def get_segment(candidate: CandidateProfile) -> str:
    """
    Determine candidate's segment for fairness calculations.
    
    Segments:
    - new_users: < 50 views
    - low_activity: activity_score < 0.3
    - standard: everyone else
    
    Args:
        candidate: Candidate profile
    
    Returns:
        Segment name
    """
    if candidate.popularity_signals.views < 50:
        return 'new_users'
    elif candidate.activity_score < 0.3:
        return 'low_activity'
    else:
        return 'standard'
