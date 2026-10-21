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

it.each(["1h", "always"] as const)(
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
