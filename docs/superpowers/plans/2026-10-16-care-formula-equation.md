# CARE Formula Equation (Bloque 4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `frontend/src/pages/portal-redthread/care/equation.tsx` into the canonical Dirac "Ψ/M" formula workbench: a stylized `CARE_score = Σ wᵢ·fᵢ + χ(t)` header with α–η chips + read-only pre-filter chips, a hand-built SVG Ψ/orbit canvas, a 7-block slider editor + Caos panel (χ slider 0–20%, reproducible seed, Δ indicator), a thresholds panel, a bidirectional JSON editor, and the six actions (`Validar`, `Simular`, `Previsualizar par` + Interpreter narrative, `Guardar`, `Versiones`/rollback) — all driven by the already-built `careFormulaService` and the criteria-draft handoff (`decodeEquationDraft`).

**Architecture:** Three layers. (1) A pure, dependency-free model module (`careEquationModel.ts`) owning the draft shape, the make/serialize/parse JSON codec, orbital layout math, client validation, degeneracy/smoke checks, tone options and error mapping — all unit-tested. (2) Presentational components under `frontend/src/components/care/` that render one UI region each and emit intent only (`onSliderChange`, `onChaosChange`, `onRollback`, …). (3) A container page (`equation.tsx`) that owns state, loads `GET /formula/active`, applies the criteria router draft, and calls `careFormulaService` for validate/simulate/preview/save/rollback/versions. No new dependencies; admin copy is hardcoded Spanish (spec decision 11); the SVG is hand-built (no chart libs).

**Tech Stack:** Next.js (Pages Router), React 19, MUI (`@mui/material` + `@mui/icons-material`), TypeScript, axios client via `careFormulaService`, Jest + @testing-library/react.

**Spec:** `docs/superpowers/specs/2026-10-15-care-formula-dirac-design.md` (see `### equation.tsx (corazón Ψ/M)`, `### Endpoints`, `## Decisiones aprobadas`, `## Tests y verificación`).

## Global Constraints

- **No new dependencies** (spec §Tests). Do not touch `package.json`. Everything uses React, Next, MUI, and jest/testing-library already present.
- **No chart libraries and no `<canvas>`** — the Ψ/orbit diagram is hand-built SVG (`<svg>`/`<circle>`/`<line>`/`<text>`), per spec.
- **Admin pages are hardcoded Spanish** (spec decision 11). Never call `t()` on this page. Use `CARE_DIMENSIONS[].label` (already Spanish) and literal Spanish strings.
- **No new i18n keys.** Do not add anything to `public/locales/**`.
- **Backend endpoint prefix:** `/portal-redthread/experiencia/algoritmos` (registered in `backend/src/main.py`). Formula routes live under `/formula/*`.
- **API access:** the page must consume `frontend/src/services/careFormulaService.ts` functions. That service already imports the **named** `adminApiClient` from `frontend/src/services/api.ts`. Do NOT import `adminApiClient` into the page, and do NOT call axios directly. Cookies + 401-refresh are handled by `services/api.ts`; never manage tokens manually.
- **MUI `sx` gotcha:** this repo rejects numeric `borderRadius` in `sx` — always use px strings (`borderRadius: "8px"`, `borderRadius: "50%"`).
- **Do not modify** `careDimensions.ts`, `careCriteriaModel.ts`, `careFormulaService.ts`, `CareCriteriaTable.tsx`, `CareBreakdownBars.tsx`, or any backend file in this block.
- **Reuse (do not duplicate):** `decodeEquationDraft` / `saveErrorMessage` / `percentOf` from `frontend/src/utils/careCriteriaModel.ts`; `CareBreakdownBars` from `frontend/src/components/profile/CareBreakdownBars.tsx`; `numericBreakdown` from `careFormulaService.ts`.
- **Verification commands** (run from `frontend/`):
  - Tests: `npx jest <path> --ci`
  - Typecheck: `npm run typecheck`
  - Lint: `npm run lint`
- **Commits:** local only; never push without the user saying "sube".

## Backend contract (verified against `backend/src/api/admin_algorithms.py` + `backend/src/care/formula/service.py` + `backend/src/care/narrative.py`)

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

`GET /formula/versions?limit=50` → `CAREFormula[]` sorted by `-version` (both `active` and `archived`). **Plain formula dumps only** — no diff, no `action`, no `source` (see discrepancies).

`POST /formula/validate` — body `{ "formula": FormulaPayload }` → `{ "valid": boolean, "errors": string[] }`. Errors are Spanish strings from `validate_formula_dict`: missing `blocks`, missing/unknown dimension keys, non-numeric weight, weight outside `0–1`, `sum != 1.0`, `chaos_factor` outside `0–20`. **It does NOT validate `changelog` or the thresholds.**

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
where `Breakdown` = the 7 block keys (feature scores 0–1) **plus** `chaos_applied` (number), `saturated` (boolean), `compatibility_label` (string), `final_score` (number). Errors: **422** (invalid formula, detail = errors list; OR missing ids, detail = Spanish string), **404** (user or profile not found). `tone` defaults to `"directo"`; an unknown tone is coerced to `"directo"` (valid tones: `directo|poetico|ludico|emocional|curioso`). **`deltas[k]` is `proposed.breakdown[k] - current.breakdown[k]` (a feature difference, 0–1), not a weight change.**

`POST /formula/simulate` — body `{ "formula": FormulaPayload, "anchor_user_id"?: string, "candidate_user_ids"?: string[] }` →
```jsonc
{
  "mock": boolean,              // true when no anchor_user_id (8 mock profiles)
  "ranking": [ { "candidate_id": string, "score_current": number, "score_proposed": number,
                 "chi_current": number, "chi_proposed": number, "delta": number } ],
  "mean_delta": number
}
```
Errors: **422** (invalid formula), **400** (`candidate_user_ids` with no anchor, or >20 candidates), **404** (anchor not found).

`POST /formula/save` — body `{ "formula": FormulaPayload, "source": "criteria"|"equation"|"api" }` → the saved `CAREFormula` dump.
- **409** (`FormulaNoChangeError`) when the payload config equals the active config; `detail` is a Spanish string (`"La fórmula no cambió respecto a la versión activa"`).
- **422** when validation fails; `detail` is a **list of Spanish strings** (`exc.errors`), or a single string for a missing required key (`"formula.changelog es requerido"` via `KeyError`).
- `save_new_version` requires `blocks` + `changelog`; the new version is computed by the backend (any `version` you send is ignored for numbering). `chaos_factor` / `chaos_seed` / `min_compatibility` / `match_critical` are part of the no-change comparison, so **send them from the working draft** to avoid spurious 409s.

`POST /formula/rollback/{version}` → the restored `CAREFormula` dump. Error **404** when the version does not exist. (The route does not forward a `source`; history records `source: "api"`.)

`POST /formula/normalizar` — body `{ "blocks": {...}, "locked": string[] }` → `{ "blocks": {...} }`. **Not used by the equation page** (spec's equation action list has no "Normalizar"); listed for completeness.

**`FormulaPayload`** = `{ version?: number, blocks: Record<string, number>, chaos_factor?: number, chaos_seed?: string | null, min_compatibility?: number, match_critical?: number, changelog?: string }` (already defined and exported by `careFormulaService.ts`).

### Spec-vs-reality discrepancies (found during verification — implement per reality)

1. **Equation route path.** Spec `### equation.tsx` writes `/care/equation`. Reality: the real Pages Router route is **`/portal-redthread/care/equation`** (the same path the criteria `Probar` handoff pushes to). Use the full path.
2. **`/formula/versions` shape.** Spec §Endpoints says "Historial enriquecido (diff before/after por clave, action, source, target_version)". Reality: the endpoint returns **plain `CAREFormula[]`**. The enriched `AlgorithmHistory` rows are written by `save_new_version`/`rollback_to_version` but **are not exposed** by `/formula/versions`. The Versiones panel shows `version`, `status`, `created_at`, `created_by` and `changelog`, with one-click rollback — no diff column.
3. **Flattened data model.** Spec's dataclass uses nested `chaos: {factor, seed}` and `thresholds: {min_compatibility, match_critical}`. The API/model is **flat**: `chaos_factor`, `chaos_seed`, `min_compatibility`, `match_critical` at the top level. The bidirectional JSON editor must serialize/parse the **flat** backend shape (what `FormulaPayload` uses), not the nested spec shape.
4. **`POST /care/normalizar` vs `/formula/normalizar`.** The spec's Endpoints note references `/care/normalizar`; the canonical block-redistribution route is `POST /formula/normalizar`. The equation page does not use either.
5. **Tone wire values.** Spec lists display names "Directo, Poético, Lúdico, Emocional, Curioso"; the backend accepts unaccented lowercase keys (`directo`, `poetico`, `ludico`, `emocional`, `curioso`). The selector sends the wire keys while displaying the accented labels.
6. **`Validar` smoke test has no dedicated endpoint.** "validate + smoke test con distribución de scores mock + alertas degeneradas" is composed client-side: `validateFormula` + a pure degeneracy check on the weights + `simulateFormula` (no anchor → mock profiles) whose ranking is fed to a pure smoke-alert check.
7. **Block slider range unspecified.** The spec gives the 7 rows a "slider + chip + fᵢ ejemplo" but no range. This plan uses a raw `0–100%` slider with **no auto-normalization** (the equation action list has no Normalizar); the bidirectional JSON editor and `Validar`/`Guardar` enforce the `sum == 1.0` invariant.

## File Structure

- **Create** `frontend/src/utils/careEquationModel.ts` — pure helpers: `EquationDraft` shape, `toEquationDraft`/`draftToPayload`, `orbitNodes` (SVG layout), `serializeDraft`/`parseDraft` (bidirectional JSON), `clientValidation`, `detectDegenerate`, `smokeAlerts`, `formatDelta`, `TONE_OPTIONS`, `previewErrorMessage`, `EXAMPLE_FEATURES`, `CHAOS_MAX`. One responsibility: equation view-model math (no React, no I/O).
- **Create** `frontend/src/utils/careEquationModel.test.ts` — unit tests.
- **Create** `frontend/src/components/care/CareEquationHeader.tsx` — stylized formula + synced α–η chips + read-only pre-filter chips. (+ `.test.tsx`)
- **Create** `frontend/src/components/care/CareFormulaCanvas.tsx` — hand-built SVG Ψ/orbit diagram. (+ `.test.tsx`)
- **Create** `frontend/src/components/care/CareEquationBlocks.tsx` — 7 rows (chip + label + slider + fᵢ ejemplo). (+ `.test.tsx`)
- **Create** `frontend/src/components/care/CareChaosPanel.tsx` — χ slider 0–20% + seed + Δ indicator. (+ `.test.tsx`)
- **Create** `frontend/src/components/care/CareThresholdsPanel.tsx` — `min_compatibility` + `match_critical`. (+ `.test.tsx`)
- **Create** `frontend/src/components/care/CareFormulaJsonEditor.tsx` — bidirectional JSON textarea + validity chip. (+ `.test.tsx`)
- **Create** `frontend/src/components/care/CareSimulationTable.tsx` — ranking table with/without χ. (+ `.test.tsx`)
- **Create** `frontend/src/components/care/CarePreviewPanel.tsx` — 2 user_ids + tone → bars + deltas + clamp + narrative. (+ `.test.tsx`)
- **Create** `frontend/src/components/care/CareVersionsPanel.tsx` — versions list + one-click rollback. (+ `.test.tsx`)
- **Modify (full rewrite)** `frontend/src/pages/portal-redthread/care/equation.tsx` — container page.
- **Create** `frontend/src/pages/portal-redthread/care/equation.test.tsx` — page test (mocks `careFormulaService`, `next/router`, `AdminLayout`, and the presentational `care/*` children).

---

### Task 1: `careEquationModel.ts` (pure view-model helpers)

**Files:**
- Create: `frontend/src/utils/careEquationModel.ts`
- Test: `frontend/src/utils/careEquationModel.test.ts`

**Interfaces:**
- Consumes: `CARE_DIMENSIONS`, `CARE_DIMENSION_KEYS`, `CareDimensionKey` from `../constants/careDimensions`; types `CareFormula`, `FormulaBlocks`, `FormulaPayload`, `SimulateRow` from `../services/careFormulaService`.
- Produces (all named exports):
  - `type EquationDraft = { blocks: FormulaBlocks; chaosFactor: number; chaosSeed: string | null; minCompatibility: number; matchCritical: number }`
  - `interface OrbitNode { key: CareDimensionKey; chip: string; label: string; color: string; percent: number; radius: number; x: number; y: number }`
  - `type DraftParseResult = { ok: true; draft: EquationDraft } | { ok: false; error: string }`
  - `const CHAOS_MAX = 20`, `const MATCH_CRITICAL_DEFAULT = 0.15`
  - `const TONE_OPTIONS: { value: string; label: string }[]`
  - `const EXAMPLE_FEATURES: Record<CareDimensionKey, number>`
  - `toEquationDraft(formula): EquationDraft`
  - `draftToPayload(draft, extra?): FormulaPayload`
  - `orbitNodes(blocks): OrbitNode[]`
  - `serializeDraft(draft): string`
  - `parseDraft(text): DraftParseResult`
  - `clientValidation(blocks): string[]`
  - `detectDegenerate(blocks): string[]`
  - `smokeAlerts(ranking): string[]`
  - `formatDelta(delta): string`
  - `previewErrorMessage(error): string`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/utils/careEquationModel.test.ts`:

```ts
import {
  CHAOS_MAX,
  EXAMPLE_FEATURES,
  TONE_OPTIONS,
  clientValidation,
  detectDegenerate,
  draftToPayload,
  formatDelta,
  orbitNodes,
  parseDraft,
  previewErrorMessage,
  serializeDraft,
  smokeAlerts,
  toEquationDraft,
} from "./careEquationModel";
import { CANONICAL_BLOCK_WEIGHTS } from "../constants/careDimensions";

const canonical = { ...CANONICAL_BLOCK_WEIGHTS };

const formula = {
  version: 3,
  blocks: { ...canonical },
  chaos_factor: 5,
  chaos_seed: null,
  min_compatibility: 0,
  match_critical: 0.15,
};

describe("careEquationModel / draft", () => {
  it("maps a formula to a draft with a copied blocks object", () => {
    const draft = toEquationDraft(formula);
    expect(draft).toEqual({
      blocks: canonical,
      chaosFactor: 5,
      chaosSeed: null,
      minCompatibility: 0,
      matchCritical: 0.15,
    });
    expect(draft.blocks).not.toBe(formula.blocks);
  });

  it("builds a payload and omits version/changelog unless provided", () => {
    const draft = toEquationDraft(formula);
    expect(draftToPayload(draft)).toEqual({
      blocks: canonical,
      chaos_factor: 5,
      chaos_seed: null,
      min_compatibility: 0,
      match_critical: 0.15,
    });
    expect(draftToPayload(draft, { version: 3, changelog: "x" })).toEqual({
      blocks: canonical,
      chaos_factor: 5,
      chaos_seed: null,
      min_compatibility: 0,
      match_critical: 0.15,
      version: 3,
      changelog: "x",
    });
  });
});

describe("careEquationModel / orbitNodes", () => {
  it("returns the 7 canonical nodes in order", () => {
    expect(orbitNodes(canonical).map((node) => node.key)).toEqual([
      "values",
      "relationship_goals",
      "neurodiversity",
      "responsiveness",
      "music",
      "love_language",
      "communication_style",
    ]);
  });

  it("sizes nodes proportionally to weight and keeps them in the viewBox", () => {
    const nodes = orbitNodes(canonical);
    const values = nodes.find((node) => node.key === "values")!;
    const comms = nodes.find((node) => node.key === "communication_style")!;
    expect(values.radius).toBeGreaterThan(comms.radius);
    expect(values.percent).toBe(36);
    expect(comms.percent).toBe(4);
    nodes.forEach((node) => {
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.x).toBeLessThanOrEqual(320);
      expect(node.y).toBeGreaterThanOrEqual(0);
      expect(node.y).toBeLessThanOrEqual(320);
    });
  });
});

