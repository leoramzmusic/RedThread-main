from datetime import datetime, timedelta
from typing import Optional
from src.models.session import Session
from src.models.user import User
from src.core.config import settings
import math


async def check_suspicious_login(user: User, ip_address: str, location: Optional[dict] = None) -> bool:
    """
    Detect suspicious login activity based on location changes
    
    Returns True if login is suspicious, False otherwise
    """
    # Get recent sessions (last 7 days)
    recent_sessions = await Session.find(
        Session.user_id == str(user.id),
        Session.created_at > datetime.utcnow() - timedelta(days=7),
        Session.is_active == True
    ).sort(-Session.created_at).to_list()
    
    if not recent_sessions or not location:
        return False
    
    # Check last session location
    last_session = recent_sessions[0]
    if not last_session.location:
        return False
    
    # Calculate distance between locations
    distance = calculate_distance(
        last_session.location.get('latitude'),
        last_session.location.get('longitude'),
        location.get('latitude'),
        location.get('longitude')
    )
    
    # Alert if distance exceeds threshold
    if distance and distance > settings.SUSPICIOUS_LOCATION_CHANGE_KM:
        # TODO: Send security alert email to user
        print(f"⚠️ Suspicious login detected for user {user.email}: {distance:.0f}km from last location")
        return True
    
    return False


async def enforce_max_sessions(user_id: str) -> None:
    """
    Enforce maximum number of active sessions per user
    Revokes oldest sessions if limit is exceeded
    """
    sessions = await Session.find(
        Session.user_id == user_id,
        Session.is_active == True
    ).sort(-Session.created_at).to_list()
    
    if len(sessions) > settings.MAX_ACTIVE_SESSIONS_PER_USER:
        # Revoke oldest sessions
        sessions_to_revoke = sessions[settings.MAX_ACTIVE_SESSIONS_PER_USER:]
        for session in sessions_to_revoke:
            session.is_active = False
            await session.save()
        
        print(f"🔒 Revoked {len(sessions_to_revoke)} old sessions for user {user_id}")


def calculate_distance(lat1: Optional[float], lon1: Optional[float], 
                       lat2: Optional[float], lon2: Optional[float]) -> Optional[float]:
    """
    Calculate distance between two coordinates using Haversine formula
    Returns distance in kilometers, or None if coordinates are invalid
    """
    if not all([lat1, lon1, lat2, lon2]):
        return None
    
    # Earth's radius in kilometers
    R = 6371.0
    
    # Convert to radians
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    
    # Haversine formula
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    distance = R * c
    return distance


def calculate_session_expiration(device_type: str, remember_me: bool) -> datetime:
    """Calculate session expiration datetime based on device type and remember_me setting"""
    if device_type == "mobile":
        days = settings.REFRESH_TOKEN_EXPIRE_DAYS_MOBILE
    elif remember_me:
        days = settings.REFRESH_TOKEN_EXPIRE_DAYS_WEB_REMEMBER
    else:
        days = settings.REFRESH_TOKEN_EXPIRE_DAYS_WEB
    
    return datetime.utcnow() + timedelta(days=days)


def parse_user_agent(user_agent: str) -> dict:
    """
    Parse user agent string to extract device information
    Simple implementation - can be enhanced with user-agents library
    """
    ua_lower = user_agent.lower()
    
    # Detect device type
    if 'mobile' in ua_lower or 'android' in ua_lower or 'iphone' in ua_lower:
        device_type = 'mobile'
    elif 'tablet' in ua_lower or 'ipad' in ua_lower:
        device_type = 'tablet'
    else:
        device_type = 'web'
    
    # Detect browser
    if 'chrome' in ua_lower and 'edg' not in ua_lower:
        browser = 'Chrome'
    elif 'firefox' in ua_lower:
        browser = 'Firefox'
    elif 'safari' in ua_lower and 'chrome' not in ua_lower:
        browser = 'Safari'
    elif 'edg' in ua_lower:
        browser = 'Edge'
    else:
        browser = 'Unknown'
    
    # Detect OS
    if 'windows' in ua_lower:
        os = 'Windows'
    elif 'mac' in ua_lower:
        os = 'macOS'
    elif 'linux' in ua_lower:
        os = 'Linux'
    elif 'android' in ua_lower:
        os = 'Android'
    elif 'ios' in ua_lower or 'iphone' in ua_lower or 'ipad' in ua_lower:
        os = 'iOS'
    else:
        os = 'Unknown'
    
    return {
        'device_type': device_type,
        'browser': browser,
        'os': os
    }
