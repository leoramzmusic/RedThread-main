# Gestor de Notificaciones — Especificación y Plan de Implementación (Documento Único)

**Versión:** 3.0  
**Fecha:** 2026-10-25  
**Área:** Producto / Ingeniería  
**Estado:** Aprobado para implementación  
**Ubicación única:** `docs/superpowers/specs/2026-10-25-gestor-notificaciones-modulos.md`

> **Nota:** Este documento es la fuente única de verdad. Cualquier archivo anterior con nombre similar queda sustituido por este.

---

## 1. Resumen Ejecutivo

El **Gestor de Notificaciones** es un módulo administrativo centralizado que permite administrar toda la comunicación de RETH desde un único punto, soportando múltiples audiencias sin duplicar lógica de negocio.

**Audiencias soportadas:**
1. **Usuarios** — Usuarios finales de la aplicación de citas (APP) ✅ Especificado y planificado
2. **Empleados** — Personal interno del portal de administración ⏳ Estructura pendiente
3. **Marcas** — Marcas/Anunciantes de la plataforma ⏳ Estructura pendiente

Cada audiencia tiene su propio submenú bajo el padre "🔔 Gestor de Notificaciones", con las mismas capacidades funcionales pero parametrizadas por `recipient_type` (`users` | `employees` | `brands`).

---

## 2. Arquitectura del Sidebar Administrativo

```
ADMINISTRACIÓN
├─ Dashboard
├─ Usuarios
├─ Empleados
├─ Marcas
│
└─ 🔔 GESTOR DE NOTIFICACIONES ▼
   ├─ Dashboard General          (KPIs ejecutivos de todo el ecosistema)
   ├─ 🗑 Papelera Global         (Recuperación transversal: plantillas, campañas, programaciones, audiencias de TODAS las audiencias)
   │
   ├─ 👤 Usuarios ▼
   │  ├─ Dashboard
   │  ├─ Centro de Pruebas       (Notification Sandbox)
   │  ├─ Crear Notificación
   │  ├─ Plantillas
   │  ├─ Audiencias
   │  ├─ Campañas
   │  ├─ Programaciones
   │  ├─ Entregas                (Estado de envíos: enviada, entregada, leída, fallida, expirada)
   │  ├─ Historial
   │  └─ Métricas
   │
   ├─ 🛡 Empleados ▶
   │  ├─ Dashboard
   │  ├─ Centro de Pruebas
   │  ├─ Crear Notificación
   │  ├─ Alertas Operativas
   │  ├─ Reglas Automáticas
   │  ├─ Plantillas
   │  ├─ Historial
   │  └─ Métricas
   │
   └─ 🏷 Marcas ▶
      ├─ Dashboard
      ├─ Centro de Pruebas
      ├─ Crear Notificación
      ├─ Campañas
      ├─ Audiencias
      ├─ Plantillas
      ├─ Historial
      └─ Métricas
```

**Reglas de UX:**
- **Nivel 1:** "Gestor de Notificaciones" puede expandirse o contraerse.
- **Nivel 2:** Cada audiencia posee su propio submenú.
- **Nivel 3:** Cada audiencia contiene sus capacidades.
- **Comportamiento de expansión:** Solo un submenú abierto a la vez (acordeón).
- **Indentación:** Nivel 2 con indentación marcada y color distinto al nivel padre.
- **Dashboard General:** Primer hijo del padre, con métricas agregadas de todo el ecosistema.
- **Papelera Global:** Segundo hijo del padre, transversal a todas las audiencias (usuarios, empleados, marcas). **No hay papelera dentro de cada audiencia individual.**

---

## 3. Módulo Usuarios — Especificación Completa

### 3.1 Menú del Módulo Usuarios

```
Notificaciones Usuarios
├─ Dashboard
├─ Centro de Pruebas           (Notification Sandbox)
├─ Crear Notificación
├─ Plantillas
├─ Audiencias
├─ Campañas
├─ Programaciones
├─ Entregas                    (Estado de envíos: enviada, entregada, leída, fallida, expirada)
├─ Historial
└─ Métricas
```

### 3.2 Orden de Implementación Recomendado

