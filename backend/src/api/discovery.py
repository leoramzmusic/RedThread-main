from fastapi import APIRouter, HTTPException, status, Depends, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from src.models.user import User, SubscriptionTier
from src.models.profile import Profile
from src.models.match import Match, InteractionType, MatchStatus
from src.api.auth import get_current_user
from src.services.affinity import AffinityService
from src.services.compatibility_service import CompatibilityService
from src.services.kafka_service import kafka_service
from src.services.kafka_topics import KafkaTopic, KafkaEventType
import random

# Import CARE Engine
from src.care.ranking.ranker import rank_candidates, cold_start_recommendations
from src.care.adapters import profile_to_user_profile, profile_to_candidate_profile, match_to_interaction_log
from src.care.utils.explainer import explain_score, get_match_highlights
from src.care.scoring.compatibility import compatibility_breakdown
from src.care.experiments.ab_testing import get_params_for_user, WEIGHT_EXPERIMENT
from src.care.experiments.safety_guards import ExposureTracker, HighPopularityLimiter, apply_safety_filters
from src.care.models.system_params import SystemParams

# Global CARE instances
exposure_tracker = ExposureTracker()
high_pop_limiter = HighPopularityLimiter(max_per_feed=3)


router = APIRouter()


# Request/Response Models
class SwipeRequest(BaseModel):
    target_user_id: str
    interaction: InteractionType
    dwell_time_ms: Optional[int] = None
    is_blind_mode: bool = False  # New field for Blind Mode interactions


class DiscoveryProfile(BaseModel):
    user_id: str
    nickname: str
    display_name: str
    age: int
    bio: Optional[str]
    photos: List[str]
    interests: List[str]
    affinity_score: float
    subscription_tier: Optional[str] = "free"
    affinity_breakdown: Optional[dict] = None
    distance_km: Optional[float] = None
    match_reason: Optional[str] = None
    match_highlights: Optional[List[str]] = None
    is_discovery: bool = False
    activity_score: Optional[float] = None
    responsiveness_score: Optional[float] = None
    is_blind: bool = False # New field to indicate if profile is in blind mode
    scenario_label: Optional[str] = None
    connection_tone: Optional[str] = None
    scenario_label: Optional[str] = None
    connection_tone: Optional[str] = None
    context_advice: Optional[str] = None
    show_age: bool = True
    show_location: bool = True
    is_curious: bool = False


class ReceivedLike(BaseModel):
    """Profile of someone who liked you"""
    match_id: str
    user_id: str
    display_name: str
    age: int
    bio: Optional[str]
    photos: List[str]
    interests: List[str]
    affinity_score: float
    is_superlike: bool
    liked_at: datetime


class SecondChanceProfile(BaseModel):
    """Profile you previously passed on"""
    match_id: str
    user_id: str
    display_name: str
    age: int
    bio: Optional[str]
    photos: List[str]
    interests: List[str]
    affinity_score: float
    passed_at: datetime


class SentLike(BaseModel):
    """Profile you liked recently"""
    match_id: str
    user_id: str
    display_name: str
    age: int
    photos: List[str]
    is_superlike: bool
    liked_at: datetime


