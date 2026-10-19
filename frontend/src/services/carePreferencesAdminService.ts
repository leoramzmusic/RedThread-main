import { adminApiClient } from "./api";
import type { CareDimensionKey } from "../constants/careDimensions";
import type { CarePreference } from "./carePreferencesService";

/** Admin: repositorio, insights y export de preferencias CARE. */
export interface PreferenceInsightRow {
  dimension: CareDimensionKey;
  count: number;
  avg_score: number;
}

export interface PreferenceTagRow {
  tag: string;
  count: number;
  avg_score: number;
}

export interface PreferenceInsights {
  generated_at: string;
  total_records: number;
  unique_users: number;
  dimensions: PreferenceInsightRow[];
  tags: PreferenceTagRow[];
  top_dimensions: PreferenceInsightRow[];
}

export interface PreferenceListResponse {
  items: CarePreference[];
  total: number;
  limit: number;
  offset: number;
}

export interface PreferenceExportResult {
  date: string;
  count: number;
  files: { json: string; csv: string };
  records: CarePreference[];
}

export interface PreferenceListOptions {
  limit?: number;
  offset?: number;
  dimension?: CareDimensionKey | "";
  userId?: string;
}

const BASE = "/portal-redthread/experiencia/algoritmos/preferences";

export async function listAllPreferences(
  options: PreferenceListOptions = {},
): Promise<PreferenceListResponse> {
  const params: Record<string, string | number> = {};
  if (options.limit !== undefined) params.limit = options.limit;
  if (options.offset !== undefined) params.offset = options.offset;
  if (options.dimension) params.dimension = options.dimension;
  if (options.userId) params.user_id = options.userId;
  const { data } = await adminApiClient.get(BASE, { params });
  return data as PreferenceListResponse;
}

export async function getPreferenceInsights(): Promise<PreferenceInsights> {
  const { data } = await adminApiClient.get(`${BASE}/insights`);
  return data as PreferenceInsights;
}

export async function exportPreferences(): Promise<PreferenceExportResult> {
  const { data } = await adminApiClient.post(`${BASE}/export`);
  return data as PreferenceExportResult;
}
