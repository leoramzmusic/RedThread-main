# 🕸️ RedThread - Mapa de Arquitectura y Relaciones (Obsidian Graph)

Este documento conecta los módulos clave de la arquitectura de RedThread con su documentación viva y decisiones de arquitectura (**ADRs**). Al abrir esta carpeta como un **Vault en Obsidian**, puedes:
1. Abrir el archivo **`redthread_architecture.canvas`** para explorar el canvas visual interactivo con tipado de aristas:
   - 🟣/🔵 **Líneas Moradas/Azules**: Importaciones, llamadas a funciones y endpoints entre archivos de código.
   - 🟡/🟢 **Líneas Amarillas/Verdes**: Vínculos desde el código hacia decisiones de arquitectura (`@adr [[Nota]]`) y auditorías técnicas.
2. Abrir la vista de grafo nativa de Obsidian (**Graph View** con `Ctrl + G`) con grupos de colores configurados en `.obsidian/graph.json`.
3. Navegar a la base de conocimiento principal en [[knowledge/index|knowledge/index.md]].

---

## 📜 Decisiones de Arquitectura (@adr) Conectadas al Código
- [[knowledge/adrs/ADR-001-fastapi-beanie-mongodb|ADR-001: FastAPI, Beanie ODM y MongoDB]]
  - *Código*: [[backend/src/main.py]], [[backend/src/core/database.py]], [[backend/src/models/user.py]], [[backend/src/models/profile.py]]
- [[knowledge/adrs/ADR-002-jwt-redis-session-management|ADR-002: Stateless JWT y Control de Sesiones en Redis]]
  - *Código*: [[backend/src/api/auth.py]], [[backend/src/core/utils/security.py]], [[backend/src/services/redis_service.py]]
- [[knowledge/adrs/ADR-003-care-matching-geo-engine|ADR-003: Motor CARE y Matching Híbrido]]
  - *Código*: [[backend/src/api/discovery.py]], [[backend/src/services/matching_service.py]], [[backend/src/models/match.py]]
- [[knowledge/adrs/ADR-004-nextjs-turbopack-redux|ADR-004: Next.js 16 (Turbopack) y Redux Toolkit]]
  - *Código*: [[frontend/src/pages/_app.tsx]], [[frontend/src/store/index.ts]], [[frontend/src/services/api.ts]]
- [[knowledge/adrs/ADR-005-rbac-multi-tier-admin|ADR-005: Control de Acceso RBAC y Portal de Empleados]]
  - *Código*: [[backend/src/api/admin_portal.py]], [[backend/src/models/admin_rbac.py]], [[backend/src/models/employee.py]]
- [[knowledge/adrs/ADR-006-kafka-event-bus|ADR-006: Integración de Apache Kafka como Event Bus Asíncrono]]
  - *Código*: [[backend/src/services/kafka_service.py]], [[backend/src/services/kafka_topics.py]], [[backend/src/services/kafka_consumers/match_consumer.py]], [[backend/src/services/kafka_consumers/chat_consumer.py]], [[backend/src/services/kafka_consumers/analytics_consumer.py]], [[backend/src/services/kafka_consumers/notification_consumer.py]]

---

## 🔍 Auditoría y Contexto Masivo para Agentes de IA
- [[knowledge/audits/Architecture_Audit|Auditoría de Salud de la Arquitectura]]: Evaluación de acoplamiento, puntos de fallo y mitigaciones.
- [[knowledge/agents/AI_AGENT_CONTEXT|Contexto Masivo para Agentes de IA]]: Tabla ultra resumida de símbolos y comandos para operar en cero tokens perdidos.

