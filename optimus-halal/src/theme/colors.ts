/**
 * Optimus Halal Design System — Color Tokens
 *
 * Single source of truth for every color in the application.
 * All screens, components, and hooks MUST reference these tokens.
 *
 * Design philosophy:
 *  - Primary green (#13ec6a) is ELECTRIC and ALIVE
 *  - Dark mode = "deep forest" (green-tinted blacks, not gray)
 *  - Light mode = "clean and warm" (not sterile white)
 *  - Gold (#D4AF37) for premium / gamification accents
 *
 * @module theme/colors
 */

// ---------------------------------------------------------------------------
// Primitive Palette — Primary Green
// ---------------------------------------------------------------------------

/** Full 11-step palette generated from the hero green #13ec6a. */
export const primary = {
  50: "#eafff3",
  100: "#c9ffe2",
  200: "#96ffc7",
  300: "#55f9a4",
  400: "#22ee7e",
  500: "#13ec6a",
  600: "#08c454",
  700: "#099a44",
  800: "#0d7939",
  900: "#0c6231",
  950: "#013719",
} as const;

// ---------------------------------------------------------------------------
// Primitive Palette — Gold Accent
// ---------------------------------------------------------------------------

/** Full 11-step palette for the premium gold accent #D4AF37. */
export const gold = {
  50: "#fdf9e8",
  100: "#faf0c3",
  200: "#f6e18a",
  300: "#f0cc47",
  400: "#e8b824",
  500: "#D4AF37",
  600: "#c08a18",
  700: "#9a6518",
  800: "#7f501b",
  900: "#6c421c",
  950: "#3f220c",
} as const;

// ---------------------------------------------------------------------------
// Primitive Palette — Neutral (warm gray with green undertone)
// ---------------------------------------------------------------------------

/** Warm neutrals that feel organic rather than sterile. */
export const neutral = {
  50: "#f8faf9",
  100: "#f0f4f1",
  200: "#dfe6e1",
  300: "#c4d0c8",
  400: "#9ca3af",
  500: "#6b7280",
  600: "#4b5563",
  700: "#374151",
  800: "#1f2937",
  900: "#111827",
  950: "#030712",
} as const;

// ---------------------------------------------------------------------------
// Semantic Colors
// ---------------------------------------------------------------------------

/** Semantic intent tokens. Each has a base, light (bg tint), and dark variant. */
export const semantic = {
  success: {
    base: "#22c55e",
    light: "#dcfce7",
    dark: "#166534",
  },
  warning: {
    base: "#f59e0b",
    light: "#fef3c7",
    dark: "#92400e",
  },
  danger: {
    base: "#ef4444",
    light: "#fee2e2",
    dark: "#991b1b",
  },
  info: {
    base: "#3b82f6",
    light: "#dbeafe",
    dark: "#1e40af",
  },
} as const;

// ---------------------------------------------------------------------------
// Halal Status Colors
// ---------------------------------------------------------------------------

/** Dedicated status tokens for product halal certification results. */
export const halalStatus = {
  halal: {
    base: "#22c55e",
    bg: "rgba(34, 197, 94, 0.15)",
    bgDark: "rgba(34, 197, 94, 0.20)",
  },
  haram: {
    base: "#ef4444",
    bg: "rgba(239, 68, 68, 0.15)",
    bgDark: "rgba(239, 68, 68, 0.20)",
  },
  doubtful: {
    base: "#f97316",
    bg: "rgba(249, 115, 22, 0.15)",
    bgDark: "rgba(249, 115, 22, 0.20)",
  },
  unknown: {
    base: "#6b7280",
    bg: "rgba(107, 114, 128, 0.15)",
    bgDark: "rgba(107, 114, 128, 0.20)",
  },
} as const;

// ---------------------------------------------------------------------------
// Theme-Aware Tokens (light / dark)
// ---------------------------------------------------------------------------

/**
 * Light-mode contextual tokens.
 * "Clean and warm" — off-white backgrounds, deep green text.
 */
export const lightTheme = {
  /** Page-level backgrounds */
  background: "#f8faf9",
  backgroundSecondary: "#ffffff",

  /** Cards and elevated surfaces */
  card: "#ffffff",
  cardBorder: "rgba(0, 0, 0, 0.05)",

  /** Typography hierarchy */
  textPrimary: "#0d1b13",
  textSecondary: "#4b5563",
  textMuted: "#9ca3af",
  textInverse: "#ffffff",

  /** Borders */
  border: "rgba(0, 0, 0, 0.10)",
  borderLight: "#e5e7eb",
  borderStrong: "#d1d5db",

  /** Overlay */
  overlay: "rgba(0, 0, 0, 0.30)",
  overlayHeavy: "rgba(0, 0, 0, 0.50)",

  /** Buttons */
  buttonSecondary: "#f3f4f6",
  buttonSecondaryHover: "#e5e7eb",

  /** Icons */
  iconPrimary: "#0d1b13",
  iconSecondary: "#6b7280",

  /** Status scores */
  statusExcellent: "#16a34a",
  statusExcellentBg: "rgba(22, 163, 74, 0.15)",
  statusBon: "#0ea64b",
  statusBonBg: "rgba(14, 166, 75, 0.15)",
  statusMoyen: "#ea580c",
  statusMoyenBg: "rgba(234, 88, 12, 0.15)",
  statusMauvais: "#dc2626",
  statusMauvaisBg: "rgba(220, 38, 38, 0.15)",
} as const;

/**
 * Dark-mode contextual tokens.
 * "Deep forest" — green-tinted blacks, not flat gray.
 */
