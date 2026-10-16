# CARE Frontend Shared (Bloque 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the shared frontend foundation for the CARE formula modules — a canonical `careDimensions` constant, a typed `careFormulaService` API wrapper over the 8 backend endpoints, a reusable breakdown-bars component, and wire the three user-facing components to the new 7-key canonical breakdown.

**Architecture:** Pure-data module (`careDimensions.ts`) as the single source of the 7 dimensions; a thin typed service over `adminApiClient` (cookie auth + refresh already handled by `services/api.ts`); a small presentational `CareBreakdownBars` component reused by `ProfileOverlay` and `CompatibilityTechnicalPanel`. No new dependencies. Admin pages use hardcoded Spanish; these user-facing components keep their existing `useTranslation` namespace (i18n parity test `.test.ts` guards it).

**Tech Stack:** Next.js (Pages Router), React 19, MUI v6/v7 (`@mui/material`), TypeScript, axios client (`adminApiClient`), Jest + @testing-library/react.

**Spec:** `docs/superpowers/specs/2026-10-15-care-formula-dirac-design.md`

## Global Constraints

- **No new dependencies** (spec §Tests; also enforced socially — do not add to package.json).
- **Admin pages are hardcoded Spanish** (spec decision 11). The three user-facing ripple components keep `useTranslation` (existing namespaces `discover` / `common`) — never add new literal `t('...')` keys without also adding them to every `public/locales/<locale>/*.json`, because `frontend/src/components/discovery/discoverNamespaceKeys.test.ts` asserts parity.
- **No new i18n keys in this block.** Use the plain Spanish labels from `CARE_DIMENSIONS` (not `t()`) for the dimension names.
- **Backend endpoint prefix:** `/portal-redthread/experiencia/algoritmos` (registered in `backend/src/main.py`).
- **API access:** import `adminApiClient` from `frontend/src/services/adminApi` (or `./api`). Cookies + 401-refresh are handled by `services/api.ts`; do NOT manage tokens manually.
- **MUI `sx` gotcha:** this repo rejects numeric `borderRadius` in `sx` — always use px strings (`borderRadius: "8px"`, `borderRadius: "50%"`).
- **No new `any`** where avoidable; mirror existing file style.
- **Verification commands** (run from `frontend/`):
  - Tests: `npx jest <path> --ci`
  - Typecheck: `npm run typecheck`
  - Lint: `npm run lint`
- **Commits:** local only; never push without the user saying "sube".

## Backend contract (exact shapes — the service layer must match these verbatim)

`GET /formula/active` → a `CAREFormula` JSON dump:
```jsonc
{
  "version": 1,
  "status": "active",
  "blocks": { "values": 0.36, "relationship_goals": 0.18, "neurodiversity": 0.15,
              "responsiveness": 0.10, "music": 0.11, "love_language": 0.06,
              "communication_style": 0.04 },
  "chaos_factor": 0.0,          // 0–20 (%)
  "chaos_seed": null,           // string | null
  "min_compatibility": 0.0,
  "match_critical": 0.15,
  "changelog": "Seed inicial canónico",
  "created_by": "system",
  "created_at": "2026-10-16T...Z",
  "_id": "..."                  // Mongo id, ignore
}
```

`GET /formula/versions?limit=50` → `CAREFormula[]` (same shape).

`POST /formula/validate` — body `{ "formula": FormulaPayload }` → `{ "valid": boolean, "errors": string[] }`.

`POST /formula/preview` — body `{ "formula": FormulaPayload, "user_a_id": string, "user_b_id": string, "tone"?: string }` →
```jsonc
{
  "current":  { "score": number, "base": number, "chi": number, "breakdown": Breakdown },
  "proposed": { "score": number, "base": number, "chi": number, "breakdown": Breakdown },
  "deltas":   { "values": number, "relationship_goals": number, ... },   // only the payload block keys
  "chi_current": number,
  "chi_proposed": number,
  "narrative": { "tone": string, "text": string, "label": string }
}
```
where `Breakdown` = the 7 block keys (0–1) **plus** `chaos_applied` (number), `saturated` (boolean), `compatibility_label` (string), `final_score` (number).
Errors: 422 (invalid formula / missing ids), 404 (user or profile not found).

`POST /formula/simulate` — body `{ "formula": FormulaPayload, "anchor_user_id"?: string, "candidate_user_ids"?: string[] }` →
```jsonc
{
  "mock": boolean,
  "ranking": [ { "candidate_id": string, "score_current": number, "score_proposed": number,
                 "chi_current": number, "chi_proposed": number, "delta": number } ],
  "mean_delta": number
}
```
Errors: 422 (invalid formula), 400 (candidate_ids > 20, or anchor without candidates), 404 (anchor not found).

`POST /formula/save` — body `{ "formula": FormulaPayload, "source"?: "criteria"|"equation"|"api" }` → `CAREFormula` dump. Errors: 409 (no change vs active), 422 (invalid, e.g. missing `changelog`).

