# 🤖 Contexto Masivo de Ingeniería para Agentes de IA (RedThread)

> **Instrucción para Agentes**: Este documento resume la topología del sistema, modelos, servicios y comandos de alta eficiencia para resolver tareas gastando la menor cantidad posible de tokens.

---

## 🎯 Regla Fundamental de Ahorro de Tokens
**NUNCA hagas lecturas extensivas de archivos o búsquedas `grep` iterativas a ciegas.**
Usa CodeGraph para extraer la fuente exacta y el camino de llamadas en 1 solo paso:
- En MCP: `codegraph_explore(query="<simbolo o flujo>", projectPath="...")`
- En CLI: `codegraph explore "<simbolo o flujo>"`

---

## 🗂️ Mapa Rápido de Símbolos y Rutas

| Dominio | Código Fuente Clave | Decisiones / Documentación |
|---------|---------------------|----------------------------|
| **Autenticación & JWT** | `backend/src/api/auth.py`<br>`backend/src/core/utils/security.py` | [[knowledge/adrs/ADR-002-jwt-redis-session-management\|ADR-002: JWT & Redis]] |
| **Modelos ODM** | `backend/src/models/user.py`<br>`backend/src/models/profile.py`<br>`backend/src/models/match.py`<br>`backend/src/models/relationship.py` | [[knowledge/adrs/ADR-001-fastapi-beanie-mongodb\|ADR-001: Beanie ODM]] |
| **Matching & Radar (CARE)** | `backend/src/api/discovery.py`<br>`backend/src/services/matching_service.py`<br>`backend/src/care/ranking/` | [[knowledge/adrs/ADR-003-care-matching-geo-engine\|ADR-003: Motor CARE]] |
| **Chat & WebSockets** | `backend/src/api/chat.py`<br>`backend/src/services/chat/`<br>`backend/src/models/message.py` | [[knowledge/modules/Realtime_Chat\|Guía de Chat]] |
| **Admin & RBAC** | `backend/src/api/admin_portal.py`<br>`backend/src/models/admin_rbac.py`<br>`backend/src/models/employee.py` | [[knowledge/adrs/ADR-005-rbac-multi-tier-admin\|ADR-005: RBAC]] |
| **Caché & Sesiones** | `backend/src/services/redis_service.py` | [[knowledge/adrs/ADR-002-jwt-redis-session-management\|ADR-002: Redis]] |
| **Frontend Root & State** | `frontend/src/pages/_app.tsx`<br>`frontend/src/store/index.ts`<br>`frontend/src/services/api.ts` | [[knowledge/adrs/ADR-004-nextjs-turbopack-redux\|ADR-004: Next.js + Redux]] |
| **Vistas Principales** | `frontend/src/pages/discover/index.tsx`<br>`frontend/src/pages/chat/index.tsx`<br>`frontend/src/pages/portal-redthread/index.tsx` | [[knowledge/modules/Frontend_Architecture\|Guía Frontend]] |

---

## ⚡ Comandos de Diagnóstico y Exploración

```bash
# 1. Explorar un flujo completo (ej: login y autenticación)
codegraph explore "login authenticate_user User auth.py"

# 2. Explorar el cálculo de afinidad de perfiles
codegraph explore "matching_service calculate_compatibility Profile"

# 3. Analizar qué se afecta antes de modificar una función
codegraph impact "get_current_user"

# 4. Sincronizar el índice de CodeGraph tras realizar cambios
codegraph sync
```
