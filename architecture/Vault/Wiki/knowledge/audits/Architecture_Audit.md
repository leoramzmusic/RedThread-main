# 🔍 Auditoría de Arquitectura de RedThread

Esta auditoría técnica evalúa el estado del diseño del sistema, acoplamiento de componentes, vectores de fallo y cumplimiento de patrones arquitectónicos.

---

## 📊 Matriz de Evaluación de Componentes

| Capa / Subsistema | Nivel de Acoplamiento | Tolerancia a Fallos | Estado de Salud | Decisiones Clave |
|-------------------|----------------------|--------------------|-----------------|------------------|
| **Frontend UI (Next.js)** | Bajo (Mediante Axios & Redux) | Alta (SSR/SSG + fallback offline) | ✅ Óptimo | [[knowledge/adrs/ADR-004-nextjs-turbopack-redux|ADR-004]] |
| **Backend API (FastAPI)** | Medio (Controladores REST/WS) | Alta (Uvicorn async workers) | ✅ Óptimo | [[knowledge/adrs/ADR-001-fastapi-beanie-mongodb|ADR-001]] |
| **Auth & Sesiones** | Bajo (Tokens stateless + Redis) | Alta (Fallback a DB si Redis falla) | ✅ Robusto | [[knowledge/adrs/ADR-002-jwt-redis-session-management|ADR-002]] |
| **Motor de Matching (CARE)** | Medio (Consultas Geo + Heurística) | Alta (Algoritmo tolerante a fallos) | ✅ Alto Rendimiento | [[knowledge/adrs/ADR-003-care-matching-geo-engine|ADR-003]] |
| **Portal RBAC & Empleados** | Bajo (Servicio desacoplado) | Alta (Inmutable audit log) | ✅ Seguro | [[knowledge/adrs/ADR-005-rbac-multi-tier-admin|ADR-005]] |
| **Persistencia (MongoDB)** | Aislado por Beanie ODM | Alta (Réplicas en producción) | ✅ Conectado | [[backend/src/core/database.py]] |
| **Caché (Redis)** | Aislado por redis_service | Media (Degradación elegante si no hay caché) | ✅ Conectado | [[backend/src/services/redis_service.py]] |

---

## 🚨 Puntos Críticos y Mitigaciones Auditadas

1. **Cálculo de Proximidad Geoespacial en Radar (`/discovery/radar`)**:
   - *Riesgo*: Costo computacional si se recorren miles de perfiles.
   - *Solución implementada*: Índices geoespaciales MongoDB `2dsphere` sobre `profile.location` y límite de radio configurado por tier (`BASIC_RADAR_RANGE_KM` vs `PREMIUM_RADAR_RANGE_KM`).
2. **Escalabilidad de WebSockets en Chat**:
   - *Riesgo*: Conexiones concurrentes acumuladas en un único worker.
   - *Solución implementada*: Mensajería brokerizada a través de Redis Pub/Sub con heartbeat de ping/pong para purgar sockets colgados.
3. **Fugas de Información en DTOs**:
   - *Riesgo*: Exposición de contraseñas hasheadas o datos de facturación en respuestas de usuario.
   - *Solución implementada*: Separación estricta de esquemas Pydantic `UserResponse` y `ProfilePublicResponse` sin campos sensibles.

---

## 🛠️ Herramientas de Auditoría con CodeGraph

Para verificar cualquier componente durante revisiones o auditorías de código:
```bash
# Auditar dependientes de un modelo antes de modificarlo:
codegraph impact "User"
codegraph impact "Profile"

# Verificar qué rutas invocan un servicio:
codegraph callers "matching_service"
codegraph callers "redis_service"
```
