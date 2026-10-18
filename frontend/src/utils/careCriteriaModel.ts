import {
  CARE_DIMENSIONS,
  CARE_DIMENSION_KEYS,
  type CareDimensionKey,
} from "../constants/careDimensions";
import type {
  CareFormula,
  FormulaBlocks,
} from "../services/careFormulaService";

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
export function toggleLocked(
  locked: string[],
  key: CareDimensionKey,
): string[] {
  return locked.includes(key)
    ? locked.filter((k) => k !== key)
    : [...locked, key];
}

/** `vN · YYYY-MM-DD · admin`. */
export function formatActiveVersion(
  formula: Pick<CareFormula, "version" | "created_at" | "created_by">,
): string {
  const date =
    typeof formula.created_at === "string"
      ? formula.created_at.slice(0, 10)
      : "";
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
  const deltas: {
    key: CareDimensionKey;
    label: string;
    deltaPercent: number;
  }[] = [];
  for (const dim of CARE_DIMENSIONS) {
    const deltaPercent = percentOf(next[dim.key]) - percentOf(base[dim.key]);
    if (deltaPercent !== 0) {
      deltas.push({ key: dim.key, label: dim.label, deltaPercent });
    }
  }
  return deltas;
}

const round6 = (value: number): number =>
  Math.round(asFiniteNumber(value) * 1e6) / 1e6;

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

const firstString = (
  value: string | string[] | undefined,
): string | undefined => (Array.isArray(value) ? value[0] : value);

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
  const status = (error as { response?: { status?: number } })?.response
    ?.status;
  const detail = (error as { response?: { data?: { detail?: unknown } } })
    ?.response?.data?.detail;
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

/**
 * Moves one block toward `requestedPercent` without letting the rounded
 * total exceed 100%. Lowering is always allowed; a raise is capped at the
 * exact remaining headroom (0 when the total is already 100% or more).
 */
export function clampBlockPercent(
  blocks: FormulaBlocks,
  key: CareDimensionKey,
  requestedPercent: number,
): number {
  const currentPercent = percentOf(blocks[key]);
  if (requestedPercent <= currentPercent) return requestedPercent;
  const headroom = Math.max(0, 100 - totalPercent(blocks));
  return Math.min(requestedPercent, currentPercent + headroom);
}
