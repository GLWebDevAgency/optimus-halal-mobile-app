/**
 * Scan Result — Shared Constants
 *
 * Visual config, lookup maps, and timing constants used across
 * all scan result sub-components (VerdictHero, MadhabVerdictCard,
 * ScanActionBar, HalalAnalysisSection, etc.).
 *
 * @module components/scan/scan-constants
 */

import type { ComponentType } from "react";
import { Dimensions } from "react-native";
import { SealCheckIcon, XCircleIcon, QuestionIcon, type IconProps } from "phosphor-react-native";
import { halalStatus as halalStatusTokens, brand as brandTokens } from "@/theme/colors";

// ── Layout constants ──
const { height: SCREEN_HEIGHT } = Dimensions.get("window");
/** Hero occupies ~35% of viewport; uses minHeight so content can expand */
export const HERO_HEIGHT = SCREEN_HEIGHT * 0.35;

// ── Suspense delay — stagger anchor for hero choreography ──
export const SUSPENSE_DURATION = 350;

// ── Status Visual Config ──

export interface StatusVisualConfig {
  labelKey: "certifiedHalal" | "haramDetected" | "doubtfulStatus" | "unverified";
  Icon: ComponentType<IconProps>;
  /** Default weight for this status icon */
  iconWeight: "fill" | "bold" | "regular" | "light";
  color: string;
  glowColor: string;
  gradientDark: [string, string, string];
  gradientLight: [string, string, string];
}

export type HalalStatusKey = "halal" | "haram" | "doubtful" | "unknown";

export const STATUS_CONFIG: Record<string, StatusVisualConfig> = {
  halal: {
    labelKey: "certifiedHalal",
    Icon: SealCheckIcon,
    iconWeight: "fill",
    color: halalStatusTokens.halal.base,
    glowColor: brandTokens.primary,
    gradientDark: ["#0a1a10", "#0f1e14", "#111f15"],
    gradientLight: ["#f0fdf6", "#e8f9ee", "#f3f1ed"],
  },
  haram: {
    labelKey: "haramDetected",
    Icon: XCircleIcon,
    iconWeight: "fill",
    color: halalStatusTokens.haram.base,
    glowColor: "#dc2626",
    gradientDark: ["#1a0a0a", "#1c1010", "#1a1212"],
    gradientLight: ["#fef5f5", "#fce8e8", "#f3f1ed"],
  },
  doubtful: {
    labelKey: "doubtfulStatus",
    Icon: QuestionIcon,
    iconWeight: "bold",
    color: halalStatusTokens.doubtful.base,
    glowColor: "#ea580c",
    gradientDark: ["#1a140a", "#1c1810", "#1a1812"],
    gradientLight: ["#fffbf5", "#fef0e0", "#f3f1ed"],
  },
  unknown: {
    labelKey: "unverified",
    Icon: QuestionIcon,
    iconWeight: "light",
    color: halalStatusTokens.unknown.base,
    glowColor: "#64748b",
    gradientDark: ["#0f0f0f", "#131313", "#151515"],
    gradientLight: ["#f8f8f8", "#f5f4f2", "#f3f1ed"],
  },
};

// ── Madhab lookup maps ──

export const MADHAB_LABEL_KEY = {
  hanafi: "madhabHanafi",
  shafii: "madhabShafii",
  maliki: "madhabMaliki",
  hanbali: "madhabHanbali",
} as const;

export const MADHAB_TRUST_KEY = {
  hanafi: "trustScoreHanafi",
  shafii: "trustScoreShafii",
  maliki: "trustScoreMaliki",
  hanbali: "trustScoreHanbali",
} as const;

// ── Health Score Label Keys ──

export const HEALTH_SCORE_LABEL_KEYS: Record<
  string,
  "healthScoreExcellent" | "healthScoreGood" | "healthScoreMediocre" | "healthScorePoor" | "healthScoreVeryPoor"
> = {
  excellent: "healthScoreExcellent",
  good: "healthScoreGood",
  mediocre: "healthScoreMediocre",
  poor: "healthScorePoor",
  very_poor: "healthScoreVeryPoor",
};

// ── Nutrient Thresholds (per 100g, Yuka-adapted) ──

export interface NutrientThreshold {
  low: number;
  high: number;
}

/** Negative nutrients: low=good, high=bad */
export const NEGATIVE_NUTRIENT_THRESHOLDS: Record<string, NutrientThreshold> = {
  fat: { low: 3, high: 20 },
  saturated_fat: { low: 1.5, high: 5 },
  sugar: { low: 5, high: 12.5 },
  salt: { low: 0.3, high: 1.5 },
};

/** Positive nutrients: low=bad, high=good */
export const POSITIVE_NUTRIENT_THRESHOLDS: Record<string, NutrientThreshold> = {
  fiber: { low: 1.5, high: 3 },
  protein: { low: 4, high: 8 },
};

/**
 * Get nutrient level from value and thresholds.
 * For negative nutrients: <low = "low", >high = "high", else "moderate"
 * For positive nutrients: same scale but interpretation is inverted in UI
 */
export function getNutrientLevel(
  value: number,
  thresholds: NutrientThreshold,
): "low" | "moderate" | "high" {
  if (value < thresholds.low) return "low";
  if (value > thresholds.high) return "high";
  return "moderate";
}

// ── Additive Risk Levels (Yuka 4-level system) ──

export const ADDITIVE_RISK_LEVELS = {
  1: { labelKey: "riskHigh" as const, color: "#ef4444" },    // haram.base
  2: { labelKey: "riskMedium" as const, color: "#f97316" },  // doubtful.base
  3: { labelKey: "riskLimited" as const, color: "#FECB02" }, // yellow
  4: { labelKey: "riskNone" as const, color: "#22c55e" },    // halal.base
} as const;

// ── NutriScore / NOVA / EcoScore Badge Colors ──

export const NUTRISCORE_COLORS: Record<string, string> = {
  a: "#038141",
  b: "#85BB2F",
  c: "#FECB02",
  d: "#EE8100",
  e: "#E63E11",
};

export const NOVA_COLORS: Record<number, string> = {
  1: "#038141",
  2: "#85BB2F",
  3: "#FECB02",
  4: "#E63E11",
};

// ── Nutrient Bar Colors (status-based) ──

export const NUTRIENT_BAR_COLORS = {
  negative: { low: "#22c55e", moderate: "#f97316", high: "#ef4444" },
  positive: { low: "#ef4444", moderate: "#f97316", high: "#22c55e" },
} as const;

// ── Letter Spacing Tokens ──

export const letterSpacing = {
  tighter: -0.5,
  tight: -0.3,
  normal: 0,
  wide: 0.5,
  wider: 1.0,
} as const;
