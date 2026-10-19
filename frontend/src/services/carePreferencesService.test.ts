import apiClient from "./api";
import {
  createPreference,
  deletePreference,
  listPreferences,
  preferenceErrorMessage,
  updatePreference,
  type CarePreference,
} from "./carePreferencesService";

jest.mock("./api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockGet = apiClient.get as jest.Mock;
const mockPost = apiClient.post as jest.Mock;
const mockPut = apiClient.put as jest.Mock;
const mockDelete = apiClient.delete as jest.Mock;

const preference: CarePreference = {
  id: "p1",
  user_id: "u1",
  dimension: "values",
  tag: null,
  score: 80,
  created_at: "2026-10-19T00:00:00",
  updated_at: "2026-10-19T00:00:00",
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("carePreferencesService", () => {
  it("lists the current user's preferences", async () => {
    mockGet.mockResolvedValueOnce({ data: [preference] });
    await expect(listPreferences()).resolves.toEqual([preference]);
    expect(mockGet).toHaveBeenCalledWith("/preferences");
  });

  it("creates a preference without sending user_id", async () => {
    mockPost.mockResolvedValueOnce({ data: preference });
    await createPreference({ dimension: "values", score: 80 });
    expect(mockPost).toHaveBeenCalledWith("/preferences", {
      dimension: "values",
      score: 80,
    });
  });

  it("updates a preference by id", async () => {
    mockPut.mockResolvedValueOnce({ data: preference });
    await updatePreference("p1", { score: 90 });
    expect(mockPut).toHaveBeenCalledWith("/preferences/p1", { score: 90 });
  });

  it("deletes a preference by id", async () => {
    mockDelete.mockResolvedValueOnce({ data: { ok: true } });
    await deletePreference("p1");
    expect(mockDelete).toHaveBeenCalledWith("/preferences/p1");
  });

  it("maps backend errors to Spanish messages", () => {
    expect(preferenceErrorMessage({ response: { status: 409 } })).toBe(
      "Ya existe una preferencia para esa dimensión.",
    );
    expect(preferenceErrorMessage({ response: { status: 404 } })).toBe(
      "Preferencia no encontrada.",
    );
    expect(
      preferenceErrorMessage({
        response: {
          status: 422,
          data: { detail: ["El score debe estar entre 0 y 100."] },
        },
      }),
    ).toBe("El score debe estar entre 0 y 100.");
    expect(preferenceErrorMessage(new Error("network"))).toBe(
      "No se pudieron guardar tus preferencias.",
    );
  });
});
