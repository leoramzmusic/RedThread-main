# CARE Formula Interpreter (Bloque 5) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `frontend/src/pages/portal-redthread/care/interpreter.tsx` into the real CARE explainability page: two `user_id` inputs + a 5-tone selector driving `POST /formula/preview` with the **active** formula, a real **Score Breakdown** (7 rows showing fᵢ, wᵢ and the contribution wᵢ·fᵢ, computed from the active weights × the returned fᵢ), a narrative trio (χ, base, final/saturated) with the backend `compatibility_label`, the backend narrative `{tone,text,label}`, and an **Exportar Reporte** JSON download — removing the hardcoded mock `usuario_12345` and the "24 fragmentos" copy.

**Architecture:** Three layers. (1) A pure, dependency-free model module (`careInterpreterModel.ts`) owning the contribution math (`wᵢ·fᵢ`), the band-label resolution, the exportable report object, the download filename and the client-side Blob download — all unit-tested. (2) Presentational components under `frontend/src/components/care/` (`CareScoreBreakdown` renders the 7 three-value rows; `CareNarrativeTrio` renders χ/base/final/saturated + label + narrative). (3) A container page (`interpreter.tsx`) that loads `GET /formula/active`, owns the input/tone state, and calls `careFormulaService.previewFormula`. No new dependencies; admin copy is hardcoded Spanish (spec decision 11).

**Tech Stack:** Next.js (Pages Router), React 19, MUI (`@mui/material` + `@mui/icons-material`), TypeScript, axios client via `careFormulaService`, Jest + @testing-library/react.

**Spec:** `docs/superpowers/specs/2026-10-15-care-formula-dirac-design.md` (see `### interpreter.tsx`, `### Endpoints`, `## Decisiones aprobadas`, `## Tests y verificación`).

## Global Constraints

- **No new dependencies** (spec §Tests). Do not touch `package.json`. The report download uses `Blob` + `URL.createObjectURL` + an anchor click — no libraries.
- **Admin pages are hardcoded Spanish** (spec decision 11). Never call `t()` on this page. Use `CARE_DIMENSIONS[].label` (already Spanish) and literal Spanish strings.
- **No new i18n keys.** Do not add anything to `public/locales/**`.
- **Backend endpoint prefix:** `/portal-redthread/experiencia/algoritmos` (registered in `backend/src/main.py`). Formula routes live under `/formula/*`.
- **API access:** the page must consume `frontend/src/services/careFormulaService.ts` functions (`getActiveFormula`, `previewFormula`). That service already imports the **named** `adminApiClient` from `frontend/src/services/api.ts`. Do NOT import `adminApiClient` into the page, and do NOT call axios directly. Cookies + 401-refresh are handled by `services/api.ts`; never manage tokens manually.
- **MUI `sx` gotcha:** this repo rejects numeric `borderRadius` in `sx` — always use px strings (`borderRadius: "8px"`, `borderRadius: "50%"`).
- **Do not modify** `careDimensions.ts`, `careFormulaService.ts`, `careEquationModel.ts`, `CareBreakdownBars.tsx`, or any backend file in this block.
- **Reuse (do not duplicate):** `getActiveFormula` / `previewFormula` from `frontend/src/services/careFormulaService.ts`; `TONE_OPTIONS` / `previewErrorMessage` from `frontend/src/utils/careEquationModel.ts`; the narrative types (`NarrativeResult`, `EvaluationResult`, `FormulaBreakdown`, `PreviewResult`) from `careFormulaService.ts`.
- **Verification commands** (run from `frontend/`):
  - Tests: `npx jest <path> --ci`
  - Typecheck: `npm run typecheck`
  - Lint: `npm run lint`
- **Commits:** local only; never push without the user saying "sube".

## Backend contract (verified against `backend/src/api/admin_algorithms.py` + `backend/src/care/formula/service.py` + `backend/src/care/narrative.py`)

`POST /formula/preview` — body `{ "formula": FormulaPayload, "user_a_id": string, "user_b_id": string, "tone"?: string }` →
```jsonc
{
  "current":  { "score": number, "base": number, "chi": number, "breakdown": Breakdown },
  "proposed": { "score": number, "base": number, "chi": number, "breakdown": Breakdown },
  "deltas":   { "values": number, "relationship_goals": number, ... },   // ONLY the payload block keys
  "chi_current": number,
  "chi_proposed": number,
  "narrative": { "tone": string, "text": string, "label": string }
}
```
where `Breakdown` = the 7 block keys (feature scores fᵢ, 0–1) **plus** `chaos_applied` (number), `saturated` (boolean), `compatibility_label` (string), `final_score` (number). `score = clamp(base + chi)`; `base = Σ wᵢ·fᵢ`; `chi = χ` from `compute_chi`.

Errors:
- **422** — the formula is invalid (detail = a **list of Spanish strings** from `validate_formula_dict`), OR `user_a_id`/`user_b_id` is missing (detail = the single string `"user_a_id y user_b_id son requeridos"`).
- **404** — `"Usuario no encontrado"` (user id not found) or `"Perfil no encontrado"` (no profile for the user).

`tone` defaults to `"directo"`; an unknown tone is coerced to `"directo"` inside `generate_narrative` (valid tones: `directo|poetico|ludico|emocional|curioso`). The service (`previewFormula`) posts the args object untouched — `{ formula, user_a_id, user_b_id, tone? }`.

**`compatibility_label` is produced by the backend** — `admin_algorithms._evaluate` stores `compatibility_label(final)` in `proposed.breakdown.compatibility_label`, and `generate_narrative` echoes it as `narrative.label`. Bands (`service.py:92-99`): `≥0.70 → "Alto"`, `≥0.50 → "Medio"`, `≥0.30 → "Bajo"`, else `"Muy bajo"`.

**`FormulaPayload`** = `{ version?: number, blocks: Record<string, number>, chaos_factor?: number, chaos_seed?: string | null, min_compatibility?: number, match_critical?: number, changelog?: string }` (already defined and exported by `careFormulaService.ts`).

### Spec-vs-reality discrepancies (found during verification — implement per reality)

