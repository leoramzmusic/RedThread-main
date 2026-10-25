# Admin Notification Center & Employee Inbox Design Specification

## 1. Overview & Architecture
This document specifies the design for the Admin Notification Center and Employee Inbox module in RETH, following the **Shared Notification Platform** architecture and **Approach C** (extending the existing `Campaign` model and notification core with recipient scoping).

### Key Objectives
- **Admin Management**: Centralized admin portal for authoring, targeting, scheduling, and analyzing notifications for both app users and employees.
- **Employee Inbox**: Dedicated operational and internal communications inbox at `/portal-redthread/notifications` with priority filtering (P0-P3) and direct actionable CTAs ("Open Report", "Open Ticket", "View Assignment").
- **F4a Compliance**: Integration of `seen_at`, `read_at`, priority policies P0-P3, and `NotificationDelivery` tracking without web push overhead in Phase 1.
- **Audience Segmentation**: Advanced filtering by RETH app modules, profile state, and engagement behavior.

---

## 2. Data Models & Extensions

### 2.1 Notification Model Extension (`backend/src/models/notification.py`)
Add recipient scoping and F4a delivery metadata to support both users and employees in a single collection:
- `recipient_type`: `"user" | "employee"` (default `"user"`)
- `recipient_id`: `str` (stores either `User.id` or `Employee.id`)
- `category`: `str` (`"announcement" | "alert" | "operational" | "security" | "maintenance"`)
- `seen_at`: `Optional[datetime]`
- `read_at`: `Optional[datetime]`
- `expires_at`: `Optional[datetime]`
- `priority`: `str` (`"P0" | "P1" | "P2" | "P3"`, default `"P2"`)
- `action_url`: `Optional[str]` (e.g., `/portal-redthread/denuncias/{id}`)
- `action_label`: `Optional[str]` (e.g., "Open Report")

### 2.2 Campaign Model Extension (`backend/src/models/campaign.py`)
Extend existing marketing `Campaign` model to serve as the unified campaign engine for in-app notifications:
- `target_recipient_type`: `"user" | "employee"`
- `category`: `str`
- `audience_filter`: `Dict` (modules, profile completion state, subscription tier, activity status)
- `content_i18n`: `Dict[str, Dict[str, str]]` (translations for title and body with template variables like `{first_name}`)
- `priority`: `"P0" | "P1" | "P2" | "P3"`
- `action_url` / `action_label`: Optional template CTAs
- `created_by`: `str` (Employee ID)
- `executed_by`: `Optional[str]` (Employee ID)
- `expires_at`: `Optional[datetime]`
- `stats`: Counters (`sent`, `delivered`, `seen`, `read`, `clicked`, `dismissed`)

### 2.3 NotificationRule & NotificationDelivery
- **NotificationRule**: Configurable rules mapping system events (e.g., `report_created`, `ticket_created`, `status_changed`) to employee roles/permissions and priorities.
- **NotificationDelivery**: Tracks delivery status (`pending`, `sent`, `delivered`, `failed`) per channel and recipient.

---

## 3. API Endpoints

### 3.1 Admin Endpoints (`/api/admin/notifications/...`)
- `GET /campaigns`: List campaigns with pagination and status filters.
- `POST /campaigns`: Create a new campaign (user or employee target).
- `POST /campaigns/{id}/test`: Send test notification to current admin/employee.
- `POST /campaigns/{id}/execute`: Trigger immediate fan-out or schedule.
- `GET /metrics`: Aggregate campaign performance and delivery stats.

### 3.2 Employee Endpoints (`/api/employee/notifications/...`)
- `GET /inbox`: Fetch employee notifications with filters (`is_read`, `priority`, `category`).
- `POST /inbox/{id}/seen`: Mark notification as seen (`seen_at`).
- `POST /inbox/{id}/read`: Mark notification as read (`read_at`).
- `POST /inbox/{id}/archive`: Archive notification.
- `POST /inbox/{id}/snooze`: Snooze notification until timestamp.

---

## 4. UI & Frontend Integration

### 4.1 Admin Sidebar & Navigation
- **AdminSidebar.tsx**: New section "🔔 Notificaciones" containing:
  - Centro (Monitor global)
  - Audiencias (Segmentos guardados)
  - Usuarios (Compositor e historial)
  - Empleados (Compositor y alertas operativas)
  - Seguridad (Plantillas y reglas de incidentes)
  - Métricas (Estadísticas y reportes)
- **AdminNavbar.tsx**: Global notification bell icon with real-time unread badge linking to `/portal-redthread/notifications`.

### 4.2 Employee Notification Inbox (`/portal-redthread/notifications`)
- Reuses shared `NotificationPanel` and `NotificationItem`.
- **Priority Filtering**: Filter by P0 (Critical/Emergency), P1 (High/Urgent), P2 (Normal), P3 (Low/Info).
- **Actionable CTAs**: Direct buttons rendered inside notification cards ("Open Report", "Open Ticket", "View Assignment") to eliminate navigation friction.
- **Tabs**: All, Operational Alerts, Internal Comms, Unread.

---

## 5. Verification Plan
- **Backend Unit Tests**: Verify campaign creation, audience resolution, recipient scoping, and F4a mark-as-read/seen endpoints.
- **Operational Trigger Tests**: Verify automatic notification fan-out when a report is created or ticket status changes.
- **Frontend Verification**: Test Admin Sidebar navigation, Navbar notification bell badge, and Employee Inbox priority filtering and CTA execution.
