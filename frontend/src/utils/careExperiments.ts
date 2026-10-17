import type {
  CareFormula,
  FormulaPayload,
} from "../services/careFormulaService";

export type ExperimentVariant = "baseline" | "neurodiversity" | "lowchaos";

export type ExperimentStatus = "active" | "running" | "completed";

export interface ExperimentMeta {
  id: string;
  name: string;
  status: ExperimentStatus;
  variant: ExperimentVariant;
  tone: string;
  matchRate: number;
  avgEngagement: number;
  chatDuration: string;
}

export const EXPERIMENT_META: ExperimentMeta[] = [
  {
    id: "exp_001",
    name: "Baseline CARE v2.1",
    status: "active",
    variant: "baseline",
    tone: "directo",
    matchRate: 78,
    avgEngagement: 4.2,
    chatDuration: "12min",
  },
  {
    id: "exp_002",
    name: "Neurodiversidad Boost",
    status: "running",
    variant: "neurodiversity",
    tone: "poetico",
    matchRate: 82,
    avgEngagement: 4.8,
    chatDuration: "18min",
  },
  {
    id: "exp_003",
    name: "Caos Reducido",
    status: "completed",
    variant: "lowchaos",
    tone: "curioso",
    matchRate: 71,
    avgEngagement: 3.9,
    chatDuration: "9min",
  },
];

export function buildExperimentFormula(
  base: CareFormula,
  variant: ExperimentVariant,
): FormulaPayload {
  let blocks: Record<string, number> = { ...base.blocks };
  let chaosFactor = base.chaos_factor;

  if (variant === "neurodiversity") {
    const boosted = { ...blocks };
    if (typeof boosted.neurodiversity === "number") {
      boosted.neurodiversity = boosted.neurodiversity * 1.5;
    }
    const sum = Object.values(boosted).reduce((a, b) => a + b, 0);
    blocks =
      sum > 0
        ? Object.fromEntries(
            Object.entries(boosted).map(([k, v]): [string, number] => [
              k,
              v / sum,
            ]),
          )
        : boosted;
  } else if (variant === "lowchaos") {
    chaosFactor = base.chaos_factor * 0.25;
  }

  return {
    version: base.version,
    blocks,
    chaos_factor: chaosFactor,
    chaos_seed: base.chaos_seed,
    min_compatibility: base.min_compatibility,
    match_critical: base.match_critical,
  };
}

export interface ExperimentMetrics {
  matchRate: number;
  avgEngagement: number;
  chatDuration: string;
}

export interface SimulationResult {
  score: number;
  narrative: string;
  timestamp: string;
  userA: string;
  userB: string;
}

export function computeMetricsFromHistory(
  history: SimulationResult[],
  initial: ExperimentMetrics,
): ExperimentMetrics {
  if (history.length === 0) return initial;
  const n = history.length;
  const avgScore = history.reduce((a, r) => a + r.score, 0) / n;
  const matchRate = Math.round(avgScore);
  const avgEngagement =
    Math.round(
      (history.reduce((a, r) => a + Math.min(5, Math.max(1, r.score / 20)), 0) /
        n) *
        10,
    ) / 10;
  const avgMinutes = Math.round(
    history.reduce(
      (a, r) => a + Math.min(30, Math.max(5, Math.round(r.score / 2))),
      0,
    ) / n,
  );
  return { matchRate, avgEngagement, chatDuration: `${avgMinutes}min` };
}
