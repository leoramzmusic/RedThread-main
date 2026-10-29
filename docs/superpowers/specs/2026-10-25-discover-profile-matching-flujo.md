# Flujo Completo: Módulo Discover → Perfil/Edit → Matching

**RedThread-main**  
**Versión:** 1.0  
**Fecha:** 2026-10-25  
**Área:** Producto / Ingeniería

---

## 1. Resumen Ejecutivo

El módulo **Discover** (Descubrir) es el motor de encuentro de perfiles de RedThread. Su entrada de verdad es el **perfil del usuario** (editado en `/profile/[nickname]/edit` mediante `ProfileEdit.tsx`), cuya información se persiste en `GET/PUT /profiles/me` y se consume en `GET /queue` para generar candidatos ordenados por score de compatibilidad (CARE affinity). Cada interacción (like/pass/superlike) se graba en `Match` con un `affinity_score`, y cuando hay match mutuo se crea una conversación.

> **Hallazgo de jerarquía:** `Editar Perfil` es la fuente de datos que alimenta todo el pipeline de descubrimiento y matching, pero no aparece como ítem de primer nivel en el menú principal (`Sidebar.tsx`). Está oculto bajo una ruta anidada (`/profile/@nickname/edit`) sin entrada de navegación directa desde el área SOCIAL donde vive `Descubrir`. Se propone elevarlo a ítem de navegación de primer nivel para cerrar el ciclo de retroalimentación (perfil → descubrimiento → matching → perfil).

---

## 2. Arquitectura de Flujo (vista de alto nivel)

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Edit Profile  │      │    Discover      │      │   Matching      │
│  /profile/edit  │─────▶│   GET /queue     │─────▶│  Match model    │
│  (ProfileEdit)  │      │  (CARE affinity) │      │  (affinity_score│
│                 │      │  GET /swipe      │      │   + status)     │
└─────────────────┘      └──────────────────┘      └─────────────────┘
         │                         │                         │
         │ PUT /profiles/me        │ POST /swipe             │ Conversation
         ▼                         ▼                         ▼
   Backend Profile              Match Document          Chat creado
   (fuente de truth)            (interacción + score)   (ensure_match_conversation)
