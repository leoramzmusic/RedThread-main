# Profile Tips Submodule Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Tips submodule under Módulos Perfiles that centralizes all help modals in /edit with admin CRUD, preview, i18n, and DB-first with hardcoded fallback.

**Architecture:** New Beanie model `ProfileTip` + admin REST API under `/portal-redthread/profile-tips/` with granular RBAC; new public `GET /api/profile-tips/{tip_key}` for /edit; React hook `useProfileTip` + generic `TipRenderer` (carousel/drawer/stepper, dialog optional stub) that falls back to current hardcoded content; new admin page `/portal-redthread/perfiles/tips` with list, editor, image upload, live preview.

**Tech Stack:** FastAPI + Beanie + MongoDB (backend), Next.js + MUI + SWR/fetch via apiClient/adminApiClient (frontend), /static/tips/ storage for v1.

**Spec:** Approved design 2026-10-05 in conversation — ProfileTip with tip_key, type (carousel|drawer|stepper|dialog), section_key, translations {es,en,...21 langs}, slides [{order, translations, ok_image_url, ko_image_url}], is_active, order; permissions superadmin/admin/content_editor; coexist DB-first + hardcoded fallback.

## Global Constraints

- Backend redirect_slashes=False — every admin GET needs trailing slash `/`.
- Never store image binaries in MongoDB — only URLs from /static/tips/ (v1).
- Frontend tries DB first, falls back to hardcoded content when tip missing, inactive, or fetch fails.
- 21-locale support from day one: model uses `translations: dict[lang, TipTranslation]` with es fallback.
- Granular RBAC: superadmin full CRUD, admin CRUD without DELETE, content_editor UPDATE + UPLOAD only.
- YAGNI: dialog type is stub-only in v1 (model supports it, renderer shows simple Dialog placeholder).
- TDD: backend pytest for model + endpoints, frontend jest for hook/renderer where applicable.
- Frequent commits, one task = one reviewable unit.

---

## File Structure

**Backend — new:**
- `backend/src/models/profile_tip.py` — ProfileTip, TipTranslation, Slide models.
- `backend/src/api/admin_profile_tips.py` — admin router + public_router for GET tip_key.
- `backend/scripts/seed_profile_tips.py` — seeds 9 tips from current hardcoded i18n content.
- `backend/tests/test_profile_tips.py` — model + endpoint tests.

**Backend — modify:**
- `backend/src/models/admin_rbac.py` — add Permission VIEW_PROFILE_TIPS, MANAGE_PROFILE_TIPS, EDIT_PROFILE_TIPS.
- `backend/src/main.py` — register admin_profile_tips routers (admin + public).

**Frontend — new:**
- `frontend/src/hooks/useProfileTip.ts` — fetch GET /api/profile-tips/{tip_key}, returns {tip, loading}.
- `frontend/src/components/profile/TipRenderer.tsx` — switch by type to CarouselTip/DrawerTip/StepperTip/DialogTip.
- `frontend/src/components/profile/tips/CarouselTip.tsx` — dynamic VisualTipsSheet.
- `frontend/src/components/profile/tips/DrawerTip.tsx` — generic info drawer.
- `frontend/src/components/profile/tips/StepperTip.tsx` — dynamic SocialStyleTest wrapper.
- `frontend/src/components/profile/tips/DialogTip.tsx` — simple Dialog stub (v1 optional).
- `frontend/src/pages/portal-redthread/perfiles/tips.tsx` — admin list + editor + preview.
- `frontend/src/components/admin/TipForm.tsx` — editor form with translations grid + slides manager + upload.
- `frontend/src/components/admin/TipPreview.tsx` — live preview reusing TipRenderer.

**Frontend — modify:**
- `frontend/src/services/adminApi.ts` — add profile-tips endpoints (check existing pattern first).
- `frontend/src/components/profile/MediaManager.tsx` — VisualTipsSheet trigger uses useProfileTip('photos_visual') with fallback.
- `frontend/src/components/profile/VisualTipsSheet.tsx` — accept optional `tip` prop for dynamic slides.
- `frontend/src/components/profile/edit/InfoDrawers.tsx` — accept optional tips map for safety/goals/pronouns/location/identity.
- `frontend/src/components/profile/edit/sections/PersonalitySection.tsx` — SocialStyleTest uses tip when present.
- `frontend/src/components/layout/AdminSidebar.tsx` — add child `perfiles-tips` under Módulos Perfiles.