1. **Interpreter route path.** The spec `### interpreter.tsx` naming and the sibling pages (`criteria.tsx`, `equation.tsx`) use the short form `/care/interpreter`. Reality: the real Pages Router route is **`/portal-redthread/care/interpreter`** (see `AdminSidebar.tsx:215`). Keep the real path (no navigation is added in this block anyway).
2. **`compatibility_label` source.** Spec §Decisiones 9 lists the bands as if the client computes them; in reality the **backend** produces `compatibility_label` (inside `proposed.breakdown` and mirrored as `narrative.label`). The page **renders the backend value**; the pure `bandFromScore` below exists only as a documented fallback (and to keep the bands in one place). Do not recompute-and-override a value the backend already sent.
3. **Band thresholds.** Spec decision 9 writes `≥0.70 Alto · ≥0.50 Medio · <0.50 Bajo · <0.30 Muy bajo` (self-inconsistent). Reality (`service.py:92-99`) is `≥0.70 Alto · ≥0.50 Medio · ≥0.30 Bajo · else Muy bajo`. Implement the **reality** bands; a `0.40` score is `"Bajo"`, `0.25` is `"Muy bajo"`.
4. **`deltas` is a feature difference, not a weight delta.** `deltas[k] = proposed.breakdown[k] − current.breakdown[k]` (per-dimension fᵢ difference). The Interpreter does **not** use `deltas`; it computes the contribution `wᵢ·fᵢ` from the **active formula weights** (`GET /formula/active` → `formula.blocks`) × the returned `proposed` fᵢ. (Spec's "deltas" phrasing belongs to the equation preview parity.)
5. **Report `breakdown` shape is unspecified.** Spec lists `breakdown` in the export payload without a shape. This plan exports the 7 `ContributionRow`s (`fᵢ`, `wᵢ`, `wᵢ·fᵢ`) — i.e. the interpreter's "real Score Breakdown" — not the raw backend breakdown object.
6. **Score-breakdown visualisation.** Spec says "7 barras (fᵢ, wᵢ, contribución wᵢ·fᵢ)". `CareBreakdownBars` renders **single-value** bars only, so the 3-value rows use a **dedicated** `CareScoreBreakdown` (bar width = contribution). `CareBreakdownBars` remains untouched.
7. **Removed mocks (spec `Fuera:`).** The hardcoded `usuario_12345` state and the hardcoded `"24 fragmentos"` chips are deleted.

## File Structure

- **Create** `frontend/src/utils/careInterpreterModel.ts` — pure helpers: `ContributionRow`, `CareReport`, `ReportInput`, `computeContributions`, `bandFromScore`, `resolveBand`, `buildReport`, `reportFilename`, `downloadJson`. One responsibility: interpreter view-model math + report codec (no React, no network).
- **Create** `frontend/src/utils/careInterpreterModel.test.ts` — unit tests.
- **Create** `frontend/src/components/care/CareScoreBreakdown.tsx` — 7 rows (chip + label + fᵢ + wᵢ + contribution bar). (+ `.test.tsx`)
- **Create** `frontend/src/components/care/CareNarrativeTrio.tsx` — χ / base / final(±saturated) + `compatibility_label` + backend narrative. (+ `.test.tsx`)
- **Modify (full rewrite)** `frontend/src/pages/portal-redthread/care/interpreter.tsx` — container page.
- **Create** `frontend/src/pages/portal-redthread/care/interpreter.test.tsx` — page test (mocks `careFormulaService`, `next/router`, `AdminLayout`, the two presentational `care/*` children, and — from Task 4 — `downloadJson`).
- **Modify** `frontend/src/pages/portal-redthread/care/interpreter.tsx` — Task 4 adds the `Exportar Reporte` action.
- **Modify** `frontend/src/pages/portal-redthread/care/interpreter.test.tsx` — Task 4 adds the export tests.

---

### Task 1: `careInterpreterModel.ts` (pure view-model helpers)

**Files:**
- Create: `frontend/src/utils/careInterpreterModel.ts`
- Test: `frontend/src/utils/careInterpreterModel.test.ts`

**Interfaces:**
- Consumes: `CARE_DIMENSIONS`, `CareDimensionKey` from `../constants/careDimensions`; types `FormulaBlocks`, `FormulaBreakdown`, `NarrativeResult` from `../services/careFormulaService`.
- Produces (all named exports):
  - `interface ContributionRow { key: CareDimensionKey; chip: string; label: string; color: string; f: number; w: number; contribution: number }`
  - `interface CareReport { user_a: string; user_b: string; formula_version: number; breakdown: ContributionRow[]; chi: number; narrative: NarrativeResult; tone: string; compatibility_label: string; generated_at: string }`
  - `interface ReportInput { userA: string; userB: string; formulaVersion: number; breakdown: ContributionRow[]; chi: number; narrative: NarrativeResult; tone: string; compatibilityLabel: string }`
  - `computeContributions(weights: FormulaBlocks, breakdown: FormulaBreakdown | null | undefined): ContributionRow[]`
  - `bandFromScore(score: number): string`
  - `resolveBand(label: string | null | undefined, score: number): string`
  - `buildReport(input: ReportInput, generatedAt: string): CareReport`
  - `reportFilename(userA: string, userB: string, generatedAt: string): string`
  - `downloadJson(filename: string, data: unknown): void`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/utils/careInterpreterModel.test.ts`:

```ts
import {
  bandFromScore,
  buildReport,
  computeContributions,
  downloadJson,
  reportFilename,
  resolveBand,
} from "./careInterpreterModel";
import { CANONICAL_BLOCK_WEIGHTS } from "../constants/careDimensions";
import type { FormulaBreakdown } from "../services/careFormulaService";

const canonical = { ...CANONICAL_BLOCK_WEIGHTS };

const breakdown: FormulaBreakdown = {
  values: 0.5,
  relationship_goals: 0.5,
  neurodiversity: 0.5,
  responsiveness: 0.5,
  music: 0.5,
  love_language: 0.5,
  communication_style: 0.5,
  chaos_applied: 0.02,
  saturated: false,
  compatibility_label: "Medio",
  final_score: 0.5,
};

describe("careInterpreterModel / contributions", () => {
  it("computes wᵢ·fᵢ for the 7 canonical dimensions in order", () => {
    const rows = computeContributions(canonical, breakdown);
    expect(rows.map((row) => row.key)).toEqual([
      "values",
      "relationship_goals",
      "neurodiversity",
      "responsiveness",
      "music",
      "love_language",
      "communication_style",
    ]);
    const values = rows[0];
    expect(values.f).toBe(0.5);
    expect(values.w).toBe(0.36);
    expect(values.contribution).toBeCloseTo(0.18, 10);
    expect(values.chip).toBe("α");
  });

  it("treats missing / non-numeric feature scores as 0", () => {
    const rows = computeContributions(canonical, {
      values: 0.8,
    } as FormulaBreakdown);
    expect(rows[0].contribution).toBeCloseTo(0.288, 10);
    expect(rows[1].contribution).toBe(0);
  });

  it("never returns NaN for empty inputs", () => {
    const rows = computeContributions({}, null);
    rows.forEach((row) => {
      expect(row.contribution).toBe(0);
      expect(Number.isNaN(row.contribution)).toBe(false);
    });
  });
});

describe("careInterpreterModel / bands", () => {
  it("maps scores to the backend bands", () => {
    expect(bandFromScore(0.75)).toBe("Alto");
    expect(bandFromScore(0.7)).toBe("Alto");
    expect(bandFromScore(0.6)).toBe("Medio");
    expect(bandFromScore(0.5)).toBe("Medio");
    expect(bandFromScore(0.4)).toBe("Bajo");
    expect(bandFromScore(0.3)).toBe("Bajo");
    expect(bandFromScore(0.1)).toBe("Muy bajo");
  });

  it("prefers the backend label and falls back to the score", () => {
    expect(resolveBand("Media", 0.4)).toBe("Media");
    expect(resolveBand("", 0.4)).toBe("Bajo");
    expect(resolveBand(null, 0.8)).toBe("Alto");
  });
});

describe("careInterpreterModel / report", () => {
  const rows = computeContributions(canonical, breakdown);
  const narrative = { tone: "directo", text: "hola", label: "Medio" };

  it("builds the report object with the spec keys", () => {
    const report = buildReport(
      {
        userA: "u1",
        userB: "u2",
        formulaVersion: 3,
        breakdown: rows,
        chi: 0.02,
        narrative,
        tone: "directo",
        compatibilityLabel: "Medio",
      },
      "2026-10-16T12:34:56.000Z",
    );
    expect(report).toEqual({
      user_a: "u1",
      user_b: "u2",
      formula_version: 3,
      breakdown: rows,
      chi: 0.02,
      narrative,
      tone: "directo",
      compatibility_label: "Medio",
      generated_at: "2026-10-16T12:34:56.000Z",
    });
  });

  it("builds a deterministic, sanitized filename", () => {
    expect(reportFilename("u1", "u2", "2026-10-16T12:34:56.000Z")).toBe(
      "care-report_u1_u2_20261016123456.json",
    );
    expect(reportFilename("a b/c", "u2", "2026-10-16T12:34:56.000Z")).toBe(
      "care-report_a-b-c_u2_20261016123456.json",
    );
  });

  it("triggers a Blob download and revokes the object URL", () => {
    const urlMock = URL as unknown as {
      createObjectURL: jest.Mock;
      revokeObjectURL: jest.Mock;
    };
    urlMock.createObjectURL = jest.fn(() => "blob:mock");
    urlMock.revokeObjectURL = jest.fn();
    const click = jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    downloadJson("r.json", { a: 1 });
    expect(urlMock.createObjectURL).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(urlMock.revokeObjectURL).toHaveBeenCalledWith("blob:mock");
    click.mockRestore();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/utils/careInterpreterModel.test.ts --ci`
Expected: FAIL — "Cannot find module './careInterpreterModel'".

- [ ] **Step 3: Write minimal implementation**

Create `frontend/src/utils/careInterpreterModel.ts`:

```ts
import {
  CARE_DIMENSIONS,
  type CareDimensionKey,
} from "../constants/careDimensions";
import type {
  FormulaBlocks,
  FormulaBreakdown,
  NarrativeResult,
} from "../services/careFormulaService";

/**
 * Pure view-model helpers for the CARE Interpreter (Bloque 5).
 * No React, no network — everything here is unit-testable in isolation.
 * Weights (wᵢ) come from the active formula; feature scores (fᵢ) come from the
 * `/formula/preview` breakdown.
 */

export interface ContributionRow {
  key: CareDimensionKey;
  chip: string;
  label: string;
  color: string;
  /** Feature score fᵢ for the dimension (0–1). */
  f: number;
  /** Active formula weight wᵢ for the dimension (0–1). */
  w: number;
  /** Contribution wᵢ·fᵢ. */
  contribution: number;
}

export interface CareReport {
  user_a: string;
  user_b: string;
  formula_version: number;
  breakdown: ContributionRow[];
  chi: number;
  narrative: NarrativeResult;
  tone: string;
  compatibility_label: string;
  generated_at: string;
}

export interface ReportInput {
  userA: string;
  userB: string;
  formulaVersion: number;
  breakdown: ContributionRow[];
  chi: number;
  narrative: NarrativeResult;
  tone: string;
  compatibilityLabel: string;
}

const asFiniteNumber = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const round = (value: number, decimals: number): number => {
  const factor = 10 ** decimals;
  return Math.round(asFiniteNumber(value) * factor) / factor;
};

/** One row per canonical dimension: fᵢ, wᵢ and the contribution wᵢ·fᵢ. */
export function computeContributions(
  weights: FormulaBlocks,
  breakdown: FormulaBreakdown | null | undefined,
): ContributionRow[] {
  return CARE_DIMENSIONS.map((dim) => {
    const f = asFiniteNumber(breakdown?.[dim.key]);
    const w = asFiniteNumber(weights?.[dim.key]);
    return {
      key: dim.key,
      chip: dim.chip,
      label: dim.label,
      color: dim.color,
      f: round(f, 6),
      w: round(w, 6),
      contribution: round(w * f, 6),
    };
  });
}

/** Band label from a raw score (0–1) — mirrors backend `compatibility_label`. */
export function bandFromScore(score: number): string {
  const value = asFiniteNumber(score);
  if (value >= 0.7) return "Alto";
  if (value >= 0.5) return "Medio";
  if (value >= 0.3) return "Bajo";
  return "Muy bajo";
}

/**
 * Prefer the backend-provided `compatibility_label`; fall back to the local band
 * computation only when it is missing or not a string.
 */
export function resolveBand(
  label: string | null | undefined,
  score: number,
): string {
  return typeof label === "string" && label.trim() !== ""
    ? label
    : bandFromScore(score);
}

/** Build the exportable report object (spec §interpreter.tsx). */
export function buildReport(
  input: ReportInput,
  generatedAt: string,
): CareReport {
  return {
    user_a: input.userA,
    user_b: input.userB,
    formula_version: input.formulaVersion,
    breakdown: input.breakdown,
    chi: input.chi,
    narrative: input.narrative,
    tone: input.tone,
    compatibility_label: input.compatibilityLabel,
    generated_at: generatedAt,
  };
}

const sanitizeId = (value: string): string => {
  const cleaned = value.replace(/[^A-Za-z0-9_-]/g, "-");
  return cleaned === "" ? "user" : cleaned;
};

/** Deterministic download filename: care-report_<a>_<b>_<YYYYMMDDHHmmss>.json. */
export function reportFilename(
  userA: string,
  userB: string,
  generatedAt: string,
): string {
  const stamp = generatedAt.replace(/[^0-9]/g, "").slice(0, 14);
  return `care-report_${sanitizeId(userA)}_${sanitizeId(userB)}_${stamp}.json`;
}

/** Client-side Blob download — no new dependencies. */
export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/utils/careInterpreterModel.test.ts --ci`
Expected: PASS (all suites green).

- [ ] **Step 5: Typecheck + commit**

Run: `npm run typecheck`
Expected: no new errors.

```bash
git add frontend/src/utils/careInterpreterModel.ts frontend/src/utils/careInterpreterModel.test.ts
git commit -m "feat(care-ui): modelo puro careInterpreterModel (contribuciones/banda/reporte)"
```

---

### Task 2: `CareScoreBreakdown` + `CareNarrativeTrio` (presentational)

**Files:**
- Create: `frontend/src/components/care/CareScoreBreakdown.tsx`
- Create: `frontend/src/components/care/CareScoreBreakdown.test.tsx`
- Create: `frontend/src/components/care/CareNarrativeTrio.tsx`
- Create: `frontend/src/components/care/CareNarrativeTrio.test.tsx`

**Interfaces:**
- Consumes: `ContributionRow` from `../../utils/careInterpreterModel` (Task 1); types `EvaluationResult`, `NarrativeResult` from `../../services/careFormulaService`; `formatDelta` from `../../utils/careEquationModel`.
- Produces:
  - `interface CareScoreBreakdownProps { rows: ContributionRow[]; }`, default export `CareScoreBreakdown`. `data-testid="score-breakdown"`, `data-testid="breakdown-row-<key>"`, `data-testid="breakdown-fi-<key>"` (`fᵢ 0.500`), `data-testid="breakdown-wi-<key>"` (`wᵢ 0.360`), `data-testid="breakdown-contribution-<key>"` (`wᵢ·fᵢ 0.180`), `data-testid="breakdown-bar-<key>"` with `data-value` (0–100, scaled to the largest contribution).
  - `interface CareNarrativeTrioProps { evaluation: EvaluationResult; compatibilityLabel: string; narrative: NarrativeResult; }`, default export `CareNarrativeTrio`. `data-testid="trio-chi"` (`+0.020`), `trio-base` (`0.580`), `trio-final` (`0.600`), `trio-label`, `trio-saturated` (only when `saturated`), `narrative-tone`, `narrative-label`, `narrative-text`.

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/components/care/CareScoreBreakdown.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import CareScoreBreakdown from "./CareScoreBreakdown";
import { computeContributions } from "../../utils/careInterpreterModel";
import { CANONICAL_BLOCK_WEIGHTS } from "../../constants/careDimensions";
import type { FormulaBreakdown } from "../../services/careFormulaService";

const breakdown: FormulaBreakdown = {
  values: 0.5,
  relationship_goals: 0.5,
  neurodiversity: 0.5,
  responsiveness: 0.5,
  music: 0.5,
  love_language: 0.5,
  communication_style: 0.5,
  chaos_applied: 0,
  saturated: false,
  compatibility_label: "Medio",
  final_score: 0.5,
};

const rows = computeContributions({ ...CANONICAL_BLOCK_WEIGHTS }, breakdown);

describe("CareScoreBreakdown", () => {
  it("renders one row per dimension with fᵢ, wᵢ and the contribution", () => {
    render(<CareScoreBreakdown rows={rows} />);
    expect(screen.getByTestId("breakdown-fi-values")).toHaveTextContent("0.500");
    expect(screen.getByTestId("breakdown-wi-values")).toHaveTextContent("0.360");
    expect(screen.getByTestId("breakdown-contribution-values")).toHaveTextContent(
      "0.180",
    );
    expect(
      screen.getByTestId("breakdown-row-communication_style"),
    ).toBeInTheDocument();
  });

  it("scales each bar to the largest contribution", () => {
    render(<CareScoreBreakdown rows={rows} />);
    expect(screen.getByTestId("breakdown-bar-values")).toHaveAttribute(
      "data-value",
      "100",
    );
    expect(
      screen.getByTestId("breakdown-bar-communication_style"),
    ).toHaveAttribute("data-value", "11");
  });
});
```

Create `frontend/src/components/care/CareNarrativeTrio.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import CareNarrativeTrio from "./CareNarrativeTrio";
import type { EvaluationResult } from "../../services/careFormulaService";

const evaluation: EvaluationResult = {
  score: 0.6,
  base: 0.58,
  chi: 0.02,
  breakdown: {
    values: 0.5,
    relationship_goals: 0.5,
    neurodiversity: 0.5,
    responsiveness: 0.5,
    music: 0.5,
    love_language: 0.5,
    communication_style: 0.5,
    chaos_applied: 0.02,
    saturated: false,
    compatibility_label: "Medio",
    final_score: 0.6,
  },
};

const narrative = { tone: "poetico", text: "Sus almas...", label: "Medio" };

describe("CareNarrativeTrio", () => {
  it("renders χ, base, final and the band label", () => {
    render(
      <CareNarrativeTrio
        evaluation={evaluation}
        compatibilityLabel="Medio"
        narrative={narrative}
      />,
    );
    expect(screen.getByTestId("trio-chi")).toHaveTextContent("+0.020");
    expect(screen.getByTestId("trio-base")).toHaveTextContent("0.580");
    expect(screen.getByTestId("trio-final")).toHaveTextContent("0.600");
    expect(screen.getByTestId("trio-label")).toHaveTextContent("Medio");
  });

  it("renders the backend narrative and tone", () => {
    render(
      <CareNarrativeTrio
        evaluation={evaluation}
        compatibilityLabel="Medio"
        narrative={narrative}
      />,
    );
    expect(screen.getByTestId("narrative-text")).toHaveTextContent("Sus almas...");
    expect(screen.getByTestId("narrative-label")).toHaveTextContent("Medio");
    expect(screen.getByTestId("narrative-tone")).toHaveTextContent("poetico");
  });

  it("shows the saturated badge only when saturated", () => {
    const { rerender } = render(
      <CareNarrativeTrio
        evaluation={evaluation}
        compatibilityLabel="Medio"
        narrative={narrative}
      />,
    );
    expect(screen.queryByTestId("trio-saturated")).not.toBeInTheDocument();
    rerender(
      <CareNarrativeTrio
        evaluation={{
          ...evaluation,
          breakdown: { ...evaluation.breakdown, saturated: true },
        }}
        compatibilityLabel="Medio"
        narrative={narrative}
      />,
    );
    expect(screen.getByTestId("trio-saturated")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/components/care/CareScoreBreakdown.test.tsx src/components/care/CareNarrativeTrio.test.tsx --ci`
Expected: FAIL — "Cannot find module './CareScoreBreakdown'".

- [ ] **Step 3: Write minimal implementations**

Create `frontend/src/components/care/CareScoreBreakdown.tsx`:

```tsx
import { Box, Paper, Typography } from "@mui/material";
import type { ContributionRow } from "../../utils/careInterpreterModel";

export interface CareScoreBreakdownProps {
  /** One row per canonical dimension (fᵢ, wᵢ, wᵢ·fᵢ). */
  rows: ContributionRow[];
}

const format = (value: number): string =>
  Number.isFinite(value) ? value.toFixed(3) : "0.000";

/**
 * The real Score Breakdown: each row shows the feature score fᵢ, the active
 * weight wᵢ and the contribution wᵢ·fᵢ, with a bar scaled to the largest
 * contribution. `CareBreakdownBars` renders single-value bars only, so the
 * three-value row is a dedicated component.
 */
export default function CareScoreBreakdown({ rows }: CareScoreBreakdownProps) {
  const maxContribution = Math.max(
    ...rows.map((row) => row.contribution),
    0.0001,
  );
  return (
    <Paper variant="outlined" sx={{ p: 3 }} data-testid="score-breakdown">
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
        Score Breakdown
      </Typography>
      {rows.map((row) => {
        const width = Math.max(
          0,
          Math.min(100, Math.round((row.contribution / maxContribution) * 100)),
        );
        return (
          <Box
            key={row.key}
            data-testid={`breakdown-row-${row.key}`}
            sx={{ mb: 2 }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 0.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    color: "#fff",
                    bgcolor: row.color,
                  }}
                >
                  {row.chip}
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {row.label}
                </Typography>
              </Box>
              <Typography
                variant="body2"
                data-testid={`breakdown-contribution-${row.key}`}
                sx={{ fontWeight: 800, color: row.color }}
              >
                wᵢ·fᵢ {format(row.contribution)}
              </Typography>
            </Box>
            <Box
              data-testid={`breakdown-bar-${row.key}`}
              data-value={width}
              sx={{
                width: "100%",
                height: 6,
                bgcolor: "rgba(0,0,0,0.08)",
                borderRadius: "3px",
                mb: 0.5,
              }}
            >
              <Box
                sx={{
                  width: `${width}%`,
                  height: "100%",
                  bgcolor: row.color,
                  borderRadius: "3px",
                }}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Typography
                variant="caption"
                data-testid={`breakdown-fi-${row.key}`}
                sx={{ color: "text.secondary" }}
              >
                fᵢ {format(row.f)}
              </Typography>
              <Typography
                variant="caption"
                data-testid={`breakdown-wi-${row.key}`}
                sx={{ color: "text.secondary" }}
              >
                wᵢ {format(row.w)}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Paper>
  );
}
```

Create `frontend/src/components/care/CareNarrativeTrio.tsx`:

```tsx
import { Box, Chip, Paper, Typography } from "@mui/material";
import type {
  EvaluationResult,
  NarrativeResult,
} from "../../services/careFormulaService";
import { formatDelta } from "../../utils/careEquationModel";

export interface CareNarrativeTrioProps {
  /** The `proposed` evaluation from `/formula/preview`. */
  evaluation: EvaluationResult;
  /** Backend band label (`proposed.breakdown.compatibility_label`). */
  compatibilityLabel: string;
  /** Backend narrative `{tone, text, label}`. */
  narrative: NarrativeResult;
}

/**
 * The narrative trio (χ, base, final ± saturated) plus the band label and the
 * backend-authored narrative. Purely presentational.
 */
export default function CareNarrativeTrio({
  evaluation,
  compatibilityLabel,
  narrative,
}: CareNarrativeTrioProps) {
  const saturated = evaluation.breakdown.saturated === true;
  return (
    <Paper variant="outlined" sx={{ p: 3, bgcolor: "grey.50" }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
        Trío narrativo
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mb: 2 }}>
        <Box>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            χ (caos)
          </Typography>
          <Typography
            variant="h6"
            data-testid="trio-chi"
            sx={{ fontWeight: 800 }}
          >
            {formatDelta(evaluation.chi)}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Base
          </Typography>
          <Typography
            variant="h6"
            data-testid="trio-base"
            sx={{ fontWeight: 800 }}
          >
            {evaluation.base.toFixed(3)}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Final
          </Typography>
          <Typography
            variant="h6"
            data-testid="trio-final"
            sx={{ fontWeight: 800 }}
          >
            {evaluation.score.toFixed(3)}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Chip
            data-testid="trio-label"
            label={compatibilityLabel}
            color="primary"
            variant="outlined"
          />
          {saturated && (
            <Chip
              data-testid="trio-saturated"
              label="Saturado"
              color="warning"
              variant="outlined"
            />
          )}
        </Box>
      </Box>
      <Typography
        variant="caption"
        data-testid="narrative-tone"
        sx={{ color: "text.secondary", display: "block" }}
      >
        Tono: {narrative.tone}
      </Typography>
      <Chip
        data-testid="narrative-label"
        label={narrative.label}
        size="small"
        sx={{ my: 1 }}
      />
      <Typography
        variant="body2"
        data-testid="narrative-text"
        sx={{ fontStyle: "italic" }}
      >
        {narrative.text}
      </Typography>
    </Paper>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest src/components/care/CareScoreBreakdown.test.tsx src/components/care/CareNarrativeTrio.test.tsx --ci`
Expected: PASS.

- [ ] **Step 5: Typecheck + commit**

Run: `npm run typecheck`
Expected: no new errors.

```bash
git add frontend/src/components/care/CareScoreBreakdown.tsx frontend/src/components/care/CareScoreBreakdown.test.tsx frontend/src/components/care/CareNarrativeTrio.tsx frontend/src/components/care/CareNarrativeTrio.test.tsx
git commit -m "feat(care-ui): breakdown real y trio narrativo del interpreter"
```

---

### Task 3: Rewrite `interpreter.tsx` — load active, inputs, tone, preview, breakdown + narrative

**Files:**
- Modify (full rewrite): `frontend/src/pages/portal-redthread/care/interpreter.tsx`
- Test (new): `frontend/src/pages/portal-redthread/care/interpreter.test.tsx`

**Interfaces:**
- Consumes: `getActiveFormula`, `previewFormula` and types `CareFormula`, `FormulaPayload`, `NarrativeResult`, `PreviewResult` from `../../../services/careFormulaService`; `TONE_OPTIONS`, `previewErrorMessage` from `../../../utils/careEquationModel`; `computeContributions`, `resolveBand` from `../../../utils/careInterpreterModel`; `CareScoreBreakdown` (Task 2); `CareNarrativeTrio` (Task 2); `AdminLayout`.
- Produces: default export `CareInterpreterPage`. `data-testid`s: `interpreter-loading`, `interpreter-error`, `interpreter-user-a`, `interpreter-user-b`, `interpreter-tone-<value>`, `interpreter-run`, `interpreter-preview-loading`, `interpreter-preview-error`, `interpreter-empty`, plus the Task 2 child test-ids. **No export yet** (Task 4 adds it).

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/pages/portal-redthread/care/interpreter.test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CareInterpreterPage from "./interpreter";
import {
  getActiveFormula,
  previewFormula,
} from "../../../services/careFormulaService";
import { CANONICAL_BLOCK_WEIGHTS } from "../../../constants/careDimensions";

jest.mock("next/router", () => ({ useRouter: () => ({ push: jest.fn() }) }));

jest.mock("../../../components/layout/AdminLayout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock("../../../components/care/CareScoreBreakdown", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props: { rows: unknown[] }) =>
      React.createElement("div", {
        "data-testid": "breakdown-stub",
        "data-rows": String(props.rows.length),
      }),
  };
});
jest.mock("../../../components/care/CareNarrativeTrio", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props: { compatibilityLabel: string }) =>
      React.createElement("div", {
        "data-testid": "trio-stub",
        "data-label": props.compatibilityLabel,
      }),
  };
});

