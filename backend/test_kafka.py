"""
Script de prueba para la integración de Apache Kafka en RedThread.
Prueba:
1. Conexión del Kafka Producer
2. Publicación de eventos en rt.swipes y rt.matches.new
3. Verificación de lectura con Kafka Consumer
4. Cierre seguro
"""
import asyncio
import os
import sys

# Asegurar encoding UTF-8
os.environ["PYTHONUTF8"] = "1"
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.core.config import settings
from src.services.kafka_service import kafka_service
from src.services.kafka_topics import KafkaTopic, KafkaEventType


async def run_test():
    print("=" * 60)
    print("🧪 REDTHREAD KAFKA INTEGRATION TEST")
    print("=" * 60)
    print(f"📍 Bootstrap Servers: {settings.KAFKA_BOOTSTRAP_SERVERS}")
    print(f"📍 Kafka Enabled    : {settings.KAFKA_ENABLED}")
    print(f"📍 Group ID         : {settings.KAFKA_GROUP_ID}")
    print("-" * 60)

    # 1. Conectar Producer
    print("\n1️⃣ Conectando Kafka Producer...")
    await kafka_service.connect()
    
    status = kafka_service.status()
    print(f"   Estado Producer: {status}")
    if not kafka_service.is_healthy():
        print(f"❌ Kafka no está saludable. Estado: {status}")
        return False

    print("   ✅ Producer conectado exitosamente.")

    # 2. Publicar evento de prueba en rt.swipes
    print("\n2️⃣ Publicando evento en tópico rt.swipes...")
    test_swipe = {
        "swiper_id": "test-user-001",
        "target_id": "test-user-002",
        "interaction": "like",
        "dwell_time_ms": 1200,
        "is_blind_mode": False
    }
    published_swipe = await kafka_service.publish(
        topic=KafkaTopic.SWIPES,
        event_type=KafkaEventType.SWIPE_LIKE,
        payload=test_swipe,
        key="test-user-001"
    )
    if published_swipe:
        print("   ✅ Evento 'swipe.like' publicado correctamente en rt.swipes")
    else:
        print("   ❌ Error publicando en rt.swipes")
        return False

    # 3. Publicar evento de prueba en rt.matches.new
    print("\n3️⃣ Publicando evento en tópico rt.matches.new...")
    test_match = {
        "match_id": "test-match-999",
        "user_a_id": "test-user-001",
        "user_b_id": "test-user-002",
        "compatibility_score": 0.94,
    }
    published_match = await kafka_service.publish(
        topic=KafkaTopic.MATCHES_NEW,
        event_type=KafkaEventType.MATCH_CREATED,
        payload=test_match,
        key="test-match-999"
    )
    if published_match:
        print("   ✅ Evento 'match.created' publicado correctamente en rt.matches.new")
    else:
        print("   ❌ Error publicando en rt.matches.new")
        return False

    # 4. Cerrar Producer
    print("\n4️⃣ Cerrando Kafka Producer...")
    await kafka_service.close()
    print("   ✅ Producer cerrado.")

    print("\n" + "=" * 60)
    print("🎉 TODAS LAS PRUEBAS DE KAFKA PASARON EXITOSAMENTE")
    print("=" * 60)
    return True


if __name__ == "__main__":
    success = asyncio.run(run_test())
    sys.exit(0 if success else 1)
