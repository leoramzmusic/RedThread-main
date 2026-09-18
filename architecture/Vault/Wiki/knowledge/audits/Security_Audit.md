# Auditoría de Seguridad y Rendimiento — Red Thread

- **Fecha de auditoría:** 2026-09-13
- **Alcance:** backend (FastAPI / Beanie / MongoDB), frontend (Next.js 16), mobile (React Native), servicios (Redis, Kafka, Stripe) e infraestructura (Docker, K8s, AWS, Azure).
- **Metodología:** OWASP Top 10 (2021) + buenas prácticas de rendimiento.
- **Estado global:** los hallazgos **Críticos (C1–C5)**, el **A6** y parte de **A3** fueron corregidos en esta sesión. El resto queda planificado en este documento y se marcará a medida que se corrija.

---

## Leyenda de estados

- `[x] CORREGIDO` — parche aplicado y verificado.
- `[~] PARCIAL` — mitigación parcial aplicada; falta la migración completa.
- `[ ] PENDIENTE` — sin corregir todavía (planificado).

---

## CRÍTICOS (5)

### C1 — Endpoint `create-super-admin` montado siempre (incl. producción)
- **Riesgo:** ALTO → acceso no autorizado a Super Admin (A01/Privilege Escalation).
- **Ubicación:** `backend/src/api/admin_bootstrap.py:18-75`, montado en `backend/src/main.py:189`.
- **Descripción:** El endpoint solo exige `get_current_user`; cualquier usuario registrado podía escalar a super-admin. Además, la detección de superadmin existente solo revisaba el campo legacy `role`, ignorando el sistema dinámico de `roles`.
- **Estado:** `[x] CORREGIDO`
- **Qué se hizo:** el router de bootstrap solo se monta en `local/dev/qa` (`main.py`), y la detección de superadmin ahora cubre `role == super_admin` **o** `roles: ["superadmin"]` (`admin_bootstrap.py`, ambos `create-super-admin` y `check-super-admin`).
- **Pendiente:** considerar un token de bootstrap de un solo uso si se mantiene el router en QA.

### C2 — Router de "apariencia" sin autenticación ni RBAC + subida de archivos arbitraria
- **Riesgo:** ALTO → acceso no autorizado a configuración de marca, subida de contenido malicioso, borrado de historial (A01/A03/A05).
- **Ubicación:** `backend/src/api/admin_appearance.py:40-230`; montado en `main.py:203`.
- **Descripción:** Los 7 endpoints no tenían dependencias de auth. El upload usaba la extensión del cliente sin validar tipo/MIME ni tamaño, y `DELETE /history` permitía borrar la auditoría.
- **Estado:** `[x] CORREGIDO`
- **Qué se hizo:**
  - Nuevo permiso `MANAGE_BRANDING` (`backend/src/models/admin_rbac.py`).
  - Dependencia RBAC en los 6 endpoints de lectura/escritura de marcas: mutaciones requieren `MANAGE_BRANDING`; lecturas (`/resources`, `/history`) requieren `MANAGE_BRANDING` **o** `EDIT_CONFIG`.
  - Upload valida extensión (png/jpg/jpeg/webp/ico), Content-Type (`ALLOWED_IMAGE_TYPES`) y tamaño (`MAX_UPLOAD_SIZE`, 413 si excede; sin dejar archivo parcial).
  - `user_id="admin"` hardcodeado reemplazado por `str(employee.id)` en el historial.
- **Pendiente:** mover `UPLOAD_DIR` fuera de `/static` o servir estos assets con Content-Disposition cuando sean privados (aplica junto con C4).

### C3 — RBAC inoperante: `has_permission()` extendido llamado sin `await`
- **Riesgo:** CRÍTICO → los checks de permiso **siempre pasaban** (un coroutine es siempre truthy). Toda la autorización de empleados era nominal (A01/A04).
- **Ubicación:** `backend/src/core/middleware/employee_rbac.py:95,123,154,208`; `backend/src/api/admin_empleados.py:183,186`.
- **Descripción:** se llamaba a un método `async` sin `await`, por lo que `if not employee.has_permission(...)` evaluaba `not <coroutine>` → `False`, nunca rechazando.
- **Estado:** `[x] CORREGIDO`
- **Qué se hizo:** se añadieron los `await` en los 6 puntos (revisados todos los usos de `has_permission` del repo; los de `core/middleware/rbac.py` ya awaitaban correctamente).
- **Nota:** refactor futuro recomendado: hacer que estas funciones nunca devuelvan coroutines evaluables en `if` (p.ej. envolver en helpers síncronos explícitos o añadir un test de "no Warning coroutine not awaited").