`POST /formula/rollback/{version}` → `CAREFormula` dump. Error: 404 (version not found).

`POST /formula/normalizar` — body `{ "blocks": { ...7 keys... }, "locked": string[] }` → `{ "blocks": { ...7 keys, sum 1.0... } }`. Error: 400 (no free dimensions / invalid).

**`FormulaPayload`** = the flat CAREFormula shape minus `status`/`created_*`/`_id`:
`{ version?: number, blocks: Record<string, number>, chaos_factor?: number, chaos_seed?: string | null, min_compatibility?: number, match_critical?: number, changelog?: string }`.

## File Structure

- **Create** `frontend/src/constants/careDimensions.ts` — the 7 canonical dimensions (key, Spanish label, Greek chip, color) + lookup helpers. One responsibility: the canonical dimension metadata.
- **Create** `frontend/src/constants/careDimensions.test.ts` — data integrity test.
- **Create** `frontend/src/services/careFormulaService.ts` — typed functions over `adminApiClient` for the 8 endpoints + all contract types. One responsibility: formula API.
- **Create** `frontend/src/services/careFormulaService.test.ts` — service test with a mocked `adminApiClient`.
- **Create** `frontend/src/components/profile/CareBreakdownBars.tsx` — presentational: renders the 7 dimensions as chip + label + % + colored bar from a breakdown record. Reused by two components.
- **Create** `frontend/src/components/profile/CareBreakdownBars.test.tsx` — component test.
- **Modify** `frontend/src/components/profile/ProfileCard.tsx:70-83` — replace the legacy `affinity_breakdown` inline type with the canonical 7-key type.
- **Modify** `frontend/src/components/profile/ProfileOverlay.tsx:161-279` — replace the legacy slide-1 breakdown block with `CareBreakdownBars` (+ keep the "Escenario" row).
- **Modify** `frontend/src/components/discovery/CompatibilityTechnicalPanel.tsx:62-67,213-246` — replace the mock/legacy breakdown block with `CareBreakdownBars`.

---

### Task 1: `careDimensions.ts`

**Files:**
- Create: `frontend/src/constants/careDimensions.ts`
- Test: `frontend/src/constants/careDimensions.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `interface CareDimension { key: string; label: string; chip: string; color: string; }`
  - `const CARE_DIMENSIONS: CareDimension[]` (7 items, ordered α→η)
  - `const CARE_DIMENSION_KEYS: string[]`
  - `const CARE_DIMENSION_BY_KEY: Record<string, CareDimension>`
  - `const CANONICAL_BLOCK_SUM = 1.0` and `const CANONICAL_BLOCK_WEIGHTS: Record<string, number>` (the seed v1 weights, for display defaults)

- [ ] **Step 1: Write the failing test**

Create `frontend/src/constants/careDimensions.test.ts`:

```ts
import {
  CARE_DIMENSIONS,
  CARE_DIMENSION_KEYS,
  CARE_DIMENSION_BY_KEY,
  CANONICAL_BLOCK_WEIGHTS,
} from "./careDimensions";