| Prioridad | Capacidad | Descripción |
|-----------|-----------|-------------|
| 1 | **Plantillas** | Biblioteca maestra con variables dinámicas `{{variable}}` |
| 2 | **Centro de Pruebas** (Notification Sandbox) | Validación antes del envío masivo |
| 3 | **Crear Notificación** | Envío individual a un usuario específico |
| 4 | **Audiencias** | Segmentación de usuarios en grupos |
| 5 | **Campañas** | Envío masivo (Plantilla + Audiencia) |
| 6 | **Programaciones** | Ejecución diferida/recurrente (separada de campañas) |
| 7 | **Entregas** (Entregas / Estado de envíos) | Estado de cada notificación enviada |
| 8 | **Historial** | Registro de auditoría |
| 9 | **Métricas** | Análisis profundo de rendimiento |

**Nota:** No existe "Papelera" ni "Archivadas" dentro del módulo Usuarios. El propósito del módulo es: Diseñar → Probar → Segmentar → Enviar → Programar → Medir. No almacenar elementos eliminados.

### 3.3 Detalle por Capacidad

#### 3.3.1 Dashboard (Vista ejecutiva de usuarios)

**Métricas mostradas:**
- Notificaciones enviadas hoy
- Entregadas
- Leídas
- Pendientes
- Push fallidas
- Campañas activas
- Programadas
- Usuarios alcanzados

#### 3.3.2 Centro de Pruebas (Notification Sandbox)

**Objetivo:** Probar cualquier notificación antes de enviarla masivamente.

**Funciones:**
- Seleccionar plantilla
- Seleccionar usuario de prueba
- Simular variables dinámicas ({{first_name}}, {{matches_count}}, {{care_remaining}}, etc.)
- Enviar push de prueba
- Enviar notificación interna
- Vista previa
- Historial de pruebas

**Validaciones permitidas:**
- Push
- Notificación interna
- Sistema
- CARE
- Promociones
- Recordatorios

**Regla de negocio:** Una plantilla o campaña no puede enviarse masivamente sin haber pasado previamente por el Centro de Pruebas (recomendado, no obligatorio en Fase 1).

#### 3.3.3 Crear Notificación — Generación individual

**Objetivo:** Enviar una notificación a un usuario específico de forma manual.

**Flujo de uso:**
1. Seleccionar usuario (ej: Juan)
2. Seleccionar plantilla (ej: Actualización de perfil)
3. Editar contenido si es necesario (variables se resuelven automáticamente)
4. Enviar ahora

**Casos de uso:**
- Comunicación uno-a-uno
- Respuesta a un usuario específico
- Notificación administrativa puntual

#### 3.3.4 Plantillas (Biblioteca maestra)

**Objetivo:** Repositorio de notificaciones reutilizables con definición completa incluyendo variables dinámicas.

**Ejemplos de plantillas:**
- Nuevo Match
- Nuevo Like
- Nuevo Mensaje
- Encuesta CARE
- Recordatorio de Perfil
- Promoción
- Sistema
- Seguridad
- Push personalizada

**Campos de cada plantilla:**

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| Título | Asunto de la notificación | "Nuevo Match" |
| Cuerpo | Mensaje con variables dinámicas | "Hola {{first_name}}, tienes {{matches_count}} coincidencias nuevas" |
| Icono | Ícono visual asociado | `heart` |
| Acción | CTA o destino al hacer clic | `/profile/{id}` |
| Categoría | Tipo de notificación | `match`, `system`, `security`, `promo` |
| Prioridad | P0, P1, P2, P3 | `P1` |
| required_action | Si requiere acción del usuario | `true` |
| critical | Si es crítica (sobrepasa DND) | `false` |
| variables | Lista de variables disponibles | `[{name: "first_name", type: "string"}, {name: "matches_count", type: "integer"}]` |

**Variables dinámicas soportadas:**
- `{{first_name}}` — Nombre del usuario
- `{{matches_count}}` — Número de coincidencias nuevas
- `{{care_remaining}}` — Preguntas restantes de CARE
- `{{user_name}}` — Nombre de usuario
- `{{city}}` — Ciudad del usuario
- Cualquier campo del perfil del usuario

#### 3.3.5 Audiencias — Segmentación

**Objetivo:** Crear grupos de usuarios para envíos masivos posteriores. Aquí **no se envía nada todavía**, solo se definen grupos.

