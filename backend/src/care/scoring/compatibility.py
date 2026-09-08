"""
Compatibility scoring for CARE Engine.

Calculates profile-level compatibility based on:
- Age preferences
- Shared interests and values
- Lifestyle compatibility
- Narrative style match
- Geographic proximity
"""

from typing import Set, Dict, Optional, List
from src.care.models.user_profile import UserProfile
from src.care.models.candidate_profile import CandidateProfile
from src.care.models.system_params import SystemParams
from src.care.utils.geo import haversine_distance, proximity_decay
from src.care.utils.tags import normalize_length
from src.data.lifestyle_categories import LIFESTYLE_CATEGORIES


async def get_compatibility_weights() -> Dict[str, float]:
    """
    Fetch active compatibility weights from database.
    Returns a dictionary of normalized weights (0.0 - 1.0).
    """
    from src.models.algorithm_management import AlgorithmFactor, AlgorithmType, FactorStatus
    
    factors = await AlgorithmFactor.find(
        AlgorithmFactor.algorithm_type == AlgorithmType.COMPATIBILITY,
        AlgorithmFactor.status == FactorStatus.ACTIVE
    ).to_list()
    
    # Defaults based on seed data if DB is empty
    defaults = {
        "Intereses Musicales": 0.25,
        "Metas de Relación": 0.20,
        "Lenguaje del Amor": 0.15,
        "Estilo de Comunicación": 0.15,
        "Valores": 0.25
    }
    
    if not factors:
        return defaults
        
    return {f.name: f.weight / 100.0 for f in factors}


async def compatibility_score(
    user: UserProfile,
    candidate: CandidateProfile,
    params: SystemParams = None,
    weights: Dict[str, float] = None,
    strict: bool = True
) -> float:
    """
    Calculate compatibility score across 9 functional blocks.
    """
    if params is None:
        params = SystemParams()
    
    if weights is None:
        weights = await get_compatibility_weights()
    
    # 1. Identity & Attraction (CRITICAL FILTER + Weight)
    identity_compat = calculate_identity_block_compatibility(user, candidate, strict=strict)
    if identity_compat == 0.0:
        return 0.0  # Safe stop if no mutual attraction
        
    score = 0.0
    
    # 1. Interests (Categorized) - Weighted as block
    interests_score = calculate_interests_compatibility(user.interests, candidate.interests)
    score += interests_score * weights.get("Intereses", 0.15)
    
    # 2. Identity Block (Atracción y respeto)
    score += identity_compat * weights.get("Identidad", 0.15)
    
    # 3. Relationship Goals (Expectativas)
    intent_score = calculate_intent_compatibility(
        user.relationship_goals,
        candidate.relationship_goals
    )
    score += intent_score * weights.get("Metas de Relación", 0.15)
    
    # 4. Personality Traits (Complementariedad)
    personality_score = calculate_personality_compatibility(user.personality_traits, candidate.personality_traits)
    score += personality_score * weights.get("Personalidad", 0.10)
    
    # 5. Neurodiversity & Health (Cuidado mutuo)
    neuro_score = calculate_neuro_compatibility(user.neurodiversity, candidate.neurodiversity)
    score += neuro_score * weights.get("Neurodiversidad", 0.10)
    
    # 6. Location & Scope (Logístico)
    # Proximity is handled as a contextual tone, but we add a small logistical weight
    from src.care.utils.geo import haversine_distance
    distance_km = haversine_distance(user.location, candidate.location)
    loc_score = calculate_location_logistical_score(user, candidate, distance_km)
    score += loc_score * weights.get("Ubicación", 0.05)
    
    # 7. Languages (Comunicación)
    lang_score = calculate_languages_compatibility(user, candidate)
    score += lang_score * weights.get("Idiomas", 0.05)
    
    # 8. Professional & Academic (Contexto - Contextual boost)
    prof_score = calculate_professional_compatibility(user, candidate)
    score += prof_score * weights.get("Profesional", 0.05)
    
    # 9. My Anthem (Emocional)
    anthem_score = calculate_anthem_compatibility(user.anthem, candidate.anthem)
    score += anthem_score * weights.get("Himno", 0.05)
    
    # Extra factors (Communication Style, Love Language - Mixed into blocks)
    ll_score = calculate_love_language_compatibility(user.love_language, candidate.love_language)
    cs_score = calculate_communication_style_compatibility(user.communication_style, candidate.communication_style)
    score += (ll_score * 0.05) + (cs_score * 0.05)
    
    # Clamp and return
    return max(0.0, min(1.0, score))


