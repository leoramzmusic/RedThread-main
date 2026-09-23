# Language Preference — Two-Level Configuration (User + Global)

**Date:** 2026-09-23
**Status:** Draft — pending user review before plan
**Approach:** A (Ligero) — approved 2026-09-23

---

## 1. Overview

Forzar **inglés (`en`) como base global** en todo el sistema, con cambio de idioma como **decisión explícita del usuario**. La preferencia es **por usuario**, persiste en `User.preferred_language`, se sincroniza en todos sus dispositivos y afecta tanto la experiencia pre-login (landing, login, registro) como la in-app y el portal de administración (por empleado).

El portal admin controla **qué idiomas están disponibles** (habilitar/deshabilitar) y los **estilos globales** (navbar/footer), pero nunca fuerza el idioma de un usuario.

---

## 2. Goals / Non-Goals

**Goals:**
- Landing anónimo siempre inicia en `en` (idioma universal), sin inferencia por `Accept-Language`.
- Cambio de idioma en landing es opcional y, si ocurre, se propaga a la app tras registro/login (continuidad).
- Dentro de la app (usuario) y dentro del portal admin (empleado) el idioma es cambiable en cualquier momento desde la sesión y afecta solo a esa persona.
- Sincronización multi-device: el idioma de la DB sobrescribe el `localStorage` local al loguearse en un dispositivo nuevo.
- Admin puede habilitar/deshabilitar idiomas; fallback a `en` si el idioma del usuario deja de estar disponible.
- Indicador visual, persistencia y accesibilidad.

**Non-Goals:**
- Crear idiomas nuevos sin deploy (lista base de 20 códigos permanece estática; solo `enabled` es dinámico).
- Traducciones en DB o CMS de traducciones.
- Detección automática por geolocalización.

---

## 3. Architecture

```
Landing (anónimo) ──localStorage + NEXT_LOCALE cookie──┐
                                                        ├─► Register/Login ──► User.preferred_language (DB) ──► GET /auth/me ──► redirect locale
App / Admin (autenticado) ──PATCH /auth/me──────────────┘                                    │
                                                                                             └─► enabled[] (LANDING_LANGUAGES)
```

- **Fuente de verdad anónima:** `localStorage.preferred_language` + cookie `NEXT_LOCALE`.
- **Fuente de verdad autenticada:** `User.preferred_language` en Mongo (`users`).
- **Filtro de disponibilidad:** `AppearanceResource` tipo `LANDING_LANGUAGES` con `metadata.enabled: string[]`.

---

## 4. Data Model

### 4.1 `backend/src/models/user.py`

```python
preferred_language: str = "en"  # antes "es"
```

Migración: no backfill. Usuarios existentes conservan su valor (`"es"` si nunca cambiaron). Nuevos usuarios sin campo reciben `"en"` por default de Beanie.

### 4.2 `backend/src/models/appearance.py`

```python
class AppearanceType(str, Enum):
    LANDING_LANGUAGES = "landing_languages"  # nuevo
```

Recurso único (si no existe, se asume `enabled = todos los supportedLanguages`):

```json
{
  "type": "landing_languages",
  "platform": "web",
  "url": "",
  "metadata": { "enabled": ["en","es","pt","fr","de","it","ru","sv","nl","zh","hi","bn","ja","ko","ar","sw","ha","am","tl","ms","mi"] },
  "is_active": true
}
```

### 4.3 `frontend/next-i18next.config.js`

```js
module.exports = {
  i18n: {
    defaultLocale: 'en', // antes 'es'
    locales: ['en','es','pt','fr','de','it','ru','sv','nl','zh','hi','bn','ja','ko','ar','sw','ha','am','tl','ms','mi'],
    localeDetection: false,
  }
}
```

`localeDetection: false` fuerza `/` → `/en` en anónimo (no `es` por `Accept-Language`).

---

## 5. API Contracts

### 5.1 `POST /auth/register` — añade campo opcional

