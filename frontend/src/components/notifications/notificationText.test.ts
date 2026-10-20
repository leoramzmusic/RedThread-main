import {
  buildNotificationText,
  formatRelativeTime,
  normalizeLocale,
} from "./notificationText";

const t = ((key: string, opts?: any) => {
  const map: Record<string, string> = {
    "notifications.like.single": "{{name}} liked your photo",
    "notifications.like.superlike": "{{name}} sent you a Super Like",
    "notifications.like.group": "{{names}} and {{count}} more liked your photo",
    "notifications.like.groupAll": "{{names}} liked your photo",
    "notifications.match.single": "It's a match with {{name}}!",
    "notifications.message.single": "New message from {{name}}",
    "notifications.survey.title": "CARE preferences",
    "notifications.survey.pending": "{{count}} questions left",
    "notifications.system.fallback": "Red Thread",
    "notifications.promo.title": "Update",
    "notifications.actor.fallback": "Someone",
  };
  const raw = map[key] ?? key;
  return raw.replace(/\{\{(\w+)\}\}/g, (_, k) => String(opts?.[k] ?? ""));
}) as any;

it("renders single like", () => {
  const out = buildNotificationText(
    { type: "like", metadata: {}, actor_count: 1, user: { name: "Ana" } },
    t,
    "en",
  );
  expect(out.title).toBe("Ana liked your photo");
});

it("renders grouped like with extras", () => {
  const out = buildNotificationText(
    {
      type: "like",
      metadata: {},
      actor_count: 5,
      actors: [{ name: "Ana" }, { name: "Bea" }],
    },
    t,
    "en",
  );
  expect(out.title).toBe("Ana and Bea and 3 more liked your photo");
});

it("uses preview for messages and does not translate it", () => {
  const out = buildNotificationText(
    {
      type: "message",
      metadata: { preview: "hola" },
      actor_count: 1,
      user: { name: "Ana" },
    },
    t,
    "es",
  );
  expect(out.body).toBe("hola");
});

it("falls back to legacy content", () => {
  const out = buildNotificationText(
    { type: "like", content: "texto viejo", metadata: {}, actor_count: 1 },
    t,
    "en",
  );
  expect(out.title).toBe("texto viejo");
});

it("uses i18n for a new like even when stored content is Spanish", () => {
  const out = buildNotificationText(
    {
      type: "like",
      content: "A Ana le gustó tu foto",
      metadata: { actor_ids: ["u-ana"] },
      actor_count: 1,
      user: { name: "Ana" },
    },
    t,
    "en",
  );
  expect(out.title).toBe("Ana liked your photo");
});

it("uses i18n for a new match even when stored content is Spanish", () => {
  const out = buildNotificationText(
    {
      type: "match",
      content: "¡Es un match con Ana!",
      metadata: { last_actor_id: "u-ana" },
      actor_count: 1,
      actors: [{ name: "Ana" }],
    },
    t,
    "en",
  );
  expect(out.title).toBe("It's a match with Ana!");
});

it("keeps admin content for system notifications", () => {
  const out = buildNotificationText(
    { type: "system", content: "Mantenimiento programado", metadata: {} },
    t,
    "en",
  );
  expect(out.title).toBe("Mantenimiento programado");
});

it("normalizes locales and formats relative time", () => {
  expect(normalizeLocale("es-MX")).toBe("es");
  expect(normalizeLocale("xx")).toBe("en");
  expect(
    formatRelativeTime(new Date(Date.now() - 3600_000).toISOString(), "es"),
  ).toMatch(/hace 1 hora/);
});
