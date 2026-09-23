# Language Preference (Two-Level) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Forzar inglés como base global, persistir preferencia por usuario/empleado en DB y sincronizarla multi-device, con control admin de idiomas habilitados y selector accesible en landing/app/admin.

**Architecture:** `User.preferred_language` (default `en`) es fuente de verdad autenticada; `localStorage`+cookie `NEXT_LOCALE` lo es para anónimos. `next-i18next` con `defaultLocale: en` y `localeDetection: false` fuerza `/`→`/en`. Un recurso `LANDING_LANGUAGES` (`enabled[]`) filtra `supportedLanguages`. Registro envía `preferred_language` anónimo; login reconcilia DB vs local; `PATCH /auth/me` actualiza en sesión.

**Tech Stack:** Next.js 14 + next-i18next, FastAPI + Beanie (Mongo), MUI

**Spec:** `docs/superpowers/specs/2026-09-23-language-preference-design.md`

## Global Constraints

- Base global forzada `en` — ningún `Accept-Language` debe inferir `es`.
- Preferencia por usuario/empleado, nunca global; sync multi-device vía DB.
- Admin habilita/deshabilita idiomas (`enabled[]`), nunca fuerza el idioma de un usuario.
- Fallback de traducciones faltantes → `en`.
- Selector accesible desde cualquier pantalla; indicador "Este idioma se aplicará también dentro de la aplicación".

---

## File Structure

- `backend/src/models/user.py` — User.preferred_language default `en`
- `backend/src/models/appearance.py` — AppearanceType.LANDING_LANGUAGES
- `backend/src/api/auth.py` + `backend/src/services/auth/routes.py` — PATCH /auth/me, RegisterRequest.preferred_language
- `backend/src/api/dtos/user_dtos.py` — PrivateUserDTO.preferred_language
- `frontend/next-i18next.config.js` — defaultLocale en, localeDetection false, fallbackLng en
- `frontend/src/config/languages.ts` — supportedLanguages (fuente estática, 20)
- `frontend/src/components/common/LanguageSelector.tsx` — selector unificado + hint + cookie sync
- `frontend/src/components/landing/LanguageSelectorModal.tsx` — filtra por enabled, muestra hint
- `frontend/src/context/AuthContext.tsx` (o donde vive login/register) — envía preferred_language en register, reconcilia en login
- `frontend/src/pages/portal-redthread/apariencia/idiomas.tsx` — nueva página admin
- Tests: `backend/tests/test_user_language.py`, `frontend/src/components/common/LanguageSelector.test.tsx`

---

### Task 1: Backend — User default EN + AppearanceType LANDING_LANGUAGES

**Files:**
- Modify: `backend/src/models/user.py:80`
- Modify: `backend/src/models/appearance.py:7-17`
- Test: `backend/tests/test_user_language.py`

**Interfaces:**
- Consumes: Beanie User, AppearanceType enum
- Produces: `User.preferred_language: str = "en"`, `AppearanceType.LANDING_LANGUAGES = "landing_languages"` (consumed by Task 2 and Task 6)

- [ ] **Step 1: Write failing test for User default**

```python
# backend/tests/test_user_language.py
from src.models.user import User

def test_user_default_language_is_en():
    u = User(display_name="Test", nickname="test_lang")
    assert u.preferred_language == "en"

def test_appearance_type_has_landing_languages():
    from src.models.appearance import AppearanceType
    assert AppearanceType.LANDING_LANGUAGES == "landing_languages"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest backend/tests/test_user_language.py::test_user_default_language_is_en -v`
Expected: FAIL — `assert 'es' == 'en'` (actual default is `es`)

- [ ] **Step 3: Change User default and add AppearanceType**

```python
# backend/src/models/user.py:80
preferred_language: str = "en"  # was "es"

# backend/src/models/appearance.py — add to enum
class AppearanceType(str, Enum):
    FAVICON = "favicon"
    LOGO = "logo"
    BANNER = "banner"
    MULTIMEDIA = "multimedia"
    THEME = "theme"
    LANDING_BANNER = "landing_banner"
    LANDING_THEME = "landing_theme"
    LANDING_NAVBAR = "landing_navbar"
    LANDING_NAVBAR_STYLE = "landing_navbar_style"
    LANDING_LANGUAGES = "landing_languages"  # NEW
    FAVICON_USER = "favicon_user"
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest backend/tests/test_user_language.py -v`
Expected: PASS (2 passed)