```

---

## 3. Detalle por capa

### 3.1 Capa de entrada: Edición de Perfil (`/profile/[nickname]/edit`)

**Archivo:** `frontend/src/pages/profile/[nickname]/edit.tsx`  
**Componente principal:** `frontend/src/components/profile/ProfileEdit.tsx` (2018 líneas)

**Flujo de datos:**
1. `initData()` carga `GET /profiles/me` (línea 355) y `GET /options?lang=` (línea 351).
2. `ProfileEdit` renderiza secciones dinámicas desde `GET /api/profile-modules/` (línea 174), ordenadas por `moduleOrder` del backend.
3. Cada sección (`BasicInfoSection`, `InterestsSection`, `LocationSection`, `CivilStatusSection`, `CommunicationStyleSection`, etc.) edita un subconjunto de campos del `Profile` (Beanie Document).
4. El usuario guarda con `handleSave` → `PUT /profiles/me` (línea 394), que persiste todo el perfil y actualiza el avatar en Redux (`updateUserAvatar`).

**Campos del perfil que alimentan Discovery/Matching** (`backend/src/models/profile.py`):

| Campo | Línea | Uso en Discovery/Matching |
|-------|-------|---------------------------|
| `user_id` | 111 | Clave para excluir al propio usuario en `/queue` |
| `birth_date` / `age` | 114-115 | Filtro de edad ±5 años en curiosidad |
| `gender` | 116 | Filtro de atracción mutua (`attraction_preferences`) |
| `intentions` | 119 | Score de intención (30 pts) + filtro de relación |
| `interests` | 148 | Score de intereses (30 pts) + coincidencia |
| `languages` / `preferred_languages` | 159-161 | Filtro de idioma en `/queue` |
| `location` | 200 | Filtro de distancia (`$near`/`$maxDistance`) |
| `distance_preference_km` | 201 | Radio de búsqueda |
| `attraction_preferences` | 172 | Géneros a los que es atraído (filtro mutuo) |
| `relationship_status` | 234 | Bloqueo de SUPERLIKE si no es SINGLE |
| `show_me_in_discovery` | 330 | Exclusión de la cola si `false` |
| `profile_visible` | 343 | Exclusión de la cola si `false` |
| `profile_completion` | 381 | Umbral < 60 → perfil "incompleto" (relaja filtros) |
| `country_code` | 207 | Filtro por país (tier restringido) |

**Componente de completitud:** `ProfileCompletionWidget` muestra el % de completion (0-100) y pasos (0-5), derivado de `profile_completion` / `completion_steps`.

---

### 3.2 Capa de descubrimiento: `GET /queue`

**Archivo:** `backend/src/api/discovery.py` (1819 líneas)

**Pasos del endpoint (líneas 139-769):**

| Paso | Línea | Descripción |
|------|-------|-------------|
| 1. Carga perfil propio | 163 | `my_profile = await Profile.find_one(...)` |
| 2. Detecta perfil incompleto | 180 | `is_incomplete_profile = my_profile.profile_completion < 60` |
| 3. Sincroniza modo curiosidad | 241-265 | `curiosity_mode` / `curiosity_genders` desde query |
| 4. Excluye ya-interactuados | 269-290 | Construye `interacted_user_ids` de `existing_matches` |
| 5. Query base de candidatos | 286 | `{"profile_visible": True, "show_me_in_discovery": True}` |
| 6. Filtro de género / atracción mutua | 293-326 | `$in` en `gender` + verifica que el candidato busque tu género |
| 7. Filtro edad | 348-353 | Rango `age_range_min/max` con relajación ±5 en curiosidad |
| 8. Filtro distancia / ubicación | 357-430 | `$near`/`$maxDistance` o estados/países (tier restringido) |
| 9. Filtro idioma | 437-439 | `{"$in": my_profile.languages}` si `auto_preferred_languages` |
| 10. Filtro online | 447-460 | `connection_status` si `online=true` |
| 11. CARE ranking | 462-662 | Convierte perfiles a CARE, rankea con `rank_candidates` o `cold_start_recommendations` |
| 12. Safety filters | 574-588 | `exposure_tracker` y `high_pop_limiter` |
| 13. Re-ranking diversidad | 591-610 | `diversity_factor` por modo (opposites=0.5, free=0.4, suggested/blind=0.2) |
| 14. Filtro compatibilidad por modo | 614-662 | `opposites` <40%, `blind` ≥70%, `suggested` ≥10%, `free` todos |

**Respuesta:** `List[DiscoveryProfile]` con `affinity_score`, `match_reason`, `match_highlights`, `affinity_breakdown`, distancia, fotos (ocultas en blind), datos de presencia y tarjeta de completitud si el perfil está incompleto.

---

### 3.3 Capa de interacción: `POST /swipe`

**Archivo:** `backend/src/api/discovery.py` (líneas 772-1144)

**Flujo:**
1. Valida que el `target_user_id` exista (línea 777).
2. Valida límites de tier para superlikes (FREE=5, PREMIUM=10, VIP=∞) (líneas 817-843).
3. Busca `Match` existente bidireccional entre los dos usuarios (líneas 850-863).
4. Si existe match y doble PASS → `status = UNMATCHED` (líneas 875-889).
5. Si ambas partes LIKE/SUPERLIKE → `status = MATCHED`, `matched_at = now` (líneas 895-941).
6. Si no existe match, crea nuevo `Document` (líneas 1039-1051):
   ```python
   match = Match(
       user_id_1=str(current_user.id),
       user_id_2=request.target_user_id,
       user_1_interaction=request.interaction,
       affinity_score=score,  # de AffinityService.calculate_score
       is_superlike=...,
       mode=MatchMode.BLIND si is_blind_mode,
       unlock_state=UnlockState.LOCKED si blind,
       created_at=datetime.utcnow(),
   )
   await match.insert()
   ```
7. Calcula `affinity_score` con `AffinityService.calculate_score(my_profile, target_profile)` (línea 1032).
8. Alimenta CARE Engine: `on_user_action(...)`, `metrics_collector.record_swipe(...)`, `exposure_tracker.record_exposure(...)` (líneas 1080-1105).
9. Publica eventos Kafka: `KafkaTopic.SWIPES` y `KafkaTopic.MATCHES_NEW` (líneas 981-1014, 1115-1138).
10. Si hay match mutuo, crea conversación: `ensure_match_conversation(existing_match)` (línea 957).

---

### 3.4 Capa de scoring: Affinity Service + CARE Engine

**Archivos:**
- `backend/src/services/affinity.py` (131 líneas) — scoring clásico (0-100)
- `backend/src/care/scoring/compatibility.py` — CARE Engine (7 bloques canónicos: values, relationship_goals, neurodiversity, responsiveness, music, love_language, communication_style + bloque de identidad + factor chaos)

**Puntuación clásica (`AffinityService.calculate_score`, líneas 7-52):**

| Componente | Puntos | Campo del perfil |
|------------|--------|------------------|
| Intereses comunes | 30 | `interests` (30 si ≥3, 20 si 2, 10 si 1) |
| Intenciones | 30 | `intentions` (10 por coincidencia exacta) |
| MBTI | 10 | `mbti` (5 base si ambos tienen) |
| Patrón de actividad | 10 | `activity_pattern` (10 si igual) |
| Música/Spotify | 10 | Placeholder (5 fijos) |
| Idiomas | 10 | `languages` intersección |
| Altura | 10 | `height_label` vs `height_preferences` |

**Resultado:** `affinity_score` (0-100) guardado en `Match.affinity_score` y usado para ordenar la cola y filtrar por modo.

---

### 3.5 Modelo de datos: `Match`

**Archivo:** `backend/src/models/match.py` (101 líneas)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `user_id_1` | `Indexed(str)` | Primer usuario |
| `user_id_2` | `Indexed(str)` | Segundo usuario |
| `user_1_interaction` | `Optional[InteractionType]` | LIKE / PASS / SUPERLIKE |
| `user_2_interaction` | `Optional[InteractionType]` | LIKE / PASS / SUPERLIKE |
| `status` | `MatchStatus` | PENDING / MATCHED / UNMATCHED / BLOCKED |
| `affinity_score` | `float` | Score 0-100 de compatibilidad |
| `mode` | `MatchMode` | NORMAL / BLIND |
| `unlock_state` | `UnlockState` | LOCKED / PENDING / UNLOCKED |
| `matched_at` | `Optional[datetime]` | Cuando hay match mutuo |
| `is_superlike` | `bool` | Si alguno usó superlike |

**Índices:** `user_id_1`, `user_id_2`, `status`, `matched_at`, compuesto `[user_id_1, user_id_2]`.

---

## 4. Flujo de datos end-to-end (secuencia)

```
Usuario abre Descubrir
        │
        ▼