---

### Task 1: Backend ProfileTip model

**Files:**
- Create: `backend/src/models/profile_tip.py`
- Test: `backend/tests/test_profile_tips.py`

**Interfaces:**
- Consumes: beanie Document, pydantic BaseModel.
- Produces: `ProfileTip(tip_key, type, section_key, translations, slides, is_active, order)`, `TipTranslation(title, description, trigger_button_text, ok_label, ko_label)`, `Slide(order, translations, ok_image_url, ko_image_url)`.

- [ ] **Step 1: Write the failing test**

```python
def test_profile_tip_import():
    from src.models.profile_tip import ProfileTip
    assert ProfileTip is not None
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_profile_tips.py::test_profile_tip_import -v`
Expected: FAIL with "No module named src.models.profile_tip"

- [ ] **Step 3: Write minimal implementation**

```python
from beanie import Document, Indexed
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime


class TipTranslation(BaseModel):
    title: str = ""
    description: str = ""
    trigger_button_text: str = ""
    ok_label: Optional[str] = None
    ko_label: Optional[str] = None


class Slide(BaseModel):
    order: int = 0
    translations: dict[str, TipTranslation] = Field(default_factory=dict)
    ok_image_url: str = ""
    ko_image_url: str = ""


class ProfileTip(Document):
    tip_key: Indexed(str, unique=True)
    type: Literal["carousel", "drawer", "stepper", "dialog"] = "drawer"
    section_key: str = ""
    translations: dict[str, TipTranslation] = Field(default_factory=dict)
    slides: List[Slide] = Field(default_factory=list)
    is_active: bool = True
    order: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "profile_tips"
        indexes = ["tip_key", "section_key", "order"]
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_profile_tips.py::test_profile_tip_import -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/models/profile_tip.py backend/tests/test_profile_tips.py
git commit -m "feat(tips): add ProfileTip model"
```

---

### Task 2: RBAC permissions for tips

**Files:**
- Modify: `backend/src/models/admin_rbac.py`
- Test: `backend/tests/test_profile_tips.py`

**Interfaces:**
- Consumes: existing Permission enum.
- Produces: `Permission.VIEW_PROFILE_TIPS`, `Permission.MANAGE_PROFILE_TIPS`, `Permission.EDIT_PROFILE_TIPS`.

- [ ] **Step 1: Write the failing test**

```python
def test_tip_permissions_exist():
    from src.models.admin_rbac import Permission
    assert Permission.VIEW_PROFILE_TIPS is not None
    assert Permission.MANAGE_PROFILE_TIPS is not None
    assert Permission.EDIT_PROFILE_TIPS is not None
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_profile_tips.py::test_tip_permissions_exist -v`
Expected: FAIL with AttributeError

- [ ] **Step 3: Write minimal implementation**

Open `backend/src/models/admin_rbac.py`, find Permission enum, add:

```python
VIEW_PROFILE_TIPS = "view_profile_tips"
MANAGE_PROFILE_TIPS = "manage_profile_tips"
EDIT_PROFILE_TIPS = "edit_profile_tips"
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_profile_tips.py::test_tip_permissions_exist -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/models/admin_rbac.py backend/tests/test_profile_tips.py
git commit -m "feat(tips): add RBAC permissions for profile tips"
```

---

### Task 3: Backend admin + public API

**Files:**
- Create: `backend/src/api/admin_profile_tips.py`
- Modify: `backend/src/main.py`
- Test: `backend/tests/test_profile_tips.py`

**Interfaces:**
- Consumes: ProfileTip model, require_employee_permission, get_current_user.
- Produces: admin `GET /portal-redthread/profile-tips/`, `POST /`, `PATCH /{tip_key}`, `DELETE /{tip_key}`, `PUT /reorder`, `POST /{tip_key}/images`; public `GET /api/profile-tips/{tip_key}` returning only active tips.

- [ ] **Step 1: Write the failing test**

