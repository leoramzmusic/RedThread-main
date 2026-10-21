export function pauseRemaining(
  until: string | null | undefined,
  now: number = Date.now(),
): string | null {
  if (!until) return null;
  const target = new Date(until).getTime();
  if (Number.isNaN(target)) return null;
  const diff = target - now;
  if (diff <= 0) return null;

  const minutes = Math.ceil(diff / 60000);
  if (minutes >= 1440) {
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest > 0 ? `${hours}h ${rest}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

export function pauseDeadlineLabel(until: string): string {
  return new Date(until).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}