@router.get("/queue", response_model=List[DiscoveryProfile])
async def get_discovery_queue(
    limit: int = 10,
    age_min: Optional[int] = None,
    age_max: Optional[int] = None,
    distance_km: Optional[float] = None,
    gender: Optional[str] = None,
    interest: Optional[str] = None,
    online: Optional[bool] = None,
    mode: Optional[str] = "suggested", # suggested | free | opposites | blind
    min_compatibility: Optional[int] = None, # 0-100
    max_compatibility: Optional[int] = None, # 0-100
    states: Optional[List[str]] = Query(None, alias="states[]"),
    countries: Optional[List[str]] = Query(None, alias="countries[]"),
    curiosity_mode: Optional[bool] = None,
    curiosity_genders: Optional[List[str]] = Query(None), # Transient curiosity genders
    only_high_compatibility: bool = False, # New filter for Sugeridos mode
    current_user: User = Depends(get_current_user)
):
    """Get discovery queue with affinity scores and filters"""
    
    try:
        # Get current user's profile
        my_profile = await Profile.find_one(Profile.user_id == str(current_user.id))
        
        if not my_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )
            
        # Handle Query objects if called directly in scripts
        if not isinstance(states, list): states = None
        if not isinstance(countries, list): countries = None
        if not isinstance(curiosity_genders, list): curiosity_genders = None
        
        # --- COMPLETENESS-BASED LOGIC ---
        # Don't force override mode to 'free', but track low completion to relax filters later.
        is_incomplete_profile = my_profile.profile_completion < 60
        if is_incomplete_profile:
             print(f"[DISCOVERY] User {current_user.id} has low completion ({my_profile.profile_completion}%), relaxing filters.")
        # ----------------------------------------
        
        def normalize_gender_list(genders: List[str]) -> List[str]:
            """Expand gender list to include both English enums and Spanish labels."""
            if not genders: return []
            mapping = {
                "male": ["male", "Masculino", "Man", "Hombre"],
                "female": ["female", "Femenino", "Woman", "Mujer"],
                "non_binary": ["non_binary", "No binario", "Other", "Otro", "No-binario"],
                "Masculino": ["male", "Masculino", "Man", "Hombre"],
                "Femenino": ["female", "Femenino", "Woman", "Mujer"],
                "No binario": ["non_binary", "No binario", "Other", "Otro", "No-binario"],
                "No-binario": ["non_binary", "No binario", "Other", "Otro", "No-binario"],
                "male": ["male", "Masculino", "Man", "Hombre"],
                "female": ["female", "Femenino", "Woman", "Mujer"]
            }
            result = set()
            for g in genders:
                result.add(g)
                if g in mapping:
                    result.update(mapping[g])
            return list(result)
        
        normalized_attraction = normalize_gender_list(my_profile.attraction_preferences or [])
        normalized_my_gender = normalize_gender_list([my_profile.gender] if my_profile.gender else [])
        
        print(f"[DEBUG] Starting get_discovery_queue for {current_user.id}")
        
        # Define active_curiosity
        active_curiosity = curiosity_mode if curiosity_mode is not None else my_profile.feeling_curious
        
        # --- CURIOSITY MODE OVERRIDE ---
        # If curiosity_mode is passed in query, sync it to profile if different
        if curiosity_mode is not None:
             if curiosity_mode != my_profile.feeling_curious:
                my_profile.feeling_curious = curiosity_mode
                await my_profile.save()
                print(f"[DISCOVERY] Synced curiosity_mode={curiosity_mode} to profile {current_user.id}")
             
             # Sync transient genders if provided
             if curiosity_genders is not None and active_curiosity:
                 # Update profile with these transient genders so they persist for the session/user state
                 # User requested "para escoger entre que generos le gustaria al usuario buscar temporalmente"
                 # It makes sense to save them so they stick if the user refreshes
                 if set(curiosity_genders) != set(my_profile.curiosity_genders):
                     my_profile.curiosity_genders = curiosity_genders
                     await my_profile.save()
                     print(f"[DISCOVERY] Synced curiosity_genders={curiosity_genders} to profile {current_user.id}")

        # -------------------------------

        existing_matches = await Match.find(
            {"$or": [
                {"user_id_1": str(current_user.id)},
                {"user_id_2": str(current_user.id)}
            ]}
        ).to_list()
        
        interacted_user_ids = set()
        for match in existing_matches:
            if match.user_id_1 == str(current_user.id):
                interacted_user_ids.add(match.user_id_2)
            else:
                interacted_user_ids.add(match.user_id_1)
        
        # Build query
        query = {
            "profile_visible": True,
            "show_me_in_discovery": True
        }
        
        # Exclude current user AND users already interacted with
        excluded_ids = list(interacted_user_ids) + [str(current_user.id)]
        query["user_id"] = {"$nin": excluded_ids}

        # CARE: Apply Gender/Orientation Mutual Match (Strict by default, relaxed in Libre/Incomplete)
        if my_profile.attraction_preferences:
            if active_curiosity:
                # RELAX Gender filter: Include user's preferred genders PLUS curiosity exploration genders
                exploration_genders = my_profile.curiosity_genders or []
                if exploration_genders:
                    combined_genders = normalize_gender_list(list(set(my_profile.attraction_preferences + exploration_genders)))
                    query["gender"] = {"$in": combined_genders}
                else:
                    pass 
            else:
                query["gender"] = {"$in": normalized_attraction}
            
        # Mutual interest: Candidate must be looking for user's gender
        from src.models.profile import Gender
        # RELAX: If in 'free' (Libre) mode, user gender is 'prefer_not_to_say', 
        # or Curiosity Mode is active, OR PROFILE IS INCOMPLETE, don't enforce candidate's attraction_preferences strictly.
        if mode != "free" and my_profile.gender != Gender.PREFER_NOT_TO_SAY and not active_curiosity and not is_incomplete_profile:
            # FIX: Allow if candidate has NO preference set (assumed bi/open) OR includes my gender
            query["$or"] = [
                {"attraction_preferences": {"$in": normalized_my_gender}},
                {"attraction_preferences": {"$exists": False}},
                {"attraction_preferences": []},
                {"attraction_preferences": None}
            ]


        # --- RELATIONSHIP STATUS FILTERING ---
        from src.models.profile import RelationshipStatus, IntentionType
        
        if my_profile.relationship_status not in [
            RelationshipStatus.SINGLE, 
            RelationshipStatus.PREFER_NOT_TO_SAY,
            RelationshipStatus.OPEN_RELATIONSHIP,
            RelationshipStatus.COMPLICATED,
            RelationshipStatus.DIVORCED,
            RelationshipStatus.WIDOWED
        ]:
            non_romantic_intentions = [
                IntentionType.FRIENDSHIP,
                IntentionType.PROJECTS,
                IntentionType.GAMING,
                IntentionType.CONVERSATION
            ]
            query["intentions"] = {"$in": non_romantic_intentions}
        
        # Apply age filters (Relaxed if feeling_curious)
        if age_min is not None:
            effective_min = max(18, age_min - 5) if active_curiosity else age_min
            query.setdefault("age", {})["$gte"] = effective_min
        if age_max is not None:
            effective_max = min(100, age_max + 5) if active_curiosity else age_max
            query.setdefault("age", {})["$lte"] = effective_max
        
        # Apply Distance Filter (Only if no specific states/countries are requested or if restricted by tier)
        # RELAX: If Curiosity Mode is active OR PROFILE IS INCOMPLETE, bypass radius filter here to allow more diversity.
        use_radius = distance_km and my_profile.location and my_profile.location.coordinates and not active_curiosity and not is_incomplete_profile
        
        # Determine allowed geo-filters by tier
        tier = current_user.subscription_tier
        allowed_states = states if tier in [SubscriptionTier.PREMIUM, SubscriptionTier.VIP] else None
        allowed_countries = countries if tier == SubscriptionTier.VIP else None

        # Apply Distance Filter
        if use_radius and not states and not countries:
            query["location"] = {
                "$near": {
                    "$geometry": {
                        "type": "Point",
                        "coordinates": my_profile.location.coordinates
                    },
                    "$maxDistance": distance_km * 1000 # Meters
                }
            }
        
        # Apply States/Countries Filter (Tier-Restricted)
        geo_filters = []
        
        # Parse States
        if states:
            # Handle "Todos" or "Todos:Country"
            actual_states = []
            for s in states:
                if s == "Todos":
                    base_country = my_profile.location.country if my_profile.location else None
                    if base_country:
                        geo_filters.append({"location.country": base_country})
                elif s.startswith("Todos:"):
                    country_name = s.split(":")[1]
                    geo_filters.append({"location.country": country_name})
                else:
                    actual_states.append(s)
            
            if actual_states:
                # If tier allows specific states
                if tier in [SubscriptionTier.PREMIUM, SubscriptionTier.VIP]:
                    geo_filters.append({"location.state": {"$in": actual_states}})
                else:
                    print(f"[DISCOVERY] Filter by states ignored for tier {tier}")

        # Parse Countries
        if countries:
            actual_countries = []
            for c in countries:
                if c == "Todos":
                    pass # Handled by state filter or just allowed all
                elif c.startswith("Todos:"):
                    # Doesn't make sense for country, but handle as country filter
                    country_name = c.split(":")[1]
                    actual_countries.append(country_name)
                else:
                    actual_countries.append(c)
            
            if actual_countries:
                if tier == SubscriptionTier.VIP:
                    geo_filters.append({"location.country": {"$in": actual_countries}})
                else:
                    print(f"[DISCOVERY] Filter by countries ignored for tier {tier}")
            
        if geo_filters:
            # If we have geo filters, proximity is secondary or ignored depending on logic
            if "$or" in query:
                query["$and"] = [{"$or": geo_filters}, {"$or": query.pop("$or")}]
            else:
                query["$or"] = geo_filters
            
            
        # Apply Language Filtering (New Feature)
        # If enabled, filter matches that speak at least one of my spoken languages.
        # If disabled (explicitly False), we do NOT filter, allowing intercultural discovery.
        # Default behavior (None) can be treated as True for safety or False for exploration. 
        # Given "auto_preferred_languages" defaults to True in frontend, we treat it as such.
        if my_profile.auto_preferred_languages and my_profile.languages:
            # Match users who have at least one language in common with my spoken languages
            query["languages"] = {"$in": my_profile.languages}
            
        # Apply gender/interest (Keep legacy support)
        if gender:
            query["gender"] = gender
        if interest:
             pass

        # Apply online filter
        online_user_ids = None
        if online:
            five_minutes_ago = datetime.utcnow() - timedelta(minutes=5)
            online_users = await User.find({
                "last_seen": {"$gte": five_minutes_ago}
            }).to_list()
            online_user_ids = {str(u.id) for u in online_users}
            if not online_user_ids: return []
            query["user_id"] = {"$in": list(online_user_ids), "$nin": list(interacted_user_ids or []) + [str(current_user.id)]}

        # --- CARE ENGINE RANKING ---
        # 1. Convert to CARE UserProfile
        user_profile = profile_to_user_profile(my_profile, current_user)
        
        # 2. Fetch candidate profiles
        print(f"[DEBUG] Query building done: {query}")
        candidate_profiles = await Profile.find(query).limit(limit * 3).to_list()
        print(f"[DEBUG] Found {len(candidate_profiles)} candidates")
        
        if not candidate_profiles:
            print(f"[DISCOVERY] No candidates found for query. Attempting FALLBACK with relaxed filters.")
            
            # FALLBACK QUERY: Minimal constraints to ensure visibility
            fallback_query = {
                "profile_visible": True,
                "show_me_in_discovery": True,
                "user_id": {"$nin": excluded_ids}
            }
            
            # Keep basic gender preference if set (otherwise show all)
            if my_profile.attraction_preferences:
                fallback_query["gender"] = {"$in": normalized_attraction}
                
            # Fetch again
            candidate_profiles = await Profile.find(fallback_query).limit(limit * 3).to_list()
            print(f"[DISCOVERY] Fallback found {len(candidate_profiles)} candidates")

        if not candidate_profiles:
            print(f"[DISCOVERY] Still no candidates found after fallback.")
            return []
            
        # 3. Convert to CARE CandidateProfiles
        candidates = []
        for profile in candidate_profiles:
            # For now use defaults, real signals will be batch-calculated
            candidate = profile_to_candidate_profile(profile, None)
            candidates.append(candidate)
            
        # 4. Get interaction logs for ranking
        interaction_logs_dict = match_to_interaction_log(existing_matches, str(current_user.id))
        
        # 5. Get experiment params
        params = get_params_for_user(
            str(current_user.id),
            [WEIGHT_EXPERIMENT],
            SystemParams()
        )
        
        # 6. Rank with CARE Engine
        # Determine strictness: Relax mutual orientation in 'free' mode or if user has no gender specified
        # ALSO relax if profile is incomplete
        strict_mode = (mode != "free" and my_profile.gender != Gender.PREFER_NOT_TO_SAY and not is_incomplete_profile)
        
        print(f"[DEBUG] Calling ranker with {len(candidates)} candidates")
        if len(existing_matches) < 5:
            ranked = await cold_start_recommendations(user_profile, candidates, params, strict=strict_mode, mode=mode)
        else:
            ranked = await rank_candidates(
                user_profile, 
                candidates, 
                interaction_logs_dict, 
                limit=limit * 2,
                params=params,
                strict=strict_mode,
                mode=mode
            )
        print(f"[DEBUG] Ranker returned {len(ranked) if isinstance(ranked, list) else type(ranked)} results")
            
        # 7. Apply safety filters (Exposure tracking, etc)
        # BYPASS FOR ADMIN: admins always see all profiles for testing
        if current_user.is_admin:
            # Still apply high pop limiter to keep feed balanced
            safe_ranked = high_pop_limiter.filter_high_pop(ranked)
            if not safe_ranked and ranked:
                safe_ranked = ranked
        else:
            safe_ranked = apply_safety_filters(
                ranked,
                str(current_user.id),
                exposure_tracker,
                high_pop_limiter,
                record=False
            )
        
        # 8. Apply Diversity & Exploration Re-ranking
        from src.care.ranking.diversity import apply_diversity_reranking
        
        # MODE-SPECIFIC DIVERSITY SETTINGS
        if mode == 'opposites':
            # For opposites mode, prioritize diversity and low-compatibility profiles
            diverse_ranked = apply_diversity_reranking(
                safe_ranked, 
                diversity_factor=0.5,  # Higher diversity
                max_popular_per_feed=2
            )
        elif mode == 'free':
            # Free mode: maximum diversity, no popularity limits
            diverse_ranked = apply_diversity_reranking(
                safe_ranked, 
                diversity_factor=0.4,
                max_popular_per_feed=5
            )
        else:
            # Suggested and Blind modes: standard diversity
            diverse_ranked = apply_diversity_reranking(
                safe_ranked, 
                diversity_factor=0.2,
                max_popular_per_feed=3
            )

        # 8.5 Apply MODE-SPECIFIC Compatibility Filtering
        # Mode definitions: suggested (Sugeridos), opposites (Opuestos), blind (A ciegas), free (Libre)
        filtered_ranked = []
        for item in diverse_ranked:
            # item['compat_score'] is 0-1 float
            score = item['compat_score'] * 100
            
            # ADMIN BYPASS: Skip strict score filtering for admins so they can test
            if not current_user.is_admin:
                # MODE: OPPOSITES - Show LOW compatibility profiles (0-39%)
                if mode == 'opposites':
                    if score >= 40:
                        continue
                        
                # MODE: BLIND (A ciegas) - Show HIGH compatibility profiles (>= 70%)
                elif mode == 'blind':
                    if score < 70:
                        continue
                        
                # MODE: SUGGESTED - Show MEDIUM/HIGH compatibility (10-100%) - Relaxed from 40
                elif mode == 'suggested':
                    # If only_high_compatibility is active, filter for >= 70%
                    # Otherwise, use the base suggested threshold (>= 10% to ensure results)
                    # RELAX: If incomplete profile, allow ANY score (0%)
                    base_threshold = 0 if is_incomplete_profile else 10
                    threshold = 70 if only_high_compatibility else base_threshold
                    
                    if score < threshold:
                        continue
                
                # MODE: FREE (Libre) - Show all (0-100%)
                # elif mode == 'free': pass
                        
                # Custom Min Compatibility (from filters)
                if min_compatibility and score < min_compatibility:
                    continue
                    
                # Custom Max Compatibility (from filters, overrides mode)
                if max_compatibility and score > max_compatibility:
                    continue
                
            filtered_ranked.append(item)
            
        if not filtered_ranked and diverse_ranked:
            # Fallback for Suggested mode to avoid empty feeds if no 70+ matches
            if mode == 'suggested':
                filtered_ranked = diverse_ranked
            else:
                filtered_ranked = []
            
        diverse_ranked = filtered_ranked
        
        # 9. Format response
        result = []
        for item in diverse_ranked[:limit]:
            candidate = item['candidate']
            
            # Find original profile for missing data
            original_profile = next((p for p in candidate_profiles if p.user_id == str(candidate.id)), None)
            if not original_profile: continue
            
            # Get user for display_name
            user = await User.find_one(User.id == str(candidate.id))
            
            # Generate explanation & highlights
            explanation = explain_score(user_profile, candidate, item)
            highlights = get_match_highlights(user_profile, candidate)
            
            # Generate breakdown for UI progress bars (Phase 14)
            breakdown = await compatibility_breakdown(user_profile, candidate, params)
            # Scale numeric factors to 0-100 for frontend
            breakdown_100 = {
                k: v * 100 for k, v in breakdown.items() 
                if isinstance(v, (int, float))
            }
            
            # Determine transparency based on mode
            is_blind = (mode == 'blind')
            visible_photos = [] if is_blind else original_profile.photos
            
            result.append(DiscoveryProfile(
                user_id=str(candidate.id),
                nickname=user.nickname if user else "user",
                display_name=user.display_name if user else "User",
                age=candidate.age,
                bio=original_profile.bio,
                photos=visible_photos,
                interests=candidate.interests,
                affinity_score=item['compat_score'] * 100,
                match_reason=explanation,
                match_highlights=highlights,
                is_discovery=item.get('is_discovery', False),
                subscription_tier=user.subscription_tier if user else "free",
                distance_km=breakdown.get("proximity_km"),
                activity_score=candidate.activity_score,
                responsiveness_score=candidate.responsiveness_score,
                affinity_breakdown=breakdown_100,
                is_blind=is_blind,
                scenario_label=breakdown.get("scenario_label"),
                connection_tone=breakdown.get("connection_tone"),
                context_advice=breakdown.get("context_advice"),
                show_age=original_profile.show_age if original_profile.show_age is not None else True,
                show_location=original_profile.show_location if original_profile.show_location is not None else True,
                is_curious=active_curiosity and (
                    original_profile.gender not in (my_profile.attraction_preferences or []) or
                    original_profile.sexual_orientation not in (my_profile.orientation_preferences or [])
                ) or (active_curiosity and original_profile.gender in (my_profile.curiosity_genders or []))
            ))
        
        return result

    except Exception as e:
        import traceback
        print(f"ERROR in get_discovery_queue: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal Server Error: {str(e)}"
        )


