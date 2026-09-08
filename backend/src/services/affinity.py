from typing import List, Dict, Set, Optional
from src.models.profile import Profile
from datetime import datetime

class AffinityService:
    @staticmethod
    def calculate_score(user_profile: Profile, candidate_profile: Profile) -> int:
        """
        Calculate affinity score between two profiles (0-100)
        """
        score = 0
        max_score = 100
        
        # 1. Common Interests (30 points)
        score += AffinityService._calculate_interest_score(user_profile.interests, candidate_profile.interests)
        
        # 2. Intentions Compatibility (30 points)
        score += AffinityService._calculate_intention_score(user_profile.intentions, candidate_profile.intentions)
        
        # 3. MBTI Compatibility (10 points)
        if hasattr(user_profile, 'mbti') and hasattr(candidate_profile, 'mbti'):
            if user_profile.mbti and candidate_profile.mbti:
                score += 5 # Base points
        
        # 4. Activity Patterns (10 points)
        if user_profile.activity_pattern == candidate_profile.activity_pattern:
            score += 10
        
        # 5. Music/Spotify (10 points)
        score += 5 # Placeholder
        
        # 6. Language Match (10 points)
        user_langs = user_profile.languages or []
        candidate_langs = candidate_profile.languages or []
        common_languages = set(user_langs) & set(candidate_langs)
        if common_languages:
            score += 10
            
        # 7. Height Compatibility (10 points - New)
        if getattr(user_profile, 'height_relevant', True):
            prefs = getattr(user_profile, 'height_preferences', [])
            label = getattr(candidate_profile, 'height_label', 'average')
            if label in prefs:
                score += 10
            elif not prefs or "none" in prefs:
                score += 10
        else:
            score += 10

        return min(score, max_score)

    @staticmethod
    def _calculate_intention_score(user_intentions: List[str], candidate_intentions: List[str]) -> int:
        if not user_intentions or not candidate_intentions:
            return 0
            
        score = 0
        user_set = set(user_intentions)
        candidate_set = set(candidate_intentions)
        
        # Exact matches (High priority)
        common = user_set & candidate_set
        score += len(common) * 10
        
        # Partial matches logic (Simplified for now)
        # If one wants serious and other is open to it
        serious_types = {"serious_relationship", "open_relationship"}
        fun_types = {"casual_fun", "short_term_fun", "open_relationship"}
        
        has_serious = bool(user_set & serious_types)
        candidate_has_serious = bool(candidate_set & serious_types)
        
        if has_serious and candidate_has_serious and not common:
            score += 5
            
        return min(score, 30) # Max 30 points for intentions

    @staticmethod
    def _calculate_interest_score(user_interests: List[str], candidate_interests: List[str]) -> int:
        if not user_interests or not candidate_interests:
            return 0
            
        user_set = set(user_interests)
        candidate_set = set(candidate_interests)
        
        common = user_set & candidate_set
        
        # If they share more than 3 interests, max points
        if len(common) >= 3:
            return 30
        elif len(common) == 2:
            return 20
        elif len(common) == 1:
            return 10
            
        return 0

    @staticmethod
    async def get_recommendations(user_profile: Profile, limit: int = 10) -> List[Dict]:
        """
        Get recommended profiles sorted by affinity
        """
        # Find potential candidates (basic filtering)
        candidates = await Profile.find(
            {
                "user_id": {"$ne": user_profile.user_id},
                "show_me_in_discovery": True,
                "profile_visible": True,
                "age": {
                    "$gte": user_profile.age_range_min,
                    "$lte": user_profile.age_range_max
                }
            }
        ).to_list()
        
        recommendations = []
        for candidate in candidates:
            score = AffinityService.calculate_score(user_profile, candidate)
            recommendations.append({
                "profile": candidate,
                "score": score
            })
            
        # Sort by score descending
        recommendations.sort(key=lambda x: x["score"], reverse=True)
        
        return recommendations[:limit]