### C4 — Premium/VIP/Boosts concedidos sin pago (placeholder de Stripe)
- **Riesgo:** ALTO → pérdida de ingresos y confianza; escalada de privilegios monetizados (A01/A12).
- **Ubicación:** `backend/src/api/premium.py:31-84 (subscribe)`, `187-226 (update-tier)`, `259-291 (purchase-boosts)`.
- **Descripción:** `POST /premium/subscribe`, `/premium/purchase-boosts` y `/premium/update-tier` activaban suscripciones/boosts sin verificar ningún pago. El frontend enviaba `payment_method_id: 'pm_mock'` (`frontend/src/pages/suscripcion/index.tsx:259,276`).
- **Estado:** `[x] CORREGIDO` (via de ataque cerrada) + `[ ]` integración real de Stripe pendiente.
- **Qué se hizo:**
  - `/subscribe` y `/purchase-boosts`: si `STRIPE_SECRET_KEY` no está configurada → `503`; si está configurada → `501` explícito (nunca se concede el tier/boosts sin webhook confirmado).
  - `/update-tier`: ya no acepta autoconcesión; exige empleado autenticado con `MANAGE_SUBSCRIPTIONS` y `user_id` objetivo (404 si no existe).
- **Pendiente:** implementar PaymentIntent + webhook `checkout.session.completed` (escuchar y re-verificar firma con `STRIPE_WEBHOOK_SECRET`) y activar suscripción/boosts solo tras confirmación. Documentar exactamente dónde.

### C5 — Tokens de administrador en cookies JS (sin `HttpOnly` ni `Secure`)
- **Riesgo:** ALTO → robo de sesión admin vía XSS en el frontend (A07).
- **Ubicación (original):** `frontend/src/store/slices/adminAuthSlice.ts:47-49`; lectura en `frontend/src/services/adminApi.ts:91-92`; `next.config.js` sin cabeceras de seguridad.
- **Descripción:** los tokens admin se guardaban con `js-cookie` (`HttpOnly` imposible desde JS) y con `sameSite: lax` sin `secure`.
- **Estado:** `[x] CORREGIDO` (migración definitiva aplicada y verificada)
- **Qué se hizo (fase 1 — mitigación):**
  - Cookies con `sameSite: strict` + `secure` cuando la página está en HTTPS (parche previo en `adminAuthSlice.ts`).
  - `next.config.js`: `async headers()` con `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-DNS-Prefetch-Control: off`, `Permissions-Policy` (geolocation/camera/microphone solo mismo origen) y HSTS fuera de desarrollo (verificado contra la doc de esta versión de Next: `progressive-web-apps.md`).
- **Qué se hizo (fase 2 — migración definitiva):**
  - **Backend** (`backend/src/api/admin/auth.py`): `login` y `refresh` emiten `admin_access_token`/`admin_refresh_token` como cookies **`HttpOnly`** + `SameSite=strict` + `Secure` (salvo `ENVIRONMENT=local`), igual que el flujo de usuarios (`api/auth.py`). La respuesta JSON ya no devuelve los tokens (modelo `AdminAuthResponse`). Nuevo `POST /refresh` que acepta la cookie (o body legacy) y las re-emite, y nuevo `POST /logout` que las limpia.
  - **Backend** (`backend/src/api/admin/auth.py` y `backend/src/core/middleware/employee_rbac.py`): `get_current_employee` acepta `Authorization: Bearer` **o** la cookie `admin_access_token` → todos los routers del portal admin (RBAC, apariencia, premium, etc.) funcionan con sesión por cookie.
  - **Frontend** (`frontend/src/services/adminApi.ts`): `withCredentials: true`; se eliminó la lectura de tokens desde `js-cookie` y el refresco se hace `POST /portal-redthread/auth/refresh` sin body (cookie) con redirección controlada a login.
  - **Frontend**: `adminAuthSlice.ts` ya no persiste tokens en cookies JS (`setAdminCredentials` solo guarda en memoria); `login.tsx` deja de leer `access_token`/`refresh_token` de la respuesta; `useAdminSessionHydration.ts` hidrata validando con `GET /auth/me`; `ThemeContext.tsx` elimina el gate por cookie (`/me` maneja el 401 silenciosamente); `AdminNavbar.tsx` hace logout contra el backend para limpiar las cookies HttpOnly.