export const darkTheme = {
  /** Page-level backgrounds */
  background: "#0a1a10",
  backgroundSecondary: "#071209",

  /** Cards and elevated surfaces */
  card: "#132a1a",
  cardBorder: "rgba(255, 255, 255, 0.05)",

  /** Typography hierarchy */
  textPrimary: "#e8f5e9",
  textSecondary: "#9ca3af",
  textMuted: "#6b7280",
  textInverse: "#0d1b13",

  /** Borders */
  border: "rgba(255, 255, 255, 0.10)",
  borderLight: "rgba(255, 255, 255, 0.05)",
  borderStrong: "rgba(255, 255, 255, 0.18)",

  /** Overlay */
  overlay: "rgba(0, 0, 0, 0.60)",
  overlayHeavy: "rgba(0, 0, 0, 0.80)",

  /** Buttons */
  buttonSecondary: "rgba(255, 255, 255, 0.05)",
  buttonSecondaryHover: "rgba(255, 255, 255, 0.10)",

  /** Icons */
  iconPrimary: "#e8f5e9",
  iconSecondary: "#9ca3af",

  /** Status scores */
  statusExcellent: "#22c55e",
  statusExcellentBg: "rgba(34, 197, 94, 0.20)",
  statusBon: "#13ec6a",
  statusBonBg: "rgba(19, 236, 106, 0.20)",
  statusMoyen: "#f97316",
  statusMoyenBg: "rgba(249, 115, 22, 0.20)",
  statusMauvais: "#ef4444",
  statusMauvaisBg: "rgba(239, 68, 68, 0.20)",
} as const;

// ---------------------------------------------------------------------------
// Brand Constants (non-theme-dependent)
// ---------------------------------------------------------------------------

/** Colors that stay constant regardless of theme mode. */
export const brand = {
  /** Hero primary green — use for CTAs, active indicators, brand marks. */
  primary: primary[500],
  /** Slightly darker variant for pressed / gradient end states. */
  primaryDark: "#0ea64b",
  /** The gold accent for premium badges, streaks, gamification. */
  gold: gold[500],
  /** Pure white — text on primary buttons, inverse backgrounds. */
  white: "#ffffff",
  /** True black — used sparingly for maximum contrast. */
  black: "#000000",
} as const;

// ---------------------------------------------------------------------------
// Glass / Frosted Surface Tokens
// ---------------------------------------------------------------------------

/** Glassmorphism surface tokens for translucent overlays. */
export const glass = {
  light: {
    bg: "rgba(255, 255, 255, 0.72)",
    bgSubtle: "rgba(255, 255, 255, 0.45)",
    border: "rgba(0, 0, 0, 0.06)",
    borderStrong: "rgba(0, 0, 0, 0.10)",
    highlight: "rgba(255, 255, 255, 0.50)",
  },
  dark: {
    bg: "rgba(19, 42, 26, 0.65)",
    bgSubtle: "rgba(19, 42, 26, 0.40)",
    border: "rgba(255, 255, 255, 0.08)",
    borderStrong: "rgba(255, 255, 255, 0.12)",
    highlight: "rgba(255, 255, 255, 0.05)",
  },
} as const;

// ---------------------------------------------------------------------------
// Ramadan Seasonal Palette
// ---------------------------------------------------------------------------

/** Ramadan accent colors — warm gold, deep indigo, spiritual purple. */
export const ramadan = {
  gold: "#D4AF37",
  goldLight: "#f6e18a",
  indigo: "#312e81",
  purple: "#7c3aed",
  purpleLight: "#a78bfa",
  warmBlack: "#0f0a1e",
  crescentGlow: "rgba(212, 175, 55, 0.25)",
} as const;

// ---------------------------------------------------------------------------
// Signature Gradients
// ---------------------------------------------------------------------------

/** Named gradient tuples used across the app. */
export const gradients = {
  /** Primary CTA gradient (green → dark green). */
  primary: ["#13ec6a", "#0ea64b"] as const,
  /** Premium accent (green → gold). */
  premium: ["#13ec6a", "#D4AF37"] as const,
  /** Trust indicator (green → blue). */
  trust: ["#13ec6a", "#3b82f6"] as const,
  /** Warning (amber → red). */
  alert: ["#f59e0b", "#ef4444"] as const,
  /** Hero dark mode (deep forest). */
  heroDark: ["#0a1a10", "#132a1a"] as const,
  /** Hero light mode (warm white). */
  heroLight: ["#f8faf9", "#ffffff"] as const,
  /** Ramadan hero dark (warm black → deep indigo). */
  ramadanDark: ["#0f0a1e", "#312e81"] as const,
  /** Ramadan hero light (warm gold tint). */
  ramadanLight: ["#fdf9e8", "#f6e18a"] as const,
  /** Ramadan CTA (gold → purple). */
  ramadanPrimary: ["#D4AF37", "#7c3aed"] as const,
} as const;

// ---------------------------------------------------------------------------
// Composite Export
// ---------------------------------------------------------------------------

/**
 * Master color token map.
 * Import this when you need the entire system, or import individual
 * palettes / themes for tree-shaking.
 */
export const colors = {
  primary,
  gold,
  neutral,
  semantic,
  halalStatus,
  light: lightTheme,
  dark: darkTheme,
  brand,
  glass,
  gradients,
  ramadan,
} as const;

// ---------------------------------------------------------------------------
// Type Exports
// ---------------------------------------------------------------------------

export type PrimaryScale = typeof primary;
export type GoldScale = typeof gold;
export type NeutralScale = typeof neutral;
export type SemanticColors = typeof semantic;
export type HalalStatusColors = typeof halalStatus;
export type LightThemeColors = typeof lightTheme;
export type DarkThemeColors = typeof darkTheme;
export type BrandColors = typeof brand;
export type GlassColors = typeof glass;
export type RamadanColors = typeof ramadan;
export type Gradients = typeof gradients;
export type Colors = typeof colors;