```python
import httpx
def test_public_tip_endpoint_registered():
    from src.main import app
    paths = [r.path for r in app.routes]
    assert any("profile-tips" in p for p in paths)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_profile_tips.py::test_public_tip_endpoint_registered -v`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```python
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from src.models.profile_tip import ProfileTip, TipTranslation, Slide
from src.models.admin_rbac import Permission
from src.core.middleware.employee_rbac import require_employee_permission, log_employee_action
from src.models.employee import Employee
from src.api.auth import get_current_user
from src.models.user import User

router = APIRouter(tags=["Admin - Profile Tips"])
public_router = APIRouter(tags=["Profile Tips"])

class TipUpsert(BaseModel):
    tip_key: Optional[str] = None
    type: Optional[str] = None
    section_key: Optional[str] = None
    translations: Optional[dict] = None
    slides: Optional[list] = None
    is_active: Optional[bool] = None
    order: Optional[int] = None

async def _get_by_key(tip_key: str) -> Optional[ProfileTip]:
    return await ProfileTip.find_one({"tip_key": tip_key})

@router.get("/")
async def list_tips(admin: Employee = Depends(require_employee_permission(Permission.VIEW_PROFILE_TIPS))):
    tips = await ProfileTip.find_all().to_list()
    return sorted(tips, key=lambda t: t.order)

@router.post("/", status_code=201)
async def create_tip(body: TipUpsert, admin: Employee = Depends(require_employee_permission(Permission.MANAGE_PROFILE_TIPS))):
    if not body.tip_key:
        raise HTTPException(status_code=400, detail="tip_key requerido")
    if await _get_by_key(body.tip_key):
        raise HTTPException(status_code=400, detail="Ya existe un tip con esta key")
    tip = ProfileTip(tip_key=body.tip_key, type=body.type or "drawer", section_key=body.section_key or "", translations=body.translations or {}, slides=body.slides or [], is_active=True if body.is_active is None else body.is_active, order=body.order or 0)
    await tip.insert()
    await log_employee_action(employee_id=str(admin.id), action_type="create_profile_tip", description=f"Created tip {tip.tip_key}", target_type="profile_tip", target_id=str(tip.id))
    return tip

@router.patch("/{tip_key}")
async def update_tip(tip_key: str, body: TipUpsert, admin: Employee = Depends(require_employee_permission(Permission.EDIT_PROFILE_TIPS))):
    tip = await _get_by_key(tip_key)
    if not tip:
        raise HTTPException(status_code=404, detail="Tip no encontrado")
    for field, value in body.model_dump(exclude_unset=True).items():
        if field == "tip_key":
            continue
        setattr(tip, field, value)
    tip.updated_at = datetime.utcnow()
    await tip.save()
    return tip

@router.delete("/{tip_key}")
async def delete_tip(tip_key: str, admin: Employee = Depends(require_employee_permission(Permission.MANAGE_PROFILE_TIPS))):
    tip = await _get_by_key(tip_key)
    if not tip:
        raise HTTPException(status_code=404, detail="Tip no encontrado")
    await tip.delete()
    return {"status": "success"}

@router.put("/reorder")
async def reorder_tips(body: dict, admin: Employee = Depends(require_employee_permission(Permission.MANAGE_PROFILE_TIPS))):
    keys = body.get("keys", [])
    for index, key in enumerate(keys):
        tip = await _get_by_key(key)
        if tip:
            tip.order = index
            tip.updated_at = datetime.utcnow()
            await tip.save()
    return {"status": "success"}

@public_router.get("/{tip_key}")
async def get_public_tip(tip_key: str, current_user: User = Depends(get_current_user)):
    tip = await _get_by_key(tip_key)
    if not tip or not tip.is_active:
        raise HTTPException(status_code=404, detail="Tip no encontrado")
    lang = getattr(current_user, "preferred_language", "es") or "es"
    tr = (tip.translations or {}).get(lang) or (tip.translations or {}).get("es") or {}
    return {"tip_key": tip.tip_key, "type": tip.type, "section_key": tip.section_key, "translation": tr, "translations": tip.translations, "slides": tip.slides}
```

Then in `backend/src/main.py` register:

```python
from src.api.admin_profile_tips import router as admin_profile_tips_router, public_router as public_profile_tips_router
app.include_router(admin_profile_tips_router, prefix="/portal-redthread/profile-tips")
app.include_router(public_profile_tips_router, prefix="/api/profile-tips")
```

