import { useCallback, useEffect, useRef, useState } from "react";
import apiClient from "../services/api";
import type { PauseScheduleRule } from "../components/notifications/pauseTime";

export const PAUSE_SUMMARY_EVENT = "notifications-pause-summary";
export const PAUSE_STATE_EVENT = "notifications-pause-state";

export interface PauseSummary {
  from: string;
  to: string;
  messages: number;
  social: number;
  system: number;
  total: number;
}

export interface NotificationCounts {
  count: number;
  all: number;
  social: number;
  messages: number;
  system: number;
  survey_pending: number;
  paused_until?: string | null;
  paused_from?: string | null;
  pause_allow?: string[];
  pause_schedule?: PauseScheduleRule[];
  pause_window?: { start: string | null; end: string | null } | null;
  pause_shortcut_id?: string | null;
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
  resolved: boolean;
  required_action: boolean;
  critical: boolean;
  created_at: string;
  updated_at?: string | null;
  actor_count?: number;
  actors?: NotificationActor[];
  user?: NotificationActor | null;
  target_type?: string | null;
  target_id?: string | null;
  pinned_at?: string | null;
  metadata?: Record<string, any> | null;
}

const sortPinned = (items: AppNotification[]) =>
  [...items].sort(
    (a, b) => Number(Boolean(b.pinned_at)) - Number(Boolean(a.pinned_at)),
  );

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
  const [pausedUntil, setPausedUntil] = useState<string | null>(null);
  const [dndActive, setDndActive] = useState(false);
  const [dndSource, setDndSource] = useState<string | null>(null);
  const [routineState, setRoutineState] = useState<string | null>(null);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(
    null,
  );
  const [effectiveActiveRoutineId, setEffectiveActiveRoutineId] = useState<
    string | null
  >(null);
  const [activeRoutineName, setActiveRoutineName] = useState<string | null>(
    null,
  );
  const [windowEnd, setWindowEnd] = useState<string | null>(null);
  const [nextStart, setNextStart] = useState<string | null>(null);
  const [pauseSchedule, setPauseSchedule] = useState<PauseScheduleRule[]>([]);
  const [pauseAllow, setPauseAllow] = useState<string[]>([]);
  const [pauseWindow, setPauseWindow] = useState<{
    start: string | null;
    end: string | null;
  } | null>(null);
  const [pauseShortcutId, setPauseShortcutId] = useState<string | null>(null);

  const filterRef = useRef(filter);
  const unreadRef = useRef(unread);
  const requestIdRef = useRef(0);

  const applyPauseState = useCallback((data: Record<string, any> | null) => {
    if (!data) return;
    setPausedUntil(data.paused_until ?? null);
    setDndActive(Boolean(data.dnd_active));
    setDndSource(data.dnd_source ?? null);
    setRoutineState(data.routine_state ?? null);
    setSelectedRoutineId(data.selected_routine_id ?? null);
    setEffectiveActiveRoutineId(data.effective_active_routine_id ?? null);
    setActiveRoutineName(data.active_routine_name ?? null);
    setWindowEnd(data.window_end ?? null);
    setNextStart(data.next_start ?? null);
    setPauseSchedule(data.pause_schedule ?? []);
    setPauseAllow(data.pause_allow ?? []);
    setPauseWindow(data.pause_window ?? null);
    setPauseShortcutId(data.pause_shortcut_id ?? null);
    window.dispatchEvent(
      new CustomEvent(PAUSE_STATE_EVENT, {
        detail: Boolean(data.dnd_active),
      }),
    );
  }, []);

  const fetchAll = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const isSpecialView =
      filterRef.current === "archived" || filterRef.current === "trash";
    setLoading(true);
    setError(false);
    try {
      const listRequest = apiClient.get("/notifications", {
        params: {
          filter: filterRef.current,
          limit: 50,
          ...(unreadRef.current ? { unread: true } : {}),
        },
      });
      const countRequest = isSpecialView
        ? null
        : apiClient.get("/notifications/unread-count");
      const [list, count] = await Promise.all([listRequest, countRequest]);
      if (requestId !== requestIdRef.current) return;
      setItems(sortPinned(list.data.items ?? []));
      setNextCursor(list.data.next_cursor ?? null);
      if (count) {
        const data = count.data ?? {};
        setCounts({ ...EMPTY_COUNTS, ...data });
        applyPauseState(data);
      }
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

  const markAllRead = useCallback(
    async (scope: string = "all") => {
      setItems((prev) =>
        prev.map((notification) => ({ ...notification, is_read: true })),
      );
      try {
        await apiClient.post("/notifications/read-all", null, {
          params: { filter: scope },
        });
      } catch {
        setError(true);
      } finally {
        await fetchAll();
      }
    },
    [fetchAll],
  );

  const runWithOptimisticRemoval = useCallback(
    async (id: string, request: () => Promise<unknown>) => {
      setItems((prev) => prev.filter((notification) => notification.id !== id));
      try {
        await request();
      } catch {
        setError(true);
      } finally {
        await fetchAll();
      }
    },
    [fetchAll],
  );

  const archive = useCallback(
    (id: string) =>
      runWithOptimisticRemoval(id, () =>
        apiClient.post(`/notifications/${id}/archive`),
      ),
    [runWithOptimisticRemoval],
  );

  const unarchive = useCallback(
    (id: string) =>
      runWithOptimisticRemoval(id, () =>
        apiClient.post(`/notifications/${id}/unarchive`),
      ),
    [runWithOptimisticRemoval],
  );

  const restore = useCallback(
    (id: string) =>
      runWithOptimisticRemoval(id, () =>
        apiClient.post(`/notifications/${id}/restore`),
      ),
    [runWithOptimisticRemoval],
  );

  const remove = useCallback(
    (id: string) =>
      runWithOptimisticRemoval(id, () =>
        apiClient.delete(`/notifications/${id}`),
      ),
    [runWithOptimisticRemoval],
  );

  const runWithOptimisticBulkRemoval = useCallback(
    async (
      ids: string[],
      action: "archive" | "unarchive" | "delete" | "restore",
    ) => {
      const target = new Set(ids);
      setItems((prev) =>
        prev.filter((notification) => !target.has(notification.id)),
      );
      try {
        await apiClient.post("/notifications/bulk", { ids, action });
      } catch {
        setError(true);
      } finally {
        await fetchAll();
      }
    },
    [fetchAll],
  );

  const bulkArchive = useCallback(
    (ids: string[]) => runWithOptimisticBulkRemoval(ids, "archive"),
    [runWithOptimisticBulkRemoval],
  );

  const bulkUnarchive = useCallback(
    (ids: string[]) => runWithOptimisticBulkRemoval(ids, "unarchive"),
    [runWithOptimisticBulkRemoval],
  );

  const bulkDelete = useCallback(
    (ids: string[]) => runWithOptimisticBulkRemoval(ids, "delete"),
    [runWithOptimisticBulkRemoval],
  );

  const bulkRestore = useCallback(
    (ids: string[]) => runWithOptimisticBulkRemoval(ids, "restore"),
    [runWithOptimisticBulkRemoval],
  );

  const bulkMarkRead = useCallback(
    async (ids: string[]) => {
      const target = new Set(ids);
      setItems((prev) =>
        prev.map((notification) =>
          target.has(notification.id)
            ? { ...notification, is_read: true }
            : notification,
        ),
      );
      try {
        await apiClient.post("/notifications/bulk", { ids, action: "read" });
      } catch {
        setError(true);
      } finally {
        await fetchAll();
      }
    },
    [fetchAll],
  );

  const snooze = useCallback(
    (id: string, duration: string) =>
      runWithOptimisticRemoval(id, () =>
        apiClient.post(`/notifications/${id}/snooze`, { duration }),
      ),
    [runWithOptimisticRemoval],
  );

  const unsnooze = useCallback(
    (id: string) =>
      runWithOptimisticRemoval(id, () =>
        apiClient.post(`/notifications/${id}/unsnooze`),
      ),
    [runWithOptimisticRemoval],
  );

  const setPinned = useCallback(
    async (id: string, pinned: boolean) => {
      setItems((prev) =>
        sortPinned(
          prev.map((notification) =>
            notification.id === id
              ? {
                  ...notification,
                  pinned_at: pinned ? new Date().toISOString() : null,
                }
              : notification,
          ),
        ),
      );
      try {
        await apiClient.post(
          `/notifications/${id}/${pinned ? "pin" : "unpin"}`,
        );
      } catch {
        setError(true);
      } finally {
        await fetchAll();
      }
    },
    [fetchAll],
  );

  const dismissReminder = useCallback(
    async (key: string, duration?: string) => {
      try {
        await apiClient.post(`/notifications/reminders/${key}/dismiss`, {
          ...(duration ? { duration } : {}),
        });
      } catch {
        setError(true);
      } finally {
        await fetchAll();
      }
    },
    [fetchAll],
  );

  const restoreReminder = useCallback(
    async (key: string) => {
      try {
        await apiClient.delete(`/notifications/reminders/${key}`);
      } catch {
        setError(true);
      } finally {
        await fetchAll();
      }
    },
    [fetchAll],
  );

  const pause = useCallback(
    async (duration?: string, until?: string) => {
      try {
        const response = await apiClient.post("/notifications/pause", {
          ...(until ? { until } : { duration }),
        });
        applyPauseState(response.data);
      } catch {
        setError(true);
      }
    },
    [applyPauseState],
  );

  const resume = useCallback(async () => {
    try {
      const response = await apiClient.delete("/notifications/pause");
      applyPauseState(response.data);
      if (response.data?.summary) {
        window.dispatchEvent(
          new CustomEvent(PAUSE_SUMMARY_EVENT, {
            detail: response.data.summary,
          }),
        );
      }
      await fetchAll();
    } catch {
      setError(true);
    }
  }, [applyPauseState, fetchAll]);

  const applyPauseShortcut = useCallback(
    async (id: string) => {
      try {
        const response = await apiClient.post(
          `/notifications/pause/schedule/${id}/apply`,
        );
        applyPauseState(response.data);
      } catch {
        setError(true);
      }
    },
    [applyPauseState],
  );

  const savePauseSchedule = useCallback(
    async (rule: PauseScheduleRule) => {
      try {
        const response = await apiClient.post("/notifications/pause/schedule", {
          mode: "recurring",
          id: rule.id,
          name: rule.name,
          days: rule.days,
          start: rule.start,
          end: rule.end,
          timezone: rule.timezone,
          utc_offset_minutes: rule.utc_offset_minutes,
          allow: rule.allow,
          enabled: rule.enabled,
        });
        applyPauseState(response.data);
      } catch (error) {
        console.error("savePauseSchedule failed:", error);
        setError(true);
      }
    },
    [applyPauseState],
  );

  const savePauseWindow = useCallback(
    async (payload: { from: string; to: string; allow: string[] }) => {
      try {
        const response = await apiClient.post("/notifications/pause/schedule", {
          mode: "single",
          from: payload.from,
          to: payload.to,
          allow: payload.allow,
        });
        applyPauseState(response.data);
      } catch {
        setError(true);
      }
    },
    [applyPauseState],
  );

  const removePauseSchedule = useCallback(
    async (id: string) => {
      try {
        const response = await apiClient.delete(
          `/notifications/pause/schedule/${id}`,
        );
        applyPauseState(response.data);
      } catch {
        setError(true);
      }
    },
    [applyPauseState],
  );

  const selectPauseSchedule = useCallback(
    async (id: string) => {
      try {
        const response = await apiClient.post(
          `/notifications/pause/schedule/${id}/select`,
        );
        applyPauseState(response.data);
      } catch {
        setError(true);
      }
    },
    [applyPauseState],
  );

  return {
    items,
    counts,
    unreadCount: counts?.count ?? 0,
    loading,
    error,
    nextCursor,
    pausedUntil,
    dndActive,
    dndSource,
    routineState,
    selectedRoutineId,
    effectiveActiveRoutineId,
    activeRoutineName,
    windowEnd,
    nextStart,
    pauseSchedule,
    pauseAllow,
    pauseWindow,
    pauseShortcutId,
    refresh: fetchAll,
    markRead,
    markBucket,
    markAllRead,
    archive,
    unarchive,
    restore,
    remove,
    bulkArchive,
    bulkUnarchive,
    bulkDelete,
    bulkRestore,
    bulkMarkRead,
    snooze,
    unsnooze,
    setPinned,
    dismissReminder,
    restoreReminder,
    pause,
    resume,
    applyPauseShortcut,
    savePauseSchedule,
    savePauseWindow,
    removePauseSchedule,
    selectPauseSchedule,
  };
}
