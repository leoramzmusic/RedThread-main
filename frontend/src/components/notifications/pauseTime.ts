export interface PauseScheduleRule {
  days: number[];
  start: string;
  end: string;
  timezone?: string;
  utc_offset_minutes?: number;
}

export function formatRemaining(minutes: number): string {
  if (minutes >= 1440) {
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    return hours > 0 ? `${days} d ${hours} h` : `${days} d`;
  }
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest > 0 ? `${hours} h ${rest} min` : `${hours} h`;
  }
  return `${minutes} min`;
}

export function pauseRemaining(
  until: string | null | undefined,
  now: number = Date.now(),
): string | null {
  if (!until) return null;
  const target = new Date(until).getTime();
  if (Number.isNaN(target)) return null;
  const diff = target - now;
  if (diff <= 0) return null;
  return formatRemaining(Math.ceil(diff / 60000));
}

export function pauseDeadlineLabel(until: string): string {
  return new Date(until).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

export function weekdayLabels(locale: string): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(2026, 9, 19 + index, 12);
    return formatter.format(date);
  });
}

export function describePauseRule(
  rule: PauseScheduleRule,
  locale: string,
): string {
  const labels = weekdayLabels(locale);
  const days = rule.days.map((day) => labels[day] ?? String(day)).join(", ");
  return `${days} · ${rule.start}–${rule.end}`;
}
