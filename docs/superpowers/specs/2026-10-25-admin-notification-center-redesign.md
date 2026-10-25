# Admin Notification Center & Employee Inbox Redesign Specification

## 1. Overview & Architecture
This document specifies the complete architectural redesign of the Admin Notification Center and Employee Inbox in RETH. It transitions the module from a simple consumption inbox into a robust, professional **Notification Management Center, Operational Communication Hub, and Campaign Engine**.

### Key Architecture Changes
- **Dual Domain Sidebar**: Separation into **🔔 Usuarios** and **🛡️ Empleados**, each equipped with dedicated submenus (Dashboard, Crear Notificación, Campañas/Alertas Operativas, Reglas Automáticas, Plantillas, Historial, Métricas).
- **Executive & Operational Dashboards**: KPI cards and real-time activity metrics.
- **Global "+ Nueva Notificación" Wizard**: Top-right primary action button opening a 5-step modal wizard (Recipients -> Category -> Audience -> Content & CTA -> Preview & Send/Schedule/Draft).
- **Pre-defined Templates & Categories**: Structured templates for product updates, security, onboarding, events, operational alerts, security incidents, and internal communications.

---

## 2. Sidebar & Navigation Structure

### 2.1 Usuarios Submenus
- **Dashboard**: Executive summary of user communications.
- **Crear Notificación**: Manual authoring tool.
- **Campañas**: Lifecycle management (drafts, scheduled, active, completed).
- **Audiencias**: Segment builder (module usage, profile completion, subscription tier, activity).
- **Plantillas**: Reusable communication templates.
- **Historial**: Comprehensive audit log.
- **Métricas**: CTR, delivery rates, conversion analytics.

### 2.2 Empleados Submenus
- **Dashboard**: Operational monitoring center.
- **Crear Notificación**: Internal communications authoring.
- **Alertas Operativas**: Automated event management (reports, tickets, assignments).
- **Reglas Automáticas**: NotificationRule configuration.
- **Plantillas**: Operational alert templates.
- **Historial**: Internal communications audit log.
- **Métricas**: Read times and response metrics.

---

## 3. Dashboard KPIs & Widgets
- **Sent Today (`enviadas_hoy`)**: Total sent with day-over-day variation.
- **Unread (`no_leidas`)**: Total pending items and percentage.
- **Active P0 (`alertas_p0`)**: Critical operational incidents and escalated cases (red badge).
- **Average CTR (`ctr_promedio`)**: Clicks divided by delivered messages.
- **Pending Actions (`acciones_pendientes`)**: Unreviewed reports, pending support tickets, escalated cases.

---

## 4. "+ Nueva Notificación" 5-Step Wizard Flow
1. **Recipient Selection**: Choose between `Usuarios` (App Users) and `Empleados` (Internal Staff).
2. **Category / Type**: Select from Announcement, Security, Onboarding, Operational, Event, Custom.
3. **Audience**: Target specific segments or rules.
4. **Content**: Title, Message, Priority (P0-P3), CTA URL & Label, Icon.
5. **Preview & Action**: Review rendered notification and choose Send Now, Schedule, or Save Draft.

---

## 5. Verification Plan
- **Sidebar Navigation Tests**: Verify routing and accessibility for both domain sections.
- **Dashboard KPI Tests**: Verify metric aggregation endpoints for sent, unread, P0 alerts, CTR, and pending actions.
- **Wizard & Template Tests**: Verify 5-step wizard creation flow and template rendering.