describe("careEquationModel / JSON codec", () => {
  it("round-trips a draft through serialize/parse", () => {
    const draft = toEquationDraft(formula);
    const parsed = parseDraft(serializeDraft(draft));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.draft).toEqual(draft);
  });

  it("serializes the flat backend shape in canonical key order", () => {
    const text = serializeDraft(toEquationDraft(formula));
    expect(text).toContain('"chaos_factor": 5');
    expect(text.indexOf('"values"')).toBeLessThan(text.indexOf('"communication_style"'));
  });

  it("reports structural errors as { ok: false }", () => {
    expect(parseDraft("not-json").ok).toBe(false);
    expect(parseDraft("[]").ok).toBe(false);
    expect(parseDraft('{"chaos_factor": 5}').ok).toBe(false);
    expect(parseDraft('{"blocks": {"values": 1}}').ok).toBe(false);
  });

  it("rejects out-of-range and unknown values", () => {
    expect(
      parseDraft(JSON.stringify({ blocks: { ...canonical, music: 2 } })).ok,
    ).toBe(false);
    expect(
      parseDraft(JSON.stringify({ blocks: { ...canonical, zzz: 0.1 } })).ok,
    ).toBe(false);
    expect(
      parseDraft(JSON.stringify({ blocks: canonical, chaos_factor: CHAOS_MAX + 1 })).ok,
    ).toBe(false);
  });

  it("does not enforce sum == 1.0 (that is the backend/client validation job)", () => {
    const unbalanced = { ...canonical, values: 0.9 };
    expect(parseDraft(JSON.stringify({ blocks: unbalanced })).ok).toBe(true);
  });
});

describe("careEquationModel / validation + degeneracy", () => {
  it("accepts canonical weights", () => {
    expect(clientValidation(canonical)).toEqual([]);
    expect(detectDegenerate(canonical)).toEqual([]);
  });

  it("flags an unbalanced sum", () => {
    expect(clientValidation({ ...canonical, values: 0.4 }).join(" ")).toContain("100%");
  });

  it("flags missing dimensions", () => {
    expect(clientValidation({ values: 0.4 }).join(" ")).toContain("Faltan dimensiones");
  });

  it("detects a degenerate distribution", () => {
    const degenerate = {
      values: 0.95,
      relationship_goals: 0.05,
      neurodiversity: 0,
      responsiveness: 0,
      music: 0,
      love_language: 0,
      communication_style: 0,
    };
    const alerts = detectDegenerate(degenerate);
    expect(alerts.join(" ")).toContain("0%");
    expect(alerts.join(" ")).toContain("degenerada");
  });
});

describe("careEquationModel / smoke + labels", () => {
  it("reports an empty ranking and identical scores", () => {
    expect(smokeAlerts([])).toEqual(["Sin candidatos para el smoke test."]);
    const identical = [
      { candidate_id: "a", score_current: 0.5, score_proposed: 0.5, chi_current: 0, chi_proposed: 0, delta: 0 },
      { candidate_id: "b", score_current: 0.4, score_proposed: 0.5, chi_current: 0, chi_proposed: 0, delta: 0.1 },
    ];
    expect(smokeAlerts(identical)[0]).toContain("idénticos");
    expect(smokeAlerts([
      { candidate_id: "a", score_current: 0.5, score_proposed: 0.7, chi_current: 0, chi_proposed: 0, delta: 0.2 },
      { candidate_id: "b", score_current: 0.3, score_proposed: 0.4, chi_current: 0, chi_proposed: 0, delta: 0.1 },
    ])).toEqual([]);
  });

  it("formats deltas with an explicit sign", () => {
    expect(formatDelta(0.12)).toBe("+0.120");
    expect(formatDelta(-0.05)).toBe("-0.050");
    expect(formatDelta(0)).toBe("0.000");
  });

  it("exposes 5 tone options and example features per dimension", () => {
    expect(TONE_OPTIONS.map((option) => option.value)).toEqual([
      "directo",
      "poetico",
      "ludico",
      "emocional",
      "curioso",
    ]);
    expect(Object.keys(EXAMPLE_FEATURES).sort()).toEqual([...Object.keys(canonical)].sort());
    Object.values(EXAMPLE_FEATURES).forEach((value) => {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    });
  });

  it("maps preview errors to Spanish messages", () => {
    expect(previewErrorMessage({ response: { status: 404 } })).toBe("Usuario o perfil no encontrado.");
    expect(
      previewErrorMessage({ response: { status: 422, data: { detail: ["x", "y"] } } }),
    ).toBe("x · y");
    expect(previewErrorMessage(new Error("boom"))).toBe(
      "No se pudo previsualizar el par. Intenta de nuevo.",
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/utils/careEquationModel.test.ts --ci`
Expected: FAIL — "Cannot find module './careEquationModel'".

- [ ] **Step 3: Write minimal implementation**

Create `frontend/src/utils/careEquationModel.ts`:

```ts
import {
  CARE_DIMENSIONS,
  CARE_DIMENSION_KEYS,
  type CareDimensionKey,
} from "../constants/careDimensions";
import type {
  CareFormula,
  FormulaBlocks,
  FormulaPayload,
  SimulateRow,
} from "../services/careFormulaService";

/**
 * Pure view-model helpers for the equation (Ψ/M) workbench.
 * No React, no network — everything here is unit-testable in isolation.
 * Weights live in `blocks` as fractions (0–1); the UI shows percentages.
 */

export interface EquationDraft {
  blocks: FormulaBlocks;
  chaosFactor: number;
  chaosSeed: string | null;
  minCompatibility: number;
  matchCritical: number;
}

export interface OrbitNode {
  key: CareDimensionKey;
  chip: string;
  label: string;
  color: string;
  percent: number;
  radius: number;
  x: number;
  y: number;
}

export type DraftParseResult =
  | { ok: true; draft: EquationDraft }
  | { ok: false; error: string };

export const CHAOS_MAX = 20;
export const MATCH_CRITICAL_DEFAULT = 0.15;

/** Wire values match backend `care/narrative.py` VALID_TONES; labels are display-only. */
export const TONE_OPTIONS: { value: string; label: string }[] = [
  { value: "directo", label: "Directo" },
  { value: "poetico", label: "Poético" },
  { value: "ludico", label: "Lúdico" },
  { value: "emocional", label: "Emocional" },
  { value: "curioso", label: "Curioso" },
];

/** Illustrative feature score fᵢ per dimension (for the "fᵢ ejemplo" caption). */
export const EXAMPLE_FEATURES: Record<CareDimensionKey, number> = {
  values: 0.8,
  relationship_goals: 0.6,
  neurodiversity: 0.7,
  responsiveness: 0.55,
  music: 0.65,
  love_language: 0.5,
  communication_style: 0.75,
};

const asFiniteNumber = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const round = (value: number, decimals: number): number => {
  const factor = 10 ** decimals;
  return Math.round(asFiniteNumber(value) * factor) / factor;
};

export function toEquationDraft(
  formula: Pick<
    CareFormula,
    "blocks" | "chaos_factor" | "chaos_seed" | "min_compatibility" | "match_critical"
  >,
): EquationDraft {
  return {
    blocks: { ...formula.blocks },
    chaosFactor: asFiniteNumber(formula.chaos_factor),
    chaosSeed: formula.chaos_seed ?? null,
    minCompatibility: asFiniteNumber(formula.min_compatibility),
    matchCritical: asFiniteNumber(formula.match_critical),
  };
}

export function draftToPayload(
  draft: EquationDraft,
  extra?: { version?: number; changelog?: string },
): FormulaPayload {
  const payload: FormulaPayload = {
    blocks: { ...draft.blocks },
    chaos_factor: asFiniteNumber(draft.chaosFactor),
    chaos_seed: draft.chaosSeed ?? null,
    min_compatibility: asFiniteNumber(draft.minCompatibility),
    match_critical: asFiniteNumber(draft.matchCritical),
  };
  if (extra?.version !== undefined) payload.version = extra.version;
  if (extra?.changelog !== undefined) payload.changelog = extra.changelog;
  return payload;
}

/** Deterministic orbital layout for the hand-built SVG: center Ψ at (160,160). */
export function orbitNodes(blocks: FormulaBlocks): OrbitNode[] {
  const cx = 160;
  const cy = 160;
  const orbit = 104;
  const count = CARE_DIMENSIONS.length;
  const weights = CARE_DIMENSIONS.map((dim) => asFiniteNumber(blocks[dim.key]));
  const maxWeight = Math.max(...weights, 0.0001);
  return CARE_DIMENSIONS.map((dim, index) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
    const weight = asFiniteNumber(blocks[dim.key]);
    return {
      key: dim.key,
      chip: dim.chip,
      label: dim.label,
      color: dim.color,
      percent: Math.round(weight * 100),
      radius: round(10 + (weight / maxWeight) * 20, 2),
      x: round(cx + orbit * Math.cos(angle), 2),
      y: round(cy + orbit * Math.sin(angle), 2),
    };
  });
}

/** Serialize the draft to the flat backend JSON shape (canonical key order). */
export function serializeDraft(draft: EquationDraft): string {
  const orderedBlocks: FormulaBlocks = {};
  for (const key of CARE_DIMENSION_KEYS) {
    orderedBlocks[key] = round(asFiniteNumber(draft.blocks[key]), 6);
  }
  return JSON.stringify(
    {
      blocks: orderedBlocks,
      chaos_factor: asFiniteNumber(draft.chaosFactor),
      chaos_seed: draft.chaosSeed ?? null,
      min_compatibility: asFiniteNumber(draft.minCompatibility),
      match_critical: asFiniteNumber(draft.matchCritical),
    },
    null,
    2,
  );
}

/** Parse user-typed JSON back into a draft. Structural/range errors → { ok: false }. */
export function parseDraft(text: string): DraftParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "JSON inválido: revisa la sintaxis." };
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { ok: false, error: "La fórmula debe ser un objeto JSON." };
  }
  const obj = parsed as Record<string, unknown>;
  const rawBlocks = obj.blocks;
  if (typeof rawBlocks !== "object" || rawBlocks === null || Array.isArray(rawBlocks)) {
    return { ok: false, error: "Falta el objeto 'blocks'." };
  }
  const blocksRecord = rawBlocks as Record<string, unknown>;
  const blocks: FormulaBlocks = {};
  for (const key of CARE_DIMENSION_KEYS) {
    const value = blocksRecord[key];
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return { ok: false, error: `La dimensión '${key}' debe ser numérica.` };
    }
    if (value < 0 || value > 1) {
      return { ok: false, error: `La dimensión '${key}' debe estar entre 0 y 1.` };
    }
    blocks[key] = value;
  }
  const extra = Object.keys(blocksRecord).filter(
    (key) => !(CARE_DIMENSION_KEYS as readonly string[]).includes(key),
  );
  if (extra.length > 0) {
    return { ok: false, error: `Dimensión desconocida '${extra[0]}'.` };
  }
  const chaosFactor = obj.chaos_factor === undefined ? 0 : obj.chaos_factor;
  if (
    typeof chaosFactor !== "number" ||
    !Number.isFinite(chaosFactor) ||
    chaosFactor < 0 ||
    chaosFactor > CHAOS_MAX
  ) {
    return { ok: false, error: `'chaos_factor' debe estar entre 0 y ${CHAOS_MAX}.` };
  }
  const minCompatibility = obj.min_compatibility === undefined ? 0 : obj.min_compatibility;
  if (
    typeof minCompatibility !== "number" ||
    !Number.isFinite(minCompatibility) ||
    minCompatibility < 0 ||
    minCompatibility > 1
  ) {
    return { ok: false, error: "'min_compatibility' debe estar entre 0 y 1." };
  }
  const matchCritical =
    obj.match_critical === undefined ? MATCH_CRITICAL_DEFAULT : obj.match_critical;
  if (
    typeof matchCritical !== "number" ||
    !Number.isFinite(matchCritical) ||
    matchCritical < 0 ||
    matchCritical > 1
  ) {
    return { ok: false, error: "'match_critical' debe estar entre 0 y 1." };
  }
  let chaosSeed: string | null = null;
  const rawSeed = obj.chaos_seed;
  if (rawSeed !== undefined && rawSeed !== null) {
    if (typeof rawSeed !== "string") {
      return { ok: false, error: "'chaos_seed' debe ser texto o null." };
    }
    chaosSeed = rawSeed;
  }
  return {
    ok: true,
    draft: { blocks, chaosFactor, chaosSeed, minCompatibility, matchCritical },
  };
}

