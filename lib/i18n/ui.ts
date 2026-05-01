import type { Language } from "@/lib/supabase/types";
import am from "@/lib/i18n/am";
import en from "@/lib/i18n/en";
import om from "@/lib/i18n/om";
import ti from "@/lib/i18n/ti";
import type { UiKey } from "@/lib/i18n/types";

const UI_STRINGS: Record<Language, Record<UiKey, string>> = {
  en,
  am,
  om,
  ti,
};

export function tUi(language: Language | null | undefined, key: UiKey): string {
  const lang = language ?? "en";
  return UI_STRINGS[lang]?.[key] ?? UI_STRINGS.en[key];
}