async def compatibility_breakdown(
    user: UserProfile,
    candidate: CandidateProfile,
    params: SystemParams = None
) -> Dict[str, float]:
    """
    Calculate compatibility breakdown between user and candidate.
    Returns individual component scores (0-1).
    """
    if params is None:
        params = SystemParams()
        
    # Interest score
    interests_score = calculate_interests_compatibility(user.interests, candidate.interests)
    
    # Values score
    values_score = calculate_values_compatibility(user.values, candidate.values)
    
    # Identity & Attraction
    identity_compat = calculate_sexual_identity_compatibility(user, candidate)
    identity_ctx = calculate_identity_context(user, candidate)
    
    # Intent score
    intent_score = calculate_intent_compatibility(
        user.relationship_goals,
        candidate.relationship_goals
    )
    
    # Love Language score
    ll_score = calculate_love_language_compatibility(
        user.love_language,
        candidate.love_language
    )

    # Comm Style score
    cs_score = calculate_communication_style_compatibility(
        user.communication_style,
        candidate.communication_style
    )

    # Proximity (KM only)
    from src.care.utils.geo import haversine_distance
    distance_km = haversine_distance(user.location, candidate.location)
    
    # Height score
    height_score = calculate_height_compatibility(user, candidate)
    
    # Professional score
    prof_score = calculate_professional_compatibility(user, candidate)
    prof_ctx = calculate_professional_context(user, candidate)
    
    # Calculate Location Context (Tone & Scenario - No influence on pure score)
    location_ctx = calculate_location_context(user, candidate, distance_km)
    
    return {
        "interests": interests_score,
        "values": values_score,
        "identity_compatibility": identity_compat,
        "identity_context": identity_ctx,
        "intent": intent_score,
        "love_language": ll_score,
        "communication_style": cs_score,
        "lifestyle": 1.0 if user.lifestyle == candidate.lifestyle else 0.5 if (user.lifestyle and candidate.lifestyle) else 0.0,
        "proximity_km": distance_km,
        "height_compatibility": height_score,
        "professional_compatibility": prof_score,
        "professional_advice": prof_ctx["advice"],
        "professional_tone": prof_ctx["tone"],
        "scenario_label": location_ctx["scenario_label"],
        "connection_tone": location_ctx["tone"],
        "context_advice": location_ctx["advice"]
    }

def calculate_location_context(user: UserProfile, candidate: CandidateProfile, distance_km: float) -> Dict:
    """
    Determines the geographic context of the match.
    Provides tone and scenario advice without affecting the numerical score.
    """
    ctx = {
        "tone": "virtual", 
        "scenario_label": "Global",
        "advice": "Su conexión puede crecer virtualmente."
    }
    
    # 1. Close Proximity (Local/Intimate)
    if distance_km <= 50:
        ctx["tone"] = "intimate"
        if distance_km <= 15:
            ctx["scenario_label"] = "Cerca de ti"
            ctx["advice"] = "Ambos están muy cerca. ¡Ideal para un café inesperado!"
        else:
            ctx["scenario_label"] = "Local"
            ctx["advice"] = "Cercanía local. Encuentros presenciales son probables."
    
    # 2. Regional/National Scenarios (Emotional Focus)
    elif user.state and candidate.state and user.state == candidate.state:
        ctx["scenario_label"] = f"Regional ({user.state})"
        ctx["tone"] = "regional"
        ctx["advice"] = f"Identidad regional compartida en {user.state}. Latidos en la misma sintonía geográfica."

    elif user.country and candidate.country and user.country == candidate.country:
        ctx["scenario_label"] = f"Nacional ({user.country})"
        ctx["tone"] = "national"
        ctx["advice"] = f"Un mismo horizonte en {user.country}. El vínculo trasciende la distancia con intención nacional."

    # 3. International (Exploratory Intent)
    elif user.location_scope and user.location_scope.get("mode") == "continent":
        ctx["scenario_label"] = f"Continental ({user.location_scope.get('selected_continent', 'Global')})"
        ctx["tone"] = "universal"
        ctx["advice"] = "Intención expansiva y conexión universal. Tu amor no conoce fronteras dentro de este continente."
    
    elif user.search_countries and (candidate.country in user.search_countries or "Todos" in user.search_countries):
        ctx["scenario_label"] = "Internacional"
        ctx["tone"] = "exploratory"
        ctx["advice"] = "Intención selectiva y enfocada. Una conexión sin fronteras que desafía la distancia con emoción pura."
            
    return ctx

