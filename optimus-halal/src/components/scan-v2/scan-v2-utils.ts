/**
 * Scan V2 — Utility Functions
 *
 * Score-to-verdict mapping, grade colors, formatters.
 * Pure functions — no hooks, no side effects.
 *
 * @module components/scan-v2/scan-v2-utils
 */

import { halalStatus, gold } from "@/theme/colors";
import type {
  HalalVerdict,
  VerdictLevel,
  TrustGradeInfo,
  SubstanceIcon,
} from "./scan-v2-types";

// ── Verdict Level Mapping ──

/**
 * Map a numeric score (0-100) to a display verdict level.
 */
export function scoreToVerdictLevel(score: number): VerdictLevel {
  if (score >= 90) return "HALAL";
  if (score >= 70) return "PRUDENCE";
  if (score >= 40) return "MASHBOOH";
  if (score >= 20) return "A_EVITER";
  return "HARAM";
}

/**
 * Map a HalalVerdict enum to a display verdict level.
 */
export function verdictToLevel(verdict: HalalVerdict): VerdictLevel {
  switch (verdict) {
    case "halal":
      return "HALAL";
    case "halal_with_caution":
      return "PRUDENCE";
    case "mashbooh":
      return "MASHBOOH";
    case "avoid":
      return "A_EVITER";
    case "haram":
      return "HARAM";
  }
}

// ── Verdict Colors ──

/**
 * Get the accent color for a verdict level.
 */
export function getVerdictColor(level: VerdictLevel): string {
  switch (level) {
    case "HALAL":
      return halalStatus.halal.base; // #22c55e
    case "PRUDENCE":
      return gold[400]; // #e8b824
    case "MASHBOOH":
      return halalStatus.doubtful.base; // #f97316
    case "A_EVITER":
      return halalStatus.haram.base; // #ef4444
    case "HARAM":
      return halalStatus.haram.base; // #ef4444
  }
}

/**
 * Get background tint color for a verdict level (low opacity).
 */
export function getVerdictBgColor(level: VerdictLevel, isDark: boolean): string {
  switch (level) {
    case "HALAL":
      return isDark ? halalStatus.halal.bgDark : halalStatus.halal.bg;
    case "PRUDENCE":
      return isDark ? "rgba(232, 184, 36, 0.20)" : "rgba(232, 184, 36, 0.12)";
    case "MASHBOOH":
      return isDark ? halalStatus.doubtful.bgDark : halalStatus.doubtful.bg;
    case "A_EVITER":
    case "HARAM":
      return isDark ? halalStatus.haram.bgDark : halalStatus.haram.bg;
  }
}

// ── Verdict Labels ──

const VERDICT_LABELS_FR: Record<VerdictLevel, string> = {
  HALAL: "HALAL",
  PRUDENCE: "PRUDENCE",
  MASHBOOH: "MASHBOOH",
  A_EVITER: "A EVITER",
  HARAM: "HARAM",
};

const VERDICT_LABELS_EN: Record<VerdictLevel, string> = {
  HALAL: "HALAL",
  PRUDENCE: "CAUTION",
  MASHBOOH: "MASHBOOH",
  A_EVITER: "AVOID",
  HARAM: "HARAM",
};

const VERDICT_LABELS_AR: Record<VerdictLevel, string> = {
  HALAL: "حلال",
  PRUDENCE: "حذر",
  MASHBOOH: "مشبوه",
  A_EVITER: "تجنب",
  HARAM: "حرام",
};

export function getVerdictLabel(
  level: VerdictLevel,
  lang: "fr" | "en" | "ar" = "fr"
): string {
  switch (lang) {
    case "en":
      return VERDICT_LABELS_EN[level];
    case "ar":
      return VERDICT_LABELS_AR[level];
    default:
      return VERDICT_LABELS_FR[level];
  }
}

// ── Trust Grades (N1-N5) ──

const TRUST_GRADES: readonly TrustGradeInfo[] = [
  { grade: 1, arabic: "\u0661", label: "Tres fiable", color: "#22c55e" },
  { grade: 2, arabic: "\u0662", label: "Fiable", color: "#84cc16" },
  { grade: 3, arabic: "\u0663", label: "Vigilance", color: "#f59e0b" },
  { grade: 4, arabic: "\u0664", label: "Peu fiable", color: "#f97316" },
  { grade: 5, arabic: "\u0665", label: "Pas fiable du tout", color: "#ef4444" },
] as const;

/**
 * Score to Naqiy Trust Grade (N1-N5).
 */
export function getTrustGrade(score: number): TrustGradeInfo {
  if (score >= 90) return TRUST_GRADES[0];
  if (score >= 70) return TRUST_GRADES[1];
  if (score >= 51) return TRUST_GRADES[2];
  if (score >= 35) return TRUST_GRADES[3];
  return TRUST_GRADES[4];
}

/**
 * Format trust grade as display string: "N١"
 */
export function formatTrustGrade(grade: TrustGradeInfo): string {
  return `N${grade.arabic}`;
}

// ── Substance Icon Mapping ──

/**
 * Map substance icon key to Phosphor icon name.
 */
export function getSubstanceIconName(icon: SubstanceIcon): string {
  switch (icon) {
    case "insect":
      return "Bug";
    case "alcohol":
      return "Wine";
    case "animal":
      return "PawPrint";
    case "enzyme":
      return "Flask";
    case "process":
      return "Gear";
    case "source":
      return "Question";
    case "other":
      return "CircleWavyQuestion";
  }
}

// ── Fatwa Verdict Badge Colors ──

export function getFatwaVerdictColor(
  verdict: "permis" | "conditionnel" | "interdit"
): string {
  switch (verdict) {
    case "permis":
      return halalStatus.halal.base;
    case "conditionnel":
      return gold[400];
    case "interdit":
      return halalStatus.haram.base;
  }
}

// ── Score Formatting ──

/**
 * Format score as "45 / 100"
 */
export function formatScore(score: number): string {
  return `${Math.round(score)}`;
}

/**
 * Format confidence as percentage string.
 */
export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

// ── Stagger Delay ──

/**
 * Calculate stagger delay for animation entrance.
 * 60ms between each item.
 */
export function staggerDelay(index: number): number {
  return index * 60;
}

// ── Nutri-Score Color ──

export function getNutriScoreColor(grade: string): string {
  switch (grade.toUpperCase()) {
    case "A":
      return "#038141";
    case "B":
      return "#85bb2f";
    case "C":
      return "#fecb02";
    case "D":
      return "#ee8100";
    case "E":
      return "#e63e11";
    default:
      return "#6b7280";
  }
}

// ── NOVA Group Color ──

export function getNovaColor(group: number): string {
  switch (group) {
    case 1:
      return "#22c55e";
    case 2:
      return "#84cc16";
    case 3:
      return "#f59e0b";
    case 4:
      return "#ef4444";
    default:
      return "#6b7280";
  }
}