/** Client-side structural + sum validation (mirrors the backend's rules). */
export function clientValidation(blocks: FormulaBlocks): string[] {
  const errors: string[] = [];
  const missing = CARE_DIMENSION_KEYS.filter(
    (key) => typeof blocks[key] !== "number" || !Number.isFinite(blocks[key]),
  );
  if (missing.length > 0) errors.push(`Faltan dimensiones: ${missing.join(", ")}.`);
  const outOfRange = CARE_DIMENSION_KEYS.filter(
    (key) => asFiniteNumber(blocks[key]) < 0 || asFiniteNumber(blocks[key]) > 1,
  );
  if (outOfRange.length > 0) errors.push(`Pesos fuera de rango 0–1: ${outOfRange.join(", ")}.`);
  const sum = CARE_DIMENSION_KEYS.reduce((acc, key) => acc + asFiniteNumber(blocks[key]), 0);
  if (Math.round(sum * 100) !== 100) {
    errors.push(`La suma de pesos debe ser 100% (lleva ${Math.round(sum * 100)}%).`);
  }
  return errors;
}

/** Smoke check on the weight distribution (zeroed dimensions / concentration). */
export function detectDegenerate(blocks: FormulaBlocks): string[] {
  const alerts: string[] = [];
  const weights = CARE_DIMENSIONS.map((dim) => asFiniteNumber(blocks[dim.key]));
  const total = weights.reduce((acc, value) => acc + value, 0);
  const zeros = CARE_DIMENSIONS.filter((dim) => asFiniteNumber(blocks[dim.key]) <= 0);
  if (zeros.length > 0) {
    alerts.push(`Dimensión(es) en 0%: ${zeros.map((dim) => dim.label).join(", ")}.`);
  }
  if (total > 0) {
    const max = Math.max(...weights);
    const maxDim = CARE_DIMENSIONS[weights.indexOf(max)];
    if (max / total >= 0.9) {
      alerts.push(`Distribución degenerada: ${maxDim.label} concentra ≥90% del peso.`);
    }
  }
  return alerts;
}

/** Smoke check on a simulated ranking (identical / flat score distribution). */
export function smokeAlerts(ranking: SimulateRow[]): string[] {
  if (ranking.length === 0) return ["Sin candidatos para el smoke test."];
  const scores = ranking.map((row) => asFiniteNumber(row.score_proposed));
  const max = Math.max(...scores);
  const min = Math.min(...scores);
  if (ranking.length > 1 && round(max, 6) === round(min, 6)) {
    return ["Todos los scores propuestos son idénticos (posible distribución degenerada)."];
  }
  if (max - min < 0.01) return ["Dispersión de scores muy baja entre candidatos."];
  return [];
}

export function formatDelta(delta: number): string {
  const value = round(asFiniteNumber(delta), 3);
  return `${value > 0 ? "+" : ""}${value.toFixed(3)}`;
}

