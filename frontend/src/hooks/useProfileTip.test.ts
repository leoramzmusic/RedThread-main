import { renderHook } from "@testing-library/react";
import { useProfileTip } from "./useProfileTip";
test("returns loading initially", () => {
  const { result } = renderHook(() => useProfileTip("photos_visual"));
  expect(result.current.loading).toBe(true);
});
