import {
  describePauseRule,
  formatDayRange,
  formatRemaining,
  parseInstant,
  pauseDeadlineLabel,
  pauseRemaining,
} from "./pauseTime";

describe("pauseRemaining", () => {
  const now = Date.parse("2026-10-21T18:00:00Z");

  it("counts the minutes left of an aware timestamp", () => {
    expect(pauseRemaining("2026-10-21T18:15:00+00:00", now)).toBe("15 min");
  });

  it("treats a naive timestamp as UTC", () => {
    expect(pauseRemaining("2026-10-21T18:15:00", now)).toBe("15 min");
  });

  it("ignores the local offset of the device", () => {
    expect(pauseRemaining("2026-10-21T20:15:00+02:00", now)).toBe("15 min");
  });

  it("formats hours and days", () => {
    expect(pauseRemaining("2026-10-21T19:30:00Z", now)).toBe("1 h 30 min");
    expect(pauseRemaining("2026-10-23T18:00:00Z", now)).toBe("2 d");
  });

  it("returns null when the pause is over or missing", () => {
    expect(pauseRemaining("2026-10-21T17:00:00Z", now)).toBeNull();
    expect(pauseRemaining(null, now)).toBeNull();
    expect(pauseRemaining("not-a-date", now)).toBeNull();
  });
});

describe("formatRemaining", () => {
  it("keeps minutes under an hour", () => {
    expect(formatRemaining(45)).toBe("45 min");
  });

  it("adds the minutes when there are hours", () => {
    expect(formatRemaining(90)).toBe("1 h 30 min");
    expect(formatRemaining(120)).toBe("2 h");
  });
});

describe("parseInstant", () => {
  it("adds the UTC marker to naive timestamps", () => {
    expect(parseInstant("2026-10-21T18:00:00")).toBe(
      Date.parse("2026-10-21T18:00:00Z"),
    );
  });

  it("keeps explicit offsets", () => {
    expect(parseInstant("2026-10-21T20:00:00+02:00")).toBe(
      Date.parse("2026-10-21T18:00:00Z"),
    );
  });
});

describe("pauseDeadlineLabel", () => {
  it("renders the wall clock time of the deadline", () => {
    expect(pauseDeadlineLabel("2026-10-21T18:30:00Z")).toMatch(/\d{2}:\d{2}/);
  });
});

describe("describePauseRule", () => {
  it("lists the days and the window", () => {
    const text = describePauseRule(
      { days: [0, 2], start: "18:00", end: "08:00" },
      "en",
    );
    expect(text).toContain("18:00 → 08:00");
    expect(text.split(", ")).toHaveLength(2);
  });

  it("uses a range for contiguous days", () => {
    expect(formatDayRange([0, 1, 2, 3, 4], "en")).toBe("Mon - Fri");
  });

  it("keeps every day of the week short", () => {
    expect(formatDayRange([0, 1, 2, 3, 4, 5, 6], "en")).toBe("Mon");
  });
});