/** Maps a preview failure (axios error) to a Spanish, user-visible message. */
export function previewErrorMessage(error: unknown): string {
  const status = (error as { response?: { status?: number } })?.response?.status;
  const detail = (error as { response?: { data?: { detail?: unknown } } })?.response
    ?.data?.detail;
  if (status === 404) return "Usuario o perfil no encontrado.";
  if (status === 422) {
    if (Array.isArray(detail)) return detail.join(" · ");
    if (typeof detail === "string" && detail) return detail;
    return "Datos inválidos para la previsualización.";
  }
  return "No se pudo previsualizar el par. Intenta de nuevo.";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/utils/careEquationModel.test.ts --ci`
Expected: PASS (all suites green).

- [ ] **Step 5: Typecheck + commit**

Run: `npm run typecheck`
Expected: no new errors.

```bash
git add frontend/src/utils/careEquationModel.ts frontend/src/utils/careEquationModel.test.ts
git commit -m "feat(care-ui): modelo puro careEquationModel (draft/json/orbita/smoke)"
```

---

### Task 2: `CareEquationHeader` + `CareFormulaCanvas` (presentational)

**Files:**
- Create: `frontend/src/components/care/CareEquationHeader.tsx`
- Create: `frontend/src/components/care/CareEquationHeader.test.tsx`
- Create: `frontend/src/components/care/CareFormulaCanvas.tsx`
- Create: `frontend/src/components/care/CareFormulaCanvas.test.tsx`

**Interfaces:**
- Consumes: `CARE_DIMENSIONS`, `CareDimensionKey` from `../../constants/careDimensions`; `FormulaBlocks` from `../../services/careFormulaService`; `percentOf` from `../../utils/careCriteriaModel`; `orbitNodes` from `../../utils/careEquationModel` (Task 1).
- Produces:
  - `interface CareEquationHeaderProps { blocks: FormulaBlocks; focus?: CareDimensionKey | null; }`, default export `CareEquationHeader`. `data-testid="equation-formula"` (the stylized formula), `data-testid="header-chip-<key>"` (chip label `<chip> <pct>%`, `data-focus="true|false"`), `data-testid="prefilter-attraction"` + `data-testid="prefilter-identity"` (read-only chips).
  - `interface CareFormulaCanvasProps { blocks: FormulaBlocks; focus?: CareDimensionKey | null; }`, default export `CareFormulaCanvas`. `data-testid="canvas-psi"`, `data-testid="node-<key>"` (with `data-radius`), `data-testid="edge-label-<key>"` (coefficient `%`), focused node carries `data-focus="true"`.

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/components/care/CareEquationHeader.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import CareEquationHeader from "./CareEquationHeader";
import { CARE_DIMENSIONS, CANONICAL_BLOCK_WEIGHTS } from "../../constants/careDimensions";

const canonical = { ...CANONICAL_BLOCK_WEIGHTS };

describe("CareEquationHeader", () => {
  it("renders the stylized canonical formula", () => {
    render(<CareEquationHeader blocks={canonical} />);
    expect(screen.getByTestId("equation-formula")).toHaveTextContent(
      "CARE_score = Σ wᵢ·fᵢ + χ(t)",
    );
  });

  it("renders one synced chip per dimension with its percentage", () => {
    render(<CareEquationHeader blocks={canonical} />);
    CARE_DIMENSIONS.forEach((dim) => {
      expect(screen.getByTestId(`header-chip-${dim.key}`)).toHaveTextContent(dim.chip);
    });
    expect(screen.getByTestId("header-chip-values")).toHaveTextContent("36%");
    expect(screen.getByTestId("header-chip-communication_style")).toHaveTextContent("4%");
  });

  it("emphasizes the focused chip only", () => {
    render(<CareEquationHeader blocks={canonical} focus="music" />);
    expect(screen.getByTestId("header-chip-music")).toHaveAttribute("data-focus", "true");
    expect(screen.getByTestId("header-chip-values")).toHaveAttribute("data-focus", "false");
  });

  it("renders the read-only pre-filter chips", () => {
    render(<CareEquationHeader blocks={canonical} />);
    expect(screen.getByTestId("prefilter-attraction")).toHaveTextContent("Atracción mutua");
    expect(screen.getByTestId("prefilter-identity")).toHaveTextContent("Identidad");
    expect(screen.getByText(/ANTES de la ecuación/i)).toBeInTheDocument();
  });
});
```

Create `frontend/src/components/care/CareFormulaCanvas.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import CareFormulaCanvas from "./CareFormulaCanvas";
import { CANONICAL_BLOCK_WEIGHTS } from "../../constants/careDimensions";

const canonical = { ...CANONICAL_BLOCK_WEIGHTS };

describe("CareFormulaCanvas", () => {
  it("renders the central Ψ node", () => {
    render(<CareFormulaCanvas blocks={canonical} />);
    expect(screen.getByTestId("canvas-psi")).toBeInTheDocument();
    expect(screen.getByTestId("canvas-psi").parentElement).not.toBeNull();
    expect(screen.getByText("Ψ")).toBeInTheDocument();
  });

  it("renders 7 orbital nodes sized proportionally to weight", () => {
    render(<CareFormulaCanvas blocks={canonical} />);
    const values = screen.getByTestId("node-values");
    const comms = screen.getByTestId("node-communication_style");
    expect(Number(values.getAttribute("data-radius"))).toBeGreaterThan(
      Number(comms.getAttribute("data-radius")),
    );
  });

  it("labels each edge with its weight coefficient", () => {
    render(<CareFormulaCanvas blocks={canonical} />);
    expect(screen.getByTestId("edge-label-values")).toHaveTextContent("36%");
    expect(screen.getByTestId("edge-label-music")).toHaveTextContent("11%");
  });

  it("marks the focused node", () => {
    render(<CareFormulaCanvas blocks={canonical} focus="values" />);
    expect(screen.getByTestId("node-values")).toHaveAttribute("data-focus", "true");
    expect(screen.getByTestId("node-music")).toHaveAttribute("data-focus", "false");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/components/care/CareEquationHeader.test.tsx src/components/care/CareFormulaCanvas.test.tsx --ci`
Expected: FAIL — "Cannot find module './CareEquationHeader'".

- [ ] **Step 3: Write minimal implementations**

Create `frontend/src/components/care/CareEquationHeader.tsx`:

```tsx
import { Chip, Paper, Stack, Typography } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import {
  CARE_DIMENSIONS,
  type CareDimensionKey,
} from "../../constants/careDimensions";
import type { FormulaBlocks } from "../../services/careFormulaService";
import { percentOf } from "../../utils/careCriteriaModel";

export interface CareEquationHeaderProps {
  /** Active weights, stored as fractions (0–1). */
  blocks: FormulaBlocks;
  /** Dimension row to emphasize (from the criteria draft handoff). */
  focus?: CareDimensionKey | null;
}

/**
 * The stylized CARE equation with α–η chips synced to the active weights,
 * plus the read-only safety pre-filters that run BEFORE the equation.
 */
export default function CareEquationHeader({
  blocks,
  focus = null,
}: CareEquationHeaderProps) {
  return (
    <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
      <Typography variant="overline" sx={{ color: "text.secondary" }}>
        Ecuación canónica
      </Typography>
      <Typography
        data-testid="equation-formula"
        sx={{
          fontFamily: "monospace",
          fontSize: "1.5rem",
          fontWeight: 800,
          mt: 0.5,
          mb: 2,
        }}
      >
        CARE_score = Σ wᵢ·fᵢ + χ(t)
      </Typography>
      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, mb: 2 }}>
        {CARE_DIMENSIONS.map((dim) => (
          <Chip
            key={dim.key}
            data-testid={`header-chip-${dim.key}`}
            data-focus={focus === dim.key ? "true" : "false"}
            label={`${dim.chip} ${percentOf(blocks[dim.key])}%`}
            size="small"
            sx={{
              bgcolor: dim.color,
              color: "#fff",
              fontWeight: 700,
              ...(focus === dim.key
                ? { outline: "2px solid", outlineColor: "text.primary" }
                : {}),
            }}
          />
        ))}
      </Stack>
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: "center", flexWrap: "wrap", gap: 1 }}
      >
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Pre-filtros (read-only):
        </Typography>
        <Chip
          data-testid="prefilter-attraction"
          icon={<LockIcon />}
          label="Atracción mutua"
          size="small"
          variant="outlined"
        />
        <Chip
          data-testid="prefilter-identity"
          icon={<LockIcon />}
          label="Identidad"
          size="small"
          variant="outlined"
        />
        <Typography variant="caption" sx={{ fontWeight: 700 }}>
          → ANTES de la ecuación
        </Typography>
      </Stack>
    </Paper>
  );
}
```

Create `frontend/src/components/care/CareFormulaCanvas.tsx`:

```tsx
import { Box, Paper, Typography } from "@mui/material";
import type { CareDimensionKey } from "../../constants/careDimensions";
import type { FormulaBlocks } from "../../services/careFormulaService";
import { orbitNodes } from "../../utils/careEquationModel";

export interface CareFormulaCanvasProps {
  /** Active weights, stored as fractions (0–1). */
  blocks: FormulaBlocks;
  /** Node to emphasize (from the criteria draft handoff). */
  focus?: CareDimensionKey | null;
}

const CX = 160;
const CY = 160;

/**
 * Hand-built SVG (no chart libs): center node Ψ with 7 orbital dimension nodes
 * whose radius is proportional to the weight, and radial edges labeled with the
 * coefficient (weight %).
 */
export default function CareFormulaCanvas({
  blocks,
  focus = null,
}: CareFormulaCanvasProps) {
  const nodes = orbitNodes(blocks);
  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
        Diagrama Ψ / M
      </Typography>
      <Box
        component="svg"
        viewBox="0 0 320 320"
        sx={{ width: "100%", maxWidth: 320, height: "auto" }}
      >
        {nodes.map((node) => (
          <g key={node.key} data-testid={`edge-${node.key}`}>
            <line
              x1={CX}
              y1={CY}
              x2={node.x}
              y2={node.y}
              stroke={node.color}
              strokeWidth={1 + node.percent / 40}
              opacity={0.5}
            />
            <text
              data-testid={`edge-label-${node.key}`}
              x={(CX + node.x) / 2}
              y={(CY + node.y) / 2}
              fontSize={10}
              fill={node.color}
              textAnchor="middle"
            >
              {node.percent}%
            </text>
          </g>
        ))}
        <g data-testid="canvas-psi">
          <circle cx={CX} cy={CY} r={26} fill="#1f1f1f" stroke="#ff4d4f" strokeWidth={2} />
          <text x={CX} y={CY + 8} fontSize={22} fill="#fff" textAnchor="middle" fontWeight={800}>
            Ψ
          </text>
        </g>
        {nodes.map((node) => (
          <g
            key={node.key}
            data-testid={`node-${node.key}`}
            data-radius={node.radius}
            data-focus={focus === node.key ? "true" : "false"}
          >
            <circle
              cx={node.x}
              cy={node.y}
              r={node.radius}
              fill={node.color}
              opacity={0.85}
              stroke={focus === node.key ? "#fff" : "none"}
              strokeWidth={2}
            />
            <text
              x={node.x}
              y={node.y + 4}
              fontSize={12}
              fill="#fff"
              textAnchor="middle"
              fontWeight={700}
            >
              {node.chip}
            </text>
          </g>
        ))}
      </Box>
    </Paper>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest src/components/care/CareEquationHeader.test.tsx src/components/care/CareFormulaCanvas.test.tsx --ci`
Expected: PASS.

- [ ] **Step 5: Typecheck + commit**

Run: `npm run typecheck`
Expected: no new errors.

```bash
git add frontend/src/components/care/CareEquationHeader.tsx frontend/src/components/care/CareEquationHeader.test.tsx frontend/src/components/care/CareFormulaCanvas.tsx frontend/src/components/care/CareFormulaCanvas.test.tsx
git commit -m "feat(care-ui): cabecera ecuacion y canvas SVG Psi/M"
```

---

### Task 3: `CareEquationBlocks`, `CareChaosPanel`, `CareThresholdsPanel` (presentational)

**Files:**
- Create: `frontend/src/components/care/CareEquationBlocks.tsx` (+ `.test.tsx`)
- Create: `frontend/src/components/care/CareChaosPanel.tsx` (+ `.test.tsx`)
- Create: `frontend/src/components/care/CareThresholdsPanel.tsx` (+ `.test.tsx`)

**Interfaces:**
- Consumes: `CARE_DIMENSIONS`, `CareDimensionKey`; `FormulaBlocks`; `percentOf`; `EXAMPLE_FEATURES`, `CHAOS_MAX`, `formatDelta` from `../../utils/careEquationModel`.
- Produces:
  - `interface CareEquationBlocksProps { blocks: FormulaBlocks; focus?: CareDimensionKey | null; onSliderChange: (key: CareDimensionKey, percent: number) => void; }` — `data-testid="eq-block-<key>"`, `eq-chip-<key>`, `eq-slider-<key>`, `eq-percent-<key>`, `eq-example-<key>`; focused row `data-focus="true"`.
  - `interface CareChaosPanelProps { chaosFactor: number; chaosSeed: string | null; deltaIndicator?: number | null; onChaosChange: (factor: number) => void; onSeedChange: (seed: string | null) => void; onGenerateSeed: () => void; }` — `chaos-slider`, `chaos-label` (`±X% desviación máxima`), `chaos-seed`, `chaos-generate-seed`, `chaos-delta`.
  - `interface CareThresholdsPanelProps { minCompatibility: number; matchCritical: number; onMinChange: (value: number) => void; onMatchChange: (value: number) => void; }` — `threshold-min`, `threshold-match`.

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/components/care/CareEquationBlocks.test.tsx`:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import CareEquationBlocks from "./CareEquationBlocks";
import { CANONICAL_BLOCK_WEIGHTS } from "../../constants/careDimensions";

const canonical = { ...CANONICAL_BLOCK_WEIGHTS };

const sliderInput = (key: string): HTMLInputElement =>
  screen.getByTestId(`eq-slider-${key}`).querySelector("input") as HTMLInputElement;

describe("CareEquationBlocks", () => {
  it("renders a chip, percent and example fᵢ for each dimension", () => {
    render(<CareEquationBlocks blocks={canonical} onSliderChange={jest.fn()} />);
    expect(screen.getByTestId("eq-chip-values")).toHaveTextContent("α");
    expect(screen.getByTestId("eq-percent-values")).toHaveTextContent("36%");
    expect(screen.getByTestId("eq-example-values")).toHaveTextContent("0.8");
  });

  it("emits onSliderChange with the key and integer percent", () => {
    const onSliderChange = jest.fn();
    render(<CareEquationBlocks blocks={canonical} onSliderChange={onSliderChange} />);
    fireEvent.change(sliderInput("values"), { target: { value: "40" } });
    expect(onSliderChange).toHaveBeenCalledWith("values", 40);
  });

  it("marks the focused row", () => {
    render(<CareEquationBlocks blocks={canonical} focus="music" onSliderChange={jest.fn()} />);
    expect(screen.getByTestId("eq-block-music")).toHaveAttribute("data-focus", "true");
    expect(screen.getByTestId("eq-block-values")).toHaveAttribute("data-focus", "false");
  });
});
```

Create `frontend/src/components/care/CareChaosPanel.test.tsx`:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import CareChaosPanel from "./CareChaosPanel";

const sliderInput = (): HTMLInputElement =>
  screen.getByTestId("chaos-slider").querySelector("input") as HTMLInputElement;

describe("CareChaosPanel", () => {
  it("labels the slider as the max deviation", () => {
    render(
      <CareChaosPanel
        chaosFactor={5}
        chaosSeed={null}
        onChaosChange={jest.fn()}
        onSeedChange={jest.fn()}
        onGenerateSeed={jest.fn()}
      />,
    );
    expect(screen.getByTestId("chaos-label")).toHaveTextContent("±5% desviación máxima");
  });

  it("emits onChaosChange with the slider value", () => {
    const onChaosChange = jest.fn();
    render(
      <CareChaosPanel
        chaosFactor={5}
        chaosSeed={null}
        onChaosChange={onChaosChange}
        onSeedChange={jest.fn()}
        onGenerateSeed={jest.fn()}
      />,
    );
    fireEvent.change(sliderInput(), { target: { value: "12" } });
    expect(onChaosChange).toHaveBeenCalledWith(12);
  });

  it("emits onSeedChange (and null when cleared) and triggers seed generation", () => {
    const onSeedChange = jest.fn();
    const onGenerateSeed = jest.fn();
    render(
      <CareChaosPanel
        chaosFactor={5}
        chaosSeed="abc"
        onChaosChange={jest.fn()}
        onSeedChange={onSeedChange}
        onGenerateSeed={onGenerateSeed}
      />,
    );
    const input = screen.getByTestId("chaos-seed").querySelector("input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "seed-9" } });
    expect(onSeedChange).toHaveBeenCalledWith("seed-9");
    fireEvent.change(input, { target: { value: "" } });
    expect(onSeedChange).toHaveBeenLastCalledWith(null);
    fireEvent.click(screen.getByTestId("chaos-generate-seed"));
    expect(onGenerateSeed).toHaveBeenCalledTimes(1);
  });

  it("shows the Δ indicator, or — when absent", () => {
    const { rerender } = render(
      <CareChaosPanel
        chaosFactor={5}
        chaosSeed={null}
        onChaosChange={jest.fn()}
        onSeedChange={jest.fn()}
        onGenerateSeed={jest.fn()}
      />,
    );
    expect(screen.getByTestId("chaos-delta")).toHaveTextContent("—");
    rerender(
      <CareChaosPanel
        chaosFactor={5}
        chaosSeed={null}
        deltaIndicator={0.12}
        onChaosChange={jest.fn()}
        onSeedChange={jest.fn()}
        onGenerateSeed={jest.fn()}
      />,
    );
    expect(screen.getByTestId("chaos-delta")).toHaveTextContent("+0.120");
  });
});
```

Create `frontend/src/components/care/CareThresholdsPanel.test.tsx`:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import CareThresholdsPanel from "./CareThresholdsPanel";

describe("CareThresholdsPanel", () => {
  it("renders both thresholds with helper text", () => {
    render(
      <CareThresholdsPanel
        minCompatibility={0}
        matchCritical={0.15}
        onMinChange={jest.fn()}
        onMatchChange={jest.fn()}
      />,
    );
    const min = screen.getByTestId("threshold-min").querySelector("input") as HTMLInputElement;
    const match = screen.getByTestId("threshold-match").querySelector("input") as HTMLInputElement;
    expect(min.value).toBe("0");
    expect(match.value).toBe("0.15");
    expect(screen.getByText(/Gate mínimo/i)).toBeInTheDocument();
    expect(screen.getByText(/default 0.15/i)).toBeInTheDocument();
  });

  it("emits numeric changes", () => {
    const onMinChange = jest.fn();
    const onMatchChange = jest.fn();
    render(
      <CareThresholdsPanel
        minCompatibility={0}
        matchCritical={0.15}
        onMinChange={onMinChange}
        onMatchChange={onMatchChange}
      />,
    );
    const min = screen.getByTestId("threshold-min").querySelector("input") as HTMLInputElement;
    fireEvent.change(min, { target: { value: "0.2" } });
    expect(onMinChange).toHaveBeenCalledWith(0.2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/components/care/CareEquationBlocks.test.tsx src/components/care/CareChaosPanel.test.tsx src/components/care/CareThresholdsPanel.test.tsx --ci`
Expected: FAIL — "Cannot find module './CareEquationBlocks'".

- [ ] **Step 3: Write minimal implementations**

Create `frontend/src/components/care/CareEquationBlocks.tsx`:

```tsx
import {
  Box,
  Paper,
  Slider,
  Stack,
  Typography,
} from "@mui/material";
import {
  CARE_DIMENSIONS,
  type CareDimensionKey,
} from "../../constants/careDimensions";
import type { FormulaBlocks } from "../../services/careFormulaService";
import { percentOf } from "../../utils/careCriteriaModel";
import { EXAMPLE_FEATURES } from "../../utils/careEquationModel";

export interface CareEquationBlocksProps {
  /** Editable weights, stored as fractions (0–1). */
  blocks: FormulaBlocks;
  /** Row to emphasize (from the criteria draft handoff). */
  focus?: CareDimensionKey | null;
  onSliderChange: (key: CareDimensionKey, percent: number) => void;
}

/**
 * The 7 canonical blocks (matrix M) with a chip, a raw 0–100% slider and an
 * illustrative feature value fᵢ. Emits intent only — no state, no network.
 */
export default function CareEquationBlocks({
  blocks,
  focus = null,
  onSliderChange,
}: CareEquationBlocksProps) {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
        Bloques (Matriz M)
      </Typography>
      <Stack spacing={2.5}>
        {CARE_DIMENSIONS.map((dim) => {
          const percent = percentOf(blocks[dim.key]);
          return (
            <Box key={dim.key} data-testid={`eq-block-${dim.key}`} data-focus={focus === dim.key ? "true" : "false"}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <Box
                    data-testid={`eq-chip-${dim.key}`}
                    sx={{
                      width: 24,
                      height: 24,
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
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <Typography variant="caption" data-testid={`eq-example-${dim.key}`} sx={{ color: "text.secondary" }}>
                    fᵢ = {EXAMPLE_FEATURES[dim.key].toFixed(2)}
                  </Typography>
                  <Typography variant="body2" data-testid={`eq-percent-${dim.key}`} sx={{ minWidth: 40, fontWeight: 800 }}>
                    {percent}%
                  </Typography>
                </Stack>
              </Box>
              <Slider
                data-testid={`eq-slider-${dim.key}`}
                value={percent}
                min={0}
                max={100}
                step={1}
                size="small"
                onChange={(_, value) =>
                  onSliderChange(dim.key, Array.isArray(value) ? value[0] : value)
                }
              />
            </Box>
          );
        })}
      </Stack>
    </Paper>
  );
}
```

Create `frontend/src/components/care/CareChaosPanel.tsx`:

```tsx
import { Box, Button, Paper, Slider, Stack, TextField, Typography } from "@mui/material";
import CasinoIcon from "@mui/icons-material/Casino";
import { CHAOS_MAX, formatDelta } from "../../utils/careEquationModel";

export interface CareChaosPanelProps {
  chaosFactor: number;
  chaosSeed: string | null;
  /** Δ from the last simulation (mean delta), or null. */
  deltaIndicator?: number | null;
  onChaosChange: (factor: number) => void;
  onSeedChange: (seed: string | null) => void;
  onGenerateSeed: () => void;
}

const formatFactor = (value: number): string =>
  Number.isInteger(value) ? String(value) : value.toFixed(1);

/** χ(t): a controlled ±X% max deviation with an optional reproducible seed. */
export default function CareChaosPanel({
  chaosFactor,
  chaosSeed,
  deltaIndicator = null,
  onChaosChange,
  onSeedChange,
  onGenerateSeed,
}: CareChaosPanelProps) {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
        Caos χ(t)
      </Typography>
      <Typography variant="body2" data-testid="chaos-label" sx={{ fontWeight: 700 }}>
        ±{formatFactor(chaosFactor)}% desviación máxima
      </Typography>
      <Slider
        data-testid="chaos-slider"
        value={chaosFactor}
        min={0}
        max={CHAOS_MAX}
        step={0.5}
        size="small"
        onChange={(_, value) => onChaosChange(Array.isArray(value) ? value[0] : value)}
      />
      <Stack spacing={2} sx={{ mt: 2 }}>
        <TextField
          data-testid="chaos-seed"
          label="Semilla (reproducible)"
          size="small"
          fullWidth
          value={chaosSeed ?? ""}
          onChange={(event) => onSeedChange(event.target.value === "" ? null : event.target.value)}
          helperText="Vacío = aleatoria."
        />
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", gap: 1 }}>
          <Button
            data-testid="chaos-generate-seed"
            size="small"
            variant="outlined"
            startIcon={<CasinoIcon />}
            onClick={onGenerateSeed}
          >
            Generar semilla
          </Button>
          <Button size="small" onClick={() => onSeedChange(null)}>
            Limpiar
          </Button>
          <Box sx={{ ml: "auto" }}>
            <Typography variant="body2" data-testid="chaos-delta" sx={{ fontWeight: 700 }}>
              Δ {deltaIndicator === null ? "—" : formatDelta(deltaIndicator)}
            </Typography>
          </Box>
        </Stack>
      </Stack>
    </Paper>
  );
}
```

Create `frontend/src/components/care/CareThresholdsPanel.tsx`:

```tsx
import { Paper, Stack, TextField, Typography } from "@mui/material";

export interface CareThresholdsPanelProps {
  minCompatibility: number;
  matchCritical: number;
  onMinChange: (value: number) => void;
  onMatchChange: (value: number) => void;
}

/** Configurable thresholds: the ranking gate and the UI critical-match badge. */
export default function CareThresholdsPanel({
  minCompatibility,
  matchCritical,
  onMinChange,
  onMatchChange,
}: CareThresholdsPanelProps) {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
        Umbrales
      </Typography>
      <Stack spacing={3}>
        <TextField
          data-testid="threshold-min"
          label="min_compatibility"
          type="number"
          size="small"
          fullWidth
          value={minCompatibility}
          onChange={(event) => onMinChange(Number(event.target.value))}
          helperText="Gate mínimo para rankear candidatos (0 = sin efecto)."
        />
        <TextField
          data-testid="threshold-match"
          label="match_critical"
          type="number"
          size="small"
          fullWidth
          value={matchCritical}
          onChange={(event) => onMatchChange(Number(event.target.value))}
          helperText="Badge de match crítico (default 0.15)."
        />
      </Stack>
    </Paper>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest src/components/care/CareEquationBlocks.test.tsx src/components/care/CareChaosPanel.test.tsx src/components/care/CareThresholdsPanel.test.tsx --ci`
Expected: PASS.

- [ ] **Step 5: Typecheck + commit**

Run: `npm run typecheck`
Expected: no new errors.

```bash
git add frontend/src/components/care/CareEquationBlocks.tsx frontend/src/components/care/CareEquationBlocks.test.tsx frontend/src/components/care/CareChaosPanel.tsx frontend/src/components/care/CareChaosPanel.test.tsx frontend/src/components/care/CareThresholdsPanel.tsx frontend/src/components/care/CareThresholdsPanel.test.tsx
git commit -m "feat(care-ui): bloques, panel caos con semilla y umbrales"
```

---

### Task 4: `CareFormulaJsonEditor` + `CareSimulationTable` (presentational)

**Files:**
- Create: `frontend/src/components/care/CareFormulaJsonEditor.tsx` (+ `.test.tsx`)
- Create: `frontend/src/components/care/CareSimulationTable.tsx` (+ `.test.tsx`)

**Interfaces:**
- Consumes: `SimulateResult` type from `../../services/careFormulaService`; `formatDelta` from `../../utils/careEquationModel`.
- Produces:
  - `interface CareFormulaJsonEditorProps { value: string; valid: boolean; error?: string | null; onChange: (text: string) => void; }` — `data-testid="formula-json"` (controlled multiline field), `json-validity-chip` (`JSON válido` / `JSON inválido`); the `error` string is shown as helper text when invalid.
  - `interface CareSimulationTableProps { result: SimulateResult | null; loading?: boolean; }` — returns `null` when `result` is null; `simulation-loading` while loading; `simulation-table`, `sim-mock`, `sim-row-<candidate_id>`, `sim-without-chi-<candidate_id>`, `sim-delta-<candidate_id>`, `sim-mean-delta`.

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/components/care/CareFormulaJsonEditor.test.tsx`:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import CareFormulaJsonEditor from "./CareFormulaJsonEditor";

describe("CareFormulaJsonEditor", () => {
  it("shows a green chip when valid", () => {
    render(<CareFormulaJsonEditor value="{}" valid onChange={jest.fn()} />);
    expect(screen.getByTestId("json-validity-chip")).toHaveTextContent("JSON válido");
  });

  it("shows a red chip and the error when invalid", () => {
    render(
      <CareFormulaJsonEditor
        value="not-json"
        valid={false}
        error="JSON inválido: revisa la sintaxis."
        onChange={jest.fn()}
      />,
    );
    expect(screen.getByTestId("json-validity-chip")).toHaveTextContent("JSON inválido");
    expect(screen.getByText("JSON inválido: revisa la sintaxis.")).toBeInTheDocument();
  });

  it("emits onChange with the typed text", () => {
    const onChange = jest.fn();
    render(<CareFormulaJsonEditor value="" valid onChange={onChange} />);
    const textarea = screen
      .getByTestId("formula-json")
      .querySelector("textarea") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '{"blocks":{}}' } });
    expect(onChange).toHaveBeenCalledWith('{"blocks":{}}');
  });
});
```

Create `frontend/src/components/care/CareSimulationTable.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import CareSimulationTable from "./CareSimulationTable";

const result = {
  mock: true,
  ranking: [
    { candidate_id: "c1", score_current: 0.5, score_proposed: 0.6, chi_current: 0, chi_proposed: 0.02, delta: 0.1 },
    { candidate_id: "c2", score_current: 0.4, score_proposed: 0.45, chi_current: 0, chi_proposed: 0.01, delta: 0.05 },
  ],
  mean_delta: 0.075,
};

describe("CareSimulationTable", () => {
  it("renders nothing when there is no result", () => {
    const { container } = render(<CareSimulationTable result={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a loading indicator", () => {
    render(<CareSimulationTable result={null} loading />);
    expect(screen.getByTestId("simulation-loading")).toBeInTheDocument();
  });

  it("renders one row per candidate plus the mock chip and mean delta", () => {
    render(<CareSimulationTable result={result} />);
    expect(screen.getByTestId("sim-row-c1")).toBeInTheDocument();
    expect(screen.getByTestId("sim-row-c2")).toBeInTheDocument();
    expect(screen.getByTestId("sim-mock")).toHaveTextContent("Datos mock");
    expect(screen.getByTestId("sim-without-chi-c1")).toHaveTextContent("0.580");
    expect(screen.getByTestId("sim-delta-c2")).toHaveTextContent("+0.050");
    expect(screen.getByTestId("sim-mean-delta")).toHaveTextContent("+0.075");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/components/care/CareFormulaJsonEditor.test.tsx src/components/care/CareSimulationTable.test.tsx --ci`
Expected: FAIL — "Cannot find module './CareFormulaJsonEditor'".

- [ ] **Step 3: Write minimal implementations**

Create `frontend/src/components/care/CareFormulaJsonEditor.tsx`:

```tsx
import { Box, Chip, Paper, TextField, Typography } from "@mui/material";

export interface CareFormulaJsonEditorProps {
  /** Current JSON text (owned by the page). */
  value: string;
  /** Whether the last parse succeeded. */
  valid: boolean;
  /** Parse error to surface when invalid. */
  error?: string | null;
  onChange: (text: string) => void;
}

/**
 * Bidirectional JSON view: slider changes rewrite `value`; a valid edit parses
 * back into sliders. Invalid text shows a red chip and the last valid state is
 * kept (that decision lives in the page).
 */
export default function CareFormulaJsonEditor({
  value,
  valid,
  error = null,
  onChange,
}: CareFormulaJsonEditorProps) {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          JSON de la fórmula
        </Typography>
        <Chip
          data-testid="json-validity-chip"
          label={valid ? "JSON válido" : "JSON inválido"}
          color={valid ? "success" : "error"}
          size="small"
          variant="outlined"
        />
      </Box>
      <TextField
        data-testid="formula-json"
        multiline
        fullWidth
        minRows={14}
        value={value}
        error={!valid}
        helperText={
          !valid && error ? error : "slider → JSON; JSON válido → sliders."
        }
        onChange={(event) => onChange(event.target.value)}
        sx={{ "& textarea": { fontFamily: "monospace", fontSize: "0.8rem" } }}
      />
    </Paper>
  );
}
```

Create `frontend/src/components/care/CareSimulationTable.tsx`:

```tsx
import {
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type { SimulateResult } from "../../services/careFormulaService";
import { formatDelta } from "../../utils/careEquationModel";

export interface CareSimulationTableProps {
  result: SimulateResult | null;
  loading?: boolean;
}

/**
 * Ranking table from `POST /formula/simulate`: current vs proposed score, the
 * proposed score with χ removed, and the per-candidate Δ.
 */
export default function CareSimulationTable({
  result,
  loading = false,
}: CareSimulationTableProps) {
  if (loading) {
    return (
      <Typography variant="body2" data-testid="simulation-loading" sx={{ py: 2 }}>
        Simulando...
      </Typography>
    );
  }
  if (!result) return null;
  return (
    <Paper variant="outlined" sx={{ p: 2 }} data-testid="simulation-table">
      <Typography
        variant="subtitle2"
        sx={{ fontWeight: 700, mb: 1, display: "flex", alignItems: "center", gap: 1 }}
      >
        Ranking simulado
        {result.mock && (
          <Chip data-testid="sim-mock" label="Datos mock (8 perfiles)" size="small" variant="outlined" />
        )}
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Candidato</TableCell>
              <TableCell align="right">Actual</TableCell>
              <TableCell align="right">Propuesto (χ)</TableCell>
              <TableCell align="right">Sin χ</TableCell>
              <TableCell align="right">Δ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {result.ranking.map((row) => (
              <TableRow key={row.candidate_id} data-testid={`sim-row-${row.candidate_id}`}>
                <TableCell>{row.candidate_id}</TableCell>
                <TableCell align="right">{row.score_current.toFixed(3)}</TableCell>
                <TableCell align="right">{row.score_proposed.toFixed(3)}</TableCell>
                <TableCell align="right" data-testid={`sim-without-chi-${row.candidate_id}`}>
                  {(row.score_proposed - row.chi_proposed).toFixed(3)}
                </TableCell>
                <TableCell align="right" data-testid={`sim-delta-${row.candidate_id}`}>
                  {formatDelta(row.delta)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Typography variant="body2" data-testid="sim-mean-delta" sx={{ mt: 1, fontWeight: 700 }}>
        Δ score medio: {formatDelta(result.mean_delta)}
      </Typography>
    </Paper>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest src/components/care/CareFormulaJsonEditor.test.tsx src/components/care/CareSimulationTable.test.tsx --ci`
Expected: PASS.

- [ ] **Step 5: Typecheck + commit**

Run: `npm run typecheck`
Expected: no new errors.

```bash
git add frontend/src/components/care/CareFormulaJsonEditor.tsx frontend/src/components/care/CareFormulaJsonEditor.test.tsx frontend/src/components/care/CareSimulationTable.tsx frontend/src/components/care/CareSimulationTable.test.tsx
git commit -m "feat(care-ui): editor JSON bidireccional y tabla de simulacion"
```

---

### Task 5: Rewrite `equation.tsx` — load, draft decode, panels, `Validar` + `Simular`

**Files:**
- Modify (full rewrite): `frontend/src/pages/portal-redthread/care/equation.tsx`
- Test (new): `frontend/src/pages/portal-redthread/care/equation.test.tsx`

**Interfaces:**
- Consumes: `getActiveFormula`, `validateFormula`, `simulateFormula` and types `FormulaBlocks`, `SimulateResult` from `../../../services/careFormulaService`; `decodeEquationDraft` from `../../../utils/careCriteriaModel`; `clientValidation`, `detectDegenerate`, `draftToPayload`, `parseDraft`, `serializeDraft`, `smokeAlerts`, `toEquationDraft`, type `EquationDraft` from `../../../utils/careEquationModel`; the Task 2–4 components.
- Produces: default export `CareEquationPage`. On mount (`router.isReady`) it loads `getActiveFormula`, applies `decodeEquationDraft(router.query)` when present (overriding `blocks` + setting `focus`), and renders the panels. `data-testid`s: `equation-loading`, `equation-error`, `validate-errors`, `validate-alerts`, `simulate-error`, `action-validate`, `action-simulate`. **No save/versions yet** (Tasks 6–7 add preview + save/versions).

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/pages/portal-redthread/care/equation.test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CareEquationPage from "./equation";
import {
  getActiveFormula,
  simulateFormula,
  validateFormula,
} from "../../../services/careFormulaService";
import { CANONICAL_BLOCK_WEIGHTS } from "../../../constants/careDimensions";

let mockQuery: Record<string, string> = {};
jest.mock("next/router", () => ({
  useRouter: () => ({ isReady: true, query: mockQuery, push: jest.fn() }),
}));

jest.mock("../../../components/layout/AdminLayout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("../../../components/care/CareEquationHeader", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props: { blocks: Record<string, number>; focus: string | null }) =>
      React.createElement("div", {
        "data-testid": "header-stub",
        "data-blocks": JSON.stringify(props.blocks),
        "data-focus": props.focus ?? "",
      }),
  };
});
jest.mock("../../../components/care/CareFormulaCanvas", () => {
  const React = require("react");
  return { __esModule: true, default: () => React.createElement("div", { "data-testid": "canvas-stub" }) };
});
jest.mock("../../../components/care/CareEquationBlocks", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props: { onSliderChange: (k: string, p: number) => void }) =>
      React.createElement(
        "div",
        { "data-testid": "blocks-stub" },
        React.createElement("button", {
          "data-testid": "stub-block-values",
          onClick: () => props.onSliderChange("values", 40),
        }),
      ),
  };
});
jest.mock("../../../components/care/CareChaosPanel", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props: {
      deltaIndicator: number | null;
      onChaosChange: (v: number) => void;
      onGenerateSeed: () => void;
    }) =>
      React.createElement(
        "div",
        { "data-testid": "chaos-stub", "data-delta": String(props.deltaIndicator) },
        React.createElement("button", { "data-testid": "stub-chaos", onClick: () => props.onChaosChange(10) }),
        React.createElement("button", { "data-testid": "stub-generate-seed", onClick: () => props.onGenerateSeed() }),
      ),
  };
});
jest.mock("../../../components/care/CareThresholdsPanel", () => {
  const React = require("react");
  return { __esModule: true, default: () => React.createElement("div", { "data-testid": "thresholds-stub" }) };
});
jest.mock("../../../components/care/CareFormulaJsonEditor", () => {
  const React = require("react");
  const validJson = JSON.stringify({
    blocks: {
      values: 0.4,
      relationship_goals: 0.18,
      neurodiversity: 0.15,
      responsiveness: 0.1,
      music: 0.07,
      love_language: 0.06,
      communication_style: 0.04,
    },
    chaos_factor: 0,
    chaos_seed: null,
    min_compatibility: 0,
    match_critical: 0.15,
  });
  return {
    __esModule: true,
    default: (props: { value: string; valid: boolean; onChange: (t: string) => void }) =>
      React.createElement(
        "div",
        { "data-testid": "json-stub", "data-valid": String(props.valid), "data-value": props.value },
        React.createElement("button", { "data-testid": "stub-json-valid", onClick: () => props.onChange(validJson) }),
        React.createElement("button", { "data-testid": "stub-json-invalid", onClick: () => props.onChange("not-json") }),
      ),
  };
});
jest.mock("../../../components/care/CareSimulationTable", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props: { result: unknown | null }) =>
      React.createElement("div", { "data-testid": "sim-stub", "data-has-result": String(props.result !== null) }),
  };
});
jest.mock("../../../services/careFormulaService", () => ({
  __esModule: true,
  getActiveFormula: jest.fn(),
  validateFormula: jest.fn(),
  simulateFormula: jest.fn(),
}));