def calculate_narrative_context(bio: Optional[str], prompts: Optional[List[dict]] = None) -> Dict:
    """
    Analyzes profile content (bio and prompts) to detect tone and key fragments.
    Used for Blind Mode narratives and interaction modulation.
    """
    content = bio or ""
    if prompts:
        for p in prompts:
            content += f" {p.get('answer', '')}"
    
    # 1. Detect Tone based on keywords
    tone = "curioso" # Default
    
    deep_keywords = ["sentir", "alma", "paz", "profundo", "vida", "ser", "conexión", "universo"]
    playful_keywords = ["jugar", "risa", "loco", "diversión", "baile", "fiesta", "aventura", "disfrutar"]
    intellectual_keywords = ["lectura", "ciencia", "tecnología", "aprender", "datos", "análisis", "libros"]
    
    deep_count = sum(1 for w in deep_keywords if w in content.lower())
    playful_count = sum(1 for w in playful_keywords if w in content.lower())
    intellectual_count = sum(1 for w in intellectual_keywords if w in content.lower())
    
    if deep_count > playful_count and deep_count > intellectual_count:
        tone = "profundo"
    elif playful_count > intellectual_count:
        tone = "lúdico"
    elif intellectual_count > 0:
        tone = "curioso"
        
    # 2. Extract Highlights (short punchy sentences)
    import re
    sentences = re.split(r'[.!?]\s+', content)
    highlights = [s.strip() for s in sentences if 20 < len(s) < 80]
    
    return {
        "tone": tone,
        "highlights": highlights[:3] # Max 3 fragments
    }

def calculate_intent_compatibility(user_goals: list, candidate_goals: list) -> float:
    """
    Calculate compatibility between relationship goals/intentions.
    Based on the blueprint for flexible/emotional matching.
    """
    if not user_goals or not candidate_goals:
        return 0.5  # Neutral if data missing
        
    # Flatten/Simplify goals for comparison
    u_goals = set(user_goals)
    c_goals = set(candidate_goals)
    
    # 1. Direct Match (Any shared goal)
    shared = u_goals & c_goals
    if shared:
        return 1.0
        
    # 2. Flexible Connectivity
    # SERIOUS matched with "OPEN_SERIOUS" (Relación, pero no me cierro)
    serious_pair = {"serious_relationship", "open_relationship"} # 💕 is value "open_relationship" in options
    if (u_goals & serious_pair) and (c_goals & serious_pair):
        return 0.75
        
    # FUN matched with "OPEN_FUN" (Diversión, pero no me cierro)
    # Note: option values are: serious_relationship, open_relationship (💕), casual_fun (😎), short_term_fun (🍻)
    # 🍻 is short_term_fun (Relación abierta in blueprint, but might be beers icon in code)
    fun_pair = {"casual_fun", "short_term_fun"} 
    if (u_goals & fun_pair) and (c_goals & fun_pair):
        return 0.75
        
    # 3. Exploratory connectivity
    if "undecided" in u_goals or "undecided" in c_goals:
        return 0.5
        
    # 4. Drastic mismatch (e.g., serious vs casual with no "open" middle ground)
    return 0.2


def calculate_height_compatibility(user: UserProfile, candidate: CandidateProfile) -> float:
    """
    Calculate compatibility based on height preferences.
    If 'none' (Todas las alturas) is selected, returns 1.0.
    """
    if not user.height_relevant:
        return 1.0
        
    prefs = user.height_preferences or []
    if not prefs or "none" in prefs:
        return 1.0
        
    candidate_label = candidate.height_label or "average"
    if candidate_label in prefs:
        return 1.0
        
    return 0.3 # Partial match/minor penalty if not in preferred range


