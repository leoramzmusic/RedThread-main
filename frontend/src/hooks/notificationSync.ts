const HANDLED = new Set([
  "new_notification",
  "notification_read",
  "notifications_read_all",
  "notifications_bucket_read",
  "notifications_sync",
  "new_message",
  "notification_archived",
  "notification_unarchived",
  "notification_deleted",
  "notification_restored",
  "notification_snoozed",
  "notification_unsnoozed",
]);

export function applyNotificationSocketEvent(
  data: any,
  refetchCounts: () => void,
): boolean {
  if (!HANDLED.has(data?.action)) return false;
  refetchCounts();
  return true;
}
