import {
  CANONICAL_BLOCK_WEIGHTS,
  CARE_DIMENSION_KEYS,
} from "../constants/careDimensions";
import type { FormulaBlocks } from "../services/careFormulaService";
import type { CareProfile } from "../services/careProfileService";
import { percentOf } from "./careCriteriaModel";
import type { EquationDraft } from "./careEquationModel";

/**
 * Pure view-model helpers for CARE formula profiles.
 * Frontend presets are constants (no backend copy); saved profiles come from
 * careProfileService. Index 0 of BUILTIN_PROFILES is the Default profile.
 */

export interface ProfileView {
  id: string;
  name: string;
  blocks: FormulaBlocks;
  chaos_factor: number;
  builtin: boolean;
}

export const BUILTIN_PROFILES: ProfileView[] = [
  {
    id: "builtin:default",
    name: "Default",
    blocks: { ...CANONICAL_BLOCK_WEIGHTS },
    chaos_factor: 0.0,
    builtin: true,
  },
  {
    id: "builtin:neurodiversity",
    name: "Neurodiversidad Boost",
    blocks: {
      values: 0.32,
      relationship_goals: 0.16,
      neurodiversity: 0.22,
      responsiveness: 0.09,
      music: 0.1,
      love_language: 0.06,
      communication_style: 0.05,
    },
    chaos_factor: 0.0,
    builtin: true,
  },
  {
    id: "builtin:balance",
    name: "Balance Relacional",
    blocks: {
      values: 0.3,
      relationship_goals: 0.2,
      neurodiversity: 0.13,
      responsiveness: 0.11,
      music: 0.09,
      love_language: 0.09,
      communication_style: 0.08,
    },
    chaos_factor: 0.0,
    builtin: true,
  },
  {
    id: "builtin:lowchaos",
    name: "Caos Reducido",
    blocks: { ...CANONICAL_BLOCK_WEIGHTS },
    chaos_factor: 1.0,
    builtin: true,
  },
];

export function toProfileView(profile: CareProfile): ProfileView {
  return {
    id: profile.id,
    name: profile.name,
    blocks: profile.blocks,
    chaos_factor: profile.chaos_factor,
    builtin: false,
  };
}

/** Overwrites blocks + chaos factor; seed/thresholds of the draft survive. */
export function applyProfileToDraft(
  draft: EquationDraft,
  profile: ProfileView,
): EquationDraft {
  return {
    ...draft,
    blocks: { ...profile.blocks },
    chaosFactor: profile.chaos_factor,
  };
}

/** True when the draft still equals the profile (rounded %) and chaos (±0.1). */
export function profileMatchesDraft(
  profile: ProfileView | null,
  blocks: FormulaBlocks,
  chaosFactor: number,
): boolean {
  if (!profile) return false;
  if (Math.abs(chaosFactor - profile.chaos_factor) > 0.1) return false;
  return CARE_DIMENSION_KEYS.every(
    (key) => percentOf(blocks[key]) === percentOf(profile.blocks[key]),
  );
}

/** Maps a profile failure (axios error) to a Spanish, user-visible message. */
export function profileErrorMessage(error: unknown): string {
  const status = (error as { response?: { status?: number } })?.response
    ?.status;
  const detail = (error as { response?: { data?: { detail?: unknown } } })
    ?.response?.data?.detail;
  if (status === 404) {
    return typeof detail === "string" && detail
      ? detail
      : "Perfil no encontrado.";
  }
  if (status === 409) {
    return typeof detail === "string" && detail
      ? detail
      : "Ya existe un perfil con ese nombre.";
  }
  if (status === 422) {
    if (Array.isArray(detail)) return detail.join(" · ");
    if (typeof detail === "string" && detail) return detail;
    return "El perfil no pasó la validación.";
  }
  return "No se pudo completar la operación con el perfil.";
}
