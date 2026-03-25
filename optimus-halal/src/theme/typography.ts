/**
 * Naqiy Design System — Typography Tokens
 *
 * Font families:
 *   • Nunito      → headings (display, h1–h4) — rounded, impactful
 *   • Nunito Sans → body text (body, caption, micro) — clean, readable
 *
 * Loaded via expo-font / @expo-google-fonts.
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
 * On iOS the family name suffices; on Android the weight-specific
 * file name is required when loaded via expo-font.
 */

/** Nunito — headings & display */
export const headingFontFamily = {
  semiBold: Platform.select({ ios: "Nunito-SemiBold", android: "Nunito_600SemiBold", default: "Nunito" }),
  bold: Platform.select({ ios: "Nunito-Bold", android: "Nunito_700Bold", default: "Nunito" }),
  extraBold: Platform.select({ ios: "Nunito-ExtraBold", android: "Nunito_800ExtraBold", default: "Nunito" }),
  black: Platform.select({ ios: "Nunito-Black", android: "Nunito_900Black", default: "Nunito" }),
} as const;

/** Nunito Sans — body text & UI */
export const bodyFontFamily = {
  regular: Platform.select({ ios: "NunitoSans", android: "NunitoSans_400Regular", default: "NunitoSans" }),
  medium: Platform.select({ ios: "NunitoSans-Medium", android: "NunitoSans_500Medium", default: "NunitoSans" }),
  semiBold: Platform.select({ ios: "NunitoSans-SemiBold", android: "NunitoSans_600SemiBold", default: "NunitoSans" }),
  bold: Platform.select({ ios: "NunitoSans-Bold", android: "NunitoSans_700Bold", default: "NunitoSans" }),
  black: Platform.select({ ios: "NunitoSans-Black", android: "NunitoSans_900Black", default: "NunitoSans" }),
} as const;

/** Backward-compatible alias — maps to body font (Nunito Sans) */
export const fontFamily = {
  regular: bodyFontFamily.regular,
  medium: bodyFontFamily.medium,
  semiBold: bodyFontFamily.semiBold,
  bold: bodyFontFamily.bold,
  black: bodyFontFamily.black,
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
  extraBold: "800" as const,
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
 * Headings (display, h1–h4) → Nunito (rounded, impactful)
 * Body text (body, caption, micro) → Nunito Sans (clean, readable)
 *
 * Usage:
 * ```tsx
 * <Text style={textStyles.h1}>Heading</Text>
 * ```
 */
export const textStyles = {
  /** Hero display text — splash screens, onboarding headlines. */
  display: {
    fontFamily: headingFontFamily.black,
    fontSize: fontSize.display,
    fontWeight: fontWeight.black,
    lineHeight: lineHeight.display,
    letterSpacing: letterSpacing.tighter,
  } satisfies TextStyle,

  /** Primary heading — screen titles. */
  h1: {
    fontFamily: headingFontFamily.bold,
    fontSize: fontSize.h1,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.h1,
    letterSpacing: letterSpacing.tight,
  } satisfies TextStyle,

  /** Secondary heading — section titles. */
  h2: {
    fontFamily: headingFontFamily.bold,
    fontSize: fontSize.h2,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.h2,
    letterSpacing: letterSpacing.normal,
  } satisfies TextStyle,

  /** Tertiary heading — card titles, group headers. */
  h3: {
    fontFamily: headingFontFamily.semiBold,
    fontSize: fontSize.h3,
    fontWeight: fontWeight.semiBold,
    lineHeight: lineHeight.h3,
    letterSpacing: letterSpacing.normal,
  } satisfies TextStyle,

  /** Quaternary heading — list item titles, labels. */
  h4: {
    fontFamily: headingFontFamily.semiBold,
    fontSize: fontSize.h4,
    fontWeight: fontWeight.semiBold,
    lineHeight: lineHeight.h4,
    letterSpacing: letterSpacing.normal,
  } satisfies TextStyle,

  /** Default body text. */
  body: {
    fontFamily: bodyFontFamily.medium,
    fontSize: fontSize.body,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.body,
    letterSpacing: letterSpacing.normal,
  } satisfies TextStyle,

  /** Small body text — secondary descriptions, metadata. */
  bodySmall: {
    fontFamily: bodyFontFamily.regular,
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.bodySmall,
    letterSpacing: letterSpacing.normal,
  } satisfies TextStyle,

  /** Caption text — timestamps, hints, footnotes. */
  caption: {
    fontFamily: bodyFontFamily.regular,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.caption,
    letterSpacing: letterSpacing.normal,
  } satisfies TextStyle,

  /** Micro text — badges, uppercase labels. */
  micro: {
    fontFamily: bodyFontFamily.medium,
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

export type HeadingFontFamily = typeof headingFontFamily;
export type BodyFontFamily = typeof bodyFontFamily;
export type FontFamily = typeof fontFamily;
export type FontSize = typeof fontSize;
export type FontWeight = typeof fontWeight;
export type LineHeight = typeof lineHeight;
export type LetterSpacing = typeof letterSpacing;
export type TextStyles = typeof textStyles;
export type TextStyleKey = keyof TextStyles;