const mockGetActive = getActiveFormula as jest.Mock;
const mockValidate = validateFormula as jest.Mock;
const mockSimulate = simulateFormula as jest.Mock;

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

const mockResult = {
  mock: true,
  ranking: [
    { candidate_id: "c1", score_current: 0.5, score_proposed: 0.6, chi_current: 0, chi_proposed: 0.02, delta: 0.1 },
    { candidate_id: "c2", score_current: 0.4, score_proposed: 0.45, chi_current: 0, chi_proposed: 0.01, delta: 0.05 },
  ],
  mean_delta: 0.075,
};

const draftBlocks = {
  values: 0.4,
  relationship_goals: 0.18,
  neurodiversity: 0.15,
  responsiveness: 0.1,
  music: 0.07,
  love_language: 0.06,
  communication_style: 0.04,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockQuery = {};
  mockGetActive.mockResolvedValue(active);
  mockValidate.mockResolvedValue({ valid: true, errors: [] });
  mockSimulate.mockResolvedValue(mockResult);
});

const headerBlocks = (): Record<string, number> =>
  JSON.parse(screen.getByTestId("header-stub").getAttribute("data-blocks") as string);

describe("CareEquationPage / load + draft", () => {
  it("shows a loading indicator before the active formula resolves", () => {
    mockGetActive.mockReturnValue(new Promise(() => {}));
    render(<CareEquationPage />);
    expect(screen.getByTestId("equation-loading")).toBeInTheDocument();
  });

  it("applies the criteria draft from the router query and emphasizes focus", async () => {
    mockQuery = { source: "criteria", focus: "music", w: JSON.stringify(draftBlocks) };
    render(<CareEquationPage />);
    await screen.findByTestId("header-stub");
    expect(screen.getByTestId("header-stub")).toHaveAttribute("data-focus", "music");
    expect(headerBlocks()).toEqual(draftBlocks);
  });

  it("uses the active blocks when no draft is present", async () => {
    render(<CareEquationPage />);
    await screen.findByTestId("header-stub");
    expect(headerBlocks()).toEqual(active.blocks);
    expect(screen.getByTestId("header-stub")).toHaveAttribute("data-focus", "");
  });

  it("renders an error when the active formula fails to load", async () => {
    mockGetActive.mockRejectedValueOnce(new Error("boom"));
    render(<CareEquationPage />);
    expect(await screen.findByTestId("equation-error")).toHaveTextContent(
      "No se pudo cargar la fórmula activa.",
    );
  });
});

