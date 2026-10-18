import {
  BUILTIN_PROFILES,
  applyProfileToDraft,
  profileErrorMessage,
  profileMatchesDraft,
  toProfileView,
} from "./careProfileModel";
import { CANONICAL_BLOCK_WEIGHTS } from "../constants/careDimensions";
import { totalPercent } from "./careCriteriaModel";
import type { EquationDraft } from "./careEquationModel";

const draft: EquationDraft = {
  blocks: { ...CANONICAL_BLOCK_WEIGHTS },
  chaosFactor: 5,
  chaosSeed: "abc123",
  minCompatibility: 2,
  matchCritical: 0.2,
};

describe("careProfileModel / builtins", () => {
  it("ships 4 presets with unique ids and Default first", () => {
    expect(BUILTIN_PROFILES).toHaveLength(4);
    expect(BUILTIN_PROFILES[0].id).toBe("builtin:default");
    expect(new Set(BUILTIN_PROFILES.map((p) => p.id)).size).toBe(4);
    expect(BUILTIN_PROFILES.every((p) => p.builtin)).toBe(true);
  });

  it("every preset sums to exactly 100%", () => {
    for (const profile of BUILTIN_PROFILES) {
      expect(totalPercent(profile.blocks)).toBe(100);
    }
  });

  it("matches the approved weights for the recommendations", () => {
    const neuro = BUILTIN_PROFILES.find(
      (p) => p.id === "builtin:neurodiversity",
    )!;
    expect(neuro.blocks).toEqual({
      values: 0.32,
      relationship_goals: 0.16,
      neurodiversity: 0.22,
      responsiveness: 0.09,
      music: 0.1,
      love_language: 0.06,
      communication_style: 0.05,
    });
    const lowchaos = BUILTIN_PROFILES.find((p) => p.id === "builtin:lowchaos")!;
    expect(lowchaos.chaos_factor).toBe(1);
  });
});

describe("careProfileModel / helpers", () => {
  it("toProfileView marks saved profiles as non-builtin", () => {
    const view = toProfileView({
      id: "p1",
      name: "Guardado",
      blocks: { ...CANONICAL_BLOCK_WEIGHTS },
      chaos_factor: 2,
      created_by: "emp1",
      created_at: "2026-10-17T00:00:00",
      updated_at: "2026-10-17T00:00:00",
    });
    expect(view).toEqual({
      id: "p1",
      name: "Guardado",
      blocks: { ...CANONICAL_BLOCK_WEIGHTS },
      chaos_factor: 2,
      builtin: false,
    });
  });

  it("applyProfileToDraft copies blocks + chaos and keeps seed/thresholds", () => {
    const next = applyProfileToDraft(draft, BUILTIN_PROFILES[3]);
    expect(next.blocks).toEqual({ ...CANONICAL_BLOCK_WEIGHTS });
    expect(next.blocks).not.toBe(BUILTIN_PROFILES[3].blocks);
    expect(next.chaosFactor).toBe(1);
    expect(next.chaosSeed).toBe("abc123");
    expect(next.minCompatibility).toBe(2);
    expect(next.matchCritical).toBe(0.2);
    expect(draft.blocks.values).toBe(0.36);
  });

  it("profileMatchesDraft compares rounded percents and chaos", () => {
    const profile = BUILTIN_PROFILES[0];
    expect(profileMatchesDraft(null, draft.blocks, 0)).toBe(false);
    expect(profileMatchesDraft(profile, draft.blocks, 0)).toBe(true);
    expect(profileMatchesDraft(profile, draft.blocks, 0.05)).toBe(true);
    expect(profileMatchesDraft(profile, draft.blocks, 1)).toBe(false);
    expect(
      profileMatchesDraft(
        profile,
        { ...draft.blocks, values: 0.3, music: 0.17 },
        0,
      ),
    ).toBe(false);
  });

  it("profileErrorMessage maps 404/409/422/unknown to Spanish", () => {
    const err = (status: number, detail?: unknown) => ({
      response: { status, data: { detail } },
    });
    expect(profileErrorMessage(err(404))).toBe("Perfil no encontrado.");
    expect(profileErrorMessage(err(409))).toBe(
      "Ya existe un perfil con ese nombre.",
    );
    expect(profileErrorMessage(err(422, ["a", "b"]))).toBe("a · b");
    expect(profileErrorMessage(err(422, "mal"))).toBe("mal");
    expect(profileErrorMessage(new Error("boom"))).toBe(
      "No se pudo completar la operación con el perfil.",
    );
  });
});
