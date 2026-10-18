import { adminApiClient } from "./api";
import {
  createProfile,
  deleteProfile,
  listProfiles,
  updateProfile,
  type CareProfile,
} from "./careProfileService";

jest.mock("./api", () => ({
  adminApiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockGet = adminApiClient.get as jest.Mock;
const mockPost = adminApiClient.post as jest.Mock;
const mockPut = adminApiClient.put as jest.Mock;
const mockDelete = adminApiClient.delete as jest.Mock;

const BASE = "/portal-redthread/experiencia/algoritmos/formula/profiles";

const profile: CareProfile = {
  id: "p1",
  name: "Mi perfil",
  blocks: { values: 0.36 },
  chaos_factor: 0,
  created_by: "emp1",
  created_at: "2026-10-17T00:00:00",
  updated_at: "2026-10-17T00:00:00",
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("careProfileService", () => {
  it("listProfiles GETs the collection", async () => {
    mockGet.mockResolvedValueOnce({ data: [profile] });
    await expect(listProfiles()).resolves.toEqual([profile]);
    expect(mockGet).toHaveBeenCalledWith(BASE);
  });

  it("createProfile POSTs the payload", async () => {
    mockPost.mockResolvedValueOnce({ data: profile });
    const payload = {
      name: "Mi perfil",
      blocks: { values: 0.36 },
      chaos_factor: 0,
    };
    await expect(createProfile(payload)).resolves.toEqual(profile);
    expect(mockPost).toHaveBeenCalledWith(BASE, payload);
  });

  it("updateProfile PUTs a partial payload to the id", async () => {
    mockPut.mockResolvedValueOnce({ data: profile });
    await updateProfile("p1", { chaos_factor: 2 });
    expect(mockPut).toHaveBeenCalledWith(`${BASE}/p1`, { chaos_factor: 2 });
  });

  it("deleteProfile DELETEs the id", async () => {
    mockDelete.mockResolvedValueOnce({ data: { ok: true } });
    await deleteProfile("p1");
    expect(mockDelete).toHaveBeenCalledWith(`${BASE}/p1`);
  });
});
