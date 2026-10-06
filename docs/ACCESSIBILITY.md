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
