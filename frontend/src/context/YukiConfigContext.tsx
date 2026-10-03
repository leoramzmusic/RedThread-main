import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient from '../services/api';
import { type YukiConfig } from '../services/yukiAdminService';

interface YukiConfigContextType {
  config: YukiConfig | null;
  loading: boolean;
  /** Interruptor maestro: false oculta TODA la mascota (FAB, loader, onboarding, badges, gatos). Fail-closed. */
  enabled: boolean;
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
  // Fail-closed: la mascota queda oculta hasta que el backend confirme enabled=true.
  // Así el interruptor maestro del portal siempre se respeta (y ante fallos de red).
  enabled: false,
  allowed_screens: [],
  blocked_screens: [],
  updated_by: null,
  created_at: null,
  updated_at: null,
};

const YukiConfigContext = createContext<YukiConfigContextType>({
  config: defaultConfig,
  loading: false,
  enabled: false,
  refresh: async () => {},
});

export function useYukiConfig() {
  return useContext(YukiConfigContext);
}

/** Atajo al interruptor maestro de Yuki. `false` = ocultar todo lo referente a la mascota. */
export function useYukiEnabled() {
  return useContext(YukiConfigContext).enabled;
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

  const enabled = config?.enabled === true;

  return (
    <YukiConfigContext.Provider value={{ config, loading, enabled, refresh: fetchConfig }}>
      {children}
    </YukiConfigContext.Provider>
  );
}
