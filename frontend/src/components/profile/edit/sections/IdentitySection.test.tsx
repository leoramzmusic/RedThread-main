import { render, screen, fireEvent, within } from "@testing-library/react";
import { useForm } from "react-hook-form";
import fs from "fs";
import path from "path";
import IdentitySection, { normOptKey } from "./IdentitySection";
import {
  ATTRACTION_ORIENTATION_OPTIONS,
  supportedOrientations,
} from "../../../../constants/profileOptions";

jest.mock("next-i18next/pages", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: unknown) =>
      typeof fallback === "string" ? fallback : key,
    i18n: { language: "es" },
  }),
}));

const LANGS = [
  "am", "ar", "bn", "de", "en", "es", "fr", "ha", "hi", "it", "ja",
  "ko", "mi", "ms", "nl", "pt", "ru", "sv", "sw", "tl", "zh",
];

function Harness() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { control, setValue, watch } = useForm<any>({
    defaultValues: {
      gender: "",
      sexual_orientation: "",
      attraction_preferences: [],
      orientation_preferences: [],
    },
  });
  return (
    <IdentitySection
      control={control}
      setValue={setValue}
      watch={watch}
      options={{ sexual_orientation: [] }}
    />
  );
}

function orientationCombo() {
  const label = screen.getByText(/^Orientación sexual$/, { selector: "label" });
  const formControl = label.closest(".MuiFormControl-root") as HTMLElement;
  return within(formControl).getByRole("combobox");
}

function readLocale(lang: string) {
  const file = path.resolve(
    process.cwd(),
    "public",
    "locales",
    lang,
    "common.json",
  );
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function findOrientOpt(
  node: unknown,
): Record<string, { label?: string; desc?: string }> | null {
  if (node && typeof node === "object") {
    const rec = node as Record<string, unknown>;
    if (rec.orientOpt && typeof rec.orientOpt === "object") {
      return rec.orientOpt as Record<string, { label?: string; desc?: string }>;
    }
    for (const value of Object.values(rec)) {
      const found = findOrientOpt(value);
      if (found) return found;
    }
  }
  return null;
}

describe("IdentitySection sexual-orientation combo (fixed global list)", () => {
  it("renders every canonical orientation from supportedOrientations, ignoring the empty backend options", () => {
    render(<Harness />);
    expect(supportedOrientations).toHaveLength(9);

    fireEvent.mouseDown(orientationCombo());

    expect(screen.getAllByRole("option")).toHaveLength(9);
    expect(
      screen.getByRole("option", { name: "Heterosexual" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Homosexual" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Prefiero no decir" }),
    ).toBeInTheDocument();
  });
});

describe("orientation translations are synchronized across all 21 locales", () => {
  const orientValues = [...supportedOrientations];
  const orientOptKeys = ATTRACTION_ORIENTATION_OPTIONS.map((o) =>
    normOptKey(o.label),
  );

  it.each(LANGS)("%s exposes the full profile.orientations map", (lang) => {
    const orientations = readLocale(lang).profile?.orientations;
    expect(orientations).toBeTruthy();
    for (const value of orientValues) {
      expect(typeof orientations[value]).toBe("string");
      expect(orientations[value].trim().length).toBeGreaterThan(0);
    }
  });

  it.each(LANGS)(
    "%s has label and description for every orientation in orientOpt",
    (lang) => {
      const orientOpt = findOrientOpt(readLocale(lang));
      expect(orientOpt).not.toBeNull();
      for (const key of orientOptKeys) {
        expect(orientOpt?.[key]?.label).toBeTruthy();
        expect(orientOpt?.[key]?.desc).toBeTruthy();
      }
    },
  );
});
