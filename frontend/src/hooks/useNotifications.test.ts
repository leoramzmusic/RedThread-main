import { renderHook, waitFor, act } from "@testing-library/react";
import { useNotifications } from "./useNotifications";
import apiClient from "../services/api";

jest.mock("../services/api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));
const get = apiClient.get as jest.Mock;
const post = apiClient.post as jest.Mock;

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
