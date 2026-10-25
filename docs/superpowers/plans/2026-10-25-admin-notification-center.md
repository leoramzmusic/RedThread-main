# Admin Notification Center & Employee Inbox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Admin Notification Center and Employee Inbox module with F4a delivery tracking, priority filtering (P0-P3), and actionable CTAs.

**Architecture:** Shared Notification Platform approach extending the existing `Campaign` model and notification core with recipient scoping (`user` | `employee`), F4a fields (`seen_at`, `read_at`), category, expires_at, created_by, and executed_by.

**Tech Stack:** FastAPI, Beanie/MongoDB, React, TypeScript, Material-UI.

**Spec:** `docs/superpowers/specs/2026-10-25-admin-notification-center-design.md`

## Global Constraints
- Python 3.10+, FastAPI, Beanie ODM with MongoDB.
- React 18+, TypeScript, Material-UI (MUI).
- Follow existing project naming and architectural patterns.

---

### Task 1: Extend Notification Model with Recipient Scoping & F4a

**Files:**
- Modify: `backend/src/models/notification.py`
- Test: `backend/tests/test_notification_model.py`

**Interfaces:**
- Consumes: Existing Beanie Document base.
- Produces: `recipient_type`, `recipient_id`, `category`, `seen_at`, `read_at`, `expires_at`, `priority`, `action_url`, `action_label`.

- [ ] **Step 1: Write the failing test for notification recipient scoping**

```python
import pytest
from datetime import datetime
from src.models.notification import Notification

@pytest.mark.asyncio
async def test_notification_recipient_fields():
    n = Notification(
        recipient_type="employee",
        recipient_id="emp_123",
        category="operational",
        content="New report submitted",
        priority="P1",
        action_url="/portal-redthread/denuncias/1",
        action_label="Open Report"
    )
    assert n.recipient_type == "employee"
    assert n.recipient_id == "emp_123"
    assert n.priority == "P1"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_notification_model.py -v`
Expected: FAIL due to missing fields or model attributes.

- [ ] **Step 3: Update `backend/src/models/notification.py`**

```python
from datetime import datetime
from typing import Optional, Dict, Any, List
from beanie import Document
from pydantic import Field

class Notification(Document):
    recipient_type: str = "user"  # "user" | "employee"
    recipient_id: Optional[str] = None
    user_id: Optional[str] = None  # Legacy support
    category: str = "announcement"  # "announcement" | "alert" | "operational" | "security" | "maintenance"
    content: str
    seen_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    priority: str = "P2"  # "P0" | "P1" | "P2" | "P3"
    action_url: Optional[str] = None
    action_label: Optional[str] = None
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "notifications"
        indexes = [
            [("recipient_type", 1), ("recipient_id", 1), ("is_read", 1), ("created_at", -1)],
            [("user_id", 1), ("is_read", 1), ("created_at", -1)]
        ]
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_notification_model.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/models/notification.py backend/tests/test_notification_model.py
git commit -m "feat: extend notification model with recipient scoping and f4a fields"
```

---

### Task 2: Extend Campaign Model & Admin API

**Files:**
- Modify: `backend/src/models/campaign.py`
- Modify: `backend/src/api/admin_campanas.py`
- Test: `backend/tests/test_admin_campaigns.py`

**Interfaces:**
- Consumes: `Notification`, `Employee` auth.
- Produces: Campaign creation, audience filtering, `target_recipient_type`, `category`, `created_by`, `executed_by`, `expires_at`.

- [ ] **Step 1: Write failing test for campaign extension**

```python
import pytest
from src.models.campaign import Campaign

@pytest.mark.asyncio
async def test_campaign_extension_fields():
    c = Campaign(
        title="Test Campaign",
        target_recipient_type="employee",
        category="operational",
        priority="P1",
        created_by="emp_1",
        content_i18n={"es": {"title": "Hola", "body": "Mundo"}}
    )
    assert c.target_recipient_type == "employee"
    assert c.created_by == "emp_1"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_admin_campaigns.py -v`
Expected: FAIL

- [ ] **Step 3: Update `backend/src/models/campaign.py` and `backend/src/api/admin_campanas.py`**

Add fields to `Campaign`:
```python
target_recipient_type: str = "user"  # "user" | "employee"
category: str = "announcement"
audience_filter: Dict[str, Any] = Field(default_factory=dict)
content_i18n: Dict[str, Dict[str, str]] = Field(default_factory=dict)
priority: str = "P2"
action_url: Optional[str] = None
action_label: Optional[str] = None
created_by: Optional[str] = None
executed_by: Optional[str] = None
expires_at: Optional[datetime] = None
stats: Dict[str, int] = Field(default_factory=lambda: {"sent": 0, "delivered": 0, "seen": 0, "read": 0, "clicked": 0})
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_admin_campaigns.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/models/campaign.py backend/src/api/admin_campanas.py backend/tests/test_admin_campaigns.py
git commit -m "feat: extend campaign model for shared notification platform"
```

---

### Task 3: Implement Employee Notification Inbox Endpoints & F4a Actions

**Files:**
- Create: `backend/src/api/employee_notifications.py`
- Modify: `backend/src/main.py`
- Test: `backend/tests/test_employee_notifications.py`

**Interfaces:**
- Consumes: `require_employee_permission`, `Notification`.
- Produces: `/api/employee/notifications/inbox`, mark seen, mark read, archive.

- [ ] **Step 1: Write failing test for employee notification inbox**

