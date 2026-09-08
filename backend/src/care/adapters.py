"""
CARE Engine integration adapters.

Converts between ReTh's existing models and CARE Engine models.
"""

from typing import List, Dict, Optional
from src.care.models.user_profile import UserProfile
from src.care.models.candidate_profile import CandidateProfile, PopularitySignals, AuthenticitySignals
from src.care.models.interaction_log import InteractionLog, UserAction, ActionType, AggregateFeatures


def profile_to_user_profile(profile, user) -> UserProfile:
    """
    Convert ReTh Profile + User to CARE UserProfile.
    
    Args:
        profile: ReTh Profile model
        user: ReTh User model
    
    Returns:
        CARE UserProfile
    """
    # Extract location coordinates
    location = (0.0, 0.0)
    if profile.location and profile.location.coordinates:
        # MongoDB stores as [lng, lat], we need (lat, lng)
        location = (profile.location.coordinates[1], profile.location.coordinates[0])
    
    # Extract age range from preferences
    age_range = (18, 100)
    if hasattr(profile, 'age_preference_min') and hasattr(profile, 'age_preference_max'):
        age_range = (profile.age_preference_min or 18, profile.age_preference_max or 100)
    
    return UserProfile(
        id=profile.user_id,
        age=profile.age,
        gender=profile.gender,
        gender_category=getattr(profile, 'gender_category', 'traditional'),
        sexual_orientation=getattr(profile, 'sexual_orientation', None),
        attraction_preferences=getattr(profile, 'attraction_preferences', []),
        orientation_preferences=getattr(profile, 'orientation_preferences', []),
        preferred_age_range=age_range,
        location=location,
        max_distance_km=profile.distance_preference_km or 50,
        interests=profile.lifestyle_interests or profile.interests or [],
        values=profile.core_values or [],
        lifestyle=profile.lifestyle_mode,
        narrative_style=None,  # TODO: Add to Profile model
        height_relevant=getattr(profile, 'height_relevant', True),
        height_preferences=getattr(profile, 'height_preferences', []),
        relationship_goals=getattr(profile, 'relationship_goals', []),
        communication_style=getattr(profile, 'communication_style', None),
        love_language=getattr(profile, 'love_language', None),
        city=getattr(profile.location, 'city', None) if profile.location else None,
        state=getattr(profile.location, 'state', None) if profile.location else None,
        country=getattr(profile.location, 'country', None) if profile.location else None,
        search_states=getattr(profile, 'search_states', []),
        search_countries=getattr(profile, 'search_countries', []),
        excluded_states=getattr(profile, 'excluded_states', []),
        excluded_countries=getattr(profile, 'excluded_countries', []),
        education_center=getattr(profile, 'education_center', None),
        education_level=getattr(profile, 'education_level', None),
        occupation=getattr(profile, 'occupation', None),
        work_company=getattr(profile, 'work_company', None),
        show_professional_only_matches=getattr(profile, 'show_professional_only_matches', False),
        user_plan=getattr(user, 'subscription_tier', 'free'),
        
        # New Expanded Blocks
        personality_traits=list(filter(None, [
            getattr(profile, 'social_style', None),
            getattr(profile, 'processing_style', None),
            getattr(profile, 'decision_making', None)
        ])),
        neurodiversity=getattr(profile, 'neurodiversity', []),
        languages=getattr(profile, 'languages', []),
        anthem=profile.mi_himno.model_dump() if profile.mi_himno else None,
        feeling_curious=getattr(profile, 'feeling_curious', False)
    )


