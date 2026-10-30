import { useEffect } from "react";
import { useNotifications } from "./useNotifications";

export function useUnreadNotifications(isAuthenticated: boolean) {
  const {
    unreadCount,
    dndActive,
    pausedUntil,
    refresh: scheduleFetch,
  } = useNotifications("all", { unread: true }, isAuthenticated);

  useEffect(() => {
    // useNotifications already handles fetch when enabled changes
  }, [isAuthenticated]);

  return {
    unreadCount: isAuthenticated ? unreadCount : 0,
    dndActive: isAuthenticated ? dndActive : false,
    pausedUntil: isAuthenticated ? pausedUntil : null,
    scheduleFetch,
  };
}
