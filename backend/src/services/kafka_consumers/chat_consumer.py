"""
Consumer: rt.chat.messages
Procesa eventos del chat en tiempo real.

Responsabilidades:
1. Gestionar entrega de mensajes entre usuarios
2. Si el destinatario está offline, disparar notificación push
3. Cachear mensajes recientes en Redis
4. Actualizar estado de lectura
"""
import logging
from src.services.kafka_topics import KafkaEventType

logger = logging.getLogger(__name__)


async def handle_chat_message(message: dict) -> None:
    """
    Procesa un evento del tópico rt.chat.messages.

    Estructura del mensaje esperada:
    {
        "event_id": "uuid",
        "event_type": "message.sent",
        "timestamp": "2026-...",
        "data": {
            "message_id": "...",
            "match_id": "...",
            "sender_id": "...",
            "recipient_id": "...",
            "content": "...",
            "created_at": "..."
        }
    }
    """
    event_type = message.get("event_type")
    data = message.get("data", {})

    logger.info(f"[ChatConsumer] Procesando evento: {event_type} | message_id={data.get('message_id')}")

    if event_type == KafkaEventType.MESSAGE_SENT:
        await _on_message_sent(data)
    elif event_type == KafkaEventType.MESSAGE_READ:
        await _on_message_read(data)
    elif event_type == KafkaEventType.MESSAGE_DELETED:
        await _on_message_deleted(data)
    else:
        logger.warning(f"[ChatConsumer] Tipo de evento desconocido: {event_type}")


async def _on_message_sent(data: dict) -> None:
    """Procesa el envío de un mensaje."""
    message_id = data.get("message_id")
    match_id = data.get("match_id")
    sender_id = data.get("sender_id")
    recipient_id = data.get("recipient_id")
    content = data.get("content", "")

    # 1. Cachear mensaje en Redis si está disponible
    try:
        from src.services.redis_service import redis_service
        if redis_service.is_connected() and message_id:
            await redis_service.cache_message(message_id, data, ttl=3600)
    except Exception as exc:
        logger.error(f"[ChatConsumer] Error cacheando mensaje en Redis: {exc}")

    # 2. Verificar presencia del destinatario; si está offline, emitir notificación push
    try:
        from src.services.redis_service import redis_service
        recipient_online = False
        if redis_service.is_connected() and recipient_id:
            recipient_online = await redis_service.is_user_online(recipient_id)

        if not recipient_online and recipient_id:
            logger.info(f"[ChatConsumer] Destinatario {recipient_id} está offline. Generando notificación.")
            from src.services.kafka_service import kafka_service
            from src.services.kafka_topics import KafkaTopic, KafkaEventType

            # Truncar vista previa si es largo
            preview = content[:60] + "..." if len(content) > 60 else content

            await kafka_service.publish(
                topic=KafkaTopic.NOTIFICATIONS,
                event_type=KafkaEventType.PUSH_MESSAGE,
                payload={
                    "recipient_user_id": recipient_id,
                    "sender_id": sender_id,
                    "match_id": match_id,
                    "preview": preview,
                    "notification_type": "CHAT_MESSAGE",
                },
                key=recipient_id,
            )
    except Exception as exc:
        logger.error(f"[ChatConsumer] Error despachando notificación para destinatario offline: {exc}")


async def _on_message_read(data: dict) -> None:
    """Procesa lectura de mensaje (recibo de lectura)."""
    match_id = data.get("match_id")
    reader_id = data.get("reader_id")
    logger.debug(f"[ChatConsumer] Mensaje leído en match {match_id} por {reader_id}")


async def _on_message_deleted(data: dict) -> None:
    """Limpia referencias de un mensaje eliminado."""
    message_id = data.get("message_id")
    logger.debug(f"[ChatConsumer] Mensaje eliminado: {message_id}")
