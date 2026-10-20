import fs from "fs";
import path from "path";
import { LOCALES, NOTIFICATION_KEYS } from "./notificationText";

const read = (lng: string) =>
  JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), "public", "locales", lng, "common.json"),
      "utf8",
    ),
  );

const get = (obj: any, key: string) =>
  key.split(".").reduce((acc, part) => (acc == null ? acc : acc[part]), obj);

const flatten = (obj: any, prefix = ""): string[] =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object"
      ? flatten(v, `${prefix}${k}.`)
      : [`${prefix}${k}`],
  );

const placeholders = (value: string): string[] =>
  [
    ...new Set([...value.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1])),
  ].sort();

const enNotifications = read("en").notifications;
const enKeys = flatten(enNotifications);
const enKeySet = new Set(enKeys);

const isPluralVariantOfEnglish = (key: string): boolean => {
  const match = key.match(/^(.*)_(zero|one|two|few|many|other)$/);
  return Boolean(match && enKeySet.has(`${match[1]}_other`));
};

describe("notifications i18n completeness", () => {
  it.each(LOCALES)("%s has every notification key", (lng) => {
    for (const key of NOTIFICATION_KEYS) {
      const value = get(read(lng), key);
      expect(typeof value).toBe("string");
      expect((value as string).length).toBeGreaterThan(0);
    }
  });

  it.each(LOCALES)("%s has the same notifications key set as en", (lng) => {
    const localeKeys = new Set(flatten(read(lng).notifications));
    const missing = enKeys.filter((key) => !localeKeys.has(key));
    expect(missing).toEqual([]);

    const extras = [...localeKeys].filter((key) => !enKeySet.has(key));
    expect(extras.filter((key) => !isPluralVariantOfEnglish(key))).toEqual([]);
  });

  it.each(LOCALES)("%s preserves every placeholder from en", (lng) => {
    const notifications = read(lng).notifications;
    for (const shortKey of enKeys) {
      expect({
        key: shortKey,
        placeholders: placeholders(get(notifications, shortKey) as string),
      }).toEqual({
        key: shortKey,
        placeholders: placeholders(get(enNotifications, shortKey) as string),
      });
    }
  });
});