### Comandos Clave para Desarrolladores y Agentes de IA:
| Comando | Propósito | Beneficio de Tokens |
|---------|-----------|---------------------|
| `codegraph explore "<simbolo o archivo>"` | Muestra el código fuente del símbolo + su árbol completo de llamadas (call path) | Sustituye búsquedas grep repetitivas y lectura manual de 5 a 10 archivos en 1 solo paso. |
| `codegraph impact "<simbolo>"` | Analiza qué partes del código se rompen o afectan si modificas este símbolo | Previene efectos secundarios antes de hacer un refactor. |
| `codegraph callers "<simbolo>"` | Encuentra todas las funciones o métodos que invocan a este símbolo | Evita búsquedas ciegas de uso en frontend o backend. |
| `codegraph callees "<simbolo>"` | Encuentra todo lo que invoca este símbolo | Desglosa la lógica interna sin inspeccionar cada import. |
| `codegraph status` | Comprueba la salud y estadísticas del índice | Confirmación instantánea. |
| `codegraph sync` | Actualiza el índice con los últimos cambios en archivos | Mantiene el grafo al día en milisegundos. |

---

## 🗺️ Mapa de Conexiones por Capas

### 1. 🖥️ Capa Frontend (Next.js 16 + React 18 + Redux Toolkit)
- **Punto de Entrada**: [[frontend/src/pages/_app.tsx]]
  - Configura el Theme de Material UI, el Provider de Redux y el sistema i18n.
- **Cliente API**: [[frontend/src/services/api.ts]]
  - Cliente Axios centralizado con interceptores JWT Bearer y refresco automático.
  - Se comunica con el backend en `http://localhost:8000`.
- **Estado Global (Redux)**: [[frontend/src/store/index.ts]]
  - Slices: `authSlice.ts`, `chatSlice.ts`, etc.
- **Páginas Principales**:
  - Autenticación: [[frontend/src/pages/auth/login.tsx]], `register.tsx`
  - Descubrimiento & Radar: [[frontend/src/pages/discover/index.tsx]], `radar/index.tsx`
  - Chat en Tiempo Real: [[frontend/src/pages/chat/index.tsx]]
  - Portal de Administración: [[frontend/src/pages/portal-redthread/index.tsx]]
  - Perfil de Usuario: [[frontend/src/pages/profile/index.tsx]]

### 2. 🌐 Capa Backend API & Routers (FastAPI)
- **Punto de Entrada**: [[backend/src/main.py]]
  - Manejador de ciclo de vida (`lifespan`), inicialización de base de datos y Redis.
  - Registro de middleware (CORS, seguridad, CSP).
- **Routers**:
  - [[backend/src/api/auth.py]] -> `/auth/login`, `/auth/register`, `/auth/refresh`
  - [[backend/src/api/discovery.py]] -> Algoritmo de Hilo Rojo, filtros geográficos, radar.
  - [[backend/src/api/chat.py]] -> WebSocket `/ws/chat/{user_id}`, endpoints de mensajes y conversaciones.
  - [[backend/src/api/profiles.py]] -> Gestión de perfil, intereses, fotos, geoposición.
  - [[backend/src/api/users.py]] -> Estado de cuenta, preferencias, verificación.
  - [[backend/src/api/admin_portal.py]], `admin_usuarios.py`, `admin_empleados.py` -> RBAC para administradores.
  - [[backend/src/api/premium.py]] -> Suscripciones y pasarela Stripe.

### 3. ⚙️ Capa de Servicios de Negocio (Backend Services)
- **Seguridad & Token**: [[backend/src/core/utils/security.py]]
  - Generación y verificación de contraseñas bcrypt y JWT tokens (HS256).
- **Servicio de Descubrimiento & Matching**: [[backend/src/services/matching_service.py]]
  - `compatibility_service.py`: Cálculo de compatibilidad, intereses mutuos y proximidad en km.
- **Servicio de Caché y Sesiones**: [[backend/src/services/redis_service.py]]
  - Gestión de sesiones concurrentes, tokens revocados y presencia de usuarios en tiempo real.
- **Servicio de Mensajería**: [[backend/src/services/chat_service.py]]
  - Manejo de canales WebSocket, entrega diferida y persistencia.
