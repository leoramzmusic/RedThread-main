"""
Tag affinity utility functions for CARE Engine.

Calculates user preferences based on interaction history with content tags.
"""

from typing import Dict, List


def calculate_tag_affinity(
    liked_tags: Dict[str, int],
    candidate_tags: List[str]
) -> float:
    """
    Calculate affinity score based on tag overlap.
    
    Args:
        liked_tags: Dictionary of tags user has liked -> count
        candidate_tags: List of tags associated with candidate
    
    Returns:
        Affinity score between 0.0 and 1.0
    """
    if not liked_tags or not candidate_tags:
        return 0.0
    
    # Calculate weighted overlap
    total_weight = sum(liked_tags.values())
    if total_weight == 0:
        return 0.0
    
    overlap_weight = sum(
        liked_tags.get(tag, 0) for tag in candidate_tags
    )
    
    # Normalize by total weight and number of candidate tags
    affinity = overlap_weight / (total_weight * len(candidate_tags))
    
    return min(1.0, affinity)


def normalize_length(items: List, max_len: int = 10) -> float:
    """
    Normalize list length to [0, 1] range.
    
    Args:
        items: List to normalize
        max_len: Maximum expected length
    
    Returns:
        Normalized score between 0.0 and 1.0
    """
    return min(1.0, len(items) / max_len)