describe("CareEquationPage / bidirectional JSON", () => {
  it("regenerates the JSON when a block slider changes", async () => {
    render(<CareEquationPage />);
    await screen.findByTestId("blocks-stub");
    fireEvent.click(screen.getByTestId("stub-block-values"));
    expect(screen.getByTestId("json-stub").getAttribute("data-value")).toContain('"values": 0.4');
  });

  it("regenerates the JSON when the chaos slider changes", async () => {
    render(<CareEquationPage />);
    await screen.findByTestId("chaos-stub");
    fireEvent.click(screen.getByTestId("stub-chaos"));
    expect(screen.getByTestId("json-stub").getAttribute("data-value")).toContain('"chaos_factor": 10');
  });

  it("applies valid JSON back to the draft", async () => {
    render(<CareEquationPage />);
    await screen.findByTestId("json-stub");
    fireEvent.click(screen.getByTestId("stub-json-valid"));
    expect(headerBlocks()).toEqual(draftBlocks);
    expect(screen.getByTestId("json-stub")).toHaveAttribute("data-valid", "true");
  });

  it("flags invalid JSON and keeps the last valid draft", async () => {
    render(<CareEquationPage />);
    await screen.findByTestId("json-stub");
    fireEvent.click(screen.getByTestId("stub-json-invalid"));
    expect(screen.getByTestId("json-stub")).toHaveAttribute("data-valid", "false");
    expect(headerBlocks()).toEqual(active.blocks);
  });
});
```

describe("CareEquationPage / Validar + Simular", () => {
  it("validates and surfaces backend errors", async () => {
    mockValidate.mockResolvedValueOnce({ valid: false, errors: ["La suma de pesos debe ser exactamente 1.0"] });
    render(<CareEquationPage />);
    await screen.findByTestId("blocks-stub");
    fireEvent.click(screen.getByTestId("action-validate"));
    await waitFor(() => expect(mockValidate).toHaveBeenCalledTimes(1));
    expect(mockValidate).toHaveBeenCalledWith(
      expect.objectContaining({ blocks: active.blocks, chaos_factor: 5 }),
    );
    expect(await screen.findByTestId("validate-errors")).toHaveTextContent(
      "La suma de pesos debe ser exactamente 1.0",
    );
    expect(mockSimulate).not.toHaveBeenCalled();
  });

  it("runs the mock smoke test when validation passes", async () => {
    render(<CareEquationPage />);
    await screen.findByTestId("blocks-stub");
    fireEvent.click(screen.getByTestId("action-validate"));
    await waitFor(() => expect(mockSimulate).toHaveBeenCalledTimes(1));
    expect(mockSimulate).toHaveBeenCalledWith({ formula: expect.objectContaining({ blocks: active.blocks }) });
  });

  it("shows degenerate weight + ranking alerts", async () => {
    mockQuery = {
      w: JSON.stringify({
        values: 0.95,
        relationship_goals: 0.05,
        neurodiversity: 0,
        responsiveness: 0,
        music: 0,
        love_language: 0,
        communication_style: 0,
      }),
    };
    mockSimulate.mockResolvedValueOnce({
      mock: true,
      ranking: [
        { candidate_id: "c1", score_current: 0.5, score_proposed: 0.5, chi_current: 0, chi_proposed: 0, delta: 0 },
        { candidate_id: "c2", score_current: 0.5, score_proposed: 0.5, chi_current: 0, chi_proposed: 0, delta: 0 },
      ],
      mean_delta: 0,
    });
    render(<CareEquationPage />);
    await screen.findByTestId("blocks-stub");
    fireEvent.click(screen.getByTestId("action-validate"));
    const alerts = await screen.findByTestId("validate-alerts");
    expect(alerts).toHaveTextContent("0%");
    expect(alerts).toHaveTextContent("idénticos");
  });

  it("short-circuits to client validation for an unbalanced sum", async () => {
    render(<CareEquationPage />);
    await screen.findByTestId("blocks-stub");
    fireEvent.click(screen.getByTestId("stub-block-values")); // values -> 40% => sum 104%
    fireEvent.click(screen.getByTestId("action-validate"));
    expect(await screen.findByTestId("validate-errors")).toHaveTextContent("100%");
    expect(mockValidate).not.toHaveBeenCalled();
  });

  it("simulates and feeds the result (with χ) to the table + chaos Δ", async () => {
    render(<CareEquationPage />);
    await screen.findByTestId("blocks-stub");
    fireEvent.click(screen.getByTestId("action-simulate"));
    await waitFor(() => expect(mockSimulate).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("sim-stub")).toHaveAttribute("data-has-result", "true");
    expect(screen.getByTestId("chaos-stub")).toHaveAttribute("data-delta", "0.075");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/pages/portal-redthread/care/equation.test.tsx --ci`
Expected: FAIL — the legacy page renders an unrelated "Editor de Fórmula" UI and never calls `getActiveFormula`/`validateFormula`/`simulateFormula`.

- [ ] **Step 3: Rewrite the page**

Replace the entire contents of `frontend/src/pages/portal-redthread/care/equation.tsx` with:

```tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import FunctionsIcon from "@mui/icons-material/Functions";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ScienceIcon from "@mui/icons-material/Science";
import AdminLayout from "../../../components/layout/AdminLayout";
import CareEquationHeader from "../../../components/care/CareEquationHeader";
import CareFormulaCanvas from "../../../components/care/CareFormulaCanvas";
import CareEquationBlocks from "../../../components/care/CareEquationBlocks";
import CareChaosPanel from "../../../components/care/CareChaosPanel";
import CareThresholdsPanel from "../../../components/care/CareThresholdsPanel";
import CareFormulaJsonEditor from "../../../components/care/CareFormulaJsonEditor";
import CareSimulationTable from "../../../components/care/CareSimulationTable";
import type { CareDimensionKey } from "../../../constants/careDimensions";
import {
  getActiveFormula,
  simulateFormula,
  validateFormula,
  type SimulateResult,
} from "../../../services/careFormulaService";
import { decodeEquationDraft } from "../../../utils/careCriteriaModel";
import {
  clientValidation,
  detectDegenerate,
  draftToPayload,
  parseDraft,
  serializeDraft,
  smokeAlerts,
  toEquationDraft,
  type EquationDraft,
} from "../../../utils/careEquationModel";

const SEED_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

const randomSeed = (): string => {
  let out = "";
  for (let i = 0; i < 12; i += 1) {
    out += SEED_CHARS[Math.floor(Math.random() * SEED_CHARS.length)];
  }
  return out;
};

export default function CareEquationPage() {
  const router = useRouter();
  const ready = router.isReady;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<EquationDraft | null>(null);
  const [focus, setFocus] = useState<CareDimensionKey | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [jsonValid, setJsonValid] = useState(true);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [validateErrors, setValidateErrors] = useState<string[]>([]);
  const [validateAlerts, setValidateAlerts] = useState<string[]>([]);
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<SimulateResult | null>(null);
  const [simError, setSimError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const active = await getActiveFormula();
        if (cancelled) return;
        const decoded = decodeEquationDraft(router.query);
        const base = toEquationDraft(active);
        const next: EquationDraft = decoded
          ? { ...base, blocks: decoded.blocks }
          : base;
        setDraft(next);
        setFocus(decoded?.focus ?? null);
        setJsonText(serializeDraft(next));
        setJsonValid(true);
        setJsonError(null);
      } catch {
        if (!cancelled) setError("No se pudo cargar la fórmula activa.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, router.query]);

  const applyDraft = (next: EquationDraft) => {
    setDraft(next);
    setJsonText(serializeDraft(next));
    setJsonValid(true);
    setJsonError(null);
  };

  const handleBlockChange = (key: CareDimensionKey, percent: number) => {
    if (!draft) return;
    applyDraft({
      ...draft,
      blocks: { ...draft.blocks, [key]: Math.max(0, Math.min(1, percent / 100)) },
    });
  };

  const handleChaosChange = (factor: number) => {
    if (!draft) return;
    applyDraft({ ...draft, chaosFactor: factor });
  };

  const handleSeedChange = (seed: string | null) => {
    if (!draft) return;
    applyDraft({ ...draft, chaosSeed: seed });
  };

  const handleGenerateSeed = () => handleSeedChange(randomSeed());

  const handleMinChange = (value: number) => {
    if (!draft) return;
    applyDraft({ ...draft, minCompatibility: value });
  };

  const handleMatchChange = (value: number) => {
    if (!draft) return;
    applyDraft({ ...draft, matchCritical: value });
  };

  const handleJsonChange = (text: string) => {
    setJsonText(text);
    const parsed = parseDraft(text);
    if (parsed.ok) {
      setDraft(parsed.draft);
      setJsonValid(true);
      setJsonError(null);
    } else {
      setJsonValid(false);
      setJsonError(parsed.error);
    }
  };

  const handleValidate = async () => {
    if (!draft) return;
    setValidating(true);
    setValidateErrors([]);
    setValidateAlerts(detectDegenerate(draft.blocks));
    const local = clientValidation(draft.blocks);
    if (local.length > 0) {
      setValidateErrors(local);
      setValidating(false);
      return;
    }
    try {
      const result = await validateFormula(draftToPayload(draft));
      setValidateErrors(result.errors);
      if (result.valid) {
        const sim = await simulateFormula({ formula: draftToPayload(draft) });
        setValidateAlerts((prev) => [...prev, ...smokeAlerts(sim.ranking)]);
      }
    } catch {
      setValidateErrors(["No se pudo validar contra el servidor."]);
    } finally {
      setValidating(false);
    }
  };

  const handleSimulate = async () => {
    if (!draft) return;
    setSimulating(true);
    setSimError(null);
    try {
      const result = await simulateFormula({ formula: draftToPayload(draft) });
      setSimResult(result);
    } catch {
      setSimError("No se pudo simular la fórmula.");
    } finally {
      setSimulating(false);
    }
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
                <FunctionsIcon sx={{ fontSize: 32, color: "white" }} />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-0.5px" }}>
                  Editor de Fórmula Ψ/M
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  CARE_score = Σ wᵢ·fᵢ + χ(t) — validar, simular y guardar en versión nueva.
                </Typography>
              </Box>
            </Box>
            <Stack direction="row" spacing={2}>
              <Button
                data-testid="action-validate"
                variant="outlined"
                startIcon={<ScienceIcon />}
                onClick={handleValidate}
                disabled={validating || loading}
              >
                {validating ? "Validando..." : "Validar"}
              </Button>
              <Button
                data-testid="action-simulate"
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={handleSimulate}
                disabled={simulating || loading}
              >
                {simulating ? "Simulando..." : "Simular"}
              </Button>
            </Stack>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} data-testid="equation-error">
              {error}
            </Alert>
          )}

          {!loading && validateErrors.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }} data-testid="validate-errors">
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {validateErrors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </Alert>
          )}

          {!loading && validateAlerts.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }} data-testid="validate-alerts">
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {validateAlerts.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </Alert>
          )}

          {simError && (
            <Alert severity="error" sx={{ mb: 2 }} data-testid="simulate-error">
              {simError}
            </Alert>
          )}

          {loading ? (
            <Box
              sx={{ display: "flex", justifyContent: "center", py: 8 }}
              data-testid="equation-loading"
            >
              <CircularProgress />
            </Box>
          ) : draft ? (
            <>
              <CareEquationHeader blocks={draft.blocks} focus={focus} />
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, lg: 6 }}>
                  <Stack spacing={3}>
                    <CareEquationBlocks
                      blocks={draft.blocks}
                      focus={focus}
                      onSliderChange={handleBlockChange}
                    />
                    <CareFormulaCanvas blocks={draft.blocks} focus={focus} />
                    <CareChaosPanel
                      chaosFactor={draft.chaosFactor}
                      chaosSeed={draft.chaosSeed}
                      deltaIndicator={simResult ? simResult.mean_delta : null}
                      onChaosChange={handleChaosChange}
                      onSeedChange={handleSeedChange}
                      onGenerateSeed={handleGenerateSeed}
                    />
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                  <CareThresholdsPanel
                    minCompatibility={draft.minCompatibility}
                    matchCritical={draft.matchCritical}
                    onMinChange={handleMinChange}
                    onMatchChange={handleMatchChange}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                  <CareFormulaJsonEditor
                    value={jsonText}
                    valid={jsonValid}
                    error={jsonError}
                    onChange={handleJsonChange}
                  />
                </Grid>
              </Grid>

              <CareSimulationTable result={simResult} loading={simulating} />
            </>
          ) : null}
        </Box>
      </Container>
    </AdminLayout>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest src/pages/portal-redthread/care/equation.test.tsx --ci`
