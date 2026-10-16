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
export interface FormulaBreakdown {
  [key: string]: number | boolean | string;
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
  const { data } = await adminApiClient.get(`${BASE}/versions`, {
    params: { limit },
  });
  return data as CareFormula[];
}

export async function validateFormula(
  formula: FormulaPayload,
): Promise<ValidateResult> {
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
  const { data } = await adminApiClient.post(`${BASE}/save`, {
    formula,
    source,
  });
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
  const { data } = await adminApiClient.post(`${BASE}/normalizar`, {
    blocks,
    locked,
  });
  return data as { blocks: FormulaBlocks };
}
