# Módulos Perfiles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin-manageable profile sections (visibility, rename, reorder, create, delete) wired into the real user profile render.

**Architecture:** New Beanie collection `profile_modules` + admin CRUD API with permission gates + public ordered endpoint + frontend `registry.ts` mapping keys to section components + `ProfileEdit` renders from registry with fallback.

**Tech Stack:** FastAPI + Beanie (backend), Next.js + MUI + @dnd-kit/sortable (already in `frontend/package.json`), pytest, Jest.

**Spec:** `docs/superpowers/specs/2026-09-29-profile-modules-design.md`

## Global Constraints

- Backend patterns: `APIRouter` + `require_employee_permission(Permission.X)` + `log_employee_action(...)` (see `backend/src/api/admin_roles.py:1-75`).
- Router mount: `app.include_router(x.router, prefix="/portal-redthread/...")` in `backend/src/main.py`.
- Admin frontend calls go through `frontend/src/services/adminApi` default export (`adminApiClient`).
- Sidebar entries live in the sections array in `frontend/src/components/layout/AdminSidebar.tsx:230-310` (add `perfiles` group after `usuarios` at line 254).
- Section keys ARE the existing `ProfileEdit` anchor ids (`section-photos`, `section-basic`, `section-location`, `section-aboutme`, `section-goals`, `section-interests`, `section-pronouns`, `section-additional`, `section-professional`, `section-music`, `section-identity`, `section-personality`, `section-cognitive`, `section-wellness`, `section-status`, `section-languages`).
- Spanish UI copy with `next-i18next` fallbacks, matching existing admin pages.
- No `!important` in new styles; MUI breakpoints only.

---

### Task 1: Backend model + permissions + seed

**Files:**
- Modify: `backend/src/models/admin_rbac.py:19-100` (append permissions), `:103-145` (matrix)
- Create: `backend/src/models/profile_module.py`
- Create: `backend/src/scripts/seed_profile_modules.py` (check existing seed pattern in `backend/scripts/` first; if none fits, plain async script using Beanie `insert()` like `admin_roles.py:64-65`)

**Interfaces:**
- Consumes: `Permission`, `ROLE_PERMISSIONS`, Beanie `Document`.
- Produces: `ProfileModule` (key, nombre, descripcion, icono, orden, visible, origen, requiere_premium), `Permission.VIEW_PROFILE_MODULES/MANAGE_VISIBILITY_MODULES/MANAGE_PROFILE_MODULES`, seed function `seed_profile_modules()`.

- [ ] **Step 1: Append the three permissions to the `Permission` enum**

```python
    # Profile Modules
    VIEW_PROFILE_MODULES = "view_profile_modules"
    MANAGE_VISIBILITY_MODULES = "manage_visibility_modules"
    MANAGE_PROFILE_MODULES = "manage_profile_modules"
```

- [ ] **Step 2: Extend `ROLE_PERMISSIONS`**

```python
    AdminRole.MODERATOR: [
        # ... existing ...
        Permission.VIEW_PROFILE_MODULES,
        Permission.MANAGE_VISIBILITY_MODULES,
    ],
    AdminRole.SUPPORT: [
        # ... existing ...
        Permission.VIEW_PROFILE_MODULES,
    ],
    AdminRole.ANALYST: [
        # ... existing ...
        Permission.VIEW_PROFILE_MODULES,
    ],
```

Super_admin gets all automatically. Marketing/finance get none.

- [ ] **Step 3: Create `backend/src/models/profile_module.py`**

```python
from beanie import Document
from pydantic import Field
from typing import Optional
from datetime import datetime


class ProfileModule(Document):
    key: str  # e.g. "section-music" — contract with frontend registry.ts
    nombre: str
    descripcion: str = ""
    icono: str = "tune"
    orden: int = 0
    visible: bool = True
    origen: str = "core"  # "core" | "integracion"
    requiere_premium: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "profile_modules"
        indexes = ["key", "orden"]
```

- [ ] **Step 4: Write the seed with the 16 current sections (orden 0-15, all visible, origen core except section-music → integracion)**

- [ ] **Step 5: Commit**

```bash
git add backend/src/models/admin_rbac.py backend/src/models/profile_module.py backend/src/scripts/seed_profile_modules.py
git commit -m "feat(backend): profile modules model, permissions and seed"
```

