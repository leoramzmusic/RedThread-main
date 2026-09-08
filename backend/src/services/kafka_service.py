"""
Servicio central de Kafka para RedThread.

Gestiona el producer asíncrono y permite lanzar consumers como background tasks.
Implementa graceful degradation: si Kafka no está disponible y KAFKA_ENABLED=false,
todas las operaciones son no-ops silenciosos — el backend sigue funcionando.

Uso:
    # Publicar un evento
    await kafka_service.publish(
        topic=KafkaTopic.MATCHES_NEW,
        event_type=KafkaEventType.MATCH_CREATED,
        payload={"user_a": "...", "user_b": "..."}
    )

    # Arrancar un consumer en background (llamado desde main.py lifespan)
    asyncio.create_task(kafka_service.consume(KafkaTopic.SWIPES, handle_swipe))
"""

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Any, Callable, Optional
from uuid import uuid4

from src.core.config import settings

logger = logging.getLogger(__name__)

# Lazy import — sólo si aiokafka está disponible
try:
    from aiokafka import AIOKafkaProducer, AIOKafkaConsumer
    AIOKAFKA_AVAILABLE = True
except ImportError:
    AIOKAFKA_AVAILABLE = False
    logger.warning("aiokafka no está instalado. Kafka estará deshabilitado.")


class KafkaService:
    """
    Servicio asíncrono de Kafka con soporte de producer y consumer.

    - `connect()`: conecta el producer. Llamar en lifespan startup.
    - `close()`: cierra el producer. Llamar en lifespan shutdown.
    - `publish(topic, event_type, payload)`: publica un evento JSON.
    - `consume(topic, handler, group_id)`: inicia un consumer loop (usar con asyncio.create_task).
    - `is_healthy()`: retorna True si el producer está conectado.
    """

    def __init__(self):
        self._producer: Optional[Any] = None
        self._connected: bool = False
        self._enabled: bool = settings.KAFKA_ENABLED and AIOKAFKA_AVAILABLE

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    async def connect(self) -> None:
        """Conecta el producer de Kafka. No-op si KAFKA_ENABLED=false."""
        if not self._enabled:
            logger.info("⚠️  Kafka deshabilitado (KAFKA_ENABLED=false o aiokafka no disponible)")
            return

        try:
            self._producer = AIOKafkaProducer(
                bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
                value_serializer=lambda v: json.dumps(v, default=str).encode("utf-8"),
                key_serializer=lambda k: k.encode("utf-8") if k else None,
                max_batch_size=settings.KAFKA_MAX_BATCH_SIZE,
                linger_ms=settings.KAFKA_LINGER_MS,
                acks="all",              # Garantía de entrega fuerte
                enable_idempotence=True, # Exactly-once semantics a nivel de producer
                compression_type="gzip",
            )
            await self._producer.start()
            self._connected = True
            logger.info(f"✅ Kafka Producer conectado → {settings.KAFKA_BOOTSTRAP_SERVERS}")
        except Exception as exc:
            self._connected = False
            logger.error(f"❌ Kafka Producer falló al conectar: {exc}")
            # Graceful degradation — no lanzar excepción para no bajar la app

    async def close(self) -> None:
        """Cierra el producer. No-op si no estaba conectado."""
        if self._producer and self._connected:
            try:
                await self._producer.stop()
                self._connected = False
                logger.info("🛑 Kafka Producer cerrado correctamente")
            except Exception as exc:
                logger.error(f"Error cerrando Kafka Producer: {exc}")

    # ------------------------------------------------------------------
    # Publishing
    # ------------------------------------------------------------------

    async def publish(
        self,
        topic: str,
        event_type: str,
        payload: dict[str, Any],
        key: Optional[str] = None,
    ) -> bool:
        """
        Publica un evento en un tópico de Kafka.

        El mensaje incluye metadata estándar:
        - event_id: UUID único
        - event_type: tipo de evento (e.g. "match.created")
        - timestamp: ISO 8601 UTC
        - data: el payload original

        Args:
            topic: Nombre del tópico (usar KafkaTopic.*)
            event_type: Tipo de evento (usar KafkaEventType.*)
            payload: Datos del evento
            key: Clave de particionamiento (e.g. user_id para garantizar orden)

        Returns:
            True si se publicó, False si Kafka no está disponible.
        """
        if not self._enabled or not self._connected:
            return False

        message = {
            "event_id": str(uuid4()),
            "event_type": event_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": payload,
        }

        try:
            await self._producer.send(topic, value=message, key=key)
            logger.debug(f"📤 Kafka → [{topic}] {event_type}")
            return True
        except Exception as exc:
            logger.error(f"Error publicando en Kafka [{topic}]: {exc}")
            return False

    # ------------------------------------------------------------------
    # Consuming
    # ------------------------------------------------------------------

    async def consume(
        self,
        topics: list[str] | str,
        handler: Callable[[dict], Any],
        group_id: Optional[str] = None,
    ) -> None:
        """
        Inicia un consumer loop asíncrono.

        Diseñado para ejecutarse como asyncio.create_task() en lifespan.
        Se reconecta automáticamente en caso de error.

        Args:
            topics: Tópico o lista de tópicos a consumir
            handler: Función async que recibe el mensaje deserializado
            group_id: Consumer group ID (default: settings.KAFKA_GROUP_ID)
        """
        if not self._enabled:
            return

        if isinstance(topics, str):
            topics = [topics]

        gid = group_id or settings.KAFKA_GROUP_ID

        while True:  # Loop de reconexión automática
            consumer = None
            try:
                consumer = AIOKafkaConsumer(
                    *topics,
                    bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
                    group_id=gid,
                    auto_offset_reset=settings.KAFKA_AUTO_OFFSET_RESET,
                    value_deserializer=lambda v: json.loads(v.decode("utf-8")),
                    enable_auto_commit=False,  # Manual commit para garantías de procesamiento
                )
                await consumer.start()
                logger.info(f"🎧 Kafka Consumer iniciado → {topics} [{gid}]")

                async for msg in consumer:
                    try:
                        await handler(msg.value)
                        await consumer.commit()
                    except Exception as exc:
                        logger.error(f"Error procesando mensaje Kafka [{msg.topic}]: {exc}")

            except asyncio.CancelledError:
                logger.info(f"Kafka Consumer [{topics}] cancelado")
                break
            except Exception as exc:
                logger.error(f"Error en Kafka Consumer [{topics}]: {exc}. Reconectando en 5s...")
                await asyncio.sleep(5)
            finally:
                if consumer:
                    try:
                        await consumer.stop()
                    except Exception:
                        pass

    # ------------------------------------------------------------------
    # Health
    # ------------------------------------------------------------------

    def is_healthy(self) -> bool:
        """Retorna True si el producer está activo."""
        return self._enabled and self._connected

    def status(self) -> str:
        """Retorna estado para el health check endpoint."""
        if not self._enabled:
            return "disabled"
        return "connected" if self._connected else "disconnected"


# Instancia global (singleton)
kafka_service = KafkaService()
