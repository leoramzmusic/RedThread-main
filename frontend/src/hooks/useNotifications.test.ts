import { renderHook, waitFor, act } from "@testing-library/react";
import { useNotifications } from "./useNotifications";
import apiClient from "../services/api";

jest.mock("../services/api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));
const get = apiClient.get as jest.Mock;
const post = apiClient.post as jest.Mock;
const del = apiClient.delete as jest.Mock;

const counts = {
  count: 2,
  all: 2,
  social: 1,
  messages: 1,
  system: 0,
  survey_pending: 0,
};

beforeEach(() => {
  jest.clearAllMocks();
  get.mockImplementation((url: string) => {
    if (url === "/notifications/unread-count")
      return Promise.resolve({ data: counts });
    return Promise.resolve({ data: { items: [], next_cursor: null } });
  });
});

it("fetches the filter and unread flag", async () => {
  const { result } = renderHook(() =>
    useNotifications("messages", { unread: true }),
  );
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(get).toHaveBeenCalledWith("/notifications", {
    params: { filter: "messages", limit: 50, unread: true },
  });
});

it("marks a notification read and refreshes counts", async () => {
  post.mockResolvedValue({ data: {} });
  const { result } = renderHook(() => useNotifications("all"));
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(() => result.current.markRead("n1"));
  expect(post).toHaveBeenCalledWith("/notifications/n1/read");
  expect(get).toHaveBeenCalledWith("/notifications/unread-count");
});

it("marks a bucket seen", async () => {
  post.mockResolvedValue({ data: {} });
  const { result } = renderHook(() => useNotifications("social"));
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(() => result.current.markBucket("social"));
  expect(post).toHaveBeenCalledWith("/notifications/read-bucket", {
    bucket: "social",
  });
});

it("exposes counts, unreadCount and nextCursor", async () => {
  get.mockImplementation((url: string) => {
    if (url === "/notifications/unread-count")
      return Promise.resolve({ data: counts });
    return Promise.resolve({
      data: {
        items: [{ id: "n1", type: "like", is_read: false }],
        next_cursor: "abc",
      },
    });
  });
  const { result } = renderHook(() => useNotifications("all"));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.unreadCount).toBe(2);
  expect(result.current.counts.social).toBe(1);
  expect(result.current.items).toHaveLength(1);
  expect(result.current.nextCursor).toBe("abc");
});

it("reports an error when the list request fails", async () => {
  get.mockImplementation((url: string) => {
    if (url === "/notifications/unread-count")
      return Promise.resolve({ data: counts });
    return Promise.reject(new Error("boom"));
  });
  const { result } = renderHook(() => useNotifications("all"));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.error).toBe(true);
});

it("refreshes when the notifications-sync event fires", async () => {
  const { result } = renderHook(() => useNotifications("all"));
  await waitFor(() => expect(result.current.loading).toBe(false));
  get.mockClear();
  act(() => {
    window.dispatchEvent(new Event("notifications-sync"));
  });
  await waitFor(() =>
    expect(get).toHaveBeenCalledWith("/notifications/unread-count"),
  );
});

it("marks all read with the active filter scope", async () => {
  let marked = false;
  get.mockImplementation((url: string) =>
    url === "/notifications/unread-count"
      ? Promise.resolve({ data: counts })
      : Promise.resolve({
          data: {
            items: [
              { id: "n1", type: "like", is_read: marked },
              { id: "n2", type: "match", is_read: marked },
            ],
          },
        }),
  );
  post.mockImplementation(async () => {
    marked = true;
    return { data: {} };
  });
  const { result } = renderHook(() => useNotifications("social"));
  await waitFor(() => expect(result.current.loading).toBe(false));

  await act(() => result.current.markAllRead("social"));

  expect(post).toHaveBeenCalledWith("/notifications/read-all", null, {
    params: { filter: "social" },
  });
  expect(result.current.items.every((item) => item.is_read)).toBe(true);
});

it("skips the unread-count request when filter is archived", async () => {
  get.mockImplementation((url: string) => {
    if (url === "/notifications/unread-count")
      return Promise.resolve({ data: counts });
    return Promise.resolve({
      data: { items: [{ id: "n1", type: "promo", is_read: false }] },
    });
  });
  const { result } = renderHook(() => useNotifications("archived"));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(get).toHaveBeenCalledWith("/notifications", {
    params: { filter: "archived", limit: 50 },
  });
  expect(get).not.toHaveBeenCalledWith("/notifications/unread-count");
  expect(result.current.items).toHaveLength(1);
});

