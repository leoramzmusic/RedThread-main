import { adminApiClient } from "./api";
import type { FormulaBlocks } from "./careFormulaService";

/**
 * Typed wrapper over the CARE formula profile endpoints.
 * Auth/session is handled by adminApiClient (services/api.ts).
 * Backend router prefix: /portal-redthread/experiencia/algoritmos
 */

const BASE = "/portal-redthread/experiencia/algoritmos/formula/profiles";

/** A saved profile document as returned by the backend. */
export interface CareProfile {
  id: string;
  name: string;
  blocks: FormulaBlocks;
  chaos_factor: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProfilePayload {
  name: string;
  blocks: FormulaBlocks;
  chaos_factor: number;
}

export async function listProfiles(): Promise<CareProfile[]> {
  const { data } = await adminApiClient.get(BASE);
  return data as CareProfile[];
}

export async function createProfile(
  payload: ProfilePayload,
): Promise<CareProfile> {
  const { data } = await adminApiClient.post(BASE, payload);
  return data as CareProfile;
}

export async function updateProfile(
  id: string,
  payload: Partial<ProfilePayload>,
): Promise<CareProfile> {
  const { data } = await adminApiClient.put(`${BASE}/${id}`, payload);
  return data as CareProfile;
}

export async function deleteProfile(id: string): Promise<void> {
  await adminApiClient.delete(`${BASE}/${id}`);
}
