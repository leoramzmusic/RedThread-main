import { categoryForType } from "./notificationCategory";

export type NotificationPriority = "P0" | "P1" | "P2" | "P3";
export type QuickAction = "markRead" | "archive";

interface PriorityInput {
  type: string;
  is_read?: boolean;
  metadata?: Record<string, unknown> | null;
}

export function priorityForNotification(
  notification: PriorityInput,
): NotificationPriority {
  const metadata = notification.metadata || {};
  if (metadata.important || notification.type === "security") return "P0";
  switch (notification.type) {
    case "message":
    case "survey":
    case "match":
      return "P1";
    case "like":
    case "system":
      return "P2";
    case "promo":
      return "P3";
    default:
      return "P3";
  }
}

export function quickActionForNotification(
  notification: PriorityInput,
): QuickAction {
  if (priorityForNotification(notification) === "P0") return "markRead";
  const category = categoryForType(notification.type);
  if (category === "system") return "archive";
  return notification.is_read ? "archive" : "markRead";
}
