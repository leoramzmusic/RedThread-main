# RedThread — Master Backlog & Sprint Plan

> **Project Manager:** Scrum Master (AI)
> **Team:** Solo Developer
> **Date:** 2026-09-14
> **Sprint Duration:** 2 weeks
> **Planning Horizon:** 22 sprints (11 months)
> **Velocity Estimate:** 25–30 story points per sprint (solo)
>
> **CARE items** (BE-005, AD-009, AD-015, TEST-008) follow the phased roadmap in
> [`CARE_ROADMAP.md`](./CARE_ROADMAP.md) — phases F0–F6 with acceptance criteria.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Backlog by Portal](#2-backlog-by-portal)
   - 2.1 [User Portal (UX/UI + Features)](#21-user-portal)
   - 2.2 [Admin Portal (Enhancements)](#22-admin-portal)
   - 2.3 [Company Portal (New Section)](#23-company-portal)
   - 2.4 [Backend & API](#24-backend--api)
   - 2.5 [Security Audit](#25-security-audit)
   - 2.6 [Database](#26-database)
   - 2.7 [Infrastructure (Docker/K8s)](#27-infrastructure)
   - 2.8 [Mobile (React Native)](#28-mobile-react-native)
   - 2.9 [Testing & QA](#29-testing--qa)
   - 2.10 [Automation & CI/CD](#210-automation--cicd)
   - 2.11 [Performance & Scalability](#211-performance--scalability)
   - 2.12 [Brand & Identity](#212-brand--identity)
3. [Sprint Plan](#3-sprint-plan)
4. [Automation & QA Recommendations](#4-automation--qa-recommendations)
5. [Risk Register](#5-risk-register)
6. [Definition of Done](#6-definition-of-done)

---

## 1. Executive Summary

RedThread is a social matching app (dating/friendship/gaming) built with Next.js 16 + FastAPI + MongoDB + React Native. The project requires:

- **Complete Liquid Glass UI overhaul** across all User Portal pages
- **Admin Portal enhancements** with new features
- **Company Portal** as a new section within Admin
- **Full React Native mobile app** (currently scaffolded only)
- **Comprehensive security audit** (14+ pending findings)
- **Database optimization** (indexes, migrations, schema improvements)
- **Infrastructure hardening** (Docker, K8s, secrets management)
- **Full test suite** (unit, integration, E2E)

**Current State:**
- Frontend: 20+ pages, dual MUI/Bootstrap, Liquid Glass design documented but not fully implemented
- Backend: 50+ API endpoints, CARE matching engine (Phase 1), hybrid monolith + microservices
- Mobile: 3 files (API client + auth slice) — essentially unbuilt
- Admin: Extensive (users, employees, finance, campaigns, moderation, branding)
- Security: 5 critical fixed, 9 high + 10 medium + 5 low pending

---

## 2. Backlog by Portal

### Legend

| Field | Values |
|-------|--------|
| Priority | **P0** = Blocking / Critical → **P1** = High → **P2** = Medium → **P3** = Low |
| Status | To Do → In Progress → Review → Done |
| Effort | Story Points (1–21, Fibonacci) |
| Sprint Target | Sprint number when work should start |

---

### 2.1 User Portal

#### Liquid Glass Foundation (P0)

| ID | Title | Description | Acceptance Criteria | Dependencies | Effort | Sprint |
|----|-------|-------------|---------------------|--------------|--------|--------|
| LG-001 | MUI Theme with Liquid Glass tokens | Create MUI 6 `createTheme` mapping DNA tokens to CSS vars in `:root` | palette.primary=#2563EB, error=#E63946; Poppins/Inter typography; borderRadius=20; dark mode #1A1B1E; all tokens as CSS vars | None | 8 | S1 |
| LG-002 | Global CSS design tokens | Extract all tokens from `design-dna.json` into CSS custom properties | Spacing scale, color scale, glass recipes (blur, saturation, border), motion tokens, breakpoints all in CSS vars | None | 5 | S1 |
| LG-003 | ThemeContext overhaul | Rewrite ThemeContext to support Liquid Glass light/dark + performance degradation | Toggle works, persists to localStorage, detects prefers-reduced-motion and low-end hardware | LG-001 | 5 | S1 |
| LG-004 | Remove legacy design references | Remove Dancing Script font, pink gradient (#881337→#FB7185), all old brand artifacts | `grep` clean in frontend/src for Dancing Script, pink gradient; no old brand references | None | 3 | S1 |

#### Landing Page (P0)

| ID | Title | Description | Acceptance Criteria | Dependencies | Effort | Sprint |
|----|-------|-------------|---------------------|--------------|--------|--------|
| LP-001 | Hero section redesign | Replace current hero with Liquid Glass: light orbs, word-by-word title animation, glass CTAs | Title animates blur→sharp per word; CTAs: primary #3B82F6, emotional accent #E63946; prefers-reduced-motion fallback | LG-001, LG-004 | 8 | S2 |
| LP-002 | Floating glass navigation | Sticky pill navbar with backdrop-filter blur(24), logo SVG, segmented lang selector | Glass blur 24 + saturate 170%; aria-pressed on lang toggle; focus ring 2px blue; mobile collapse ≤900px | LG-001 | 8 | S2 |
| LP-003 | Feature cards with morphing | 4 glass cards (Smart Match, Chat, Radar, Multi-intentions) with hover morphing + sheen | Recipe: transparency + blur 20 + border + highlight + radius 28; hover translateY(-6px) + morph + sheen; IntersectionObserver stagger | LG-001 | 8 | S3 |
| LP-004 | CTA band + glass footer | Large glass panel with embedded orbs, animated thread SVG, CTA button; footer pill | CTA uses #E63946→#B4232C; thread SVG animated; footer glass-strong; AA contrast on real glass | LG-001 | 5 | S3 |
| LP-005 | i18n toggle (ES/EN) | Segmented language toggle that actually switches react-i18next | Toggle persists choice, reflects across all landing text, accessible | LG-002 | 3 | S2 |

#### Core Pages Redesign (P1)

| ID | Title | Description | Acceptance Criteria | Dependencies | Effort | Sprint |
|----|-------|-------------|---------------------|--------------|--------|--------|
| UI-010 | Home page Liquid Glass | Redesign `/home` with glass cards, animated feed, glass bottom nav | All surfaces use glass recipe; bottom nav floating pill; content cards with stagger reveal | LG-001 | 8 | S4 |
| UI-011 | Discover page redesign | Redesign `/discover` with glass profile cards, compatibility meter, mode selector | Glass cards with photo + info overlay; compatibility arc animation; swipe gestures work; mode selector glass segmented | LG-001 | 13 | S4 |
| UI-012 | Chat page redesign | Redesign `/chat` with glass conversation list, message bubbles, typing indicators | Glass list items; message bubbles glass-styled; online status indicators; responsive layout | LG-001 | 8 | S5 |
| UI-013 | Profile page redesign | Redesign `/profile` with glass card layout, edit modes, media gallery | Glass profile card with avatar frame; edit sections with glass inputs; photo gallery with lightbox | LG-001 | 8 | S5 |
| UI-014 | Matches/Likes/Visits redesign | Redesign `/matches`, `/likes`, `/visits` with glass card grids | Consistent glass card pattern; match animations; like/visit history with timestamps | LG-001 | 5 | S5 |
| UI-015 | Radar page redesign | Redesign `/radar` with glass map overlay, user cards | Leaflet map with glass overlay cards; user popups on markers; glass filter controls | LG-001 | 8 | S6 |
| UI-016 | Events page redesign | Redesign `/events` with glass event cards, RSVP | Glass event cards with date badges; RSVP glass button; event detail modal | LG-001 | 5 | S6 |
| UI-017 | Friends page redesign | Redesign `/friends` with glass friend list, search, requests | Glass list items; friend request cards; search with debounce; online status | LG-001 | 5 | S6 |
| UI-018 | Roulette page redesign | Redesign `/roulette` with glass video chat UI | Glass overlay controls; camera feed with glass frame; matching animation | LG-001 | 8 | S7 |
| UI-019 | Settings page redesign | Redesign `/settings` with glass sections, toggles, forms | Glass section cards; toggle switches glass-styled; form inputs with glass focus states | LG-001 | 5 | S7 |
| UI-020 | Subscription page redesign | Redesign `/suscripcion` with glass plan cards, pricing | Glass plan cards with tier badges; pricing with glass highlight; CTA buttons per tier | LG-001 | 5 | S7 |

#### Auth Pages Redesign (P1)

| ID | Title | Description | Acceptance Criteria | Dependencies | Effort | Sprint |
|----|-------|-------------|---------------------|--------------|--------|--------|
| UI-021 | Login page redesign | Glass login form with animated background | Glass form card; input fields with glass focus; error states; social login placeholders | LG-001 | 5 | S3 |
| UI-022 | Register page multi-step | Glass multi-step registration with progress indicator | Step indicators glass-styled; form validation with glass error states; animation between steps | LG-001 | 8 | S3 |
| UI-023 | Forgot/Reset password redesign | Glass forms for password recovery | Glass form cards; success/error states; consistent with login | LG-001 | 3 | S3 |

#### Utility Pages (P2)

| ID | Title | Description | Acceptance Criteria | Dependencies | Effort | Sprint |
|----|-------|-------------|---------------------|--------------|--------|--------|
| UI-024 | Help center redesign | Glass help cards, FAQ accordion, contact form | Glass cards; accordion with glass expand animation; contact form with glass inputs | LG-001 | 3 | S7 |
| UI-025 | Legal pages redesign | Glass styled legal docs (terms, privacy, etc.) | Glass content card; consistent typography; print-friendly | LG-001 | 2 | S7 |
| UI-026 | Error pages (404/500) redesign | Glass error pages with illustrations | Glass card with error illustration; helpful links; consistent branding | LG-001 | 2 | S7 |

#### Motion & Accessibility (P1)

| ID | Title | Description | Acceptance Criteria | Dependencies | Effort | Sprint |
|----|-------|-------------|---------------------|--------------|--------|--------|
| LG-005 | Motion token system | Tokenize motion in CSS vars (ease-liquid, ease-enter, durations 140/280/640ms) | CSS vars for all motion; reusable reveal-on-scroll, split-words helpers | LG-001 | 5 | S4 |
| LG-006 | Accessibility audit + fixes | Full axe audit on all redesigned pages | axe criticals = 0; contrast ≥ 4.5:1 on glass; semantic landmarks; aria-labels on controls | LG-001 | 8 | S8 |
| LG-007 | Performance degradation | Detect low-end devices, degrade glass to solid surfaces | hardwareConcurrency ≤ 2 → solid backgrounds; Lighthouse mobile ≥ 90 | LG-001 | 5 | S8 |
| LG-008 | Brand assets finalization | SVG thread-knot component, favicon, consistent branding | Reusable SVG component; no old brand references; favicon updated | LG-004 | 3 | S4 |

---

### 2.2 Admin Portal

| ID | Title | Description | Acceptance Criteria | Dependencies | Effort | Sprint |
|----|-------|-------------|---------------------|--------------|--------|--------|
| AD-001 | Admin Liquid Glass theme | Apply Liquid Glass to Admin Portal (distinct variant: darker, professional) | Admin-specific glass tokens; sidebar glass; content area glass surfaces; dark by default | LG-001 | 8 | S9 |
| AD-002 | Dashboard redesign | Redesign admin dashboard with glass metric cards, charts (Recharts) | Glass metric cards; chart containers glass-styled; real-time data; responsive grid | AD-001 | 8 | S9 |
| AD-003 | User management enhancement | Add bulk actions, advanced filters, export to CSV | Bulk suspend/activate/delete; multi-filter (tier, status, date range); CSV export | None | 8 | S10 |
| AD-004 | Verification workflow improvement | Streamlined identity verification review with OCR preview | Side-by-side document + OCR results; approve/reject with notes; batch processing | None | 8 | S10 |
| AD-005 | Moderation queue redesign | Glass-styled moderation with priority indicators | Glass queue cards; priority color coding; bulk moderation actions; filter by type/severity | AD-001 | 5 | S10 |
| AD-006 | Finance dashboard | Revenue charts, subscription metrics, Stripe integration status | Recharts revenue graphs; MRR/ARR; churn rate; Stripe connection status indicator | None | 8 | S11 |
| AD-007 | Campaign management | Create/edit/delete marketing campaigns with glass UI | Glass campaign cards; form with glass inputs; scheduling; A/B test support | AD-001 | 8 | S11 |
| AD-008 | Support ticket system | Ticket list, detail view, response form with internal notes | Glass ticket cards; status workflow (open→pending→resolved); internal notes; priority | AD-001 | 8 | S11 |
| AD-009 | Algorithm management UI | Visual interface for CARE engine weights and A/B tests → CARE_ROADMAP F5 (sliders α–ε, simulator, A/B) | Glass weight sliders; test creation form; results dashboard; rollback capability | AD-001 | 8 | S12 |
| AD-010 | Event management | Create/edit/delete events with glass UI | Glass event cards; date picker; location; capacity; RSVP tracking | AD-001 | 5 | S12 |
| AD-011 | System config enhancement | Feature flags, rate limits, system settings with glass UI | Glass toggle cards for feature flags; rate limit sliders; config validation | AD-001 | 5 | S12 |
| AD-012 | Employee management enhancement | Improved employee onboarding, performance tracking | Glass employee cards; onboarding wizard; performance metrics; contract management | AD-001 | 5 | S12 |
| AD-013 | Roles & permissions UI | Visual RBAC editor with permission matrix | Glass role cards; permission matrix grid; drag-drop permission assignment | AD-001 | 8 | S13 |
| AD-014 | Branding management (apariencia) | Enhanced branding tools with preview | Glass theme editor; live preview; logo/icon/banner upload with glass preview | AD-001 | 5 | S13 |
| AD-015 | Analytics deep-dive | Extended CARE analytics with cohort analysis → CARE_ROADMAP F4+F5 (migrated /admin/care-analytics) | Glass chart containers; cohort tables; funnel visualization; export | AD-001 | 8 | S13 |

---

### 2.3 Company Portal (New Section in Admin)

| ID | Title | Description | Acceptance Criteria | Dependencies | Effort | Sprint |
|----|-------|-------------|---------------------|--------------|--------|--------|
| CP-001 | Company Portal architecture | Define data models, routes, permissions for company portal | Company model (if separate from Employee); RBAC permissions; route structure; navigation | AD-001 | 8 | S14 |
| CP-002 | Company dashboard | Company-level metrics: employees, departments, activity | Glass dashboard cards; employee count; department breakdown; activity timeline | CP-001 | 8 | S14 |
| CP-003 | Employee directory | Company employee list with search, filters, profile cards | Glass employee cards; search by name/department/role; filter by status; profile detail | CP-001 | 5 | S15 |
| CP-004 | Department management | Create/edit departments, assign employees, org chart | Glass department cards; org chart visualization; drag-drop assignment | CP-001 | 8 | S15 |
| CP-005 | Leave & attendance | Leave requests, approval workflow, attendance tracking | Glass leave cards; request form; approval queue; calendar view | CP-001 | 8 | S15 |
| CP-006 | Company settings | Company profile, branding, notification preferences | Glass settings forms; company logo upload; notification toggles | CP-001 | 5 | S16 |
| CP-007 | Reports & exports | Company reports: headcount, turnover, department stats | Glass report cards; chart visualizations; PDF/CSV export | CP-001 | 5 | S16 |
| CP-008 | Integration management | Connect third-party tools (HR systems, calendars) | Glass integration cards; OAuth connection flow; status indicators | CP-001 | 8 | S16 |

---

### 2.4 Backend & API

| ID | Title | Description | Acceptance Criteria | Dependencies | Effort | Sprint |
|----|-------|-------------|---------------------|--------------|--------|--------|
| BE-001 | Stripe real integration | PaymentIntent + webhook `checkout.session.completed`, signature verification | Webhook endpoint verifies STRIPE_WEBHOOK_SECRET; subscription/boosts activated only after confirmation; error handling | None | 13 | S9 |
| BE-002 | Real SMS integration | Twilio (or equivalent) for phone OTP delivery | OTP sent via SMS in non-DEBUG; rate limit on resend; delivery status logging | None | 8 | S10 |
| BE-003 | Email service production | SMTP with TLS, email templates for welcome/reset/notifications | TLS enforced in prod; HTML templates; queue via Kafka; delivery logging | None | 5 | S10 |
| BE-004 | OAuth providers (Google, Facebook, Apple) | Implement real OAuth flows (currently 501 placeholders) | Google/Facebook/Apple sign-in working; token exchange; profile merge; account linking | None | 13 | S11 |
| BE-005 | CARE Engine Phase 2 | Enhanced matching: ML features, real-time signal processing → CARE_ROADMAP F1+F4+F6 | Feature engineering pipeline; model training; A/B test framework; latency < 200ms | None | 13 | S13 |
| BE-006 | API versioning | Introduce `/api/v1/` prefix with backward compatibility | v1 prefix on all endpoints; deprecation headers for old paths; migration guide | None | 5 | S14 |
| BE-007 | WebSocket real-time events | Real-time notifications, typing indicators, online status via WebSocket | Socket.io rooms; presence tracking; typing broadcasts; reconnection logic | None | 8 | S15 |
| BE-008 | Data export (GDPR) | User data export endpoint (JSON/CSV) for compliance | Export endpoint returns all user data; async for large datasets; rate limited | None | 5 | S16 |
| BE-009 | Data deletion (GDPR) | Account deletion with cascade cleanup | Soft delete → hard delete after 30 days; cascade to messages/matches/uploads; audit log | None | 5 | S16 |
| BE-010 | Notification system enhancement | Push notifications (FCM/APNs), in-app notification center | Push token registration; notification preferences; batch sending; delivery tracking | None | 8 | S17 |

---

### 2.5 Security Audit

#### Critical & High (from Security_Audit.md)

| ID | Title | Description | Acceptance Criteria | Dependencies | Effort | Sprint |
|----|-------|-------------|---------------------|--------------|--------|--------|
| SEC-001 | A1: Enforce SECRET_KEY from env | Fail fast if SECRET_KEY is default; inject via secrets manager | App crashes on startup with default key; ECS/AKS/K8s configs updated | None | 3 | S9 |
| SEC-002 | A2: Remove versioned credentials | Delete CREDENTIALS.txt, TEST_CREDENTIALS.md from repo and history | `git ls-files` clean; BFG filter-repo if pushed; .env.example only | None | 2 | S9 |
| SEC-003 | A3: Hash OTP + real SMS | Hash phone_otp in DB; implement real SMS; block re-send until expiry | OTP stored as hash; Twilio integration; 10min expiry enforced | BE-002 | 8 | S10 |
| SEC-004 | A4: Upload validation + access control | Validate MIME (magic bytes) + size; serve identity docs via authenticated endpoint; encrypt at rest | Upload validates real content type; identity docs not in /static; encrypted storage | None | 8 | S10 |
| SEC-005 | A5: Admin portal auth check | Uncomment/fix admin_portal.py auth check; require employee + permission | All admin routes require active employee with permission | None | 3 | S9 |
| SEC-006 | A7: Rate limiting enforcement | Apply rate limiting on login, register, verify-phone, OAuth | Redis-backed rate limits active; 429 responses; configurable per endpoint | None | 5 | S9 |
| SEC-007 | A8: Restrict CORS | Explicit methods/headers; strict origin allowlist per environment | No wildcard methods/headers; origins from env config; credentials maintained | None | 3 | S9 |
| SEC-008 | A9: Authenticate infrastructure services | MongoDB/Redis/Kafka auth; TLS in transit; K8s network policies | Services require auth; TLS configured; network policies deny-all-default | None | 8 | S12 |
| SEC-009 | M4: JWT iss/aud claims | Add issuer and audience to JWT tokens | Tokens include iss/aud; verification checks both | SEC-001 | 3 | S10 |
| SEC-010 | M5: Admin 2FA | Enforce 2FA for admin accounts (TOTP) | 2FA setup flow; TOTP QR code; verification on login; recovery codes | None | 8 | S11 |
| SEC-011 | M7: Safe defaults | DEBUG=False default; disable /docs in prod; secure error responses | App runs secure by default; no stack traces to client; generic error messages | None | 3 | S9 |
| SEC-012 | M8: Password policies | Enforce complexity (uppercase, lowercase, number, special); check against breach list | Password validation on register/change; HaveIBeenPwned k-anonymity check | None | 5 | S10 |
| SEC-013 | M9: Session enforcement | Verify MAX_ACTIVE_SESSIONS_PER_USER is enforced; revoke oldest on overflow | Session limit enforced; old sessions revoked; session list UI accurate | None | 3 | S10 |
| SEC-014 | M10: Email production config | Disable MAIL_CONSOLE_LOG in prod; configure real SMTP | SMTP with TLS in prod; email sending verified | BE-003 | 2 | S10 |

#### Medium & Low

| ID | Title | Description | Acceptance Criteria | Dependencies | Effort | Sprint |
|----|-------|-------------|---------------------|--------------|--------|--------|
| SEC-015 | M1: Replace print with logging | Replace all `print()` with proper `logging` at correct levels | No `print()` in production code; structured logging; log levels correct | None | 5 | S9 |
| SEC-016 | M2: Generic error responses | Log details server-side; return generic messages to client | No internal error details exposed; detailed logs preserved | None | 3 | S9 |
| SEC-017 | M3: Spotify redirect validation | Validate redirect_uri against allowlist | Only configured URIs accepted; configurable per environment | None | 2 | S11 |
| SEC-018 | M6: Encrypt identity documents | Encrypt uploaded identity documents at rest | Documents encrypted in storage; decrypted on authenticated access | SEC-004 | 5 | S11 |
| SEC-019 | B1: SMTP TLS default | Enforce TLS for SMTP connections | TLS required in non-DEBUG; connection fails without TLS | BE-003 | 1 | S10 |
| SEC-020 | B2: Remove version headers | Strip server version info from responses | No X-Powered-By or version headers; generic server identity | None | 1 | S9 |
| SEC-021 | B3: Restrict bind address | Bind to internal network only in production | Uvicorn binds to 127.0.0.1 or internal IP in prod; configurable | None | 1 | S9 |

---

### 2.6 Database

| ID | Title | Description | Acceptance Criteria | Dependencies | Effort | Sprint |
|----|-------|-------------|---------------------|--------------|--------|--------|
| DB-001 | Fix broken index script | Fix `backend/create_indexes.py` (broken import `src.db`) | Script runs successfully; creates all required indexes | None | 2 | S9 |
| DB-002 | 2dsphere indexes | Add geo indexes for discovery/radar queries (P2 finding) | 2dsphere index on profiles.location; query plan shows index usage | None | 3 | S9 |
| DB-003 | Compound indexes for admin | Add compound indexes for admin search queries (P8 finding) | Indexes on admin_usuarios and admin_empleados search patterns | None | 3 | S9 |
| DB-004 | Dashboard aggregation indexes | Add indexes supporting admin dashboard aggregations (P3 finding) | Aggregation queries use indexes; explain shows IXSCAN | None | 3 | S9 |
| DB-005 | Schema migration: OTP hashing | Migrate phone_otp → phone_otp_hash with rotation script | Migration runs cleanly; old field removed; data preserved | SEC-003 | 5 | S10 |
| DB-006 | Schema migration: Identity encryption | Add encryption metadata fields for identity documents | Migration adds encrypted fields; existing docs migrated | SEC-018 | 5 | S11 |
| DB-007 | TTL cache cleanup | Fix inconsistent TTLs in Redis service (P5 finding) | All cache entries have appropriate TTLs; no stale data | None | 3 | S10 |
| DB-008 | Connection pooling optimization | Review and optimize Motor/MongoDB connection settings | Connection pool size appropriate; monitoring in place | None | 3 | S12 |
| DB-009 | Audit log indexes | Add indexes for audit log queries | Fast queries on audit logs by date, employee, action | None | 2 | S12 |
| DB-010 | Redis session optimization | Optimize session storage pattern, add cleanup cron | Session cleanup runs; memory usage monitored; expired sessions purged | None | 3 | S12 |

---

### 2.7 Infrastructure

| ID | Title | Description | Acceptance Criteria | Dependencies | Effort | Sprint |
|----|-------|-------------|---------------------|--------------|--------|--------|
| INF-001 | Docker Compose hardening | Add auth to all services; health checks; resource limits | All services have auth configured; health checks pass; memory/CPU limits set | SEC-008 | 5 | S12 |
| INF-002 | K8s Network Policies | Implement deny-all-default network policies | Pods can only communicate on required ports; egress restricted | SEC-008 | 5 | S12 |
| INF-003 | K8s Secrets management | Integrate with cloud secrets manager (Azure Key Vault / AWS Secrets Manager) | No secrets in YAML; all sensitive config from external store | SEC-001 | 5 | S13 |
| INF-004 | Staging environment | Full staging environment mirroring production | Staging cluster operational; CI/CD deploys to staging automatically | INF-002 | 8 | S13 |
| INF-005 | Monitoring & alerting | Prometheus + Grafana dashboards, alerting rules | Dashboard shows key metrics; alerts for error rate, latency, disk | None | 8 | S14 |
| INF-006 | Log aggregation | Loki + Grafana for centralized logging | All services ship logs to Loki; searchable in Grafana | None | 5 | S14 |
| INF-007 | OpenTelemetry tracing | Distributed tracing across services | Traces visible in Jaeger/Grafana; correlation IDs propagated | None | 8 | S15 |
| INF-008 | Blue-green deployment | Zero-downtime deployment strategy | New version deploys alongside old; traffic shifts; rollback instant | INF-004 | 8 | S16 |
| INF-009 | Backup & disaster recovery | MongoDB backup strategy; restore procedures | Automated backups; tested restore; RTO/RPO defined | None | 5 | S14 |
| INF-010 | Performance testing | k6/Locust load testing scripts | Scripts test critical paths; baseline metrics documented | None | 5 | S16 |

---

### 2.8 Mobile (React Native)

#### Foundation (P0)

| ID | Title | Description | Acceptance Criteria | Dependencies | Effort | Sprint |
|----|-------|-------------|---------------------|--------------|--------|--------|
| MOB-001 | Project setup & navigation | Complete React Native setup, navigation structure, theme | Navigation tree (auth + main tabs + stacks); Liquid Glass theme adapted; TypeScript config | None | 8 | S8 |
| MOB-002 | Auth flow | Login, register, forgot password, OTP verification screens | All auth screens functional; token storage (encrypted); biometric login option | MOB-001 | 8 | S8 |
| MOB-003 | API client completion | Expand api.js with all endpoints; error handling; token refresh | All API methods; interceptors for auth/refresh; retry logic; offline detection | MOB-001 | 5 | S8 |

#### Core Features (P1)

| ID | Title | Description | Acceptance Criteria | Dependencies | Effort | Sprint |
|----|-------|-------------|---------------------|--------------|--------|--------|
| MOB-004 | Home feed | Home screen with glass cards, pull-to-refresh, infinite scroll | Feed loads; glass card design; refresh gesture; pagination | MOB-001, MOB-003 | 8 | S9 |
| MOB-005 | Discover/swipe | Swipeable profile cards with compatibility info | Cards swipe left/right/up; glass overlay; compatibility meter; animation | MOB-001, MOB-003 | 13 | S9 |
| MOB-006 | Chat | Real-time chat with message bubbles, typing indicators | Messages send/receive; glass bubbles; typing indicator; image sharing; read receipts | MOB-001, MOB-003 | 13 | S10 |
| MOB-007 | Profile | Profile view/edit with photo management, identity verification | Glass profile card; edit sections; photo upload/crop; verification flow | MOB-001, MOB-003 | 8 | S10 |
| MOB-008 | Matches/likes/visits | Match list, who liked you, profile visits | Glass cards for each; match animations; like/visit history | MOB-001, MOB-003 | 5 | S10 |
| MOB-009 | Radar | Map-based discovery with user markers | React Native Maps; user markers; glass popup cards; location permission | MOB-001, MOB-003 | 8 | S11 |
| MOB-010 | Settings | App settings, notification prefs, privacy, account | Glass settings sections; toggles; dark mode switch; language selector | MOB-001 | 5 | S11 |
| MOB-011 | Notifications | Push notification handling, in-app notification list | FCM/APNs integration; notification permissions; notification center; deep linking | MOB-001 | 5 | S11 |
| MOB-012 | Friends | Friends list, requests, search | Glass friend cards; add/remove; request accept/reject; search | MOB-001, MOB-003 | 5 | S11 |
| MOB-013 | Events | Event listing, RSVP, calendar integration | Glass event cards; RSVP; calendar export; location maps | MOB-001, MOB-003 | 5 | S12 |

#### Premium Features (P2)

| ID | Title | Description | Acceptance Criteria | Dependencies | Effort | Sprint |
|----|-------|-------------|---------------------|--------------|--------|--------|
| MOB-014 | Subscription/purchase | In-app purchase (IAP) for premium plans | Apple IAP + Google Play Billing; receipt validation; tier activation | BE-001 | 8 | S12 |
| MOB-015 | Boost purchase | Purchase and activate boosts | Boost purchase flow; activation animation; usage tracking | BE-001 | 5 | S12 |
| MOB-016 | Spotify integration | Connect Spotify, view music, icebreakers | OAuth flow; music display; icebreaker suggestions from playlists | MOB-001 | 5 | S13 |

#### Polish (P2)

| ID | Title | Description | Acceptance Criteria | Dependencies | Effort | Sprint |
|----|-------|-------------|---------------------|--------------|--------|--------|
| MOB-017 | Animations & transitions | Smooth page transitions, micro-interactions | Reanimated 3 animations; shared element transitions; gesture-based | MOB-001 | 8 | S13 |
| MOB-018 | Offline support | Cache key data for offline viewing | SQLite cache; offline indicator; queued actions; sync on reconnect | MOB-003 | 8 | S14 |
| MOB-019 | Haptic feedback | Tactile feedback for key interactions | Haptics on swipe, match, message send; configurable intensity | MOB-001 | 3 | S13 |
| MOB-020 | Biometric auth | Face ID / fingerprint login | Biometric enrolled; fallback to PIN; secure keychain storage | MOB-002 | 5 | S13 |
| MOB-021 | Accessibility | Screen reader support, dynamic type, color contrast | VoiceOver/TalkBack labels; dynamic font sizes; WCAG AA contrast | MOB-001 | 8 | S14 |
| MOB-022 | Responsive design | Tablet/foldable support; landscape mode | Layout adapts to tablet; foldable detection; landscape not broken | MOB-001 | 5 | S14 |
| MOB-023 | Performance optimization | 60fps, fast startup, memory optimization | Startup < 3s; no jank; memory < 150MB; image caching; FlatList optimization | MOB-001 | 5 | S15 |

---

### 2.9 Testing & QA

#### Backend Tests

| ID | Title | Description | Acceptance Criteria | Dependencies | Effort | Sprint |
|----|-------|-------------|---------------------|--------------|--------|--------|
| TEST-001 | Auth unit tests | Tests for register, login, OTP, refresh, password reset | All auth flows tested; edge cases covered; mocking external services | None | 5 | S1 |
| TEST-002 | Profile unit tests | Tests for profile CRUD, search, location | Profile operations tested; geo queries validated; privacy toggles tested | None | 5 | S2 |
| TEST-003 | Discovery unit tests | Tests for CARE engine scoring, queue, swipe | Compatibility scoring; ranking; diversity; A/B test assignment | None | 8 | S3 |
| TEST-004 | Chat unit tests | Tests for conversations, messages, real-time | Message CRUD; conversation creation; typing indicators; read receipts | None | 5 | S4 |
| TEST-005 | Admin unit tests | Tests for all admin endpoints, RBAC, employee management | Permission checks; CRUD operations; audit logging | None | 8 | S5 |
| TEST-006 | Payment unit tests | Tests for subscription, Stripe webhook, tier management | Webhook verification; subscription lifecycle; edge cases | BE-001 | 5 | S10 |
| TEST-007 | Integration tests | End-to-end API tests with test database | Full flows tested against MongoDB; Kafka event verification | None | 13 | S6 |
| TEST-008 | CARE engine tests | Comprehensive scoring, ranking, feedback tests → CARE_ROADMAP F0–F6 acceptance tests | All CARE phases tested; edge cases; performance benchmarks | TEST-003 | 8 | S7 |

#### Frontend Tests

| ID | Title | Description | Acceptance Criteria | Dependencies | Effort | Sprint |
|----|-------|-------------|---------------------|--------------|--------|--------|
| TEST-009 | Component unit tests | Test all major components in isolation | Render tests; interaction tests; accessibility tests | None | 13 | S4 |
| TEST-010 | Page integration tests | Test page-level flows (auth, discovery, chat) | Navigation works; data loads; error states; loading states | None | 8 | S6 |
| TEST-011 | Redux store tests | Test slices, thunks, selectors | State transitions; async actions; error handling | None | 5 | S5 |
| TEST-012 | E2E tests (Playwright) | Critical user journeys end-to-end | Register → Discover → Match → Chat flow; payment flow | None | 13 | S8 |

#### Mobile Tests

| ID | Title | Description | Acceptance Criteria | Dependencies | Effort | Sprint |
|----|-------|-------------|---------------------|--------------|--------|--------|
| TEST-013 | Mobile component tests | Test React Native components | Render tests; interaction tests; platform-specific behavior | MOB-001 | 8 | S11 |
| TEST-014 | Mobile E2E tests | Detox tests for critical mobile flows | Auth flow; swipe flow; chat flow; purchase flow | MOB-001 | 13 | S15 |

---

### 2.10 Automation & CI/CD

| ID | Title | Description | Acceptance Criteria | Dependencies | Effort | Sprint |
|----|-------|-------------|---------------------|--------------|--------|--------|
| CI-001 | Pre-commit hooks | Husky + lint-staged: lint, format, type-check on commit | Hooks run on every commit; block on errors; fast execution | None | 3 | S1 |
| CI-002 | GitHub Actions CI pipeline | Lint + test + type-check on every PR | All checks pass; status checks required for merge; < 10min | None | 5 | S2 |
| CI-003 | Docker build optimization | Multi-stage builds, layer caching, size reduction | Image size < 200MB (backend), < 100MB (frontend); build cache working | None | 5 | S3 |
| CI-004 | Automated security scanning | Bandit (Python) + ESLint security + Trivy (Docker) in CI | Scans run on PR; critical findings block merge; reports generated | None | 5 | S4 |
| CI-005 | Code coverage reporting | Coverage thresholds enforced in CI; reports to Codecov | Backend ≥ 80%, Frontend ≥ 70%; PR comments with coverage diff | TEST-001 | 5 | S5 |
| CI-006 | Mobile CI pipeline | React Native build + test in CI | iOS + Android builds; detox tests; artifact upload | MOB-001 | 8 | S9 |
| CI-007 | Staging auto-deploy | Auto-deploy to staging on merge to develop | Staging updated; smoke tests run; notification on failure | INF-004 | 5 | S14 |
| CI-008 | Release automation | Semantic release + changelog + version bump | Conventional commits; auto version bump; changelog generated; GitHub release | None | 5 | S8 |
| CI-009 | Database migrations CI | Automated migration testing in CI | Migrations run against test DB; rollback tested; no data loss | DB-005 | 5 | S10 |
| CI-010 | Performance budgets | Bundle size limits; Lighthouse CI; load test thresholds | Bundle < 500KB gzipped; Lighthouse ≥ 90; p95 latency < 500ms | None | 5 | S16 |

---

### 2.11 Performance & Scalability

> **Added:** 2026-09-14 | **Priority:** P1 | **Owner:** Solo Developer

| ID | Title | Description | Acceptance Criteria | Dependencies | Effort | Sprint |
|----|-------|-------------|---------------------|--------------|--------|--------|
| PERF-001 | Pool de Conexiones MongoDB | Configurar parámetros clave en MongoClient: maxPoolSize por entorno (local: 10–20, serverless: 1–5), minPoolSize=0, maxIdleTimeMS=15000–30000. Crear módulo en portal admin para seleccionar entorno (Local, Docker, Serverless) y aplicar configuración automáticamente. Monitorear métricas de conexiones activas y errores. | Pool configurado por entorno; módulo admin funcional; métricas visibles en dashboard; tests de conexión pasan | DB-008 | 5 | S12 |
| PERF-002 | Caps de Caché | Definir límites de caché por tipo de dato: Matches/mensajes TTL corto (30–60s), catálogos/configuraciones TTL largo (24h). Implementar Redis/Memcached como capa intermedia. Agregar panel en portal admin para: ajustar TTL por colección, limpiar caché manualmente, ver estadísticas de uso y aciertos/fallos. | TTLs configurables por colección; panel admin funcional; caché hit rate visible; invalidación selectiva funciona | DB-007 | 8 | S10 |
| PERF-003 | Pruebas de Carga | Seleccionar herramienta (k6 recomendado por integración CI/CD). Diseñar escenarios: 100–500 usuarios concurrentes en login/chat, escalado de matches/visitas, stress test en consultas críticas. Integrar resultados en portal admin: gráficas de latencia/throughput/errores, alertas cuando se superen umbrales. | Scripts k6 para escenarios críticos; resultados en dashboard admin; alertas configurables; baseline documentado | INF-010 | 8 | S16 |

**Relación con historias existentes:**
- PERF-001 extiende DB-008 (Connection pooling optimization)
- PERF-002 extiende DB-007 (TTL cache cleanup)
- PERF-003 extiende INF-010 (Performance testing)

---

### 2.12 Brand & Identity

> **Added:** 2026-09-17 | **Priority:** P2 | **Owner:** Solo Developer

| ID | Title | Description | Acceptance Criteria | Dependencies | Effort | Sprint |
|----|-------|-------------|---------------------|--------------|--------|--------|
| BRAND-001 | Mascota kawaii: gato con bola de estambre | Crear una mascota estilo kawaii: gato blanco con expresiones adorables que juega con una bola de estambre. La bola de estambre cambia de color según el módulo/ctx: rojo (#E63946) por defecto, azul (#3B82F6) para acentos, dorado (#D4AF37) para premium, gris (#9E9E9E) para free. Usar como indicador de carga (loading spinner alternativo), estado vacío (empty state), y onboarding. Estilo similar a Duolingo owl — expresivo, memorable, con personalidad. | SVG animado o Lottie; variaciones de color por módulo; integrado como componente React; funciona como loading indicator; respeta prefers-reduced-motion; testimonios de usuarios positivos | LG-004 | 13 | S4 |
| BRAND-002 | Guía de voz y tono de marca | Definir personalidad de la mascota: nombre, voz, frases típicas, emojis asociados. Documentar uso en diferentes contextos (carga, error, éxito, onboarding). | Documento de guidelines; mascota tiene nombre y personalidad consistente; frases documentadas para cada estado | BRAND-001 | 3 | S4 |

---

## 3. Sprint Plan

### Sprint 1 (Weeks 1–2) — Foundation
**Theme:** Liquid Glass tokens + Security quick wins + Testing infrastructure
**Story Points: ~28**

| Task | Points | Portal |
|------|--------|--------|
| LG-001: MUI Theme with Liquid Glass tokens | 8 | User |
| LG-002: Global CSS design tokens | 5 | User |
| LG-003: ThemeContext overhaul | 5 | User |
| LG-004: Remove legacy design references | 3 | User |
| SEC-001: Enforce SECRET_KEY from env | 3 | Security |
| SEC-011: Safe defaults (DEBUG=False) | 3 | Security |
| CI-001: Pre-commit hooks | 3 | Automation |
| TEST-001: Auth unit tests (start) | 5 → 3 | Testing |
| DB-001: Fix broken index script | 2 | Database |

**Deliverable:** Liquid Glass theme system operational; security quick wins deployed; pre-commit hooks active.

---

### Sprint 2 (Weeks 3–4) — Landing Page Core
**Theme:** Hero + Navigation + Auth pages
**Story Points: ~28**

| Task | Points | Portal |
|------|--------|--------|
| LP-001: Hero section redesign | 8 | User |
| LP-002: Floating glass navigation | 8 | User |
| LP-005: i18n toggle (ES/EN) | 3 | User |
| UI-021: Login page redesign | 5 | User |
| UI-022: Register page multi-step | 8 | User |
| DB-002: 2dsphere indexes | 3 | Database |
| CI-002: GitHub Actions CI pipeline | 5 | Automation |

**Deliverable:** Landing page live with Liquid Glass; auth pages redesigned; CI pipeline running.

---

### Sprint 3 (Weeks 5–6) — Landing Page Complete
**Theme:** Cards, CTA, Footer + Auth pages + Backend tests
**Story Points: ~27**

| Task | Points | Portal |
|------|--------|--------|
| LP-003: Feature cards with morphing | 8 | User |
| LP-004: CTA band + glass footer | 5 | User |
| UI-023: Forgot/Reset password redesign | 3 | User |
| TEST-001: Auth unit tests (complete) | 5 | Testing |
| TEST-002: Profile unit tests (start) | 5 | Testing |
| CI-003: Docker build optimization | 5 | Automation |
| DB-003: Compound indexes for admin | 3 | Database |
| DB-004: Dashboard aggregation indexes | 3 | Database |

**Deliverable:** Landing page complete; auth pages complete; backend test foundation laid.

---

### Sprint 4 (Weeks 7–8) — Core App Pages
**Theme:** Home + Discover redesign + Motion system + Brand mascot
**Story Points: ~43**

| Task | Points | Portal |
|------|--------|--------|
| UI-010: Home page Liquid Glass | 8 | User |
| UI-011: Discover page redesign | 13 | User |
| LG-005: Motion token system | 5 | User |
| LG-008: Brand assets finalization | 3 | User |
| BRAND-001: Mascota kawaii (gato + bola estambre) | 13 | Brand |
| TEST-002: Profile unit tests (complete) | 5 | Testing |
| CI-004: Automated security scanning | 5 | Automation |

**Deliverable:** Home and Discover pages live with Liquid Glass; motion system operational; mascot implemented.

---

### Sprint 5 (Weeks 9–10) — Chat + Profile + Matches
**Theme:** Communication pages + Redux tests
**Story Points: ~29**

| Task | Points | Portal |
|------|--------|--------|
| UI-012: Chat page redesign | 8 | User |
| UI-013: Profile page redesign | 8 | User |
| UI-014: Matches/Likes/Visits redesign | 5 | User |
| TEST-003: Discovery unit tests | 8 | Testing |
| TEST-011: Redux store tests | 5 | Testing |
| CI-005: Code coverage reporting | 5 | Automation |

**Deliverable:** Communication pages redesigned; discovery engine tested; coverage reporting live.

---

### Sprint 6 (Weeks 11–12) — Utility Pages + Integration Tests
**Theme:** Radar, Events, Friends + Integration tests
**Story Points: ~28**

| Task | Points | Portal |
|------|--------|--------|
| UI-015: Radar page redesign | 8 | User |
| UI-016: Events page redesign | 5 | User |
| UI-017: Friends page redesign | 5 | User |
| TEST-004: Chat unit tests | 5 | Testing |
| TEST-007: Integration tests | 13 | Testing |
| DB-007: TTL cache cleanup | 3 | Database |

**Deliverable:** All core app pages redesigned; integration test suite operational.

---

### Sprint 7 (Weeks 13–14) — Remaining User Pages + CARE Tests
**Theme:** Roulette, Settings, Subscriptions + Help/Legal + CARE tests
**Story Points: ~25**

| Task | Points | Portal |
|------|--------|--------|
| UI-018: Roulette page redesign | 8 | User |
| UI-019: Settings page redesign | 5 | User |
| UI-020: Subscription page redesign | 5 | User |
| UI-024: Help center redesign | 3 | User |
| UI-025: Legal pages redesign | 2 | User |
| UI-026: Error pages redesign | 2 | User |
| TEST-008: CARE engine tests | 8 | Testing |

**Deliverable:** All User Portal pages redesigned; CARE engine fully tested.

---

### Sprint 8 (Weeks 15–16) — Accessibility + Performance + E2E + Mobile Setup
**Theme:** Polish User Portal + Start mobile
**Story Points: ~30**

| Task | Points | Portal |
|------|--------|--------|
| LG-006: Accessibility audit + fixes | 8 | User |
| LG-007: Performance degradation | 5 | User |
| TEST-005: Admin unit tests | 8 | Testing |
| TEST-010: Page integration tests | 8 | Testing |
| TEST-012: E2E tests (Playwright) | 13 → 5 | Testing |
| CI-008: Release automation | 5 | Automation |

**Deliverable:** User Portal accessibility verified; E2E critical paths covered; release automation live.

---

### Sprint 9 (Weeks 17–18) — Mobile Foundation + Admin Theme + Backend Payments
**Theme:** Mobile app scaffolding + Admin redesign start + Stripe
**Story Points: ~30**

| Task | Points | Portal |
|------|--------|--------|
| MOB-001: Project setup & navigation | 8 | Mobile |
| MOB-002: Auth flow | 8 | Mobile |
| MOB-003: API client completion | 5 | Mobile |
| AD-001: Admin Liquid Glass theme | 8 | Admin |
| BE-001: Stripe real integration | 13 → 5 | Backend |
| SEC-002: Remove versioned credentials | 2 | Security |
| SEC-005: Admin portal auth check | 3 | Security |
| SEC-006: Rate limiting enforcement | 5 | Security |
| SEC-007: Restrict CORS | 3 | Security |
| SEC-015: Replace print with logging | 5 | Security |
| SEC-016: Generic error responses | 3 | Security |
| SEC-020: Remove version headers | 1 | Security |
| SEC-021: Restrict bind address | 1 | Security |
| DB-001: Fix broken index script | 2 → 0 | Database (done S1) |

**Deliverable:** Mobile app running with auth; Admin portal Liquid Glass started; critical security fixes deployed.

---

### Sprint 10 (Weeks 19–20) — Mobile Core + Admin Management + SMS + Cache
**Theme:** Discover/Swipe mobile + Admin user/verification + SMS + Cache layer
**Story Points: ~39**

| Task | Points | Portal |
|------|--------|--------|
| MOB-004: Home feed | 8 | Mobile |
| MOB-005: Discover/swipe | 13 | Mobile |
| AD-003: User management enhancement | 8 | Admin |
| AD-004: Verification workflow | 8 | Admin |
| BE-002: Real SMS integration | 8 | Backend |
| BE-003: Email service production | 5 | Backend |
| SEC-003: Hash OTP + real SMS | 8 → 0 | Security (tied to BE-002) |
| SEC-009: JWT iss/aud claims | 3 | Security |
| SEC-012: Password policies | 5 | Security |
| SEC-013: Session enforcement | 3 | Security |
| SEC-014: Email production config | 2 | Security |
| DB-005: Schema migration: OTP hashing | 5 | Database |
| DB-007: TTL cache cleanup | 3 | Database |
| PERF-002: Caps de Caché (Redis/Memcached + admin panel) | 8 | Performance |

**Deliverable:** Mobile discover working; Admin user management enhanced; SMS + email in production; Cache layer operational.

---

### Sprint 11 (Weeks 21–22) — Mobile Chat + Admin Finance + OAuth
**Theme:** Chat mobile + Finance/Campaigns/Support + OAuth providers
**Story Points: ~30**

| Task | Points | Portal |
|------|--------|--------|
| MOB-006: Chat | 13 | Mobile |
| MOB-007: Profile | 8 | Mobile |
| MOB-008: Matches/likes/visits | 5 | Mobile |
| AD-006: Finance dashboard | 8 | Admin |
| AD-007: Campaign management | 8 | Admin |
| AD-008: Support ticket system | 8 → 0 | Admin (deferred) |
| BE-004: OAuth providers | 13 → 5 | Backend |
| SEC-010: Admin 2FA | 8 | Security |
| SEC-017: Spotify redirect validation | 2 | Security |
| SEC-018: Encrypt identity documents | 5 | Security |
| DB-006: Schema migration: Identity encryption | 5 | Database |

**Deliverable:** Mobile chat working; OAuth providers live; Admin finance dashboard operational.

---

### Sprint 12 (Weeks 23–24) — Mobile Radar + Admin Algorithms + Infra + Connection Pool
**Theme:** Radar mobile + Algorithm/Event management + Infrastructure hardening + MongoDB pool
**Story Points: ~35**

| Task | Points | Portal |
|------|--------|--------|
| MOB-009: Radar | 8 | Mobile |
| MOB-010: Settings | 5 | Mobile |
| MOB-011: Notifications | 5 | Mobile |
| MOB-012: Friends | 5 | Mobile |
| AD-009: Algorithm management UI | 8 | Admin |
| AD-010: Event management | 5 | Admin |
| AD-011: System config enhancement | 5 | Admin |
| AD-012: Employee management | 5 | Admin |
| SEC-008: Authenticate infrastructure | 8 | Security |
| INF-001: Docker Compose hardening | 5 | Infrastructure |
| INF-002: K8s Network Policies | 5 | Infrastructure |
| DB-008: Connection pooling | 3 | Database |
| DB-009: Audit log indexes | 2 | Database |
| DB-010: Redis session optimization | 3 | Database |
| PERF-001: Pool de Conexiones (MongoClient + admin module) | 5 | Performance |

**Deliverable:** Mobile app nearly feature-complete; Admin management pages complete; infrastructure hardened; MongoDB pool optimized.

---

### Sprint 13 (Weeks 25–26) — Mobile Polish + Admin RBAC + CARE Phase 2
**Theme:** Mobile animations + Company Portal prep + CARE engine
**Story Points: ~30**

| Task | Points | Portal |
|------|--------|--------|
| MOB-013: Events | 5 | Mobile |
| MOB-016: Spotify integration | 5 | Mobile |
| MOB-017: Animations & transitions | 8 | Mobile |
| MOB-019: Haptic feedback | 3 | Mobile |
| MOB-020: Biometric auth | 5 | Mobile |
| AD-013: Roles & permissions UI | 8 | Admin |
| AD-014: Branding management | 5 | Admin |
| AD-015: Analytics deep-dive | 8 | Admin |
| BE-005: CARE Engine Phase 2 | 13 → 5 | Backend |
| INF-003: K8s Secrets management | 5 | Infrastructure |
| INF-004: Staging environment | 8 | Infrastructure |

**Deliverable:** Mobile polished; Admin RBAC visual editor; CARE engine enhanced; staging environment live.

---

### Sprint 14 (Weeks 27–28) — Company Portal + Mobile Offline + Monitoring
**Theme:** Company Portal foundation + Mobile offline + Monitoring setup
**Story Points: ~30**

| Task | Points | Portal |
|------|--------|--------|
| CP-001: Company Portal architecture | 8 | Company |
| CP-002: Company dashboard | 8 | Company |
| MOB-014: Subscription/purchase | 8 | Mobile |
| MOB-015: Boost purchase | 5 | Mobile |
| MOB-018: Offline support | 8 | Mobile |
| MOB-021: Accessibility | 8 → 5 | Mobile |
| BE-006: API versioning | 5 | Backend |
| BE-008: Data export (GDPR) | 5 | Backend |
| BE-009: Data deletion (GDPR) | 5 | Backend |
| INF-005: Monitoring & alerting | 8 | Infrastructure |
| INF-006: Log aggregation | 5 | Infrastructure |
| INF-009: Backup & disaster recovery | 5 | Infrastructure |
| CI-007: Staging auto-deploy | 5 | Automation |

**Deliverable:** Company Portal operational; mobile IAP working; monitoring stack live.

---

### Sprint 15 (Weeks 29–30) — Company Portal + Mobile Real-time + Tracing
**Theme:** Company Portal features + Mobile chat polish + OpenTelemetry
**Story Points: ~28**

| Task | Points | Portal |
|------|--------|--------|
| CP-003: Employee directory | 5 | Company |
| CP-004: Department management | 8 | Company |
| CP-005: Leave & attendance | 8 | Company |
| MOB-022: Responsive design | 5 | Mobile |
| BE-007: WebSocket real-time | 8 | Backend |
| INF-007: OpenTelemetry tracing | 8 | Backend |

**Deliverable:** Company Portal employee features complete; real-time WebSocket active; distributed tracing live.

---

### Sprint 16 (Weeks 31–32) — Company Portal Polish + Mobile Performance + Load Testing
**Theme:** Company Portal completion + Mobile performance + Deployment strategy + Load testing
**Story Points: ~35**

| Task | Points | Portal |
|------|--------|--------|
| CP-006: Company settings | 5 | Company |
| CP-007: Reports & exports | 5 | Company |
| CP-008: Integration management | 8 | Company |
| MOB-023: Performance optimization | 5 | Mobile |
| TEST-006: Payment unit tests | 5 | Testing |
| TEST-009: Component unit tests | 13 → 5 | Testing |
| INF-008: Blue-green deployment | 8 | Infrastructure |
| INF-010: Performance testing | 5 | Infrastructure |
| CI-010: Performance budgets | 5 | Automation |
| PERF-003: Pruebas de Carga (k6 + admin dashboard) | 8 | Performance |

**Deliverable:** Company Portal complete; mobile performant; blue-green deployment working; load testing operational.

---

### Sprint 17 (Weeks 33–34) — Notification System + Mobile E2E
**Theme:** Push notifications + Mobile E2E tests + Final security
**Story Points: ~26**

| Task | Points | Portal |
|------|--------|--------|
| BE-010: Notification system enhancement | 8 | Backend |
| MOB-016: Spotify integration (complete) | 5 → 0 | Mobile (done S13) |
| TEST-013: Mobile component tests | 8 | Testing |
| TEST-007: Integration tests (expand) | 13 → 5 | Testing |
| SEC-004: Upload validation + access control | 8 | Security |

**Deliverable:** Push notifications working; mobile tested; upload security enforced.

---

### Sprint 18 (Weeks 35–36) — E2E Testing + Documentation
**Theme:** Comprehensive E2E + Documentation
**Story Points: ~25**

| Task | Points | Portal |
|------|--------|--------|
| TEST-012: E2E tests (expand) | 13 | Testing |
| TEST-014: Mobile E2E tests | 13 | Testing |
| TEST-005: Admin unit tests (expand) | 8 → 5 | Testing |

**Deliverable:** Full E2E coverage across web and mobile.

---

### Sprint 19 (Weeks 37–38) — Bug Fixes + Polish
**Theme:** Cross-cutting bug fixes, UX polish, edge cases
**Story Points: ~20**

| Task | Points | Portal |
|------|--------|--------|
| Bug fixes from testing phase | 10 | All |
| UX polish pass (animations, transitions, micro-interactions) | 5 | All |
| Performance optimization pass | 5 | All |

**Deliverable:** All known bugs fixed; UX polished.

---

### Sprint 20 (Weeks 39–40) — Hardening
**Theme:** Security hardening, load testing, accessibility final audit
**Story Points: ~22**

| Task | Points | Portal |
|------|--------|--------|
| Security penetration testing | 8 | Security |
| Load testing (k6/Locust) | 5 | Infrastructure |
| Accessibility final audit + fixes | 5 | All |
| Cross-browser/device testing | 5 | All |

**Deliverable:** Security-pen-tested; load-tested; accessible; cross-device verified.

---

### Sprint 21 (Weeks 41–42) — Final Integration
**Theme:** End-to-end integration, production config, final testing
**Story Points: ~20**

| Task | Points | Portal |
|------|--------|--------|
| Production environment setup | 5 | Infrastructure |
| End-to-end smoke tests | 5 | Testing |
| Performance budget verification | 5 | All |
| Documentation finalization | 5 | All |

**Deliverable:** Production-ready system.

---

### Sprint 22 (Weeks 43–44) — Launch Preparation
**Theme:** Launch checklist, monitoring, rollback procedures
**Story Points: ~15**

| Task | Points | Portal |
|------|--------|--------|
| Launch checklist execution | 5 | All |
| Monitoring dashboard verification | 3 | Infrastructure |
| Rollback procedure testing | 3 | Infrastructure |
| Launch 🚀 | 4 | All |

**Deliverable:** RedThread launched!

---

## 4. Automation & QA Recommendations

### CI/CD Pipeline

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌─────────────┐
│  PR Created  │────▶│  Lint + Type │────▶│  Unit Tests  │────▶│  Build      │
│              │     │  Check       │     │  + Coverage  │     │  Docker     │
└─────────────┘     └──────────────┘     └──────────────┘     └──────┬──────┘
                                                                      │
                     ┌──────────────┐     ┌──────────────┐           │
                     │  Deploy to   │◀────│  Security    │◀──────────┘
                     │  Staging     │     │  Scan        │
                     └──────┬──────┘     └──────────────┘
                            │
                     ┌──────▼──────┐     ┌──────────────┐
                     │  E2E Tests  │────▶│  Deploy to   │
                     │  (Playwright│     │  Production  │
                     └─────────────┘     │  (manual     │
                                         │  approval)   │
                                         └──────────────┘
```

### Key Automation Rules

1. **Every PR must pass:** lint, type-check, unit tests, security scan, build
2. **Every merge to develop:** auto-deploy to staging + E2E tests
3. **Every merge to main:** deploy to production (manual approval gate)
4. **Nightly:** full test suite + performance benchmarks + dependency audit
5. **Weekly:** security scan + coverage report + bundle analysis

### Testing Strategy

| Layer | Tool | Coverage Target | Speed |
|-------|------|----------------|-------|
| Unit (Backend) | pytest | ≥ 80% | < 30s |
| Unit (Frontend) | Jest | ≥ 70% | < 60s |
| Integration | pytest + httpx | Critical paths | < 2min |
| E2E (Web) | Playwright | Critical journeys | < 10min |
| E2E (Mobile) | Detox | Critical journeys | < 15min |
| Security | Bandit + Trivy | OWASP Top 10 | < 5min |
| Performance | Lighthouse CI | ≥ 90 score | < 3min |

### Code Quality Tools

| Tool | Purpose | Enforcement |
|------|---------|-------------|
| ESLint | Frontend linting | Pre-commit + CI |
| Ruff | Python linting + formatting | Pre-commit + CI |
| TypeScript | Type safety | CI (noEmit check) |
| Prettier | Code formatting | Pre-commit (lint-staged) |
| Husky | Git hooks | Local |
| lint-staged | Staged file linting | Pre-commit |

### Monitoring & Alerting

| Metric | Tool | Threshold |
|--------|------|-----------|
| Error rate | Prometheus | > 1% → alert |
| p95 latency | Prometheus | > 500ms → alert |
| Disk usage | Prometheus | > 80% → alert |
| Memory usage | Prometheus | > 85% → alert |
| Failed logins | Custom metric | > 10/min → alert |
| WebSocket connections | Custom metric | > 10K → warn |

---

## 5. Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Solo developer burnout | High | Critical | Prioritize ruthlessly; cut scope before quality; take breaks |
| Scope creep | High | High | Strict backlog discipline; P3 items deferred to "nice to have" |
| Liquid Glass performance | Medium | High | Performance degradation system (LG-007); test on low-end devices |
| Stripe integration complexity | Medium | High | Start early (S9); use Stripe's official SDK; thorough webhook testing |
| React Native cross-platform issues | High | Medium | Test on both platforms early; use Expo where possible |
| MongoDB scaling | Low | High | Index strategy from S1; monitoring; sharding plan for later |
| Security vulnerabilities | Medium | Critical | Continuous scanning; penetration testing in S20; follow OWASP |
| Breaking changes in dependencies | Medium | Medium | Pin versions; update weekly; test after updates |

---

## 6. Definition of Done

### For every task:

- [ ] Code written and self-reviewed
- [ ] Unit tests written and passing
- [ ] Lint/type-check clean (zero warnings)
- [ ] No security regressions (Bandit/ESLint security pass)
- [ ] Accessibility verified (axe core, contrast checks)
- [ ] Responsive on 375px, 768px, 1024px, 1440px
- [ ] i18n keys added (ES + EN minimum)
- [ ] Documentation updated (if applicable)
- [ ] Code review (self-review with fresh eyes, or PR if expanding team)
- [ ] No `console.log`, `print()`, or debug artifacts
- [ ] Performance: no new Lighthouse regressions

### For sprint completion:

- [ ] All planned stories done or explicitly deferred
- [ ] Test coverage not decreased
- [ ] No critical/high bugs open
- [ ] Security scan clean
- [ ] Staging deployment successful
- [ ] Sprint retrospective completed

---

*Generated: 2026-09-14 | Next review: End of Sprint 1*
