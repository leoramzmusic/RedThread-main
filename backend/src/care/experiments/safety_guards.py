"""
Safety guards for CARE Engine.

Implements exposure limits, fairness caps, and anti-gaming measures.
"""

from typing import Dict, Set
from datetime import datetime, timedelta
from src.care.models.candidate_profile import CandidateProfile


class ExposureTracker:
    """Tracks profile exposure to prevent repeated showing."""
    
    def __init__(self):
        # user_id -> {candidate_id: last_shown_timestamp}
        self._exposure_log: Dict[str, Dict[str, datetime]] = {}
    
    def can_show(
        self,
        user_id: str,
        candidate_id: str,
        min_interval_days: int = 7
    ) -> bool:
        """
        Check if a candidate can be shown to a user.
        
        Args:
            user_id: User ID
            candidate_id: Candidate ID
            min_interval_days: Minimum days between showings
        
        Returns:
            True if candidate can be shown, False otherwise
        """
        if user_id not in self._exposure_log:
            return True
        
        user_log = self._exposure_log[user_id]
        if candidate_id not in user_log:
            return True
        
        last_shown = user_log[candidate_id]
        min_interval = timedelta(days=min_interval_days)
        
        return datetime.now() - last_shown >= min_interval
    
    def record_exposure(self, user_id: str, candidate_id: str) -> None:
        """
        Record that a candidate was shown to a user.
        
        Args:
            user_id: User ID
            candidate_id: Candidate ID
        """
        if user_id not in self._exposure_log:
            self._exposure_log[user_id] = {}
        
        self._exposure_log[user_id][candidate_id] = datetime.now()
    
    def cleanup_old_entries(self, days: int = 30) -> None:
        """
        Remove exposure records older than specified days.
        
        Args:
            days: Number of days to keep
        """
        cutoff = datetime.now() - timedelta(days=days)
        
        for user_id in list(self._exposure_log.keys()):
            user_log = self._exposure_log[user_id]
            
            # Remove old entries
            self._exposure_log[user_id] = {
                cid: ts for cid, ts in user_log.items()
                if ts >= cutoff
            }
            
            # Remove empty user logs
            if not self._exposure_log[user_id]:
                del self._exposure_log[user_id]


class HighPopularityLimiter:
    """Limits visibility of high-popularity profiles."""
    
    def __init__(self, max_per_feed: int = 3):
        """
        Initialize limiter.
        
        Args:
            max_per_feed: Maximum high-pop profiles per feed
        """
        self.max_per_feed = max_per_feed
    
    def filter_high_pop(
        self,
        candidates: list,
        high_pop_threshold: int = 100
    ) -> list:
        """
        Limit number of high-popularity profiles in results.
        
        Args:
            candidates: List of candidate dicts with 'candidate' key
            high_pop_threshold: Likes threshold for high-pop classification
        
        Returns:
            Filtered list with limited high-pop profiles
        """
        high_pop = []
        other = []
        
        for item in candidates:
            candidate = item['candidate']
            if candidate.popularity_signals.likes_received > high_pop_threshold:
                high_pop.append(item)
            else:
                other.append(item)
        
        # Take only max_per_feed from high-pop
        limited_high_pop = high_pop[:self.max_per_feed]
        
        # Combine and maintain order
        return other + limited_high_pop


def prevent_metric_gaming(candidate: CandidateProfile) -> bool:
    """
    Detect potential metric gaming behavior.
    
    Red flags:
    - Very high likes but very low responsiveness
    - High match rate but low conversation rate
    - Suspicious activity patterns
    
    Args:
        candidate: Candidate profile
    
    Returns:
        True if suspicious, False otherwise
    """
    # Red flag 1: Collector behavior
    if (candidate.popularity_signals.likes_received > 200 and
        candidate.responsiveness_score < 0.15):
        return True
    
    # Red flag 2: High match rate but low engagement
    if (candidate.popularity_signals.match_rate > 0.8 and
        candidate.authenticity_signals.avg_conversation_length < 2.0):
        return True
    
    # Red flag 3: Very high ghosting rate
    if candidate.authenticity_signals.ghosting_rate > 0.7:
        return True
    
    return False


def apply_safety_filters(
    candidates: list,
    user_id: str,
    exposure_tracker: ExposureTracker,
    high_pop_limiter: HighPopularityLimiter,
    record: bool = True
) -> list:
    """
    Apply all safety filters to candidate list.
    
    Args:
        candidates: List of candidate dicts
        user_id: User ID
        exposure_tracker: Exposure tracking instance
        high_pop_limiter: High-pop limiting instance
    
    Returns:
        Filtered candidate list
    """
    # 1. Filter out recently shown profiles
    filtered = [
        item for item in candidates
        if exposure_tracker.can_show(user_id, item['candidate_id'])
    ]
    
    # 2. Filter out suspicious profiles
    filtered = [
        item for item in filtered
        if not prevent_metric_gaming(item['candidate'])
    ]
    
    # 3. Limit high-popularity profiles
    filtered = high_pop_limiter.filter_high_pop(filtered)
    
    # 4. Record exposures
    if record:
        for item in filtered:
            exposure_tracker.record_exposure(user_id, item['candidate_id'])
    
    return filtered
