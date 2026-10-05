import { useEffect, useState } from "react";
import apiClient from "../services/api";

export interface ProfileTipData {
  tip_key: string;
  type: "carousel" | "drawer" | "stepper" | "dialog";
  section_key: string;
  translation: { title?: string; description?: string; trigger_button_text?: string };
  translations?: Record<string, any>;
  slides?: any[];
}

export function useProfileTip(tip_key: string) {
  const [tip, setTip] = useState<ProfileTipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiClient
      .get(`/api/profile-tips/${tip_key}`)
      .then((res) => {
        if (!cancelled) setTip(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message ?? "error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tip_key]);
  return { tip, loading, error };
}
