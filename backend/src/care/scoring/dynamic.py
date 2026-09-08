"""
Dynamic preference scoring for CARE Engine.

Learns from user behavior to refine recommendations:
- Tag affinity from interaction history
- Activity and responsiveness signals
- Proximity with decay
- Recency momentum
"""

from typing import Optional
from src.care.models.user_profile import UserProfile
from src.care.models.candidate_profile import CandidateProfile
from src.care.models.interaction_log import InteractionLog
from src.care.models.system_params import SystemParams
from src.care.utils.geo import haversine_distance, proximity_decay
from src.care.utils.tags import calculate_tag_affinity


def dynamic_score(
    user_id: str,
    candidate: CandidateProfile,
    interaction_log: Optional[InteractionLog] = None,
    params: SystemParams = None
) -> float:
    """
    Calculate dynamic preference score based on user behavior.
    
    Args:
        user_id: User ID for location lookup
        candidate: Candidate profile to evaluate
        interaction_log: User's interaction history (optional)
        params: System parameters (optional)
    
    Returns:
        Dynamic score between 0.0 and 1.0
    """
    if params is None:
        params = SystemParams()
    
    score = 0.0
    
    # If no interaction history, return neutral score
    if not interaction_log or not interaction_log.aggregate_features:
        return 0.5
    
    agg = interaction_log.aggregate_features
    
    # 1. Tag affinity (25%)
    # Combine photo and bio tags
    candidate_tags = candidate.photo_tags + candidate.bio_tags
    tag_affinity = calculate_tag_affinity(agg.liked_tags, candidate_tags)
    score += tag_affinity * 0.25
    
    # 2. Activity score (10%) - Reduced in Phase 2
    # Higher activity = more likely to respond
    score += candidate.activity_score * 0.10
    
    # 3. Reciprocity & Semantic Depth (30% combined)
    # Phase 2 improvement: prioritizing mutual effort and connection quality
    reciprocity = getattr(candidate, 'reciprocity_score', 0.5)
    semantic_depth = getattr(candidate, 'semantic_depth', 0.5)
    
    score += reciprocity * 0.15
    score += semantic_depth * 0.15
    
    # 4. Proximity decay (20%)
    # Note: We need user location - in real implementation, fetch from DB
    # For now, assume it's passed via interaction_log metadata
    user_location = interaction_log.aggregate_features.__dict__.get('user_location')
    if user_location:
        distance_km = haversine_distance(user_location, candidate.location)
        max_distance = interaction_log.aggregate_features.__dict__.get('max_distance_km', 50)
        proximity_score = proximity_decay(distance_km, max_distance, params.proximity.decay_km)
        score += proximity_score * 0.20
    else:
        # Default proximity bonus if location unavailable
        score += 0.10
    
    # 5. Recency momentum (15%)
    # Boost candidates similar to recent likes
    # This would require analyzing recent actions - simplified for now
    recent_momentum = calculate_recency_match(interaction_log, candidate)
    score += recent_momentum * 0.15
    
    # Clamp to [0, 1]
    return max(0.0, min(1.0, score))


def calculate_recency_match(
    interaction_log: InteractionLog,
    candidate: CandidateProfile
) -> float:
    """
    Calculate recency momentum based on recent likes.
    
    If user recently liked profiles with similar tags, boost this candidate.
    
    Args:
        interaction_log: User's interaction history
        candidate: Candidate to evaluate
    
    Returns:
        Recency score between 0.0 and 1.0
    """
    if not interaction_log.actions:
        return 0.0
    
    # Get recent LIKE actions (last 10)
    from src.care.models.interaction_log import ActionType
    recent_likes = [
        a for a in interaction_log.actions[-10:]
        if a.type == ActionType.LIKE
    ]
    
    if not recent_likes:
        return 0.0
    
    # Simple heuristic: if candidate has tags similar to recent likes, boost
    # In real implementation, would compare against actual liked profiles
    # For now, return moderate boost if any recent activity
    return 0.5 if len(recent_likes) > 0 else 0.0
