import { act, renderHook, waitFor } from "@testing-library/react";
import apiClient from "../services/api";
import { useUnreadNotifications } from "./useUnreadNotifications";

jest.mock("../services/api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

const mockedGet = apiClient.get as jest.Mock;

describe("useUnreadNotifications", () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it("loads the unread count and the pause deadline", async () => {
    const pausedUntil = new Date(Date.now() + 60_000).toISOString();
    mockedGet.mockResolvedValue({
      data: { count: 4, paused_until: pausedUntil },
    });

    const { result } = renderHook(() => useUnreadNotifications(true));

    await waitFor(() => expect(result.current.unreadCount).toBe(4));
    expect(result.current.pausedUntil).toBe(pausedUntil);
  });

  it("refreshes the count when the pause window expires", async () => {
    jest.useFakeTimers();
    const pausedUntil = new Date(Date.now() + 60_000).toISOString();
    mockedGet.mockResolvedValue({
      data: { count: 4, paused_until: pausedUntil },
    });

    const { result } = renderHook(() => useUnreadNotifications(true));

    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.pausedUntil).toBe(pausedUntil);

    mockedGet.mockResolvedValue({ data: { count: 4, paused_until: null } });

    await act(async () => {
      jest.advanceTimersByTime(61_000);
      await Promise.resolve();
    });

    await waitFor(() => expect(result.current.pausedUntil).toBeNull());

    jest.useRealTimers();
  });

  it("does not fetch when the user is not authenticated", async () => {
    const { result } = renderHook(() => useUnreadNotifications(false));

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockedGet).not.toHaveBeenCalled();
    expect(result.current.unreadCount).toBe(0);
  });
});
