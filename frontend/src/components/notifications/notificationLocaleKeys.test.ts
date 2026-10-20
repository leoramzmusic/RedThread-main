import fs from "fs";
import path from "path";

const LOCALES = [
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
];
const read = (lng: string) =>
  JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), "public", "locales", lng, "common.json"),
      "utf8",
    ),
  );

const flatten = (obj: any, prefix = ""): string[] =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object"
      ? flatten(v, `${prefix}${k}.`)
      : [`${prefix}${k}`],
  );

const en = new Set(flatten(read("en").notifications));

describe("notifications locale keys", () => {
  it.each(LOCALES)("%s has every en key", (lng) => {
    const keys = new Set(flatten(read(lng).notifications));
    expect([...en].filter((key) => !keys.has(key))).toEqual([]);
  });
  it("en has core keys", () => {
    expect(en.has("tabs.likes")).toBe(true);
    expect(en.has("like.single")).toBe(true);
    expect(en.has("survey.pending_other")).toBe(true);
  });
});