- **Servicio de Empleados & RBAC**: [[backend/src/services/employee_service.py]]
  - Autenticación de personal administrativo y validación de roles (`SUPER_ADMIN`, `MODERATOR`, etc.).

### 4. 📦 Capa de Modelos de Datos (MongoDB / Beanie ODM)
- **Usuarios & Cuentas**: [[backend/src/models/user.py]] (Colección: `users`)
  - Email, hash de contraseña, tier (`FREE`, `PREMIUM`, `VIP`), flags de verificación.
- **Perfiles & Geolocalización**: [[backend/src/models/profile.py]] (Colección: `profiles`)
  - Coordenadas GeoJSON `Point`, bio, hobbies, intereses, orientación, métricas de perfil.
- **Relaciones & Matches**:
  - [[backend/src/models/match.py]] (Colección: `matches`)
  - [[backend/src/models/relationship.py]] (Colección: `relationships`)
- **Conversaciones & Mensajes**:
  - [[backend/src/models/conversation.py]] (Colección: `conversations`)
  - [[backend/src/models/message.py]] (Colección: `messages`)
- **Administración & Empleados**:
  - [[backend/src/models/admin_rbac.py]] (Colección: `admin_users`)
  - [[backend/src/models/employee.py]] (Colección: `employees`)

### 5. 🐳 Capa de Infraestructura & Almacenamiento
- **Docker Compose**: [[docker/docker-compose.local.yml]]
- **Variables de Entorno**: [[backend/config/local.env]]
- **MongoDB**: `localhost:27017` / Base de datos: `redthread` (32 colecciones).
- **Redis**: `localhost:6379` / Base de datos: `0` (Presencia, ratelimit, caché).
- **Apache Kafka**: `localhost:9092` (Broker v4.1.1 en Docker).
- **Zookeeper**: `localhost:2181` (Coordinador v3.8 en Docker).
- **CodeGraph**: `.codegraph/codegraph.db` (Grafo estático y dinámico del repositorio).

### 6. ⚡ Capa de Event Bus & Streaming Asíncrono (Apache Kafka)
- **Servicio Central**: [[backend/src/services/kafka_service.py]]
  - Producer asíncrono con `acks="all"`, `enable_idempotence=True`, compresión `gzip`.
  - Mecanismo de degradación elegante (`KAFKA_ENABLED=true/false`).
- **Definición de Tópicos & Eventos**: [[backend/src/services/kafka_topics.py]]
  - `rt.swipes` (`swipe.like`, `swipe.pass`, `swipe.superlike`)
  - `rt.matches.new` (`match.created`, `match.expired`)
  - `rt.chat.messages` (`message.sent`, `message.read`, `message.deleted`)
  - `rt.user.events` (`user.session.start`, `user.registered`)
  - `rt.notifications` (`push.match`, `push.message`, `email.welcome`)
  - `rt.moderation` (`moderation.user.reported`)
- **Consumers Asíncronos (Lifespan Background Tasks)**:
  - [[backend/src/services/kafka_consumers/match_consumer.py]] -> Notificaciones de match y presencia Redis.
  - [[backend/src/services/kafka_consumers/chat_consumer.py]] -> Entrega en tiempo real y fallback offline.
  - [[backend/src/services/kafka_consumers/analytics_consumer.py]] -> Cuotas diarias y señales CARE.
  - [[backend/src/services/kafka_consumers/notification_consumer.py]] -> Despacho push, email y bandeja in-app.

---

## 💡 Cómo Abrir en Obsidian
1. Abre **Obsidian**.
2. Selecciona **Open folder as vault** y elige la carpeta raíz:
   `c:\Users\leora\Documents\RETH\RedThread-main`
3. En el explorador de archivos de Obsidian:
   - Haz doble clic en **`redthread_architecture.canvas`** para el mapa visual interactivo.
   - Haz clic en este archivo **`ARCHITECTURE_GRAPH.md`** y presiona `Ctrl + G` para abrir la vista de grafo interactiva.