@router.post("/swipe")
async def swipe(
    request: SwipeRequest,
    current_user: User = Depends(get_current_user)
):
    """Perform swipe action (like, pass, superlike)"""
    
    # Validate target user exists
    target_profile = await Profile.find_one(Profile.user_id == request.target_user_id)
    if not target_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target user not found"
        )
    
    # --- FRIEND MODE VALIDATION ---
    from src.models.profile import RelationshipStatus, IntentionType
    
    my_profile = await Profile.find_one(Profile.user_id == str(current_user.id))
    
    # If in Friend Mode (not single/prefer_not_say), block romantic actions on romantic-only profiles
    # Actually, simpler: If in Friend Mode, you shouldn't be able to LIKE someone who is ONLY looking for Romance.
    # But the discovery queue already filters them out.
    # However, user said "functionality has not been blocked".
    # Let's enforce it here too.
    
    if my_profile.relationship_status not in [RelationshipStatus.SINGLE, RelationshipStatus.PREFER_NOT_TO_SAY]:
        # Check if target is strictly romantic? Or just block Superlike?
        # Let's assume Friend Mode implies NO Superlikes (usually romantic context)
        if request.interaction == InteractionType.SUPERLIKE:
             raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Superlikes are disabled in Friend Mode"
            )
            
        # Also, if target is strictly looking for Romance, block interaction
        # (Though they shouldn't be in queue, direct API calls might try)
        if target_profile.intentions == [IntentionType.ROMANCE]:
             raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot interact with romance-only profiles in Friend Mode"
            )
    # ------------------------------

    # --- TIER LIMITS ENFORCEMENT ---
    # 1. Superlike Limits
    if request.interaction == InteractionType.SUPERLIKE:
        # Reset daily counter if needed
        now = datetime.utcnow()
        if current_user.last_superlike_date and current_user.last_superlike_date.date() < now.date():
            current_user.daily_superlikes_count = 0
            current_user.last_superlike_date = now
        
        # Define limits
        limits = {
            SubscriptionTier.FREE: 5,
            SubscriptionTier.PREMIUM: 10,
            SubscriptionTier.VIP: 999999
        }
        limit = limits.get(current_user.subscription_tier, 5)
        
        if current_user.daily_superlikes_count >= limit:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Daily superlike limit reached for {current_user.subscription_tier} tier"
            )
            
        # Increment counter (will save later)
        current_user.daily_superlikes_count += 1
        current_user.last_superlike_date = now

    # 2. Match Limits (Checked only if it becomes a match)
    # We'll check this AFTER determining if it's a match
    # -------------------------------

    # Check if interaction already exists
    existing_match = await Match.find_one({
        "$or": [
            {"user_id_1": str(current_user.id), "user_id_2": request.target_user_id},
            {"user_id_1": request.target_user_id, "user_id_2": str(current_user.id)}
        ]
    })
    
    if existing_match:
        # Update existing match
        if existing_match.user_id_1 == str(current_user.id):
            # Phase 2: Handle Double Pass for permanent removal
            if existing_match.user_1_interaction == InteractionType.PASS and request.interaction == InteractionType.PASS:
                existing_match.status = MatchStatus.UNMATCHED
            existing_match.user_1_interaction = request.interaction
        else:
            # Phase 2: Handle Double Pass for permanent removal
            if existing_match.user_2_interaction == InteractionType.PASS and request.interaction == InteractionType.PASS:
                existing_match.status = MatchStatus.UNMATCHED
            existing_match.user_2_interaction = request.interaction
        
        # Phase 2: Track decision time
        existing_match.interaction_updated_at = datetime.utcnow()
        
        # Check if it's a match
        if (existing_match.user_1_interaction == InteractionType.LIKE or
            existing_match.user_1_interaction == InteractionType.SUPERLIKE) and \
           (existing_match.user_2_interaction == InteractionType.LIKE or
            existing_match.user_2_interaction == InteractionType.SUPERLIKE):
            
            # --- MATCH LIMIT CHECK ---
            # Reset 3-day cycle if needed
            now = datetime.utcnow()
            if not current_user.matches_cycle_start or (now - current_user.matches_cycle_start).days >= 3:
                current_user.matches_count_3days = 0
                current_user.matches_cycle_start = now
            
            # Define limits
            match_limits = {
                SubscriptionTier.FREE: 20,
                SubscriptionTier.PREMIUM: 50,
                SubscriptionTier.VIP: 999999
            }
            limit = match_limits.get(current_user.subscription_tier, 20)
            
            if current_user.matches_count_3days >= limit:
                # Revert interaction? Or just block?
                # Let's block the match formation
                if existing_match.user_1_interaction == request.interaction:
                     existing_match.user_1_interaction = None # Revert
                else:
                     existing_match.user_2_interaction = None
                
                await existing_match.save() # Save revert
                await current_user.save() # Save counters (superlike might have inc)
                
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Match limit ({limit}/3days) reached. Upgrade to get more matches."
                )
            
            # Increment match count
            current_user.matches_count_3days += 1
            # -------------------------

            existing_match.status = MatchStatus.MATCHED
            existing_match.matched_at = datetime.utcnow()
        
        await existing_match.save()
        await current_user.save() # Save user counters

        # Emit Kafka events
        try:
            swipe_type = (
                KafkaEventType.SWIPE_SUPERLIKE if request.interaction == InteractionType.SUPERLIKE
                else (KafkaEventType.SWIPE_LIKE if request.interaction == InteractionType.LIKE else KafkaEventType.SWIPE_PASS)
            )
            await kafka_service.publish(
                topic=KafkaTopic.SWIPES,
                event_type=swipe_type,
                payload={
                    "swiper_id": str(current_user.id),
                    "target_id": request.target_user_id,
                    "interaction": request.interaction.value,
                    "dwell_time_ms": request.dwell_time_ms,
                    "is_blind_mode": request.is_blind_mode,
                },
                key=str(current_user.id),
            )
            if existing_match.status == MatchStatus.MATCHED:
                await kafka_service.publish(
                    topic=KafkaTopic.MATCHES_NEW,
                    event_type=KafkaEventType.MATCH_CREATED,
                    payload={
                        "match_id": str(existing_match.id),
                        "user_a_id": str(existing_match.user_id_1),
                        "user_b_id": str(existing_match.user_id_2),
                        "compatibility_score": existing_match.affinity_score or 0.0,
                    },
                    key=str(existing_match.id),
                )
        except Exception as k_err:
            print(f"Kafka publish error in swipe (existing): {k_err}")
        
        return {
            "match_id": str(existing_match.id),
            "is_match": existing_match.status == MatchStatus.MATCHED,
            "message": "It's a match!" if existing_match.status == MatchStatus.MATCHED else "Interaction recorded"
        }
    
    # Create new match record
    my_profile = await Profile.find_one(Profile.user_id == str(current_user.id))
    
    # Calculate affinity
    score = AffinityService.calculate_score(my_profile, target_profile)
    
    from src.models.match import MatchMode, UnlockState
    
    match_mode = MatchMode.BLIND if request.is_blind_mode else MatchMode.NORMAL
    unlock_state = UnlockState.LOCKED if request.is_blind_mode else UnlockState.UNLOCKED

    match = Match(
        user_id_1=str(current_user.id),
        user_id_2=request.target_user_id,
        user_1_interaction=request.interaction,
        status=MatchStatus.PENDING,
        affinity_score=score,
        is_superlike=(request.interaction == InteractionType.SUPERLIKE),
        created_at=datetime.utcnow(),
        mode=match_mode,
        unlock_state=unlock_state
    )
    
    await match.insert()
    await current_user.save() # Save user counters (superlike)
    
    # --- FEED TO CARE ENGINE ---
    try:
        from src.care.feedback.event_handler import on_user_action
        from src.care.analytics.metrics import metrics_collector
        
        on_user_action({
            'user_id': str(current_user.id),
            'candidate_id': request.target_user_id,
            'type': request.interaction.value.upper(),
            'timestamp': datetime.utcnow(),
            'dwell_time_ms': request.dwell_time_ms,
            'metadata': {}
        })
        
        # Record swipe in metrics
        metrics_collector.record_swipe(
            user_id=str(current_user.id),
            candidate_id=request.target_user_id,
            interaction=request.interaction.value,
            dwell_time_ms=request.dwell_time_ms or 0,
            care_score=0.0,  # TODO: Get from ranking
            bucket='unknown',  # TODO: Get from ranking
            variant='control'  # TODO: Get from A/B test
        )
        
        # Record exposure to prevent showing again
        # ADMIN BYPASS: Don't record exposures for admins so they can re-test same profiles
        if not current_user.is_admin:
            exposure_tracker.record_exposure(str(current_user.id), request.target_user_id)
        
    except Exception as e:
        # Don't fail the swipe if CARE tracking fails
        print(f"CARE tracking error: {str(e)}")
    # ---------------------------

    # Emit Kafka swipe event
    try:
        swipe_type = (
            KafkaEventType.SWIPE_SUPERLIKE if request.interaction == InteractionType.SUPERLIKE
            else (KafkaEventType.SWIPE_LIKE if request.interaction == InteractionType.LIKE else KafkaEventType.SWIPE_PASS)
        )
        await kafka_service.publish(
            topic=KafkaTopic.SWIPES,
            event_type=swipe_type,
            payload={
                "swiper_id": str(current_user.id),
                "target_id": request.target_user_id,
                "interaction": request.interaction.value,
                "dwell_time_ms": request.dwell_time_ms,
                "is_blind_mode": request.is_blind_mode,
            },
            key=str(current_user.id),
        )
    except Exception as k_err:
        print(f"Kafka publish error in swipe (new): {k_err}")
    
    return {
        "match_id": str(match.id),
        "is_match": False,
        "message": "Interaction recorded"
    }


