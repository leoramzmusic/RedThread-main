import {
  priorityForNotification,
  quickActionForNotification,
} from "./notificationPriority";

const base = {
  type: "like",
  is_read: false,
  metadata: {},
};

describe("priorityForNotification", () => {
  it("marks important metadata as critical", () => {
    expect(
      priorityForNotification({
        ...base,
        type: "system",
        metadata: { important: true },
      }),
    ).toBe("P0");
  });

  it("treats security notifications as critical", () => {
    expect(priorityForNotification({ ...base, type: "security" })).toBe("P0");
  });

  it("marks action-required notifications", () => {
    expect(priorityForNotification({ ...base, type: "message" })).toBe("P1");
    expect(priorityForNotification({ ...base, type: "survey" })).toBe("P1");
    expect(priorityForNotification({ ...base, type: "match" })).toBe("P1");
  });

  it("marks informational notifications", () => {
    expect(priorityForNotification({ ...base, type: "like" })).toBe("P2");
    expect(priorityForNotification({ ...base, type: "system" })).toBe("P2");
  });

  it("marks promos and unknown types as passive", () => {
    expect(priorityForNotification({ ...base, type: "promo" })).toBe("P3");
    expect(priorityForNotification({ ...base, type: "something-new" })).toBe(
      "P3",
    );
  });
});

describe("quickActionForNotification", () => {
  it("marks unread social and messages as read", () => {
    expect(quickActionForNotification({ ...base, type: "like" })).toBe(
      "markRead",
    );
    expect(quickActionForNotification({ ...base, type: "message" })).toBe(
      "markRead",
    );
  });

  it("archives read social and messages", () => {
    expect(
      quickActionForNotification({ ...base, type: "like", is_read: true }),
    ).toBe("archive");
    expect(
      quickActionForNotification({ ...base, type: "message", is_read: true }),
    ).toBe("archive");
  });

  it("archives system and promo notifications", () => {
    expect(quickActionForNotification({ ...base, type: "system" })).toBe(
      "archive",
    );
    expect(quickActionForNotification({ ...base, type: "promo" })).toBe(
      "archive",
    );
  });

  it("acknowledges critical notifications instead of archiving them", () => {
    expect(
      quickActionForNotification({
        ...base,
        type: "system",
        metadata: { important: true },
      }),
    ).toBe("markRead");
  });
});
