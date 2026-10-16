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
    } as unknown as FormulaBreakdown);
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