@router.get("/matches")
async def get_matches(current_user: User = Depends(get_current_user)):
    """Get all matches for current user"""
    
    matches = await Match.find({
        "$or": [
            {"user_id_1": str(current_user.id)},
            {"user_id_2": str(current_user.id)}
        ],
        "status": MatchStatus.MATCHED
    }).to_list()
    
    # Build response with profile info
    result = []
    for match in matches:
        # Get the other user's ID
        other_user_id = match.user_id_2 if match.user_id_1 == str(current_user.id) else match.user_id_1
        
        # Get their profile
        other_profile = await Profile.find_one(Profile.user_id == other_user_id)
        
        if other_profile:
            result.append({
                "match_id": str(match.id),
                "user_id": other_user_id,
                "display_name": other_profile.display_name,
                "age": other_profile.age,
                "photos": other_profile.photos,
                "bio": other_profile.bio,
                "affinity_score": match.affinity_score,
                "matched_at": match.matched_at
            })
    
    return result


@router.delete("/matches/{match_id}")
async def unmatch(match_id: str, current_user: User = Depends(get_current_user)):
    """Unmatch with a user"""
    
    match = await Match.get(match_id)
    
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found"
        )
    
    # Verify user is part of the match
    if match.user_id_1 != str(current_user.id) and match.user_id_2 != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to unmatch"
        )
    
    match.status = MatchStatus.UNMATCHED
    match.unmatched_at = datetime.utcnow()
    await match.save()
    
    return {"message": "Unmatched successfully"}


