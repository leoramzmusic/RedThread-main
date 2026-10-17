import {
  buildExperimentFormula,
  computeMetricsFromHistory,
  EXPERIMENT_META,
} from "./careExperiments";
import type { CareFormula } from "../services/careFormulaService";
import type { SimulationResult } from "./careExperiments";

const base: CareFormula = {
  version: 1,
  status: "active",
  blocks: {
    values: 0.2,
    relationship_goals: 0.2,
    neurodiversity: 0.15,
    responsiveness: 0.15,
    music: 0.1,
    love_language: 0.1,
    communication_style: 0.1,
  },
  chaos_factor: 5,
  chaos_seed: null,
  min_compatibility: 0,
  match_critical: 0.15,
  changelog: "",
  created_by: "admin",
  created_at: "2026-01-01T00:00:00Z",
};

describe("buildExperimentFormula", () => {
  it("baseline keeps blocks and chaos unchanged", () => {
    const formula = buildExperimentFormula(base, "baseline");
    expect(formula.blocks).toEqual(base.blocks);
    expect(formula.chaos_factor).toBe(5);
  });

  it("neurodiversity boosts the block and renormalizes weights to sum 1", () => {
    const formula = buildExperimentFormula(base, "neurodiversity");
    const sum = Object.values(formula.blocks).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1);
    expect(formula.blocks.neurodiversity).toBeGreaterThan(
      base.blocks.neurodiversity,
    );
  });

  it("lowchaos reduces the chaos factor", () => {
    const formula = buildExperimentFormula(base, "lowchaos");
    expect(formula.chaos_factor).toBeCloseTo(1.25);
  });
});

describe("EXPERIMENT_META", () => {
  it("defines three experiments in ACTIVO, EN EJECUCIÓN, COMPLETADO order", () => {
    expect(EXPERIMENT_META).toHaveLength(3);
    expect(EXPERIMENT_META.map((e) => e.status)).toEqual([
      "active",
      "running",
      "completed",
    ]);
  });
});

describe("computeMetricsFromHistory", () => {
  const initial = { matchRate: 78, avgEngagement: 4.2, chatDuration: "12min" };

  it("returns the initial metrics when history is empty", () => {
    expect(computeMetricsFromHistory([], initial)).toEqual(initial);
  });

  it("computes matchRate as the average of scores", () => {
    const history: SimulationResult[] = [makeResult(60), makeResult(80)];
    expect(computeMetricsFromHistory(history, initial).matchRate).toBe(70);
  });

  it("derives engagement and chat duration from the history", () => {
    const metrics = computeMetricsFromHistory([makeResult(100)], initial);
    expect(metrics.avgEngagement).toBe(5);
    expect(metrics.chatDuration).toBe("30min");
  });
});

function makeResult(score: number): SimulationResult {
  return {
    score,
    narrative: "n",
    timestamp: "2026-01-01T00:00:00Z",
    userA: "a",
    userB: "b",
  };
}
