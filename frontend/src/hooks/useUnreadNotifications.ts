import { useCallback, useEffect, useRef, useState } from "react";
import apiClient from "../services/api";
import { PAUSE_STATE_EVENT } from "./useNotifications";
import { usePauseExpiry } from "./usePauseExpiry";

export interface UnreadNotificationsState {
  unreadCount: number;
  pausedUntil: string | null;
  dndActive: boolean;
  fetchUnreadCount: () => Promise<void>;
  scheduleFetch: () => void;
}

export function useUnreadNotifications(
  isAuthenticated: boolean,
): UnreadNotificationsState {
  const [unreadCount, setUnreadCount] = useState(0);
  const [pausedUntil, setPausedUntil] = useState<string | null>(null);
  const [dndActive, setDndActive] = useState(false);
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pauseStateVersionRef = useRef(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;

    const pauseVersion = pauseStateVersionRef.current;
    try {
      const response = await apiClient.get("/notifications/unread-count");
      setUnreadCount(response.data.count);
      setDndActive(Boolean(response.data.dnd_active));
      if (pauseVersion === pauseStateVersionRef.current) {
        setPausedUntil(response.data.paused_until ?? null);
      }
      window.dispatchEvent(new CustomEvent("notifications-sync"));
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, [isAuthenticated]);

  const scheduleFetch = useCallback(() => {
    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    fetchTimeoutRef.current = setTimeout(() => {
      fetchTimeoutRef.current = null;
      void fetchUnreadCount();
    }, 500);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }
    void fetchUnreadCount();
  }, [fetchUnreadCount]);

  useEffect(
    () => () => {
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    },
    [],
  );

  useEffect(() => {
    const handlePreferencesChanged = () => scheduleFetch();
    window.addEventListener(
      "care-preferences-changed",
      handlePreferencesChanged,
    );
    return () => {
      window.removeEventListener(
        "care-preferences-changed",
        handlePreferencesChanged,
      );
    };
  }, [scheduleFetch]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") scheduleFetch();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [scheduleFetch]);

  useEffect(() => {
    const onPauseState = (event: Event) => {
      pauseStateVersionRef.current += 1;
      setDndActive(Boolean((event as CustomEvent<boolean>).detail));
    };
    window.addEventListener(PAUSE_STATE_EVENT, onPauseState);
    return () => window.removeEventListener(PAUSE_STATE_EVENT, onPauseState);
  }, []);

  usePauseExpiry(pausedUntil, () => {
    void fetchUnreadCount();
  });

  return {
    unreadCount,
    pausedUntil,
    dndActive,
    fetchUnreadCount,
    scheduleFetch,
  };
}