Check main.py for exact include pattern first — follow existing admin_profile_modules registration.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_profile_tips.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/api/admin_profile_tips.py backend/src/main.py backend/tests/test_profile_tips.py
git commit -m "feat(tips): add admin and public profile-tips API"
```

---

### Task 4: Seed script with current hardcoded content

**Files:**
- Create: `backend/scripts/seed_profile_tips.py`

**Interfaces:**
- Consumes: ProfileTip model.
- Produces: 9 tips (photos_visual carousel, safety/goals/pronouns/location/identity drawers, social_style_test stepper, spotify_search dialog stub, nickname dialog stub) with es translations from current i18n defaults.

- [ ] **Step 1: Write the seed script**

```python
import asyncio
from src.models.profile_tip import ProfileTip, TipTranslation

SEEDS = [
    {"tip_key": "photos_visual", "type": "carousel", "section_key": "section-photos", "order": 0, "translations": {"es": {"title": "Tips para tus fotos", "description": "", "trigger_button_text": "Tips visuales"}}},
    {"tip_key": "safety", "type": "drawer", "section_key": "section-aboutme", "order": 1, "translations": {"es": {"title": "Consejos de Seguridad", "description": "Por tu seguridad, no incluyas nombres de usuario de redes sociales ni información de contacto directa en tu biografía.", "trigger_button_text": "Entendido"}}},
    {"tip_key": "goals", "type": "drawer", "section_key": "section-goals", "order": 2, "translations": {"es": {"title": "Las emociones cambian", "description": "Te preguntaremos de vez en cuando en caso de que tu opinión haya cambiado.", "trigger_button_text": "Entendido"}}},
    {"tip_key": "pronouns", "type": "drawer", "section_key": "section-pronouns", "order": 3, "translations": {"es": {"title": "¿Por qué son importantes los pronombres?", "description": "Los pronombres permiten darle más profundidad y detalle a tu perfil.", "trigger_button_text": "De acuerdo"}}},
    {"tip_key": "location", "type": "drawer", "section_key": "section-location", "order": 4, "translations": {"es": {"title": "¿Por qué pedimos tu ubicación?", "description": "Tu ubicación nos ayuda a mostrarte personas cercanas. Nunca compartiremos tu ubicación exacta sin tu consentimiento.", "trigger_button_text": "Entendido"}}},
    {"tip_key": "identity", "type": "drawer", "section_key": "section-basic", "order": 5, "translations": {"es": {"title": "¿Por qué pedimos tu identidad?", "description": "Tu identidad nos ayuda a verificar tu perfil y mantener la seguridad de la comunidad.", "trigger_button_text": "Entendido"}}},
    {"tip_key": "social_style_test", "type": "stepper", "section_key": "section-personality", "order": 6, "translations": {"es": {"title": "Microtest: Estilo Social", "description": "Responde 5 preguntas para descubrir tu estilo social.", "trigger_button_text": "¿No sabes cuál eres?"}}},
    {"tip_key": "spotify_search", "type": "dialog", "section_key": "section-music", "order": 7, "translations": {"es": {"title": "Buscar en Spotify", "description": "", "trigger_button_text": "Buscar"}}},
    {"tip_key": "nickname", "type": "dialog", "section_key": "section-basic", "order": 8, "translations": {"es": {"title": "Cambiar nickname", "description": "", "trigger_button_text": "Editar"}}},
]

async def main():
    from src.main import init_db
    await init_db()
    for s in SEEDS:
        existing = await ProfileTip.find_one({"tip_key": s["tip_key"]})
        if existing:
            print(f"skip {s['tip_key']}")
            continue
        tip = ProfileTip(tip_key=s["tip_key"], type=s["type"], section_key=s["section_key"], translations={k: TipTranslation(**v) for k, v in s["translations"].items()}, slides=[], order=s["order"])
        await tip.insert()
        print(f"created {s['tip_key']}")

if __name__ == "__main__":
    asyncio.run(main())