**Ejemplos de audiencias:**
- Usuarios sin foto
- Usuarios inactivos (>30 días)
- Usuarios Premium
- Usuarios con encuesta pendiente
- Usuarios con menos de 3 matches
- Usuarios de un país específico
- Usuarios con suscripción activa

**Campos de una audiencia:**
- Nombre de la audiencia
- Descripción
- Filtros aplicados (múltiples)
- Cantidad de usuarios estimada
- Fecha de última actualización

#### 3.3.6 Campañas — Envío masivo

**Objetivo:** Enviar una notificación a una audiencia completa de forma masiva.

**Combinación obligatoria:**
- Plantilla (qué enviar)
- Audiencia (a quién enviar)

**Ejemplo:**
```
Campaña: "Completa tu perfil"
Plantilla: "Perfil incompleto"
Audiencia: "Usuarios sin foto"
```

**Estados de campaña:**
- Borrador
- Programada
- En ejecución
- Completada
- Cancelada
- Fallida

#### 3.3.7 Programaciones — Ejecución diferida/recurrente

**Objetivo:** Definir **cuándo** enviar una campaña. Se separa estrictamente de Campañas porque una campaña puede ejecutarse una sola vez o 100 veces según la programación.

**Ejemplos:**
```
Cada lunes 09:00 → Recordatorio CARE
Cada 7 días → Encuesta pendiente
Cumpleaños → Feliz cumpleaños
Usuarios inactivos → Reactivación
```

**Opciones de programación:**
- Una vez (fecha y hora específica)
- Recurrente (diaria, semanal, mensual, personalizada)
- Fecha de inicio y fecha de fin opcional

**Relación con Campañas:** Una campaña puede tener una programación asociada o ejecutarse inmediatamente. La programación no define qué enviar ni a quién, solo cuándo.

#### 3.3.8 Entregas / Actividad — Estado de envíos

**Objetivo:** Responder preguntas operativas cuando se empiece a enviar Push reales. Es el módulo más útil una vez que se activan notificaciones push reales.

**Estados de cada entrega:**
- Enviada
- Entregada
- Leída
- Fallida
- Expirada

**Preguntas que responde:**
- ¿Por qué este usuario no recibió la notificación?
- ¿Falló Firebase?
- ¿La abrió?
- ¿La descartó?
- ¿Caducó?

**Campos de cada entrega:**
- ID de notificación
- Usuario destinatario
- Canal (push, in-app, email)
- Estado (enviada, entregada, abierta, descartada, caducada, fallida)
- Timestamp de cada transición
- Código de error si falló
- Proveedor (Firebase, etc.)

#### 3.3.9 Historial — Registro de auditoría

**Objetivo:** Mantener un registro completo de todo lo enviado.

**Información registrada:**
- Quién envió (administrador)
- Qué envió (plantilla/mensaje)
- A quién (usuario o audiencia)
- Cuándo (fecha y hora)
- Resultado (entregada, leída, fallida, etc.)

**Filtros disponibles:**
- Por fecha
- Por administrador
- Por tipo de notificación
- Por estado (entregada, leída, fallida)
- Por audiencia/campaña

#### 3.3.10 Métricas — Análisis profundo

**Objetivo:** Métricas más profundas que el Dashboard para optimizar la comunicación.

**Ejemplos de métricas:**
- CTR (Click-Through Rate)
- Aperturas (tasas de apertura)
- Lecturas
- Conversión (usuarios que completaron la acción)
- Usuarios alcanzados
- Push entregadas
- Push fallidas
- Comparativa campañas
- Rendimiento por plantilla

**Visualizaciones:**
- Gráficas de evolución temporal
- Comparativas entre campañas
- Embudo de conversión
- Top plantillas por rendimiento

---

## 4. Módulo Empleados — Especificación Pendiente

**Estado:** Pendiente de definir detalle.

```
Notificaciones Empleados
├─ Dashboard
├─ Centro de Pruebas
├─ Crear Notificación
├─ Alertas Operativas
├─ Reglas Automáticas
├─ Plantillas
├─ Historial
└─ Métricas
```

**Campos de definición pendientes:**
- Modelos de datos específicos para empleados
- Endpoints bajo `/api/admin/notifications/employees/`
- Pantallas frontend bajo `/portal-redthread/notifications/empleados/`
- Integración con `employee_rbac` (permisos: HANDLE_REPORTS, HANDLE_TICKETS, etc.)

