/**
 * useTranslation Hook
 */

import { useCallback } from "react";
import { useLanguageStore } from "@/store";
import { getTranslation, isRTL, type Language, type TranslationKeys } from "@/i18n";
import { setApiLanguage } from "@/services/api";
import { scaleFontForRTL } from "@/theme/typography";

export const useTranslation = () => {
  const language = useLanguageStore((state) => state.language);
  const setLanguageStore = useLanguageStore((state) => state.setLanguage);

  const setLanguage = (lang: Language) => {
    setLanguageStore(lang);
    setApiLanguage(lang); // Sync with API client
  };

  const t = getTranslation(language);
  const rtl = isRTL(language);

  /** Scale a font size for Arabic readability (12% larger when RTL). */
  const scaleFont = useCallback(
    (size: number) => scaleFontForRTL(size, rtl),
    [rtl],
  );

  return {
    t,
    language,
    setLanguage,
    isRTL: rtl,
    scaleFont,
  };
};

/**
 * Convenience hook for language only
 */
export const useLanguage = () => {
  const language = useLanguageStore((state) => state.language);
  const setLanguageStore = useLanguageStore((state) => state.setLanguage);
  
  const setLanguage = (lang: Language) => {
    setLanguageStore(lang);
    setApiLanguage(lang);
  };
  
  return { language, setLanguage };
};

export type { Language, TranslationKeys };
