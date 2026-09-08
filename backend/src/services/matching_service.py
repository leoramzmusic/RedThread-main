import math
from typing import List, Dict, Optional, Set, Any
from datetime import datetime
from src.models.profile import Profile, RelationshipStatus, IntentionType
from src.models.user import User
from src.services.compatibility_service import CompatibilityService

class MatchingService:
    """
    Advanced Matching System for RedThread
    Implements weighted scoring, progressive filtering, and fallback mechanisms.
    """
    
    # Scoring Weights
    WEIGHT_BASIC = 0.40      # Age, City, Orientation
    WEIGHT_INTERESTS = 0.30  # Interests, Hobbies, Lifestyle
    WEIGHT_INTENTIONS = 0.20 # Intentions, Relationship Status
    WEIGHT_OPTIONAL = 0.10   # Height, Education, Verification
    
    @staticmethod
    async def find_matches(
        user_profile: Profile, 
        limit: int = 10,
        filters: Optional[Dict] = None,
        strict: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Main entry point for finding matches.
        Applies progressive fallback logic to guarantee minimum matches.
        """
        matches = []
        
        # Extract filters
        online_user_ids = filters.get("online_user_ids") if filters else None
        search_states = filters.get("search_states") if filters else []
        search_countries = filters.get("search_countries") if filters else []
        
        # 1. Initial Strict Search
        # +/- 5 years, Base location (radius from filters or default 50km)
        distance = filters.get("distance_km", 50) if filters else 50
        
        matches = await MatchingService._search_candidates(
            user_profile, 
            age_range=5, 
            distance_km=distance, 
            search_states=search_states,
            search_countries=search_countries,
            limit=limit * 2,
            online_user_ids=online_user_ids,
            strict=strict
        )
        
        # 2. Fallback: Relax Age
        if len(matches) < limit:
            print(f"  ⚠️ Not enough matches ({len(matches)}), relaxing age...")
            additional = await MatchingService._search_candidates(
                user_profile,
                age_range=10,
                distance_km=distance,
                search_states=search_states,
                search_countries=search_countries,
                exclude_ids=[m["profile"].user_id for m in matches],
                limit=limit - len(matches),
                online_user_ids=online_user_ids,
                strict=strict
            )
            matches.extend(additional)
            
        # 3. Fallback: Relax Distance (only if no specific countries/states provided)
        if len(matches) < limit and not search_states and not search_countries:
            print(f"  ⚠️ Not enough matches ({len(matches)}), relaxing distance...")
            additional = await MatchingService._search_candidates(
                user_profile,
                age_range=10,
                distance_km=500, # Region/Country
                exclude_ids=[m["profile"].user_id for m in matches],
                limit=limit - len(matches),
                online_user_ids=online_user_ids,
                strict=strict
            )
            matches.extend(additional)
            
        # 4. Fallback: Global
        if len(matches) < limit:
            print(f"  ⚠️ Not enough matches ({len(matches)}), going global...")
            additional = await MatchingService._search_candidates(
                user_profile,
                age_range=15,
                distance_km=None, # Global
                exclude_ids=[m["profile"].user_id for m in matches],
                limit=limit - len(matches),
                online_user_ids=online_user_ids,
                strict=strict
            )
            matches.extend(additional)
            
        # Sort by final score
        matches.sort(key=lambda x: x["score"], reverse=True)
        
        return matches[:limit]

    @staticmethod
    async def _search_candidates(
        user_profile: Profile,
        age_range: int,
        distance_km: Optional[float],
        search_states: List[str] = [],
        search_countries: List[str] = [],
        exclude_ids: List[str] = [],
        limit: int = 50,
        online_user_ids: Optional[Set[str]] = None,
        strict: bool = True
    ) -> List[Dict]:
        """
        Execute MongoDB query with specific criteria
        """
        query = {
            "user_id": {"$nin": [user_profile.user_id] + exclude_ids},
            "show_me_in_discovery": True,
            "profile_visible": True,
        }
        
        # Filter by online users if specified
        if online_user_ids is not None:
            query["user_id"] = {"$in": list(online_user_ids), "$nin": [user_profile.user_id] + exclude_ids}
        
        # 1. Emotional Safety Rules
        # Exclude incompatible relationship statuses
        if user_profile.relationship_status == RelationshipStatus.SINGLE:
             # Singles usually don't want married people unless open relationship
             query["relationship_status"] = {"$ne": RelationshipStatus.MARRIED}
             
        # 2. Age Filter
        min_age = max(18, user_profile.age - age_range)
        max_age = user_profile.age + age_range
        query["age"] = {"$gte": min_age, "$lte": max_age}
        
        # 3. Gender/Orientation (Hard Filter)
        # We rely on CompatibilityService logic, but can optimize query here
        looking_for = user_profile.attraction_preferences or []
        if looking_for:
            query["gender"] = {"$in": looking_for}
            
        # 4. Location Filter (Geospatial + Premium)
        location_clauses = []
        
        # Proximity (Base radius)
        if distance_km and user_profile.location and user_profile.location.coordinates:
            # We use $geoWithin with $centerSphere to allow combining with $or for states/countries
            lat = user_profile.location.coordinates[1]
            lng = user_profile.location.coordinates[0]
            radius_radians = distance_km / 6378.1
            location_clauses.append({
                "location": {
                    "$geoWithin": {
                        "$centerSphere": [[lng, lat], radius_radians]
                    }
                }
            })
        
        # Premium States Filter
        if search_states:
            location_clauses.append({"location.state": {"$in": search_states}})
            
        # Premium Countries Filter
        if search_countries:
            location_clauses.append({"location.country": {"$in": search_countries}})
            
        # Apply combined location filter
        if location_clauses:
            if len(location_clauses) > 1:
                query["$or"] = location_clauses
            else:
                query.update(location_clauses[0])
            
        # Execute Query
        candidates = await Profile.find(query).limit(limit * 2).to_list()
        
        # Post-Query Filtering & Scoring
        results = []
        for candidate in candidates:
            # Double check compatibility (mutual interest)
            if not CompatibilityService.is_compatible(user_profile, candidate, strict=strict):
                continue
                
            # Calculate Score
            score_data = MatchingService.calculate_score(user_profile, candidate)
            
            results.append({
                "profile": candidate,
                "score": score_data["total"],
                "breakdown": score_data
            })
            
        return results

    @staticmethod
    def calculate_score(user: Profile, candidate: Profile, mode: str = "suggested") -> Dict[str, Any]:
        """
        Calculate detailed compatibility score (0-100) with breakdown.
        Supports 'opposites' mode.
        """
        scores = {
            "basic": 0,
            "interests": 0,
            "intentions": 0,
            "optional": 0
        }
        
        # --- 1. Basic Criteria (40%) ---
        # Age proximity (Max 10 pts)
        age_diff = abs(user.age - candidate.age)
        if age_diff <= 2: scores["basic"] += 10
        elif age_diff <= 5: scores["basic"] += 7
        elif age_diff <= 10: scores["basic"] += 4
        else: scores["basic"] += 1
        
        # Location (Max 10 pts)
        scores["basic"] += 10 
        
        # Orientation (Max 20 pts)
        scores["basic"] += 20
        
        # --- 2. Interests & Lifestyle (30%) ---
        u_interests = set(user.interests)
        c_interests = set(candidate.interests)
        
        # Lifestyle (Values/Activities)
        u_lifestyle = set(user.lifestyle_interests or [])
        c_lifestyle = set(candidate.lifestyle_interests or []) # Assume this field exists, fallback to empty list
        
        common_interests = u_interests & c_interests
        common_lifestyle = u_lifestyle & c_lifestyle
        
        unique_interests = c_interests - u_interests
        unique_lifestyle = c_lifestyle - u_lifestyle
        
        if mode == "opposites":
            # Opposites Mode: We still want unique interests for breakdown
            pass
            
        # Standard Mode (Default): Reward similarity
        # 3 pts per common interest/lifestyle, max 30
        interest_score = min(30, (len(common_interests) + len(common_lifestyle)) * 5)
            
        scores["interests"] = interest_score
        
        # --- 3. Intentions & Status (20%) ---
        # Intention Match (Should align even for opposites usually)
        u_intentions = set(user.intentions)
        c_intentions = set(candidate.intentions)
        common_intentions = u_intentions & c_intentions
        
        if common_intentions:
            scores["intentions"] += 10
            
        # Status Compatibility
        if user.relationship_status == candidate.relationship_status:
            scores["intentions"] += 10
            
        # --- 4. Optional Attributes (10%) ---
        if candidate.is_verified:
            scores["optional"] += 5
            
        if user.education_level and candidate.education_level:
            if user.education_level == candidate.education_level:
                scores["optional"] += 5
                
        # Calculate Total
        total_score = (
            scores["basic"] * 1.0 + 
            scores["interests"] * 1.0 + 
            scores["intentions"] * 1.0 + 
            scores["optional"] * 1.0 
        )
        
        return {
            "total": min(100, int(total_score)),
            "details": scores,
            "breakdown": {
                "common_interests": list(common_interests),
                "common_lifestyle": list(common_lifestyle),
                "common_intentions": list(common_intentions),
                "unique_interests": list(unique_interests) if mode == "opposites" else [],
                "unique_lifestyle": list(unique_lifestyle) if mode == "opposites" else [],
                "mode": mode
            }
        }

