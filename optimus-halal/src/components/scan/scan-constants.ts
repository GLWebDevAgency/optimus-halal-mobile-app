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
import { SealCheckIcon, XCircleIcon, QuestionIcon, type IconProps } from "phosphor-react-native";
import { halalStatus as halalStatusTokens, brand as brandTokens } from "@/theme/colors";

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
