import type { TFunction } from "i18next";

export const LOCALES = [
  "en",
  "es",
  "pt",
  "fr",
  "de",
  "it",
  "ru",
  "sv",
  "nl",
  "zh",
  "hi",
  "bn",
  "ja",
  "ko",
  "ar",
  "sw",
  "ha",
  "am",
  "tl",
  "ms",
  "mi",
] as const;

export const NOTIFICATION_KEYS = [
  "notifications.title",
  "notifications.close",
  "notifications.retry",
  "notifications.markAllRead",
  "notifications.readAll",
  "notifications.selectMode",
  "notifications.error",
  "notifications.tabs.all",
  "notifications.tabs.likes",
  "notifications.tabs.chats",
  "notifications.tabs.system",
  "notifications.empty.all",
  "notifications.empty.likes",
  "notifications.empty.chats",
  "notifications.empty.system",
  "notifications.empty.archived",
  "notifications.empty.trash",
  "notifications.like.single",
  "notifications.like.superlike",
  "notifications.like.group_one",
  "notifications.like.group_other",
  "notifications.like.groupAll",
  "notifications.match.single",
  "notifications.message.single",
  "notifications.survey.title",
  "notifications.survey.pending_one",
  "notifications.survey.pending_other",
  "notifications.system.fallback",
  "notifications.promo.title",
  "notifications.actor.fallback",
  "notifications.actions.archive",
  "notifications.actions.unarchive",
  "notifications.actions.delete",
  "notifications.actions.snooze",
  "notifications.actions.undo",
  "notifications.actions.markRead",
  "notifications.bulk.selected",
  "notifications.bulk.selectAll",
  "notifications.bulk.archive",
  "notifications.bulk.delete",
  "notifications.bulk.restore",
  "notifications.bulk.cancel",
  "notifications.snooze.title",
  "notifications.snooze.15m",
  "notifications.snooze.30m",
  "notifications.snooze.1h",
  "notifications.snooze.4h",
  "notifications.snooze.2h",
  "notifications.snooze.8h",
  "notifications.snooze.1d",
  "notifications.snooze.always",
  "notifications.archived.title",
  "notifications.archived.open",
  "notifications.archived.back",
  "notifications.trash.title",
  "notifications.trash.open",
  "notifications.undo.archived",
  "notifications.undo.deleted",
  "notifications.undo.snoozed",
  "notifications.quickReply.placeholder",
  "notifications.quickReply.send",
  "notifications.expand.more",
  "notifications.expand.less",
] as const;

export function normalizeLocale(lng?: string): string {
  const base = (lng || "en").split("-")[0].toLowerCase();
  return (LOCALES as readonly string[]).includes(base) ? base : "en";
}

export function formatRelativeTime(
  iso: string,
  locale: string,
  now: number = Date.now(),
): string {
  const rtf = new Intl.RelativeTimeFormat(normalizeLocale(locale), {
    numeric: "auto",
  });
  const diff = new Date(iso).getTime() - now;
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000_000],
    ["month", 2_592_000_000],
    ["week", 604_800_000],
    ["day", 86_400_000],
    ["hour", 3_600_000],
    ["minute", 60_000],
    ["second", 1_000],
  ];
  for (const [unit, ms] of units) {
    if (Math.abs(diff) >= ms || unit === "second") {
      return rtf.format(Math.round(diff / ms), unit);
    }
  }
  return rtf.format(0, "second");
}

export function buildNotificationText(
  notification: any,
  t: TFunction,
  locale: string = "en",
): { title: string; body?: string; template: string } {
  const meta = notification.metadata || {};
  const template =
    meta.template || (notification.type === "message" ? "message" : "legacy");
  const name =
    notification.user?.name ||
    notification.actors?.[0]?.name ||
    t("notifications.actor.fallback");
  const lng = normalizeLocale(locale);
  const actors = Array.isArray(notification.actors) ? notification.actors : [];
  const hasActors = actors.length > 0;
  const hasActorIds = Array.isArray(meta.actor_ids)
    ? meta.actor_ids.length > 0
    : Boolean(meta.actor_ids);
  const isLegacy =
    !meta.template && !hasActorIds && !meta.last_actor_id && !hasActors;

  if (notification.type === "like") {
    if (meta.superlike) {
      return {
        title: t("notifications.like.superlike", { name }),
        template: "like.superlike",
      };
    }
    const count = notification.actor_count || 1;
    if (count > 1) {
      if (isLegacy && notification.content) {
        return { title: notification.content, template: "like.group" };
      }
      const shown = actors
        .slice(0, 3)
        .map((actor: any) => actor?.name)
        .filter(Boolean);
      const names = new Intl.ListFormat(lng, { type: "conjunction" }).format(
        shown,
      );
      if (shown.length >= count) {
        return {
          title: t("notifications.like.groupAll", { names }),
          template: "like.group",
        };
      }
      return {
        title: t("notifications.like.group", {
          names,
          count: count - shown.length,
        }),
        template: "like.group",
      };
    }
  }

  switch (notification.type) {
    case "like":
      return {
        title:
          isLegacy && notification.content
            ? notification.content
            : t("notifications.like.single", { name }),
        template: "like.single",
      };
    case "match":
      return {
        title:
          isLegacy && notification.content
            ? notification.content
            : t("notifications.match.single", { name }),
        template: "match",
      };
    case "message":
      return {
        title: t("notifications.message.single", { name }),
        body: meta.preview || notification.content,
        template: "message",
      };
    case "system":
      if (template === "system.survey" || meta.template === "system.survey") {
        const count = meta.params?.questions_pending ?? 1;
        return {
          title: t("notifications.survey.title"),
          body: t("notifications.survey.pending", { count }),
          template: "system.survey",
        };
      }
      return {
        title: notification.content || t("notifications.system.fallback"),
        template: "system.generic",
      };
    case "survey":
      return {
        title: t("notifications.survey.title"),
        body: t("notifications.survey.pending", {
          count: meta.params?.questions_pending ?? 1,
        }),
        template: "system.survey",
      };
    case "promo":
      return {
        title: notification.content || t("notifications.promo.title"),
        template: "promo",
      };
    default:
      return {
        title: notification.content || t("notifications.system.fallback"),
        template: "legacy",
      };
  }
}
