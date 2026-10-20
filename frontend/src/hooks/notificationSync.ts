const HANDLED = new Set([
  "new_notification",
  "notification_read",
  "notifications_read_all",
  "notifications_bucket_read",
  "notifications_sync",
  "new_message",
]);

export function applyNotificationSocketEvent(
  data: any,
  refetchCounts: () => void,
): boolean {
  if (!HANDLED.has(data?.action)) return false;
  refetchCounts();
  return true;
}
