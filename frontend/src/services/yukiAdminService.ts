import adminApiClient from './adminApi';
import apiClient from './api';

const BASE_PATH = '/portal-redthread/experiencia/mascota';

export interface YukiConfig {
  id: string;
  environment: string;
  yarn_color: string;
  yuki_style: string;
  custom_skin_id: string | null;
  animation_speed: number;
  idle_animation: string;
  loading_animation: string;
  success_animation: string;
  error_animation: string;
  enable_loader: boolean;
  enable_onboarding: boolean;
  enable_notifications: boolean;
  enable_error_pages: boolean;
  enable_easter_eggs: boolean;
  enabled: boolean;
  allowed_screens: string[];
  blocked_screens: string[];
  updated_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface YukiSkin {
  id: string;
  name: string;
  image_url: string;
  unlocked_by: string | null;
  is_active: boolean;
  created_at: string | null;
}

export interface YukiRule {
  id: string;
  condition: string;
  action: string;
  value: string | null;
  priority: number;
  is_active: boolean;
}

export interface YukiAsset {
  id: string;
  filename: string;
  url: string;
  type: 'image' | 'lottie';
  size: number;
}

const yukiAdminService = {
  getConfig: async (env?: string): Promise<YukiConfig> => {
    const params: any = {};
    if (env) params.env = env;
    const response = await apiClient.get(`${BASE_PATH}/config`, { params });
    return response.data;
  },

  updateConfig: async (data: Partial<YukiConfig>): Promise<YukiConfig> => {
    const response = await adminApiClient.put(`${BASE_PATH}/config`, data);
    return response.data.config;
  },

  getHistory: async () => {
    const response = await adminApiClient.get(`${BASE_PATH}/config/history`);
    return response.data;
  },

  getSkins: async (): Promise<YukiSkin[]> => {
    const response = await adminApiClient.get(`${BASE_PATH}/skins`);
    return response.data;
  },

  createSkin: async (name: string, file: File, unlockedBy?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    if (unlockedBy) formData.append('unlocked_by', unlockedBy);
    const response = await adminApiClient.post(`${BASE_PATH}/skins`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteSkin: async (id: string) => {
    await adminApiClient.delete(`${BASE_PATH}/skins/${id}`);
  },

  getRules: async (): Promise<YukiRule[]> => {
    const response = await adminApiClient.get(`${BASE_PATH}/rules`);
    return response.data;
  },

  createRule: async (data: { condition: string; action: string; value?: string; priority?: number }) => {
    const response = await adminApiClient.post(`${BASE_PATH}/rules`, data);
    return response.data;
  },

  updateRule: async (id: string, data: Partial<YukiRule>) => {
    const response = await adminApiClient.put(`${BASE_PATH}/rules/${id}`, data);
    return response.data;
  },

  deleteRule: async (id: string) => {
    await adminApiClient.delete(`${BASE_PATH}/rules/${id}`);
  },

  uploadAsset: async (file: File): Promise<YukiAsset> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await adminApiClient.post(`${BASE_PATH}/assets`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getAssets: async (): Promise<YukiAsset[]> => {
    const response = await adminApiClient.get(`${BASE_PATH}/assets`);
    return response.data;
  },

  deleteAsset: async (id: string) => {
    await adminApiClient.delete(`${BASE_PATH}/assets/${id}`);
  },
};

export default yukiAdminService;
