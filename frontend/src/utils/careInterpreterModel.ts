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