Expected: PASS.

- [ ] **Step 5: Typecheck + lint + commit**

Run: `npm run typecheck`
Run: `npm run lint`
Expected: no new errors in the touched files.

```bash
git add frontend/src/pages/portal-redthread/care/equation.tsx frontend/src/pages/portal-redthread/care/equation.test.tsx
git commit -m "feat(care-ui): equation carga formula, draft de criteria, paneles, validar y simular"
```

---

### Task 6: `CarePreviewPanel` + `Interpreter`/narrative wiring

**Files:**
- Create: `frontend/src/components/care/CarePreviewPanel.tsx` (+ `.test.tsx`)
- Modify: `frontend/src/pages/portal-redthread/care/equation.tsx` (wire preview)

**Interfaces:**
- Consumes: `previewFormula` and types `PreviewResult`, `NarrativeResult` from `../../../services/careFormulaService`; `CARE_DIMENSION_KEYS`, `CareDimensionKey`; `formatDelta`; `CareBreakdownBars` from `../../profile/CareBreakdownBars`; `previewErrorMessage` from `../../utils/careEquationModel`.
- Produces:
  - `interface CarePreviewPanelProps { userA: string; userB: string; tone: NarrativeResult["tone"]; result: PreviewResult | null; loading?: boolean; error?: string | null; onUserAChange: (v: string) => void; onUserBChange: (v: string) => void; onToneChange: (tone: NarrativeResult["tone"]) => void; onRun: () => void; }` — `preview-user-a`, `preview-user-b`, `preview-tone`, `preview-run`, `preview-loading`, `preview-error`, `preview-current`, `preview-proposed`, `preview-delta-<key>`, `preview-saturated`, `preview-narrative-text`, `preview-narrative-label`.

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/components/care/CarePreviewPanel.test.tsx`:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import CarePreviewPanel from "./CarePreviewPanel";

const baseProps = {
  userA: "",
  userB: "",
  tone: "directo" as const,
  result: null,
  onUserAChange: jest.fn(),
  onUserBChange: jest.fn(),
  onToneChange: jest.fn(),
  onRun: jest.fn(),
};

const result = {
  current: 0.52,
  proposed: 0.58,
  deltas: {
    values: 0.1,
    relationship_goals: -0.05,
    neurodiversity: 0,
    responsiveness: 0,
    music: 0,
    love_language: 0,
    communication_style: 0,
  },
  chi_current: 0,
  chi_proposed: 0.02,
  narrative: { tone: "directo" as const, text: "Suben los valores compartidos.", label: "Valores compartidos" },
};

describe("CarePreviewPanel", () => {
  it("emits field + tone changes and runs", () => {
    const onUserAChange = jest.fn();
    const onUserBChange = jest.fn();
    const onToneChange = jest.fn();
    const onRun = jest.fn();
    render(
      <CarePreviewPanel
        {...baseProps}
        onUserAChange={onUserAChange}
        onUserBChange={onUserBChange}
        onToneChange={onToneChange}
        onRun={onRun}
      />,
    );
    fireEvent.change(screen.getByTestId("preview-user-a").querySelector("input") as HTMLInputElement, {
      target: { value: "u1" },
    });
    fireEvent.change(screen.getByTestId("preview-user-b").querySelector("input") as HTMLInputElement, {
      target: { value: "u2" },
    });
    fireEvent.click(screen.getByTestId("preview-run"));
    expect(onUserAChange).toHaveBeenCalledWith("u1");
    expect(onUserBChange).toHaveBeenCalledWith("u2");
    expect(onRun).toHaveBeenCalledTimes(1);
  });

  it("shows a loading indicator", () => {
    render(<CarePreviewPanel {...baseProps} loading />);
    expect(screen.getByTestId("preview-loading")).toBeInTheDocument();
  });

  it("shows a 422/404 error verbatim", () => {
    render(<CarePreviewPanel {...baseProps} error="Usuario no encontrado" />);
    expect(screen.getByTestId("preview-error")).toHaveTextContent("Usuario no encontrado");
  });

  it("renders current/proposed, per-dimension deltas, saturation and narrative", () => {
    render(<CarePreviewPanel {...baseProps} result={result} />);
    expect(screen.getByTestId("preview-current")).toHaveTextContent("0.520");
    expect(screen.getByTestId("preview-proposed")).toHaveTextContent("0.580");
    expect(screen.getByTestId("preview-delta-values")).toHaveTextContent("+0.100");
    expect(screen.getByTestId("preview-delta-relationship_goals")).toHaveTextContent("-0.050");
    expect(screen.getByTestId("preview-saturated")).toBeInTheDocument();
    expect(screen.getByTestId("preview-narrative-text")).toHaveTextContent("Suben los valores compartidos.");
    expect(screen.getByTestId("preview-narrative-label")).toHaveTextContent("Valores compartidos");
  });

  it("hides the saturation notice when χ does not change", () => {
    render(<CarePreviewPanel {...baseProps} result={{ ...result, chi_proposed: 0 }} />);
    expect(screen.queryByTestId("preview-saturated")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/components/care/CarePreviewPanel.test.tsx --ci`
Expected: FAIL — "Cannot find module './CarePreviewPanel'".

- [ ] **Step 3: Write the implementation**

Create `frontend/src/components/care/CarePreviewPanel.tsx`:

```tsx
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { CARE_DIMENSIONS } from "../../constants/careDimensions";
import CareBreakdownBars from "../profile/CareBreakdownBars";
import type { NarrativeResult, PreviewResult } from "../../services/careFormulaService";
import { formatDelta } from "../../utils/careEquationModel";

const TONES: NarrativeResult["tone"][] = ["directo", "poetico", "ludico", "emocional", "curioso"];
const TONE_LABELS: Record<NarrativeResult["tone"], string> = {
  directo: "Directo",
  poetico: "Poético",
  ludico: "Lúdico",
  emocional: "Emocional",
  curioso: "Curioso",
};

export interface CarePreviewPanelProps {
  userA: string;
  userB: string;
  tone: NarrativeResult["tone"];
  result: PreviewResult | null;
  loading?: boolean;
  error?: string | null;
  onUserAChange: (value: string) => void;
  onUserBChange: (value: string) => void;
  onToneChange: (tone: NarrativeResult["tone"]) => void;
  onRun: () => void;
}

/** Read-only preview of the proposed formula against two real users. */
export default function CarePreviewPanel({
  userA,
  userB,
  tone,
  result,
  loading = false,
  error = null,
  onUserAChange,
  onUserBChange,
  onToneChange,
  onRun,
}: CarePreviewPanelProps) {
  const bars = {
    values: result ? result.deltas.values : 0,
    relationship_goals: result ? result.deltas.relationship_goals : 0,
    neurodiversity: result ? result.deltas.neurodiversity : 0,
    responsiveness: result ? result.deltas.responsiveness : 0,
    music: result ? result.deltas.music : 0,
    love_language: result ? result.deltas.love_language : 0,
    communication_style: result ? result.deltas.communication_style : 0,
  } as Record<string, number>;

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
        Vista previa (Interpreter)
      </Typography>
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            data-testid="preview-user-a"
            label="Usuario A (id)"
            size="small"
            fullWidth
            value={userA}
            onChange={(event) => onUserAChange(event.target.value)}
          />
          <TextField
            data-testid="preview-user-b"
            label="Usuario B (id)"
            size="small"
            fullWidth
            value={userB}
            onChange={(event) => onUserBChange(event.target.value)}
          />
        </Stack>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
          {TONES.map((option) => (
            <Chip
              key={option}
              data-testid={`tone-${option}`}
              label={TONE_LABELS[option]}
              size="small"
              color={tone === option ? "primary" : "default"}
              variant={tone === option ? "filled" : "outlined"}
              onClick={() => onToneChange(option)}
            />
          ))}
        </Stack>
        <Button
          data-testid="preview-run"
          variant="contained"
          startIcon={<VisibilityIcon />}
          onClick={onRun}
          disabled={loading || userA === "" || userB === ""}
        >
          Vista previa
        </Button>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 2 }} data-testid="preview-loading">
            <CircularProgress size={24} />
          </Box>
        )}
        {error && (
          <Alert severity="error" data-testid="preview-error">
            {error}
          </Alert>
        )}

        {result && !loading && (
          <Stack spacing={2}>
            <Stack direction="row" spacing={3}>
              <Typography variant="body2" data-testid="preview-current">
                Actual: <strong>{result.current.toFixed(3)}</strong>
              </Typography>
              <Typography variant="body2" data-testid="preview-proposed">
                Propuesto: <strong>{result.proposed.toFixed(3)}</strong>
              </Typography>
            </Stack>
            {result.chi_proposed !== 0 && (
              <Alert severity="info" data-testid="preview-saturated">
                Caos χ aplicado: {formatDelta(result.chi_proposed)} (semilla reproducible).
              </Alert>
            )}
            <Box>
              {CARE_DIMENSIONS.map((dim) => (
                <Box
                  key={dim.key}
                  data-testid={`preview-delta-${dim.key}`}
                  sx={{ display: "flex", justifyContent: "space-between", py: 0.25 }}
                >
                  <Typography variant="body2">{dim.label}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {formatDelta(bars[dim.key])}
                  </Typography>
                </Box>
              ))}
            </Box>
            <CareBreakdownBars breakdown={bars} />
            <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
              <Chip
                data-testid="preview-narrative-label"
                label={result.narrative.label}
                size="small"
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" data-testid="preview-narrative-text">
                {result.narrative.text}
              </Typography>
            </Paper>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
```

- [ ] **Step 4: Wire the panel into the page**

In `frontend/src/pages/portal-redthread/care/equation.tsx`:

1. Add imports for `previewFormula` (from the service) and `CarePreviewPanel` (from `../../../components/care/CarePreviewPanel`), plus `previewErrorMessage` from `../../../utils/careEquationModel`.
2. Add state:

```tsx
const [previewUserA, setPreviewUserA] = useState("");
const [previewUserB, setPreviewUserB] = useState("");
const [previewTone, setPreviewTone] = useState<NarrativeResult["tone"]>("directo");
const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null);
const [previewLoading, setPreviewLoading] = useState(false);
const [previewError, setPreviewError] = useState<string | null>(null);
```

3. Add the handler:

```tsx
const handlePreview = async () => {
  if (!draft) return;
  setPreviewLoading(true);
  setPreviewError(null);
  try {
    const result = await previewFormula({
      formula: draftToPayload(draft),
      user_a_id: previewUserA,
      user_b_id: previewUserB,
      tone: previewTone,
    });
    setPreviewResult(result);
  } catch (err) {
    setPreviewError(previewErrorMessage(err));
  } finally {
    setPreviewLoading(false);
  }
};
```

4. Render below `<CareSimulationTable ... />`:

```tsx
<Box sx={{ mt: 3 }}>
  <CarePreviewPanel
    userA={previewUserA}
    userB={previewUserB}
    tone={previewTone}
    result={previewResult}
    loading={previewLoading}
    error={previewError}
    onUserAChange={setPreviewUserA}
    onUserBChange={setPreviewUserB}
    onToneChange={setPreviewTone}
    onRun={handlePreview}
  />
</Box>
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx jest src/components/care/CarePreviewPanel.test.tsx src/pages/portal-redthread/care/equation.test.tsx --ci`
Expected: PASS. (The page test does not mock `CarePreviewPanel`; it renders for real and stays inert because `userA`/`userB` are empty, so `preview-run` is disabled.)

- [ ] **Step 6: Typecheck + lint + commit**

Run: `npm run typecheck`
Run: `npm run lint`
Expected: no new errors.

```bash
git add frontend/src/components/care/CarePreviewPanel.tsx frontend/src/components/care/CarePreviewPanel.test.tsx frontend/src/pages/portal-redthread/care/equation.tsx
git commit -m "feat(care-ui): vista previa con narrativa e Interpreter"
```

---

### Task 7: Save modal (changelog/gatekeeper) + `CareVersionsPanel` (history + rollback)

**Files:**
- Create: `frontend/src/components/care/CareVersionsPanel.tsx` (+ `.test.tsx`)
- Modify: `frontend/src/pages/portal-redthread/care/equation.tsx` (save modal + versions + rollback)
- Modify: `frontend/src/pages/portal-redthread/care/equation.test.tsx` (add `CareVersionsPanel` mock + save/rollback tests)

**Interfaces:**
- Consumes: `saveFormula`, `listFormulaVersions`, `rollbackFormula` and type `CAREFormula`; `saveErrorMessage` from `../../../utils/careCriteriaModel`; `detectDegenerate` from `../../../utils/careEquationModel`.
- Produces:
  - `interface CareVersionsPanelProps { versions: CAREFormula[]; activeVersion: number | null; loading?: boolean; onRollback: (version: number) => void; }` — `versions-panel`, `versions-loading`, `version-row-<version>`, `rollback-<version>`, `version-active`.
  - Page additions: `open-save-modal` button, `save-modal`, `changelog-input`, `modal-save`, `save-error`; `saveFormula({ formula, source: "equation" })`; `listFormulaVersions(50)` on load; `rollbackFormula(version)` reload on success.

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/components/care/CareVersionsPanel.test.tsx`:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import CareVersionsPanel from "./CareVersionsPanel";

const versions = [
  { version: 3, status: "active", blocks: {}, chaos_factor: 5, chaos_seed: null, min_compatibility: 0, match_critical: 0.15, changelog: "actual", created_by: "maria", created_at: "2026-10-16T12:00:00Z" },
  { version: 2, status: "archived", blocks: {}, chaos_factor: 0, chaos_seed: null, min_compatibility: 0, match_critical: 0.15, changelog: "prev", created_by: "maria", created_at: "2026-10-15T12:00:00Z" },
];

describe("CareVersionsPanel", () => {
  it("renders one row per version and marks the active one", () => {
    render(<CareVersionsPanel versions={versions} activeVersion={3} onRollback={jest.fn()} />);
    expect(screen.getByTestId("version-row-3")).toBeInTheDocument();
    expect(screen.getByTestId("version-row-2")).toBeInTheDocument();
    expect(screen.getByTestId("version-active")).toBeInTheDocument();
  });

  it("emits onRollback with the version number", () => {
    const onRollback = jest.fn();
    render(<CareVersionsPanel versions={versions} activeVersion={3} onRollback={onRollback} />);
    fireEvent.click(screen.getByTestId("rollback-2"));
    expect(onRollback).toHaveBeenCalledWith(2);
  });

  it("shows a loading indicator", () => {
    render(<CareVersionsPanel versions={[]} activeVersion={null} loading onRollback={jest.fn()} />);
    expect(screen.getByTestId("versions-loading")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/components/care/CareVersionsPanel.test.tsx --ci`