jest.mock("../../../services/careFormulaService", () => ({
  __esModule: true,
  getActiveFormula: jest.fn(),
  previewFormula: jest.fn(),
}));

const mockGetActive = getActiveFormula as jest.Mock;
const mockPreview = previewFormula as jest.Mock;

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

const evaluation = (score: number) => ({
  score,
  base: score - 0.02,
  chi: 0.02,
  breakdown: {
    values: 0.5,
    relationship_goals: 0.5,
    neurodiversity: 0.5,
    responsiveness: 0.5,
    music: 0.5,
    love_language: 0.5,
    communication_style: 0.5,
    chaos_applied: 0.02,
    saturated: false,
    compatibility_label: "Medio",
    final_score: score,
  },
});

const previewResponse = {
  current: evaluation(0.52),
  proposed: evaluation(0.6),
  deltas: { values: 0.1 },
  chi_current: 0,
  chi_proposed: 0.02,
  narrative: { tone: "directo", text: "Suben los valores.", label: "Medio" },
};

const setUsers = (a: string, b: string) => {
  fireEvent.change(
    screen
      .getByTestId("interpreter-user-a")
      .querySelector("input") as HTMLInputElement,
    { target: { value: a } },
  );
  fireEvent.change(
    screen
      .getByTestId("interpreter-user-b")
      .querySelector("input") as HTMLInputElement,
    { target: { value: b } },
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetActive.mockResolvedValue(active);
  mockPreview.mockResolvedValue(previewResponse);
});