- **Pendiente (recomendado, no bloqueante):** añadir CSP con nonce para reforzar la protección anti-XSS del portal.

---

## ALTOS (9)

### A1 — `SECRET_KEY` por defecto conocido; secretos no inyectados en infra
- **Riesgo:** comportamiento de firmado de JWT predecible (A02).
- **Ubicación:** `backend/src/core/config.py:29`; `infra/aws/ecs-task-definition.json:22-35`; `infra/azure/aks-deployment.yaml:26-27`; `k8s/base/secrets.yaml.template` (valores CHANGE_ME).
- **Estado:** `[ ] PENDIENTE`
- **Plan:** exigir `SECRET_KEY` desde variables de entorno/secrets manager (fallar rápido si es el valor por defecto), inyectar en ECS/AKS/K8s, y rotar el secreto.

### A2 — Credenciales de prueba versionadas en el repositorio
- **Riesgo:** exposición de credenciales de prueba (A07).
- **Ubicación:** `CREDENTIALS.txt`, `TEST_CREDENTIALS.md` (confirmados con `git ls-files`). `backend/config/local.env` **no** está versionado (gitignored correctamente).
- **Estado:** `[ ] PENDIENTE`
- **Plan:** eliminar ambos archivos del repo y del historial (`git rm --cached`, `filter-repo`/`BFG` si ya hubo push), y mantener solo el `.env.example`.

### A3 — OTP de verificación de teléfono débil/expuesto/sin límite
- **Riesgo:** toma de cuenta vía fuerza bruta/predecibilidad (A07/A01).
- **Ubicación:** `backend/src/api/auth.py:243,248,328-385`. Modelo `backend/src/models/user.py:40-41`.
- **Estado:** `[~] PARCIAL`
- **Qué se hizo (esta sesión):**
  - Generación con `secrets.randbelow` (CSPRNG) en lugar de `random`.
  - Límite de 5 intentos (`phone_otp_attempts`); tras 5 fallos → `429`. Contador se reinicia al verificar.
  - El "MOCK SMS" (que imprime el código) solo se muestra si `settings.DEBUG`.
- **Pendiente:** hashear el OTP en la BBDD (migración `phone_otp` → `phone_otp_hash` con rotación), implementar envío real de SMS (Twilio u otro), y bloquear re-envío hasta expiración.

### A4 — Subidas de perfiles/datos de identidad sin validación ni control de acceso
- **Riesgo:** ejecución de contenido malicioso y exposición de documentos (A05/A01).
- **Ubicación:** `backend/src/api/profiles.py:1148-1158` (`upload_photo`) y `1199-1257` (documentos de identidad); `backend/src/main.py:214` monta `/static` para todo `static/`.
- **Estado:** `[ ] PENDIENTE`
- **Plan:** validar MIME real (magic bytes) + límite de tamaño re-utilizando `settings.MAX_UPLOAD_SIZE`/`ALLOWED_IMAGE_TYPES`; servir documentos de identidad fuera de `/static` (endpoint autenticado con Content-Disposition `inline` solo para el propietario) y encriptar en reposo.

### A5 — `admin_portal.py` solo exige autenticación (chequeo de admin comentado)
- **Riesgo:** acceso a rutas de portal con cuentas normales (A01).
- **Ubicación:** `backend/src/api/admin_portal.py:10-16`.
- **Estado:** `[ ] PENDIENTE`
- **Plan:** exigir empleado activo con permiso (`require_employee_permission`) o `AdminUser` activo; revisar el resto de "middleware a nivel de endpoint" del portal.

### A6 — ReDoS por `$regex` sin `re.escape` en entradas de usuario
- **Riesgo:** DoS (A04).
- **Ubicación:** `backend/src/api/users.py:243`, `backend/src/api/admin_empleados.py:76`, `backend/src/api/admin_usuarios.py:98`.
- **Estado:** `[x] CORREGIDO`
- **Qué se hizo:** `re.escape(search)`/`re.escape(nickname)` en las tres búsquedas.