describe("careDimensions", () => {
  it("defines exactly the 7 canonical dimensions in order", () => {
    expect(CARE_DIMENSION_KEYS).toEqual([
      "values",
      "relationship_goals",
      "neurodiversity",
      "responsiveness",
      "music",
      "love_language",
      "communication_style",
    ]);
  });

  it("assigns the Greek chips alpha through eta", () => {
    expect(CARE_DIMENSIONS.map((d) => d.chip)).toEqual([
      "α",
      "β",
      "γ",
      "δ",
      "ε",
      "ζ",
      "η",
    ]);
  });

  it("has a unique non-empty label and color per dimension", () => {
    const labels = CARE_DIMENSIONS.map((d) => d.label);
    const colors = CARE_DIMENSIONS.map((d) => d.color);
    expect(new Set(labels).size).toBe(7);
    expect(new Set(colors).size).toBe(7);
    CARE_DIMENSIONS.forEach((d) => {
      expect(d.label.length).toBeGreaterThan(0);
      expect(d.color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  it("looks up dimensions by key", () => {
    expect(CARE_DIMENSION_BY_KEY["music"].label).toBe("Música");
    expect(CARE_DIMENSION_BY_KEY["nope" as string]).toBeUndefined();
  });

  it("exposes canonical weights summing to 1.0", () => {
    const sum = Object.values(CANONICAL_BLOCK_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 6);
    expect(Object.keys(CANONICAL_BLOCK_WEIGHTS).sort()).toEqual(
      [...CARE_DIMENSION_KEYS].sort(),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/constants/careDimensions.test.ts --ci`
Expected: FAIL — "Cannot find module './careDimensions'".

- [ ] **Step 3: Write minimal implementation**

Create `frontend/src/constants/careDimensions.ts`:

```ts
/**
 * Canonical CARE dimensions (the compatibility matrix M).
 * Single source of truth for the 7 keys, their Spanish labels, Dirac chips
 * (α–η) and colors. Must mirror backend/src/care/formula/service.py
 * CANONICAL_BLOCKS.
 */

export interface CareDimension {
  /** Canonical backend key (block key in the formula payload / breakdown). */
  key: string;
  /** Spanish display label (admin is hardcoded Spanish; see spec decision 11). */
  label: string;
  /** Dirac chip, α through η. */
  chip: string;
  /** Hex color used for chips, bars and canvas orbits. */
  color: string;
}

export const CARE_DIMENSIONS: CareDimension[] = [
  { key: "values", label: "Valores", chip: "α", color: "#ff4d4f" },
  { key: "relationship_goals", label: "Metas de relación", chip: "β", color: "#1890ff" },
  { key: "neurodiversity", label: "Neurodiversidad", chip: "γ", color: "#52c41a" },
  { key: "responsiveness", label: "Responsiveness", chip: "δ", color: "#faad14" },
  { key: "music", label: "Música", chip: "ε", color: "#722ed1" },
  { key: "love_language", label: "Lenguaje del amor", chip: "ζ", color: "#eb2f96" },
  { key: "communication_style", label: "Comunicación", chip: "η", color: "#13c2c2" },
];

export const CARE_DIMENSION_KEYS: string[] = CARE_DIMENSIONS.map((d) => d.key);

export const CARE_DIMENSION_BY_KEY: Record<string, CareDimension> =
  CARE_DIMENSIONS.reduce<Record<string, CareDimension>>((acc, d) => {
    acc[d.key] = d;
    return acc;
  }, {});

/** Canonical seed-v1 weights (must match the backend defaults). */
export const CANONICAL_BLOCK_WEIGHTS: Record<string, number> = {
  values: 0.36,
  relationship_goals: 0.18,
  neurodiversity: 0.15,
  responsiveness: 0.1,
  music: 0.11,
  love_language: 0.06,
  communication_style: 0.04,
};

export const CANONICAL_BLOCK_SUM = 1.0;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/constants/careDimensions.test.ts --ci`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/constants/careDimensions.ts frontend/src/constants/careDimensions.test.ts
git commit -m "feat(care-ui): constantes compartidas careDimensions (7 dimensiones canonicas)"
```

---

### Task 2: `careFormulaService.ts`

**Files:**
- Create: `frontend/src/services/careFormulaService.ts`
- Test: `frontend/src/services/careFormulaService.test.ts`

**Interfaces:**
- Consumes: `adminApiClient` — a **named export of `frontend/src/services/api.ts`** (`export const adminApiClient = createApiClient({...})`). Import it as `import { adminApiClient } from "./api";`. Do NOT import from `./adminApi` (that module only default-exports the client, and `criteria.tsx` uses a default import — named import from `./api` is the safe, explicit form).
- Produces (all exported from `careFormulaService.ts`):
  - Types: `FormulaBlocks = Record<string, number>`, `FormulaPayload`, `CareFormula`, `FormulaBreakdown`, `EvaluationResult`, `PreviewResult`, `SimulateRow`, `SimulateResult`, `ValidateResult`, `NarrativeResult`.
  - Functions (all return promises resolving to the parsed body):
    - `getActiveFormula(): Promise<CareFormula>`
    - `listFormulaVersions(limit?: number): Promise<CareFormula[]>`
    - `validateFormula(formula: FormulaPayload): Promise<ValidateResult>`
    - `previewFormula(args: { formula: FormulaPayload; user_a_id: string; user_b_id: string; tone?: string }): Promise<PreviewResult>`
    - `simulateFormula(args: { formula: FormulaPayload; anchor_user_id?: string; candidate_user_ids?: string[] }): Promise<SimulateResult>`
    - `saveFormula(formula: FormulaPayload, source?: "criteria" | "equation" | "api"): Promise<CareFormula>`
    - `rollbackFormula(version: number): Promise<CareFormula>`
    - `normalizeFormulaBlocks(blocks: FormulaBlocks, locked: string[]): Promise<{ blocks: FormulaBlocks }>`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/services/careFormulaService.test.ts`:

```ts
import { adminApiClient } from "./api";
import {
  getActiveFormula,
  listFormulaVersions,
  validateFormula,
  previewFormula,
  simulateFormula,
  saveFormula,
  rollbackFormula,
  normalizeFormulaBlocks,
  type FormulaPayload,
} from "./careFormulaService";

jest.mock("./api", () => ({
  adminApiClient: { get: jest.fn(), post: jest.fn() },
}));

const mockGet = adminApiClient.get as jest.Mock;
const mockPost = adminApiClient.post as jest.Mock;

const BASE = "/portal-redthread/experiencia/algoritmos/formula";

const payload: FormulaPayload = {
  blocks: {
    values: 0.36,
    relationship_goals: 0.18,
    neurodiversity: 0.15,
    responsiveness: 0.1,
    music: 0.11,
    love_language: 0.06,
    communication_style: 0.04,
  },
  chaos_factor: 0,
  chaos_seed: null,
  min_compatibility: 0,
  match_critical: 0.15,
  changelog: "test",
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("careFormulaService", () => {
  it("getActiveFormula GETs /formula/active and returns the body", async () => {
    const body = { version: 1, status: "active", blocks: {}, changelog: "x" };
    mockGet.mockResolvedValueOnce({ data: body });
    await expect(getActiveFormula()).resolves.toEqual(body);
    expect(mockGet).toHaveBeenCalledWith(`${BASE}/active`);
  });

  it("listFormulaVersions passes limit as a query param", async () => {
    mockGet.mockResolvedValueOnce({ data: [] });
    await listFormulaVersions(10);
    expect(mockGet).toHaveBeenCalledWith(`${BASE}/versions`, { params: { limit: 10 } });
  });

  it("validateFormula POSTs the wrapped payload", async () => {
    mockPost.mockResolvedValueOnce({ data: { valid: true, errors: [] } });
    const res = await validateFormula(payload);
    expect(res).toEqual({ valid: true, errors: [] });
    expect(mockPost).toHaveBeenCalledWith(`${BASE}/validate`, { formula: payload });
  });

  it("previewFormula POSTs formula + ids + tone", async () => {
    mockPost.mockResolvedValueOnce({ data: { current: {}, proposed: {}, deltas: {} } });
    await previewFormula({ formula: payload, user_a_id: "a", user_b_id: "b", tone: "poetico" });
    expect(mockPost).toHaveBeenCalledWith(`${BASE}/preview`, {
      formula: payload,
      user_a_id: "a",
      user_b_id: "b",
      tone: "poetico",
    });
  });

  it("simulateFormula POSTs formula + anchor + candidates", async () => {
    mockPost.mockResolvedValueOnce({ data: { mock: true, ranking: [], mean_delta: 0 } });
    await simulateFormula({ formula: payload, anchor_user_id: "a", candidate_user_ids: ["b", "c"] });
    expect(mockPost).toHaveBeenCalledWith(`${BASE}/simulate`, {
      formula: payload,
      anchor_user_id: "a",
      candidate_user_ids: ["b", "c"],
    });
  });

  it("saveFormula sends source (defaults to api)", async () => {
    mockPost.mockResolvedValueOnce({ data: { version: 2 } });
    await saveFormula(payload);
    expect(mockPost).toHaveBeenCalledWith(`${BASE}/save`, { formula: payload, source: "api" });
    mockPost.mockResolvedValueOnce({ data: { version: 3 } });
    await saveFormula(payload, "criteria");
    expect(mockPost).toHaveBeenLastCalledWith(`${BASE}/save`, { formula: payload, source: "criteria" });
  });

  it("rollbackFormula POSTs to /formula/rollback/{version}", async () => {
    mockPost.mockResolvedValueOnce({ data: { version: 3 } });
    await rollbackFormula(3);
    expect(mockPost).toHaveBeenCalledWith(`${BASE}/rollback/3`);
  });

  it("normalizeFormulaBlocks POSTs blocks + locked", async () => {
    mockPost.mockResolvedValueOnce({ data: { blocks: { values: 1 } } });
    const res = await normalizeFormulaBlocks({ values: 0.5, music: 0.5 }, ["values"]);
    expect(res).toEqual({ blocks: { values: 1 } });
    expect(mockPost).toHaveBeenCalledWith(`${BASE}/normalizar`, {
      blocks: { values: 0.5, music: 0.5 },
      locked: ["values"],
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/services/careFormulaService.test.ts --ci`
Expected: FAIL — "Cannot find module './careFormulaService'".

- [ ] **Step 3: Write minimal implementation**

Create `frontend/src/services/careFormulaService.ts`:

```ts
import { adminApiClient } from "./api";

/**
 * Typed wrapper over the canonical CARE formula endpoints.
 * Auth/session is handled by adminApiClient (services/api.ts).
 * Backend router prefix: /portal-redthread/experiencia/algoritmos
 */

const BASE = "/portal-redthread/experiencia/algoritmos/formula";

export type FormulaBlocks = Record<string, number>;

/** Flat CAREFormula payload as expected by validate/preview/simulate/save. */
export interface FormulaPayload {
  version?: number;
  blocks: FormulaBlocks;
  chaos_factor?: number;
  chaos_seed?: string | null;
  min_compatibility?: number;
  match_critical?: number;
  changelog?: string;
}

/** A CAREFormula document as returned by the backend. */
export interface CareFormula {
  version: number;
  status: string;
  blocks: FormulaBlocks;
  chaos_factor: number;
  chaos_seed: string | null;
  min_compatibility: number;
  match_critical: number;
  changelog: string;
  created_by: string;
  created_at: string;
  _id?: string;
}

/** Breakdown returned inside an evaluation: 7 blocks + meta keys. */
export interface FormulaBreakdown extends FormulaBlocks {
  chaos_applied: number;
  saturated: boolean;
  compatibility_label: string;
  final_score: number;
}

export interface EvaluationResult {
  score: number;
  base: number;
  chi: number;
  breakdown: FormulaBreakdown;
}

export interface NarrativeResult {
  tone: string;
  text: string;
  label: string;
}

export interface PreviewResult {
  current: EvaluationResult;
  proposed: EvaluationResult;
  deltas: FormulaBlocks;
  chi_current: number;
  chi_proposed: number;
  narrative: NarrativeResult;
}

export interface SimulateRow {
  candidate_id: string;
  score_current: number;
  score_proposed: number;
  chi_current: number;
  chi_proposed: number;
  delta: number;
}

export interface SimulateResult {
  mock: boolean;
  ranking: SimulateRow[];
  mean_delta: number;
}

export interface ValidateResult {
  valid: boolean;
  errors: string[];
}

export async function getActiveFormula(): Promise<CareFormula> {
  const { data } = await adminApiClient.get(`${BASE}/active`);
  return data as CareFormula;
}

export async function listFormulaVersions(limit = 50): Promise<CareFormula[]> {
  const { data } = await adminApiClient.get(`${BASE}/versions`, { params: { limit } });
  return data as CareFormula[];
}

export async function validateFormula(formula: FormulaPayload): Promise<ValidateResult> {
  const { data } = await adminApiClient.post(`${BASE}/validate`, { formula });
  return data as ValidateResult;
}

export async function previewFormula(args: {
  formula: FormulaPayload;
  user_a_id: string;
  user_b_id: string;
  tone?: string;
}): Promise<PreviewResult> {
  const { data } = await adminApiClient.post(`${BASE}/preview`, args);
  return data as PreviewResult;
}

export async function simulateFormula(args: {
  formula: FormulaPayload;
  anchor_user_id?: string;
  candidate_user_ids?: string[];
}): Promise<SimulateResult> {
  const { data } = await adminApiClient.post(`${BASE}/simulate`, args);
  return data as SimulateResult;
}

export async function saveFormula(
  formula: FormulaPayload,
  source: "criteria" | "equation" | "api" = "api",
): Promise<CareFormula> {
  const { data } = await adminApiClient.post(`${BASE}/save`, { formula, source });
  return data as CareFormula;
}

export async function rollbackFormula(version: number): Promise<CareFormula> {
  const { data } = await adminApiClient.post(`${BASE}/rollback/${version}`);
  return data as CareFormula;
}

export async function normalizeFormulaBlocks(
  blocks: FormulaBlocks,
  locked: string[],
): Promise<{ blocks: FormulaBlocks }> {
  const { data } = await adminApiClient.post(`${BASE}/normalizar`, { blocks, locked });
  return data as { blocks: FormulaBlocks };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/services/careFormulaService.test.ts --ci`
Expected: PASS (8 tests).

- [ ] **Step 5: Typecheck + commit**

Run: `npm run typecheck`
Expected: no new errors.

```bash
git add frontend/src/services/careFormulaService.ts frontend/src/services/careFormulaService.test.ts
git commit -m "feat(care-ui): servicio tipado careFormulaService (8 endpoints de formula)"
```

---

### Task 3: `CareBreakdownBars.tsx`

**Files:**
- Create: `frontend/src/components/profile/CareBreakdownBars.tsx`
- Test: `frontend/src/components/profile/CareBreakdownBars.test.tsx`

**Interfaces:**
- Consumes: `CARE_DIMENSIONS` from `frontend/src/constants/careDimensions`.
- Produces:
  - `interface CareBreakdownBarsProps { breakdown?: Partial<Record<string, number>> | null; valueRange?: "0-100" | "0-1"; showChips?: boolean; }`
  - `default export function CareBreakdownBars(props): JSX.Element`
  - Render contract: for each of the 7 `CARE_DIMENSIONS`, one row with the label text; a `data-testid={`care-bar-${key}`}` element carrying `data-value` = the normalized 0–100 value; a `data-testid={`care-chip-${key}`}` element with the Greek chip when `showChips`. Dimensions missing from `breakdown` render `data-value="0"` (no crash).

- [ ] **Step 1: Write the failing test**

Create `frontend/src/components/profile/CareBreakdownBars.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import CareBreakdownBars from "./CareBreakdownBars";
import { CARE_DIMENSIONS } from "../../constants/careDimensions";

describe("CareBreakdownBars", () => {
  it("renders all 7 canonical dimension labels", () => {
    render(
      <CareBreakdownBars
        breakdown={{
          values: 80,
          relationship_goals: 50,
          neurodiversity: 100,
          responsiveness: 10,
          music: 11,
          love_language: 6,
          communication_style: 4,
        }}
      />,
    );
    CARE_DIMENSIONS.forEach((d) => {
      expect(screen.getByText(d.label)).toBeInTheDocument();
    });
  });

  it("exposes 0-100 values in data-value and the chip letter", () => {
    render(<CareBreakdownBars breakdown={{ values: 80, music: 11 }} />);
    expect(screen.getByTestId("care-bar-values")).toHaveAttribute("data-value", "80");
    expect(screen.getByTestId("care-bar-music")).toHaveAttribute("data-value", "11");
    expect(screen.getByTestId("care-chip-values")).toHaveTextContent("α");
    expect(screen.getByTestId("care-chip-music")).toHaveTextContent("ε");
  });

  it("scales 0-1 values to 0-100 when valueRange='0-1'", () => {
    render(<CareBreakdownBars breakdown={{ values: 0.8 }} valueRange="0-1" />);
    expect(screen.getByTestId("care-bar-values")).toHaveAttribute("data-value", "80");
  });

  it("treats missing dimensions as zero without crashing", () => {
    render(<CareBreakdownBars breakdown={{ music: 11 }} />);
    expect(screen.getByTestId("care-bar-values")).toHaveAttribute("data-value", "0");
    expect(screen.getByTestId("care-bar-communication_style")).toHaveAttribute("data-value", "0");
  });

  it("renders zeros when breakdown is null", () => {
    render(<CareBreakdownBars breakdown={null} />);
    expect(screen.getByTestId("care-bar-neurodiversity")).toHaveAttribute("data-value", "0");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/components/profile/CareBreakdownBars.test.tsx --ci`
Expected: FAIL — "Cannot find module './CareBreakdownBars'".

- [ ] **Step 3: Write minimal implementation**

Create `frontend/src/components/profile/CareBreakdownBars.tsx`:

```tsx
import { Box, Stack, Typography } from "@mui/material";
import { CARE_DIMENSIONS } from "../../constants/careDimensions";

export interface CareBreakdownBarsProps {
  /** Dimension scores. Keys not present render as 0. */
  breakdown?: Partial<Record<string, number>> | null;
  /** Input scale: "0-100" (default, discovery payload) or "0-1" (raw formula). */
  valueRange?: "0-100" | "0-1";
  /** Show the Dirac chip (α–η) before each label. */
  showChips?: boolean;
}

/**
 * Renders the 7 canonical CARE dimensions as labeled, colored progress bars.
 * Shared by ProfileOverlay and CompatibilityTechnicalPanel so the rendered
 * keys/colors/labels can never drift from the canonical taxonomy.
 */
export default function CareBreakdownBars({
  breakdown,
  valueRange = "0-100",
  showChips = true,
}: CareBreakdownBarsProps) {
  const toDisplay = (raw: number | undefined): number => {
    const value = typeof raw === "number" && Number.isFinite(raw) ? raw : 0;
    const scaled = valueRange === "0-1" ? value * 100 : value;
    return Math.max(0, Math.min(100, Math.round(scaled)));
  };

  return (
    <Stack spacing={2}>
      {CARE_DIMENSIONS.map((dim) => {
        const display = toDisplay(breakdown?.[dim.key]);
        return (
          <Box key={dim.key}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {showChips && (
                  <Box
                    data-testid={`care-chip-${dim.key}`}
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
                      bgcolor: dim.color,
                    }}
                  >
                    {dim.chip}
                  </Box>
                )}
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {dim.label}
                </Typography>
              </Box>
              <Typography
                variant="body2"
                data-testid={`care-bar-${dim.key}`}
                data-value={display}
                sx={{ fontWeight: 700 }}
              >
                {display}%
              </Typography>
            </Box>
            <Box sx={{ width: "100%", height: 6, bgcolor: "rgba(255,255,255,0.1)", borderRadius: "3px" }}>
              <Box
                sx={{
                  width: `${display}%`,
                  height: "100%",
                  bgcolor: dim.color,
                  borderRadius: "3px",
                  transition: "width 1s ease-out",
                }}
              />
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
}
```

> Note: `data-testid` and `data-value` live on the percentage `Typography` so the test reads exactly the displayed number. The bar width is driven by the same `display` value.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/components/profile/CareBreakdownBars.test.tsx --ci`
Expected: PASS (5 tests).

- [ ] **Step 5: Typecheck + commit**

Run: `npm run typecheck`
Expected: no new errors.

```bash
git add frontend/src/components/profile/CareBreakdownBars.tsx frontend/src/components/profile/CareBreakdownBars.test.tsx
git commit -m "feat(care-ui): componente CareBreakdownBars (7 dimensiones canonicas)"
```

---

### Task 4: Ripple into the three user-facing components

**Files:**
- Modify: `frontend/src/components/profile/ProfileCard.tsx:70-83` (type only)
- Modify: `frontend/src/components/profile/ProfileOverlay.tsx:161-279`
- Modify: `frontend/src/components/discovery/CompatibilityTechnicalPanel.tsx:62-67,213-246`
- Test: `frontend/src/components/profile/ProfileOverlay.test.tsx` (new)
- Test: `frontend/src/components/discovery/CompatibilityTechnicalPanel.test.tsx` (new)

**Interfaces:**
- Consumes: `CareBreakdownBars` (Task 3), `CARE_DIMENSIONS` (Task 1).
- Produces: `Profile.affinity_breakdown` is now typed as the canonical shape:
  ```ts
  affinity_breakdown?: {
    values?: number;
    relationship_goals?: number;
    neurodiversity?: number;
    responsiveness?: number;
    music?: number;
    love_language?: number;
    communication_style?: number;
  };
  ```
  (Legacy keys `interests`/`intent`/`lifestyle`/`personality`/`proximity` and the `common_*`/`unique_*` arrays are removed — backend no longer sends them; verified: zero remaining frontend readers after this task.)

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/components/profile/ProfileOverlay.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "i18next";
import ProfileOverlay from "./ProfileOverlay";
import type { Profile } from "./ProfileCard";

const testI18n = i18n.createInstance();
testI18n.init({
  lng: "es",
  resources: { es: { common: {}, discover: {} } },
  interpolation: { escapeValue: false },
});

const profile = {
  user_id: "u1",
  display_name: "Ada",
  age: 30,
  photos: [],
  affinity_score: 72,
  affinity_breakdown: {
    values: 80,
    relationship_goals: 50,
    neurodiversity: 100,
    responsiveness: 10,
    music: 11,
    love_language: 6,
    communication_style: 4,
  },
  scenario_label: "Café",
} as unknown as Profile;

describe("ProfileOverlay (breakdown slide)", () => {
  it("renders the 7 canonical dimensions from affinity_breakdown", () => {
    render(
      <I18nextProvider i18n={testI18n}>
        <ProfileOverlay profile={profile} activePhotoIndex={1} />
      </I18nextProvider>,
    );
    expect(screen.getByTestId("care-bar-values")).toHaveAttribute("data-value", "80");
    expect(screen.getByText("Metas de relación")).toBeInTheDocument();
    expect(screen.getByText("Lenguaje del amor")).toBeInTheDocument();
  });

  it("does not render legacy breakdown labels", () => {
    render(
      <I18nextProvider i18n={testI18n}>
        <ProfileOverlay profile={profile} activePhotoIndex={1} />
      </I18nextProvider>,
    );
    expect(screen.queryByText(/Sintonía de intenciones/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Estilo de vida/i)).not.toBeInTheDocument();
  });
});
```

Create `frontend/src/components/discovery/CompatibilityTechnicalPanel.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "i18next";
import CompatibilityTechnicalPanel from "./CompatibilityTechnicalPanel";
import type { Profile } from "../profile/ProfileCard";

const testI18n = i18n.createInstance();
testI18n.init({
  lng: "es",
  resources: { es: { discover: {}, common: {} } },
  interpolation: { escapeValue: false },
});

const profile = {
  user_id: "u1",
  display_name: "Ada",
  age: 30,
  photos: [],
  affinity_score: 72,
  affinity_breakdown: {
    values: 80,
    relationship_goals: 50,
    neurodiversity: 100,
    responsiveness: 10,
    music: 11,
    love_language: 6,
    communication_style: 4,
  },
} as unknown as Profile;

describe("CompatibilityTechnicalPanel", () => {
  it("renders the canonical dimensions and no hardcoded mock values", () => {
    render(
      <I18nextProvider i18n={testI18n}>
        <CompatibilityTechnicalPanel profile={profile} isVisible onViewProfile={() => {}} />
      </I18nextProvider>,
    );
    expect(screen.getByTestId("care-bar-values")).toHaveAttribute("data-value", "80");
    expect(screen.getByText("Neurodiversidad")).toBeInTheDocument();
  });
});
```

> If `ProfileOverlay`/`CompatibilityTechnicalPanel` require additional providers (theme/router) to render, wrap the tree minimally inside each test — do not modify the components to satisfy tests. Use the same mock pattern as `frontend/src/components/layout/Sidebar.test.tsx`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/components/profile/ProfileOverlay.test.tsx src/components/discovery/CompatibilityTechnicalPanel.test.tsx --ci`
Expected: FAIL — `care-bar-values` not found (components still render legacy keys).

- [ ] **Step 3a: Update the `Profile` type**

In `frontend/src/components/profile/ProfileCard.tsx`, replace the `affinity_breakdown` block (lines ~70–83) with:

```tsx
  affinity_breakdown?: {
    values?: number;
    relationship_goals?: number;
    neurodiversity?: number;
    responsiveness?: number;
    music?: number;
    love_language?: number;
    communication_style?: number;
  };
```

- [ ] **Step 3b: Rewrite the ProfileOverlay breakdown slide**

In `frontend/src/components/profile/ProfileOverlay.tsx`:
1. Add the import near the other component imports:
   ```tsx
   import CareBreakdownBars from "./CareBreakdownBars";
   ```
2. Replace the whole `if (activePhotoIndex === 1) { ... }` block (currently lines ~162–279) with:

```tsx
    // Slide 1: Compatibility Breakdown (the "why" behind the score)
    if (activePhotoIndex === 1) {
      return (
        <Box
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            px: 2,
            pb: 6,
          }}
        >
          <Typography
            variant="overline"
            color="primary"
            align="center"
            gutterBottom
            sx={{ fontWeight: 700 }}
          >
            {t("card.analysisTitle", "ANÁLISIS DE SINTONÍA")}
          </Typography>

          <Box sx={{ mt: 2 }}>
            <CareBreakdownBars breakdown={profile.affinity_breakdown} />
          </Box>

          {profile.scenario_label && (
            <Box sx={{ mt: 3, textAlign: "center" }}>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {t("card.scenario", "Escenario")}: {profile.scenario_label}
              </Typography>
            </Box>
          )}
        </Box>
      );
    }
```

3. Remove now-unused icon imports if lint flags them (e.g. `FavoriteIcon`, `MusicNoteIcon`, `PsychologyIcon`, `ExploreIcon`, `LocationOnIcon` — only remove those that become unused elsewhere in the file; `LocationOnIcon` is still used on slide 0).

- [ ] **Step 3c: Rewrite the CompatibilityTechnicalPanel breakdown block**

In `frontend/src/components/discovery/CompatibilityTechnicalPanel.tsx`:
1. Add the import:
   ```tsx
   import CareBreakdownBars from "../profile/CareBreakdownBars";
   ```
2. Delete the mock fallback const (lines ~62–67: `const breakdown = profile.affinity_breakdown || { interests: 85, ... };`).
3. Replace the "Technical Breakdown" `<Stack spacing={2}>…</Stack>` block (currently lines ~213–246, the array with `val: 80` and `|| 75` hardcodes) with:

```tsx
            <Typography variant="overline" sx={{ fontWeight: 700 }}>
              {t("card.technicalBreakdown", "Desglose Técnico")}
            </Typography>
            <CareBreakdownBars breakdown={profile.affinity_breakdown} />
```

4. Leave the header score (`Math.round(profile.affinity_score || 0)`) and the "Balance Emocional" block untouched.

- [ ] **Step 4: Run tests + typecheck + lint to verify**

Run: `npx jest src/components/profile/ProfileOverlay.test.tsx src/components/discovery/CompatibilityTechnicalPanel.test.tsx src/components/discovery/discoverNamespaceKeys.test.ts --ci`
Expected: PASS.

Run: `npm run typecheck`
Expected: no errors (the removed legacy keys must have zero remaining references).

Run: `npm run lint`
Expected: no new errors in the touched files.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/profile/ProfileCard.tsx frontend/src/components/profile/ProfileOverlay.tsx frontend/src/components/discovery/CompatibilityTechnicalPanel.tsx frontend/src/components/profile/ProfileOverlay.test.tsx frontend/src/components/discovery/CompatibilityTechnicalPanel.test.tsx
git commit -m "feat(care-ui): ripple de affinity_breakdown 7D en Overlay y TechnicalPanel"
```

---

## Self-Review

**Spec coverage (Fase 1 "Frontend shared" deliverable: `careDimensions.ts` + ripple of the 3 components):**
- `constants/careDimensions.ts` shared by all consumers → Task 1 ✓
- Backend contract consumable by criteria/equation/interpreter → Task 2 (`careFormulaService`) ✓ (needed by Blocks 3–5; not a spec line item but a hard prerequisite, so it lives here)
- `CompatibilityTechnicalPanel` dynamic render of the 7 keys → Task 4 ✓
- `ProfileCard` mini-bars per dimension + adjusted `affinity_breakdown` type → Task 4 (type) ✓; mini-bars: the spec says "ProfileCard gana mini-barras por dimensión" — **deferred note**: the card's main body shows `affinity_score`; the per-dimension bars are surfaced through the Overlay slide which the card renders. If a dedicated inline mini-bar row on the card body is wanted, that is a follow-up refinement — flag to the user at block review.
- `ProfileOverlay` dynamic render → Task 4 ✓
- Legacy fallbacks/mocks out → Tasks 3–4 ✓

**Placeholder scan:** no TBD/TODO; every code step contains complete code. The one deliberate conditionality ("remove unused icon imports if lint flags them") is a concrete, verifiable instruction, not a placeholder.

**Type consistency:** `FormulaPayload`/`CareFormula`/`FormulaBreakdown` defined in Task 2 are reused verbatim by Blocks 3–5. `CARE_DIMENSIONS`/`CARE_DIMENSION_BY_KEY`/`CANONICAL_BLOCK_WEIGHTS` defined in Task 1 are reused by Tasks 3–4 and Blocks 3–5. `CareBreakdownBars` props (`breakdown`, `valueRange`, `showChips`) fixed in Task 3 and consumed in Task 4.
