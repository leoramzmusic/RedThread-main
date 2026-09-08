"""
Consumer: rt.matches.new
Procesa eventos de nuevos matches entre usuarios.

Responsabilidades:
1. Enviar notificación push a ambos usuarios
2. Registrar el match en Redis para presencia en tiempo real
3. Actualizar métricas de CARE analytics
"""
import logging
from src.services.kafka_topics import KafkaEventType

logger = logging.getLogger(__name__)


async def handle_match_event(message: dict) -> None:
    """
    Procesa un evento del tópico rt.matches.new.

    Estructura del mensaje esperada:
    {
        "event_id": "uuid",
        "event_type": "match.created",
        "timestamp": "2026-...",
        "data": {
            "match_id": "...",
            "user_a_id": "...",
            "user_b_id": "...",
            "compatibility_score": 0.87,
            "intention": "ROMANTIC"
        }
    }
    """
    event_type = message.get("event_type")
    data = message.get("data", {})

    logger.info(f"[MatchConsumer] Procesando evento: {event_type} | match_id={data.get('match_id')}")

    if event_type == KafkaEventType.MATCH_CREATED:
        await _on_match_created(data)
    elif event_type == KafkaEventType.MATCH_EXPIRED:
        await _on_match_expired(data)
    else:
        logger.warning(f"[MatchConsumer] Tipo de evento desconocido: {event_type}")


async def _on_match_created(data: dict) -> None:
    """Procesa un nuevo match: notificaciones + analytics."""
    user_a_id = data.get("user_a_id")
    user_b_id = data.get("user_b_id")
    match_id = data.get("match_id")
    score = data.get("compatibility_score", 0)

    logger.info(
        f"[MatchConsumer] 💘 Nuevo match: {user_a_id} ↔ {user_b_id} "
        f"(score={score:.2f}, id={match_id})"
    )

    # 1. Publicar notificación push para ambos usuarios
    try:
        from src.services.kafka_service import kafka_service
        from src.services.kafka_topics import KafkaTopic, KafkaEventType

        for uid in [user_a_id, user_b_id]:
            await kafka_service.publish(
                topic=KafkaTopic.NOTIFICATIONS,
                event_type=KafkaEventType.PUSH_MATCH,
                payload={
                    "recipient_user_id": uid,
                    "match_id": match_id,
                    "compatibility_score": score,
                    "notification_type": "NEW_MATCH",
                },
                key=uid,
            )
    except Exception as exc:
        logger.error(f"[MatchConsumer] Error publicando notificación de match: {exc}")

    # 2. Registrar en Redis para presencia/chat instantáneo
    try:
        from src.services.redis_service import redis_service
        if redis_service.is_connected():
            pipe_key = f"match:{match_id}:users"
            await redis_service.client.sadd(pipe_key, user_a_id, user_b_id)
            await redis_service.client.expire(pipe_key, 86400 * 30)  # 30 días
    except Exception as exc:
        logger.error(f"[MatchConsumer] Error registrando match en Redis: {exc}")


async def _on_match_expired(data: dict) -> None:
    """Limpia datos de un match expirado."""
    match_id = data.get("match_id")
    logger.info(f"[MatchConsumer] Match expirado: {match_id}")

    try:
        from src.services.redis_service import redis_service
        if redis_service.is_connected():
            await redis_service.client.delete(f"match:{match_id}:users")
    except Exception as exc:
        logger.error(f"[MatchConsumer] Error limpiando match expirado: {exc}")
