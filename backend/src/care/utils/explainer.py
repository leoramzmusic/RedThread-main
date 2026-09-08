"""
Score explanation utility for CARE Engine.

Generates human-readable, positive explanations for match scores.
Never exposes raw metrics or numeric scores to users.
"""

from typing import List
from src.care.models.user_profile import UserProfile
from src.care.models.candidate_profile import CandidateProfile
from src.care.scoring.compatibility import (
    calculate_shared_tags, 
    calculate_intent_compatibility, 
    calculate_personality_compatibility
)
from src.data.lifestyle_categories import LIFESTYLE_CATEGORIES


def explain_score(
    user: UserProfile,
    candidate: CandidateProfile,
    score_breakdown: dict = None
) -> str:
    """
    Generate a human-readable explanation for why a candidate was recommended.
    
    Uses positive, narrative language. Never mentions numeric scores or metrics.
    
    Args:
        user: User profile
        candidate: Candidate profile
        score_breakdown: Optional dict with 'compat_score', 'dynamic_score', etc.
    
    Returns:
        Human-readable explanation string
    """
    reasons = []
    
    # 1. Interests & Values Analysis (Depth vs Rhythm)
    shared_interests = calculate_shared_tags(user.interests, candidate.interests)
    shared_values = calculate_shared_tags(user.values, candidate.values)
    
    depth_cats = {"values_causes", "wellness_lifestyle", "creativity"}
    rhythm_cats = {"social_media_content", "going_out", "tv_movies", "food_drink", "music"}
    
    depth_matches = []
    rhythm_matches = []
    
    for cat_id, cat_info in LIFESTYLE_CATEGORIES.items():
        cat_items = set(cat_info["items"])
        all_shared = (shared_interests | shared_values) & cat_items
        if all_shared:
            if cat_id in depth_cats:
                depth_matches.append(cat_info.get("name_es", cat_id))
            elif cat_id in rhythm_cats:
                rhythm_matches.append(cat_info.get("name_es", cat_id))
    
    if depth_matches:
        reasons.append("tienen una base sólida de propósito y sensibilidad compartida")
    if rhythm_matches and len(rhythm_matches) >= 2:
        reasons.append("comparten un ritmo vibrante en su flujo cotidiano y ocio")
    
    # Specific interest highlights
    if len(shared_interests) >= 2:
        top_interests = list(shared_interests)[:2]
        reasons.append(f"coinciden en pasiones como {top_interests[0]} y {top_interests[1]}")
    elif len(shared_interests) == 1:
        reasons.append(f"conectan a través de su interés por {list(shared_interests)[0]}")
    
    # 2. Shared lifestyle (Concrete)
    if getattr(user, 'lifestyle', None) and getattr(candidate, 'lifestyle', None):
        if user.lifestyle == candidate.lifestyle:
            reasons.append(f"tienen un estilo de vida similar ({user.lifestyle})")
    
    # 3. Relationship Goals (Intent)
    if user.relationship_goals and candidate.relationship_goals:
        intent_score = calculate_intent_compatibility(user.relationship_goals, candidate.relationship_goals)
        if intent_score >= 0.8:
            reasons.append("ambos buscan el mismo tipo de conexión y compromiso")
        elif intent_score >= 0.5:
            reasons.append("tienen una visión abierta y exploratoria sobre lo que buscan")
            
    # 4. Identity & Pride
    if user.gender_category == candidate.gender_category and user.gender_category != "traditional":
        reasons.append(f"comparten una identidad afirmativa ({user.gender_category})")
        
    # 5. Personality & Rhythms
    p_score = calculate_personality_compatibility(user.personality_traits, candidate.personality_traits)
    if p_score >= 0.6:
        reasons.append("sus personalidades se complementan en una sintonía natural")
        
    # 6. Neurodiversity & Empathy
    if user.neurodiversity and candidate.neurodiversity:
        shared_neuro = set(user.neurodiversity) & set(candidate.neurodiversity)
        if shared_neuro:
            reasons.append("comparten ritmos y formas de habitar el mundo")
        else:
            reasons.append("tienen una base de empatía para cuidar sus espacios y tiempos")
            
    # 7. Anthem (Soundtrack)
    if user.anthem and candidate.anthem:
        if user.anthem.get("artist") == candidate.anthem.get("artist"):
            reasons.append(f"ambos vibran con la música de {user.anthem.get('artist')}")
    
    # 8. High Activity (Positive & Social)
    if candidate.activity_score > 0.85:
        reasons.append("ambos suelen estar activos en Reth esta semana")
    
    # 4. Same location/zone
    from src.care.utils.geo import haversine_distance
    distance_km = haversine_distance(user.location, candidate.location)
    if distance_km < 3:
        reasons.append("se encuentran en la misma zona")
    
    # 5. New Discovery (Exploration context)
    if candidate.popularity_signals.likes_received < 10:
        reasons.append("es una sugerencia especial para descubrir conexiones nuevas")
    
    # Construct final message
    if not reasons:
        return "Te sugerimos esta conexión para descubrir nuevas personas."
    
    if len(reasons) == 1:
        return f"Te lo sugerimos porque {reasons[0]}."
    elif len(reasons) == 2:
        return f"Te lo sugerimos porque {reasons[0]} y {reasons[1]}."
    else:
        # Join first N-1 with commas, last with "y"
        main_reasons = ", ".join(reasons[:-1])
        return f"Te lo sugerimos porque {main_reasons} y {reasons[-1]}."


def get_match_highlights(
    user: UserProfile,
    candidate: CandidateProfile
) -> List[str]:
    """
    Get a list of highlight points for a match.
    
    Used for UI display (e.g., badges, chips).
    
    Args:
        user: User profile
        candidate: Candidate profile
    
    Returns:
        List of highlight strings
    """
    highlights = []
    
    # Shared interests & weights
    shared_interests = calculate_shared_tags(user.interests, candidate.interests)
    shared_values = calculate_shared_tags(user.values, candidate.values)
    
    if len(shared_interests) > 0:
        highlights.append(f"{len(shared_interests)} intereses comunes")
    
    if len(shared_values) > 0:
        highlights.append(f"{len(shared_values)} valores compartidos")
    
    # Nature of connection
    depth_cats = {"values_causes", "wellness_lifestyle", "creativity"}
    has_depth = any(set(LIFESTYLE_CATEGORIES[cat]["items"]) & (shared_interests | shared_values) for cat in depth_cats if cat in LIFESTYLE_CATEGORIES)
    if has_depth:
        highlights.append("Conexión profunda")
    
    # Proximity
    from src.care.utils.geo import haversine_distance
    distance_km = haversine_distance(user.location, candidate.location)
    if distance_km < 1:
        highlights.append("< 1 km")
    elif distance_km < 5:
        highlights.append(f"~{int(distance_km)} km")
    
    # High responsiveness
    if candidate.responsiveness_score > 0.8:
        highlights.append("Muy activo")
    
    return highlights