### A7 — Sin rate limiting efectivo
- **Riesgo:** fuerza bruta/AaDoS (A07 / A04).
- **Ubicación:** `backend/src/services/redis_service.py` (helpers `check_rate_limit` definidos sin llamadores); `config.py:102-103` (`RATE_LIMIT_PER_MINUTE` sin uso).
- **Estado:** `[ ] PENDIENTE`
- **Plan:** aplicar rate limiting en login, registro, `verify-phone` y OAuth usando los helpers existentes (o `slowapi`/Gateway en producción).

### A8 — CORS con métodos/cabeceras comodín sobre requests con credenciales
- **Riesgo:** amplía superficie de abuso cross-origin (A04).
- **Ubicación:** `backend/src/main.py:60-66` (`allow_methods=["*"]`, `allow_headers=["*"]`, `allow_credentials=True`).
- **Estado:** `[ ] PENDIENTE`
- **Plan:** restringir métodos/cabeceras explícitos y mantener `allow_origins` como allow-list estricta por entorno.

### A9 — Servicios de datos sin autenticación (infra)
- **Riesgo:** datos/privacidad (A01/A02/A05).
- **Ubicación:** `backend/src/services/kafka_service.py`; `docker/docker-compose.local.yml`; manifiestos K8s/AWS/Azure.
- **Estado:** `[ ] PENDIENTE`
- **Plan:** autenticar Mongo/Redis/Kafka (credenciales por secret manager), TLS en tránsito y restrict network policies de K8s.

---

## MEDIOS (10)

| ID | Hallazgo | Ubicación | Estado |
|----|----------|-----------|--------|
| M1 | `print` de PII/búsquedas por stdout en producción | `auth.py:248`, `users.py:241-252`, `admin_empleados.py`, etc. | `[ ] PENDIENTE` (usar `logging` con niveles; OTP ya restringido a DEBUG) |
| M2 | Respuestas de error exponen detalle interno (`str(e)`) | `admin_appearance.py` (500), otros | `[ ] PENDIENTE` (logs detallados + mensajes genéricos al cliente) |
| M3 | Open redirect + `localhost:3000` hardcodeado en callback de Spotify | `backend/src/api/spotify_auth.py:139` | `[ ] PENDIENTE` (validar `redirect_uri` contra allow-list configurable; corriendo por env) |
| M4 | JWT sin `iss`/`aud` y con secreto compartido estático | `core/utils/security.py`, `config.py:29-30` | `[ ] PENDIENTE` (depende de A1) |
| M5 | 2FA para admins declarado pero no exigido | `models/employee.py` (`is_2fa_enabled`), flujo de login admin | `[ ] PENDIENTE` |
| M6 | Documentos de identidad sin cifrado en reposo | `profiles.py:1199-1257`, disco | `[ ] PENDIENTE` (depende de A4) |
| M7 | `DEBUG=True` por defecto y `/docs` habilitadas | `config.py:11`, `main.py:54-55` | `[ ] PENDIENTE` (default seguro: `DEBUG=False`) |
| M8 | Políticas de contraseña débiles (solo longitud mín.) | `core/utils/security.py` | `[ ] PENDIENTE` |
| M9 | Sesiones: límite concurrente declarado, comportamiento parcial | `config.py:42`, flujo de tokens | `[ ] PENDIENTE` (revisar aplicación de `MAX_ACTIVE_SESSIONS_PER_USER`) |
| M10 | Emails en mock (`MAIL_CONSOLE_LOG`) en cualquier entorno | `config.py:112` | `[ ] PENDIENTE` (desactivar fuera de dev; SMTP real) |

> Los M1–M10 se confirman/marcan en el archivo cuando se aplique su parche.

---

## BAJOS (5)

| ID | Hallazgo | Ubicación | Estado |
|----|----------|-----------|--------|
| B1 | SMTP sin TLS por defecto | `config.py:110-111` | `[ ] PENDIENTE` |
| B2 | Servidor enviando cabeceras/info de versión genérica | `main.py:49-56` | `[ ] PENDIENTE` |
| B3 | Bind `0.0.0.0` por defecto (defensa en profundidad) | `config.py:16` | `[ ] PENDIENTE` (puerto solo en red interna/balanceador) |
| B4 | `print` de debug diseminados (mismo fix que M1) | variados | `[ ] PENDIENTE` |
| B5 | Cabeceras de seguridad del frontend | `next.config.js` (ver C5) | `[x] AÑADIDAS (ver C5)` |

