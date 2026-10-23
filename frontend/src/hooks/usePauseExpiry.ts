import { useEffect, useRef } from "react";

const MAX_TIMEOUT = 2_147_483_647;

export function usePauseExpiry(
  until: string | null | undefined,
  onExpire: () => void,
) {
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!until) return;
    const deadline = Date.parse(until);
    if (Number.isNaN(deadline)) return;

    const remaining = deadline - Date.now();
    const timer = setTimeout(
      () => onExpireRef.current(),
      Math.min(Math.max(remaining, 0) + 1000, MAX_TIMEOUT),
    );
    return () => clearTimeout(timer);
  }, [until]);
}