describe("CareInterpreterPage / load", () => {
  it("shows a loading indicator before the active formula resolves", () => {
    mockGetActive.mockReturnValue(new Promise(() => {}));
    render(<CareInterpreterPage />);
    expect(screen.getByTestId("interpreter-loading")).toBeInTheDocument();
  });

  it("renders an error state when the active formula fails to load", async () => {
    mockGetActive.mockRejectedValueOnce(new Error("boom"));
    render(<CareInterpreterPage />);
    expect(await screen.findByTestId("interpreter-error")).toHaveTextContent(
      "No se pudo cargar la fórmula activa.",
    );
  });

  it("does not render the legacy mock usuario_12345 or '24 fragmentos'", async () => {
    render(<CareInterpreterPage />);
    await screen.findByTestId("interpreter-empty");
    expect(screen.queryByText(/usuario_12345/)).not.toBeInTheDocument();
    expect(screen.queryByText(/24 fragmentos/)).not.toBeInTheDocument();
  });
});

describe("CareInterpreterPage / preview", () => {
  const run = async () => {
    render(<CareInterpreterPage />);
    await screen.findByTestId("interpreter-run");
    setUsers("u1", "u2");
    fireEvent.click(screen.getByTestId("interpreter-run"));
  };

  it("previews the active formula for the two user ids and the selected tone", async () => {
    await run();
    await waitFor(() => expect(mockPreview).toHaveBeenCalledTimes(1));
    expect(mockPreview).toHaveBeenCalledWith({
      formula: expect.objectContaining({ blocks: active.blocks, chaos_factor: 5 }),
      user_a_id: "u1",
      user_b_id: "u2",
      tone: "directo",
    });
  });

  it("sends the chosen tone", async () => {
    render(<CareInterpreterPage />);
    await screen.findByTestId("interpreter-run");
    setUsers("u1", "u2");
    fireEvent.click(screen.getByTestId("interpreter-tone-poetico"));
    fireEvent.click(screen.getByTestId("interpreter-run"));
    await waitFor(() =>
      expect(mockPreview).toHaveBeenCalledWith(
        expect.objectContaining({ tone: "poetico" }),
      ),
    );
  });

  it("renders 7 breakdown rows and the backend band label", async () => {
    await run();
    expect(await screen.findByTestId("breakdown-stub")).toHaveAttribute(
      "data-rows",
      "7",
    );
    expect(screen.getByTestId("trio-stub")).toHaveAttribute(
      "data-label",
      "Medio",
    );
  });

  it("surfaces a 404 preview error in Spanish", async () => {
    mockPreview.mockRejectedValueOnce({ response: { status: 404 } });
    await run();
    expect(await screen.findByTestId("interpreter-preview-error")).toHaveTextContent(
      "Usuario o perfil no encontrado.",
    );
  });

  it("surfaces a 422 preview error detail", async () => {
    mockPreview.mockRejectedValueOnce({
      response: {
        status: 422,
        data: { detail: "user_a_id y user_b_id son requeridos" },
      },
    });
    await run();
    expect(await screen.findByTestId("interpreter-preview-error")).toHaveTextContent(
      "user_a_id y user_b_id son requeridos",
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/pages/portal-redthread/care/interpreter.test.tsx --ci`
Expected: FAIL — the current page renders the legacy mock UI and never calls `getActiveFormula`/`previewFormula`.

- [ ] **Step 3: Rewrite the page**

Replace the entire contents of `frontend/src/pages/portal-redthread/care/interpreter.tsx` with:

```tsx
import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import PsychologyIcon from "@mui/icons-material/Psychology";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import AdminLayout from "../../../components/layout/AdminLayout";
import CareScoreBreakdown from "../../../components/care/CareScoreBreakdown";
import CareNarrativeTrio from "../../../components/care/CareNarrativeTrio";
import {
  getActiveFormula,
  previewFormula,
  type CareFormula,
  type FormulaPayload,
  type NarrativeResult,
  type PreviewResult,
} from "../../../services/careFormulaService";
import {
  TONE_OPTIONS,
  previewErrorMessage,
} from "../../../utils/careEquationModel";
import {
  computeContributions,
  resolveBand,
} from "../../../utils/careInterpreterModel";

const toPayload = (formula: CareFormula): FormulaPayload => ({
  version: formula.version,
  blocks: formula.blocks,
  chaos_factor: formula.chaos_factor,
  chaos_seed: formula.chaos_seed,
  min_compatibility: formula.min_compatibility,
  match_critical: formula.match_critical,
});

export default function CareInterpreterPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formula, setFormula] = useState<CareFormula | null>(null);
  const [userA, setUserA] = useState("");
  const [userB, setUserB] = useState("");
  const [tone, setTone] = useState<NarrativeResult["tone"]>("directo");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const active = await getActiveFormula();
        if (!cancelled) setFormula(active);
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

  const handlePreview = async () => {
    if (!formula || userA.trim() === "" || userB.trim() === "") return;
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const result = await previewFormula({
        formula: toPayload(formula),
        user_a_id: userA.trim(),
        user_b_id: userB.trim(),
        tone,
      });
      setPreviewResult(result);
    } catch (err) {
      setPreviewError(previewErrorMessage(err));
    } finally {
      setPreviewLoading(false);
    }
  };

  const rows =
    formula && previewResult
      ? computeContributions(formula.blocks, previewResult.proposed.breakdown)
      : [];
  const compatibilityLabel = previewResult
    ? resolveBand(
        previewResult.proposed.breakdown.compatibility_label,
        previewResult.proposed.score,
      )
    : "";

  return (
    <AdminLayout>
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
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
              <PsychologyIcon sx={{ fontSize: 32, color: "white" }} />
            </Box>
            <Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: 800, letterSpacing: "-0.5px" }}
              >
                CARE Interpreter
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Explicabilidad del score: fᵢ, wᵢ y contribución wᵢ·fᵢ por
                dimensión.
              </Typography>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} data-testid="interpreter-error">
              {error}
            </Alert>
          )}

          {loading ? (
            <Box
              sx={{ display: "flex", justifyContent: "center", py: 8 }}
              data-testid="interpreter-loading"
            >
              <CircularProgress />
            </Box>
          ) : formula ? (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                    Par a evaluar
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      data-testid="interpreter-user-a"
                      label="Usuario A (id)"
                      size="small"
                      fullWidth
                      value={userA}
                      onChange={(event) => setUserA(event.target.value)}
                    />
                    <TextField
                      data-testid="interpreter-user-b"
                      label="Usuario B (id)"
                      size="small"
                      fullWidth
                      value={userB}
                      onChange={(event) => setUserB(event.target.value)}
                    />
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary" }}
                      >
                        Tono narrativo
                      </Typography>
                      <Stack
                        direction="row"
                        sx={{ flexWrap: "wrap", gap: 1, mt: 0.5 }}
                      >
                        {TONE_OPTIONS.map((option) => (
                          <Chip
                            key={option.value}
                            data-testid={`interpreter-tone-${option.value}`}
                            label={option.label}
                            size="small"
                            color={tone === option.value ? "primary" : "default"}
                            variant={tone === option.value ? "filled" : "outlined"}
                            onClick={() =>
                              setTone(option.value as NarrativeResult["tone"])
                            }
                          />
                        ))}
                      </Stack>
                    </Box>
                    <Button
                      data-testid="interpreter-run"
                      variant="contained"
                      startIcon={<PlayArrowIcon />}
                      onClick={handlePreview}
                      disabled={
                        previewLoading ||
                        userA.trim() === "" ||
                        userB.trim() === ""
                      }
                    >
                      {previewLoading ? "Evaluando..." : "Interpretar par"}
                    </Button>
                    {previewLoading && (
                      <Box
                        sx={{ display: "flex", justifyContent: "center", py: 1 }}
                        data-testid="interpreter-preview-loading"
                      >
                        <CircularProgress size={24} />
                      </Box>
                    )}
                    {previewError && (
                      <Alert
                        severity="error"
                        data-testid="interpreter-preview-error"
                      >
                        {previewError}
                      </Alert>
                    )}
                  </Stack>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, md: 8 }}>
                {previewResult ? (
                  <Stack spacing={3}>
                    <CareScoreBreakdown rows={rows} />
                    <CareNarrativeTrio
                      evaluation={previewResult.proposed}
                      compatibilityLabel={compatibilityLabel}
                      narrative={previewResult.narrative}
                    />
                  </Stack>
                ) : (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 4,
                      minHeight: 400,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    data-testid="interpreter-empty"
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      Selecciona dos usuarios y ejecuta para ver el desglose y la
                      narrativa.
                    </Typography>
                  </Paper>
                )}
              </Grid>
            </Grid>
          ) : null}
        </Box>
      </Container>
    </AdminLayout>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest src/pages/portal-redthread/care/interpreter.test.tsx --ci`
Expected: PASS (8 tests).

- [ ] **Step 5: Typecheck + lint + commit**

Run: `npm run typecheck`
Run: `npm run lint`
Expected: no new errors in the touched files.

```bash
git add frontend/src/pages/portal-redthread/care/interpreter.tsx frontend/src/pages/portal-redthread/care/interpreter.test.tsx
git commit -m "feat(care-ui): interpreter carga formula activa, preview y breakdown real"
```

---

### Task 4: `Exportar Reporte` — client-side JSON download

**Files:**
- Modify: `frontend/src/pages/portal-redthread/care/interpreter.tsx` (add the export action)
- Modify: `frontend/src/pages/portal-redthread/care/interpreter.test.tsx` (add the export tests)

**Interfaces:**
- Consumes: everything from Task 3, plus `buildReport`, `reportFilename`, `downloadJson` from `../../../utils/careInterpreterModel` (`computeContributions` and `resolveBand` are already imported).
- Produces: an `Exportar Reporte` button (`data-testid="interpreter-export"`, `disabled` until `previewResult` exists) that calls `downloadJson(reportFilename(userA, userB, generatedAt), report)`, where `report = buildReport({ userA, userB, formulaVersion: formula.version, breakdown: rows, chi: previewResult.proposed.chi, narrative: previewResult.narrative, tone, compatibilityLabel }, generatedAt)` and `generatedAt = new Date().toISOString()`.

- [ ] **Step 1: Write the failing tests**

In `frontend/src/pages/portal-redthread/care/interpreter.test.tsx`:

1. Add the model mock alongside the other `jest.mock` blocks (so `downloadJson` is a spy while the real `buildReport`/`reportFilename`/`computeContributions`/`resolveBand` still run):

```tsx
jest.mock("../../../utils/careInterpreterModel", () => {
  const actual = jest.requireActual("../../../utils/careInterpreterModel");
  return { ...actual, downloadJson: jest.fn() };
});
```

2. Add the import at the top (with the other imports) and the mock handle (below the existing `mockPreview` line):

```tsx
import { downloadJson } from "../../../utils/careInterpreterModel";
// ...
const mockDownload = downloadJson as jest.Mock;
```

3. Append this new `describe` block at the end of the file:

```tsx
describe("CareInterpreterPage / export", () => {
  it("disables the export until a preview result exists", async () => {
    render(<CareInterpreterPage />);
    await screen.findByTestId("interpreter-export");
    expect(screen.getByTestId("interpreter-export")).toBeDisabled();
  });

  it("downloads the report JSON with the spec fields", async () => {
    render(<CareInterpreterPage />);
    await screen.findByTestId("interpreter-run");
    setUsers("u1", "u2");
    fireEvent.click(screen.getByTestId("interpreter-run"));
    await screen.findByTestId("trio-stub");
    fireEvent.click(screen.getByTestId("interpreter-export"));
    expect(mockDownload).toHaveBeenCalledTimes(1);
    const [filename, report] = mockDownload.mock.calls[0];
    expect(filename).toMatch(/^care-report_u1_u2_\d{14}\.json$/);
    expect(report).toEqual(
      expect.objectContaining({
        user_a: "u1",
        user_b: "u2",
        formula_version: 3,
        chi: 0.02,
        tone: "directo",
        compatibility_label: "Medio",
        narrative: previewResponse.narrative,
      }),
    );
    expect(report.breakdown).toHaveLength(7);
    expect(typeof report.generated_at).toBe("string");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/pages/portal-redthread/care/interpreter.test.tsx --ci`
Expected: FAIL — `interpreter-export` not found.

- [ ] **Step 3: Add the export button + handler**

In `frontend/src/pages/portal-redthread/care/interpreter.tsx`:

1. Add the `DownloadIcon` import next to the other icon imports:

```tsx
import DownloadIcon from "@mui/icons-material/Download";
```

2. Extend the model import to add `buildReport`, `reportFilename`, `downloadJson`:

```tsx
import {
  buildReport,
  computeContributions,
  downloadJson,
  reportFilename,
  resolveBand,
} from "../../../utils/careInterpreterModel";
```

3. Add the handler after `handlePreview` (it reuses the `rows` and `compatibilityLabel` computed in the render body — move those two `const`s **above** the handlers so they are in scope; they currently sit right before the `return`, so relocate them to just after the `useEffect`):

```tsx
  const handleExport = () => {
    if (!formula || !previewResult) return;
    const generatedAt = new Date().toISOString();
    const report = buildReport(
      {
        userA: userA.trim(),
        userB: userB.trim(),
        formulaVersion: formula.version,
        breakdown: rows,
        chi: previewResult.proposed.chi,
        narrative: previewResult.narrative,
        tone,
        compatibilityLabel,
      },
      generatedAt,
    );
    downloadJson(
      reportFilename(userA.trim(), userB.trim(), generatedAt),
      report,
    );
  };
```

4. Change the header `Box` to space the title and the action apart, and add the button. Replace:

```tsx
          <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
```

with:

```tsx
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 4,
            }}
          >
```

and wrap the icon + text block in an inner `<Box sx={{ display: "flex", alignItems: "center" }}>` so the button lands on the right (i.e. change `<Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>` → outer Box, and the existing `<Box sx={{ bgcolor: "primary.main" … }}>` + `<Box>` title block get wrapped by a new `<Box sx={{ display: "flex", alignItems: "center" }}>`), then add just before the closing `</Box>` of the header:

```tsx
            <Button
              data-testid="interpreter-export"
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              disabled={!previewResult}
            >
              Exportar Reporte
            </Button>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest src/pages/portal-redthread/care/interpreter.test.tsx --ci`
Expected: PASS (10 tests total in the file).

- [ ] **Step 5: Full check + commit**

Run: `npx jest src/utils/careInterpreterModel.test.ts src/components/care/CareScoreBreakdown.test.tsx src/components/care/CareNarrativeTrio.test.tsx src/pages/portal-redthread/care/interpreter.test.tsx --ci`
Run: `npm run typecheck`
Run: `npm run lint`
Expected: all green; no new type or lint errors.

```bash
git add frontend/src/pages/portal-redthread/care/interpreter.tsx frontend/src/pages/portal-redthread/care/interpreter.test.tsx
git commit -m "feat(care-ui): exportar reporte JSON del interpreter"
```

---

## Self-Review

**1. Spec coverage (spec `### interpreter.tsx`):**
- Two `user_id`s + tone selector → `POST /formula/preview` with the **active** formula → Task 3 (`toPayload(active)` + `previewFormula({formula, user_a_id, user_b_id, tone})`); the active formula is loaded via `getActiveFormula` (Task 3). ✓
- **Score Breakdown real: 7 barras (fᵢ, wᵢ, contribución wᵢ·fᵢ)** → Task 1 `computeContributions` (weights from the active formula × returned fᵢ) + Task 2 `CareScoreBreakdown` (7 rows; each shows fᵢ, wᵢ and wᵢ·fᵢ with a contribution bar). ✓
- **Trío narrativo (χ, base, final/saturated) + `compatibility_label`** → Task 2 `CareNarrativeTrio` (`trio-chi`/`trio-base`/`trio-final`/`trio-saturated`/`trio-label`); backend label passed through `resolveBand` in Task 3. ✓
- **Narrativa del backend `{tone,text,label}`** → Task 2 `CareNarrativeTrio` (`narrative-tone`/`narrative-label`/`narrative-text`). ✓
- **Exportar Reporte → JSON descargado `{user_a, user_b, formula_version, breakdown, chi, narrative, tone, compatibility_label, generated_at}`** → Task 1 `buildReport`/`reportFilename`/`downloadJson` + Task 4 button/handler. ✓
- **Fuera: mock `usuario_12345`, `"24 fragmentos"` hardcodeados** → Task 3 full rewrite removes both; a test asserts their absence. ✓
- Loading/error states + 422/404 Spanish messages → Task 3 (`interpreter-loading`, `interpreter-error`, `interpreter-preview-error` via `previewErrorMessage`). ✓
- No new i18n keys; hardcoded Spanish; `CARE_DIMENSIONS` labels reused → all tasks (no `t()`). ✓
- No new dependencies → Global Constraints; report download via `Blob` + `URL.createObjectURL`. ✓

**2. Placeholder scan:** no `TODO`/`TBD`, no "similar to Task N", no empty test bodies; every code step carries verbatim code. Task 4 gives exact anchor points for the two edits rather than re-pasting the whole page (the page is fully specified in Task 3 and Task 4 edits it sequentially) — a concrete instruction, not a placeholder.

**3. Type consistency:**
- `ContributionRow`, `CareReport`, `ReportInput`, `computeContributions`, `bandFromScore`, `resolveBand`, `buildReport`, `reportFilename`, `downloadJson` are all defined in Task 1 and consumed with those exact names/signatures by Tasks 2–4.
- `FormulaBlocks`, `FormulaBreakdown`, `EvaluationResult`, `NarrativeResult`, `PreviewResult`, `CareFormula`, `FormulaPayload` come from the existing `careFormulaService.ts` and are reused verbatim; `TONE_OPTIONS`/`previewErrorMessage` come from the existing `careEquationModel.ts`.
- Test-id contract is fixed once and reused by the page test: `interpreter-loading`, `interpreter-error`, `interpreter-user-a/b`, `interpreter-tone-<value>`, `interpreter-run`, `interpreter-preview-loading`, `interpreter-preview-error`, `interpreter-empty`, `interpreter-export`, `score-breakdown`, `breakdown-row-<key>`, `breakdown-fi-<key>`, `breakdown-wi-<key>`, `breakdown-contribution-<key>`, `breakdown-bar-<key>`, `trio-chi/base/final/label/saturated`, `narrative-tone/label/text`.
- `previewResult.proposed.breakdown.compatibility_label` is typed `string` by the service interface, so no unsafe cast is needed in Task 3.

**4. Dependency order:** Task 1 (pure model) → Task 2 (presentational, depends only on Task 1) → Task 3 (page; depends on 1–2) → Task 4 (export; depends on 3). Each task ends green with its own commit. Tasks 3 and 4 both touch the page/test (sequential edits), mirroring the equation plan's Task 5 → Tasks 6–7 pattern.

**5. Verification commands:** every task runs `npx jest <files> --ci`; the page tasks also run `npm run typecheck` and `npm run lint` from `frontend/`. Commits are local-only (`feat(care-ui): ...`); never push without an explicit "sube".
