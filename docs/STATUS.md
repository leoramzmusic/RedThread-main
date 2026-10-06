# RETH — Project Status (2026-10-06)

> Living document: what shipped, what is in progress, and why it takes time.
> Detailed specs live in `docs/superpowers/`; the plan of record is
> `docs/MASTER_BACKLOG.md`; accessibility rules in `docs/ACCESSIBILITY.md`.

## ✅ Done (Sept → Oct 2026 cycle)

- **Smart Photos, real loop (not just the label):** photo interaction
  tracking (views/clicks/view-time/matches) attributed to the photo
  owner, `PhotoMetric` scoring (`0.5 matchRate + 0.3 clickRate + 0.2 viewTime`),
  hourly auto-reorder, match attribution from discover, "eligió tu mejor
  foto" feedback, ✨ Smart badge, and manual reorder always winning
  (24h automation lock + resume).
- **Profile Tips admin submodule** (`/portal-redthread/perfiles/tips`):
  `ProfileTip` model with 21-language translations, carousel/drawer/stepper
  renderer, slide editor with image upload + square crop + live preview,
  uploads served from versioned `img/assets/tips/`, DB-first with hardcoded
  fallback in `/edit`.
- **Contextual toasts** (`SmartToast`): top-right on portrait, bottom-right
  on landscape, semantic colors, slide animation, screen-reader announcements.
- **Accessibility Phase 1:** `docs/ACCESSIBILITY.md` standard, DoD backlog
  gate, narrator pass on tips/toasts/badges/galleries (roles, labels, alts).
- **CI health:** ESLint 8→9 + eslint-config-next 16 (flat config), deploy
  workflow YAML fix (pending push — needs `workflow` token scope),
  `test_profile_completion` fake fixed (missing `music_genres` points).
- **BottomSheet rework:** exit animation, backdrop-tap guard, mouse
  drag-to-close, safe-area padding, above bottom nav.

## 🔄 In progress (why it takes time)

These three areas are being worked **in parallel** and touch each other,
so changes land carefully to avoid regressions:

1. **Edit profile (`/profile/@nickname/edit`):** 17-section dynamic form,
   media manager with drag reorder, i18n option loading, Smart Photos +
   Tips integration. Every addition must keep save payloads (`exclude_unset`),
   completion %, and 21-locale bundles intact.
2. **Discover:** swipe engine (buttons/taps/keyboard/swipes modes), CARE
   narrative panels, queue/refinement logic, match flow feeding Smart Photos
   metrics. Changes here ripple to matching, notifications, and metrics.
3. **CARE algorithm:** compatibility/authenticity/responsiveness/engagement
   scoring with A/B weights, profile-completion parity backend↔frontend
   (`profileScoring.ts` ↔ `calculate_profile_completion`), hidden-module
   recalculation. Small weight changes move completion % everywhere.

The calendar time goes to cross-cutting verification (tsc + eslint +
154 backend tests per change) across these coupled surfaces — not to any
single feature.

## 📋 Queued next (backlog)

- Accessibility Settings panel: `A11Y-101..104` (contrast palettes, text
  steps, narrator mode, keyboard nav) — spec in `docs/ACCESSIBILITY.md` §6.
- Screen-reader manual validation (Phase 3) + axe audit (Phase 2, `LG-006`).
- Docker `img/` volume already added; deploy workflow fix awaiting push
  with `workflow` scope.