---

### Task 2: Backend API (admin CRUD + public endpoint)

**Files:**
- Create: `backend/src/api/admin_profile_modules.py`
- Modify: `backend/src/main.py` (import + two `include_router`)
- Test: `backend/tests/test_profile_modules.py`

**Interfaces:**
- Consumes: `ProfileModule`, the three permissions, `require_employee_permission`, `log_employee_action`, `AdminAction`.
- Produces: routes `GET/POST /portal-redthread/profile-modules`, `PATCH /{key}`, `PATCH /{key}/visibilidad`, `PUT /reorden`, `DELETE /{key}`, public `GET /api/profile-modules`.

- [ ] **Step 1: Write the failing test for the integrity rule**

```python
def test_cannot_hide_last_core_module(client, admin_token):
    res = client.patch(
        "/portal-redthread/profile-modules/section-photos/visibilidad",
        json={"visible": False},
        headers=admin_token,
    )
    assert res.status_code in (400, 422)
```

Check `backend/tests/conftest.py` for the existing client/auth fixture names and use them verbatim instead of `client, admin_token`.

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest backend/tests/test_profile_modules.py -v`
Expected: FAIL (module/route does not exist)

- [ ] **Step 3: Implement `admin_profile_modules.py` following `admin_roles.py:15-75`**

Schemas: `ModuleCreate` (key, nombre, descripcion="", icono="tune", orden=0, visible=True, origen="integracion", requiere_premium=False), `ModuleUpdate` (nombre, descripcion, icono — all optional), `VisibilidadUpdate` (visible: bool), `ReordenRequest` (keys: List[str]).

Guards: list/create/update/delete → `manage_profile_modules` except list → `view_profile_modules`; visibilidad + reorden → `manage_visibility_modules`. Public `GET /api/profile-modules` uses the regular user auth dependency from `src/api/auth.py` (`get_current_user`, same as `spotify_auth.py:26`) and returns only `visible=True` ordered by `orden`.

Integrity rule: before hiding/deleting, count remaining `origen=core AND visible=True`; if zero, raise 400. Delete allowed only when `origen == "integracion"`, else 400. Every mutation calls `log_employee_action(...)` with action_type like `update_profile_module`.

- [ ] **Step 4: Register routers in `main.py`**

```python
app.include_router(admin_profile_modules.router, prefix="/portal-redthread/profile-modules", tags=["Admin - Profile Modules"])
app.include_router(admin_profile_modules.public_router, prefix="/api/profile-modules", tags=["Profile Modules"])
```

(Use two routers in the file, or one router mounted twice — two explicit routers is clearer.)

- [ ] **Step 5: Run tests until green**

Run: `python -m pytest backend/tests/test_profile_modules.py -v`
Expected: PASS, including 403 cases for a role without permission.

- [ ] **Step 6: Commit**

```bash
git add backend/src/api/admin_profile_modules.py backend/src/main.py backend/tests/test_profile_modules.py
git commit -m "feat(backend): profile modules admin CRUD and public endpoint"
```

---

### Task 3: Frontend `registry.ts` (documented key → component)

**Files:**
- Create: `frontend/src/components/profile/sections/registry.ts`
- Test: `frontend/src/components/profile/sections/registry.test.ts`

**Interfaces:**
- Consumes: existing section components imported in `ProfileEdit.tsx` (MusicSection, PersonalitySection, CognitiveSection, WellnessSection, SocialSection, etc.).
- Produces: `PROFILE_SECTION_REGISTRY: Record<string, ComponentType<SectionProps>>`, `ProfileSectionKey`.

- [ ] **Step 1: Write the failing test**

```ts
import { PROFILE_SECTION_REGISTRY } from './registry';

const SEED_KEYS = ['section-photos','section-basic','section-location','section-aboutme','section-goals','section-interests','section-pronouns','section-additional','section-professional','section-music','section-identity','section-personality','section-cognitive','section-wellness','section-status','section-languages'];

