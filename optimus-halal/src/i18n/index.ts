/**
 * i18n System - Internationalization
 */

import { fr, TranslationKeys } from "./translations/fr";
import { en } from "./translations/en";
import { ar } from "./translations/ar";

export type Language = "fr" | "en" | "ar" | "tr" | "it" | "de" | "es" | "pt" | "nl" | "pl" | "ru";

export const translations: Record<Language, TranslationKeys> = {
  fr,
  en,
  ar,
  // Fallback to English for languages not yet translated
  tr: en,
  it: en,
  de: en,
  es: en,
  pt: en,
  nl: en,
  pl: en,
  ru: en,
};

export const RTL_LANGUAGES: Language[] = ["ar"];

export const isRTL = (lang: Language): boolean => RTL_LANGUAGES.includes(lang);

export const getTranslation = (lang: Language): TranslationKeys => {
  return translations[lang] || translations.fr;
};

export { TranslationKeys };
