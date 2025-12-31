/**
 * useTheme Hook
 * 
 * Gère le thème de l'application (light/dark/system)
 * avec support du mode automatique basé sur les préférences système
 */

import { useColorScheme } from "react-native";
import { useThemeStore } from "@/store";

export type ThemeMode = "light" | "dark" | "system";

export const useTheme = () => {
  const systemColorScheme = useColorScheme();
  const { theme, setTheme } = useThemeStore();

  // Détermine le thème effectif (light ou dark)
  const effectiveTheme: "light" | "dark" = 
    theme === "system" 
      ? (systemColorScheme ?? "light") 
      : theme;

  const isDark = effectiveTheme === "dark";
  const isLight = effectiveTheme === "light";

  // Couleurs selon le thème
  const colors = {
    // Backgrounds
    background: isDark ? "#102217" : "#f6f8f7",
    backgroundSecondary: isDark ? "#0d1a12" : "#ffffff",
    card: isDark ? "#1a2e22" : "#ffffff",
    cardBorder: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
    
    // Text
    textPrimary: isDark ? "#e8f5e9" : "#0d1b13",
    textSecondary: isDark ? "#9ca3af" : "#4b5563",
    textMuted: isDark ? "#6b7280" : "#9ca3af",
    
    // Primary
    primary: "#13ec6a",
    primaryDark: "#0ea64b",
    primaryLight: isDark ? "rgba(19,236,106,0.15)" : "rgba(19,236,106,0.1)",
    
    // Status colors
    statusExcellent: isDark ? "#22c55e" : "#16a34a",
    statusExcellentBg: isDark ? "rgba(34,197,94,0.2)" : "rgba(22,163,74,0.15)",
    statusBon: isDark ? "#13ec6a" : "#0ea64b",
    statusBonBg: isDark ? "rgba(19,236,106,0.2)" : "rgba(14,166,75,0.15)",
    statusMoyen: isDark ? "#f97316" : "#ea580c",
    statusMoyenBg: isDark ? "rgba(249,115,22,0.2)" : "rgba(234,88,12,0.15)",
    statusMauvais: isDark ? "#ef4444" : "#dc2626",
    statusMauvaisBg: isDark ? "rgba(239,68,68,0.2)" : "rgba(220,38,38,0.15)",
    
    // UI elements
    border: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
    borderLight: isDark ? "rgba(255,255,255,0.05)" : "#e5e7eb",
    overlay: isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.3)",
    
    // Button backgrounds
    buttonPrimary: "#13ec6a",
    buttonSecondary: isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6",
    buttonSecondaryHover: isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb",
    
    // Icon colors
    iconPrimary: isDark ? "#e8f5e9" : "#0d1b13",
    iconSecondary: isDark ? "#9ca3af" : "#6b7280",
  };

  // Labels pour les options de thème
  const themeLabels = {
    system: "Automatique",
    light: "Clair",
    dark: "Sombre",
  };

  // Icônes pour les options de thème
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
    colors,
    themeLabels,
    themeIcons,
  };
};

export default useTheme;
