import apiClient from "./api";
import type { CareDimensionKey } from "../constants/careDimensions";

/** Preferencias CARE del usuario autenticado (apiClient). */
export interface CarePreference {
  id: string;
  user_id: string;
  dimension: CareDimensionKey;
  tag: string | null;
  score: number;
  created_at: string;
  updated_at: string;
}

export interface PreferencePayload {
  dimension: CareDimensionKey;
  tag?: string | null;
  score: number;
}

export interface PreferenceUpdate {
  score?: number;
  tag?: string | null;
}

const BASE = "/preferences";

export async function listPreferences(): Promise<CarePreference[]> {
  const { data } = await apiClient.get(BASE);
  return data as CarePreference[];
}

export async function createPreference(
  payload: PreferencePayload,
): Promise<CarePreference> {
  const { data } = await apiClient.post(BASE, payload);
  return data as CarePreference;
}

export async function updatePreference(
  id: string,
  payload: PreferenceUpdate,
): Promise<CarePreference> {
  const { data } = await apiClient.put(`${BASE}/${id}`, payload);
  return data as CarePreference;
}

export async function deletePreference(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/${id}`);
}

export function preferenceErrorMessage(error: unknown): string {
  const response = (
    error as {
      response?: { status?: number; data?: { detail?: unknown } };
    }
  )?.response;
  const status = response?.status;
  if (status === 409) return "Ya existe una preferencia para esa dimensión.";
  if (status === 404) return "Preferencia no encontrada.";
  const detail = response?.data?.detail;
  if (Array.isArray(detail)) return detail.join(" ");
  if (typeof detail === "string") return detail;
  return "No se pudieron guardar tus preferencias.";
}