**Disparadores operativos ya identificados:**
- Nueva denuncia → HANDLE_REPORTS
- Nuevo ticket de soporte → HANDLE_TICKETS (pendiente: crear endpoint de creación de tickets)
- Cambio de estado/asignación → permiso correspondiente
- Recordatorio operativo programado → requiere scheduler

---

## 5. Módulo Marcas — Especificación Pendiente

**Estado:** Pendiente de definir detalle.

```
Notificaciones Marcas
├─ Dashboard
├─ Centro de Pruebas
├─ Crear Notificación
├─ Campañas
├─ Audiencias
├─ Plantillas
├─ Historial
└─ Métricas
```

**Campos de definición pendientes:**
- Modelo `Brand` si no existe en el sistema
- Endpoints bajo `/api/admin/notifications/brands/`
- Pantallas frontend bajo `/portal-redthread/notifications/marcas/`
- Integración con permisos de marca/anunciante

---

## 6. Dashboard General (Vista Ejecutiva)

**Ubicación:** Primer hijo del padre "Gestor de Notificaciones"  
**Ruta:** `/portal-redthread/notifications/dashboard` (sin parámetro de audiencia)

**KPIs de primera fila (recomendados):**
- Enviadas Hoy
- Entregadas
- Leídas
- Pendientes
- Alertas críticas (P0)

**Nota:** CTR promedio se elimina de la primera fila (poco valor al inicio).

**Secciones del Dashboard General:**
1. **KPIs globales** — Métricas agregadas de todo el ecosistema
2. **Distribución por audiencia** — Usuarios / Empleados / Marcas (con barras visuales)
3. **Actividad reciente** — Campañas enviadas, plantillas modificadas, con timestamps
4. **Próximas campañas** — Programaciones próximas a ejecutarse
5. **Estado del sistema** — Alertas críticas, acciones requeridas, push fallidas, campañas activas
6. **Accesos rápidos** — + Nueva Notificación, + Nueva Plantilla, + Nueva Audiencia, + Nueva Campaña, + Programar Campaña

---

## 7. Papelera Global

**Ubicación:** Segundo hijo del padre "Gestor de Notificaciones"  
**Ruta:** `/portal-redthread/notifications/trash`

**Objetivo:** Recuperación transversal de elementos eliminados de cualquier audiencia.

**Elementos que viven aquí:**
- Plantillas eliminadas (usuarios/empleados/marcas)
- Campañas eliminadas (usuarios/empleados/marcas)
- Programaciones eliminadas (usuarios/empleados/marcas)
- Audiencias eliminadas (usuarios/empleados/marcas)

**Tiempo de retención:** 30 días

**Acciones disponibles:**
- Restaurar elemento al módulo original de su audiencia
- Eliminar definitivamente (borrado permanente)
- Vaciar papelera

**Nota:** La Papelera es transversal (nivel del Gestor de Notificaciones), NO pertenece a ninguna audiencia individual. Dentro de Usuarios/Empleados/Marcas no existe papelera propia.

---

## 8. Modelo de Datos (Backend)

### 8.1 NotificationTemplate

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | ObjectId | Identificador único |
| title | String | Título de la plantilla |
| body | String | Cuerpo con variables dinámicas `{{variable}}` |
| icon | String | Ícono asociado |
| action_url | String | Destino al hacer clic |
| category | String | `match`, `like`, `message`, `survey`, `reminder`, `promo`, `system`, `security` |
| priority | String | `P0`, `P1`, `P2`, `P3` |
| required_action | Boolean | Si requiere acción del usuario |
| critical | Boolean | Si sobrepasa DND |
| variables | Array | Lista de variables disponibles `[{name, type}]` |
| created_by | ObjectId | Administrador que creó la plantilla |
| created_at | DateTime | Fecha de creación |
| updated_at | DateTime | Última modificación |

### 8.2 NotificationAudience

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | ObjectId | Identificador único |
| name | String | Nombre de la audiencia |
| description | String | Descripción opcional |
| filters | Object | Filtros aplicados (JSON) |
| estimated_count | Integer | Cantidad de usuarios estimada |
| created_by | ObjectId | Administrador que creó la audiencia |
| created_at | DateTime | Fecha de creación |
| updated_at | DateTime | Última actualización |

