"""
CARE-powered discovery endpoint.

Provides personalized recommendations using the CARE Engine.
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from datetime import datetime, timedelta
from src.models.user import User
from src.models.profile import Profile
from src.models.match import Match
from src.api.auth import get_current_user
from src.api.discovery import DiscoveryProfile

# Import CARE Engine
from src.care.ranking.ranker import rank_candidates, cold_start_recommendations
from src.care.adapters import profile_to_user_profile, profile_to_candidate_profile, match_to_interaction_log
from src.care.utils.explainer import explain_score
from src.care.experiments.ab_testing import get_params_for_user, WEIGHT_EXPERIMENT
from src.care.experiments.safety_guards import ExposureTracker, HighPopularityLimiter, apply_safety_filters
from src.care.models.system_params import SystemParams


router = APIRouter()

# Global instances (in production, use dependency injection or caching)
exposure_tracker = ExposureTracker()
high_pop_limiter = HighPopularityLimiter(max_per_feed=3)


@router.get("/care-recommendations", response_model=List[DiscoveryProfile])
async def get_care_recommendations(
    limit: int = 20,
    age_min: Optional[int] = None,
    age_max: Optional[int] = None,
    distance_km: Optional[float] = None,
    online: Optional[bool] = None,
    states: Optional[List[str]] = Query(None),
    countries: Optional[List[str]] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """
    Get personalized recommendations using CARE Engine.
    
    This endpoint uses the CARE (Compatibility + Authenticity + Responsiveness Engine)
    to provide balanced, fair, and authentic recommendations.
    """
    try:
        # 1. Get current user's profile
        my_profile = await Profile.find_one(Profile.user_id == str(current_user.id))
        
        if not my_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )
        
        # 2. Convert to CARE UserProfile
        user_profile = profile_to_user_profile(my_profile, current_user)
        
        # 3. Get users already interacted with
        existing_matches = await Match.find({
            "$or": [
                {"user_id_1": str(current_user.id)},
                {"user_id_2": str(current_user.id)}
            ]
        }).to_list()
        
        interacted_user_ids = set()
        for match in existing_matches:
            if match.user_id_1 == str(current_user.id):
                interacted_user_ids.add(match.user_id_2)
            else:
                interacted_user_ids.add(match.user_id_1)
        
        # 4. Build candidate query
        query = {
            "user_id": {"$ne": str(current_user.id)},
            "profile_visible": True,
            "show_me_in_discovery": True
        }
        
        # Apply Gender/Orientation Filters (Mutual Interest Check)
        # 1. Candidate must be of a gender the user is looking for
        if my_profile.attraction_preferences:
            query["gender"] = {"$in": my_profile.attraction_preferences}
            
        # 2. Candidate must be looking for the user's gender
        # RELAX: If user gender is 'prefer_not_to_say', don't enforce candidate's attraction_preferences strictly in the initial query.
        from src.models.profile import Gender
        if my_profile.gender != Gender.PREFER_NOT_TO_SAY:
            query["attraction_preferences"] = {"$in": [my_profile.gender]}
        
        if interacted_user_ids:
            query["user_id"] = {"$nin": list(interacted_user_ids)}
        
        # Apply filters
        if age_min is not None:
            query.setdefault("age", {})["$gte"] = age_min
        if age_max is not None:
            query.setdefault("age", {})["$lte"] = age_max
        
        if distance_km and my_profile.location and my_profile.location.coordinates:
            query["location"] = {
                "$near": {
                    "$geometry": {
                        "type": "Point",
                        "coordinates": my_profile.location.coordinates
                    },
                    "$maxDistance": distance_km * 1000
                }
            }
        
        if states:
            query["location.state"] = {"$in": states}
        if countries:
            query["location.country"] = {"$in": countries}
        
        if online:
            five_minutes_ago = datetime.utcnow() - timedelta(minutes=5)
            online_users = await User.find({
                "last_seen": {"$gte": five_minutes_ago}
            }).to_list()
            online_user_ids = {str(u.id) for u in online_users}
            if not online_user_ids:
                return []
            query["user_id"] = {
                "$in": list(online_user_ids),
                "$nin": list(interacted_user_ids or []) + [str(current_user.id)]
            }
        
        # 5. Fetch candidate profiles
        candidate_profiles = await Profile.find(query).limit(limit * 3).to_list()
        
        if not candidate_profiles:
            return []
        
        # 6. Convert to CARE CandidateProfiles
        candidates = []
        for profile in candidate_profiles:
            # TODO: Fetch pre-computed signals from database
            # For now, use defaults
            candidate = profile_to_candidate_profile(profile, None)
            candidates.append(candidate)
        
        # 7. Get interaction logs
        interaction_logs_dict = match_to_interaction_log(existing_matches, str(current_user.id))
        
        # 8. Get A/B test params
        params = get_params_for_user(
            str(current_user.id),
            [WEIGHT_EXPERIMENT],  # Active experiments
            SystemParams()
        )
        
        # 9. Rank with CARE Engine
        # Determine strictness: Relax mutual orientation if user has no gender specified
        strict_mode = my_profile.gender != Gender.PREFER_NOT_TO_SAY
        
        if len(existing_matches) < 5:
            # Cold start: user has few interactions
            ranked = await cold_start_recommendations(
                user_profile,
                candidates,
                params,
                strict=strict_mode
            )
        else:
            # Regular ranking
            ranked = await rank_candidates(
                user_profile,
                candidates,
                interaction_logs_dict,
                limit=limit * 2,  # Get extra for safety filters
                params=params,
                strict=strict_mode
            )
        
        # 10. Apply safety filters
        safe_ranked = apply_safety_filters(
            ranked,
            str(current_user.id),
            exposure_tracker,
            high_pop_limiter
        )
        
        # 11. Format response
        result = []
        for item in safe_ranked[:limit]:
            candidate = item['candidate']
            
            # Get original Profile for full data
            original_profile = next(
                (p for p in candidate_profiles if p.user_id == str(candidate.id)),
                None
            )
            
            if not original_profile:
                continue
            
            # Get user for display_name and tier
            user = await User.find_one(User.id == str(candidate.id))
            
            # Generate explanation
            explanation = explain_score(user_profile, candidate, item)
            
            result.append(DiscoveryProfile(
                user_id=str(candidate.id),
                display_name=user.display_name if user else "User",
                age=candidate.age,
                bio=original_profile.bio,
                photos=original_profile.photos,
                interests=candidate.interests,
                affinity_score=item['compat_score'] * 100,  # Convert to percentage
                care_score=item['score'],
                match_reason=explanation,
                subscription_tier=user.subscription_tier if user else "free",
                distance_km=None,  # TODO: Calculate
                activity_score=candidate.activity_score,  # CARE signal
                responsiveness_score=candidate.responsiveness_score  # CARE signal
            ))
        
        return result
    
    except Exception as e:
        import traceback
        print(f"ERROR in get_care_recommendations: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal Server Error: {str(e)}"
        )
