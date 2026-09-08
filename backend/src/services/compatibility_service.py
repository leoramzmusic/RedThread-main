"""
Compatibility Service for Discovery Matching

Handles logic for determining if two profiles are mutually compatible
based on gender preferences and sexual orientation.
"""

from typing import List, Optional
from src.models.profile import Profile


class CompatibilityService:
    """Service for checking profile compatibility in discovery"""
    
    @staticmethod
    def is_compatible(profile_a: Profile, profile_b: Profile, strict: bool = True) -> bool:
        """
        Check if two profiles are mutually compatible.
        
        Both users must be interested in each other's gender for compatibility.
        
        Args:
            profile_a: First user's profile
            profile_b: Second user's profile
            
        Returns:
            True if profiles are mutually compatible, False otherwise
        """
        
        # If either profile is not visible or not in discovery, not compatible
        if not profile_a.show_me_in_discovery or not profile_b.show_me_in_discovery:
            return False
        
        if not profile_a.profile_visible or not profile_b.profile_visible:
            return False
        
        # Get what each profile is looking for
        a_looking_for = profile_a.attraction_preferences or []
        b_looking_for = profile_b.attraction_preferences or []
        
        # If either hasn't set preferences, not compatible
        # (Users should set preferences before using discovery)
        if not a_looking_for or not b_looking_for:
            return False
        
        # Check mutual compatibility:
        # 1. Profile A's gender must be in Profile B's looking_for list
        # 2. Profile B's gender must be in Profile A's looking_for list
        
        a_gender = profile_a.gender
        b_gender = profile_b.gender
        
        a_interested_in_b = b_gender in a_looking_for
        b_interested_in_a = a_gender in b_looking_for
        
        if not strict:
            return a_interested_in_b
            
        return a_interested_in_b and b_interested_in_a
    
    @staticmethod
    def get_compatible_genders(profile: Profile) -> List[str]:
        """
        Get list of genders this profile is interested in.
        
        Args:
            profile: User's profile
            
        Returns:
            List of gender strings the user is looking for
        """
        return profile.attraction_preferences or []
    
    @staticmethod
    def is_interested_in(profile: Profile, target_gender: str) -> bool:
        """
        Check if profile is interested in a specific gender.
        
        Args:
            profile: User's profile
            target_gender: Gender to check interest in
            
        Returns:
            True if profile is interested in the target gender
        """
        looking_for = profile.attraction_preferences or []
        return target_gender in looking_for
    
    @staticmethod
    def get_compatibility_reason(profile_a: Profile, profile_b: Profile) -> str:
        """
        Get human-readable reason for compatibility or incompatibility.
        Useful for debugging and testing.
        
        Args:
            profile_a: First user's profile
            profile_b: Second user's profile
            
        Returns:
            String explaining compatibility status
        """
        
        if not profile_a.show_me_in_discovery:
            return f"{profile_a.display_name} is not shown in discovery"
        
        if not profile_b.show_me_in_discovery:
            return f"{profile_b.display_name} is not shown in discovery"
        
        if not profile_a.profile_visible:
            return f"{profile_a.display_name}'s profile is not visible"
        
        if not profile_b.profile_visible:
            return f"{profile_b.display_name}'s profile is not visible"
        
        a_looking_for = profile_a.attraction_preferences or []
        b_looking_for = profile_b.attraction_preferences or []
        
        if not a_looking_for:
            return f"{profile_a.display_name} hasn't set gender preferences"
        
        if not b_looking_for:
            return f"{profile_b.display_name} hasn't set gender preferences"
        
        a_gender = profile_a.gender
        b_gender = profile_b.gender
        
        a_interested_in_b = b_gender in a_looking_for
        b_interested_in_a = a_gender in b_looking_for
        
        if a_interested_in_b and b_interested_in_a:
            return f"✅ Compatible: {profile_a.display_name} ({a_gender}) ↔️ {profile_b.display_name} ({b_gender})"
        
        if not a_interested_in_b and not b_interested_in_a:
            return f"❌ Not compatible: Neither is interested in the other's gender"
        
        if not a_interested_in_b:
            return f"❌ Not compatible: {profile_a.display_name} is not interested in {b_gender}"
        
        if not b_interested_in_a:
            return f"❌ Not compatible: {profile_b.display_name} is not interested in {a_gender}"
        
        return "Unknown compatibility status"
    
    @staticmethod
    def filter_compatible_profiles(
        my_profile: Profile,
        candidate_profiles: List[Profile]
    ) -> List[Profile]:
        """
        Filter a list of profiles to only include compatible ones.
        
        Args:
            my_profile: Current user's profile
            candidate_profiles: List of potential match profiles
            
        Returns:
            Filtered list containing only compatible profiles
        """
        compatible = []
        
        for candidate in candidate_profiles:
            if CompatibilityService.is_compatible(my_profile, candidate):
                compatible.append(candidate)
        
        return compatible
    
    @staticmethod
    def get_compatibility_stats(
        my_profile: Profile,
        all_profiles: List[Profile]
    ) -> dict:
        """
        Get statistics about compatibility with a set of profiles.
        Useful for debugging and analytics.
        
        Args:
            my_profile: Current user's profile
            all_profiles: List of all profiles to check
            
        Returns:
            Dictionary with compatibility statistics
        """
        total = len(all_profiles)
        compatible = len(CompatibilityService.filter_compatible_profiles(my_profile, all_profiles))
        incompatible = total - compatible
        
        return {
            "total_profiles": total,
            "compatible": compatible,
            "incompatible": incompatible,
            "compatibility_rate": (compatible / total * 100) if total > 0 else 0
        }