@router.post("/matches/{match_id}/unlock")
async def unlock_match(match_id: str, current_user: User = Depends(get_current_user)):
    """
    Unlock Blind Mode profile (Two-way consent).
    """
    match = await Match.get(match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
        
    if match.user_id_1 != str(current_user.id) and match.user_id_2 != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
        
    # Update consent
    if not match.unlock_consent:
        match.unlock_consent = {}
        
    match.unlock_consent[str(current_user.id)] = True
    
    # Check if both consented
    if match.unlock_consent.get(match.user_id_1) and match.unlock_consent.get(match.user_id_2):
        match.unlock_state = MatchStatus.UNLOCKED # Correction: Use UnlockState enum
        from src.models.match import UnlockState
        match.unlock_state = UnlockState.UNLOCKED
        message = "Profile Unlocked!"
    else:
        # pending
        from src.models.match import UnlockState
        match.unlock_state = UnlockState.PENDING
        message = "Consent recorded. Waiting for partner."
        
    await match.save()
    return {"message": message, "unlock_state": match.unlock_state}


async def _build_discovery_profile(
    current_user: User,
    profile: Profile,
    score: int = None
) -> DiscoveryProfile:
    """Build discovery profile with affinity score"""
    
    if score is None:
        my_profile = await Profile.find_one(Profile.user_id == str(current_user.id))
        score = AffinityService.calculate_score(my_profile, profile)
    
    # Get user subscription tier for visual identity
    user = await User.find_one(User.id == profile.user_id)
    subscription_tier = user.subscription_tier.value if user else "free"
    
    return DiscoveryProfile(
        user_id=profile.user_id,
        display_name=profile.display_name,
        age=profile.age if profile.show_age else 0,
        bio=profile.bio,
        photos=profile.photos[:5],  # Limit to first 5 photos
        interests=profile.interests,
        affinity_score=score,
        subscription_tier=subscription_tier,
        affinity_breakdown={"total": score} # Simple breakdown for now
    )


@router.get("/likes-received", response_model=List[ReceivedLike])
async def get_received_likes(current_user: User = Depends(get_current_user)):
    """
    Get list of users who have liked you but you haven't responded to yet.
    This creates the "someone liked you" notification feature.
    """
    
    # Find matches where:
    # 1. Other user liked you (LIKE or SUPERLIKE)
    # 2. You haven't responded yet (your interaction is None)
    # 3. Status is still PENDING
    # 4. Created within last 7 days
    
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    
    matches = await Match.find({
        "$or": [
            {
                "user_id_2": str(current_user.id),
                "user_1_interaction": {"$in": [InteractionType.LIKE, InteractionType.SUPERLIKE]},
                "user_2_interaction": None,
                "status": MatchStatus.PENDING,
                "created_at": {"$gte": seven_days_ago}
            },
            {
                "user_id_1": str(current_user.id),
                "user_2_interaction": {"$in": [InteractionType.LIKE, InteractionType.SUPERLIKE]},
                "user_1_interaction": None,
                "status": MatchStatus.PENDING,
                "created_at": {"$gte": seven_days_ago}
            }
        ]
    }).to_list()
    
    result = []
    my_profile = await Profile.find_one(Profile.user_id == str(current_user.id))
    
    for match in matches:
        # Determine who liked you
        if match.user_id_2 == str(current_user.id):
            liker_id = match.user_id_1
            is_superlike = match.user_1_interaction == InteractionType.SUPERLIKE
        else:
            liker_id = match.user_id_2
            is_superlike = match.user_2_interaction == InteractionType.SUPERLIKE
        
        # Get their profile
        liker_profile = await Profile.find_one(Profile.user_id == liker_id)
        
        if liker_profile:
            # Calculate affinity if not already stored
            affinity = match.affinity_score if match.affinity_score > 0 else \
                      AffinityService.calculate_score(my_profile, liker_profile)
            
            result.append(ReceivedLike(
                match_id=str(match.id),
                user_id=liker_id,
                display_name=liker_profile.display_name,
                age=liker_profile.age,
                bio=liker_profile.bio,
                photos=liker_profile.photos[:5],
                interests=liker_profile.interests,
                affinity_score=affinity,
                is_superlike=is_superlike,
                liked_at=match.created_at
            ))
    
    # Sort by most recent first
    result.sort(key=lambda x: x.liked_at, reverse=True)
    
    return result


@router.get("/second-chance", response_model=List[SecondChanceProfile])
async def get_second_chance(
    limit: int = 20,
    current_user: User = Depends(get_current_user)
):
    """
    Get profiles you previously passed on (swiped left).
    Gives users a second chance to reconsider profiles they might have
    accidentally passed or changed their mind about.
    """
    
    # Find matches where you passed (PASS interaction)
    # Phase 2: Filter by grace period (14 days) and status PENDING
    grace_period_days = 14
    grace_period_date = datetime.utcnow() - timedelta(days=grace_period_days)
    
    matches = await Match.find({
        "$or": [
            {
                "user_id_1": str(current_user.id),
                "user_1_interaction": InteractionType.PASS,
                "interaction_updated_at": {"$gte": grace_period_date}
            },
            {
                "user_id_2": str(current_user.id),
                "user_2_interaction": InteractionType.PASS,
                "interaction_updated_at": {"$gte": grace_period_date}
            }
        ],
        "status": MatchStatus.PENDING
    }).to_list()
    
    result = []
    my_profile = await Profile.find_one(Profile.user_id == str(current_user.id))
    
    for match in matches:
        # Determine which user you passed on
        if match.user_id_1 == str(current_user.id):
            passed_user_id = match.user_id_2
        else:
            passed_user_id = match.user_id_1
        
        # Get their profile
        passed_profile = await Profile.find_one(Profile.user_id == passed_user_id)
        
        if passed_profile:
            # Only show if still compatible (they might have changed preferences)
            if CompatibilityService.is_compatible(my_profile, passed_profile):
                affinity = match.affinity_score if match.affinity_score > 0 else \
                          AffinityService.calculate_score(my_profile, passed_profile)
                
                result.append(SecondChanceProfile(
                    match_id=str(match.id),
                    user_id=passed_user_id,
                    display_name=passed_profile.display_name,
                    age=passed_profile.age,
                    bio=passed_profile.bio,
                    photos=passed_profile.photos[:5],
                    interests=passed_profile.interests,
                    affinity_score=affinity,
                    passed_at=match.created_at
                ))
    
    # Sort by affinity score (show best matches first)
    result.sort(key=lambda x: x.affinity_score, reverse=True)
    
    return result[:limit]


@router.post("/second-chance/{match_id}/reconsider")
async def reconsider_profile(
    match_id: str,
    new_interaction: InteractionType,
    current_user: User = Depends(get_current_user)
):
    """
    Reconsider a profile from second chance.
    Updates your interaction from PASS to LIKE or SUPERLIKE.
    """
    
    match = await Match.get(match_id)
    
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found"
        )
    
    # Verify user is part of the match
    if match.user_id_1 != str(current_user.id) and match.user_id_2 != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    # Update interaction
    if match.user_id_1 == str(current_user.id):
        match.user_1_interaction = new_interaction
    else:
        match.user_2_interaction = new_interaction
    
    # Check if it's now a match
    if (match.user_1_interaction in [InteractionType.LIKE, InteractionType.SUPERLIKE] and
        match.user_2_interaction in [InteractionType.LIKE, InteractionType.SUPERLIKE]):
        match.status = MatchStatus.MATCHED
        match.matched_at = datetime.utcnow()
    
    # Update superlike flag
    if new_interaction == InteractionType.SUPERLIKE:
        match.is_superlike = True
    
    await match.save()
    
    return {
        "match_id": str(match.id),
        "is_match": match.status == MatchStatus.MATCHED,
        "message": "It's a match!" if match.status == MatchStatus.MATCHED else "Interaction updated"
    }


