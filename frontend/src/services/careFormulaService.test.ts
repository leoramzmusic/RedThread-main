import { adminApiClient } from "./api";
import {
  getActiveFormula,
  listFormulaVersions,
  validateFormula,
  previewFormula,
  simulateFormula,
  saveFormula,
  rollbackFormula,
  normalizeFormulaBlocks,
  numericBreakdown,
  type FormulaBreakdown,
  type FormulaPayload,
} from "./careFormulaService";

jest.mock("./api", () => ({
  adminApiClient: { get: jest.fn(), post: jest.fn() },
}));

const mockGet = adminApiClient.get as jest.Mock;
const mockPost = adminApiClient.post as jest.Mock;

const BASE = "/portal-redthread/experiencia/algoritmos/formula";

const payload: FormulaPayload = {
  blocks: {
    values: 0.36,
    relationship_goals: 0.18,
    neurodiversity: 0.15,
    responsiveness: 0.1,
    music: 0.11,
    love_language: 0.06,
    communication_style: 0.04,
  },
  chaos_factor: 0,
  chaos_seed: null,
  min_compatibility: 0,
  match_critical: 0.15,
  changelog: "test",
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("careFormulaService", () => {
  it("getActiveFormula GETs /formula/active and returns the body", async () => {
    const body = { version: 1, status: "active", blocks: {}, changelog: "x" };
    mockGet.mockResolvedValueOnce({ data: body });
    await expect(getActiveFormula()).resolves.toEqual(body);
    expect(mockGet).toHaveBeenCalledWith(`${BASE}/active`);
  });

  it("listFormulaVersions passes limit as a query param", async () => {
    mockGet.mockResolvedValueOnce({ data: [] });
    await listFormulaVersions(10);
    expect(mockGet).toHaveBeenCalledWith(`${BASE}/versions`, {
      params: { limit: 10 },
    });
  });

  it("validateFormula POSTs the wrapped payload", async () => {
    mockPost.mockResolvedValueOnce({ data: { valid: true, errors: [] } });
    const res = await validateFormula(payload);
    expect(res).toEqual({ valid: true, errors: [] });
    expect(mockPost).toHaveBeenCalledWith(`${BASE}/validate`, {
      formula: payload,
    });
  });

  it("previewFormula POSTs formula + ids + tone", async () => {
    mockPost.mockResolvedValueOnce({
      data: { current: {}, proposed: {}, deltas: {} },
    });
    await previewFormula({
      formula: payload,
      user_a_id: "a",
      user_b_id: "b",
      tone: "poetico",
    });
    expect(mockPost).toHaveBeenCalledWith(`${BASE}/preview`, {
      formula: payload,
      user_a_id: "a",
      user_b_id: "b",
      tone: "poetico",
    });
  });

  it("simulateFormula POSTs formula + anchor + candidates", async () => {
    mockPost.mockResolvedValueOnce({
      data: { mock: true, ranking: [], mean_delta: 0 },
    });
    await simulateFormula({
      formula: payload,
      anchor_user_id: "a",
      candidate_user_ids: ["b", "c"],
    });
    expect(mockPost).toHaveBeenCalledWith(`${BASE}/simulate`, {
      formula: payload,
      anchor_user_id: "a",
      candidate_user_ids: ["b", "c"],
    });
  });

  it("saveFormula sends source (defaults to api)", async () => {
    mockPost.mockResolvedValueOnce({ data: { version: 2 } });
    await saveFormula(payload);
    expect(mockPost).toHaveBeenCalledWith(`${BASE}/save`, {
      formula: payload,
      source: "api",
    });
    mockPost.mockResolvedValueOnce({ data: { version: 3 } });
    await saveFormula(payload, "criteria");
    expect(mockPost).toHaveBeenLastCalledWith(`${BASE}/save`, {
      formula: payload,
      source: "criteria",
    });
  });

  it("rollbackFormula POSTs to /formula/rollback/{version}", async () => {
    mockPost.mockResolvedValueOnce({ data: { version: 3 } });
    await rollbackFormula(3);
    expect(mockPost).toHaveBeenCalledWith(`${BASE}/rollback/3`);
  });

  it("normalizeFormulaBlocks POSTs blocks + locked", async () => {
    mockPost.mockResolvedValueOnce({ data: { blocks: { values: 1 } } });
    const res = await normalizeFormulaBlocks({ values: 0.5, music: 0.5 }, [
      "values",
    ]);
    expect(res).toEqual({ blocks: { values: 1 } });
    expect(mockPost).toHaveBeenCalledWith(`${BASE}/normalizar`, {
      blocks: { values: 0.5, music: 0.5 },
      locked: ["values"],
    });
  });
});

describe("numericBreakdown", () => {
  it("keeps only numeric canonical block keys", () => {
    const breakdown = {
      values: 0.36,
      music: 0.11,
      saturated: false,
      compatibility_label: "alta",
      final_score: 0.42,
      chaos_applied: 0.2,
      bogus: 9,
    } as unknown as FormulaBreakdown;
    expect(numericBreakdown(breakdown)).toEqual({ values: 0.36, music: 0.11 });
  });

  it("returns {} for null and undefined", () => {
    expect(numericBreakdown(null)).toEqual({});
    expect(numericBreakdown(undefined)).toEqual({});
  });

  it("does not mutate the input and returns a fresh object", () => {
    const breakdown = {
      values: 0.5,
      music: 0.5,
      saturated: true,
    } as unknown as FormulaBreakdown;
    const snapshot = { ...breakdown };
    const result = numericBreakdown(breakdown);
    expect(breakdown).toEqual(snapshot);
    expect(result).not.toBe(breakdown);
  });
});