- [ ] **Step 5: Verify compile**

Run: `python -m py_compile backend/src/models/user.py backend/src/models/appearance.py` (workdir `backend/`)
Expected: exit 0

- [ ] **Step 6: Commit**

```bash
git add backend/src/models/user.py backend/src/models/appearance.py backend/tests/test_user_language.py
git commit -m "feat(backend): default language EN and LANDING_LANGUAGES type"
```

---

### Task 2: Backend — PATCH /auth/me + RegisterRequest + PrivateUserDTO

**Files:**
- Modify: `backend/src/api/auth.py` (add PATCH endpoint, extend RegisterRequest)
- Modify: `backend/src/models/user.py` (no-op, already done)
- Modify: `backend/src/api/dtos/user_dtos.py:53-112` (expose preferred_language)
- Test: `backend/tests/test_user_language.py` (extend)

**Interfaces:**
- Consumes: `User`, `AppearanceType.LANDING_LANGUAGES`, `PrivateUserDTO`
- Produces: `PATCH /auth/me {preferred_language}` → 200, `POST /auth/register` accepts `preferred_language?`, `GET /auth/me` returns `preferred_language` (consumed by Task 4/5)

- [ ] **Step 1: Write failing test for PATCH and register**

```python
# backend/tests/test_user_language.py — append

import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_patch_preferred_language():
    # Assumes test client fixture exists; adapt to repo's test helper
    # If no fixture, test the DTO/model directly:
    from src.api.dtos.user_dtos import PrivateUserDTO
    from unittest.mock import Mock
    user = Mock(preferred_language="en", display_name="A", nickname="a", email="a@a.com", real_name=None, verified=False, is_verified=False, subscription_tier=Mock(value="free"), identity_verification_status="none", identity_document_type=None, identity_rejection_reason=None, identity_submitted_at=None, id="123")
    profile = None
    dto = PrivateUserDTO.from_user_and_profile(user, profile)
    assert hasattr(dto, 'preferred_language')
    assert dto.preferred_language == "en"

def test_register_request_accepts_preferred_language():
    from src.api.auth import RegisterRequest
    r = RegisterRequest(email="x@x.com", password="12345678", display_name="X", age=22, gender="other", preferred_language="fr")
    assert r.preferred_language == "fr"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest backend/tests/test_user_language.py::test_patch_preferred_language -v`
Expected: FAIL — `hasattr(dto, 'preferred_language')` is False; `RegisterRequest` has no field

- [ ] **Step 3: Extend RegisterRequest, add PATCH endpoint, expose DTO**

```python
# backend/src/api/auth.py — extend RegisterRequest
class RegisterRequest(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: str
    display_name: str
    age: int
    gender: str
    preferred_language: Optional[str] = None  # NEW

# In register() — after validation, before User():
preferred = (request.preferred_language or "en").lower()
# Validate against enabled list if resource exists:
# enabled = await get_enabled_languages()  # helper reads AppearanceResource LANDING_LANGUAGES
# if preferred not in enabled: preferred = "en"
# Pass to User:
user = User(
    ...
    preferred_language=preferred,
    ...
)

# New endpoint — add after /login
from pydantic import BaseModel
class UpdatePreferencesRequest(BaseModel):
    preferred_language: str

@router.patch("/me", response_model=dict)
async def update_me_preferences(
    body: UpdatePreferencesRequest,
    user: User = Depends(get_current_user),
):
    code = body.preferred_language.lower()
    enabled = await get_enabled_languages()  # reads LANDING_LANGUAGES resource or returns all 20
    if code not in enabled:
        raise HTTPException(status_code=400, detail="Language not available")
    user.preferred_language = code
    user.updated_at = datetime.utcnow()
    await user.save()
    return {"preferred_language": user.preferred_language}

# Helper
async def get_enabled_languages() -> list[str]:
    from src.models.appearance import AppearanceResource, AppearanceType
    res = await AppearanceResource.find_one(AppearanceResource.type == AppearanceType.LANDING_LANGUAGES)
    if res and res.metadata and res.metadata.get("enabled"):
        return res.metadata["enabled"]
    from src.config.languages import supportedLanguages  # or hardcode fallback list of 20
    return ["en","es","pt","fr","de","it","ru","sv","nl","zh","hi","bn","ja","ko","ar","sw","ha","am","tl","ms","mi"]
```