---

## RENDIMIENTO (8)

| ID | Hallazgo | Ubicación | Estado |
|----|----------|-----------|--------|
| P1 | N+1 en discovery/feed | `backend/src/api/discovery.py` | `[ ] PENDIENTE` |
| P2 | Radar/top-picks con escaneo de colección (sin índice 2dsphere) | `radar.py`, `discovery.py` | `[ ] PENDIENTE` |
| P3 | Agregaciones del dashboard sin índices de soporte | `admin_empleados.py:143-155` (`$group`) | `[ ] PENDIENTE` |
| P4 | Script de índices roto (importa `src.db` inexistente) | `backend/create_indexes.py` | `[ ] PENDIENTE` |
| P5 | TTLs de caché obsoletos/inconsistentes | `backend/src/services/redis_service.py` | `[ ] PENDIENTE` |
| P6 | Rate-limit helpers sin usar (también en A7) | `redis_service.py` | `[ ] PENDIENTE` |
| P7 | `reload=True` en uvicorn ligado a `DEBUG` (carga de prod) | `main.py:223` | `[ ] PENDIENTE` |
| P8 | Búsquedas con `$or` sin índices compuestos | `admin_usuarios.py:96-113`, `admin_empleados.py:75-82` | `[ ] PENDIENTE` |

---

## Resumen de cambios aplicados (2026-09-13)

| Archivo | Cambio | Verificación |
|---------|--------|--------------|
| `backend/src/main.py` | Bootstrap solo en `local/dev/qa` | `python -m compileall`, `import src.main` OK |
| `backend/src/api/admin_bootstrap.py` | Detección de superadmin dual (legacy + roles) | idem |
| `backend/src/core/middleware/employee_rbac.py` | `await` en 4 checks de permiso | `pytest tests` 38 passed |
| `backend/src/api/admin_empleados.py` | `await` + `re.escape` + import `re` | idem |
| `backend/src/models/admin_rbac.py` | Permiso nuevo `MANAGE_BRANDING` | idem |
| `backend/src/api/admin_appearance.py` | RBAC en 7 endpoints + validación de upload + `employee.id` en historial | idem |
| `backend/src/api/premium.py` | Suscripción/boosts bloqueados sin Stripe; `update-tier` exige permiso + `user_id` | idem |
| `backend/src/api/users.py` / `admin_usuarios.py` | `re.escape` + import `re` | idem |
| `backend/src/models/user.py` | Campo `phone_otp_attempts` | idem |
| `backend/src/api/auth.py` | OTP con `secrets`, límite de 5 intentos, mock solo en DEBUG | idem |
| `frontend/next.config.js` | Security headers (`async headers()`) | `tsc --noEmit` OK |
| `backend/src/api/admin/auth.py` | Cookies `HttpOnly`+`strict`+`Secure` en login/refresh; respuesta sin tokens; fallback cookie en `get_current_employee`; `POST /logout` limpia cookies | `import src.main` + `pytest` 38 passed |
| `backend/src/core/middleware/employee_rbac.py` | `get_current_employee` con fallback a cookie `admin_access_token` | idem |
| `frontend/src/services/adminApi.ts` | `withCredentials`; refresh por cookie sin body; sin lectura de tokens JS | `tsc --noEmit` OK |
| `frontend/src/store/slices/adminAuthSlice.ts` | Quitada persistencia de tokens en cookies JS (solo memoria) | idem |
| `frontend/src/pages/portal-redthread/auth/login.tsx` | No lee tokens de la respuesta | idem |
| `frontend/src/hooks/useAdminSessionHydration.ts` | Hidratación vía `GET /auth/me` | idem |
| `frontend/src/context/ThemeContext.tsx` | Eliminado gate por cookie en carga de preferencias admin | idem |
| `frontend/src/components/layout/AdminNavbar.tsx` | Logout llama al backend para limpiar cookies HttpOnly | idem |
| `knowledge/audits/Security_Audit.md` | Este documento de seguimiento | — |

**Próximos pasos sugeridos (orden de prioridad):**
1. A1/A5/A7 (secretos, portal admin, rate limiting).
2. A4 (uploads de identidad) + M6.
3. A2 (limpiar credenciales del repo).
4. A9 + conjunto de infraestructura.
5. Rendimiento P1–P8.