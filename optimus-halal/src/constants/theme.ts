/**
 * Naqiy — Design System Theme Configuration
 * 
 * Ce fichier centralise toutes les valeurs du design system
 * basé sur les écrans HTML de référence.
 */

export const colors = {
  // Light mode colors
  light: {
    primary: "#1de560",
    background: "#f6f8f6",
    surface: "#ffffff",
    card: "#ffffff",
    text: "#0d1b13",
    textSecondary: "#4b5563",
    border: "#e2e8f0",
  },
  // Dark mode colors
  dark: {
    primary: "#1de560",
    background: "#102216",
    surface: "#1e293b",
    card: "#1e293b",
    text: "#ffffff",
    textSecondary: "#94a3b8",
    border: "#334155",
  },
  // Primary Colors - Emerald Green
  primary: {
    DEFAULT: "#1de560",
    50: "#edfff4",
    100: "#d5ffe6",
    200: "#aeffd0",
    300: "#70ffad",
    400: "#2bee6c",
    500: "#1de560",
    600: "#0fb350",
    700: "#0ea35c",
    800: "#0f7f49",
    900: "#10683f",
    950: "#023a21",
  },
  // Gold Accent
  gold: {
    DEFAULT: "#D4AF37",
    50: "#fefce8",
    100: "#fef9c3",
    200: "#fef08a",
    300: "#fde047",
    400: "#fbbf24",
    500: "#D4AF37",
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
  },
  // Background Colors
  background: {
    light: "#f6f8f6",
    dark: "#102216",
  },
  // Surface Colors
  surface: {
    light: "#ffffff",
    dark: "#1e293b",
  },
  // Card Colors
  card: {
    light: "#ffffff",
    dark: "#1e293b",
  },
  // Text Colors
  text: {
    main: "#0d1b13",
    mainDark: "#ffffff",
    secondary: "#4b5563",
    secondaryDark: "#94a3b8",
  },
  // Status Colors
  success: {
    DEFAULT: "#10b981",
    light: "#d1fae5",
    dark: "#065f46",
  },
  warning: {
    DEFAULT: "#f59e0b",
    light: "#fef3c7",
    dark: "#92400e",
  },
  danger: {
    DEFAULT: "#ef4444",
    light: "#fee2e2",
    dark: "#991b1b",
  },
  // Slate colors for UI elements
  slate: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
    950: "#020617",
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  "6xl": 64,
} as const;

export const borderRadius = {
  none: 0,
  sm: 4,
  DEFAULT: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  full: 9999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
  "5xl": 48,
} as const;

export const fontWeight = {
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  extrabold: "800",
} as const;

export const shadows = {
  soft: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  softDark: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  glow: {
    shadowColor: colors.primary.DEFAULT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 4,
  },
  float: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
} as const;

export const theme = {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  shadows,
} as const;

export type Theme = typeof theme;
export type ColorScheme = "light" | "dark";
