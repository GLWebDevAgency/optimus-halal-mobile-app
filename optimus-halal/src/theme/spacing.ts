/**
 * Naqiy Design System — Spacing & Border Radius Tokens
 *
 * A consistent spatial rhythm makes layouts feel intentional.
 * The scale is based on a 4 px base unit with intermediate 2 px and 6 px
 * values for fine-tuning compact UI elements.
 *
 * @module theme/spacing
 */

// ---------------------------------------------------------------------------
// Spacing Scale
// ---------------------------------------------------------------------------

/**
 * Spacing scale (in logical pixels).
 *
 * Named keys follow a t-shirt convention from `xs` through `6xl`,
 * with numeric aliases for programmatic access.
 *
 * Usage:
 * ```tsx
 * <View style={{ padding: spacing.md, marginBottom: spacing.lg }} />
 * ```
 */
export const spacing = {
  /** 2 px — hairline gaps, icon-to-text micro spacing. */
  "2xs": 2,
  /** 4 px — tight intra-component spacing. */
  xs: 4,
  /** 6 px — intermediate; badge padding, tight stacks. */
  sm: 6,
  /** 8 px — default small gap. */
  md: 8,
  /** 12 px — standard intra-section gap. */
  lg: 12,
  /** 16 px — default component padding. */
  xl: 16,
  /** 20 px — generous component padding. */
  "2xl": 20,
  /** 24 px — section spacing. */
  "3xl": 24,
  /** 32 px — major section divisions. */
  "4xl": 32,
  /** 40 px — screen-level vertical spacing. */
  "5xl": 40,
  /** 48 px — hero spacing, large separators. */
  "6xl": 48,
  /** 64 px — maximum spacing; page header clearance. */
  "7xl": 64,
} as const;

/**
 * Numeric spacing map for direct pixel lookups.
 *
 * Usage:
 * ```tsx
 * <View style={{ gap: spacingPx[16] }} />
 * ```
 */
export const spacingPx = {
  2: 2,
  4: 4,
  6: 6,
  8: 8,
  12: 12,
  16: 16,
  20: 20,
  24: 24,
  32: 32,
  40: 40,
  48: 48,
  64: 64,
} as const;

// ---------------------------------------------------------------------------
// Border Radius
// ---------------------------------------------------------------------------

/**
 * Border radius tokens.
 *
 * Usage:
 * ```tsx
 * <View style={{ borderRadius: radius.lg }} />
 * ```
 */
export const radius = {
  /** 0 px — sharp corners. */
  none: 0,
  /** 8 px — subtle rounding; inputs, small cards. */
  sm: 8,
  /** 12 px — standard card rounding. */
  md: 12,
  /** 16 px — prominent rounding; modals, sheets. */
  lg: 16,
  /** 20 px — hero cards, CTAs. */
  xl: 20,
  /** 24 px — floating action buttons, pill shapes. */
  "2xl": 24,
  /** 9999 px — fully circular / pill. */
  full: 9999,
} as const;

// ---------------------------------------------------------------------------
// Layout Helpers
// ---------------------------------------------------------------------------

/** Common hit-slop / touch-target values for accessibility (WCAG). */
export const hitSlop = {
  /** Minimum 44x44 touch target per WCAG 2.2 AA. */
  default: { top: 8, right: 8, bottom: 8, left: 8 },
  /** Generous touch target for action buttons. */
  large: { top: 12, right: 12, bottom: 12, left: 12 },
} as const;

// ---------------------------------------------------------------------------
// Type Exports
// ---------------------------------------------------------------------------

export type Spacing = typeof spacing;
export type SpacingPx = typeof spacingPx;
export type Radius = typeof radius;
export type HitSlop = typeof hitSlop;