GET /queue ───────────────────────────────┐
        │                                 │
        ▼                                 │
Backend lee /profiles/me (perfil propio)  │
        │                                 │
        ▼                                 │
Filtra candidatos (género, edad, distancia,│
        idioma, online, incompleto)       │
        │                                 │
        ▼                                 │
CARE / Affinity ranking por puntuación    │
        │                                 │
        ▼                                 │
Lista de DiscoveryProfile (con score)     │
        │                                 │
        ▼                                 │
Usuario hace swipe (like/pass/superlike)  │
        │                                 │
        ▼                                 │
POST /swipe ──────────────────────────────┼───────┐
        │                                 │       │
        ▼                                 │       │
Crea/actualiza Match con affinity_score   │       │
        │                                 │       │
        ▼                                 │       │
¿Match mutuo? ──No────────────────────────┘       │
        │ Sí                                      │
        ▼                                         │
ensure_match_conversation() ──▶ Chat creado ──────┘
        │
        ▼
Usuario puede ver perfil del match (Blind Mode: unlock_state)
        │
        ▼
Editar perfil (PUT /profiles/me) actualiza datos de verdad
        │
        ▼
Próximo GET /queue usa perfil actualizado → nuevos candidatos
```

---

## 5. Integración con el sistema de notificaciones

Cuando ocurre un match mutuo o un like recibido, se notifica al usuario a través del sistema de notificaciones (F1-F4 ya implementado):
- `Notification` con `type: "match"` o `"like_received"`.
- `NotificationDelivery` con estado `pending`/`sent`/`delivered`/`read`.
- Prioridad `P1` para matches operativos críticos.

---

## 6. Ajuste de jerarquía propuesto

### Problema actual

En `frontend/src/components/layout/Sidebar.tsx` (líneas 203-378), la jerarquía de navegación es:

```
SOCIAL
├── Inicio (/home)
├── Descubrir (/discover)       ← consume datos del perfil
├── Amigos (/friends)
├── Golth (/golth)
├── Chat (/chat)
├── Likes (/likes)
└── Visitas (/visits)
ENTRETENIMIENTO
├── Gaming Zone
├── Ruleta
└── Radar
ORGANIZACIÓN
├── Eventos
└── Suscripción
SISTEMA
└── Configuración
    ├── Apariencia
    ├── Customize Navbar
    ├── Notificaciones
    ├── Seguridad
    ├── Accesibilidad
    ├── Privacidad
    └── Avanzado
