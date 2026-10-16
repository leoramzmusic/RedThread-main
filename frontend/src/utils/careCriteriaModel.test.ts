import {
  percentOf,
  fractionOf,
  toPercents,
  withFraction,
  totalPercent,
  isBalanced,
  toggleLocked,
  formatActiveVersion,
  formatChaos,
  computeDeltas,
  encodeEquationDraft,
  decodeEquationDraft,
  saveErrorMessage,
} from "./careCriteriaModel";
import { CANONICAL_BLOCK_WEIGHTS } from "../constants/careDimensions";

const canonical = { ...CANONICAL_BLOCK_WEIGHTS };

describe("careCriteriaModel / conversions", () => {
  it("percentOf rounds fractions to integer percent", () => {
    expect(percentOf(0.36)).toBe(36);
    expect(percentOf(0.1)).toBe(10);
    expect(percentOf(Number.NaN as unknown as number)).toBe(0);
    expect(percentOf(undefined as unknown as number)).toBe(0);
  });

  it("fractionOf converts percent back to a fraction", () => {
    expect(fractionOf(40)).toBeCloseTo(0.4, 10);
  });

  it("toPercents maps the 7 canonical keys to integers", () => {
    expect(toPercents(canonical)).toEqual({
      values: 36,
      relationship_goals: 18,
      neurodiversity: 15,
      responsiveness: 10,
      music: 11,
      love_language: 6,
      communication_style: 4,
    });
  });

  it("withFraction returns a new object and does not mutate input", () => {
    const next = withFraction(canonical, "values", 40);
    expect(next.values).toBeCloseTo(0.4, 10);
    expect(canonical.values).toBe(0.36);
    expect(next).not.toBe(canonical);
  });
});

describe("careCriteriaModel / sum and balance", () => {
  it("totalPercent sums to 100 for the canonical weights", () => {
    expect(totalPercent(canonical)).toBe(100);
    expect(isBalanced(canonical)).toBe(true);
  });

  it("flags an unbalanced set", () => {
    const unbalanced = { ...canonical, values: 0.4 };
    expect(totalPercent(unbalanced)).toBe(104);
    expect(isBalanced(unbalanced)).toBe(false);
  });
});

describe("careCriteriaModel / lock toggle", () => {
  it("adds a key when absent and removes it when present", () => {
    expect(toggleLocked([], "values")).toEqual(["values"]);
    expect(toggleLocked(["values", "music"], "values")).toEqual(["music"]);
  });
});

describe("careCriteriaModel / labels", () => {
  it("formats the active version KPI", () => {
    expect(
      formatActiveVersion({
        version: 3,
        created_at: "2026-10-16T12:00:00Z",
        created_by: "maria",
      }),
    ).toBe("v3 · 2026-10-16 · maria");
  });

  it("formats the chaos KPI with fijada/aleatoria seed", () => {
    expect(formatChaos(5, null)).toBe("±5% · seed aleatoria");
    expect(formatChaos(2.5, "abc")).toBe("±2.5% · seed fijada");
    expect(formatChaos(0, null)).toBe("±0% · seed aleatoria");
  });
});

describe("careCriteriaModel / deltas", () => {
  it("returns only rows whose rounded percent changed, in canonical order", () => {
    const next = { ...canonical, values: 0.4, music: 0.07 };
    expect(computeDeltas(canonical, next)).toEqual([
      { key: "values", label: "Valores", deltaPercent: 4 },
      { key: "music", label: "Música", deltaPercent: -4 },
    ]);
  });

  it("returns an empty array when nothing changed", () => {
    expect(computeDeltas(canonical, canonical)).toEqual([]);
  });
});

describe("careCriteriaModel / equation draft codec", () => {
  it("round-trips blocks and focus through the query params", () => {
    const encoded = encodeEquationDraft(canonical, "music");
    expect(encoded.source).toBe("criteria");
    expect(encoded.focus).toBe("music");
    expect(typeof encoded.w).toBe("string");
    const decoded = decodeEquationDraft(
      encoded as unknown as Record<string, string>,
    );
    expect(decoded).not.toBeNull();
    expect(decoded?.focus).toBe("music");
    expect(decoded?.blocks).toEqual(canonical);
  });

  it("returns null for a missing or invalid payload", () => {
    expect(decodeEquationDraft(undefined)).toBeNull();
    expect(decodeEquationDraft({})).toBeNull();
    expect(decodeEquationDraft({ w: "not-json" })).toBeNull();
  });

  it("falls back to null focus for an unknown key", () => {
    const encoded = encodeEquationDraft(canonical, "music");
    const decoded = decodeEquationDraft({ w: encoded.w, focus: "zzz" });
    expect(decoded?.focus).toBeNull();
  });
});

describe("careCriteriaModel / saveErrorMessage", () => {
  it("returns the 409 detail string", () => {
    expect(
      saveErrorMessage({
        response: { status: 409, data: { detail: "La fórmula no cambió" } },
      }),
    ).toBe("La fórmula no cambió");
  });

  it("joins a 422 array detail", () => {
    expect(
      saveErrorMessage({
        response: {
          status: 422,
          data: { detail: ["Falta 'blocks'", "Suma ≠ 1.0"] },
        },
      }),
    ).toBe("Falta 'blocks' · Suma ≠ 1.0");
  });

  it("returns the 422 string detail", () => {
    expect(
      saveErrorMessage({
        response: { status: 422, data: { detail: "blocks requerido" } },
      }),
    ).toBe("blocks requerido");
  });

  it("falls back to a generic message for unknown errors", () => {
    expect(saveErrorMessage(new Error("boom"))).toBe(
      "No se pudo guardar la fórmula. Intenta de nuevo.",
    );
  });
});
