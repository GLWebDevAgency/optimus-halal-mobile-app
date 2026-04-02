/**
 * useTheme Hook
 *
 * Gere le theme de l'application (light/dark/system)
 * avec support du mode automatique base sur les preferences systeme.
 *
 * All color values are sourced from `@/theme/colors` (single source of truth).
 * The public API (isDark, colors, themeLabels, themeIcons, etc.) is unchanged
 * so existing consumers require zero modifications.
 */

import { useMemo } from "react";
import { useColorScheme } from "react-native";
import { useThemeStore } from "@/store";
import {
  gold,
  lightTheme,
  darkTheme,
  ramadan as ramadanColors,
  gradients,
} from "@/theme/colors";
import { useRamadanMode } from "./useRamadanMode";

export type ThemeMode = "light" | "dark" | "system";

export const useTheme = () => {
  const systemColorScheme = useColorScheme();
  const { theme, setTheme } = useThemeStore();
  const { isRamadan } = useRamadanMode();

  // Effective theme: Appearance.setColorScheme() syncs the native runtime,
  // so useColorScheme() always returns the correct resolved value.
  // For "system", we read the OS preference; for explicit choice, use it directly.
  const effectiveTheme: "light" | "dark" =
    theme === "system"
      ? (systemColorScheme ?? "dark")
      : theme;

  const isDark = effectiveTheme === "dark";
  const isLight = effectiveTheme === "light";

  // Resolve the current contextual palette
  const t = isDark ? darkTheme : lightTheme;

  // Couleurs selon le theme — memoized to avoid re-renders downstream
  const colors = useMemo(() => ({
    // Backgrounds
    background: isRamadan && isDark ? ramadanColors.warmBlack : t.background,
    backgroundSecondary: t.backgroundSecondary,
    card: t.card,
    cardBorder: t.cardBorder,

    // Text
    textPrimary: t.textPrimary,
    textSecondary: t.textSecondary,
    textMuted: t.textMuted,

    // Primary — gold in both modes, unified brand identity
    primary: isRamadan ? ramadanColors.gold : gold[500],
    primaryDark: isRamadan ? ramadanColors.indigo : "#CFA533",
    primaryLight: isRamadan
      ? ramadanColors.crescentGlow
      : isDark
        ? "rgba(207, 165, 51, 0.15)"
        : "rgba(212, 175, 55, 0.12)",

    // Status colors (unchanged — halal verdicts should stay consistent)
    statusExcellent: t.statusExcellent,
    statusExcellentBg: t.statusExcellentBg,
    statusBon: t.statusBon,
    statusBonBg: t.statusBonBg,
    statusMoyen: t.statusMoyen,
    statusMoyenBg: t.statusMoyenBg,
    statusMauvais: t.statusMauvais,
    statusMauvaisBg: t.statusMauvaisBg,

    // UI elements
    border: t.border,
    borderLight: t.borderLight,
    overlay: t.overlay,

    // Button backgrounds
    buttonPrimary: isRamadan ? ramadanColors.gold : gold[500],
    buttonSecondary: t.buttonSecondary,
    buttonSecondaryHover: t.buttonSecondaryHover,

    // Icon colors
    iconPrimary: t.iconPrimary,
    iconSecondary: t.iconSecondary,
  }), [isDark, isRamadan, t]);

  // Hero gradient shifts during Ramadan
  const heroGradient = useMemo(() =>
    isRamadan
      ? (isDark ? gradients.ramadanDark : gradients.ramadanLight)
      : (isDark ? gradients.heroDark : gradients.heroLight),
    [isDark, isRamadan],
  );

  // Primary CTA gradient — gold in both modes
  const primaryGradient = useMemo(() =>
    isRamadan
      ? gradients.ramadanPrimary
      : (["#FDE08B", "#CFA533"] as const),
    [isRamadan],
  );

  // Labels pour les options de theme
  const themeLabels = {
    system: "Automatique",
    light: "Clair",
    dark: "Sombre",
  };

  // Icones pour les options de theme
  const themeIcons = {
    system: "brightness-auto" as const,
    light: "light-mode" as const,
    dark: "dark-mode" as const,
  };

  return {
    theme,
    setTheme,
    effectiveTheme,
    isDark,
    isLight,
    isRamadan,
    colors,
    heroGradient,
    primaryGradient,
    themeLabels,
    themeIcons,
  };
};

export default useTheme;
