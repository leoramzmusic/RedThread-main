import { adminApiClient } from "./api";
import {
  exportPreferences,
  getPreferenceInsights,
  listAllPreferences,
  type PreferenceInsights,
} from "./carePreferencesAdminService";

jest.mock("./api", () => ({
  adminApiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockGet = adminApiClient.get as jest.Mock;
const mockPost = adminApiClient.post as jest.Mock;

const BASE = "/portal-redthread/experiencia/algoritmos/preferences";

const insights: PreferenceInsights = {
  generated_at: "2026-10-19T00:00:00",
  total_records: 2,
  unique_users: 1,
  dimensions: [{ dimension: "values", count: 2, avg_score: 80 }],
  tags: [],
  top_dimensions: [{ dimension: "values", count: 2, avg_score: 80 }],
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("carePreferencesAdminService", () => {
  it("lists with only the provided query params", async () => {
    mockGet.mockResolvedValueOnce({
      data: { items: [], total: 0, limit: 100, offset: 0 },
    });
    await listAllPreferences({ limit: 100, dimension: "values" });
    expect(mockGet).toHaveBeenCalledWith(BASE, {
      params: { limit: 100, dimension: "values" },
    });
  });

  it("fetches insights", async () => {
    mockGet.mockResolvedValueOnce({ data: insights });
    await expect(getPreferenceInsights()).resolves.toEqual(insights);
    expect(mockGet).toHaveBeenCalledWith(`${BASE}/insights`);
  });

  it("exports the dataset", async () => {
    const exported = {
      date: "2026-10-19",
      count: 0,
      files: { json: "a.json", csv: "a.csv" },
      records: [],
    };
    mockPost.mockResolvedValueOnce({ data: exported });
    await expect(exportPreferences()).resolves.toEqual(exported);
    expect(mockPost).toHaveBeenCalledWith(`${BASE}/export`);
  });
});
