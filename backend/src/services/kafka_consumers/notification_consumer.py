"""
Consumer: rt.notifications
Procesa y distribuye notificaciones en tiempo real a los usuarios.

Responsabilidades:
1. Enrutar notificaciones push (match, nuevo mensaje, nuevo like)
2. Enrutar emails transaccionales si aplica
3. Registrar notificaciones en la bandeja interna de la app
"""
import logging
from src.services.kafka_topics import KafkaEventType

logger = logging.getLogger(__name__)


async def handle_notification_event(message: dict) -> None:
    """
    Procesa un evento del tópico rt.notifications.

    Estructura del mensaje esperada:
    {
        "event_id": "uuid",
        "event_type": "push.match" | "push.message" | "email.welcome",
        "timestamp": "2026-...",
        "data": { ... }
    }
    """
    event_type = message.get("event_type")
    data = message.get("data", {})

    logger.info(f"[NotificationConsumer] 🔔 Evento recibido: {event_type}")

    if event_type == KafkaEventType.PUSH_MATCH:
        await _handle_push_match(data)
    elif event_type == KafkaEventType.PUSH_MESSAGE:
        await _handle_push_message(data)
    elif event_type == KafkaEventType.PUSH_LIKE:
        await _handle_push_like(data)
    elif event_type in [KafkaEventType.EMAIL_MATCH, KafkaEventType.EMAIL_WELCOME]:
        await _handle_email_notification(event_type, data)
    else:
        logger.warning(f"[NotificationConsumer] Tipo de notificación no soportado: {event_type}")


async def _handle_push_match(data: dict) -> None:
    """Envía notificación push de nuevo match."""
    recipient_id = data.get("recipient_user_id")
    match_id = data.get("match_id")
    score = data.get("compatibility_score", 0)

    logger.info(
        f"[NotificationConsumer] 💘 Push Notification [NEW MATCH] → Usuario {recipient_id} "
        f"| Match: {match_id} (Score: {score:.2f})"
    )
    # Registrar en Redis cola de notificaciones no leídas para la bandeja del usuario
    try:
        from src.services.redis_service import redis_service
        if redis_service.is_connected() and recipient_id:
            await redis_service.client.lpush(
                f"notifications:{recipient_id}",
                f"NEW_MATCH:{match_id}"
            )
            # Limitar tamaño de cola a 50 notificaciones recientes
            await redis_service.client.ltrim(f"notifications:{recipient_id}", 0, 49)
    except Exception as exc:
        logger.error(f"[NotificationConsumer] Error guardando notificación en Redis: {exc}")


async def _handle_push_message(data: dict) -> None:
    """Envía notificación push de nuevo mensaje de chat."""
    recipient_id = data.get("recipient_user_id")
    sender_id = data.get("sender_id")
    preview = data.get("preview", "")

    logger.info(
        f"[NotificationConsumer] 💬 Push Notification [CHAT] → Usuario {recipient_id} "
        f"de {sender_id}: '{preview}'"
    )
    try:
        from src.services.redis_service import redis_service
        if redis_service.is_connected() and recipient_id:
            await redis_service.client.lpush(
                f"notifications:{recipient_id}",
                f"MESSAGE:{sender_id}:{preview}"
            )
            await redis_service.client.ltrim(f"notifications:{recipient_id}", 0, 49)
    except Exception as exc:
        logger.error(f"[NotificationConsumer] Error guardando notificación de chat en Redis: {exc}")


async def _handle_push_like(data: dict) -> None:
    """Envía notificación de nuevo like recibido."""
    recipient_id = data.get("recipient_user_id")
    logger.info(f"[NotificationConsumer] ❤️ Push Notification [NEW LIKE] → Usuario {recipient_id}")


async def _handle_email_notification(event_type: str, data: dict) -> None:
    """Envía un email transaccional usando MailService si está configurado."""
    email_to = data.get("email")
    if not email_to:
        logger.warning("[NotificationConsumer] No se proporcionó dirección de correo para notificación email")
        return

    logger.info(f"[NotificationConsumer] 📧 Enviando correo tipo {event_type} a {email_to}")
