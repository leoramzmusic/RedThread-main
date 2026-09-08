from enum import Enum
from typing import List, Dict, Optional, Set
from src.models.profile import Profile
import random


class InterestCategory(str, Enum):
    CREATIVE = "creative"
    ADVENTUROUS = "adventurous"
    DIGITAL = "digital"
    LIFESTYLE = "lifestyle"


# Comprehensive interest catalog with categories and icons
INTEREST_CATALOG: Dict[str, Dict[str, str]] = {
    # Creative
    "Música": {"category": InterestCategory.CREATIVE, "icon": "🎵"},
    "Cine": {"category": InterestCategory.CREATIVE, "icon": "🎬"},
    "Escritura": {"category": InterestCategory.CREATIVE, "icon": "✍️"},
    "Fotografía": {"category": InterestCategory.CREATIVE, "icon": "📷"},
    "Arte": {"category": InterestCategory.CREATIVE, "icon": "🎨"},
    "Teatro": {"category": InterestCategory.CREATIVE, "icon": "🎭"},
    "Danza": {"category": InterestCategory.CREATIVE, "icon": "💃"},
    "Pintura": {"category": InterestCategory.CREATIVE, "icon": "🖌️"},
    
    # Adventurous
    "Viajes": {"category": InterestCategory.ADVENTUROUS, "icon": "✈️"},
    "Naturaleza": {"category": InterestCategory.ADVENTUROUS, "icon": "🌲"},
    "Senderismo": {"category": InterestCategory.ADVENTUROUS, "icon": "🥾"},
    "Camping": {"category": InterestCategory.ADVENTUROUS, "icon": "⛺"},
    "Deportes extremos": {"category": InterestCategory.ADVENTUROUS, "icon": "🪂"},
    "Ciclismo": {"category": InterestCategory.ADVENTUROUS, "icon": "🚴"},
    "Escalada": {"category": InterestCategory.ADVENTUROUS, "icon": "🧗"},
    "Surf": {"category": InterestCategory.ADVENTUROUS, "icon": "🏄"},
    
    # Digital
    "Gaming": {"category": InterestCategory.DIGITAL, "icon": "🎮"},
    "Tecnología": {"category": InterestCategory.DIGITAL, "icon": "💻"},
    "Streaming": {"category": InterestCategory.DIGITAL, "icon": "📺"},
    "Programación": {"category": InterestCategory.DIGITAL, "icon": "👨‍💻"},
    "Redes sociales": {"category": InterestCategory.DIGITAL, "icon": "📱"},
    "Podcasts": {"category": InterestCategory.DIGITAL, "icon": "🎙️"},
    "Anime": {"category": InterestCategory.DIGITAL, "icon": "🎌"},
    "E-sports": {"category": InterestCategory.DIGITAL, "icon": "🏆"},
    
    # Lifestyle
    "Cocina": {"category": InterestCategory.LIFESTYLE, "icon": "🍳"},
    "Fitness": {"category": InterestCategory.LIFESTYLE, "icon": "💪"},
    "Moda": {"category": InterestCategory.LIFESTYLE, "icon": "👗"},
    "Yoga": {"category": InterestCategory.LIFESTYLE, "icon": "🧘"},
    "Meditación": {"category": InterestCategory.LIFESTYLE, "icon": "🕉️"},
    "Lectura": {"category": InterestCategory.LIFESTYLE, "icon": "📚"},
    "Café": {"category": InterestCategory.LIFESTYLE, "icon": "☕"},
    "Vino": {"category": InterestCategory.LIFESTYLE, "icon": "🍷"},
    "Mascotas": {"category": InterestCategory.LIFESTYLE, "icon": "🐾"},
    "Jardinería": {"category": InterestCategory.LIFESTYLE, "icon": "🌱"},
}


# Location-based interest suggestions (city/state -> popular interests)
LOCATION_INTERESTS: Dict[str, List[str]] = {
    # Mexico
    "Tlaxcala": ["Cocina", "Naturaleza", "Senderismo", "Fotografía"],
    "Ciudad de México": ["Música", "Cine", "Arte", "Teatro", "Café"],
    "Guadalajara": ["Música", "Tecnología", "Fitness", "Cocina"],
    "Monterrey": ["Tecnología", "Fitness", "Senderismo", "Gaming"],
    "Cancún": ["Viajes", "Surf", "Naturaleza", "Fotografía"],
    "Oaxaca": ["Cocina", "Arte", "Fotografía", "Naturaleza"],
    
    # Generic fallbacks
    "default_urban": ["Café", "Cine", "Fitness", "Música"],
    "default_rural": ["Naturaleza", "Senderismo", "Fotografía", "Camping"],
}


