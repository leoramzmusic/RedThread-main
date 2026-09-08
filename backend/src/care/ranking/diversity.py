"""
Diversity and Exploration ranking for CARE Engine.

Ensures the discovery feed doesn't become a "popularity bubble" by 
proactively including diverse candidates.
"""

import random
from typing import List, Dict, Any


def get_popularity_bucket(candidate: Any) -> str:
    """Categorize candidate by popularity signals."""
    likes = candidate.popularity_signals.likes_received if hasattr(candidate, 'popularity_signals') else 0
    if likes > 100:
        return 'high_pop'
    if likes < 10:
        return 'low_pop'
    return 'mid_pop'


def group_by_bucket(scored_items: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    """Group scored items into popularity buckets."""
    buckets = {'low_pop': [], 'mid_pop': [], 'high_pop': []}
    for item in scored_items:
        bucket = get_popularity_bucket(item['candidate'])
        buckets[bucket].append(item)
    return buckets


def interleave_with_quotas(
    buckets: Dict[str, List[Dict[str, Any]]],
    quotas: Dict[str, float],
    limit: int,
    descending: bool = True
) -> List[Dict[str, Any]]:
    """Interleave items from buckets based on percentage quotas."""
    result = []
    
    # Sort all buckets by score first
    for b in buckets:
        buckets[b].sort(key=lambda x: x['score'], reverse=descending)
    
    # Simple interleave based on quotas
    # In a real system this would be more sophisticated
    for bucket_name, quota in quotas.items():
        count = int(limit * quota)
        result.extend(buckets[bucket_name][:count])
    
    # Fill remaining slots with highest scores from mid_pop and low_pop
    remaining_limit = limit - len(result)
    if remaining_limit > 0:
        others = [item for b in ['mid_pop', 'low_pop'] for item in buckets[b] if item not in result]
        others.sort(key=lambda x: x['score'], reverse=descending)
        result.extend(others[:remaining_limit])
    
    # Final sort to maintain score order within the interleaved result 
    # (Optional, depends on how much we want to force diversity)
    return result


def apply_diversity_reranking(
    ranked_items: List[Dict[str, Any]],
    diversity_factor: float = 0.15,
    max_popular_per_feed: int = 3
) -> List[Dict[str, Any]]:
    """
    Re-rank candidates to ensure diversity and exploration.
    
    Args:
        ranked_items: List of dicts with 'candidate' and 'score'
        diversity_factor: Percentage of feed to reserve (softened to 15%)
        max_popular_per_feed: Maximum popular profiles if they aren't 'active'
    """
    if not ranked_items:
        return []
        
    # 1. Identify "Popular", "Hidden Gems", and others
    popular = []
    hidden_gems = []
    others = []
    
    for item in ranked_items:
        candidate = item['candidate']
        likes = candidate.popularity_signals.likes_received if hasattr(candidate, 'popularity_signals') else 0
        resp_rate = candidate.responsiveness_score if hasattr(candidate, 'responsiveness_score') else 1.0
        
        # DYNAMIC CAP: Only limit popular profiles if they are "collectors" (low response rate)
        if likes > 100:
            if resp_rate < 0.3: # They receive many likes but don't respond
                popular.append(item)
            else:
                others.append(item) # Treat active popular profiles as normal personalization
        elif likes < 10:
            hidden_gems.append(item)
        else:
            others.append(item)
            
    # 2. Build the final feed
    final_feed = []
    
    # Cap popular profiles to avoid ELO-hell behavior
    final_feed.extend(popular[:max_popular_per_feed])
    
    # Reserve slots for hidden gems (Diversity Slots)
    num_diversity_slots = max(1, int(len(ranked_items) * diversity_factor))
    
    # Fill with others first (main personalization)
    remaining_others = others + popular[max_popular_per_feed:]
    final_feed.extend(remaining_others)
    
    # Inject hidden gems at random positions in the top half to ensure visibility
    # This "breaks the bubble"
    random.shuffle(hidden_gems)
    for gem in hidden_gems[:num_diversity_slots]:
        if gem not in final_feed:
            # Mark as discovery item for UI context
            gem['is_discovery'] = True
            # Insert at a random position within the current feed bounds
            pos = random.randint(0, len(final_feed))
            final_feed.insert(pos, gem)
            
    # Add anything left over at the end
    all_included = set(id(item) for item in final_feed)
    for item in ranked_items:
        if id(item) not in all_included:
            final_feed.append(item)
            
    return final_feed
