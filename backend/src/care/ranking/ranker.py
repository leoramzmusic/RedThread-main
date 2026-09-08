"""
Main ranking logic for CARE Engine.

Combines compatibility scoring with diversity quotas to produce
balanced, fair recommendations.
"""

from typing import List, Dict, Optional
from src.care.models.user_profile import UserProfile
from src.care.models.candidate_profile import CandidateProfile
from src.care.models.interaction_log import InteractionLog
from src.care.models.system_params import SystemParams
from src.care.scoring.compatibility import compatibility_score
from src.care.scoring.dynamic import dynamic_score
from src.care.scoring.human_adjustment import human_adjustment
from src.care.ranking.diversity import group_by_bucket, interleave_with_quotas


async def rank_candidates(
    user: UserProfile,
    candidates: List[CandidateProfile],
    interaction_logs: Optional[Dict[str, InteractionLog]] = None,
    limit: int = 20,
    params: SystemParams = None,
    apply_safety_filters: bool = True,
    strict: bool = True,
    mode: str = "suggested"
) -> List[Dict]:
    """
    Rank candidates for a user with diversity quotas.
    
    Phase 2 implementation: Combines compatibility, dynamic, and human-centric scoring.
    
    Args:
        user: User profile
        candidates: List of candidate profiles to rank
        interaction_logs: Dictionary mapping candidate_id -> InteractionLog (optional)
        limit: Maximum number of candidates to return
        params: System parameters (optional)
    
    Returns:
        List of dicts with 'candidate_id', 'candidate', 'score', and 'bucket' keys,
        sorted by final ranking
    """
    if params is None:
        params = SystemParams()
    
    if interaction_logs is None:
        interaction_logs = {}
    
    # Score all candidates using all three components
    scored = []
    for candidate in candidates:
        # 1. Compatibility score (60%)
        compat = await compatibility_score(user, candidate, params, strict=strict)
        
        # 2. Dynamic score (30%)
        candidate_id = str(candidate.id)
        interaction_log = interaction_logs.get(candidate_id)
        dyn = dynamic_score(str(user.id), candidate, interaction_log, params)
        
        # 3. Human adjustment (10%)
        human = human_adjustment(candidate, params)
        
        # Combine with weights
        total = (
            params.weights.compat * compat +
            params.weights.dynamic * dyn +
            params.weights.human * human
        )
        
        # Clamp to [0, 1]
        final_score = max(0.0, min(1.0, total))
        
        # Apply Boost multiplier if candidate has active boost
        boost_multiplier = 1.0
        if hasattr(candidate, 'boost_expires_at') and candidate.boost_expires_at:
            from datetime import datetime
            if candidate.boost_expires_at > datetime.utcnow():
                boost_multiplier = 3.0  # Boost multiplier
                final_score = min(1.0, final_score * boost_multiplier)  # Cap at 1.0
        
        scored.append({
            'candidate_id': candidate_id,
            'candidate': candidate,
            'score': final_score,
            'compat_score': compat,
            'dynamic_score': dyn,
            'human_adjustment': human,
            'boost_active': boost_multiplier > 1.0,
            'bucket': None  # Will be set during bucketing
        })
    
    # Group by popularity bucket
    buckets = group_by_bucket(scored)
    
    # Determine sorting order based on mode
    # For 'opposites', we want lower scores first during interleaving
    descending = mode != "opposites"
    
    # Apply diversity quotas
    ranked = interleave_with_quotas(
        buckets,
        params.diversity.bucket_sizes,
        limit,
        descending=descending
    )
    
    # Add bucket info to results
    from src.care.ranking.diversity import get_popularity_bucket
    for item in ranked:
        item['bucket'] = get_popularity_bucket(item['candidate'])
    
    return ranked


async def cold_start_recommendations(
    user: UserProfile,
    all_candidates: List[CandidateProfile],
    params: SystemParams = None,
    strict: bool = True,
    mode: str = "suggested"
) -> List[Dict]:
    """
    Generate recommendations for users with no interaction history.
    
    Uses compatibility + proximity + diversity only.
    
    Args:
        user: User profile
        all_candidates: All available candidates
        params: System parameters (optional)
    
    Returns:
        Ranked list of candidates
    """
    if params is None:
        params = SystemParams()
    
    # Filter by distance
    from src.care.utils.geo import haversine_distance
    nearby_candidates = [
        c for c in all_candidates
        if haversine_distance(user.location, c.location) <= user.max_distance_km
    ]
    
    # If not enough nearby, expand search
    if len(nearby_candidates) < params.cold_start_recommendation_count:
        # Sort all by distance and take closest
        all_with_distance = [
            (c, haversine_distance(user.location, c.location))
            for c in all_candidates
        ]
        all_with_distance.sort(key=lambda x: x[1])
        nearby_candidates = [
            c for c, _ in all_with_distance[:params.cold_start_recommendation_count * 2]
        ]
    
    # Rank using compatibility
    return await rank_candidates(
        user,
        nearby_candidates,
        limit=params.cold_start_recommendation_count,
        params=params,
        strict=strict,
        mode=mode
    )
