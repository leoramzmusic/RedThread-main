"""
Constantes para los tópicos y tipos de evento de Kafka en RedThread.

Uso:
    from src.services.kafka_topics import KafkaTopic, KafkaEventType
    await kafka_service.publish(KafkaTopic.MATCHES_NEW, KafkaEventType.MATCH_CREATED, payload)
"""


class KafkaTopic:
    """Nombres de tópicos Kafka de RedThread."""

    # Matching & Discovery
    SWIPES = "rt.swipes"
    MATCHES_NEW = "rt.matches.new"

    # Chat & Comunicación
    CHAT_MESSAGES = "rt.chat.messages"

    # Actividad de Usuarios
    USER_EVENTS = "rt.user.events"

    # Notificaciones
    NOTIFICATIONS = "rt.notifications"

    # Moderación
    MODERATION = "rt.moderation"

    # Lista de todos los tópicos (para admin/health)
    ALL = [SWIPES, MATCHES_NEW, CHAT_MESSAGES, USER_EVENTS, NOTIFICATIONS, MODERATION]


class KafkaEventType:
    """Tipos de evento por tópico."""

    # --- rt.swipes ---
    SWIPE_LIKE = "swipe.like"
    SWIPE_PASS = "swipe.pass"
    SWIPE_SUPERLIKE = "swipe.superlike"

    # --- rt.matches.new ---
    MATCH_CREATED = "match.created"
    MATCH_EXPIRED = "match.expired"

    # --- rt.chat.messages ---
    MESSAGE_SENT = "message.sent"
    MESSAGE_READ = "message.read"
    MESSAGE_DELETED = "message.deleted"

    # --- rt.user.events ---
    USER_LOGIN = "user.session.start"
    USER_LOGOUT = "user.session.end"
    USER_PROFILE_VIEWED = "user.profile.viewed"
    USER_REGISTERED = "user.registered"
    USER_SUBSCRIPTION_CHANGED = "user.subscription.changed"

    # --- rt.notifications ---
    PUSH_MATCH = "push.match"
    PUSH_MESSAGE = "push.message"
    PUSH_LIKE = "push.like"
    EMAIL_MATCH = "email.match"
    EMAIL_WELCOME = "email.welcome"

    # --- rt.moderation ---
    USER_REPORTED = "moderation.user.reported"
    CONTENT_FLAGGED = "moderation.content.flagged"