# OLD ENDPOINT - COMMENTED OUT (duplicate, use the new one at line 850)
# @router.get("/likes-sent", response_model=List[SentLike])
# async def get_sent_likes(current_user: User = Depends(get_current_user)):
#     """
#     Get list of users you liked in the last 7 days.
#     """
#     seven_days_ago = datetime.utcnow() - timedelta(days=7)
#     
#     # Find matches where YOU liked the other person
#     matches = await Match.find({
#         "$or": [
#             {
#                 "user_id_1": str(current_user.id),
#                 "user_1_interaction": {"$in": [InteractionType.LIKE, InteractionType.SUPERLIKE]},
#                 "created_at": {"$gte": seven_days_ago}
#             },
#             {
#                 "user_id_2": str(current_user.id),
#                 "user_2_interaction": {"$in": [InteractionType.LIKE, InteractionType.SUPERLIKE]},
#                 "created_at": {"$gte": seven_days_ago}
#             }
#         ]
#     }).to_list()
#     
#     result = []
#     
#     for match in matches:
#         # Determine who you liked
#         if match.user_id_1 == str(current_user.id):
#             liked_user_id = match.user_id_2
#             is_superlike = match.user_1_interaction == InteractionType.SUPERLIKE
#         else:
#             liked_user_id = match.user_id_1
#             is_superlike = match.user_2_interaction == InteractionType.SUPERLIKE
#             
#         # Get their profile
#         liked_profile = await Profile.find_one(Profile.user_id == liked_user_id)
#         
#         if liked_profile:
#             result.append(SentLike(
#                 match_id=str(match.id),
#                 user_id=liked_user_id,
#                 display_name=liked_profile.display_name,  # ERROR: Profile doesn't have display_name
#                 age=liked_profile.age,
#                 photos=liked_profile.photos[:1],  # Just need main photo
#                 is_superlike=is_superlike,
#                 liked_at=match.created_at
#             ))
#             
#     # Sort by most recent
#     result.sort(key=lambda x: x.liked_at, reverse=True)
#     return result