```json
{ "email": "...", "password": "...", "display_name": "...", "age": 22, "gender": "other", "preferred_language": "es" }
```

Backend: si `preferred_language` está en `enabled` (o no hay recurso de idiomas), `User(preferred_language=valor)`; si no, fallback `"en"`.

### 5.2 `PATCH /auth/me` — nuevo endpoint

```
PATCH /auth/me
Authorization: Bearer <access_token>
Body: { "preferred_language": "fr" }

200 { "preferred_language": "fr" }
400 { "detail": "Language not available" }  // si no está en enabled
```

Actualiza `User.preferred_language` y `updated_at`. Usado por app y por portal admin (empleado).

### 5.3 `GET /auth/me` — ya existe, expone `preferred_language`

`PrivateUserDTO` ya serializa el profile; añadir `preferred_language` al DTO si no está expuesto (actualmente `User` lo tiene pero `PrivateUserDTO` no lo expone — añadir campo).

### 5.4 Recursos de idiomas (admin)

```
GET  /portal-redthread/apariencia/resources?type=landing_languages
POST /portal-redthread/apariencia/resources  { type: landing_languages, metadata: {enabled: [...]} }
PUT  /portal-redthread/apariencia/resources/{id} { metadata: {enabled: [...]} }
```

Reusa `appearanceService` existente.

---

## 6. Frontend Flows

### 6.1 Landing anónimo (`/en` forzado)

- `LanguageSelector` (landing pill + `LanguageSelectorModal`) al elegir `code`:
  ```ts
  localStorage.setItem('preferred_language', code);
  document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=31536000; SameSite=Lax`;
  window.location.href = `/${code}${router.asPath.replace(/^\/[a-z]{2}(?=\/|$)/, '')}`;
  ```
- Tooltip/indicador bajo el selector: "Este idioma se aplicará también dentro de la aplicación" (traducido al idioma actual).

### 6.2 Registro / Login — continuidad

- **Registro:** `RegisterForm` lee `localStorage.preferred_language || router.locale` y lo envía en `POST /auth/register`. Tras éxito, `localStorage` ya coincide con DB.
- **Login:** tras `POST /auth/login` (200), `GET /auth/me` → `dbLang = user.preferred_language`. Si `dbLang !== router.locale`:
  ```ts
  localStorage.setItem('preferred_language', dbLang);
  document.cookie = `NEXT_LOCALE=${dbLang}; path=/; max-age=31536000; SameSite=Lax`;
  router.push(`/${dbLang}${pathWithoutLocale}`);
  ```
  Si anónimo había elegido un idioma distinto y más reciente que el de DB (localStorage !== dbLang y localStorage !== 'en'), se hace `PATCH /auth/me {preferred_language: localStorageLang}` (última intención gana) antes del redirect.

### 6.3 Dentro de la app / portal admin — cambio en sesión

- Selector en header (`LanguageSelector`) y en `Configuración > Idioma`:
  ```ts
  // optimistic
  setLocale(code);
  localStorage.setItem('preferred_language', code);
  document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=31536000; SameSite=Lax`;
  await api.patch('/auth/me', {preferred_language: code});
  router.push(`/${code}${pathWithoutLocale}`);
  ```
- Si `PATCH` falla por idioma deshabilitado → toast "Idioma no disponible" + revert a locale anterior.
- Empleado admin usa el mismo flujo (su `User.is_admin=true` tiene `preferred_language` propio).

### 6.4 Multi-device sync

Al abrir la app en dispositivo B y loguearse, `GET /auth/me` impone `dbLang` (ver 6.2). No se usa `localStorage` de B si difiere.

### 6.5 Filtrado de idiomas disponibles

`supportedLanguages` (20) se filtra al renderizar cualquier selector:

```ts
const enabled = (await appearanceService.getResources(LANDING_LANGUAGES))?.[0]?.metadata?.enabled ?? supportedLanguages.map(l=>l.code);
const visible = supportedLanguages.filter(l => enabled.includes(l.code));
```

