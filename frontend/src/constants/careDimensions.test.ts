import {
  CARE_DIMENSIONS,
  CARE_DIMENSION_KEYS,
  CARE_DIMENSION_BY_KEY,
  CANONICAL_BLOCK_WEIGHTS,
  CANONICAL_BLOCK_SUM,
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
    const sum = Object.values(CANONICAL_BLOCK_WEIGHTS).reduce(
      (a, b) => a + b,
      0,
    );
    expect(sum).toBeCloseTo(1.0, 6);
    expect(Object.keys(CANONICAL_BLOCK_WEIGHTS).sort()).toEqual(
      [...CARE_DIMENSION_KEYS].sort(),
    );
  });

  it("CANONICAL_BLOCK_SUM equals the 7 canonical weights summed", () => {
    expect(CANONICAL_BLOCK_SUM).toBeCloseTo(1, 10);
    expect(Object.keys(CANONICAL_BLOCK_WEIGHTS)).toHaveLength(
      CARE_DIMENSION_KEYS.length,
    );
    const perKeySum = CARE_DIMENSION_KEYS.reduce(
      (acc, key) => acc + CANONICAL_BLOCK_WEIGHTS[key],
      0,
    );
    expect(perKeySum).toBeCloseTo(CANONICAL_BLOCK_SUM, 10);
  });
});