class InterestService:
    """Service for managing interests with categorization and smart suggestions"""
    
    @staticmethod
    def get_categorized_interests() -> Dict[str, List[Dict[str, str]]]:
        """
        Returns all interests grouped by category
        
        Returns:
            {
                "creative": [{"name": "Música", "icon": "🎵"}, ...],
                "adventurous": [...],
                ...
            }
        """
        categorized = {
            InterestCategory.CREATIVE: [],
            InterestCategory.ADVENTUROUS: [],
            InterestCategory.DIGITAL: [],
            InterestCategory.LIFESTYLE: [],
        }
        
        for interest_name, data in INTEREST_CATALOG.items():
            category = data["category"]
            categorized[category].append({
                "name": interest_name,
                "icon": data["icon"]
            })
        
        return {cat.value: interests for cat, interests in categorized.items()}
    
    @staticmethod
    def get_suggested_interests(user_profile: Profile, limit: int = 8) -> List[Dict[str, str]]:
        """
        Generate smart interest suggestions based on:
        - User's location (city/state)
        - Age range
        - Existing interests (complementary suggestions)
        
        Args:
            user_profile: User's profile
            limit: Maximum number of suggestions
            
        Returns:
            List of suggested interests with metadata
        """
        suggestions: Set[str] = set()
        existing_interests = set(user_profile.interests or [])
        
        # 1. Location-based suggestions
        if user_profile.location:
            city = user_profile.location.city
            state = user_profile.location.state
            
            # Try city-specific
            if city and city in LOCATION_INTERESTS:
                suggestions.update(LOCATION_INTERESTS[city])
            # Try state-specific
            elif state and state in LOCATION_INTERESTS:
                suggestions.update(LOCATION_INTERESTS[state])
            # Urban vs rural fallback
            else:
                # Simple heuristic: if city exists, assume urban
                fallback = "default_urban" if city else "default_rural"
                suggestions.update(LOCATION_INTERESTS.get(fallback, []))
        
        # 2. Age-based suggestions
        age = user_profile.age
        if age < 25:
            suggestions.update(["Gaming", "Streaming", "Redes sociales", "Fitness"])
        elif age < 35:
            suggestions.update(["Viajes", "Fitness", "Cocina", "Tecnología"])
        else:
            suggestions.update(["Lectura", "Vino", "Jardinería", "Yoga"])
        
        # 3. Complementary suggestions based on existing interests
        if "Música" in existing_interests:
            suggestions.update(["Cine", "Teatro", "Danza"])
        if "Fitness" in existing_interests:
            suggestions.update(["Yoga", "Senderismo", "Ciclismo"])
        if "Tecnología" in existing_interests:
            suggestions.update(["Gaming", "Programación", "Podcasts"])
        if "Viajes" in existing_interests:
            suggestions.update(["Fotografía", "Naturaleza", "Camping"])
        
        # Remove interests user already has
        suggestions -= existing_interests
        
        # Convert to list with metadata
        result = []
        for interest in suggestions:
            if interest in INTEREST_CATALOG:
                result.append({
                    "name": interest,
                    "icon": INTEREST_CATALOG[interest]["icon"],
                    "category": INTEREST_CATALOG[interest]["category"].value
                })
        
        # Shuffle and limit
        random.shuffle(result)
        return result[:limit]
    
    @staticmethod
    def search_interests(query: str, limit: int = 10) -> List[Dict[str, str]]:
        """
        Search interests by name (autocomplete)
        
        Args:
            query: Search query
            limit: Maximum results
            
        Returns:
            List of matching interests
        """
        query_lower = query.lower()
        results = []
        
        for interest_name, data in INTEREST_CATALOG.items():
            if query_lower in interest_name.lower():
                results.append({
                    "name": interest_name,
                    "icon": data["icon"],
                    "category": data["category"].value
                })
        
        return results[:limit]
    
    @staticmethod
    def get_interest_metadata(interest_name: str) -> Optional[Dict[str, str]]:
        """Get metadata for a specific interest"""
        if interest_name in INTEREST_CATALOG:
            data = INTEREST_CATALOG[interest_name]
            return {
                "name": interest_name,
                "icon": data["icon"],
                "category": data["category"].value
            }
        return None