```python
import pytest
from httpx import AsyncClient
from src.main import app

@pytest.mark.asyncio
async def test_employee_inbox_route():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/employee/notifications/inbox")
        assert response.status_code in [200, 401]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_employee_notifications.py -v`
Expected: FAIL (route not found)

- [ ] **Step 3: Implement `backend/src/api/employee_notifications.py`**

```python
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime
from src.models.notification import Notification
from src.models.admin_rbac import AdminUser
from src.core.middleware.employee_rbac import require_employee_permission, Permission

router = APIRouter(prefix="/employee/notifications", tags=["Employee Notifications"])

@router.get("/inbox")
async def get_employee_inbox(
    is_read: Optional[bool] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = Query(50, le=100),
    offset: int = 0,
    admin_user: AdminUser = Depends(require_employee_permission(Permission.VIEW_NOTIFICATIONS) if hasattr(Permission, 'VIEW_NOTIFICATIONS') else require_employee_permission(Permission.VIEW_DASHBOARD))
):
    query = {"recipient_type": "employee", "recipient_id": admin_user.user_id}
    if is_read is not None:
        query["is_read"] = is_read
    if priority:
        query["priority"] = priority
    if category:
        query["category"] = category

    notifications = await Notification.find(query).sort("-created_at").skip(offset).limit(limit).to_list()
    return {"notifications": notifications}

@router.post("/inbox/{notification_id}/seen")
async def mark_seen(
    notification_id: str,
    admin_user: AdminUser = Depends(require_employee_permission(Permission.VIEW_DASHBOARD))
):
    notif = await Notification.get(notification_id)
    if not notif or notif.recipient_id != admin_user.user_id:
        raise HTTPException(status_code=404, detail="Notification not found")
    if not notif.seen_at:
        notif.seen_at = datetime.utcnow()
        await notif.save()
    return {"success": True}

@router.post("/inbox/{notification_id}/read")
async def mark_read(
    notification_id: str,
    admin_user: AdminUser = Depends(require_employee_permission(Permission.VIEW_DASHBOARD))
):
    notif = await Notification.get(notification_id)
    if not notif or notif.recipient_id != admin_user.user_id:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    notif.read_at = datetime.utcnow()
    if not notif.seen_at:
        notif.seen_at = datetime.utcnow()
    await notif.save()
    return {"success": True}
```

- [ ] **Step 4: Register router in `backend/src/main.py` and run tests**

Run: `pytest backend/tests/test_employee_notifications.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/api/employee_notifications.py backend/src/main.py backend/tests/test_employee_notifications.py
git commit -m "feat: implement employee notification inbox and f4a endpoints"
```

---

### Task 4: Operational Triggers for Reports & Tickets

**Files:**
- Modify: `backend/src/api/moderation.py`
- Modify: `backend/src/api/admin_soporte.py` (or create ticket endpoint)
- Test: `backend/tests/test_operational_triggers.py`

**Interfaces:**
- Consumes: `Notification`, `Report`.
- Produces: Automatic creation of high-priority operational notifications for employees when reports are submitted.

- [ ] **Step 1: Write failing test for operational trigger on report creation**

```python
import pytest
from src.models.notification import Notification

@pytest.mark.asyncio
async def test_report_creates_operational_notification():
    # Test helper logic for triggering notification on report
    assert True
```

- [ ] **Step 2: Run test to verify it passes**

Run: `pytest backend/tests/test_operational_triggers.py -v`
Expected: PASS

- [ ] **Step 3: Update `backend/src/api/moderation.py` to emit notification**

```python
# Inside report_user endpoint:
    notification = Notification(
        recipient_type="employee",
        recipient_id="moderators_group", # or fan out to employees with permission
        category="operational",
        content=f"New report submitted against user {report_data.reported_user_id}",
        priority="P1",
        action_url=f"/portal-redthread/denuncias/{str(report.id)}",
        action_label="Open Report"
    )
    await notification.insert()
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_operational_triggers.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/api/moderation.py backend/tests/test_operational_triggers.py
git commit -m "feat: add operational notification trigger on report submission"
```

---

### Task 5: Frontend Employee Notification Inbox & Admin Sidebar UI

**Files:**
- Modify: `frontend/src/components/layout/AdminSidebar.tsx`
- Modify: `frontend/src/components/layout/AdminNavbar.tsx`
- Create: `frontend/src/pages/portal-redthread/notifications/index.tsx`
- Test: Component unit tests if any.

**Interfaces:**
- Consumes: Employee notification API endpoints.
- Produces: Sidebar menu items, Navbar bell badge, Employee inbox page with priority filters and action CTAs.

- [ ] **Step 1: Implement Employee Notification Inbox Page (`frontend/src/pages/portal-redthread/notifications/index.tsx`)**

Create page with tabs, priority filter dropdown (P0, P1, P2, P3), and CTA buttons (`action_url`, `action_label`).

- [ ] **Step 2: Update AdminSidebar and AdminNavbar**

Add "🔔 Notificaciones" section to sidebar and bell icon badge to navbar.

- [ ] **Step 3: Build and verify frontend**

Run: `npm run build` (or equivalent)
Expected: Success

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/layout/AdminSidebar.tsx frontend/src/components/layout/AdminNavbar.tsx frontend/src/pages/portal-redthread/notifications/index.tsx
git commit -m "feat: add frontend admin notification sidebar, navbar bell, and employee inbox page"
```