test('registry covers every seeded key', () => {
  for (const key of SEED_KEYS) {
    expect(PROFILE_SECTION_REGISTRY[key]).toBeDefined();
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- registry.test.ts` (from `frontend/`)
Expected: FAIL (module does not exist)

- [ ] **Step 3: Write `registry.ts`**

```ts
// key del backend (profile_modules.key) -> componente de sección.
// Para añadir una sección: 1) crear el componente, 2) registrarlo aquí,
// 3) crear el módulo en el admin con el mismo key.
import MusicSection from '../edit/sections/MusicSection';
// ... one import per section component used in ProfileEdit.tsx
export const PROFILE_SECTION_REGISTRY = {
  'section-music': MusicSection,
  // ...
} as const;
export type ProfileSectionKey = keyof typeof PROFILE_SECTION_REGISTRY;
```

Reuse the exact import paths already present in `ProfileEdit.tsx`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- registry.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/profile/sections/registry.ts frontend/src/components/profile/sections/registry.test.ts
git commit -m "feat(frontend): documented profile section registry"
```

---

### Task 4: Admin UI page + sidebar entry

**Files:**
- Create: `frontend/src/pages/portal-redthread/perfiles/modulos.tsx`
- Modify: `frontend/src/components/layout/AdminSidebar.tsx` (insert `perfiles` group after `usuarios` block ending line 254)

**Interfaces:**
- Consumes: `adminApiClient` (`GET/POST/PATCH/PUT/DELETE /portal-redthread/profile-modules`), `@dnd-kit/sortable` + `@dnd-kit/core` (in `frontend/package.json:15-17`), registry keys for display.
- Produces: page at `/portal-redthread/perfiles/modulos`.

- [ ] **Step 1: Add the sidebar group**

```tsx
{
  id: 'perfiles',
  label: 'Módulos Perfiles',
  icon: <UserIcon className="rt-pulse" />,
  children: [
    { id: 'perfiles-modulos', label: 'Módulos', icon: <PreferencesIcon />, path: '/portal-redthread/perfiles/modulos' },
  ],
},
```

`UserIcon` and `PreferencesIcon` are already imported in AdminSidebar.tsx:31,50.

- [ ] **Step 2: Build the page** — table of modules (nombre, key, icono, orden, visible toggle, origen badge) following the visual pattern of `portal-redthread/experiencia/menus.tsx`; create/edit dialog (nombre, descripcion, icono — key editable only on create); delete button only when `origen === 'integracion'` with confirm; drag & drop via `@dnd-kit/sortable` persisting with `PUT /reorden`; on 403 show read-only mode (disable controls, show notice). All copy in Spanish with `t()` fallbacks.

- [ ] **Step 3: Verify manually** — `npm run dev`, visit page as superadmin: toggle, rename, reorder persist after reload.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/portal-redthread/perfiles/modulos.tsx frontend/src/components/layout/AdminSidebar.tsx
git commit -m "feat(frontend): admin profile modules page and sidebar entry"
```

---

### Task 5: Wire `ProfileEdit` to the endpoint with fallback

**Files:**
- Modify: `frontend/src/components/profile/ProfileEdit.tsx` (sections rendering ~lines 674-843)

**Interfaces:**
- Consumes: `PROFILE_SECTION_REGISTRY`, public `GET /api/profile-modules` via `apiClient` (same client `MusicSection.tsx` uses: `frontend/src/services/api`).

- [ ] **Step 1: Fetch ordered visible keys on mount; on error keep current hardcoded render (fallback)**

- [ ] **Step 2: Render sections by mapping keys through the registry in returned order, skipping keys missing from the registry (log a console warning, don't crash)**

- [ ] **Step 3: Verify manually** — hide `section-music` in admin → disappears from profile edit; stop backend → profile renders as before; `tsc --noEmit` clean.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/profile/ProfileEdit.tsx
git commit -m "feat(frontend): render profile sections from admin modules with fallback"
```

---

### Task 6: Final verification

- [ ] **Step 1: Run full gates** — `npx tsc --noEmit` (frontend, expect exit 0), `npx eslint src/components/profile/sections/ frontend/src/pages/portal-redthread/perfiles/ --quiet` (expect 0 errors), `python -m pytest backend/tests/test_profile_modules.py` (expect PASS), `npm test -- registry` (expect PASS).
- [ ] **Step 2: Push** — `git push origin main` (if the push touches `.github/workflows/`, it will be rejected by the OAuth scope — that file is not part of this plan, so this should not happen).
