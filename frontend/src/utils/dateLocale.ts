import {
  enUS,
  es,
  pt,
  fr,
  de,
  it,
  ru,
  sv,
  nl,
  zhCN,
  hi,
  bn,
  ja,
  ko,
  ar,
  ms,
} from "date-fns/locale";
import type { Locale } from "date-fns";

const MAP: Record<string, Locale> = {
  en: enUS,
  es,
  pt,
  fr,
  de,
  it,
  ru,
  sv,
  nl,
  zh: zhCN,
  hi,
  bn,
  ja,
  ko,
  ar,
  ms,
};

export function dateFnsLocale(lng: string): Locale {
  return MAP[lng] ?? enUS;
}