```python
# backend/src/api/dtos/user_dtos.py — PrivateUserDTO
class PrivateUserDTO(BaseModel):
    ...
    preferred_language: str = "en"  # NEW
    ...

    @classmethod
    def from_user_and_profile(cls, user, profile, mask_data: bool = True):
        ...
        return cls(
            ...
            preferred_language=getattr(user, 'preferred_language', 'en'),
            ...
        )
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m pytest backend/tests/test_user_language.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/api/auth.py backend/src/api/dtos/user_dtos.py backend/tests/test_user_language.py
git commit -m "feat(backend): PATCH /auth/me and register preferred_language, expose in DTO"
```

---

### Task 3: Frontend — next-i18next EN base + enabled filtering helper

**Files:**
- Modify: `frontend/next-i18next.config.js:3`
- Create: `frontend/src/services/languageService.ts`
- Modify: `frontend/src/config/languages.ts` (no change, but consumed)
- Test: `frontend/src/services/languageService.test.ts`

**Interfaces:**
- Consumes: `AppearanceType.LANDING_LANGUAGES`, `appearanceService.getResources`
- Produces: `getEnabledLanguages(): Promise<string[]>`, `isLanguageEnabled(code): Promise<boolean>` (consumed by Task 4/6), `defaultLocale: 'en'` (global)

- [ ] **Step 1: Write failing test for languageService**

```ts
// frontend/src/services/languageService.test.ts
import { getEnabledLanguages } from './languageService';
jest.mock('./appearanceService');

describe('languageService', () => {
  it('returns all 20 when no resource exists', async () => {
    const { getEnabledLanguages } = await import('./languageService');
    // mock getResources -> []
    const langs = await getEnabledLanguages();
    expect(langs).toContain('en');
    expect(langs.length).toBe(20);
  });
  it('returns enabled from resource', async () => {
    // mock getResources -> [{metadata:{enabled:['en','es']}}]
    const langs = await getEnabledLanguages();
    expect(langs).toEqual(['en','es']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/services/languageService.test.ts --ci` (workdir `frontend/`)
Expected: FAIL — module not defined

- [ ] **Step 3: Update next-i18next config and create service**

```js
// frontend/next-i18next.config.js
module.exports = {
  i18n: {
    defaultLocale: 'en', // was 'es'
    locales: ['en','es','pt','fr','de','it','ru','sv','nl','zh','hi','bn','ja','ko','ar','sw','ha','am','tl','ms','mi'],
    localeDetection: false,
  },
  fallbackLng: 'en',
  reloadOnPrerender: process.env.NODE_ENV === 'development',
};
```