Si el usuario/empleado tenía un idioma que fue deshabilitado, al próximo `GET /auth/me` el frontend detecta `!enabled.includes(dbLang)` y hace `PATCH /auth/me {preferred_language: 'en'}` + redirect a `/en`.

---

## 7. Portal Admin — Gestión de Idiomas

**Ruta nueva:** `frontend/src/pages/portal-redthread/apariencia/idiomas.tsx`

- Tabla 20 filas, columnas: Idioma, Código, Habilitado (Switch), Sample.
- `Guardar` → upsert del recurso `LANDING_LANGUAGES`.
- Permiso: `MANAGE_BRANDING` (mismo que navbar).
- No fuerza el idioma de ningún usuario; solo oculta opciones en selectores.

**Portal admin — selector por empleado:**

- `AdminSidebar` o `Header` del portal añade `LanguageSelector` compacto (mismo componente, prop `variant="admin"`).
- Al cambiar, `PATCH /auth/me` sobre el `User` del empleado logueado.

---

## 8. UI Details

- **Indicador landing:** `LanguageSelectorModal` footer añade línea `MORE_LANGS` ya existente + nueva línea "Este idioma se aplicará también dentro de la aplicación" (i18n por `currentLang`) con icono `InfoOutlined`.
- **Accesibilidad:** selector accesible desde cualquier pantalla (landing, login, registro, app, admin) vía teclado (`Tab`/`Enter`/`Espacio`), `aria-label="Seleccionar idioma"`, `role="menu"`, foco visible.
- **Persistencia:** `localStorage` + cookie `NEXT_LOCALE` (31536000s) + DB. Cookie asegura que SSR respete el locale en el primer paint.
- **Fallback:** `next-i18next` `fallbackLng: 'en'`; si clave faltante en `es`/`fr`/etc., se muestra `en`.

---

## 9. Error Handling

| Caso | Comportamiento |
|---|---|
| `PATCH` con código no habilitado | 400 + toast, sin cambio de locale |
| `GET /auth/me` devuelve idioma deshabilitado | Auto-migra a `en` con PATCH + redirect |
| `localStorage` corrupto / código inválido | Ignorar, usar `en` |
| Recurso `LANDING_LANGUAGES` no existe | Asumir todos habilitados |
| Red sin conexión al cambiar idioma en app | Optimistic revert + snackbar "Sin conexión" |

---

## 10. Testing

- `backend/tests/test_user_language.py`: default `en`, register con `preferred_language`, patch válido/inválido, fallback.
- `frontend/src/components/common/LanguageSelector.test.tsx`: anónimo persiste local, autenticado hace PATCH, fallback `en`.
- `frontend/src/pages/portal-redthread/apariencia/idiomas.test.tsx`: toggle + upsert.
- `npx tsc --noEmit`, `npx jest --ci`, `npx eslint src/components/common --ext .tsx,.ts` (sin `--ext` si flat config), `python -m py_compile src/models/user.py src/models/appearance.py`.

---

## 11. Migration & Rollout

1. Deploy backend: `User` default `en`, nuevo `AppearanceType.LANDING_LANGUAGES`, endpoint `PATCH /auth/me`, `PrivateUserDTO` expone `preferred_language`.
2. Deploy frontend: `next-i18next` default `en` + `localeDetection: false`, `LanguageSelector` con cookie+DB sync, nueva página admin idiomas.
3. Crear recurso inicial `LANDING_LANGUAGES` con todos habilitados (seed o primer Guardar del admin).
4. Sin backfill de usuarios existentes.

---

## 12. Decisions Log

- Default técnico `es` → `en` confirmado por usuario.
- Sync: `PATCH` inmediato en app + DB como fuente de verdad cross-device confirmado.
- Admin gestiona `enabled[]` vía `LANDING_LANGUAGES` (no colección nueva).
- Admin portal también por empleado (no global) confirmado.
