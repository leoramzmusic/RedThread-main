"""
Geographic utility functions for CARE Engine.

Includes Haversine distance calculation and proximity decay functions.
"""

import math
from typing import Tuple


def haversine_distance(
    loc1: Tuple[float, float],
    loc2: Tuple[float, float]
) -> float:
    """
    Calculate the great-circle distance between two points on Earth.
    
    Args:
        loc1: (latitude, longitude) of first point
        loc2: (latitude, longitude) of second point
    
    Returns:
        Distance in kilometers
    """
    lat1, lon1 = loc1
    lat2, lon2 = loc2
    
    # Earth's radius in kilometers
    R = 6371.0
    
    # Convert to radians
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    # Haversine formula
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    distance = R * c
    return distance


def proximity_decay(
    distance_km: float,
    max_distance_km: int,
    decay_km: int = 50
) -> float:
    """
    Calculate proximity bonus with exponential decay.
    
    Args:
        distance_km: Actual distance between user and candidate
        max_distance_km: User's maximum preferred distance
        decay_km: Distance at which bonus decays to 50%
    
    Returns:
        Proximity score between 0.0 and 1.0
    """
    if distance_km <= max_distance_km:
        # Within preferred range: full bonus
        return 1.0
    
    # Beyond preferred range: exponential decay
    excess_distance = distance_km - max_distance_km
    decay_factor = math.exp(-excess_distance / decay_km)
    
    return max(0.0, decay_factor)
