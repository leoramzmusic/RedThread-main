export interface PauseScheduleRule {
  id?: string | null;
  name?: string;
  days: number[];
  start: string;
  end: string;
  timezone?: string;
  utc_offset_minutes?: number;
  allow?: string[];
}

export interface ActivePause {
  kind: "single" | "recurring";
  id: string | null;
  name: string;
  days: number[];
  start: string;
  end: string;
  until?: string | null;
  allow: string[];
}

export interface PauseException {
  key: string;
  types: string[];
}

export const PAUSE_EXCEPTIONS: PauseException[] = [
  { key: "chats", types: ["message"] },
  { key: "system", types: ["system", "survey"] },
  { key: "likes", types: ["like", "match"] },
  { key: "recommendations", types: ["promo"] },
  { key: "comments", types: ["comment"] },
];

const HAS_TIMEZONE = /(Z|[+-]\d{2}:?\d{2})$/i;

export function parseInstant(value: string): number {
  const raw = value.trim();
  const normalized = HAS_TIMEZONE.test(raw) ? raw : `${raw}Z`;
  return new Date(normalized).getTime();
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
  const target = parseInstant(until);
  if (Number.isNaN(target)) return null;
  const diff = target - now;
  if (diff <= 0) return null;
  return formatRemaining(Math.ceil(diff / 60000));
}

export function pauseDeadlineLabel(until: string): string {
  return new Date(parseInstant(until)).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

function referenceDate(index: number): Date {
  return new Date(2026, 9, 19 + index, 12);
}

export function weekdayLabels(locale: string): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
  return Array.from({ length: 7 }, (_, index) =>
    formatter.format(referenceDate(index)),
  );
}

export function weekdayNames(locale: string): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: "long" });
  return Array.from({ length: 7 }, (_, index) =>
    formatter.format(referenceDate(index)),
  );
}

export function isContiguousRange(days: number[]): boolean {
  if (days.length < 2) return false;
  const sorted = [...days].sort((a, b) => a - b);
  return sorted.every(
    (day, index) => index === 0 || day === sorted[index - 1] + 1,
  );
}

export function formatDayRange(days: number[], locale: string): string {
  const labels = weekdayLabels(locale);
  if (days.length === 0) return "";
  const sorted = [...days].sort((a, b) => a - b);
  if (isContiguousRange(sorted)) {
    if (sorted.length === 7) return labels[0];
    return `${labels[sorted[0]]} - ${labels[sorted[sorted.length - 1]]}`;
  }
  return sorted.map((day) => labels[day]).join(", ");
}

export function formatDayList(days: number[], locale: string): string {
  const names = weekdayNames(locale);
  return [...days]
    .sort((a, b) => a - b)
    .map((day) => names[day] ?? String(day))
    .join(", ");
}

export function describePauseRule(
  rule: Pick<PauseScheduleRule, "days" | "start" | "end">,
  locale: string,
): string {
  return `${formatDayRange(rule.days, locale)} · ${rule.start} → ${rule.end}`;
}