it("skips the unread-count request when filter is trash", async () => {
  const { result } = renderHook(() => useNotifications("trash"));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(get).toHaveBeenCalledWith("/notifications", {
    params: { filter: "trash", limit: 50 },
  });
  expect(get).not.toHaveBeenCalledWith("/notifications/unread-count");
});

it.each([
  ["bulkArchive", "archive"],
  ["bulkUnarchive", "unarchive"],
  ["bulkRestore", "restore"],
  ["bulkDelete", "delete"],
] as const)(
  "%s posts the ids in bulk, removes them optimistically and refreshes",
  async (method, action) => {
    get.mockImplementation((url: string) =>
      url === "/notifications/unread-count"
        ? Promise.resolve({ data: counts })
        : Promise.resolve({
            data: {
              items: [
                { id: "n1", type: "like", is_read: false },
                { id: "n2", type: "match", is_read: false },
              ],
            },
          }),
    );
    const deferredPost = deferred<unknown>();
    post.mockReturnValue(deferredPost.promise);
    const { result } = renderHook(() => useNotifications("all"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    get.mockClear();

    let pending!: Promise<void>;
    await act(async () => {
      pending = result.current[method](["n1", "n2"]);
    });
    expect(result.current.items).toEqual([]);

    await act(async () => {
      deferredPost.resolve({ data: { updated: 2 } });
      await pending;
    });
    expect(post).toHaveBeenCalledWith("/notifications/bulk", {
      ids: ["n1", "n2"],
      action,
    });
    expect(get).toHaveBeenCalledWith("/notifications", {
      params: { filter: "all", limit: 50 },
    });
  },
);

it("marks a bulk selection as read without removing the items", async () => {
  let marked = false;
  get.mockImplementation((url: string) =>
    url === "/notifications/unread-count"
      ? Promise.resolve({ data: counts })
      : Promise.resolve({
          data: {
            items: [
              { id: "n1", type: "like", is_read: marked },
              { id: "n2", type: "match", is_read: marked },
            ],
          },
        }),
  );
  post.mockImplementation(() => {
    marked = true;
    return Promise.resolve({ data: { updated: 2 } });
  });
  const { result } = renderHook(() => useNotifications("all"));
  await waitFor(() => expect(result.current.loading).toBe(false));

  await act(() => result.current.bulkMarkRead(["n1", "n2"]));

  expect(post).toHaveBeenCalledWith("/notifications/bulk", {
    ids: ["n1", "n2"],
    action: "read",
  });
  expect(result.current.items).toHaveLength(2);
  expect(result.current.items.every((item) => item.is_read)).toBe(true);
});

it.each(["archive", "unarchive", "restore"] as const)(
  "%s calls the endpoint, removes the item optimistically and refreshes",
  async (action) => {
    get.mockImplementation((url: string) =>
      url === "/notifications/unread-count"
        ? Promise.resolve({ data: counts })
        : Promise.resolve({
            data: { items: [{ id: "n1", type: "like", is_read: false }] },
          }),
    );
    const deferredPost = deferred<unknown>();
    post.mockReturnValue(deferredPost.promise);
    const { result } = renderHook(() => useNotifications("all"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toHaveLength(1);
    get.mockClear();

    let pending!: Promise<void>;
    await act(async () => {
      pending = (
        result.current as unknown as Record<
          string,
          (id: string) => Promise<void>
        >
      )[action]("n1");
    });
    expect(result.current.items).toEqual([]);

    await act(async () => {
      deferredPost.resolve({ data: {} });
      await pending;
    });
    expect(post).toHaveBeenCalledWith(`/notifications/n1/${action}`);
    expect(get).toHaveBeenCalledWith("/notifications", {
      params: { filter: "all", limit: 50 },
    });
  },
);

it("removes a notification with delete, optimistically and with refresh", async () => {
  get.mockImplementation((url: string) =>
    url === "/notifications/unread-count"
      ? Promise.resolve({ data: counts })
      : Promise.resolve({
          data: { items: [{ id: "n1", type: "like", is_read: false }] },
        }),
  );
  const deferredDelete = deferred<unknown>();
  del.mockReturnValue(deferredDelete.promise);
  const { result } = renderHook(() => useNotifications("all"));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.items).toHaveLength(1);
  get.mockClear();

  let pending!: Promise<void>;
  await act(async () => {
    pending = result.current.remove("n1");
  });
  expect(result.current.items).toEqual([]);

  await act(async () => {
    deferredDelete.resolve({ data: {} });
    await pending;
  });
  expect(del).toHaveBeenCalledWith("/notifications/n1");
  expect(get).toHaveBeenCalledWith("/notifications", {
    params: { filter: "all", limit: 50 },
  });
});

it.each(["30m", "4h", "1d"] as const)(
  "snoozes for %s optimistically, POSTs {duration} and refreshes",
  async (duration) => {
    get.mockImplementation((url: string) =>
      url === "/notifications/unread-count"
        ? Promise.resolve({ data: counts })
        : Promise.resolve({
            data: { items: [{ id: "n1", type: "like", is_read: false }] },
          }),
    );
    const deferredPost = deferred<unknown>();
    post.mockReturnValue(deferredPost.promise);
    const { result } = renderHook(() => useNotifications("all"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toHaveLength(1);
    get.mockClear();

    let pending!: Promise<void>;
    await act(async () => {
      pending = result.current.snooze("n1", duration);
    });
    expect(result.current.items).toEqual([]);

    await act(async () => {
      deferredPost.resolve({ data: {} });
      await pending;
    });
    expect(post).toHaveBeenCalledWith("/notifications/n1/snooze", {
      duration,
    });
    expect(get).toHaveBeenCalledWith("/notifications", {
      params: { filter: "all", limit: 50 },
    });
  },
);

it("unsnoozes a notification and refreshes", async () => {
  get.mockImplementation((url: string) =>
    url === "/notifications/unread-count"
      ? Promise.resolve({ data: counts })
      : Promise.resolve({
          data: { items: [], next_cursor: null },
        }),
  );
  const deferredPost = deferred<unknown>();
  post.mockReturnValue(deferredPost.promise);
  const { result } = renderHook(() => useNotifications("all"));
  await waitFor(() => expect(result.current.loading).toBe(false));
  get.mockClear();

  let pending!: Promise<void>;
  await act(async () => {
    pending = result.current.unsnooze("n1");
  });

  await act(async () => {
    deferredPost.resolve({ data: {} });
    await pending;
  });
  expect(post).toHaveBeenCalledWith("/notifications/n1/unsnooze");
  expect(get).toHaveBeenCalledWith("/notifications", {
    params: { filter: "all", limit: 50 },
  });
});

it("pauses notifications with a preset and stores the deadline", async () => {
  const until = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  post.mockResolvedValue({ data: { paused_until: until } });
  const { result } = renderHook(() => useNotifications("all"));
  await waitFor(() => expect(result.current.loading).toBe(false));

  await act(() => result.current.pause("1h"));

  expect(post).toHaveBeenCalledWith("/notifications/pause", {
    duration: "1h",
  });
  expect(result.current.pausedUntil).toBe(until);
});

it("pauses until an explicit time", async () => {
  const until = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  post.mockResolvedValue({ data: { paused_until: until } });
  const { result } = renderHook(() => useNotifications("all"));
  await waitFor(() => expect(result.current.loading).toBe(false));

  await act(() => result.current.pause(undefined, until));

  expect(post).toHaveBeenCalledWith("/notifications/pause", { until });
  expect(result.current.pausedUntil).toBe(until);
});

it("resumes notifications and rehydrates the inbox", async () => {
  let resumed = false;
  del.mockImplementation(async () => {
    resumed = true;
    return { data: {} };
  });
  get.mockImplementation((url: string) => {
    if (url === "/notifications/unread-count")
      return Promise.resolve({
        data: resumed ? { ...counts, count: 1 } : counts,
      });
    return Promise.resolve({
      data: {
        items: resumed
          ? [
              {
                id: "n1",
                type: "like",
                is_read: false,
                created_at: "2026-01-01T00:00:00Z",
              },
            ]
          : [],
        next_cursor: null,
      },
    });
  });
  const { result } = renderHook(() => useNotifications("all"));
  await waitFor(() => expect(result.current.loading).toBe(false));
  get.mockClear();

  await act(() => result.current.resume());

  expect(del).toHaveBeenCalledWith("/notifications/pause");
  expect(get).toHaveBeenCalledWith("/notifications", {
    params: { filter: "all", limit: 50 },
  });
  expect(get).toHaveBeenCalledWith("/notifications/unread-count");
  expect(result.current.items.map((item) => item.id)).toEqual(["n1"]);
  expect(result.current.counts.count).toBe(1);
  expect(result.current.pausedUntil).toBeNull();
});

it("saves a recurring pause schedule", async () => {
  const rule = {
    id: "r1",
    name: "Horario laboral",
    days: [0, 1],
    start: "18:00",
    end: "08:00",
    allow: ["message"],
    timezone: "Europe/Madrid",
    utc_offset_minutes: 120,
  };
  post.mockResolvedValue({
    data: { pause_schedule: [rule], paused_until: null, active_pauses: [] },
  });
  const { result } = renderHook(() => useNotifications("all"));
  await waitFor(() => expect(result.current.loading).toBe(false));

  await act(() => result.current.savePauseSchedule(rule));

  expect(post).toHaveBeenCalledWith("/notifications/pause/schedule", {
    mode: "recurring",
    id: "r1",
    name: "Horario laboral",
    days: [0, 1],
    start: "18:00",
    end: "08:00",
    timezone: rule.timezone,
    utc_offset_minutes: rule.utc_offset_minutes,
    allow: ["message"],
  });
  expect(result.current.pauseSchedule).toEqual([rule]);
});

it("saves a one-off pause window", async () => {
  post.mockResolvedValue({
    data: {
      pause_schedule: [],
      paused_until: "2030-01-01T20:00:00+00:00",
      pause_window: {
        start: "2030-01-01T18:00:00+00:00",
        end: "2030-01-01T20:00:00+00:00",
      },
      pause_allow: ["system"],
      active_pauses: [],
    },
  });
  const { result } = renderHook(() => useNotifications("all"));
  await waitFor(() => expect(result.current.loading).toBe(false));

  await act(() =>
    result.current.savePauseWindow({
      from: "2030-01-01T18:00:00Z",
      to: "2030-01-01T20:00:00Z",
      allow: ["system"],
    }),
  );

  expect(post).toHaveBeenCalledWith("/notifications/pause/schedule", {
    mode: "single",
    from: "2030-01-01T18:00:00Z",
    to: "2030-01-01T20:00:00Z",
    allow: ["system"],
  });
  expect(result.current.pauseWindow?.end).toBe("2030-01-01T20:00:00+00:00");
});

it("removes a scheduled pause", async () => {
  del.mockResolvedValue({ data: { pause_schedule: [], paused_until: null } });
  const { result } = renderHook(() => useNotifications("all"));
  await waitFor(() => expect(result.current.loading).toBe(false));

  await act(() => result.current.removePauseSchedule("r1"));

  expect(del).toHaveBeenCalledWith("/notifications/pause/schedule/r1");
  expect(result.current.pauseSchedule).toEqual([]);
});

it("reads the pause schedule from the unread count", async () => {
  const schedule = [{ days: [0], start: "18:00", end: "08:00" }];
  get.mockImplementation((url: string) =>
    url === "/notifications/unread-count"
      ? Promise.resolve({ data: { ...counts, pause_schedule: schedule } })
      : Promise.resolve({ data: { items: [], next_cursor: null } }),
  );
  const { result } = renderHook(() => useNotifications("all"));
  await waitFor(() => expect(result.current.loading).toBe(false));

  expect(result.current.pauseSchedule).toEqual(schedule);
});

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

it("discards an older filter response that resolves after the latest one", async () => {
  const allList = deferred<any>();
  const socialList = deferred<any>();
  const allItems = [{ id: "a1", type: "like", is_read: false }];
  const socialItems = [{ id: "s1", type: "match", is_read: false }];
  const allCounts = {
    count: 9,
    all: 9,
    social: 9,
    messages: 0,
    system: 0,
    survey_pending: 0,
  };
  const socialCounts = {
    count: 1,
    all: 1,
    social: 1,
    messages: 0,
    system: 0,
    survey_pending: 0,
  };
  let countCalls = 0;

  get.mockImplementation(
    (url: string, config?: { params?: { filter?: string } }) => {
      if (url === "/notifications/unread-count") {
        countCalls += 1;
        return Promise.resolve({
          data: countCalls === 1 ? allCounts : socialCounts,
        });
      }
      return config?.params?.filter === "social"
        ? socialList.promise
        : allList.promise;
    },
  );

  const { result, rerender } = renderHook(
    ({ filter }: { filter: string }) => useNotifications(filter),
    { initialProps: { filter: "all" } },
  );

  await waitFor(() =>
    expect(get).toHaveBeenCalledWith("/notifications", {
      params: { filter: "all", limit: 50 },
    }),
  );

  rerender({ filter: "social" });
  await waitFor(() =>
    expect(get).toHaveBeenCalledWith("/notifications", {
      params: { filter: "social", limit: 50 },
    }),
  );

  await act(async () => {
    socialList.resolve({
      data: { items: socialItems, next_cursor: "social-cur" },
    });
  });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.items).toEqual(socialItems);
  expect(result.current.nextCursor).toBe("social-cur");
  expect(result.current.counts.all).toBe(1);

  await act(async () => {
    allList.resolve({ data: { items: allItems, next_cursor: "all-cur" } });
  });

  expect(result.current.items).toEqual(socialItems);
  expect(result.current.nextCursor).toBe("social-cur");
  expect(result.current.counts.all).toBe(1);
  expect(result.current.unreadCount).toBe(1);
  expect(result.current.loading).toBe(false);
});

it("keeps loading when an older response resolves before the latest one", async () => {
  const allList = deferred<any>();
  const socialList = deferred<any>();
  const allItems = [{ id: "a1", type: "like", is_read: false }];
  const socialItems = [{ id: "s1", type: "match", is_read: false }];

  get.mockImplementation(
    (url: string, config?: { params?: { filter?: string } }) => {
      if (url === "/notifications/unread-count")
        return Promise.resolve({ data: counts });
      return config?.params?.filter === "social"
        ? socialList.promise
        : allList.promise;
    },
  );

  const { result, rerender } = renderHook(
    ({ filter }: { filter: string }) => useNotifications(filter),
    { initialProps: { filter: "all" } },
  );

  await waitFor(() =>
    expect(get).toHaveBeenCalledWith("/notifications", {
      params: { filter: "all", limit: 50 },
    }),
  );

  rerender({ filter: "social" });
  await waitFor(() =>
    expect(get).toHaveBeenCalledWith("/notifications", {
      params: { filter: "social", limit: 50 },
    }),
  );

  await act(async () => {
    allList.resolve({ data: { items: allItems, next_cursor: "all-cur" } });
  });

  expect(result.current.items).toEqual([]);
  expect(result.current.nextCursor).toBeNull();
  expect(result.current.loading).toBe(true);

  await act(async () => {
    socialList.resolve({
      data: { items: socialItems, next_cursor: "social-cur" },
    });
  });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.items).toEqual(socialItems);
  expect(result.current.nextCursor).toBe("social-cur");
});

it("sorts pinned notifications first after fetching", async () => {
  get.mockImplementation((url: string) => {
    if (url === "/notifications/unread-count")
      return Promise.resolve({ data: counts });
    return Promise.resolve({
      data: {
        items: [
          { id: "new", type: "like", is_read: false, pinned_at: null },
          {
            id: "pinned",
            type: "match",
            is_read: false,
            pinned_at: "2026-01-01",
          },
        ],
      },
    });
  });
  const { result } = renderHook(() => useNotifications("all"));
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.items.map((item) => item.id)).toEqual([
    "pinned",
    "new",
  ]);
});

it("pins a notification and refreshes", async () => {
  post.mockResolvedValue({ data: {} });
  const { result } = renderHook(() => useNotifications("all"));
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(() => result.current.setPinned("n1", true));
  expect(post).toHaveBeenCalledWith("/notifications/n1/pin");
  expect(get).toHaveBeenCalledWith("/notifications", {
    params: { filter: "all", limit: 50 },
  });
});

it("unpins a notification", async () => {
  post.mockResolvedValue({ data: {} });
  const { result } = renderHook(() => useNotifications("all"));
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(() => result.current.setPinned("n1", false));
  expect(post).toHaveBeenCalledWith("/notifications/n1/unpin");
});

it("dismisses a reminder permanently", async () => {
  post.mockResolvedValue({ data: {} });
  const { result } = renderHook(() => useNotifications("all"));
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(() => result.current.dismissReminder("care_preferences"));
  expect(post).toHaveBeenCalledWith(
    "/notifications/reminders/care_preferences/dismiss",
    {},
  );
});

it("snoozes a reminder for a duration", async () => {
  post.mockResolvedValue({ data: {} });
  const { result } = renderHook(() => useNotifications("all"));
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(() => result.current.dismissReminder("care_preferences", "1d"));
  expect(post).toHaveBeenCalledWith(
    "/notifications/reminders/care_preferences/dismiss",
    { duration: "1d" },
  );
});

it("restores a reminder", async () => {
  del.mockResolvedValue({ data: {} });
  const { result } = renderHook(() => useNotifications("all"));
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(() => result.current.restoreReminder("care_preferences"));
  expect(del).toHaveBeenCalledWith("/notifications/reminders/care_preferences");
});
