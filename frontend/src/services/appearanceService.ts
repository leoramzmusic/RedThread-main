import adminApiClient from './adminApi';
import apiClient from './api';
import { AppearanceResource, AppearanceType, Platform, AppearanceHistory } from '../types/appearance';

const BASE_PATH = '/portal-redthread/apariencia';

const appearanceService = {
  getPublicResources: async (type?: AppearanceType, platform?: Platform): Promise<AppearanceResource[]> => {
    const params: any = {};
    if (type) params.type = type;
    if (platform) params.platform = platform;

    // Public endpoint: only active resources, no auth required
    const response = await apiClient.get(`${BASE_PATH}/public`, { params });
    return response.data;
  },
  getHistory: async (resourceId?: string): Promise<AppearanceHistory[]> => {
    const params: any = {};
    if (resourceId) params.resource_id = resourceId;
    const response = await adminApiClient.get(`${BASE_PATH}/history`, { params });
    return response.data;
  },

  clearHistory: async (): Promise<void> => {
    await adminApiClient.delete(`${BASE_PATH}/history`);
  },

  uploadFile: async (file: File, type: AppearanceType): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    const response = await adminApiClient.post(`${BASE_PATH}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.url;
  },

  createResource: async (resource: AppearanceResource): Promise<AppearanceResource> => {
    const response = await adminApiClient.post(`${BASE_PATH}/resources`, resource);
    return response.data;
  },

  getResources: async (type?: AppearanceType, platform?: Platform): Promise<AppearanceResource[]> => {
    const params: any = {};
    if (type) params.type = type;
    if (platform) params.platform = platform;
    
    // adminApiClient already has baseURL set to backend
    const response = await adminApiClient.get(`${BASE_PATH}/resources`, { params });
    return response.data;
  },

  deleteResource: async (id: string): Promise<void> => {
    await adminApiClient.delete(`${BASE_PATH}/resources/${id}`);
  },

  updateResource: async (id: string, updates: Partial<AppearanceResource>): Promise<AppearanceResource> => {
    const response = await adminApiClient.put(`${BASE_PATH}/resources/${id}`, updates);
    return response.data;
  }
};

export default appearanceService;
