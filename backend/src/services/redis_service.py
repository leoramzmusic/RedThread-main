import redis.asyncio as redis
from typing import Optional, Dict, Any
import json
from src.core.config import settings


class RedisService:
    """Redis service for caching, presence, and session management"""
    
    def __init__(self):
        self.client: Optional[redis.Redis] = None
    
    async def connect(self):
        """Initialize Redis connection"""
        try:
            self.client = await redis.from_url(
                f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}",
                password=settings.REDIS_PASSWORD,
                encoding="utf-8",
                decode_responses=True
            )
            # Test connection
            await self.client.ping()
            print(f"✅ Connected to Redis: {settings.REDIS_HOST}:{settings.REDIS_PORT}")
        except Exception:
            # Silently fail in local development to avoid log noise
            if settings.DEBUG:
                print("ℹ️ Redis not available (Presence/Caching disabled)")
            self.client = None
    
    async def close(self):
        """Close Redis connection"""
        if self.client:
            await self.client.close()
            print("✅ Redis connection closed")
    
    def is_connected(self) -> bool:
        """Check if Redis client is initialized"""
        return self.client is not None
    
    # User Presence
    async def set_user_online(self, user_id: str, ttl: int = 300):
        """Mark user as online (5 min TTL by default)"""
        if not self.client: return
        try:
            await self.client.setex(f"presence:{user_id}", ttl, "online")
        except Exception as e:
            print(f"⚠️ Redis error (set_user_online): {e}")
    
    async def set_user_offline(self, user_id: str):
        """Mark user as offline"""
        if not self.client: return
        try:
            await self.client.delete(f"presence:{user_id}")
        except Exception as e:
            print(f"⚠️ Redis error (set_user_offline): {e}")
    
    async def is_user_online(self, user_id: str) -> bool:
        """Check if user is online"""
        if not self.client: return False
        try:
            result = await self.client.exists(f"presence:{user_id}")
            return result > 0
        except Exception as e:
            print(f"⚠️ Redis error (is_user_online): {e}")
            return False
    
    # Typing Indicators
    async def set_typing(self, user_id: str, match_id: str, ttl: int = 5):
        """Set typing indicator (5 sec TTL)"""
        if not self.client: return
        try:
            await self.client.setex(f"typing:{match_id}:{user_id}", ttl, "1")
        except Exception as e:
            print(f"⚠️ Redis error (set_typing): {e}")
    
    async def is_typing(self, user_id: str, match_id: str) -> bool:
        """Check if user is typing"""
        if not self.client: return False
        try:
            result = await self.client.exists(f"typing:{match_id}:{user_id}")
            return result > 0
        except Exception as e:
            print(f"⚠️ Redis error (is_typing): {e}")
            return False
    
    # Message Caching
    async def cache_message(self, message_id: str, message_data: Dict[str, Any], ttl: int = 3600):
        """Cache message for quick retrieval (1 hour TTL)"""
        if not self.client: return
        try:
            await self.client.setex(
                f"message:{message_id}",
                ttl,
                json.dumps(message_data)
            )
        except Exception as e:
            print(f"⚠️ Redis error (cache_message): {e}")
    
    async def get_cached_message(self, message_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve cached message"""
        if not self.client: return None
        try:
            data = await self.client.get(f"message:{message_id}")
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            print(f"⚠️ Redis error (get_cached_message): {e}")
            return None
    
    # Rate Limiting
    async def check_rate_limit(self, user_id: str, action: str, limit: int = 60, window: int = 60) -> bool:
        """Check if user has exceeded rate limit"""
        if not self.client: return True # Fail open if Redis is down
        try:
            key = f"ratelimit:{action}:{user_id}"
            current = await self.client.get(key)
            
            if current is None:
                # First request
                await self.client.setex(key, window, "1")
                return True
            
            count = int(current)
            if count >= limit:
                return False
            
            # Increment counter
            await self.client.incr(key)
            return True
        except Exception as e:
            print(f"⚠️ Redis error (check_rate_limit): {e}")
            return True # Fail open
    
    # Session Management
    async def store_session(self, session_id: str, user_id: str, ttl: int = 86400):
        """Store user session (24 hours TTL)"""
        if not self.client: return
        try:
            await self.client.setex(f"session:{session_id}", ttl, user_id)
        except Exception as e:
            print(f"⚠️ Redis error (store_session): {e}")
    
    async def get_session(self, session_id: str) -> Optional[str]:
        """Retrieve user ID from session"""
        if not self.client: return None
        try:
            return await self.client.get(f"session:{session_id}")
        except Exception as e:
            print(f"⚠️ Redis error (get_session): {e}")
            return None
    
    async def delete_session(self, session_id: str):
        """Delete session"""
        if not self.client: return
        try:
            await self.client.delete(f"session:{session_id}")
        except Exception as e:
            print(f"⚠️ Redis error (delete_session): {e}")
    
    # Discovery Queue Caching
    async def cache_discovery_queue(self, user_id: str, profile_ids: list, ttl: int = 1800):
        """Cache discovery queue (30 min TTL)"""
        if not self.client: return
        try:
            await self.client.setex(
                f"discovery:{user_id}",
                ttl,
                json.dumps(profile_ids)
            )
        except Exception as e:
            print(f"⚠️ Redis error (cache_discovery_queue): {e}")
    
    async def get_discovery_queue(self, user_id: str) -> Optional[list]:
        """Get cached discovery queue"""
        if not self.client: return None
        try:
            data = await self.client.get(f"discovery:{user_id}")
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            print(f"⚠️ Redis error (get_discovery_queue): {e}")
            return None

    # Generic JSON Cache (read-through / invalidation)
    async def get_cached_json(self, key: str) -> Optional[Any]:
        """Read-through JSON cache get. None si no existe o Redis está caído."""
        if not self.client: return None
        try:
            data = await self.client.get(key)
            if data is None:
                return None
            return json.loads(data)
        except Exception as e:
            print(f"⚠️ Redis error (get_cached_json): {e}")
            return None

    async def set_cached_json(self, key: str, value: Any, ttl: int) -> None:
        """Escribe JSON en caché con TTL. No-op si Redis está caído."""
        if not self.client: return
        try:
            await self.client.setex(key, ttl, json.dumps(value, default=str))
        except Exception as e:
            print(f"⚠️ Redis error (set_cached_json): {e}")

    async def invalidar_usuario(self, namespaces: list, user_id: str) -> None:
        """Invalida claves exactas cache:{ns}:{user_id}. No-op si Redis está caído."""
        if not self.client or not namespaces:
            return
        try:
            keys = [f"cache:{ns}:{user_id}" for ns in namespaces]
            await self.client.delete(*keys)
        except Exception as e:
            print(f"⚠️ Redis error (invalidar_usuario): {e}")


# Singleton instance
redis_service = RedisService()