def calculate_professional_compatibility(user: UserProfile, candidate: CandidateProfile) -> float:
    """
    Calculate compatibility based on professional/academic matches.
    Does NOT ponder by default. Only returns a score (0 to 1.0) if matches exist.
    Used as context for CARE and optional boost.
    """
    matches = 0
    total_checks = 0
    
    # 1. University Match
    if user.education_center and candidate.education_center:
        total_checks += 1
        if user.education_center.lower().strip() == candidate.education_center.lower().strip():
            matches += 1
            
    # 2. Company Match
    if user.work_company and candidate.work_company:
        total_checks += 1
        if user.work_company.lower().strip() == candidate.work_company.lower().strip():
            matches += 1
            
    # 3. Education Level Match (Optional, high-level alignment)
    if user.education_level and candidate.education_level:
        if user.education_level == candidate.education_level:
            # Only count as match if it's a specific high level (e.g., Master, PhD) 
            # or if both explicitly value it (placeholder logic)
            # For now, let's treat it as a weak match
            matches += 0.5
            total_checks += 1

    if total_checks == 0:
        return 0.0
        
    return min(1.0, matches / total_checks if total_checks > 0 else 0)


def calculate_professional_context(user: UserProfile, candidate: CandidateProfile) -> Dict:
    """
    Determines the professional context for CARE insights.
    """
    ctx = {"tone": "neutral", "advice": None}
    
    # 1. Exact matches for conversation starters
    if user.education_center and candidate.education_center and user.education_center.lower().strip() == candidate.education_center.lower().strip():
        ctx["tone"] = "academic"
        ctx["advice"] = f"Ambos estudiaron en {user.education_center}. ¡Un excelente punto de partida!"
    elif user.work_company and candidate.work_company and user.work_company.lower().strip() == candidate.work_company.lower().strip():
        ctx["tone"] = "professional"
        ctx["advice"] = f"Comparten entorno en {user.work_company}. Tienen mundos profesionales en común."
    elif user.occupation and candidate.occupation and user.occupation.lower().strip() == candidate.occupation.lower().strip():
        ctx["tone"] = "professional"
        ctx["advice"] = f"Ambos se dedican a {user.occupation}. Su lenguaje profesional fluye en la misma sintonía."
        
    return ctx


def calculate_sexual_identity_compatibility(user: UserProfile, candidate: CandidateProfile, strict: bool = True) -> float:
    """
    Validates mutual attraction between user and candidate.
    Returns 1.0 if both attract each other, 0.0 otherwise.
    Includes both Gender and Sexual Orientation preferences.
    """
    GENDER_MAPPING = {
        "male": ["male", "Masculino", "Man", "Hombre"],
        "female": ["female", "Femenino", "Woman", "Mujer"],
        "non_binary": ["non_binary", "No binario", "Other", "Otro", "No-binario"],
        "Masculino": ["male", "Masculino", "Man", "Hombre"],
        "Femenino": ["female", "Femenino", "Woman", "Mujer"],
        "No binario": ["non_binary", "No binario", "Other", "Otro", "No-binario"],
    }
    
    def are_genders_compatible(u_pref: List[str], c_gender: str) -> bool:
        if not u_pref: return True
        # Check if candidate gender or any of its aliases are in user preferences
        u_pref_norm = []
        for p in u_pref:
            u_pref_norm.extend(GENDER_MAPPING.get(p, [p]))
        
        c_aliases = GENDER_MAPPING.get(c_gender, [c_gender])
        return any(a in u_pref_norm for a in c_aliases)

    # 1. Does user attract candidate?
    user_attracted = False
    if not user.attraction_preferences:
        # Fallback to orientation
        orientation = (user.sexual_orientation or "").lower()
        if orientation == "heterosexual":
            user_attracted = (user.gender.lower() != candidate.gender.lower())
        else:
            user_attracted = True
    else:
        user_attracted = are_genders_compatible(user.attraction_preferences, candidate.gender)

    # 2. Does candidate attract user?
    candidate_attracted = False
    if not hasattr(candidate, 'attraction_preferences') or not candidate.attraction_preferences:
        candidate_attracted = True # Assume true for compatibility if missing
    else:
        candidate_attracted = are_genders_compatible(candidate.attraction_preferences, user.gender)

    if not strict:
        return 1.0 if user_attracted else 0.0
        
    return 1.0 if (user_attracted and candidate_attracted) else 0.0


