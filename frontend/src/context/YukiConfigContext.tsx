import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient from '../services/api';
import { type YukiConfig } from '../services/yukiAdminService';

interface YukiConfigContextType {
  config: YukiConfig | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const defaultConfig: YukiConfig = {
  id: '',
  environment: 'production',
  yarn_color: '#E63946',
  yuki_style: 'kawaii',
  custom_skin_id: null,
  animation_speed: 1.0,
  idle_animation: 'default',
  loading_animation: 'yarn_spin',
  success_animation: 'celebrate',
  error_animation: 'confused',
  enable_loader: true,
  enable_onboarding: true,
  enable_notifications: true,
  enable_error_pages: true,
  enable_easter_eggs: false,
  enabled: true,
  allowed_screens: [],
  blocked_screens: [],
  updated_by: null,
  created_at: null,
  updated_at: null,
};

const YukiConfigContext = createContext<YukiConfigContextType>({
  config: defaultConfig,
  loading: false,
  refresh: async () => {},
});

export function useYukiConfig() {
  return useContext(YukiConfigContext);
}

export function YukiConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<YukiConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/portal-redthread/experiencia/mascota/config');
      setConfig(response.data);
    } catch (err) {
      console.error('Failed to load Yuki config', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <YukiConfigContext.Provider value={{ config, loading, refresh: fetchConfig }}>
      {children}
    </YukiConfigContext.Provider>
  );
}
