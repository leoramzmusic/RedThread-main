"""
Consumer: rt.user.events y rt.swipes
Procesa métricas de uso y telemetría de usuario para el motor de compatibilidad CARE.

Responsabilidades:
1. Contabilizar swipes diarios y métricas de interacción en Redis
2. Registrar eventos de sesión (login, logout, registro)
3. Actualizar señales de engagement para el algoritmo de matching
"""
import logging
from src.services.kafka_topics import KafkaEventType

logger = logging.getLogger(__name__)


async def handle_analytics_event(message: dict) -> None:
    """
    Procesa un evento de analytics (rt.user.events o rt.swipes).

    Estructura del mensaje esperada:
    {
        "event_id": "uuid",
        "event_type": "swipe.like" | "user.session.start" | ...,
        "timestamp": "2026-...",
        "data": { ... }
    }
    """
    event_type = message.get("event_type")
    data = message.get("data", {})

    logger.debug(f"[AnalyticsConsumer] Evento recibido: {event_type}")

    # Eventos de Swipes
    if event_type in [
        KafkaEventType.SWIPE_LIKE,
        KafkaEventType.SWIPE_PASS,
        KafkaEventType.SWIPE_SUPERLIKE,
    ]:
        await _on_swipe_event(event_type, data)

    # Eventos de Usuario / Sesión
    elif event_type in [
        KafkaEventType.USER_LOGIN,
        KafkaEventType.USER_LOGOUT,
        KafkaEventType.USER_PROFILE_VIEWED,
        KafkaEventType.USER_REGISTERED,
        KafkaEventType.USER_SUBSCRIPTION_CHANGED,
    ]:
        await _on_user_event(event_type, data)

    else:
        logger.debug(f"[AnalyticsConsumer] Evento no específico para analytics: {event_type}")


async def _on_swipe_event(event_type: str, data: dict) -> None:
    """Procesa eventos de swipe para métricas y cuotas diarias."""
    swiper_id = data.get("swiper_id")
    target_id = data.get("target_id")

    logger.info(f"[AnalyticsConsumer] 👆 Swipe ({event_type}): {swiper_id} → {target_id}")

    # Incrementar contador de swipes diarios en Redis para control de límites / cuotas
    try:
        from src.services.redis_service import redis_service
        if redis_service.is_connected() and swiper_id:
            key = f"metrics:swipes_daily:{swiper_id}"
            await redis_service.client.incr(key)
            # Asegurar TTL de 24h si es nueva clave
            ttl = await redis_service.client.ttl(key)
            if ttl < 0:
                await redis_service.client.expire(key, 86400)
    except Exception as exc:
        logger.error(f"[AnalyticsConsumer] Error actualizando métricas de swipe en Redis: {exc}")


async def _on_user_event(event_type: str, data: dict) -> None:
    """Procesa eventos de actividad de usuario."""
    user_id = data.get("user_id")
    logger.info(f"[AnalyticsConsumer] 👤 Evento de usuario: {event_type} | user_id={user_id}")

    try:
        from src.services.redis_service import redis_service
        if redis_service.is_connected() and user_id:
            if event_type == KafkaEventType.USER_LOGIN:
                await redis_service.set_user_online(user_id)
            elif event_type == KafkaEventType.USER_LOGOUT:
                await redis_service.set_user_offline(user_id)
    except Exception as exc:
        logger.error(f"[AnalyticsConsumer] Error actualizando presencia en Redis: {exc}")
