import { renderHook } from "@testing-library/react";
import { usePauseExpiry } from "./usePauseExpiry";

describe("usePauseExpiry", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("fires just after the pause deadline", () => {
    const onExpire = jest.fn();
    renderHook(() =>
      usePauseExpiry(new Date(Date.now() + 60_000).toISOString(), onExpire),
    );

    jest.advanceTimersByTime(60_999);
    expect(onExpire).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it("does nothing without a pause", () => {
    const onExpire = jest.fn();
    renderHook(() => usePauseExpiry(null, onExpire));

    jest.advanceTimersByTime(120_000);

    expect(onExpire).not.toHaveBeenCalled();
  });

  it("reschedules when the deadline changes", () => {
    const onExpire = jest.fn();
    const first = new Date(Date.now() + 60_000).toISOString();
    const second = new Date(Date.now() + 120_000).toISOString();
    const { rerender } = renderHook(
      ({ until }) => usePauseExpiry(until, onExpire),
      { initialProps: { until: first } },
    );

    rerender({ until: second });
    jest.advanceTimersByTime(61_000);
    expect(onExpire).not.toHaveBeenCalled();
    jest.advanceTimersByTime(60_000);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });
});
