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
