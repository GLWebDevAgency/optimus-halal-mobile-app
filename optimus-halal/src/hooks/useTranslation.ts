/**
 * useTranslation Hook
 */

import { useLanguageStore } from "@/store";
import { getTranslation, isRTL, type Language, type TranslationKeys } from "@/i18n";
import { setApiLanguage } from "@/services/api";

export const useTranslation = () => {
  const language = useLanguageStore((state) => state.language);
  const setLanguageStore = useLanguageStore((state) => state.setLanguage);
  
  const setLanguage = (lang: Language) => {
    setLanguageStore(lang);
    setApiLanguage(lang); // Sync with API client
  };
  
  const t = getTranslation(language);
  const rtl = isRTL(language);

  return {
    t,
    language,
    setLanguage,
    isRTL: rtl,
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
