# RETH — Accessibility Standard (Screen Reader Track)

> Standing rule (2026-10-06): every UI change in RETH must keep screen-reader
> support working. New interactive components ship with the checklist below
> satisfied. This doc is the authority; `MASTER_BACKLOG.md` §6 (Definition of
> Done) enforces it.

## 1. Baseline (applies to every change)

- Interactive elements are reachable by keyboard (`Tab`) and operable with
  `Enter`/`Espacio`. No click-only `div`s: use `role="button"` + `tabIndex={0}`
  + `onKeyDown`, or a real `<button>`.
- Every `img` / `Avatar` / `CardMedia` carries a meaningful `alt`
  (person + context, never a filename). Decorative icons get `aria-hidden`.
- Icon-only buttons always have `aria-label` (translated via i18n keys).
- Modals/dialogs/sheets: `role="dialog"` + `aria-modal="true"` + labelled
  title (`aria-labelledby` or visible heading associated).
- Toasts/notifications: `role="status"` (polite) or `role="alert"`
  (assertive, errors only). Never put interactive content inside `role="alert"`.
- Carousel controls are real buttons with labels (Anterior/Siguiente/Cerrar);
  position dots expose `role="button"` + `aria-label="Ir a slide N"`.
- Honor `prefers-reduced-motion`: disable non-essential animation
  (see `usePrefersReducedMotion` hook).
- Touch targets ≥ 44×44 px on mobile layouts.

## 2. Screen-reader narration patterns (App-wide conventions)

| Surface | Narrator behavior |
|---------|-------------------|
| Profile photos | `alt` = display name + position (e.g. "Foto 2 de Ana"). Main photo flagged ("foto principal", or "elegida por Smart Photos" when applicable). |
| Visual tips carousel | Reads slide title → description → OK label → KO label, in order. Dots announce position. |
| Smart Photos badge | Badge has `aria-label` explaining auto-selection, not just "Smart". |
| Notifications | `aria-live="polite"` auto-reads ("Smart Photos activado", …). Errors use `role="alert"`. |
| Admin image slots | Editable slots expose `aria-label` with action ("Subir imagen OK del slide 1", "Quitar imagen"). |

## 3. Screen-reader track (phased)

- **Phase 1 — New components comply (ongoing):** SmartToast, TipRenderer
  family, Smart Photos badges ship accessible (done 2026-10-06).
- **Phase 2 — Audit pass:** axe run over `/discover`, `/profile/*`, `/edit`;
  fix criticals; add `alt` coverage to legacy galleries (`PhotoGrid`,
  `ProfileGallery`, radar/roulette cards).
- **Phase 3 — Manual validation:** Narrator/NVDA (Windows) + TalkBack
  (Android) + VoiceOver (iOS) walkthrough of discover → profile → edit;
  record gaps as `A11Y-*` backlog items.
- **Phase 4 — React Native:** `accessibilityLabel` / `accessibilityRole`
  on all images, buttons, modals (see `MOB-021`).

## 4. Verification per change

1. Keyboard-only walkthrough of the touched flow.
2. Screen-reader spot check (at least one engine) for new modals/toasts.
3. `tsc` + `eslint` clean; no `console.log` leftovers.
4. i18n keys for every new accessible string (ES + EN minimum).

## 5. Backlog links

- `LG-006` (axe audit), `MOB-021` (mobile screen reader), `TEST-009`
  (a11y tests), UX_UI backlog § accessibility checklist.

## 6. Settings panel — Accessibility section (future)

Location: `/settings?section=accessibility` (`AccessibilitySection.tsx`).
Current state (2026-10-06): 4 toggles rendered and persisted
(`high_contrast_mode`, `screen_reader_enabled`, `keyboard_navigation`,
`reduced_motion`) but with **no effect wired**; `font_size`
(`small|medium|large`) persisted in `UserSettings` with **no UI yet**.
The panel below turns them from placebo into working preferences.
Persistence already exists via the settings API — the work is wiring
effects + the missing controls.

### 6.1 High contrast (opt-in palettes, never global inversion)

- Palettes: `default` · `white-on-black` · `yellow-on-blue`.
  Curated token overrides (text, surfaces, borders, focus ring), not a
  CSS `invert()` filter.
- Applied as `data-contrast` attribute on `<html>` + MUI theme tokens;
  persisted to `UserSettings.high_contrast_mode` (+ palette id).
- Acceptance: WCAG AA contrast (≥ 4.5:1 text) on all three palettes;
  glass blur reduced to solid surfaces under high contrast.

### 6.2 Text size (Normal / Grande / Extra grande)

- Steps map to root font scaling without breaking layout:
  `medium` = 100%, `large` = 112.5%, `xlarge` = 125% (extend
  `UserSettings.font_size` enum, currently `small|medium|large`).
- UI: segmented selector in the Accessibility section (not a free slider,
  to guarantee tested steps).
- Acceptance: no clipped text / no broken grids at 125% on 375px, 768px,
  1440px; `rem`-based sizing enforced in touched components.

### 6.3 Narrator compatibility mode

- When `screen_reader_enabled`: verbose `alt`/`aria-label` variants
  (e.g. photo descriptions include context), `aria-live` announcements
  for toasts/matches, reduced decorative live regions.
- The ARIA groundwork from §2 stays always-on; this toggle only adds
  the verbose layer.
- Acceptance: Narrator/NVDA walkthrough of discover → profile → edit
  with zero unlabeled controls.

### 6.4 Full keyboard navigation + visible focus

- When `keyboard_navigation`: roving focus in card stacks, `Esc` closes
  every modal/sheet, documented shortcuts (discover arrows already exist
  in `ProfileCard`), focus trap in dialogs.
- Global `:focus-visible` ring (2px, high-contrast aware).
- Acceptance: complete discover → match → chat flow without a mouse.

### 6.5 Preview + persistence

- Live preview card inside the section showing contrast + text size
  applied to sample content before saving.
- All four preferences persist to `UserSettings` (cross-session and
  cross-device, like the rest of settings).
