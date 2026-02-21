/**
 * Optimus Halal Design System — Shadow Tokens
 *
 * React Native compatible shadow presets for iOS and Android.
 * iOS uses `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`.
 * Android uses `elevation` (shadows are system-rendered, color is ignored).
 *
 * Dark-mode shadows use a subtle gold glow from the gold accent color
 * to reinforce the luxury aesthetic.
 *
 * @module theme/shadows
 */

import { type ViewStyle } from "react-native";
import { primary, gold } from "./colors";

// ---------------------------------------------------------------------------
// Shadow Type
// ---------------------------------------------------------------------------

export interface ShadowPreset {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

// ---------------------------------------------------------------------------
// Light-Mode Shadows
// ---------------------------------------------------------------------------

/** Shadows for light backgrounds. Neutral black with low opacity. */
export const lightShadows = {
  /** Barely visible — input fields, flat cards. */
  subtle: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  } satisfies ShadowPreset,

  /** Standard card elevation. */
  card: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  } satisfies ShadowPreset,

  /** Floating elements — FABs, dropdown menus. */
  float: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 6,
  } satisfies ShadowPreset,

  /** Hero elements — modals, highlighted cards. */
  hero: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  } satisfies ShadowPreset,

  /** Pure glow — active states, focused elements. Uses primary green. */
  glow: {
    shadowColor: primary[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
  } satisfies ShadowPreset,
} as const;

// ---------------------------------------------------------------------------
// Dark-Mode Shadows
// ---------------------------------------------------------------------------

/**
 * Shadows for dark backgrounds.
 * Deep black base with a subtle gold glow to match the luxury theme.
 */
export const darkShadows = {
  /** Barely visible — input fields, flat cards. */
  subtle: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.20,
    shadowRadius: 4,
    elevation: 1,
  } satisfies ShadowPreset,

  /** Standard card elevation with subtle gold tint. */
  card: {
    shadowColor: gold[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.30,
    shadowRadius: 10,
    elevation: 3,
  } satisfies ShadowPreset,

  /** Floating elements — pronounced gold glow. */
  float: {
    shadowColor: gold[800],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  } satisfies ShadowPreset,

  /** Hero elements — dramatic depth with gold glow. */
  hero: {
    shadowColor: gold[500],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  } satisfies ShadowPreset,

  /** Pure glow — active states, focused elements. Brighter for dark mode. */
  glow: {
    shadowColor: gold[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.40,
    shadowRadius: 20,
    elevation: 4,
  } satisfies ShadowPreset,
} as const;

// ---------------------------------------------------------------------------
// Convenience: theme-aware shadow getter
// ---------------------------------------------------------------------------

/**
 * Returns the appropriate shadow preset map for the given theme.
 *
 * Usage:
 * ```tsx
 * const { isDark } = useTheme();
 * const shadow = getShadows(isDark);
 * <View style={shadow.card} />
 * ```
 */
export const getShadows = (isDark: boolean): Record<ShadowLevel, ShadowPreset> =>
  isDark ? darkShadows : lightShadows;

// ---------------------------------------------------------------------------
// Type Exports
// ---------------------------------------------------------------------------

export type ShadowLevel = keyof typeof lightShadows;
export type Shadows = typeof lightShadows;
