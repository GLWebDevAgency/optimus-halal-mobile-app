/**
 * Optimus Halal Design System — Barrel Export
 *
 * Import everything from `@/theme` for full access,
 * or import specific modules for tree-shaking:
 *
 * ```tsx
 * // Full import
 * import { colors, spacing, textStyles, getShadows, entryAnimations } from "@/theme";
 *
 * // Targeted import
 * import { primary, brand } from "@/theme/colors";
 * import { radius } from "@/theme/spacing";
 * ```
 *
 * @module theme
 */

// Colors
export {
  primary,
  gold,
  neutral,
  semantic,
  halalStatus,
  lightTheme,
  darkTheme,
  brand,
  glass,
  gradients,
  ramadan,
  colors,
  type PrimaryScale,
  type GoldScale,
  type NeutralScale,
  type SemanticColors,
  type HalalStatusColors,
  type LightThemeColors,
  type DarkThemeColors,
  type BrandColors,
  type GlassColors,
  type RamadanColors,
  type Gradients,
  type Colors,
} from "./colors";

// Typography
export {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  textStyles,
  rtlFontMultiplier,
  scaleFontForRTL,
  type FontFamily,
  type FontSize,
  type FontWeight,
  type LineHeight,
  type LetterSpacing,
  type TextStyles,
  type TextStyleKey,
} from "./typography";

// Spacing & Radius
export {
  spacing,
  spacingPx,
  radius,
  hitSlop,
  type Spacing,
  type SpacingPx,
  type Radius,
  type HitSlop,
} from "./spacing";

// Shadows
export {
  lightShadows,
  darkShadows,
  getShadows,
  type ShadowPreset,
  type ShadowLevel,
  type Shadows,
} from "./shadows";

// Animations
export {
  durations,
  easings,
  staggerDelay,
  getStaggerDelay,
  springConfig,
  springBouncy,
  springStiff,
  springOptimus,
  timingNormal,
  timingFast,
  entryAnimations,
  exitAnimations,
  layoutTransition,
  type Durations,
  type DurationKey,
  type EntryAnimationKey,
  type ExitAnimationKey,
} from "./animations";
