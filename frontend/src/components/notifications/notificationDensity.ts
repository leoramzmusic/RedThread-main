export type NotificationDensity = "empty" | "sparse" | "standard" | "dense";

export function densityForCount(count: number): NotificationDensity {
  if (count <= 0) return "empty";
  if (count <= 2) return "sparse";
  if (count <= 12) return "standard";
  return "dense";
}
