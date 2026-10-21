import { applyNotificationSocketEvent } from "./notificationSync";

const ACTIONS = [
  "new_notification",
  "notification_read",
  "notifications_read_all",
  "notifications_bucket_read",
  "notifications_sync",
  "new_message",
];

const MUTATION_ACTIONS = [
  "notification_archived",
  "notification_unarchived",
  "notification_deleted",
  "notification_restored",
  "notification_snoozed",
  "notification_unsnoozed",
];

describe("applyNotificationSocketEvent", () => {
  it.each(ACTIONS)("refetches counts on %s", (action) => {
    const refetch = jest.fn();
    expect(applyNotificationSocketEvent({ action }, refetch)).toBe(true);
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it.each(MUTATION_ACTIONS)("refetches counts on %s", (action) => {
    const refetch = jest.fn();
    expect(applyNotificationSocketEvent({ action }, refetch)).toBe(true);
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("ignores unknown actions", () => {
    expect(applyNotificationSocketEvent({ action: "typing" }, jest.fn())).toBe(
      false,
    );
  });
});