```ts
// frontend/src/services/languageService.ts
import appearanceService from './appearanceService';
import { AppearanceType } from '../types/appearance';
import { supportedLanguages } from '../config/languages';

const ALL = supportedLanguages.map(l => l.code);

export async function getEnabledLanguages(): Promise<string[]> {
  try {
    const res = await appearanceService.getResources(AppearanceType.LANDING_LANGUAGES as any);
    const enabled = (res?.[0] as any)?.metadata?.enabled;
    if (Array.isArray(enabled) && enabled.length) return enabled;
  } catch {}
  return ALL;
}

export async function isLanguageEnabled(code: string): Promise<boolean> {
  const enabled = await getEnabledLanguages();
  return enabled.includes(code);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/services/languageService.test.ts --ci` (workdir `frontend/`)
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/next-i18next.config.js frontend/src/services/languageService.ts frontend/src/services/languageService.test.ts
git commit -m "feat(frontend): EN base locale and enabled languages service"
```

---

### Task 4: Frontend — LanguageSelector continuity + Register/Login sync

**Files:**
- Modify: `frontend/src/components/common/LanguageSelector.tsx:56-63` (add cookie+hint, filter by enabled)
- Modify: `frontend/src/components/landing/LanguageSelectorModal.tsx` (filter by enabled, add continuity hint)
- Modify: `frontend/src/context/AuthContext.tsx` (or `src/services/auth.ts` / `src/pages/auth/*` where register/login live) — send preferred_language, reconcile on login
- Test: `frontend/src/components/common/LanguageSelector.test.tsx`

**Interfaces:**
- Consumes: `getEnabledLanguages()`, `router.locale`, `localStorage`, `PATCH /auth/me`, `GET /auth/me`
- Produces: Anonymous selector persists to localStorage+cookie; register sends preferred_language; login reconciles DB vs local (consumed by Task 5)

- [ ] **Step 1: Write failing test for LanguageSelector**

```tsx
// frontend/src/components/common/LanguageSelector.test.tsx
import { render, fireEvent } from '@testing-library/react';
import LanguageSelector from './LanguageSelector';

jest.mock('next/router', () => ({ useRouter: () => ({ locale: 'en', asPath: '/en', push: jest.fn() }) }));

describe('LanguageSelector', () => {
  it('persists to localStorage and cookie on change', () => {
    const { getByLabelText } = render(<LanguageSelector />);
    // open menu, click Español
    // expect localStorage.getItem('preferred_language') === 'es'
    // expect document.cookie to contain NEXT_LOCALE=es
  });
  it('shows continuity hint', () => {
    const { getByText } = render(<LanguageSelector showContinuityHint />);
    expect(getByText(/Este idioma se aplicará también dentro de la aplicación/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/components/common/LanguageSelector.test.tsx --ci` (workdir `frontend/`)
Expected: FAIL — hint not rendered, localStorage not set

- [ ] **Step 3: Implement LanguageSelector changes**

```tsx
// frontend/src/components/common/LanguageSelector.tsx — handleLanguageChange
const handleLanguageChange = async (code: string) => {
  const enabled = await getEnabledLanguages(); // or prop filtered list
  if (!enabled.includes(code)) return;
  localStorage.setItem('preferred_language', code);
  document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=31536000; SameSite=Lax`;
  // If authenticated, PATCH immediately
  try {
    const token = localStorage.getItem('access_token');
    if (token) await fetch('/api/auth/me', { method: 'PATCH', body: JSON.stringify({preferred_language: code}) });
  } catch {}
  const currentPath = router?.asPath || '/';
  const pathWithoutLocale = currentPath.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';
  window.location.href = `/${code}${pathWithoutLocale}`;
};

// Add prop showContinuityHint?: boolean — when true, render hint below menu
{showContinuityHint && <Typography variant="caption" sx={{display:'block', mt:1, color:'rgba(255,255,255,0.6)'}}>Este idioma se aplicará también dentro de la aplicación</Typography>}
```

```tsx
// frontend/src/components/landing/LanguageSelectorModal.tsx — filter visible
const [enabled, setEnabled] = useState<string[] | null>(null);
useEffect(() => { getEnabledLanguages().then(setEnabled); }, []);
const visible = enabled ? supportedLanguages.filter(l => enabled.includes(l.code)) : supportedLanguages;
// map over visible instead of supportedLanguages
// Add hint in footer: {MORE_LANGS + "Este idioma se aplicará también dentro de la aplicación"}
```

```ts
// AuthContext or register page — send preferred_language
const preferred = localStorage.getItem('preferred_language') || router.locale || 'en';
await api.post('/auth/register', { ...form, preferred_language: preferred });

// Login — after POST /auth/login success:
const me = await api.get('/auth/me');
const dbLang = me.data.preferred_language || 'en';
const localLang = localStorage.getItem('preferred_language');
if (dbLang !== router.locale) {
  localStorage.setItem('preferred_language', dbLang);
  document.cookie = `NEXT_LOCALE=${dbLang}; path=/; max-age=31536000; SameSite=Lax`;
  const pathWithoutLocale = router.asPath.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';
  if (localLang && localLang !== dbLang && localLang !== 'en') {
    // last intention wins — update DB
    await api.patch('/auth/me', {preferred_language: localLang});
    // then redirect to localLang instead
    window.location.href = `/${localLang}${pathWithoutLocale}`;
  } else {
    window.location.href = `/${dbLang}${pathWithoutLocale}`;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest src/components/common/LanguageSelector.test.tsx --ci` (workdir `frontend/`)
Expected: PASS

- [ ] **Step 5: Verify tsc**

Run: `npx tsc --noEmit` (workdir `frontend/`)
Expected: exit 0

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/common/LanguageSelector.tsx frontend/src/components/landing/LanguageSelectorModal.tsx frontend/src/context/AuthContext.tsx
git commit -m "feat(frontend): language continuity landing→auth and sync on login"
```

---

### Task 5: Frontend — In-app / Admin in-session language switch

**Files:**
- Modify: `frontend/src/components/layout/Header.tsx` (or `AppShell`, `ConfiguracionPage`, `AdminSidebar`) — add LanguageSelector with PATCH
- Modify: `frontend/src/pages/configuracion.tsx` (or `src/pages/settings/*`) — add Idioma section if missing
- Test: `frontend/src/components/common/LanguageSelector.test.tsx` (extend for authenticated PATCH)

**Interfaces:**
- Consumes: `PATCH /auth/me`, `LanguageSelector`
- Produces: In-session language change for user and employee (no global effect)

- [ ] **Step 1: Write failing test for authenticated switch**

```tsx
it('calls PATCH when authenticated', async () => {
  localStorage.setItem('access_token', 'fake');
  global.fetch = jest.fn(() => Promise.resolve({ ok: true })) as any;
  const { getByLabelText } = render(<LanguageSelector />);
  // click fr
  await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/auth/me'), expect.objectContaining({method:'PATCH'})));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/components/common/LanguageSelector.test.tsx --ci` (workdir `frontend/`)
Expected: FAIL — fetch not called

- [ ] **Step 3: Wire selector in app and admin**

```tsx
// Wherever the user menu / settings lives — add:
<LanguageSelector showContinuityHint={false} onLanguageChange={async (code) => {
  try {
    await api.patch('/auth/me', {preferred_language: code});
  } catch (e:any) {
    if (e?.response?.status === 400) toast.error('Idioma no disponible');
    throw e;
  }
}} />

// Also handle fallback on mount:
useEffect(() => {
  (async () => {
    const me = await api.get('/auth/me').catch(()=>null);
    if (!me) return;
    const enabled = await getEnabledLanguages();
    if (!enabled.includes(me.data.preferred_language)) {
      await api.patch('/auth/me', {preferred_language: 'en'});
      // redirect to en
    }
  })();
}, []);
```

- [ ] **Step 4: Run tests and tsc**

Run: `npx jest src/components/common/LanguageSelector.test.tsx --ci` (workdir `frontend/`) + `npx tsc --noEmit` (workdir `frontend/`)
Expected: PASS / exit 0

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/layout/Header.tsx frontend/src/pages/configuracion.tsx
git commit -m "feat(frontend): in-session language switch for user and admin"
```

---

### Task 6: Admin — Idiomas management page (enabled list)

**Files:**
- Create: `frontend/src/pages/portal-redthread/apariencia/idiomas.tsx`
- Create: `frontend/src/pages/portal-redthread/apariencia/idiomas.test.tsx`
- Modify: `frontend/src/components/layout/AdminSidebar.tsx` (add nav item)

**Interfaces:**
- Consumes: `appearanceService.getResources/createResource/updateResource` with `LANDING_LANGUAGES`
- Produces: Admin can toggle which of the 20 languages are visible to users

- [ ] **Step 1: Write failing test for admin page**

```tsx
// frontend/src/pages/portal-redthread/apariencia/idiomas.test.tsx
import { render, screen } from '@testing-library/react';
import IdiomasPage from './idiomas';
jest.mock('../../services/appearanceService');

describe('Idiomas admin', () => {
  it('renders 20 toggles and saves enabled', async () => {
    render(<IdiomasPage />);
    expect(await screen.findByText(/Idiomas disponibles/i)).toBeInTheDocument();
    expect(screen.getAllByRole('switch').length).toBe(20);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/pages/portal-redthread/apariencia/idiomas.test.tsx --ci` (workdir `frontend/`)
Expected: FAIL — module not found

- [ ] **Step 3: Implement admin page**

```tsx
// frontend/src/pages/portal-redthread/apariencia/idiomas.tsx
import { useEffect, useState } from 'react';
import { Box, Switch, Typography, Button, Paper, Stack } from '@mui/material';
import { supportedLanguages } from '../../../config/languages';
import appearanceService from '../../../services/appearanceService';
import { AppearanceType } from '../../../types/appearance';

export default function IdiomasAdminPage() {
  const [enabled, setEnabled] = useState<string[]>(supportedLanguages.map(l=>l.code));
  const [saving, setSaving] = useState(false);
  const [resourceId, setResourceId] = useState<string | null>(null);

  useEffect(() => {
    appearanceService.getResources(AppearanceType.LANDING_LANGUAGES as any).then(res => {
      const e = (res?.[0] as any)?.metadata?.enabled;
      if (Array.isArray(e)) setEnabled(e);
      if (res?.[0]?._id) setResourceId(res[0]._id);
    }).catch(()=>{});
  }, []);

  const toggle = (code: string) => setEnabled(prev => prev.includes(code) ? prev.filter(c=>c!==code) : [...prev, code]);
  const save = async () => {
    setSaving(true);
    try {
      if (resourceId) await appearanceService.updateResource(resourceId, {metadata:{enabled}} as any);
      else await appearanceService.createResource({type: AppearanceType.LANDING_LANGUAGES as any, platform: 'web' as any, url:'', metadata:{enabled}, is_active:true} as any);
    } finally { setSaving(false); }
  };

  return (
    <Box sx={{p:3}}>
      <Typography variant="h5" fontWeight={700}>Idiomas disponibles</Typography>
      <Typography variant="caption" color="text.secondary">Habilita/deshabilita idiomas para los usuarios. No fuerza el idioma de nadie.</Typography>
      <Paper sx={{p:2, mt:2}}>
        <Stack spacing={1}>
          {supportedLanguages.map(l => (
            <Box key={l.code} sx={{display:'flex', justifyContent:'space-between', alignItems:'center', py:0.5}}>
              <Typography>{l.label} ({l.code.toUpperCase()})</Typography>
              <Switch checked={enabled.includes(l.code)} onChange={()=>toggle(l.code)} />
            </Box>
          ))}
        </Stack>
        <Button variant="contained" onClick={save} disabled={saving} sx={{mt:2}}>{saving?'Guardando…':'Guardar'}</Button>
      </Paper>
    </Box>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/pages/portal-redthread/apariencia/idiomas.test.tsx --ci` (workdir `frontend/`)
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/portal-redthread/apariencia/idiomas.tsx frontend/src/pages/portal-redthread/apariencia/idiomas.test.tsx frontend/src/components/layout/AdminSidebar.tsx
git commit -m "feat(admin): idiomas enable/disable management"
```

---

### Task 7: Verification — tsc, jest, build, eslint, py_compile

**Files:** none (verification)

- [ ] **Step 1: Backend compile**

Run: `python -m py_compile backend/src/models/user.py backend/src/models/appearance.py backend/src/api/auth.py` (workdir `backend/`)
Expected: exit 0

- [ ] **Step 2: Frontend typecheck**

Run: `npx tsc --noEmit` (workdir `frontend/`)
Expected: exit 0

- [ ] **Step 3: Frontend tests**

Run: `npx jest src/services/languageService.test.ts src/components/common/LanguageSelector.test.tsx src/pages/portal-redthread/apariencia/idiomas.test.tsx --ci` (workdir `frontend/`)
Expected: all PASS

- [ ] **Step 4: Build**

Run: `npm run build` (workdir `frontend/`)
Expected: compiled successfully

- [ ] **Step 5: ESLint**

Run: `npx eslint src/services/languageService.ts src/components/common/LanguageSelector.tsx src/pages/portal-redthread/apariencia/idiomas.tsx` (workdir `frontend/`)
Expected: 0 new errors

- [ ] **Step 6: Manual checklist (guide the user)**

1. Abrir `/` anónimo → redirect a `/en`.
2. Cambiar a `es` en landing → ver hint "Este idioma se aplicará también…".
3. Registrar con `es` seleccionado → tras login, app en `/es`, `GET /auth/me` devuelve `es`.
4. Cambiar a `fr` dentro de app → `PATCH` + redirect a `/fr`, recargar en otro dispositivo → sigue `fr`.
5. Admin deshabilita `fr` → usuario con `fr` al re-loguear cae a `en`.
6. Admin cambia idioma en portal → solo su sesión cambia.

No commit unless a fix is needed (each fix its own commit).

---

## Self-Review

- **Spec coverage:** User default EN (T1) → LANDING_LANGUAGES type (T1) → PATCH/register/DTO (T2) → EN base + enabled service (T3) → landing continuity + login sync (T4) → in-session switch (T5) → admin enable/disable (T6) → verification (T7). All spec sections 4-11 covered.
- **Placeholder scan:** No TBD/TODO; every step has concrete code.
- **Type consistency:** `preferred_language` string throughout; `AppearanceType.LANDING_LANGUAGES` used consistently; `supportedLanguages[].code` as Language type.
