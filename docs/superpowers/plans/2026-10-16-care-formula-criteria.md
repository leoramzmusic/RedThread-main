# CARE Formula Criteria (Bloque 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `frontend/src/pages/portal-redthread/care/criteria.tsx` into the canonical 7-dimension weight editor driven by a single source (`GET /formula/active`): a per-row slider + Dirac chip + lock table, live 100%/±badge KPIs, `Normalizar` via `POST /formula/normalizar`, `Aplicar Cambios` via a changelog modal over `POST /formula/save` (source `criteria`), and a per-row `Probar` handoff to `/portal-redthread/care/equation` — removing the two legacy GETs and the fake `setTimeout` save.

**Architecture:** Three layers. (1) A pure, dependency-free model module (`careCriteriaModel.ts`) with percent↔fraction conversion, sum/balance checks, lock toggling, KPI label formatting, delta computation, the equation-draft query codec, and save-error mapping — all unit-tested. (2) A presentational `CareCriteriaTable` component that renders the 7 canonical rows and only emits intent (`onSliderChange`, `onSliderCommit`, `onToggleLock`, `onProbar`). (3) A container page (`criteria.tsx`) that owns state and calls the already-built `careFormulaService` (which wraps the named `adminApiClient` from `services/api`). No new dependencies; admin copy is hardcoded Spanish (spec decision 11).

**Tech Stack:** Next.js (Pages Router), React 19, MUI (`@mui/material` + `@mui/icons-material`), TypeScript, axios client via `careFormulaService`, Jest + @testing-library/react.

**Spec:** `docs/superpowers/specs/2026-10-15-care-formula-dirac-design.md` (see `### criteria.tsx`, `## Decisiones aprobadas`, `## Endpoints`).

## Global Constraints

- **No new dependencies** (spec §Tests). Do not touch `package.json`. Everything here uses React, Next, MUI, and jest/testing-library already present.
- **Admin pages are hardcoded Spanish** (spec decision 11). Never call `t()` on this page. Use `CARE_DIMENSIONS[].label` (already Spanish) and literal Spanish strings.
- **No new i18n keys.** Do not add anything to `public/locales/**` or any `useTranslation` namespace.
- **Backend endpoint prefix:** `/portal-redthread/experiencia/algoritmos` (registered in `backend/src/main.py`). Formula routes live under `/formula/*`.
- **API access:** the page must consume `frontend/src/services/careFormulaService.ts` functions. That service already imports the **named** `adminApiClient` from `frontend/src/services/api.ts` (`export const adminApiClient = createApiClient({...})`). Do NOT import `adminApiClient` into the page, and do NOT call axios directly. Cookies + 401-refresh are handled by `services/api.ts`; never manage tokens manually.
- **MUI `sx` gotcha:** this repo rejects numeric `borderRadius` in `sx` — always use px strings (`borderRadius: "8px"`, `borderRadius: "50%"`).
- **Do not modify** `careDimensions.ts`, `careFormulaService.ts`, or any backend file in this block.
- **Verification commands** (run from `frontend/`):
  - Tests: `npx jest <path> --ci`
  - Typecheck: `npm run typecheck`
  - Lint: `npm run lint`
- **Commits:** local only; never push without the user saying "sube".

## Backend contract (verified against `backend/src/api/admin_algorithms.py` + `backend/src/care/formula/service.py`)

`GET /formula/active` → a `CAREFormula` dump (lazy-seeds `v1` if none active):
```jsonc
{
  "version": 1,
  "status": "active",
  "blocks": { "values": 0.36, "relationship_goals": 0.18, "neurodiversity": 0.15,
              "responsiveness": 0.10, "music": 0.11, "love_language": 0.06,
              "communication_style": 0.04 },
  "chaos_factor": 0.0,          // float, range 0–20
  "chaos_seed": null,           // string | null
  "min_compatibility": 0.0,
  "match_critical": 0.15,
  "changelog": "Seed inicial canónico",
  "created_by": "system",
  "created_at": "2026-10-16T...Z",
  "_id": "..."                  // Mongo id, ignore
}
```

`POST /formula/normalizar` — body `{ "blocks": { ...7 keys, fractions... }, "locked": string[] }` → `{ "blocks": { ...7 keys, sum exactly 1.0... } }`.
- Redistributes **unlocked** weights proportionally so `sum == 1.0`; locked weights are preserved as-is.
- **Error 400** (`ValueError`, detail string) when: unknown keys; `locked` sum ≥ 1.0; or every dimension is locked.

`POST /formula/save` — body `{ "formula": FormulaPayload, "source": "criteria" }` → the saved `CAREFormula` dump.
- **Error 409** when the payload config equals the active config (no change); `detail` is a Spanish string (`"La fórmula no cambió respecto a la versión activa"`).
- **Error 422** when validation fails; `detail` is a **list of Spanish strings** (`exc.errors`), or a single string for a missing required key.
- `save_new_version` requires `blocks` and `changelog`; the new version number is computed by the backend (any `version` you send is ignored for numbering), but `chaos_factor` / `chaos_seed` / `min_compatibility` / `match_critical` are part of the no-change comparison, so **send them from the active formula** to avoid spurious 409s.

**`FormulaPayload`** = `{ version?: number, blocks: Record<string, number>, chaos_factor?: number, chaos_seed?: string | null, min_compatibility?: number, match_critical?: number, changelog?: string }` (already defined and exported by `careFormulaService.ts`).

### Spec-vs-reality discrepancies (found during verification — implement per reality)

1. **Normalize endpoint path.** Spec `### criteria.tsx` says `POST /care/normalizar`. Reality: the canonical route is **`POST /formula/normalizar`** with body `{blocks, locked}` (the legacy `/care/normalizar` expects `{factor_id, new_weight, locked_ids}` and returns `AlgorithmFactor[]` — do NOT use it). The service already targets `/formula/normalizar`; this plan uses it.
2. **Slider range vs backend range.** Spec says a `0–40%` per-row slider, but the backend validates each block weight in `0–1` (`0–100%`) and `normalizar` can legitimately push one unlocked block above 40% when others are locked. This plan follows the spec (`max={40}`) and renders the **true** percentage in the numeric label next to the slider, while the slider handle clamps to 40 (documented in Task 2).
3. **Equation route path.** Spec writes `/care/equation`; the real Pages Router route is **`/portal-redthread/care/equation`** (see `AdminSidebar.tsx:214`). Use the full path.
4. **Save `version` field.** Sending `version` is harmless but not used for numbering; include the active `version` for clarity.

## File Structure

- **Create** `frontend/src/utils/careCriteriaModel.ts` — pure helpers: percent↔fraction, sum/balance, lock toggle, KPI label formatting, delta computation, equation-draft query codec, save-error mapping. One responsibility: criteria view-model math (no React, no I/O).
- **Create** `frontend/src/utils/careCriteriaModel.test.ts` — unit tests for the helpers.
- **Create** `frontend/src/components/care/CareCriteriaTable.tsx` — presentational MUI table: 7 canonical rows (chip + label + slider + lock + `Probar`). Emits intent only.
- **Create** `frontend/src/components/care/CareCriteriaTable.test.tsx` — component test.
- **Modify (full rewrite)** `frontend/src/pages/portal-redthread/care/criteria.tsx` — container page.
- **Create** `frontend/src/pages/portal-redthread/care/criteria.test.tsx` — page test (mocks `careFormulaService`, `CareCriteriaTable`, `next/router`, and `AdminLayout`).

