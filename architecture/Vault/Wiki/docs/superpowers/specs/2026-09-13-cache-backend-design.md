# RedThread — Caché Backend (Fase 1) — Diseño

Fecha: 2026-09-13
Estado: Aprobado para implementación

## Contexto

El dashboard (`/home/stats`, `/home/recent-activity`, `/home/suggestions`) ejecuta consultas a
MongoDB en cada petición, por usuario. Ya existe `RedisService`
(`backend/src/services/redis_service.py`) con presencia, typing, caché de mensajes, sesiones,
queue de discovery y rate-limit; falla silencioso en local (fail-open). No hay capa de caché
genérica read/write-through para los endpoints del dashboard.

## Alcance (Fase 1 — Backend)

Caché read-through + TTL + invalidación selectiva para:

- `GET /home/stats` → `cache:stats:{user_id}` (TTL 30s)
- `GET /home/recent-activity` → `cache:recent:{user_id}` (TTL 60s)
- `GET /home/suggestions` → `cache:suggest:{user_id}` (TTL 600s)

`discovery:{user_id}` se mantiene como está (TTL 1800s ya existente).

Fuera de alcance en esta fase: admin, catálogos (idiomas/reglas), rankings, CARE "pesado",
Fase 2 frontend (Service Worker + IndexedDB) — quedan perfilados como trabajo futuro.

## Arquitectura

### Helpers genéricos en `RedisService` (`src/services/redis_service.py`)

- `get_cached_json(key) -> Any | None` — `GET` + `json.loads`; Redis caído → `None`.
- `set_cached_json(key, value, ttl) -> None` — `SETEX` + `json.dumps(value, default=str)`;
  Redis caído → no-op.
- `invalidar_usuario(namespaces: list[str], user_id: str) -> None` — `DELETE` exacto de
  `cache:{ns}:{user_id}` para cada ns; Redis caído → no-op.

Patrón fail-open idéntico al existente: si Redis no está conectado, los métodos no hacen nada
y la request cae a MongoDB como hoy.

### Read-through en `src/api/home.py`

Cada endpoint sigue:

```
key = f"cache:{ns}:{current_user.id}"
cached = await redis_service.get_cached_json(key)
if cached is not None:
    return cached
<compute existente>
await redis_service.set_cached_json(key, resultado, ttl=TTL)
return resultado
```

Se cachea el mismo dict que devuelve la API (ya JSON-serializable). Los cómputos no cambian;
los errores de cómputo se propagan igual que hoy (la caché no enmascara fallos).

### Invalidación (write-through selectivo)

Puntos de escritura que invalidan claves exactas:

| Escritura | Namespaces | Lugar |
|---|---|---|
| Enviar mensaje | `recent`, `stats` de emisor y receptor | `src/services/chat/routes.py` y WS `src/api/chat.py` |
| Marcar mensaje(s) como leído | `stats` (+`recent`) del lector | endpoint de lectura de chat |
| Actualizar perfil | `stats`, `suggest` del usuario | `src/api/profiles.py` |

Sugerencias/discovery: solo TTL (10min / 30min).

## Consistencia

- Contadores del dashboard pueden quedar desactualizados hasta el TTL (badge de mensajes hasta 30s);
  aceptado.
- No hay consistencia absoluta requerida en lectura; escrituras siempre van a MongoDB.

## Testing

Tests pytest-asyncio con stub dict en `redis_service.client` (get/setex/delete en memoria):

- Hit de caché: segunda llamada no toca Mongo (stub lo confirma).
- Miss: computa y guarda.
- Fail-open: `client=None` → endpoint responde normal.
- Invalidación: enviar mensaje borra `cache:recent/stats` de ambos lados; actualizar perfil
  invalida `stats`+`suggest`.
- La suite existente (30 tests) sigue pasando.

## Trabajo futuro (fuera de alcance Fase 1)

- Fase 2 frontend: Service Worker (stale-while-revalidate), precache de estáticos, IndexedDB
  para sesión/preferencias, UX offline y cola de acciones críticas.
- Caché de catálogos (TTL 24h) y resultados pesados del CARE Engine cuando existan.