def profile_to_candidate_profile(profile, user, signals: Dict = None) -> CandidateProfile:
    """
    Convert ReTh Profile + User to CARE CandidateProfile.
    
    Args:
        profile: ReTh Profile model
        user: ReTh User model
        signals: Optional pre-computed signals dict
    
    Returns:
        CARE CandidateProfile
    """
    # Extract location
    location = (0.0, 0.0)
    if profile.location and profile.location.coordinates:
        location = (profile.location.coordinates[1], profile.location.coordinates[0])
    
    # Get signals or use defaults
    if signals is None:
        signals = {
            'activity_score': 0.5,
            'responsiveness_score': 0.5,
            'popularity_signals': {},
            'authenticity_signals': {}
        }
    
    # Narrative Analysis (New in Phase 2)
    from src.care.scoring.compatibility import calculate_narrative_context
    narrative_ctx = calculate_narrative_context(profile.bio, getattr(profile, 'prompts', []))
    
    return CandidateProfile(
        id=profile.user_id,
        age=profile.age,
        gender=profile.gender,
        gender_category=getattr(profile, 'gender_category', 'traditional'),
        sexual_orientation=getattr(profile, 'sexual_orientation', None),
        attraction_preferences=getattr(profile, 'attraction_preferences', []),
        orientation_preferences=getattr(profile, 'orientation_preferences', []),
        location=location,
        interests=profile.lifestyle_interests or profile.interests or [],
        values=profile.core_values or [],
        lifestyle=profile.lifestyle_mode,
        narrative_style=None,
        height_label=getattr(profile, 'height_label', None),
        relationship_goals=getattr(profile, 'relationship_goals', []),
        communication_style=getattr(profile, 'communication_style', None),
        love_language=getattr(profile, 'love_language', None),
        city=getattr(profile.location, 'city', None) if profile.location else None,
        state=getattr(profile.location, 'state', None) if profile.location else None,
        country=getattr(profile.location, 'country', None) if profile.location else None,
        photo_tags=[],  # TODO: Extract from photos
        bio_tags=[],    # TODO: Extract from bio
        excluded_states=getattr(profile, 'excluded_states', []),
        excluded_countries=getattr(profile, 'excluded_countries', []),
        
        # Narrative context
        narrative_tone=narrative_ctx["tone"],
        highlighted_fragments=narrative_ctx["highlights"],
        
        education_center=getattr(profile, 'education_center', None),
        education_level=getattr(profile, 'education_level', None),
        occupation=getattr(profile, 'occupation', None),
        work_company=getattr(profile, 'work_company', None),
        
        activity_score=signals.get('activity_score', 0.5),
        responsiveness_score=signals.get('responsiveness_score', 0.5),
        popularity_signals=PopularitySignals(**signals.get('popularity_signals', {})),
        authenticity_signals=AuthenticitySignals(**signals.get('authenticity_signals', {})),
        
        # New Expanded Blocks
        personality_traits=list(filter(None, [
            getattr(profile, 'social_style', None),
            getattr(profile, 'processing_style', None),
            getattr(profile, 'decision_making', None)
        ])),
        neurodiversity=getattr(profile, 'neurodiversity', []),
        languages=getattr(profile, 'languages', []),
        anthem=profile.mi_himno.model_dump() if profile.mi_himno else None
    )


def match_to_interaction_log(matches: List, user_id: str) -> Dict[str, InteractionLog]:
    """
    Convert ReTh Match records to CARE InteractionLog.
    
    Args:
        matches: List of ReTh Match models
        user_id: Current user ID
    
    Returns:
        Dictionary mapping candidate_id -> InteractionLog
    """
    logs = {}
    
    for match in matches:
        # Determine candidate ID and interaction
        if match.user_id_1 == user_id:
            candidate_id = match.user_id_2
            interaction = match.user_1_interaction
        else:
            candidate_id = match.user_id_1
            interaction = match.user_2_interaction
        
        if interaction is None:
            continue
        
        # Map ReTh InteractionType to CARE ActionType
        action_type_map = {
            'like': ActionType.LIKE,
            'pass': ActionType.NOPE,
            'superlike': ActionType.SUPER_LIKE
        }
        
        action_type = action_type_map.get(interaction.lower(), ActionType.VIEW)
        
        # Create action
        action = UserAction(
            type=action_type,
            timestamp=match.created_at,
            dwell_time_ms=None,
            metadata={}
        )
        
        # Add to log
        if candidate_id not in logs:
            logs[candidate_id] = InteractionLog(
                user_id=user_id,
                candidate_id=candidate_id,
                actions=[action]
            )
        else:
            logs[candidate_id].actions.append(action)
    
    return logs