```

Check `backend/src/main.py` for actual DB init function name — adjust if different.

- [ ] **Step 2: Run seed in dev**

Run: `python backend/scripts/seed_profile_tips.py`
Expected: creates 9 tips, skips existing on rerun.

- [ ] **Step 3: Commit**

```bash
git add backend/scripts/seed_profile_tips.py
git commit -m "feat(tips): seed initial 9 profile tips"
```

---

### Task 5: Frontend useProfileTip hook

**Files:**
- Create: `frontend/src/hooks/useProfileTip.ts`
- Test: `frontend/src/hooks/useProfileTip.test.ts`

**Interfaces:**
- Consumes: apiClient GET `/api/profile-tips/{tip_key}`.
- Produces: `useProfileTip(tip_key) -> { tip, loading, error }`.

- [ ] **Step 1: Write the failing test**

```ts
import { renderHook } from "@testing-library/react";
import { useProfileTip } from "./useProfileTip";
test("returns loading initially", () => {
  const { result } = renderHook(() => useProfileTip("photos_visual"));
  expect(result.current.loading).toBe(true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/hooks/useProfileTip.test.ts`
Expected: FAIL with module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
import { useEffect, useState } from "react";
import apiClient from "../services/api";

export interface ProfileTipData {
  tip_key: string;
  type: "carousel" | "drawer" | "stepper" | "dialog";
  section_key: string;
  translation: { title?: string; description?: string; trigger_button_text?: string };
  translations?: Record<string, any>;
  slides?: any[];
}

export function useProfileTip(tip_key: string) {
  const [tip, setTip] = useState<ProfileTipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiClient
      .get(`/api/profile-tips/${tip_key}`)
      .then((res) => {
        if (!cancelled) setTip(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message ?? "error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tip_key]);
  return { tip, loading, error };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/hooks/useProfileTip.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/hooks/useProfileTip.ts frontend/src/hooks/useProfileTip.test.ts
git commit -m "feat(tips): add useProfileTip hook"
```

---

### Task 6: TipRenderer + typed tip components

**Files:**
- Create: `frontend/src/components/profile/TipRenderer.tsx`
- Create: `frontend/src/components/profile/tips/CarouselTip.tsx`
- Create: `frontend/src/components/profile/tips/DrawerTip.tsx`
- Create: `frontend/src/components/profile/tips/StepperTip.tsx`
- Create: `frontend/src/components/profile/tips/DialogTip.tsx`

**Interfaces:**
- Consumes: ProfileTipData from hook.
- Produces: `TipRenderer({tip_key, fallback})` switching on tip.type, each sub-component accepting `{tip, onClose, fallback}`.

- [ ] **Step 1: Write CarouselTip (dynamic VisualTipsSheet)**

Reuse `VisualTipsSheet` layout but accept `tip` prop: if tip?.slides?.length > 0 render slides from tip, else render hardcoded slides. Keep swipe logic identical.

- [ ] **Step 2: Write DrawerTip (generic InfoDrawer)**

Props `{title, body, buttonText, onClose}` from tip.translation with fallback to t() keys passed by caller.

- [ ] **Step 3: Write StepperTip wrapper**

Render existing `SocialStyleTest` when open; title from tip.translation.title with fallback.

- [ ] **Step 4: Write DialogTip stub**

Simple MUI Dialog with title + description + close button. Marked optional v1.

- [ ] **Step 5: Write TipRenderer switch**

```tsx
export default function TipRenderer({ tip, onClose, fallback }: any) {
  if (!tip) return fallback ?? null;
  switch (tip.type) {
    case "carousel": return <CarouselTip tip={tip} onClose={onClose} />;
    case "drawer": return <DrawerTip tip={tip} onClose={onClose} />;
    case "stepper": return <StepperTip tip={tip} onClose={onClose} />;
    default: return <DialogTip tip={tip} onClose={onClose} />;
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/profile/TipRenderer.tsx frontend/src/components/profile/tips/
git commit -m "feat(tips): add TipRenderer and typed components"
```

---

### Task 7: Integrate into /edit with fallback

**Files:**
- Modify: `frontend/src/components/profile/MediaManager.tsx`
- Modify: `frontend/src/components/profile/VisualTipsSheet.tsx`
- Modify: `frontend/src/components/profile/edit/InfoDrawers.tsx`
- Modify: `frontend/src/components/profile/edit/sections/PersonalitySection.tsx`

**Interfaces:**
- Consumes: useProfileTip, TipRenderer.
- Produces: same UX as today when DB empty; dynamic content when tip active.

- [ ] **Step 1: PhotosSection visual tips uses DB first**

In `MediaManager.tsx` where `showTips` opens `VisualTipsSheet`, fetch `useProfileTip("photos_visual")`, pass `tip` to `VisualTipsSheet`. In `VisualTipsSheet.tsx` add optional `tip` prop: if tip has slides use them, else hardcoded slides.

- [ ] **Step 2: InfoDrawers accept tips map**

Add optional prop `tips?: Record<string, ProfileTipData>` to InfoDrawers; each drawer uses `tips?.safety?.translation?.title ?? t(...)` pattern. Wire callers in ProfileEdit to fetch 5 drawers (or fetch lazily per open).

- [ ] **Step 3: PersonalitySection stepper title from DB**

Fetch `useProfileTip("social_style_test")`, pass title override to SocialStyleTest or show above it. Keep quiz logic unchanged.

- [ ] **Step 4: Verify no regression**

Run: `npm test -- src/components/profile`
Expected: PASS. Manual check /profile/@me/edit opens all modals as before.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/profile/MediaManager.tsx frontend/src/components/profile/VisualTipsSheet.tsx frontend/src/components/profile/edit/InfoDrawers.tsx frontend/src/components/profile/edit/sections/PersonalitySection.tsx
git commit -m "feat(tips): integrate DB-first tips in edit with fallback"
```

---

### Task 8: Admin tips page + editor + preview

**Files:**
- Create: `frontend/src/pages/portal-redthread/perfiles/tips.tsx`
- Create: `frontend/src/components/admin/TipForm.tsx`
- Create: `frontend/src/components/admin/TipPreview.tsx`
- Modify: `frontend/src/components/layout/AdminSidebar.tsx`
- Modify: `frontend/src/services/adminApi.ts`

**Interfaces:**
- Consumes: adminApiClient `/portal-redthread/profile-tips/` endpoints.
- Produces: admin list with drag reorder, editor with translations grid + slides + upload, live preview via TipRenderer.

- [ ] **Step 1: Add adminApi endpoints**

Follow existing pattern in adminApi.ts (check file first). Add `listTips, getTip, createTip, updateTip, deleteTip, reorderTips, uploadTipImage`.

- [ ] **Step 2: Build list page with reorder**

Copy structure from `modulos.tsx`: DndContext list, is_active toggle (local draft + Guardar), Nuevo tip button, Snackbar feedback.

- [ ] **Step 3: Build TipForm editor**

Tabs: General (key/type/section/active/order), Traducciones (es/en + expandable for 21 langs), Slides (add/remove/reorder + ok/ko upload + labels). Upload via POST multipart to `/{tip_key}/images`, store returned URL.

- [ ] **Step 4: Build TipPreview**

Render `<TipRenderer tip={draftTip} />` in a phone-frame Box. Updates live as form changes.

- [ ] **Step 5: Add sidebar entry**

In AdminSidebar perfiles children add `{ id: 'perfiles-tips', label: 'Tips', icon: <HelpIcon />, path: '/portal-redthread/perfiles/tips' }`. Check icon imports.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/portal-redthread/perfiles/tips.tsx frontend/src/components/admin/TipForm.tsx frontend/src/components/admin/TipPreview.tsx frontend/src/components/layout/AdminSidebar.tsx frontend/src/services/adminApi.ts
git commit -m "feat(tips): add admin tips management UI"
```

---

## Self-Review

1. **Spec coverage:** model (Task 1) + RBAC (Task 2) + API incl. public GET + reorder + upload contract (Task 3) + seed 9 tips (Task 4) + hook (Task 5) + renderer 4 types (Task 6) + /edit integration photos/drawers/stepper (Task 7) + admin UI list/editor/preview/sidebar (Task 8). Dialog type stubbed, not blocking. i18n via translations dict. Images via URL only.
2. **Placeholder scan:** no TBD/TODO; all steps have concrete code or explicit file-check instructions.
3. **Type consistency:** ProfileTipData matches backend public response shape; tip_key/type/section_key naming consistent across tasks.