### 8.3 NotificationCampaign

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | ObjectId | Identificador único |
| name | String | Nombre de la campaña |
| template_id | ObjectId | Plantilla utilizada (qué enviar) |
| audience_id | ObjectId | Audiencia objetivo (a quién enviar) |
| status | String | `draft`, `scheduled`, `active`, `completed`, `cancelled`, `failed` |
| scheduled_at | DateTime | Fecha de programación (opcional) |
| sent_at | DateTime | Fecha de envío real |
| created_by | ObjectId | Administrador que creó la campaña |
| created_at | DateTime | Fecha de creación |
| stats | Object | Contadores: enviadas, entregadas, leídas, fallidas |

### 8.4 NotificationSchedule

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | ObjectId | Identificador único |
| campaign_id | ObjectId | Campaña asociada |
| schedule_type | String | `once`, `recurring` |
| schedule_expression | String | Expresión cron o fecha específica |
| start_date | DateTime | Fecha de inicio |
| end_date | DateTime | Fecha de fin (opcional) |
| is_active | Boolean | Si la programación está activa |
| last_run | DateTime | Última ejecución |
| next_run | DateTime | Próxima ejecución programada |

### 8.5 NotificationDelivery (Entrega)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | ObjectId | Identificador único |
| notification_id | ObjectId | Notificación asociada |
| recipient_type | String | `user` \| `employee` \| `brand` |
| recipient_id | ObjectId | ID del destinatario |
| channel | String | `push`, `in_app`, `email` |
| status | String | `sent`, `delivered`, `opened`, `dismissed`, `expired`, `failed` |
| provider | String | `firebase`, `internal`, etc. |
| error_code | String | Código de error si falló |
| error_message | String | Mensaje de error |
| sent_at | DateTime | Fecha de envío |
| delivered_at | DateTime | Fecha de entrega |
| opened_at | DateTime | Fecha de apertura |
| created_at | DateTime | Fecha de creación |

### 8.6 NotificationHistory

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | ObjectId | Identificador único |
| template_id | ObjectId | Plantilla usada (opcional) |
| campaign_id | ObjectId | Campaña asociada (opcional) |
| recipient_type | String | `user` |
| recipient_id | ObjectId | ID del usuario destinatario |
| sender_id | ObjectId | ID del administrador que envió |
| status | String | `pending`, `sent`, `delivered`, `read`, `failed` |
| sent_at | DateTime | Fecha de envío |
| delivered_at | DateTime | Fecha de entrega |
| read_at | DateTime | Fecha de lectura |
| error_message | String | Mensaje de error si falló |
| created_at | DateTime | Fecha de creación |

---

## 9. API Endpoints (Módulo Usuarios)

### Plantillas
- `GET/POST /api/admin/notifications/users/templates`
- `GET/PUT/DELETE /api/admin/notifications/users/templates/{id}`

### Audiencias
- `GET/POST /api/admin/notifications/users/audiences`
- `GET/PUT/DELETE /api/admin/notifications/users/audiences/{id}`

### Campañas
- `GET/POST /api/admin/notifications/users/campaigns`
- `GET/PUT/DELETE /api/admin/notifications/users/campaigns/{id}`
- `POST /api/admin/notifications/users/campaigns/{id}/send`

### Programaciones
- `GET/POST /api/admin/notifications/users/schedules`
- `GET/PUT/DELETE /api/admin/notifications/users/schedules/{id}`

### Centro de Pruebas (Notification Sandbox)
- `POST /api/admin/notifications/users/test/send`
- `GET /api/admin/notifications/users/test/history`

### Crear Notificación Individual
- `POST /api/admin/notifications/users/send`

### Actividad / Entregas
- `GET /api/admin/notifications/users/deliveries` — Estado de cada envío

### Métricas
- `GET /api/admin/notifications/users/metrics`

### Historial
- `GET /api/admin/notifications/users/history`

---

## 10. Papelera Global — API

- `GET /api/admin/notifications/trash` — Listar elementos eliminados de todas las audiencias
- `POST /api/admin/notifications/trash/{id}/restore` — Restaurar elemento
- `DELETE /api/admin/notifications/trash/{id}` — Eliminar definitivamente

---

## 11. Dashboard General — API

