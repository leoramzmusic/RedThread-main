"""
Paquete de consumers de Kafka para RedThread.
Cada consumer maneja un dominio específico de eventos.
"""
from .match_consumer import handle_match_event
from .chat_consumer import handle_chat_message
from .analytics_consumer import handle_analytics_event
from .notification_consumer import handle_notification_event

__all__ = [
    "handle_match_event",
    "handle_chat_message",
    "handle_analytics_event",
    "handle_notification_event",
]