@router.get("/top-picks", response_model=List[DiscoveryProfile])
async def get_top_picks(current_user: User = Depends(get_current_user)):
    """
    Get daily curated top picks based on high affinity.
    These are highly compatible profiles specially selected for the user.
    """
    # Get standard discovery queue but with high affinity threshold
    # We reuse the logic but filter strictly for high scores
    
    # 1. Get current user profile
    my_profile = await Profile.find_one(Profile.user_id == str(current_user.id))
    if not my_profile:
        return []
        
    # 2. Get interactions to exclude
    existing_matches = await Match.find({
        "$or": [
            {"user_id_1": str(current_user.id)},
            {"user_id_2": str(current_user.id)}
        ]
    }).to_list()
    
    interacted_ids = set()
    for m in existing_matches:
        interacted_ids.add(m.user_id_2 if m.user_id_1 == str(current_user.id) else m.user_id_1)
        
    # 3. Find candidates (same basic filters as queue)
    query = {
        "user_id": {"$ne": str(current_user.id)},
        "profile_visible": True,
        "show_me_in_discovery": True,
        "user_id": {"$nin": list(interacted_ids)}
    }
    
    all_profiles = await Profile.find(query).to_list()
    
    # 4. Filter compatible
    compatible = CompatibilityService.filter_compatible_profiles(my_profile, all_profiles)
    
    # 5. Score and pick top ones
    scored = []
    for p in compatible:
        score = AffinityService.calculate_score(my_profile, p)
        # Only consider high affinity for top picks (> 70%)
        if score >= 70:
            scored.append({"profile": p, "score": score})
            
    # Sort by score
    scored.sort(key=lambda x: x["score"], reverse=True)
    
    # Take top 10
    top_picks = scored[:10]
    
    # Build response
    result = []
    for item in top_picks:
        dp = await _build_discovery_profile(current_user, item["profile"], item["score"])
        result.append(dp)
        
    return result