- `GET /api/admin/notifications/kpis` — Métricas globales ejecutivas
- `GET /api/admin/notifications/kpis/audiences` — Distribución por audiencia
- `GET /api/admin/notifications/activity/recent` — Actividad reciente
- `GET /api/admin/notifications/campaigns/scheduled` — Próximas campañas
- `GET /api/admin/notifications/system/health` — Estado del sistema (tokens push, servicios, errores)

---

## 12. Frontend — Pantallas y Componentes

### Pantallas (rutas)

**Dashboard General:**
- `/portal-redthread/notifications/dashboard`

**Papelera Global:**
- `/portal-redthread/notifications/trash`

**Módulo Usuarios:**
- `/portal-redthread/notifications/users/dashboard`
- `/portal-redthread/notifications/users/test-center`
- `/portal-redthread/notifications/users/create`
- `/portal-redthread/notifications/users/templates`
- `/portal-redthread/notifications/users/audiences`
- `/portal-redthread/notifications/users/campaigns`
- `/portal-redthread/notifications/users/schedules`
- `/portal-redthread/notifications/users/activity` (Entregas)
- `/portal-redthread/notifications/users/history`
- `/portal-redthread/notifications/users/metrics`

**Módulo Empleados:** (misma estructura, ruta `/empleados/`)
**Módulo Marcas:** (misma estructura, ruta `/marcas/`)

### Componentes reutilizables
- `TemplateEditor` — Editor de plantillas con variables dinámicas `{{variable}}`
- `AudienceBuilder` — Constructor de segmentos con filtros
- `CampaignComposer` — Combinador de plantilla + audiencia
- `ScheduleEditor` — Editor de cronogramas (una vez / recurrente)
- `NotificationPreview` — Vista previa de notificación con variables resueltas
- `DeliveryTracker` — Rastreador de estado de entregas (Firebase, in-app, etc.)
- `MetricCard` — Tarjeta de métrica individual
- `TrashItem` — Elemento de la papelera con acciones

---

## 13. Reglas de Negocio

1. **Centro de Pruebas recomendado:** Una plantilla debería probarse antes de usarse en una campaña (no obligatorio en Fase 1).
2. **Campaña requiere plantilla y audiencia:** No se puede crear una campaña sin ambos elementos.
3. **Campaña y Programación son separadas:** Una campaña define qué enviar y a quién. La programación define cuándo enviar. Una campaña puede tener cero, una o múltiples programaciones.
4. **Papelera de 30 días:** Los elementos eliminados permanecen 30 días antes del borrado definitivo (solo en Papelera Global, no en audiencias individuales).
5. **Una audiencia puede usarse en múltiples campañas:** Las audiencias son reutilizables.
6. **Una plantilla puede usarse en múltiples campañas y notificaciones individuales.**
7. **Variables dinámicas:** Las plantillas soportan variables `{{variable_name}}` que se resuelven con datos del perfil del usuario al momento del envío.
8. **No hay Papelera dentro de Usuarios/Empleados/Marcas:** La Papelera es única y global, ubicada bajo el padre "Gestor de Notificaciones".

---

## 14. Reglas de Congelamiento (Hard Constraints)

**NO TOCAR hasta completar el Gestor de Notificaciones (Plantillas, Centro de Pruebas, Campañas):**

- `NotificationPanel` — Componente funcional existente, no modificar.
- `DND` (No Molestar) — Sistema de No Molestar acabado de estabilizar.
- `Rutinas` — Rutinas de pausado programado, no modificar.
- `Read/Resolved` — Lógica de lectura y resolución de notificaciones.
- `Papelera del usuario` — Papelera existente del usuario final, no tocar.

**Razón:** Son proyectos distintos y estables. Tocarlos ahora introduciría regresiones innecesarias mientras se construye el Gestor de Notificaciones.

---

## 15. Plan de Implementación (Fases)

### Fase 1: Infraestructura Común (Backend) ✅ COMPLETADA
- Paquete `backend/src/api/notifications/` con routers para usuarios, empleados, marcas
- Extender `Notification` con `recipient_type` (`user` | `employee` | `brand`)
- Crear modelos: `NotificationTemplate`, `NotificationAudience`, `NotificationCampaign`, `NotificationSchedule`, `NotificationDelivery`, `NotificationHistory`
- Endpoints globales: `/kpis`, `/kpis/audiences`, `/activity/recent`, `/campaigns/scheduled`, `/system/health`

