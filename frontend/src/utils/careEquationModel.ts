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
  { ok: true; draft: EquationDraft } | { ok: false; error: string };

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
    | "blocks"
    | "chaos_factor"
    | "chaos_seed"
    | "min_compatibility"
    | "match_critical"
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
  if (
    typeof rawBlocks !== "object" ||
    rawBlocks === null ||
    Array.isArray(rawBlocks)
  ) {
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
      return {
        ok: false,
        error: `La dimensión '${key}' debe estar entre 0 y 1.`,
      };
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
    return {
      ok: false,
      error: `'chaos_factor' debe estar entre 0 y ${CHAOS_MAX}.`,
    };
  }
  const minCompatibility =
    obj.min_compatibility === undefined ? 0 : obj.min_compatibility;
  if (
    typeof minCompatibility !== "number" ||
    !Number.isFinite(minCompatibility) ||
    minCompatibility < 0 ||
    minCompatibility > 1
  ) {
    return { ok: false, error: "'min_compatibility' debe estar entre 0 y 1." };
  }
  const matchCritical =
    obj.match_critical === undefined
      ? MATCH_CRITICAL_DEFAULT
      : obj.match_critical;
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
  if (missing.length > 0)
    errors.push(`Faltan dimensiones: ${missing.join(", ")}.`);
  const outOfRange = CARE_DIMENSION_KEYS.filter(
    (key) => asFiniteNumber(blocks[key]) < 0 || asFiniteNumber(blocks[key]) > 1,
  );
  if (outOfRange.length > 0)
    errors.push(`Pesos fuera de rango 0–1: ${outOfRange.join(", ")}.`);
  const sum = CARE_DIMENSION_KEYS.reduce(
    (acc, key) => acc + asFiniteNumber(blocks[key]),
    0,
  );
  if (Math.round(sum * 100) !== 100) {
    errors.push(
      `La suma de pesos debe ser 100% (lleva ${Math.round(sum * 100)}%).`,
    );
  }
  return errors;
}

/** Smoke check on the weight distribution (zeroed dimensions / concentration). */
export function detectDegenerate(blocks: FormulaBlocks): string[] {
  const alerts: string[] = [];
  const weights = CARE_DIMENSIONS.map((dim) => asFiniteNumber(blocks[dim.key]));
  const total = weights.reduce((acc, value) => acc + value, 0);
  const zeros = CARE_DIMENSIONS.filter(
    (dim) => asFiniteNumber(blocks[dim.key]) <= 0,
  );
  if (zeros.length > 0) {
    alerts.push(
      `Dimensión(es) en 0%: ${zeros.map((dim) => dim.label).join(", ")}.`,
    );
  }
  if (total > 0) {
    const max = Math.max(...weights);
    const maxDim = CARE_DIMENSIONS[weights.indexOf(max)];
    if (max / total >= 0.9) {
      alerts.push(
        `Distribución degenerada: ${maxDim.label} concentra ≥90% del peso.`,
      );
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
    return [
      "Todos los scores propuestos son idénticos (posible distribución degenerada).",
    ];
  }
  if (max - min < 0.01)
    return ["Dispersión de scores muy baja entre candidatos."];
  return [];
}

export function formatDelta(delta: number): string {
  const value = round(asFiniteNumber(delta), 3);
  return `${value > 0 ? "+" : ""}${value.toFixed(3)}`;
}

/** Maps a preview failure (axios error) to a Spanish, user-visible message. */
export function previewErrorMessage(error: unknown): string {
  const status = (error as { response?: { status?: number } })?.response
    ?.status;
  const detail = (error as { response?: { data?: { detail?: unknown } } })
    ?.response?.data?.detail;
  if (status === 404) return "Usuario o perfil no encontrado.";
  if (status === 422) {
    if (Array.isArray(detail)) return detail.join(" · ");
    if (typeof detail === "string" && detail) return detail;
    return "Datos inválidos para la previsualización.";
  }
  return "No se pudo previsualizar el par. Intenta de nuevo.";
}