def calculate_identity_context(user: UserProfile, candidate: CandidateProfile) -> Dict:
    """
    Modulates CARE tone based on gender categories and sexual orientation.
    """
    # Get categories (fall back to traditional if missing)
    u_cat = user.gender_category or "traditional"
    c_cat = candidate.gender_category or "traditional"
    u_orient = (user.sexual_orientation or "").lower()
    c_orient = (candidate.sexual_orientation or "").lower()
    
    # Combined category and orientation sets
    cats = {u_cat, c_cat}
    orients = {u_orient, c_orient}
    
    ctx = {
        "tone": "direct",
        "description": "Tu identidad forma parte de tu camino. CARE la usa para conectar con respeto y afinidad."
    }
    
    # 1. Asexual/Demisexual -> emotional (tono lento, emocional)
    if "asexual" in orients or "demisexual" in orients:
        ctx["tone"] = "emotional"
        ctx["description"] = "Vínculos que crecen desde el alma. CARE prioriza la conexión emocional y el ritmo personal de su vínculo."
        
    # 2. Pansexual/Queer -> curious (tono abierto, curioso)
    elif "pansexual" in orients or "queer" in orients:
        ctx["tone"] = "curious"
        ctx["description"] = "Amor sin etiquetas ni fronteras. CARE celebra la diversidad y la apertura de su conexión."

    # 3. Individual Experience -> introspective (tono narrativo, introspectivo)
    elif "experience-based" in cats:
        ctx["tone"] = "introspective"
        ctx["description"] = "Identidades que cuentan historias únicas. CARE modula un tono introspectivo y creativo para su exploración mutua."

    # 4. Trans-spectrum -> inclusive (tono inclusivo, afirmativo)
    elif "trans-spectrum" in cats:
        ctx["tone"] = "inclusive"
        ctx["description"] = "Identidades afirmativas e inclusivas. CARE garantiza un espacio seguro y respetuoso para ambos."

    # 5. Non-binary/Microlabels -> exploratory (tono explorador, respetuoso)
    elif "non-binary" in cats or "microlabels" in cats:
        ctx["tone"] = "exploratory"
        ctx["description"] = "Explorando la diversidad del ser. CARE conecta sus identidades con curiosidad respetuosa y afinidad moderna."

    # 6. Traditional -> classic (tono directo, clásico)
    elif "traditional" in cats and len(cats) == 1:
        ctx["tone"] = "classic"
        ctx["description"] = "Una conexión directa y auténtica basada en sus esencias tradicionales."
        
    return ctx


def calculate_love_language_compatibility(u_ll: Optional[str], c_ll: Optional[str]) -> float:
    """
    Calculate compatibility between love languages.
    """
    if not u_ll or not c_ll:
        return 0.5
    
    if u_ll == c_ll:
        return 1.0
    
    # Compatible/Complimentary pairs
    complimentary = [
        ({"words_of_affirmation", "physical_touch"}),
        ({"quality_time", "acts_of_service"}),
        ({"gifts", "acts_of_service"})
    ]
    
    for pair in complimentary:
        if u_ll in pair and c_ll in pair:
            return 0.75
            
    return 0.3


def calculate_communication_style_compatibility(u_cs: Optional[str], c_cs: Optional[str]) -> float:
    """
    Calculate compatibility between communication styles.
    """
    if not u_cs or not c_cs:
        return 0.5
        
    if u_cs == c_cs:
        return 1.0
            
    # Texting + Bad Texter (Patience scenario)
    if (u_cs == "texting" and c_cs == "bad_texter") or (u_cs == "bad_texter" and c_cs == "texting"):
        return 0.5
        
    # Visual/Presence synergy
    visual_presence = {"video_call", "in_person"}
    if u_cs in visual_presence and c_cs in visual_presence:
        return 0.8
        
    return 0.4


def calculate_shared_tags(user_tags: List[str], candidate_tags: List[str]) -> set:
    """Calculate shared tags between two lists."""
    return set(user_tags or []) & set(candidate_tags or [])

def calculate_interests_compatibility(user_interests: List[str], candidate_interests: List[str]) -> float:
    """
    Calculate compatibility based on interests using category-aware logic.
    Follows the 'Positive-Only Summation' principle.
    """
    return calculate_category_aware_score(user_interests, candidate_interests)

def calculate_values_compatibility(user_values: List[str], candidate_values: List[str]) -> float:
    """
    Calculate compatibility based on values using category-aware logic.
    """
    return calculate_category_aware_score(user_values, candidate_values, is_values_only=True)