@router.get("/likes-received")
async def get_likes_received(current_user: User = Depends(get_current_user)):
    """Get profiles of users who liked the current user"""
    try:
        # Find matches where current user is user_2 and status is PENDING (meaning user_1 liked user_2)
        matches = await Match.find(
            Match.user_id_2 == str(current_user.id),
            Match.status == MatchStatus.PENDING
        ).to_list()
        
        result = []
        for match in matches:
            profile = await Profile.find_one(Profile.user_id == match.user_id_1)
            if profile:
                # Get user to fetch display_name
                user = await User.find_one(User.id == match.user_id_1)
                display_name = user.display_name if user else "Unknown"
                
                # Return simple profile data
                result.append({
                    "match_id": str(match.id),
                    "user_id": profile.user_id,
                    "display_name": display_name,
                    "age": profile.age if profile.show_age else 0,
                    "photos": profile.photos[:5] if profile.photos else [],
                    "bio": profile.bio or "",
                    "interests": profile.interests or [],
                    "affinity_score": 0,  # Placeholder
                    "is_superlike": match.is_superlike,
                    "liked_at": match.created_at.isoformat() if match.created_at else None
                })
                
        return result
    except Exception as e:
        print(f"Error in get_likes_received: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching received likes: {str(e)}"
        )


@router.get("/likes-sent")
async def get_likes_sent(current_user: User = Depends(get_current_user)):
    """Get profiles of users the current user has liked"""
    try:
        # Phase 2: Filter for LIKE or SUPERLIKE only
        matches = await Match.find(
            Match.user_id_1 == str(current_user.id),
            Match.status == MatchStatus.PENDING,
            {"user_1_interaction": {"$in": [InteractionType.LIKE, InteractionType.SUPERLIKE]}}
        ).to_list()
        
        result = []
        for match in matches:
            profile = await Profile.find_one(Profile.user_id == match.user_id_2)
            if profile:
                # Get user to fetch display_name
                user = await User.find_one(User.id == match.user_id_2)
                display_name = user.display_name if user else "Unknown"
                
                # Return simple profile data
                result.append({
                    "match_id": str(match.id),
                    "user_id": profile.user_id,
                    "display_name": display_name,
                    "age": profile.age if profile.show_age else 0,
                    "photos": profile.photos[:5] if profile.photos else [],
                    "bio": profile.bio or "",
                    "interests": profile.interests or [],
                    "affinity_score": 0,  # Placeholder
                    "is_superlike": match.is_superlike,
                    "liked_at": match.created_at.isoformat() if match.created_at else None
                })
                
        return result
    except Exception as e:
        print(f"Error in get_likes_sent: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching sent likes: {str(e)}"
        )


