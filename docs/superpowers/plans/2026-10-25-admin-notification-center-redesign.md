# Admin Notification Center & Employee Inbox Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the complete Admin Notification Center redesign with dual-domain sidebar (Usuarios & Empleados), executive/operational Dashboards with KPI cards, and the 5-step "+ Nueva Notificación" wizard.

**Architecture:** Split admin navigation into two distinct trees, backend KPI aggregation endpoints, campaign wizard state management, and pre-defined template repositories.

**Tech Stack:** FastAPI, Beanie/MongoDB, React, TypeScript, Material-UI.

**Spec:** `docs/superpowers/specs/2026-10-25-admin-notification-center-redesign.md`

## Global Constraints
- Python 3.10+, FastAPI, Beanie ODM with MongoDB.
- React 18+, TypeScript, Material-UI (MUI).
- Follow existing project naming and architectural patterns.

---

### Task 1: Backend KPI Aggregation Endpoints

**Files:**
- Create: `backend/src/api/admin_notification_kpis.py`
- Modify: `backend/src/main.py`
- Test: `backend/tests/test_admin_notification_kpis.py`

**Interfaces:**
- Consumes: `Notification`, `Report`, `SupportTicket`, `Campaign`.
- Produces: `GET /api/admin/notifications/kpis` returning `enviadas_hoy`, `no_leidas`, `alertas_p0`, `ctr_promedio`, `acciones_pendientes`.

- [ ] **Step 1: Write failing test for KPI endpoint**

```python
import pytest
from httpx import AsyncClient
from src.main import app

@pytest.mark.asyncio
async def test_kpi_endpoint():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/admin/notifications/kpis")
        assert response.status_code in [200, 401]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_admin_notification_kpis.py -v`
Expected: FAIL

- [ ] **Step 3: Implement `backend/src/api/admin_notification_kpis.py` and register in `backend/src/main.py`**

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_admin_notification_kpis.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/api/admin_notification_kpis.py backend/src/main.py backend/tests/test_admin_notification_kpis.py
git commit -m "feat: add admin notification kpi aggregation endpoint"
```

---

### Task 2: Redesign Admin Sidebar Navigation (Dual Domain Tree)

**Files:**
- Modify: `frontend/src/components/layout/AdminSidebar.tsx`
- Test: Component build verification.

**Interfaces:**
- Consumes: MUI List / Collapse components.
- Produces: Dual-domain tree ("🔔 Usuarios" and "🛡️ Empleados") with all requested submenus.

- [ ] **Step 1: Update `AdminSidebar.tsx`**

Restructure menu items into:
- 🔔 Usuarios (Dashboard, Crear Notificación, Campañas, Audiencias, Plantillas, Historial, Métricas)
- 🛡️ Empleados (Dashboard, Crear Notificación, Alertas Operativas, Reglas Automáticas, Plantillas, Historial, Métricas)

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: SUCCESS

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/layout/AdminSidebar.tsx
git commit -m "feat: restructure admin sidebar into usuarios and empleados domains"
```

---

### Task 3: Implement "+ Nueva Notificación" 5-Step Wizard Modal

**Files:**
- Create: `frontend/src/components/notifications/NewNotificationWizard.tsx`
- Modify: `frontend/src/components/layout/AdminNavbar.tsx` (Add "+ Nueva Notificación" primary button)
- Test: Build verification.

**Interfaces:**
- Consumes: Campaign creation API.
- Produces: Global modal wizard with steps (Recipients, Category, Audience, Content & CTA, Preview & Action).

- [ ] **Step 1: Implement `NewNotificationWizard.tsx`**

- [ ] **Step 2: Add "+ Nueva Notificación" button to `AdminNavbar.tsx`**

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: SUCCESS

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/notifications/NewNotificationWizard.tsx frontend/src/components/layout/AdminNavbar.tsx
git commit -m "feat: add 5-step new notification wizard and navbar action button"
```

---

### Task 4: Implement Executive & Operational Dashboards with KPI Cards

**Files:**
- Create: `frontend/src/pages/portal-redthread/notifications/dashboard.tsx` (or update existing views)
- Test: Build verification.

**Interfaces:**
- Consumes: `/api/admin/notifications/kpis`.
- Produces: Dashboard views for Usuarios and Empleados displaying KPI cards (`enviadas_hoy`, `no_leidas`, `alertas_p0`, `ctr_promedio`, `acciones_pendientes`) and quick charts/widgets.

- [ ] **Step 1: Implement Dashboard views**

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: SUCCESS

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/portal-redthread/notifications/
git commit -m "feat: implement executive and operational dashboards with kpi cards"
```