---

### Task 1: `careCriteriaModel.ts` (pure view-model helpers)

**Files:**
- Create: `frontend/src/utils/careCriteriaModel.ts`
- Test: `frontend/src/utils/careCriteriaModel.test.ts`

**Interfaces:**
- Consumes: `CARE_DIMENSIONS`, `CARE_DIMENSION_KEYS`, `CareDimensionKey` from `../constants/careDimensions`; types `CareFormula`, `FormulaBlocks` from `../services/careFormulaService`.
- Produces (all named exports):
  - `type PercentMap = Record<string, number>`
  - `percentOf(fraction: number): number` — fraction→rounded integer percent, clamps NaN/undefined to 0.
  - `fractionOf(percent: number): number` — percent→fraction.
  - `toPercents(blocks: FormulaBlocks): PercentMap`
  - `withFraction(blocks: FormulaBlocks, key: CareDimensionKey, percent: number): FormulaBlocks` — returns a **new** object with `key` set to `percent/100`.
  - `totalPercent(blocks: FormulaBlocks): number` — rounded integer sum of all weights.
  - `isBalanced(blocks: FormulaBlocks): boolean` — `totalPercent === 100`.
  - `toggleLocked(locked: string[], key: CareDimensionKey): string[]` — add/remove, order-preserving.
  - `formatActiveVersion(formula: Pick<CareFormula, "version" | "created_at" | "created_by">): string` — `vN · YYYY-MM-DD · admin`.
  - `formatChaos(factor: number, seed: string | null | undefined): string` — `±X% · seed fijada` / `±X% · seed aleatoria`.
  - `computeDeltas(base: FormulaBlocks, next: FormulaBlocks): { key: CareDimensionKey; label: string; deltaPercent: number }[]` — only rows whose rounded percent changed.
  - `encodeEquationDraft(blocks: FormulaBlocks, focus: CareDimensionKey): { source: "criteria"; focus: string; w: string }`
  - `decodeEquationDraft(query: Record<string, string | string[] | undefined> | undefined): { blocks: FormulaBlocks; focus: CareDimensionKey | null } | null`
  - `saveErrorMessage(error: unknown): string` — maps 409/422 axios errors to Spanish messages.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/utils/careCriteriaModel.test.ts`:

```ts
import {
  percentOf,
  fractionOf,
  toPercents,
  withFraction,
  totalPercent,
  isBalanced,
  toggleLocked,
  formatActiveVersion,
  formatChaos,
  computeDeltas,
  encodeEquationDraft,
  decodeEquationDraft,
  saveErrorMessage,
} from "./careCriteriaModel";
import { CANONICAL_BLOCK_WEIGHTS } from "../constants/careDimensions";

const canonical = { ...CANONICAL_BLOCK_WEIGHTS };

describe("careCriteriaModel / conversions", () => {
  it("percentOf rounds fractions to integer percent", () => {
    expect(percentOf(0.36)).toBe(36);
    expect(percentOf(0.1)).toBe(10);
    expect(percentOf(Number.NaN as unknown as number)).toBe(0);
    expect(percentOf(undefined as unknown as number)).toBe(0);
  });

  it("fractionOf converts percent back to a fraction", () => {
    expect(fractionOf(40)).toBeCloseTo(0.4, 10);
  });

  it("toPercents maps the 7 canonical keys to integers", () => {
    expect(toPercents(canonical)).toEqual({
      values: 36,
      relationship_goals: 18,
      neurodiversity: 15,
      responsiveness: 10,
      music: 11,
      love_language: 6,
      communication_style: 4,
    });
  });

  it("withFraction returns a new object and does not mutate input", () => {
    const next = withFraction(canonical, "values", 40);
    expect(next.values).toBeCloseTo(0.4, 10);
    expect(canonical.values).toBe(0.36);
    expect(next).not.toBe(canonical);
  });
});

describe("careCriteriaModel / sum and balance", () => {
  it("totalPercent sums to 100 for the canonical weights", () => {
    expect(totalPercent(canonical)).toBe(100);
    expect(isBalanced(canonical)).toBe(true);
  });

  it("flags an unbalanced set", () => {
    const unbalanced = { ...canonical, values: 0.4 };
    expect(totalPercent(unbalanced)).toBe(104);
    expect(isBalanced(unbalanced)).toBe(false);
  });
});

describe("careCriteriaModel / lock toggle", () => {
  it("adds a key when absent and removes it when present", () => {
    expect(toggleLocked([], "values")).toEqual(["values"]);
    expect(toggleLocked(["values", "music"], "values")).toEqual(["music"]);
  });
});

describe("careCriteriaModel / labels", () => {
  it("formats the active version KPI", () => {
    expect(
      formatActiveVersion({
        version: 3,
        created_at: "2026-10-16T12:00:00Z",
        created_by: "maria",
      }),
    ).toBe("v3 · 2026-10-16 · maria");
  });

  it("formats the chaos KPI with fijada/aleatoria seed", () => {
    expect(formatChaos(5, null)).toBe("±5% · seed aleatoria");
    expect(formatChaos(2.5, "abc")).toBe("±2.5% · seed fijada");
    expect(formatChaos(0, null)).toBe("±0% · seed aleatoria");
  });
});

describe("careCriteriaModel / deltas", () => {
  it("returns only rows whose rounded percent changed, in canonical order", () => {
    const next = { ...canonical, values: 0.4, music: 0.07 };
    expect(computeDeltas(canonical, next)).toEqual([
      { key: "values", label: "Valores", deltaPercent: 4 },
      { key: "music", label: "Música", deltaPercent: -4 },
    ]);
  });

  it("returns an empty array when nothing changed", () => {
    expect(computeDeltas(canonical, canonical)).toEqual([]);
  });
});

describe("careCriteriaModel / equation draft codec", () => {
  it("round-trips blocks and focus through the query params", () => {
    const encoded = encodeEquationDraft(canonical, "music");
    expect(encoded.source).toBe("criteria");
    expect(encoded.focus).toBe("music");
    expect(typeof encoded.w).toBe("string");
    const decoded = decodeEquationDraft(encoded as unknown as Record<string, string>);
    expect(decoded).not.toBeNull();
    expect(decoded?.focus).toBe("music");
    expect(decoded?.blocks).toEqual(canonical);
  });

  it("returns null for a missing or invalid payload", () => {
    expect(decodeEquationDraft(undefined)).toBeNull();
    expect(decodeEquationDraft({})).toBeNull();
    expect(decodeEquationDraft({ w: "not-json" })).toBeNull();
  });

  it("falls back to null focus for an unknown key", () => {
    const encoded = encodeEquationDraft(canonical, "music");
    const decoded = decodeEquationDraft({ w: encoded.w, focus: "zzz" });
    expect(decoded?.focus).toBeNull();
  });
});

