import {
  CHAOS_MAX,
  EXAMPLE_FEATURES,
  TONE_OPTIONS,
  clientValidation,
  detectDegenerate,
  draftToPayload,
  formatDelta,
  orbitNodes,
  parseDraft,
  previewErrorMessage,
  serializeDraft,
  smokeAlerts,
  toEquationDraft,
} from "./careEquationModel";
import { CANONICAL_BLOCK_WEIGHTS } from "../constants/careDimensions";

const canonical = { ...CANONICAL_BLOCK_WEIGHTS };

const formula = {
  version: 3,
  blocks: { ...canonical },
  chaos_factor: 5,
  chaos_seed: null,
  min_compatibility: 0,
  match_critical: 0.15,
};

describe("careEquationModel / draft", () => {
  it("maps a formula to a draft with a copied blocks object", () => {
    const draft = toEquationDraft(formula);
    expect(draft).toEqual({
      blocks: canonical,
      chaosFactor: 5,
      chaosSeed: null,
      minCompatibility: 0,
      matchCritical: 0.15,
    });
    expect(draft.blocks).not.toBe(formula.blocks);
  });

  it("builds a payload and omits version/changelog unless provided", () => {
    const draft = toEquationDraft(formula);
    expect(draftToPayload(draft)).toEqual({
      blocks: canonical,
      chaos_factor: 5,
      chaos_seed: null,
      min_compatibility: 0,
      match_critical: 0.15,
    });
    expect(draftToPayload(draft, { version: 3, changelog: "x" })).toEqual({
      blocks: canonical,
      chaos_factor: 5,
      chaos_seed: null,
      min_compatibility: 0,
      match_critical: 0.15,
      version: 3,
      changelog: "x",
    });
  });
});

describe("careEquationModel / orbitNodes", () => {
  it("returns the 7 canonical nodes in order", () => {
    expect(orbitNodes(canonical).map((node) => node.key)).toEqual([
      "values",
      "relationship_goals",
      "neurodiversity",
      "responsiveness",
      "music",
      "love_language",
      "communication_style",
    ]);
  });

  it("sizes nodes proportionally to weight and keeps them in the viewBox", () => {
    const nodes = orbitNodes(canonical);
    const values = nodes.find((node) => node.key === "values")!;
    const comms = nodes.find((node) => node.key === "communication_style")!;
    expect(values.radius).toBeGreaterThan(comms.radius);
    expect(values.percent).toBe(36);
    expect(comms.percent).toBe(4);
    nodes.forEach((node) => {
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.x).toBeLessThanOrEqual(320);
      expect(node.y).toBeGreaterThanOrEqual(0);
      expect(node.y).toBeLessThanOrEqual(320);
    });
  });
});

describe("careEquationModel / JSON codec", () => {
  it("round-trips a draft through serialize/parse", () => {
    const draft = toEquationDraft(formula);
    const parsed = parseDraft(serializeDraft(draft));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.draft).toEqual(draft);
  });

  it("serializes the flat backend shape in canonical key order", () => {
    const text = serializeDraft(toEquationDraft(formula));
    expect(text).toContain('"chaos_factor": 5');
    expect(text.indexOf('"values"')).toBeLessThan(
      text.indexOf('"communication_style"'),
    );
  });

  it("reports structural errors as { ok: false }", () => {
    expect(parseDraft("not-json").ok).toBe(false);
    expect(parseDraft("[]").ok).toBe(false);
    expect(parseDraft('{"chaos_factor": 5}').ok).toBe(false);
    expect(parseDraft('{"blocks": {"values": 1}}').ok).toBe(false);
  });

  it("rejects out-of-range and unknown values", () => {
    expect(
      parseDraft(JSON.stringify({ blocks: { ...canonical, music: 2 } })).ok,
    ).toBe(false);
    expect(
      parseDraft(JSON.stringify({ blocks: { ...canonical, zzz: 0.1 } })).ok,
    ).toBe(false);
    expect(
      parseDraft(
        JSON.stringify({ blocks: canonical, chaos_factor: CHAOS_MAX + 1 }),
      ).ok,
    ).toBe(false);
  });

  it("does not enforce sum == 1.0 (that is the backend/client validation job)", () => {
    const unbalanced = { ...canonical, values: 0.9 };
    expect(parseDraft(JSON.stringify({ blocks: unbalanced })).ok).toBe(true);
  });
});

describe("careEquationModel / validation + degeneracy", () => {
  it("accepts canonical weights", () => {
    expect(clientValidation(canonical)).toEqual([]);
    expect(detectDegenerate(canonical)).toEqual([]);
  });

  it("flags an unbalanced sum", () => {
    expect(clientValidation({ ...canonical, values: 0.4 }).join(" ")).toContain(
      "100%",
    );
  });

  it("flags missing dimensions", () => {
    expect(clientValidation({ values: 0.4 }).join(" ")).toContain(
      "Faltan dimensiones",
    );
  });

  it("detects a degenerate distribution", () => {
    const degenerate = {
      values: 0.95,
      relationship_goals: 0.05,
      neurodiversity: 0,
      responsiveness: 0,
      music: 0,
      love_language: 0,
      communication_style: 0,
    };
    const alerts = detectDegenerate(degenerate);
    expect(alerts.join(" ")).toContain("0%");
    expect(alerts.join(" ")).toContain("degenerada");
  });
});

describe("careEquationModel / smoke + labels", () => {
  it("reports an empty ranking and identical scores", () => {
    expect(smokeAlerts([])).toEqual(["Sin candidatos para el smoke test."]);
    const identical = [
      {
        candidate_id: "a",
        score_current: 0.5,
        score_proposed: 0.5,
        chi_current: 0,
        chi_proposed: 0,
        delta: 0,
      },
      {
        candidate_id: "b",
        score_current: 0.4,
        score_proposed: 0.5,
        chi_current: 0,
        chi_proposed: 0,
        delta: 0.1,
      },
    ];
    expect(smokeAlerts(identical)[0]).toContain("idénticos");
    expect(
      smokeAlerts([
        {
          candidate_id: "a",
          score_current: 0.5,
          score_proposed: 0.7,
          chi_current: 0,
          chi_proposed: 0,
          delta: 0.2,
        },
        {
          candidate_id: "b",
          score_current: 0.3,
          score_proposed: 0.4,
          chi_current: 0,
          chi_proposed: 0,
          delta: 0.1,
        },
      ]),
    ).toEqual([]);
  });

  it("formats deltas with an explicit sign", () => {
    expect(formatDelta(0.12)).toBe("+0.120");
    expect(formatDelta(-0.05)).toBe("-0.050");
    expect(formatDelta(0)).toBe("0.000");
  });

  it("exposes 5 tone options and example features per dimension", () => {
    expect(TONE_OPTIONS.map((option) => option.value)).toEqual([
      "directo",
      "poetico",
      "ludico",
      "emocional",
      "curioso",
    ]);
    expect(Object.keys(EXAMPLE_FEATURES).sort()).toEqual(
      [...Object.keys(canonical)].sort(),
    );
    Object.values(EXAMPLE_FEATURES).forEach((value) => {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    });
  });

  it("maps preview errors to Spanish messages", () => {
    expect(previewErrorMessage({ response: { status: 404 } })).toBe(
      "Usuario o perfil no encontrado.",
    );
    expect(
      previewErrorMessage({
        response: { status: 422, data: { detail: ["x", "y"] } },
      }),
    ).toBe("x · y");
    expect(previewErrorMessage(new Error("boom"))).toBe(
      "No se pudo previsualizar el par. Intenta de nuevo.",
    );
  });
});
