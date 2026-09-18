# ADR-006: Integración de Apache Kafka como Event Bus Asíncrono

- **Estado**: Aceptado
- **Fecha**: 2026-03-08
- **Decisores**: Equipo RedThread
- **Código Relacionado**: 
  - [[backend/src/main.py]]
  - [[backend/src/services/kafka_service.py]]
  - [[backend/src/services/kafka_topics.py]]
  - [[backend/src/services/kafka_consumers/match_consumer.py]]
  - [[backend/src/services/kafka_consumers/chat_consumer.py]]
  - [[backend/src/services/kafka_consumers/analytics_consumer.py]]
  - [[backend/src/services/kafka_consumers/notification_consumer.py]]
  - [[backend/src/api/discovery.py]]
  - [[backend/src/api/chat.py]]
  - [[backend/src/api/auth.py]]

---

## 🎯 Contexto y Problema
A medida que el tráfico de RedThread escala en acciones críticas (swipes masivos, formación de matches instantáneos, distribución de mensajes de chat y telemetría de engagement para el motor CARE), el acoplamiento síncrono de estas tareas en el ciclo de solicitud-respuesta HTTP/WebSocket genera latencias añadidas, contención en base de datos y riesgo de pérdida de eventos en picos de uso.

Se requería una arquitectura orientada a eventos (EDA) desacoplada, con garantías de entrega fuertes, retención distribuida y capacidad de replay para auditoría y reentrenamiento de modelos de machine learning.

## ⚖️ Decisión
Adoptar **Apache Kafka** (v4.1.1 en contenedor Docker con Zookeeper) como bus de mensajería empresarial distribuido, utilizando la librería asíncrona `aiokafka` (v0.11.0) en FastAPI con las siguientes directrices:

1. **Topología de Tópicos**:
   - `rt.swipes`: Eventos de interacción de descubrimiento (`swipe.like`, `swipe.pass`, `swipe.superlike`).
   - `rt.matches.new`: Eventos de emparejamientos mutuos formados (`match.created`, `match.expired`).
   - `rt.chat.messages`: Tráfico de mensajería en tiempo real (`message.sent`, `message.read`, `message.deleted`).
   - `rt.user.events`: Telemetría de ciclo de vida (`user.session.start`, `user.registered`).
   - `rt.notifications`: Enrutamiento asíncrono hacia push, emails y bandejas (`push.match`, `push.message`, `email.welcome`).
   - `rt.moderation`: Eventos de seguridad y reportes (`moderation.user.reported`).

2. **Garantías de Entrega**:
   - Producer configurado con `acks="all"`, `enable_idempotence=True`, compresión `gzip` y `linger_ms=5`.
   - Consumers operando en bucle asíncrono desacoplado dentro del `lifespan` de FastAPI, con commit manual (`enable_auto_commit=False`) y reconexión automática resiliente.

3. **Degradación Elegante (Graceful Degradation)**:
   - Bandera `KAFKA_ENABLED=true` y verificación continua de salud. Si el cluster de Kafka se detiene, la aplicación nunca se interrumpe y continúa sirviendo tráfico HTTP degradando funciones auxiliares a no-ops seguros.

## 📊 Consecuencias
### Positivas
- Desacoplamiento total entre la lógica de negocio y las tareas intensivas en I/O (notificaciones push, sincronización de caché en Redis, telemetría CARE).
- Tiempos de respuesta de endpoints críticos reducidos sustancialmente al eliminar bloqueos secundarios.
- Trazabilidad y consistencia para métricas de retención, límites diarios y prevención de abusos.
- Estado de salud observable en el endpoint unificado `/health` (`"kafka": "connected"`).

### Negativas / Mitigaciones
- Requerimiento de infraestructura adicional (broker Kafka + Zookeeper en Docker).
- Mitigación: Gestión mediante contenedores locales mapeados a puertos estándar (9092) y fallback silencioso si `KAFKA_ENABLED=false`.