describe("careCriteriaModel / saveErrorMessage", () => {
  it("returns the 409 detail string", () => {
    expect(
      saveErrorMessage({
        response: { status: 409, data: { detail: "La fórmula no cambió" } },
      }),
    ).toBe("La fórmula no cambió");
  });

  it("joins a 422 array detail", () => {
    expect(
      saveErrorMessage({
        response: { status: 422, data: { detail: ["Falta 'blocks'", "Suma ≠ 1.0"] } },
      }),
    ).toBe("Falta 'blocks' · Suma ≠ 1.0");
  });

  it("returns the 422 string detail", () => {
    expect(
      saveErrorMessage({ response: { status: 422, data: { detail: "blocks requerido" } } }),
    ).toBe("blocks requerido");
  });

  it("falls back to a generic message for unknown errors", () => {
    expect(saveErrorMessage(new Error("boom"))).toBe(
      "No se pudo guardar la fórmula. Intenta de nuevo.",
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/utils/careCriteriaModel.test.ts --ci`
Expected: FAIL — "Cannot find module './careCriteriaModel'".

- [ ] **Step 3: Write minimal implementation**

Create `frontend/src/utils/careCriteriaModel.ts`:

```ts
import {
  CARE_DIMENSIONS,
  CARE_DIMENSION_KEYS,
  type CareDimensionKey,
} from "../constants/careDimensions";
import type { CareFormula, FormulaBlocks } from "../services/careFormulaService";

/**
 * Pure view-model helpers for the criteria weight editor.
 * No React, no network — everything here is unit-testable in isolation.
 * Weights live in `blocks` as fractions (0–1); the UI shows percentages.
 */

export type PercentMap = Record<string, number>;

const asFiniteNumber = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

/** Fraction (0–1) → rounded integer percent; NaN/undefined clamp to 0. */
export function percentOf(fraction: number): number {
  return Math.round(asFiniteNumber(fraction) * 100);
}

/** Percent → fraction (0–1). */
export function fractionOf(percent: number): number {
  return asFiniteNumber(percent) / 100;
}

/** Map every canonical key to its integer percentage. */
export function toPercents(blocks: FormulaBlocks): PercentMap {
  const out: PercentMap = {};
  for (const key of CARE_DIMENSION_KEYS) out[key] = percentOf(blocks[key]);
  return out;
}

/** Immutably set one block from a percent value. */
export function withFraction(
  blocks: FormulaBlocks,
  key: CareDimensionKey,
  percent: number,
): FormulaBlocks {
  return { ...blocks, [key]: fractionOf(percent) };
}

/** Rounded integer sum of every weight in the record. */
export function totalPercent(blocks: FormulaBlocks): number {
  const sum = Object.values(blocks).reduce<number>(
    (acc, value) => acc + asFiniteNumber(value),
    0,
  );
  return Math.round(sum * 100);
}

/** True when the total rounds to exactly 100%. */
export function isBalanced(blocks: FormulaBlocks): boolean {
  return totalPercent(blocks) === 100;
}

/** Add the key when absent, remove it when present (order preserved). */
export function toggleLocked(locked: string[], key: CareDimensionKey): string[] {
  return locked.includes(key) ? locked.filter((k) => k !== key) : [...locked, key];
}

/** `vN · YYYY-MM-DD · admin`. */
export function formatActiveVersion(
  formula: Pick<CareFormula, "version" | "created_at" | "created_by">,
): string {
  const date = typeof formula.created_at === "string" ? formula.created_at.slice(0, 10) : "";
  return `v${formula.version} · ${date} · ${formula.created_by}`;
}

/** `±X% · seed fijada|aleatoria`. */
export function formatChaos(
  factor: number,
  seed: string | null | undefined,
): string {
  const value = asFiniteNumber(factor);
  const shown = Number.isInteger(value) ? String(value) : value.toFixed(1);
  const seedLabel = seed ? "seed fijada" : "seed aleatoria";
  return `±${shown}% · ${seedLabel}`;
}

/** Rows whose rounded percent differ between base and next, canonical order. */
export function computeDeltas(
  base: FormulaBlocks,
  next: FormulaBlocks,
): { key: CareDimensionKey; label: string; deltaPercent: number }[] {
  const deltas: { key: CareDimensionKey; label: string; deltaPercent: number }[] = [];
  for (const dim of CARE_DIMENSIONS) {
    const deltaPercent = percentOf(next[dim.key]) - percentOf(base[dim.key]);
    if (deltaPercent !== 0) {
      deltas.push({ key: dim.key, label: dim.label, deltaPercent });
    }
  }
  return deltas;
}

const round6 = (value: number): number => Math.round(asFiniteNumber(value) * 1e6) / 1e6;

/**
 * Encodes the edited formula + the emphasized row into Next router query params.
 * Block 4 (`equation.tsx`) consumes this via {@link decodeEquationDraft}.
 */
export function encodeEquationDraft(
  blocks: FormulaBlocks,
  focus: CareDimensionKey,
): { source: "criteria"; focus: string; w: string } {
  const ordered: FormulaBlocks = {};
  for (const key of CARE_DIMENSION_KEYS) ordered[key] = round6(blocks[key]);
  return { source: "criteria", focus, w: JSON.stringify(ordered) };
}

const firstString = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

/**
 * Decodes {@link encodeEquationDraft}. Returns null when the payload is missing
 * or malformed; `focus` is null when it is not a canonical key.
 */
export function decodeEquationDraft(
  query: Record<string, string | string[] | undefined> | undefined,
): { blocks: FormulaBlocks; focus: CareDimensionKey | null } | null {
  const raw = firstString(query?.w);
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return null;
  }
  const blocks: FormulaBlocks = {};
  for (const key of CARE_DIMENSION_KEYS) {
    const value = (parsed as Record<string, unknown>)[key];
    if (typeof value !== "number" || !Number.isFinite(value)) return null;
    blocks[key] = value;
  }
  const focusRaw = firstString(query?.focus);
  const focus = CARE_DIMENSION_KEYS.includes(focusRaw as CareDimensionKey)
    ? (focusRaw as CareDimensionKey)
    : null;
  return { blocks, focus };
}

/** Maps a save failure (axios error) to a Spanish, user-visible message. */
export function saveErrorMessage(error: unknown): string {
  const status = (error as { response?: { status?: number } })?.response?.status;
  const detail = (error as { response?: { data?: { detail?: unknown } } })?.response?.data
    ?.detail;
  if (status === 409) {
    return typeof detail === "string" && detail
      ? detail
      : "La fórmula no cambió respecto a la versión activa.";
  }
  if (status === 422) {
    if (Array.isArray(detail)) return detail.join(" · ");
    if (typeof detail === "string" && detail) return detail;
    return "La fórmula no pasó la validación.";
  }
  return "No se pudo guardar la fórmula. Intenta de nuevo.";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/utils/careCriteriaModel.test.ts --ci`
Expected: PASS (all suites green).

- [ ] **Step 5: Typecheck + commit**

Run: `npm run typecheck`
Expected: no new errors.

```bash
git add frontend/src/utils/careCriteriaModel.ts frontend/src/utils/careCriteriaModel.test.ts
git commit -m "feat(care-ui): modelo puro careCriteriaModel (percent/sum/locks/deltas)"
```

---

### Task 2: `CareCriteriaTable.tsx` (presentational 7-row table)

**Files:**
- Create: `frontend/src/components/care/CareCriteriaTable.tsx`
- Test: `frontend/src/components/care/CareCriteriaTable.test.tsx`

**Interfaces:**
- Consumes: `CARE_DIMENSIONS`, `CareDimensionKey` from `../../constants/careDimensions`; `FormulaBlocks` from `../../services/careFormulaService`; `percentOf` from `../../utils/careCriteriaModel` (Task 1).
- Produces:
  - `interface CareCriteriaTableProps { blocks: FormulaBlocks; locked: string[]; minPercent?: number; maxPercent?: number; onSliderChange: (key: CareDimensionKey, percent: number) => void; onSliderCommit: (key: CareDimensionKey, percent: number) => void; onToggleLock: (key: CareDimensionKey) => void; onProbar: (key: CareDimensionKey) => void; }`
  - `default export function CareCriteriaTable(props): JSX.Element`
  - Render contract: one `TableRow` per `CARE_DIMENSIONS` (order preserved). `data-testid="care-chip-<key>"` (Greek chip), `data-testid="care-percent-<key>"` (true integer %, even if the slider clamps), `data-testid="care-slider-<key>"` (MUI `Slider`, min `minPercent`/default 0, max `maxPercent`/default 40, step 1), `data-testid="care-lock-<key>"` (IconButton), `data-testid="care-probar-<key>"` (Button). Locked rows have a `disabled` slider **input**.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/components/care/CareCriteriaTable.test.tsx`:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import CareCriteriaTable from "./CareCriteriaTable";
import { CARE_DIMENSIONS, CANONICAL_BLOCK_WEIGHTS } from "../../constants/careDimensions";

const canonical = { ...CANONICAL_BLOCK_WEIGHTS };

const setup = (overrides: Record<string, unknown> = {}) => {
  const props = {
    blocks: canonical,
    locked: [] as string[],
    onSliderChange: jest.fn(),
    onSliderCommit: jest.fn(),
    onToggleLock: jest.fn(),
    onProbar: jest.fn(),
    ...overrides,
  };
  render(<CareCriteriaTable {...props} />);
  return props;
};

const sliderInput = (key: string): HTMLInputElement =>
  screen.getByTestId(`care-slider-${key}`).querySelector("input") as HTMLInputElement;

describe("CareCriteriaTable", () => {
  it("renders the 7 canonical labels and Dirac chips", () => {
    setup();
    CARE_DIMENSIONS.forEach((d) => {
      expect(screen.getByText(d.label)).toBeInTheDocument();
      expect(screen.getByTestId(`care-chip-${d.key}`)).toHaveTextContent(d.chip);
    });
  });

  it("shows each weight as a rounded percentage", () => {
    setup();
    expect(screen.getByTestId("care-percent-values")).toHaveTextContent("36%");
    expect(screen.getByTestId("care-percent-music")).toHaveTextContent("11%");
  });

  it("emits onSliderChange with the dimension key and integer percent", () => {
    const props = setup();
    fireEvent.change(sliderInput("values"), { target: { value: "40" } });
    expect(props.onSliderChange).toHaveBeenCalledWith("values", 40);
  });

  it("emits onToggleLock with the dimension key", () => {
    const props = setup();
    fireEvent.click(screen.getByTestId("care-lock-music"));
    expect(props.onToggleLock).toHaveBeenCalledWith("music");
  });

  it("emits onProbar with the dimension key", () => {
    const props = setup();
    fireEvent.click(screen.getByTestId("care-probar-values"));
    expect(props.onProbar).toHaveBeenCalledWith("values");
  });

  it("disables the slider input of a locked dimension only", () => {
    setup({ locked: ["values"] });
    expect(sliderInput("values").disabled).toBe(true);
    expect(sliderInput("music").disabled).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/components/care/CareCriteriaTable.test.tsx --ci`
Expected: FAIL — "Cannot find module './CareCriteriaTable'".

- [ ] **Step 3: Write minimal implementation**

Create `frontend/src/components/care/CareCriteriaTable.tsx`:

```tsx
import {
  Box,
  Button,
  IconButton,
  Paper,
  Slider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import {
  CARE_DIMENSIONS,
  type CareDimensionKey,
} from "../../constants/careDimensions";
import type { FormulaBlocks } from "../../services/careFormulaService";
import { percentOf } from "../../utils/careCriteriaModel";

export interface CareCriteriaTableProps {
  /** Editable weights, stored as fractions (0–1). */
  blocks: FormulaBlocks;
  /** Keys currently locked (excluded from normalization). */
  locked: string[];
  /** Slider floor in percent (default 0). */
  minPercent?: number;
  /** Slider ceiling in percent (default 40, per spec). */
  maxPercent?: number;
  onSliderChange: (key: CareDimensionKey, percent: number) => void;
  onSliderCommit: (key: CareDimensionKey, percent: number) => void;
  onToggleLock: (key: CareDimensionKey) => void;
  onProbar: (key: CareDimensionKey) => void;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/**
 * Presentational editor for the 7 canonical CARE weights (matrix M).
 * Emits intent only — no state, no network — so the container page owns logic.
 */
export default function CareCriteriaTable({
  blocks,
  locked,
  minPercent = 0,
  maxPercent = 40,
  onSliderChange,
  onSliderCommit,
  onToggleLock,
  onProbar,
}: CareCriteriaTableProps) {
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: "action.hover" }}>
            <TableCell width="40%">Dimensión (Matriz M)</TableCell>
            <TableCell width="40%">Peso</TableCell>
            <TableCell width="10%">Bloqueo</TableCell>
            <TableCell align="right" width="10%">
              Acciones
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {CARE_DIMENSIONS.map((dim) => {
            const isLocked = locked.includes(dim.key);
            const percent = percentOf(blocks[dim.key]);
            return (
              <TableRow key={dim.key} hover data-testid={`criteria-row-${dim.key}`}>
                <TableCell>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                    <Box
                      data-testid={`care-chip-${dim.key}`}
                      sx={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.8rem",
                        fontWeight: 800,
                        color: "#fff",
                        bgcolor: dim.color,
                      }}
                    >
                      {dim.chip}
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {dim.label}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Slider
                      data-testid={`care-slider-${dim.key}`}
                      value={clamp(percent, minPercent, maxPercent)}
                      min={minPercent}
                      max={maxPercent}
                      step={1}
                      size="small"
                      disabled={isLocked}
                      onChange={(_, v) =>
                        onSliderChange(dim.key, Array.isArray(v) ? v[0] : v)
                      }
                      onChangeCommitted={(_, v) =>
                        onSliderCommit(dim.key, Array.isArray(v) ? v[0] : v)
                      }
                      sx={{ flexGrow: 1 }}
                    />
                    <Typography
                      variant="body2"
                      data-testid={`care-percent-${dim.key}`}
                      sx={{ minWidth: 44, fontWeight: 800 }}
                    >
                      {percent}%
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Tooltip title={isLocked ? "Desbloquear" : "Bloquear"}>
                    <IconButton
                      data-testid={`care-lock-${dim.key}`}
                      size="small"
                      color={isLocked ? "primary" : "default"}
                      onClick={() => onToggleLock(dim.key)}
                    >
                      {isLocked ? (
                        <LockIcon fontSize="small" />
                      ) : (
                        <LockOpenIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>
                </TableCell>
                <TableCell align="right">
                  <Button
                    data-testid={`care-probar-${dim.key}`}
                    size="small"
                    startIcon={<PlayArrowIcon />}
                    onClick={() => onProbar(dim.key)}
                  >
                    Probar
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
```

> Note: the slider handle is clamped to `maxPercent` (40 per spec), but `care-percent-<key>` always shows the true rounded weight — so a value pushed above 40% by `normalizar` (possible only when many rows are locked) is still visible.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/components/care/CareCriteriaTable.test.tsx --ci`
Expected: PASS (6 tests).

- [ ] **Step 5: Typecheck + commit**

Run: `npm run typecheck`
Expected: no new errors.

```bash
git add frontend/src/components/care/CareCriteriaTable.tsx frontend/src/components/care/CareCriteriaTable.test.tsx
git commit -m "feat(care-ui): tabla presentacional CareCriteriaTable (7 dimensiones)"
```

---

### Task 3: Rewrite `criteria.tsx` — load, KPIs, table, live badge, `Normalizar`, `Probar`

**Files:**
- Modify (full rewrite): `frontend/src/pages/portal-redthread/care/criteria.tsx`
- Test (new): `frontend/src/pages/portal-redthread/care/criteria.test.tsx`

**Interfaces:**
- Consumes: `getActiveFormula`, `normalizeFormulaBlocks` and types `CareFormula`, `FormulaBlocks` from `../../../services/careFormulaService`; `CareCriteriaTable` from `../../../components/care/CareCriteriaTable` (Task 2); `encodeEquationDraft`, `formatActiveVersion`, `formatChaos`, `isBalanced`, `toggleLocked`, `totalPercent`, `withFraction` from `../../../utils/careCriteriaModel` (Task 1); `AdminLayout`; `next/router`.
- Produces: default export `CareCriteriaPage`. Handlers passed to the table: `onSliderChange`, `onSliderCommit` (normalizes via `POST /formula/normalizar`), `onToggleLock`, `onProbar` (`router.push({ pathname: "/portal-redthread/care/equation", query: encodeEquationDraft(blocks, key) })`). `data-testid`s: `criteria-loading`, `criteria-error`, `kpi-total`, `kpi-total-badge`, `kpi-version`, `kpi-chaos`. No modal/save yet (Task 4 adds it).

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/pages/portal-redthread/care/criteria.test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CareCriteriaPage from "./criteria";
import {
  getActiveFormula,
  normalizeFormulaBlocks,
} from "../../../services/careFormulaService";
import { CANONICAL_BLOCK_WEIGHTS } from "../../../constants/careDimensions";

const mockPush = jest.fn();
jest.mock("next/router", () => ({ useRouter: () => ({ push: mockPush }) }));

jest.mock("../../../components/layout/AdminLayout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("../../../components/care/CareCriteriaTable", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props: {
      onSliderChange: (k: string, p: number) => void;
      onSliderCommit: (k: string, p: number) => void;
      onToggleLock: (k: string) => void;
      onProbar: (k: string) => void;
    }) =>
      React.createElement(
        "div",
        { "data-testid": "criteria-table" },
        React.createElement("button", {
          "data-testid": "stub-slide-values",
          onClick: () => props.onSliderChange("values", 40),
        }),
        React.createElement("button", {
          "data-testid": "stub-commit-values",
          onClick: () => props.onSliderCommit("values", 40),
        }),
        React.createElement("button", {
          "data-testid": "stub-lock-values",
          onClick: () => props.onToggleLock("values"),
        }),
        React.createElement("button", {
          "data-testid": "stub-probar-values",
          onClick: () => props.onProbar("values"),
        }),
      ),
  };
});

jest.mock("../../../services/careFormulaService", () => ({
  __esModule: true,
  getActiveFormula: jest.fn(),
  normalizeFormulaBlocks: jest.fn(),
}));

const mockGetActive = getActiveFormula as jest.Mock;
const mockNormalize = normalizeFormulaBlocks as jest.Mock;

const active = {
  version: 3,
  status: "active",
  blocks: { ...CANONICAL_BLOCK_WEIGHTS },
  chaos_factor: 5,
  chaos_seed: null,
  min_compatibility: 0,
  match_critical: 0.15,
  changelog: "seed",
  created_by: "maria",
  created_at: "2026-10-16T12:00:00Z",
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetActive.mockResolvedValue(active);
  mockNormalize.mockImplementation(async (blocks: Record<string, number>) => ({
    blocks,
  }));
});

describe("CareCriteriaPage", () => {
  it("shows a loading indicator before the active formula resolves", () => {
    mockGetActive.mockReturnValue(new Promise(() => {}));
    render(<CareCriteriaPage />);
    expect(screen.getByTestId("criteria-loading")).toBeInTheDocument();
  });

  it("loads the active formula exactly once and renders the three KPIs", async () => {
    render(<CareCriteriaPage />);
    expect(await screen.findByTestId("kpi-total")).toHaveTextContent("100%");
    expect(screen.getByTestId("kpi-total-badge")).toHaveTextContent("Válido");
    expect(screen.getByTestId("kpi-version")).toHaveTextContent("v3 · 2026-10-16 · maria");
    expect(screen.getByTestId("kpi-chaos")).toHaveTextContent("±5% · seed aleatoria");
    expect(mockGetActive).toHaveBeenCalledTimes(1);
  });

  it("does not render the legacy 'Identidades Detectadas' KPI", async () => {
    render(<CareCriteriaPage />);
    await screen.findByTestId("kpi-total");
    expect(screen.queryByText(/Identidades Detectadas/)).not.toBeInTheDocument();
  });

  it("renders an error state when the active formula fails to load", async () => {
    mockGetActive.mockRejectedValueOnce(new Error("boom"));
    render(<CareCriteriaPage />);
    expect(await screen.findByTestId("criteria-error")).toHaveTextContent(
      "No se pudo cargar la fórmula activa.",
    );
  });

  it("normalizes on slider commit with the current blocks and locks", async () => {
    render(<CareCriteriaPage />);
    await screen.findByTestId("kpi-total");
    fireEvent.click(screen.getByTestId("stub-lock-values"));
    fireEvent.click(screen.getByTestId("stub-commit-values"));
    await waitFor(() => expect(mockNormalize).toHaveBeenCalledTimes(1));
    expect(mockNormalize).toHaveBeenCalledWith(
      expect.objectContaining({ values: 0.4 }),
      ["values"],
    );
  });

  it("normalizes via the Normalizar button", async () => {
    render(<CareCriteriaPage />);
    await screen.findByTestId("kpi-total");
    fireEvent.click(screen.getByRole("button", { name: /Normalizar/i }));
    await waitFor(() => expect(mockNormalize).toHaveBeenCalledTimes(1));
    expect(mockNormalize).toHaveBeenCalledWith(
      expect.objectContaining({ values: 0.36 }),
      [],
    );
  });

  it("navigates to equation on Probar, passing the draft and focus row", async () => {
    render(<CareCriteriaPage />);
    await screen.findByTestId("kpi-total");
    fireEvent.click(screen.getByTestId("stub-probar-values"));
    expect(mockPush).toHaveBeenCalledTimes(1);
    const arg = mockPush.mock.calls[0][0];
    expect(arg.pathname).toBe("/portal-redthread/care/equation");
    expect(arg.query.source).toBe("criteria");
    expect(arg.query.focus).toBe("values");
    expect(JSON.parse(arg.query.w)).toEqual(active.blocks);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/pages/portal-redthread/care/criteria.test.tsx --ci`
Expected: FAIL — the current page renders legacy content and never calls `getActiveFormula`/`normalizeFormulaBlocks`.

- [ ] **Step 3: Rewrite the page**

Replace the entire contents of `frontend/src/pages/portal-redthread/care/criteria.tsx` with:

```tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Paper,
  Typography,
} from "@mui/material";
import BarChartIcon from "@mui/icons-material/BarChart";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import TuneIcon from "@mui/icons-material/Tune";
import WarningIcon from "@mui/icons-material/Warning";
import AdminLayout from "../../../components/layout/AdminLayout";
import CareCriteriaTable from "../../../components/care/CareCriteriaTable";
import type { CareDimensionKey } from "../../../constants/careDimensions";
import {
  getActiveFormula,
  normalizeFormulaBlocks,
  type CareFormula,
  type FormulaBlocks,
} from "../../../services/careFormulaService";
import {
  encodeEquationDraft,
  formatActiveVersion,
  formatChaos,
  isBalanced,
  toggleLocked,
  totalPercent,
  withFraction,
} from "../../../utils/careCriteriaModel";

const EQUATION_PATH = "/portal-redthread/care/equation";

export default function CareCriteriaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [normalizing, setNormalizing] = useState(false);
  const [formula, setFormula] = useState<CareFormula | null>(null);
  const [blocks, setBlocks] = useState<FormulaBlocks>({});
  const [locked, setLocked] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const active = await getActiveFormula();
        if (cancelled) return;
        setFormula(active);
        setBlocks({ ...active.blocks });
      } catch {
        if (!cancelled) setError("No se pudo cargar la fórmula activa.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const balanced = isBalanced(blocks);

  const handleSliderChange = (key: CareDimensionKey, percent: number) => {
    if (locked.includes(key)) return;
    setBlocks((prev) => withFraction(prev, key, percent));
  };

  const handleSliderCommit = async (key: CareDimensionKey, percent: number) => {
    if (locked.includes(key)) return;
    setError(null);
    try {
      const { blocks: normalized } = await normalizeFormulaBlocks(
        withFraction(blocks, key, percent),
        locked,
      );
      setBlocks(normalized);
    } catch {
      setError("No se pudieron normalizar los pesos.");
    }
  };

  const handleToggleLock = (key: CareDimensionKey) => {
    setLocked((prev) => toggleLocked(prev, key));
  };

  const handleNormalizar = async () => {
    setNormalizing(true);
    setError(null);
    try {
      const { blocks: normalized } = await normalizeFormulaBlocks(blocks, locked);
      setBlocks(normalized);
    } catch {
      setError("No se pudieron normalizar los pesos (revisa los bloqueos).");
    } finally {
      setNormalizing(false);
    }
  };

  const handleProbar = (key: CareDimensionKey) => {
    void router.push({
      pathname: EQUATION_PATH,
      query: encodeEquationDraft(blocks, key),
    });
  };

  return (
    <AdminLayout>
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 4,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Box
                sx={{
                  bgcolor: "primary.main",
                  p: 1.5,
                  borderRadius: "8px",
                  display: "flex",
                  mr: 2,
                  boxShadow: "0 4px 12px rgba(255,77,79,0.3)",
                }}
              >
                <BarChartIcon sx={{ fontSize: 32, color: "white" }} />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-0.5px" }}>
                  Panel de Criterios
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Pesos canónicos de la matriz CARE M (7 dimensiones, suma 100%).
                </Typography>
              </Box>
            </Box>
            <Button
              variant="outlined"
              startIcon={<TuneIcon />}
              onClick={handleNormalizar}
              disabled={normalizing || loading}
            >
              {normalizing ? "Normalizando..." : "Normalizar"}
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} data-testid="criteria-error">
              {error}
            </Alert>
          )}

          {loading ? (
            <Box
              sx={{ display: "flex", justifyContent: "center", py: 8 }}
              data-testid="criteria-loading"
            >
              <CircularProgress />
            </Box>
          ) : formula ? (
            <>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      textAlign: "center",
                      borderColor: balanced ? "success.light" : "error.light",
                      borderStyle: "dashed",
                    }}
                  >
                    <Typography variant="overline" sx={{ color: "text.secondary" }}>
                      Total Ponderado
                    </Typography>
                    <Typography
                      variant="h4"
                      data-testid="kpi-total"
                      color={balanced ? "success.main" : "error.main"}
                      sx={{ fontWeight: 800 }}
                    >
                      {totalPercent(blocks)}%
                    </Typography>
                    <Chip
                      data-testid="kpi-total-badge"
                      icon={balanced ? <CheckCircleIcon /> : <WarningIcon />}
                      label={balanced ? "Válido" : "Inválido"}
                      size="small"
                      color={balanced ? "success" : "error"}
                      variant="outlined"
                      sx={{ mt: 1 }}
                    />
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
                    <Typography variant="overline" sx={{ color: "text.secondary" }}>
                      Versión Activa
                    </Typography>
                    <Typography
                      variant="h6"
                      data-testid="kpi-version"
                      sx={{ fontWeight: 800, mt: 1 }}
                    >
                      {formatActiveVersion(formula)}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
                    <Typography variant="overline" sx={{ color: "text.secondary" }}>
                      Caos Actual
                    </Typography>
                    <Typography
                      variant="h6"
                      data-testid="kpi-chaos"
                      sx={{ fontWeight: 800, mt: 1 }}
                    >
                      {formatChaos(formula.chaos_factor, formula.chaos_seed)}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <CareCriteriaTable
                blocks={blocks}
                locked={locked}
                onSliderChange={handleSliderChange}
                onSliderCommit={handleSliderCommit}
                onToggleLock={handleToggleLock}
                onProbar={handleProbar}
              />
            </>
          ) : null}
        </Box>
      </Container>
    </AdminLayout>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest src/pages/portal-redthread/care/criteria.test.tsx --ci`
Expected: PASS (7 tests).

- [ ] **Step 5: Typecheck + lint + commit**

Run: `npm run typecheck`
Run: `npm run lint`
Expected: no new errors in the touched files.

```bash
git add frontend/src/pages/portal-redthread/care/criteria.tsx frontend/src/pages/portal-redthread/care/criteria.test.tsx
git commit -m "feat(care-ui): criteria carga formula activa, KPIs y tabla; normalizar y probar"
```

---

### Task 4: `Aplicar Cambios` modal — preview + changelog → `save` (409/422)

**Files:**
- Modify: `frontend/src/pages/portal-redthread/care/criteria.tsx` (add modal + save)
- Modify: `frontend/src/pages/portal-redthread/care/criteria.test.tsx` (add save tests)

**Interfaces:**
- Consumes: everything from Task 3, plus `saveFormula` and type `FormulaPayload` from `careFormulaService`; `computeDeltas`, `saveErrorMessage` from `careCriteriaModel`.
- Produces: an `Aplicar Cambios` button (`data-testid="open-save-modal"`, disabled unless `isBalanced(blocks) && !saving`) that opens a MUI `Dialog` (`data-testid="save-modal"`). The dialog shows the sum (`data-testid="modal-sum"`) and one row per changed dimension (`data-testid="delta-<key>"`, text `Label: +Δ%`/`-Δ%`) or `Sin cambios respecto a vN`; a required changelog `TextField` (`data-testid="changelog-input"`); a `Guardar` button (`data-testid="modal-save"`, disabled while changelog blank or saving); and an error `Alert` (`data-testid="save-error"`). On success the dialog closes and a success `Alert` (`data-testid="criteria-success"`, text contains `v{saved.version}`) appears. `handleSave` runs `normalizeFormulaBlocks(blocks, locked)` first (forces exact sum 1.0), then `saveFormula(payload, "criteria")` with `payload = { version: formula.version, blocks: exact, chaos_factor: formula.chaos_factor, chaos_seed: formula.chaos_seed, min_compatibility: formula.min_compatibility, match_critical: formula.match_critical, changelog: changelog.trim() }`.

- [ ] **Step 1: Write the failing tests**

In `frontend/src/pages/portal-redthread/care/criteria.test.tsx`:

1. Extend the service mock (replace the existing `jest.mock("../../../services/careFormulaService", ...)` block) to include `saveFormula`:
```tsx
jest.mock("../../../services/careFormulaService", () => ({
  __esModule: true,
  getActiveFormula: jest.fn(),
  normalizeFormulaBlocks: jest.fn(),
  saveFormula: jest.fn(),
}));
```
2. Extend the import and add the new mock handle (below the existing `mockNormalize` line):
```tsx
import {
  getActiveFormula,
  normalizeFormulaBlocks,
  saveFormula,
} from "../../../services/careFormulaService";
// ...
const mockSave = saveFormula as jest.Mock;
```
3. In `beforeEach`, add:
```tsx
  mockSave.mockResolvedValue({ ...active, version: 4 });
```
4. Append this new `describe` block at the end of the file:

```tsx
describe("CareCriteriaPage / Aplicar Cambios", () => {
  const openModal = async () => {
    render(<CareCriteriaPage />);
    await screen.findByTestId("kpi-total");
    fireEvent.click(screen.getByTestId("open-save-modal"));
    return screen.findByTestId("save-modal");
  };

  const typeChangelog = (text: string) => {
    const textarea = screen
      .getByTestId("changelog-input")
      .querySelector("textarea") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: text } });
  };

  it("disables Aplicar Cambios when the sum is not 100%", async () => {
    render(<CareCriteriaPage />);
    await screen.findByTestId("kpi-total");
    fireEvent.click(screen.getByTestId("stub-slide-values"));
    expect(screen.getByTestId("open-save-modal")).toBeDisabled();
  });

  it("shows the sum and 'sin cambios' when nothing changed", async () => {
    await openModal();
    expect(screen.getByTestId("modal-sum")).toHaveTextContent("100%");
    expect(screen.getByText(/Sin cambios respecto a v3/i)).toBeInTheDocument();
  });

  it("requires a non-empty changelog before enabling Guardar", async () => {
    await openModal();
    expect(screen.getByTestId("modal-save")).toBeDisabled();
    typeChangelog("ajuste de pesos");
    expect(screen.getByTestId("modal-save")).not.toBeDisabled();
  });

  it("normalizes then saves with source 'criteria' and the typed changelog", async () => {
    await openModal();
    typeChangelog("ajuste de pesos");
    fireEvent.click(screen.getByTestId("modal-save"));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));
    expect(mockNormalize).toHaveBeenCalled();
    const [payload, source] = mockSave.mock.calls[0];
    expect(source).toBe("criteria");
    expect(payload.changelog).toBe("ajuste de pesos");
    expect(payload.blocks).toEqual(active.blocks);
    expect(payload.chaos_factor).toBe(5);
    expect(payload.match_critical).toBe(0.15);
    expect(await screen.findByTestId("criteria-success")).toHaveTextContent("v4");
  });

  it("surfaces a 409 (no change vs active) message and keeps the modal open", async () => {
    mockSave.mockRejectedValueOnce({
      response: {
        status: 409,
        data: { detail: "La fórmula no cambió respecto a la versión activa" },
      },
    });
    await openModal();
    typeChangelog("sin cambios");
    fireEvent.click(screen.getByTestId("modal-save"));
    expect(await screen.findByTestId("save-error")).toHaveTextContent(
      "La fórmula no cambió respecto a la versión activa",
    );
    expect(screen.getByTestId("save-modal")).toBeInTheDocument();
  });

  it("surfaces a 422 validation error (array detail)", async () => {
    mockSave.mockRejectedValueOnce({
      response: {
        status: 422,
        data: { detail: ["La suma de pesos debe ser exactamente 1.0"] },
      },
    });
    await openModal();
    typeChangelog("roto");
    fireEvent.click(screen.getByTestId("modal-save"));
    expect(await screen.findByTestId("save-error")).toHaveTextContent(
      "La suma de pesos debe ser exactamente 1.0",
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/pages/portal-redthread/care/criteria.test.tsx --ci`
Expected: FAIL — `open-save-modal` / `save-modal` not found.

- [ ] **Step 3: Add the modal + save handler**

In `frontend/src/pages/portal-redthread/care/criteria.tsx`:

1. Extend the MUI import list to add `Dialog`, `DialogActions`, `DialogContent`, `DialogTitle`, `Stack`, `TextField`, and add the `SaveIcon` + `ScienceIcon`-free imports:

```tsx
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
```

2. Extend the service import to add `saveFormula` and `type FormulaPayload`:

```tsx
import {
  getActiveFormula,
  normalizeFormulaBlocks,
  saveFormula,
  type CareFormula,
  type FormulaBlocks,
  type FormulaPayload,
} from "../../../services/careFormulaService";
```

3. Extend the model import to add `computeDeltas` and `saveErrorMessage`:

```tsx
import {
  computeDeltas,
  encodeEquationDraft,
  formatActiveVersion,
  formatChaos,
  isBalanced,
  saveErrorMessage,
  toggleLocked,
  totalPercent,
  withFraction,
} from "../../../utils/careCriteriaModel";
```

4. Add these state hooks inside the component (after the existing `locked` state):

```tsx
  const [modalOpen, setModalOpen] = useState(false);
  const [changelog, setChangelog] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
```

5. Add these handlers (after `handleProbar`):

```tsx
  const handleOpenModal = () => {
    setSaveError(null);
    setSaveSuccess(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    if (saving) return;
    setModalOpen(false);
  };

  const handleSave = async () => {
    if (!formula) return;
    setSaving(true);
    setSaveError(null);
    try {
      const { blocks: exact } = await normalizeFormulaBlocks(blocks, locked);
      const payload: FormulaPayload = {
        version: formula.version,
        blocks: exact,
        chaos_factor: formula.chaos_factor,
        chaos_seed: formula.chaos_seed,
        min_compatibility: formula.min_compatibility,
        match_critical: formula.match_critical,
        changelog: changelog.trim(),
      };
      const saved = await saveFormula(payload, "criteria");
      setFormula(saved);
      setBlocks({ ...saved.blocks });
      setModalOpen(false);
      setChangelog("");
      setSaveSuccess(`Versión v${saved.version} guardada.`);
    } catch (err) {
      setSaveError(saveErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };
```

6. Replace the header action area (the single `<Button …Normalizar…>` element) with a right-aligned `Stack` containing both buttons:

```tsx
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<TuneIcon />}
                onClick={handleNormalizar}
                disabled={normalizing || loading}
              >
                {normalizing ? "Normalizando..." : "Normalizar"}
              </Button>
              <Button
                data-testid="open-save-modal"
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleOpenModal}
                disabled={!balanced || saving || loading}
              >
                Aplicar Cambios
              </Button>
            </Stack>
```

7. Add the success alert just below the existing `{error && (…)}` alert:

```tsx
          {saveSuccess && (
            <Alert severity="success" sx={{ mb: 3 }} data-testid="criteria-success">
              {saveSuccess}
            </Alert>
          )}
```

8. Add the dialog just before the closing `</Box>` of the page body (after the `{loading ? … : formula ? … : null}` expression, still inside `<Box sx={{ py: 4 }}>`):

```tsx
          <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth data-testid="save-modal">
            <DialogTitle>Aplicar cambios</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Typography variant="body2" data-testid="modal-sum" sx={{ fontWeight: 700 }}>
                  Suma: {totalPercent(blocks)}%
                </Typography>

                {formula &&
                  (computeDeltas(formula.blocks, blocks).length === 0 ? (
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      Sin cambios respecto a v{formula.version}
                    </Typography>
                  ) : (
                    computeDeltas(formula.blocks, blocks).map((delta) => (
                      <Typography
                        key={delta.key}
                        variant="body2"
                        data-testid={`delta-${delta.key}`}
                      >
                        {delta.label}: {delta.deltaPercent > 0 ? "+" : ""}
                        {delta.deltaPercent}%
                      </Typography>
                    ))
                  ))}

                <TextField
                  data-testid="changelog-input"
                  label="Changelog"
                  required
                  multiline
                  minRows={2}
                  fullWidth
                  value={changelog}
                  onChange={(e) => setChangelog(e.target.value)}
                  helperText="Describe el motivo del cambio (obligatorio)."
                />

                {saveError && (
                  <Alert severity="error" data-testid="save-error">
                    {saveError}
                  </Alert>
                )}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseModal} disabled={saving}>
                Cancelar
              </Button>
              <Button
                data-testid="modal-save"
                variant="contained"
                onClick={handleSave}
                disabled={changelog.trim().length === 0 || saving}
              >
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </DialogActions>
          </Dialog>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest src/pages/portal-redthread/care/criteria.test.tsx --ci`
Expected: PASS (13 tests total in the file).

- [ ] **Step 5: Full check + commit**

Run: `npx jest src/utils/careCriteriaModel.test.ts src/components/care/CareCriteriaTable.test.tsx src/pages/portal-redthread/care/criteria.test.tsx --ci`
Run: `npm run typecheck`
Run: `npm run lint`
Expected: all green; no new type or lint errors.

```bash
git add frontend/src/pages/portal-redthread/care/criteria.tsx frontend/src/pages/portal-redthread/care/criteria.test.tsx
git commit -m "feat(care-ui): modal Aplicar Cambios con changelog obligatorio y save (409/422)"
```

---

## Self-Review

**Spec coverage (`### criteria.tsx`):**
- Single data source `GET /formula/active`, two legacy GETs removed → Task 3 (page rewrite imports only `getActiveFormula`) ✓
- Loading + error states → Task 3 (Step 1 tests `criteria-loading` / `criteria-error`) ✓
- Table of 7 canonical rows: Spanish label + Dirac chip + weight slider (0–40%) + per-row lock → Task 2 (real component test) + Task 3 wiring ✓
- Editing an unlocked slider redistributes/normalizes via `POST /formula/normalizar` respecting the locked set; UI % from fraction blocks → Task 1 (`withFraction`) + Task 3 (`handleSliderCommit` calls `normalizeFormulaBlocks(blocks, locked)`) ✓
- KPI 1: live weighted total with 100% green / ≠100% red badge → Task 3 (`kpi-total` / `kpi-total-badge`, `isBalanced`) ✓
- KPI 2: active version `vN · date · admin` → Task 1 `formatActiveVersion` + Task 3 `kpi-version` ✓
- KPI 3: chaos `±X% · seed fijada|aleatoria` → Task 1 `formatChaos` + Task 3 `kpi-chaos` ✓
- REMOVE legacy "Identidades Detectadas 18" → Task 3 (legacy page fully replaced; test asserts its absence) ✓
- `Normalizar` button → `POST /formula/normalizar` with current blocks + locked keys → Task 3 (`handleNormalizar`) ✓
- `Aplicar Cambios` disabled unless sum === 100% → opens modal with mini preview (sum + deltas vs active) AND requires non-empty changelog → `POST /formula/save` with `source: "criteria"`; 409 and 422 surfaced → Task 4 ✓
- `Probar` per row → navigate to equation with edited formula + emphasized row → Task 1 codec + Task 3 `handleProbar` (query `source`/`focus`/`w`) ✓
- No new i18n keys; hardcoded Spanish; `CARE_DIMENSIONS` labels directly → all tasks (no `t()`) ✓
- No new dependencies → Global Constraints; nothing added ✓

**Placeholder scan:** no TBD/TODO. Every code step contains complete code. Task 4 gives exact insertions/anchor points rather than a full re-paste of the file (the file is fully specified across Tasks 3–4 and the two are sequential edits to the same file) — this is a concrete instruction, not a placeholder.

**Type consistency:** `FormulaBlocks` / `CareFormula` / `FormulaPayload` come from the existing `careFormulaService.ts` and are reused verbatim. `CareDimensionKey`, `CARE_DIMENSIONS`, `CARE_DIMENSION_KEYS`, `CANONICAL_BLOCK_WEIGHTS` come from the existing `careDimensions.ts`. Helper names used by the component and page (`percentOf`, `withFraction`, `isBalanced`, `totalPercent`, `toggleLocked`, `formatActiveVersion`, `formatChaos`, `computeDeltas`, `encodeEquationDraft`, `decodeEquationDraft`, `saveErrorMessage`) are all defined in Task 1 and consumed only with those exact signatures. `CareCriteriaTableProps` (`blocks`, `locked`, `minPercent`, `maxPercent`, `onSliderChange`, `onSliderCommit`, `onToggleLock`, `onProbar`) is fixed in Task 2 and matched by the page in Task 3.

**Ordering note / deviation from the suggested split:** `Probar` navigation is delivered in Task 3 (it needs only the Task 1 codec and the Task 2 callback) so the table's `onProbar` prop is never a no-op; Task 4 then isolates the save path (modal + `save` + 409/422). This keeps both tasks independently testable and committable.
