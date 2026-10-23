export type NotificationCategory = "social" | "messages" | "system";

export function categoryForType(type: string): NotificationCategory {
  if (type === "message") return "messages";
  if (type === "like" || type === "match") return "social";
  return "system";
}
