import { useCallback, useEffect, useRef, useState } from "react";
import apiClient from "../services/api";

export interface NotificationCounts {
  count: number;
  all: number;
  social: number;
  messages: number;
  system: number;
  survey_pending: number;
}

export interface NotificationActor {
  user_id?: string;
  name?: string | null;
  photo?: string | null;
  nickname?: string | null;
}

export interface AppNotification {
  id: string;
  type: string;
  content?: string | null;
  is_read: boolean;
  created_at: string;
  updated_at?: string | null;
  actor_count?: number;
  actors?: NotificationActor[];
  user?: NotificationActor | null;
  target_type?: string | null;
  target_id?: string | null;
  metadata?: Record<string, any> | null;
}

const EMPTY_COUNTS: NotificationCounts = {
  count: 0,
  all: 0,
  social: 0,
  messages: 0,
  system: 0,
  survey_pending: 0,
};

export function useNotifications(filter: string, opts?: { unread?: boolean }) {
  const unread = Boolean(opts?.unread);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [counts, setCounts] = useState<NotificationCounts>(EMPTY_COUNTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const filterRef = useRef(filter);
  const unreadRef = useRef(unread);
  const requestIdRef = useRef(0);

  const fetchAll = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(false);
    try {
      const [list, count] = await Promise.all([
        apiClient.get("/notifications", {
          params: {
            filter: filterRef.current,
            limit: 50,
            ...(unreadRef.current ? { unread: true } : {}),
          },
        }),
        apiClient.get("/notifications/unread-count"),
      ]);
      if (requestId !== requestIdRef.current) return;
      setItems(list.data.items ?? []);
      setNextCursor(list.data.next_cursor ?? null);
      setCounts({ ...EMPTY_COUNTS, ...(count.data ?? {}) });
    } catch {
      if (requestId !== requestIdRef.current) return;
      setError(true);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    filterRef.current = filter;
    unreadRef.current = unread;
    void fetchAll();
  }, [filter, unread, fetchAll]);

  useEffect(() => {
    const onSync = () => {
      void fetchAll();
    };
    window.addEventListener("notifications-sync", onSync);
    return () => window.removeEventListener("notifications-sync", onSync);
  }, [fetchAll]);

  const markRead = useCallback(
    async (id: string) => {
      setItems((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, is_read: true }
            : notification,
        ),
      );
      try {
        await apiClient.post(`/notifications/${id}/read`);
      } catch {
        setError(true);
      } finally {
        await fetchAll();
      }
    },
    [fetchAll],
  );

  const markBucket = useCallback(
    async (bucket: "social" | "system") => {
      try {
        await apiClient.post("/notifications/read-bucket", { bucket });
      } catch {
        setError(true);
      } finally {
        await fetchAll();
      }
    },
    [fetchAll],
  );

  const markAllRead = useCallback(async () => {
    try {
      await apiClient.post("/notifications/read-all");
    } catch {
      setError(true);
    } finally {
      await fetchAll();
    }
  }, [fetchAll]);

  return {
    items,
    counts,
    unreadCount: counts?.count ?? 0,
    loading,
    error,
    nextCursor,
    refresh: fetchAll,
    markRead,
    markBucket,
    markAllRead,
  };
}
