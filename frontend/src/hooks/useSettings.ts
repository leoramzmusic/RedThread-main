import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api';
import { useSnackbar } from 'notistack';

interface UserSettings {
  // Personalización Visual
  preferred_language: string;
  theme_mode: string;
  theme_color: string;
  visual_theme?: string;
  font_size?: string;
  
  // Localización
  date_format?: string;
  time_format?: string;
  timezone?: string;
  
  // Notificaciones
  notifications_enabled: boolean;
  notification_frequency?: {
    suggestions: boolean;
    messages: boolean;
    news: boolean;
    matches: boolean;
  };
  do_not_disturb?: {
    enabled: boolean;
    start_time: string;
    end_time: string;
  };
  offline_notifications?: boolean;
  
  // Seguridad
  two_factor_enabled?: boolean;
  two_factor_method?: string;
  
  // Accesibilidad
  high_contrast_mode?: boolean;
  screen_reader_enabled?: boolean;
  keyboard_navigation?: boolean;
  reduced_motion?: boolean;
  
  // Avanzado
  auto_save?: boolean;
}

interface UseSettingsReturn {
  settings: UserSettings | null;
  loading: boolean;
  saving: boolean;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  saveSettings: (settingsToSave?: UserSettings) => Promise<void>;
  suspendAccount: (period: string) => Promise<void>;
  deleteAccount: (reason: string) => Promise<void>;
  resetVisual: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useSettings(autoSave: boolean = false): UseSettingsReturn {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/settings/me');
      setSettings(response.data);
      if (response.data.font_size) {
        document.body.setAttribute('data-font-size', response.data.font_size);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      enqueueSnackbar('Error al cargar configuración', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
    if (!settings) return;

    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);

    // Auto-save if enabled
    if (autoSave || settings.auto_save) {
      try {
        setSaving(true);
        await apiClient.put('/settings/me', updatedSettings);
        enqueueSnackbar('Guardado automáticamente', { 
          variant: 'success',
          autoHideDuration: 2000,
        });
      } catch (error) {
        console.error('Error auto-saving settings:', error);
        enqueueSnackbar('Error al guardar', { variant: 'error' });
      } finally {
        setSaving(false);
      }
    }
  }, [settings, autoSave, enqueueSnackbar]);

  const saveSettings = useCallback(async (settingsToSave?: UserSettings) => {
    const dataToSave = settingsToSave || settings;
    if (!dataToSave) return;

    try {
      setSaving(true);
      await apiClient.put('/settings/me', dataToSave);
      
      // Update local state if we saved new data
      if (settingsToSave) {
        setSettings(dataToSave);
      }
      
      // Apply theme changes
      // Apply theme changes to document only, no local storage persistence
      if (dataToSave.font_size) {
        document.body.setAttribute('data-font-size', dataToSave.font_size);
      }
      
      enqueueSnackbar('Configuración guardada exitosamente', { variant: 'success' });
    } catch (error) {
      console.error('Error saving settings:', error);
      enqueueSnackbar('Error al guardar configuración', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  }, [settings, enqueueSnackbar]);

  const suspendAccount = useCallback(async (period: string) => {
    try {
      setSaving(true);
      await apiClient.post('/auth/suspend', { period });
      enqueueSnackbar('Cuenta suspendida temporalmente', { variant: 'success' });
      // Redirect to logout or landing
      window.location.href = '/';
    } catch (error) {
      console.error('Error suspending account:', error);
      enqueueSnackbar('Error al suspender cuenta', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  }, [enqueueSnackbar]);

  const deleteAccount = useCallback(async (reason: string) => {
    try {
      setSaving(true);
      await apiClient.delete('/auth/me', { data: { reason } });
      enqueueSnackbar('Cuenta eliminada permanentemente', { variant: 'success' });
      // Redirect to landing
      window.location.href = '/';
    } catch (error) {
      console.error('Error deleting account:', error);
      enqueueSnackbar('Error al eliminar cuenta', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  }, [enqueueSnackbar]);

  const resetVisual = useCallback(async () => {
    try {
      setSaving(true);
      await apiClient.post('/settings/reset-visual');
      
      // Reset local dom attributes
      document.body.removeAttribute('data-font-size');
      
      // Refetch settings
      await fetchSettings();
      
      enqueueSnackbar('Configuración visual restablecida', { variant: 'success' });
    } catch (error) {
      console.error('Error resetting visual settings:', error);
      enqueueSnackbar('Error al restablecer configuración', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  }, [fetchSettings, enqueueSnackbar]);

  return {
    settings,
    loading,
    saving,
    updateSettings,
    saveSettings,
    suspendAccount,
    deleteAccount,
    resetVisual,
    refetch: fetchSettings,
  };
}
