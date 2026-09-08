from typing import Dict, Optional, Tuple

# Regional height data (average in cm)
# Format: {region: (male_avg, female_avg)}
REGIONAL_AVERAGES: Dict[str, Tuple[int, int]] = {
    # Africa
    "north_africa": (173, 161),
    "east_africa": (167, 157),
    "west_africa": (170, 159),
    "south_africa": (169, 159),
    "central_africa": (169, 158),
    # America
    "caribbean": (174, 161),
    "north_america": (175, 162),
    "south_america": (173, 160),
    "central_america": (168, 154),
    # Asia
    "near_east": (172, 159),
    "far_east": (174, 162),
    "south_asia": (166, 155),
    "central_asia": (171, 160),
    "southeast_asia": (167, 155),
    # Europe
    "western_europe": (180, 166),
    "southern_europe": (176, 162),
    "northern_europe": (179, 165),
    "eastern_europe": (178, 165),
    # Oceania
    "australia_nz": (178, 165),
    "polynesia": (176, 165),
    "melanesia": (164, 157),
    "micronesia": (169, 159),
}

# Global Fallback (based on world weighted average approx)
GLOBAL_AVERAGE = (171, 159)

# Mapping common countries to regions
COUNTRY_TO_REGION_MAP: Dict[str, str] = {
    # America
    "mexico": "central_america",
    "guatemala": "central_america",
    "el salvador": "central_america",
    "honduras": "central_america",
    "costa rica": "central_america",
    "panama": "central_america",
    "belice": "central_america",
    "nicaragua": "central_america",
    
    "argentina": "south_america",
    "brasil": "south_america",
    "chile": "south_america",
    "colombia": "south_america",
    "peru": "south_america",
    "ecuador": "south_america",
    "uruguay": "south_america",
    "paraguay": "south_america",
    "bolivia": "south_america",
    "venezuela": "south_america",
    
    "usa": "north_america",
    "canada": "north_america",
    
    "españa": "southern_europe",
    "italia": "southern_europe",
    "francia": "western_europe",
    "alemania": "western_europe",
    "reino unido": "western_europe",
    # ... can be expanded as needed
}

def map_country_to_region(country: Optional[str]) -> str:
    """Map a country name to a regional key for data averages."""
    if not country:
        return "global"
    
    country_lower = country.lower().strip()
    return COUNTRY_TO_REGION_MAP.get(country_lower, "global")

# Regional specific thresholds (overrides default logic)
# Format: {region: {label: (min, max)}}
REGIONAL_THRESHOLDS: Dict[str, Dict[str, Tuple[float, float]]] = {
    "central_america": {
        "short": (1.40, 1.55),
        "average": (1.55, 1.70),
        "tall": (1.70, 2.00),
        "giant": (2.00, 2.50),
    },
    "north_america": {
        "short": (1.40, 1.60),
        "average": (1.60, 1.78),
        "tall": (1.78, 2.00),
        "giant": (2.00, 2.50),
    },
    "western_europe": {
        "short": (1.40, 1.65),
        "average": (1.65, 1.82),
        "tall": (1.82, 2.05),
        "giant": (2.05, 2.50),
    },
    "northern_europe": {
        "short": (1.40, 1.68),
        "average": (1.68, 1.85),
        "tall": (1.85, 2.10),
        "giant": (2.10, 2.50),
    },
    "south_asia": {
        "short": (1.30, 1.50),
        "average": (1.50, 1.65),
        "tall": (1.65, 1.90),
        "giant": (1.90, 2.50),
    },
    "southeast_asia": {
        "short": (1.30, 1.50),
        "average": (1.50, 1.65),
        "tall": (1.65, 1.90),
        "giant": (1.90, 2.50),
    },
    "far_east": {
        "short": (1.40, 1.60),
        "average": (1.60, 1.75),
        "tall": (1.75, 1.95),
        "giant": (1.95, 2.50),
    },
    "global": {
        "short": (1.40, 1.58),
        "average": (1.58, 1.73),
        "tall": (1.73, 1.95),
        "giant": (1.95, 2.50),
    }
}

def get_height_range_labels(region: Optional[str] = None) -> Dict[str, str]:
    """Return human-readable range labels for a region."""
    thresholds = REGIONAL_THRESHOLDS.get(region or "global", REGIONAL_THRESHOLDS["central_america"])
    return {
        key: f"{min_val:.2f} m – {max_val:.2f} m" if max_val < 2.50 else f"> {min_val:.2f} m"
        for key, (min_val, max_val) in thresholds.items()
    }

def classify_height(cm: int, gender: str, region: Optional[str] = None) -> str:
    """
    Classify height as 'short', 'average', 'tall', or 'giant' based on region and gender.
    
    Uses REGIONAL_THRESHOLDS if available for the region, otherwise falls back to Avg +/- 5cm.
    """
    if not cm:
        return "none"
        
    # Check for custom thresholds first
    if region in REGIONAL_THRESHOLDS:
        m = cm / 100.0
        for label, (min_m, max_m) in REGIONAL_THRESHOLDS[region].items():
            if min_m <= m < max_m:
                return label
        if m >= 2.0: return "giant"
        
    avg_m, avg_f = REGIONAL_AVERAGES.get(region, GLOBAL_AVERAGE)
    
    # Select average based on gender
    if gender == "female":
        avg = avg_f
    elif gender == "male":
        avg = avg_m
    else:
        avg = (avg_m + avg_f) / 2
        
    if cm > avg + 15:
        return "giant"
    elif cm > avg + 5:
        return "tall"
    elif cm < avg - 5:
        return "short"
    else:
        return "average"
