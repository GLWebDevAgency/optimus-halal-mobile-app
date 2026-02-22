/**
 * Naqiy Design System — Typography Tokens
 *
 * Font family, size, weight, line-height, and letter-spacing presets.
 * Every text style in the application should derive from these tokens.
 *
 * Font stack: Inter (loaded via expo-font / Google Fonts).
 * Fallback: system default sans-serif.
 *
 * @module theme/typography
 */

import { Platform, type TextStyle } from "react-native";

// ---------------------------------------------------------------------------
// Font Families
// ---------------------------------------------------------------------------

/**
 * Platform-aware font family mapping.
 * On iOS "Inter" is sufficient; on Android the weight-specific file name
 * is required when loaded via expo-font.
 */
export const fontFamily = {
  regular: Platform.select({ ios: "Inter", android: "Inter_400Regular", default: "Inter" }),
  medium: Platform.select({ ios: "Inter-Medium", android: "Inter_500Medium", default: "Inter" }),
  semiBold: Platform.select({ ios: "Inter-SemiBold", android: "Inter_600SemiBold", default: "Inter" }),
  bold: Platform.select({ ios: "Inter-Bold", android: "Inter_700Bold", default: "Inter" }),
  black: Platform.select({ ios: "Inter-Black", android: "Inter_900Black", default: "Inter" }),
} as const;

// ---------------------------------------------------------------------------
// Font Sizes
// ---------------------------------------------------------------------------

/** Pixel sizes following a minor-third modular scale. */
export const fontSize = {
  micro: 10,
  caption: 12,
  bodySmall: 14,
  body: 16,
  h4: 18,
  h3: 20,
  h2: 24,
  h1: 28,
  display: 32,
} as const;

// ---------------------------------------------------------------------------
// Font Weights (RN numeric strings)
// ---------------------------------------------------------------------------

export const fontWeight = {
  regular: "400" as const,
  medium: "500" as const,
  semiBold: "600" as const,
  bold: "700" as const,
  black: "900" as const,
};

// ---------------------------------------------------------------------------
// Line Heights
// ---------------------------------------------------------------------------

/** Computed line-heights for each text style (absolute px values). */
export const lineHeight = {
  micro: 14,
  caption: 16,
  bodySmall: 21,    // 14 * 1.5
  body: 24,         // 16 * 1.5
  h4: 26,           // 18 * ~1.44
  h3: 28,           // 20 * 1.4
  h2: 32,           // 24 * ~1.33
  h1: 36,           // 28 * ~1.29
  display: 40,      // 32 * 1.25
} as const;

// ---------------------------------------------------------------------------
// Letter Spacing
// ---------------------------------------------------------------------------

export const letterSpacing = {
  tighter: -0.5,
  tight: -0.3,
  normal: 0,
  wide: 0.5,
  wider: 1,
} as const;

// ---------------------------------------------------------------------------
// Composite Text Styles
// ---------------------------------------------------------------------------

/**
 * Ready-to-spread text styles.
 *
 * Usage:
 * ```tsx
 * <Text style={textStyles.h1}>Heading</Text>
 * ```
 */
export const textStyles = {
  /** Hero display text — splash screens, onboarding headlines. */
  display: {
    fontFamily: fontFamily.black,
    fontSize: fontSize.display,
    fontWeight: fontWeight.black,
    lineHeight: lineHeight.display,
    letterSpacing: letterSpacing.tighter,
  } satisfies TextStyle,

  /** Primary heading — screen titles. */
  h1: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.h1,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.h1,
    letterSpacing: letterSpacing.tight,
  } satisfies TextStyle,

  /** Secondary heading — section titles. */
  h2: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.h2,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.h2,
    letterSpacing: letterSpacing.normal,
  } satisfies TextStyle,

  /** Tertiary heading — card titles, group headers. */
  h3: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.h3,
    fontWeight: fontWeight.semiBold,
    lineHeight: lineHeight.h3,
    letterSpacing: letterSpacing.normal,
  } satisfies TextStyle,

  /** Quaternary heading — list item titles, labels. */
  h4: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.h4,
    fontWeight: fontWeight.semiBold,
    lineHeight: lineHeight.h4,
    letterSpacing: letterSpacing.normal,
  } satisfies TextStyle,

  /** Default body text. */
  body: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.body,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.body,
    letterSpacing: letterSpacing.normal,
  } satisfies TextStyle,

  /** Small body text — secondary descriptions, metadata. */
  bodySmall: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.bodySmall,
    letterSpacing: letterSpacing.normal,
  } satisfies TextStyle,

  /** Caption text — timestamps, hints, footnotes. */
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.caption,
    letterSpacing: letterSpacing.normal,
  } satisfies TextStyle,

  /** Micro text — badges, uppercase labels. */
  micro: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.micro,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.micro,
    letterSpacing: letterSpacing.wider,
    textTransform: "uppercase" as const,
  } satisfies TextStyle,
} as const;

// ---------------------------------------------------------------------------
// RTL / Arabic Font Size Multiplier
// ---------------------------------------------------------------------------

/**
 * Arabic script requires ~12% larger font sizes than Latin to achieve
 * equivalent readability due to complex glyph shapes and connected forms.
 * Apply to body/caption sizes when locale is 'ar'.
 */
export const rtlFontMultiplier = 1.12;

/**
 * Scale a font size for RTL locales (Arabic).
 * Pass `isRTL` from useTranslation to conditionally apply.
 */
export const scaleFontForRTL = (size: number, isRTL: boolean): number =>
  isRTL ? Math.round(size * rtlFontMultiplier) : size;

// ---------------------------------------------------------------------------
// Type Exports
// ---------------------------------------------------------------------------

export type FontFamily = typeof fontFamily;
export type FontSize = typeof fontSize;
export type FontWeight = typeof fontWeight;
export type LineHeight = typeof lineHeight;
export type LetterSpacing = typeof letterSpacing;
export type TextStyles = typeof textStyles;
export type TextStyleKey = keyof TextStyles;