Expected: FAIL — "Cannot find module './CareVersionsPanel'".

- [ ] **Step 3: Write the `CareVersionsPanel` implementation**

Create `frontend/src/components/care/CareVersionsPanel.tsx`:

```tsx
import { Box, Button, Chip, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";
import type { CAREFormula } from "../../services/careFormulaService";

export interface CareVersionsPanelProps {
  versions: CAREFormula[];
  activeVersion: number | null;
  loading?: boolean;
  onRollback: (version: number) => void;
}

const formatDate = (iso: string): string => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString("es-ES");
};

/** Plain `CAREFormula[]` history (no enriched diff) + per-row rollback. */
export default function CareVersionsPanel({
  versions,
  activeVersion,
  loading = false,
  onRollback,
}: CareVersionsPanelProps) {
  return (
    <Paper variant="outlined" sx={{ p: 3 }} data-testid="versions-panel">
      <Typography
        variant="subtitle1"
        sx={{ fontWeight: 700, mb: 2, display: "flex", alignItems: "center", gap: 1 }}
      >
        <HistoryIcon fontSize="small" /> Historial de versiones
      </Typography>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 3 }} data-testid="versions-loading">
          <CircularProgress size={24} />
        </Box>
      ) : versions.length === 0 ? (
        <Typography variant="body2">Sin versiones registradas.</Typography>
      ) : (
        <Stack spacing={1}>
          {versions.map((version) => {
            const isActive = version.version === activeVersion;
            return (
              <Stack
                key={version.version}
                data-testid={`version-row-${version.version}`}
                direction="row"
                spacing={1}
                sx={{ alignItems: "center", justifyContent: "space-between" }}
              >
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    v{version.version}{" "}
                    {isActive && (
                      <Chip data-testid="version-active" label="Activa" size="small" color="success" variant="outlined" />
                    )}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {formatDate(version.created_at)} · {version.created_by}
                  </Typography>
                </Box>
                {!isActive && (
                  <Button
                    data-testid={`rollback-${version.version}`}
                    size="small"
                    variant="outlined"
                    onClick={() => onRollback(version.version)}
                  >
                    Restaurar
                  </Button>
                )}
              </Stack>
            );
          })}
        </Stack>
      )}
    </Paper>
  );
}
```

- [ ] **Step 4: Add the save modal + versions to the page**

In `frontend/src/pages/portal-redthread/care/equation.tsx`:

1. Extend the service import with `saveFormula`, `listFormulaVersions`, `rollbackFormula`, `type CAREFormula`; import `saveErrorMessage` from `../../../utils/careCriteriaModel`; import `CareVersionsPanel` and the MUI `Dialog`/`DialogActions`/`DialogContent`/`DialogTitle`/`TextField` pieces.
2. Add state and load the history inside the existing load effect (after `getActiveFormula`):

```tsx
const [versions, setVersions] = useState<CAREFormula[]>([]);
const [versionsLoading, setVersionsLoading] = useState(false);
const [saveOpen, setSaveOpen] = useState(false);
const [changelog, setChangelog] = useState("");
const [saving, setSaving] = useState(false);
const [saveError, setSaveError] = useState<string | null>(null);
```

```tsx
setVersionsLoading(true);
try {
  setVersions(await listFormulaVersions(50));
} catch {
  setVersions([]);
} finally {
  setVersionsLoading(false);
}
```

3. Add handlers:

```tsx
const reloadVersions = async () => {
  try {
    setVersions(await listFormulaVersions(50));
  } catch {
    setVersions([]);
  }
};

const handleSave = async () => {
  if (!draft) return;
  if (changelog.trim() === "") {
    setSaveError("El changelog es obligatorio.");
    return;
  }
  setSaving(true);
  setSaveError(null);
  try {
    const saved = await saveFormula({ formula: draftToPayload(draft), source: "equation" });
    setVersions((prev) => [saved, ...prev.filter((v) => v.version !== saved.version)]);
    setSaveOpen(false);
    setChangelog("");
  } catch (err) {
    setSaveError(saveErrorMessage(err));
  } finally {
    setSaving(false);
  }
};

const handleRollback = async (version: number) => {
  try {
    await rollbackFormula(version);
    await reloadVersions();
  } catch {
    setError("No se pudo restaurar la versión.");
  }
};
```

4. Add a `Guardar` button next to `Simular`:

```tsx
<Button
  data-testid="open-save-modal"
  variant="contained"
  color="secondary"
  startIcon={<SaveIcon />}
  onClick={() => setSaveOpen(true)}
  disabled={loading}
>
  Guardar
</Button>
```

5. Render the modal and the versions panel (below the preview):

```tsx
<Dialog open={saveOpen} onClose={() => setSaveOpen(false)} data-testid="save-modal">
  <DialogTitle>Guardar como versión nueva</DialogTitle>
  <DialogContent>
    <TextField
      data-testid="changelog-input"
      label="Changelog"
      fullWidth
      multiline
      minRows={3}
      sx={{ mt: 1, minWidth: 360 }}
      value={changelog}
      onChange={(event) => setChangelog(event.target.value)}
    />
    {saveError && (
      <Alert severity="error" sx={{ mt: 2 }} data-testid="save-error">
        {saveError}
      </Alert>
    )}
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setSaveOpen(false)}>Cancelar</Button>
    <Button data-testid="modal-save" variant="contained" onClick={handleSave} disabled={saving}>
      {saving ? "Guardando..." : "Guardar"}
    </Button>
  </DialogActions>
</Dialog>

<Box sx={{ mt: 3 }}>
  <CareVersionsPanel
    versions={versions}
    activeVersion={draft?.version ?? null}
    loading={versionsLoading}
    onRollback={handleRollback}
  />
</Box>
```

> `EquationDraft` must carry `version` and `changelog` (`toEquationDraft` copies `active.version`/`active.changelog`); `draftToPayload` echoes `changelog` so the backend gatekeeper accepts the paired `source`. Keep the draft's `changelog` as the active formula's original text — `handleSave` sends the newly typed `changelog`, so extend `draftToPayload` to accept an optional changelog override, or set `draft.changelog = changelog` before building the payload in `handleSave`.

- [ ] **Step 5: Extend the page test**

In `frontend/src/pages/portal-redthread/care/equation.test.tsx`:

1. Add a `CareVersionsPanel` mock (so rows do not need real versions) and register the three new service mocks:

```tsx
jest.mock("../../../components/care/CareVersionsPanel", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ versions, onRollback }: { versions: { version: number }[]; onRollback: (v: number) => void }) =>
      React.createElement(
        "div",
        { "data-testid": "versions-stub", "data-count": String(versions.length) },
        versions.map((v) =>
          React.createElement("button", {
            key: v.version,
            "data-testid": `stub-rollback-${v.version}`,
            onClick: () => onRollback(v.version),
          }),
        ),
      ),
  };
});
```

2. Extend the service mock with `saveFormula`, `listFormulaVersions`, `rollbackFormula` and default resolutions in `beforeEach` (`listFormulaVersions` → `[]`).

3. Add tests:

```tsx
it("saves with a changelog and prepends the new version", async () => {
  const saved = { ...active, version: 4, changelog: "nuevo" };
  mockSave.mockResolvedValueOnce(saved);
  render(<CareEquationPage />);
  await screen.findByTestId("open-save-modal");
  fireEvent.click(screen.getByTestId("open-save-modal"));
  fireEvent.change(screen.getByTestId("changelog-input").querySelector("textarea") as HTMLTextAreaElement, {
    target: { value: "ajuste de pesos" },
  });
  fireEvent.click(screen.getByTestId("modal-save"));
  await waitFor(() => expect(mockSave).toHaveBeenCalledWith({ formula: expect.objectContaining({ blocks: active.blocks }), source: "equation" }));
  expect(await screen.findByTestId("versions-stub")).toHaveAttribute("data-count", "1");
});

it("blocks save without a changelog", async () => {
  render(<CareEquationPage />);
  await screen.findByTestId("open-save-modal");
  fireEvent.click(screen.getByTestId("open-save-modal"));
  fireEvent.click(screen.getByTestId("modal-save"));
  expect(await screen.findByTestId("save-error")).toHaveTextContent("changelog es obligatorio");
  expect(mockSave).not.toHaveBeenCalled();
});

it("surfaces a 409 no-change message", async () => {
  mockSave.mockRejectedValueOnce({
    isAxiosError: true,
    response: { status: 409, data: "No hay cambios respecto a la versión activa." },
  });
  render(<CareEquationPage />);
  await screen.findByTestId("open-save-modal");
  fireEvent.click(screen.getByTestId("open-save-modal"));
  fireEvent.change(screen.getByTestId("changelog-input").querySelector("textarea") as HTMLTextAreaElement, {
    target: { value: "x" },
  });
  fireEvent.click(screen.getByTestId("modal-save"));
  expect(await screen.findByTestId("save-error")).toHaveTextContent("No hay cambios");
});

it("rolls back the chosen version", async () => {
  mockListVersions.mockResolvedValueOnce([{ ...active, version: 2, status: "archived" }]);
  render(<CareEquationPage />);
  fireEvent.click(await screen.findByTestId("stub-rollback-2"));
  await waitFor(() => expect(mockRollback).toHaveBeenCalledWith(2));
});
```

> The 409 test relies on `saveErrorMessage` from `careCriteriaModel` extracting the Spanish string; reuse it rather than re-implementing.

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx jest src/components/care/CareVersionsPanel.test.tsx src/pages/portal-redthread/care/equation.test.tsx --ci`
Expected: PASS.

- [ ] **Step 7: Typecheck + lint + commit**

Run: `npm run typecheck`
Run: `npm run lint`
Expected: no new errors.

```bash
git add frontend/src/components/care/CareVersionsPanel.tsx frontend/src/components/care/CareVersionsPanel.test.tsx frontend/src/pages/portal-redthread/care/equation.tsx frontend/src/pages/portal-redthread/care/equation.test.tsx
git commit -m "feat(care-ui): guardar version con changelog e historial con rollback"
```

---

## Self-Review

**1. Spec coverage** (spec `### equation.tsx (corazón Ψ/M)`):
- Header Ψ/M + chips + pre-filtros → Task 2 (`CareEquationHeader`). Lead **PRE-FILTRO** = `attraction`, **EXCLUYENTE** = `identity` per the spec.
- Canvas 7 orbit nodes, `radio = f(wᵢ)`, green `match_critical` / red `min_compatibility` → Task 2 (`CareFormulaCanvas`).
- 7 block sliders bound to numeric value + illustrative fᵢ → Task 3 (`CareEquationBlocks`).
- Bidirectional JSON view (slider→JSON, JSON→slider) → Task 4 + Task 5 (`parseDraft`/`serializeDraft`).
- `Validar` (POST validate + mock smoke test) and `Simular` (POST simulate) → Task 5.
- Caos χ(t): ±X% slider (0–20) + reproducible seed + Δ indicator → Task 3 + Task 5.
- Thresholds `min_compatibility` / `match_critical` → Task 3.
- `Interpreter`/narrative preview with 5 tones + `CareBreakdownBars` → Task 6.
- Save as new version (changelog, 409/422 Spanish) + version history + rollback → Task 7.
- Spec route `/care/equation` and nested `chaos{}`/`thresholds{}` are reconciled to the real ones — see the discrepancy list at the top of the plan.

**2. Placeholder scan:** no `TODO`, no "similar to Task N", no empty test bodies; every step carries verbatim code.

**3. Type consistency:**
- `EquationDraft` fields used everywhere: `blocks`, `chaosFactor`, `chaosSeed`, `minCompatibility`, `matchCritical`, plus `version`/`changelog` (Task 7). `draftToPayload` flattens to the wire shape (`blocks`, `chaos_factor`, `chaos_seed`, `min_compatibility`, `match_critical`, `changelog`).
- `toEquationDraft(active)` seeds the draft from `CAREFormula`; `parseDraft`/`serializeDraft` round-trip `draftToPayload`'s output.
- Test-id contract is fixed once and reused by the page test: `equation-formula`, `header-chip-<key>`, `canvas-psi`, `node-<key>`, `eq-block-<key>`, `eq-slider-<key>`, `eq-percent-<key>`, `chaos-slider`, `chaos-label`, `threshold-min`, `threshold-match`, `formula-json`, `json-validity-chip`, `simulation-table`, `sim-row-<id>`, `sim-mean-delta`, `preview-user-a/b`, `preview-tone`, `preview-run`, `preview-current/proposed`, `preview-delta-<key>`, `preview-saturated`, `preview-narrative-text/label`, `open-save-modal`, `save-modal`, `changelog-input`, `modal-save`, `save-error`, `versions-panel`, `rollback-<v>`, `version-active`.
- Every consumer imports the exact symbol its producer exports (e.g. `formatDelta`, `CHAOS_MAX`, `EXAMPLE_FEATURES`, `smokeAlerts`, `clientValidation`, `detectDegenerate`, `previewErrorMessage`).

**4. Dependency order:** Task 1 (pure model) → Tasks 2–4 (presentational, depend only on Task 1) → Task 5 (page; depends on 1–4) → Task 6 (preview; depends on 5) → Task 7 (save/versions; depends on 5). Each task ends green with its own commit.

**5. Verification commands:** every task runs `npx jest <files> --ci`; page tasks also run `npm run typecheck` and `npm run lint` from `frontend/`. Commits are local-only (`feat(care-ui): ...`); never push without an explicit "sube".