def calculate_category_aware_score(
    user_tags: List[str], 
    cand_tags: List[str], 
    is_values_only: bool = False
) -> float:
    """
    Core logic for categorized compatibility scoring.
    - Weights: 'values_causes' = 3, others = 2.
    - Bonus: +1 per category with at least one match.
    - Normalization: Scale to [0, 1] based on a reference max score.
    """
    if not user_tags or not cand_tags:
        return 0.0
        
    user_set = set(user_tags)
    cand_set = set(cand_tags)
    
    total_raw_score = 0.0
    active_categories = 0
    
    for cat_id, cat_info in LIFESTYLE_CATEGORIES.items():
        # Optimization: If we are only checking values, skip other categories
        if is_values_only and cat_id != "values_causes":
            continue
        if not is_values_only and cat_id == "values_causes":
            # For now, keep values separate if is_values_only is false
            # unless we decide to merge them. The blueprint suggests they are related.
            continue
            
        cat_items = set(cat_info["items"])
        
        # Principle: Only count categories the user HAS filled
        user_cat = user_set & cat_items
        if not user_cat:
            continue
            
        active_categories += 1
        
        # Check if candidate also HAS this category
        cand_cat = cand_set & cat_items
        if not cand_cat:
            continue
            
        # Shared items in this category
        shared = user_cat & cand_cat
        if shared:
            weight = 3 if cat_id == "values_causes" else 2
            total_raw_score += len(shared) * weight
            total_raw_score += 1.0 # Bonus for category match
            
    if active_categories == 0:
        return 0.0
        
    # Normalization: Map to [0, 1]. 
    # A score of 20-30 reflects a very strong connection in interests.
    max_reference = 15.0 if is_values_only else 40.0
    return min(1.0, total_raw_score / max_reference)

def calculate_identity_block_compatibility(user: UserProfile, candidate: CandidateProfile, strict: bool = True) -> float:
    """
    Combines critical sexual attraction filters with identity respect weights.
    """
    sexual_compat = calculate_sexual_identity_compatibility(user, candidate, strict=strict)
    if sexual_compat == 0.0:
        return 0.0
        
    # Bonus for shared pronouns or gender categories (Afinidad identitaria)
    bonus = 0.0
    if user.gender_category == candidate.gender_category and user.gender_category != "traditional":
        bonus += 0.2
        
    return min(1.0, 0.8 + bonus)

def calculate_personality_compatibility(u_traits: List[str], c_traits: List[str]) -> float:
    """
    Calculate compatibility based on personality traits (Complementarity logic).
    """
    if not u_traits or not c_traits:
        return 0.5
        
    u_set = set(u_traits)
    c_set = set(c_traits)
    
    shared = u_set & c_set
    score = len(shared) * 0.2 # Affinity
    
    # Complementarity pairs (Introvert/Extrovert alignment)
    complementary = [
        ({"introvert", "extrovert"}),
        ({"analytical", "creative"}),
        ({"intense", "calm"})
    ]
    for pair in complementary:
        if (u_set & pair) and (c_set & pair) and not (u_set & c_set & pair):
            score += 0.3 # Complementarity bonus
            
    return min(1.0, score)

def calculate_neuro_compatibility(u_neuro: List[str], c_neuro: List[str]) -> float:
    """
    Calculate compatibility for neurodiversity/wellbeing.
    Prioritizes empathy and shared rhythms.
    """
    if not u_neuro and not c_neuro:
        return 1.0 # Default harmony
    
    if not u_neuro or not c_neuro:
        return 0.7 # Respectful distance
        
    shared = set(u_neuro) & set(c_neuro)
    if shared:
        return 1.0 # Deep understanding match
        
    return 0.8 # High potential for empathy

def calculate_location_logistical_score(user: UserProfile, candidate: CandidateProfile, dist_km: float) -> float:
    """Logistical viability of meeting."""
    if dist_km <= 20: return 1.0
    if dist_km <= 50: return 0.8
    if dist_km <= 150: return 0.5
    return 0.3

def calculate_languages_compatibility(user: UserProfile, candidate: CandidateProfile) -> float:
    """Booster for shared languages."""
    # Placeholder: assuming languages are stored in interests or tags for now
    # If explicit field exists in Profile (not in Pydantic yet), use it.
    return 0.5 # Neutral until field integration

def calculate_anthem_compatibility(u_anthem: Optional[Dict], c_anthem: Optional[Dict]) -> float:
    """Emotional resonance via music."""
    if not u_anthem or not c_anthem:
        return 0.5
        
    if u_anthem.get("artist") == c_anthem.get("artist"):
        return 1.0
        
    if u_anthem.get("spotify_id") == c_anthem.get("spotify_id"):
        return 1.0
        
    return 0.4