```

**`Editar Perfil` (`/profile/@nickname/edit`) no existe como ítem de navegación.** El usuario debe:
1. Ir a su perfil (`/profile/@nickname`) — si sabe la URL.
2. O llegar vía `DiscoverEmptyState.tsx` (línea 115: `router.push('/profile/edit')`) cuando no tiene perfil completo.
3. O escribir la ruta manualmente.

Esto rompe el ciclo de retroalimentación: **el perfil es la fuente de datos de Discovery/Matching, pero no tiene lugar propio en la jerarquía de navegación.**

### Propuesta de ajuste de jerarquía

Elevar `Editar Perfil` a nivel de primer nivel dentro de la sección **SOCIAL** (o una nueva sección **PERFIL**), junto a `Descubrir`:

```
SOCIAL
├── Inicio (/home)
├── Descubrir (/discover)
├── Editar Perfil (/profile/@me/edit)   ← NUEVO: entrada directa
├── Amigos (/friends)
├── Chat (/chat)
├── Likes (/likes)
└── Visitas (/visits)
```

**Justificación:**
- `Editar Perfil` es la entrada de datos que alimenta `Descubrir` y `Matching`. Debe estar al mismo nivel jerárquico que `Descubrir`, no enterrado en una ruta anidada.
- Mejora el descubrimiento de la función: usuarios nuevos no saben que pueden editar su perfil para mejorar sus matches.
- Reduce fricción: un clic desde el sidebar en lugar de buscar la URL o esperar al empty state.

**Archivos a modificar:**
- `frontend/src/components/layout/Sidebar.tsx` — agregar ítem `profile` en la sección `social`, con `path: "/profile/@me/edit"` e icono `PersonIcon`.
- `frontend/src/components/layout/AdminSidebar.tsx` — evaluar si necesita equivalente para el portal admin (opcional).

---

## 6. Archivos clave del flujo

| Archivo | Rol |
|---------|-----|
| `frontend/src/pages/profile/[nickname]/edit.tsx` | Página de edición; llama `PUT /profiles/me` |
| `frontend/src/components/profile/ProfileEdit.tsx` | Componente de edición con 21 secciones |
| `frontend/src/components/layout/Sidebar.tsx` | Jerarquía de navegación (ajuste propuesto aquí) |
| `frontend/src/components/discovery/DiscoveryRefinementCard.tsx` | Refinamiento de descubrimiento |
| `backend/src/api/discovery.py` | Endpoints `/queue`, `/swipe`, `/matches`, etc. |
| `backend/src/services/affinity.py` | Score de compatibilidad clásico (0-100) |
| `backend/src/care/scoring/compatibility.py` | CARE Engine (scoring avanzado) |
| `backend/src/models/profile.py` | Modelo de perfil (fuente de truth) |
| `backend/src/models/match.py` | Modelo Match (interacciones + affinity_score) |
| `backend/src/models/user.py` | Modelo de usuario (tier, suscripción) |

---

## 7. Próximos pasos sugeridos

1. **Ajuste de jerarquía:** Agregar `Editar Perfil` como ítem de primer nivel en `Sidebar.tsx` (sección SOCIAL).
2. **Sincronización de perfil:** Validar que `PUT /profiles/me` invalide correctamente la cola de descubrimiento (cache busting) para que los cambios se reflejen inmediatamente.
3. **Completitud → Discover:** Reforzar la tarjeta de completitud en `/queue` para guiar al usuario a completar su perfil antes de descubrir.
4. **Documentar CARE:** Crear especificación separada del CARE Engine si se expone públicamente.