### Fase 2: Módulo Usuarios (Backend + Frontend) ✅ COMPLETADA
- Las 10 capacidades implementadas: Plantillas, Centro de Pruebas, Crear Notificación, Audiencias, Campañas, Programaciones, Actividad/Entregas, Historial, Métricas
- **Nota:** Papelera NO está dentro de Usuarios (es global). Implementar pantalla de Entregas si no existe.
- Endpoints bajo `/api/admin/notifications/users/`
- Pantallas bajo `/portal-redthread/notifications/users/`
- Sidebar: padre "Gestor de Notificaciones" + submenú Usuarios con acordeón

### Fase 3: Módulo Empleados (Backend + Frontend) ✅ COMPLETADA
- Modelos y endpoints específicos para empleados
- Integración con `employee_rbac` y permisos operativos
- Pantallas bajo `/portal-redthread/notifications/empleados/`
- Sidebar: submenú Empleados

### Fase 4: Módulo Marcas (Backend + Frontend) ✅ COMPLETADA
- Modelo `Brand` si no existe en el sistema
- Endpoints bajo `/api/admin/notifications/brands/`
- Pantallas frontend bajo `/portal-redthread/notifications/marcas/`
- Sidebar: submenú Marcas

### Fase 5: Dashboard General, Papelera Global y componentes compartidos ✅ COMPLETADA
- Dashboard General con KPIs ejecutivos, distribución por audiencia, actividad reciente, próximas campañas, estado del sistema, salud del sistema, accesos rápidos
- Papelera Global transversal
- Componentes compartidos en `frontend/src/components/layout/shared/` (Navbar, SidebarItem, CollapsibleMenu, NotificationBadge)
- Reutilizar `NotificationPanel` con inyección de contexto `recipient_type`
- Replicar estilo visual entre Portal Usuario y Portal Administración

---

## 16. Archivos Relacionados

| Archivo | Rol |
|---------|-----|
| `docs/superpowers/specs/2026-10-25-gestor-notificaciones-modulos.md` | **Este documento** — Especificación + Plan único |
| `backend/src/services/notification_service.py` | Única fuente de verdad lógica |
| `backend/src/api/notifications/` | Paquete de APIs (usuarios, empleados, marcas) |
| `frontend/src/components/layout/admin/Sidebar.tsx` | Menú padre + submenús |
| `frontend/src/pages/portal-redthread/notifications/dashboard.tsx` — Dashboard General |
| `frontend/src/pages/portal-redthread/notifications/users/` — Módulo Usuarios |
| `frontend/src/pages/portal-redthread/notifications/employees/` — Módulo Empleados |
| `frontend/src/pages/portal-redthread/notifications/brands/` — Módulo Marcas |
| `frontend/src/pages/portal-redthread/notifications/trash.tsx` — Papelera Global |

---

## 17. Archivos Sustituidos

Los siguientes archivos quedan **reemplazados** por este documento único:

- `docs/superpowers/specs/2026-10-25-admin-notification-center-design.md`
- `docs/superpowers/specs/2026-10-25-admin-notification-center-redesign.md`
- `docs/superpowers/plans/2026-10-25-admin-notification-center-redesign.md`
- `docs/superpowers/plans/2026-10-25-admin-notification-center.md`
- Versiones previas de este mismo documento

---

## 18. Verificación Final

- [ ] Backend: pruebas unitarias por cada endpoint (plantillas, audiencias, campañas, programaciones, actividad/entregas, historial, métricas)
- [ ] Frontend: `npm run build` exitoso
- [ ] Frontend: `eslint` con 0 errores
- [ ] Sidebar: padre "Gestor de Notificaciones" con acordeón funciona
- [ ] Sidebar: solo un submenú de audiencia abierto a la vez
- [ ] Papelera Global: transversal a usuarios, empleados y marcas
- [ ] Variables dinámicas: `{{first_name}}`, `{{matches_count}}`, `{{care_remaining}}` resueltas en plantillas
- [ ] Separación Campaña/Programación: campaña define qué+a quién, programación define cuándo
- [ ] Módulo Actividad/Entregas: estado de cada envío (enviada, entregada, abierta, descartada, caducada, fallida)
- [ ] No existe Papelera dentro de Usuarios/Empleados/Marcas (solo global)
