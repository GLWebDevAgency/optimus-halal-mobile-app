/**
 * useTranslation Hook
 */

import { useCallback } from "react";
import { Alert, I18nManager } from "react-native";
import { useLanguageStore } from "@/store";
import { getTranslation, isRTL, type Language, type TranslationKeys } from "@/i18n";
import { setApiLanguage } from "@/services/api";
import { scaleFontForRTL } from "@/theme/typography";
import { reloadApp } from "@/utils/ota";

/**
 * Show a restart dialog when RTL direction changes.
 * `I18nManager.forceRTL` only takes effect after a full app restart,
 * so we prompt the user then restart automatically on confirm.
 */
function promptRTLRestartIfNeeded(newLang: Language): void {
  const isNewRTL = isRTL(newLang);
  const isCurrentRTL = I18nManager.isRTL;

  if (isNewRTL === isCurrentRTL) return;

  // Apply the RTL flags — they persist but only render after restart
  I18nManager.forceRTL(isNewRTL);
  I18nManager.allowRTL(isNewRTL);

  Alert.alert(
    isNewRTL ? "إعادة التشغيل مطلوبة" : "Redémarrage requis",
    isNewRTL
      ? "يجب إعادة تشغيل التطبيق لتطبيق اللغة العربية"
      : "L'application doit redémarrer pour appliquer le changement de langue",
    [
      {
        text: isNewRTL ? "إعادة التشغيل" : "Redémarrer",
        onPress: () => reloadApp(),
      },
      {
        text: isNewRTL ? "لاحقاً" : "Plus tard",
        style: "cancel",
      },
    ],
  );
}

export const useTranslation = () => {
  const language = useLanguageStore((state) => state.language);
  const setLanguageStore = useLanguageStore((state) => state.setLanguage);

  const setLanguage = (lang: Language) => {
    setLanguageStore(lang);
    setApiLanguage(lang); // Sync with API client
    promptRTLRestartIfNeeded(lang);
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
    promptRTLRestartIfNeeded(lang);
  };

  return { language, setLanguage };
};

export type { Language, TranslationKeys };
