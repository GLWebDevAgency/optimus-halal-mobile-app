/**
 * NaqiyGradeBadge — Micro-logo "N" + Arabic numeral grade.
 *
 * The Naqiy Trust Grade badge is our equivalent of the NutriScore logo.
 * Format: gold "N" prefix + colored Arabic numeral (١٢٣٤٥).
 *
 * Three sizes:
 *   - "strip"   → Full NutriScore-style strip (N ① ② ③ ④ ⑤ + label)
 *   - "compact"  → Single badge: [N٣] with colored background
 *   - "micro"    → Minimal badge for sticky headers
 *
 * @module components/scan/NaqiyGradeBadge
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { gold } from "@/theme/colors";
import { spacing, radius } from "@/theme/spacing";
import { fontSize, fontWeight } from "@/theme/typography";
import { useTheme } from "@/hooks/useTheme";

// ── Types ────────────────────────────────────────────────

export interface TrustGrade {
  grade: number;
  arabic: string;
  label: string;
  color: string;
}

/** Naqiy Trust Grade scale — aligned with backend caps */
export const TRUST_GRADES: readonly TrustGrade[] = [
  { grade: 1, arabic: "١", label: "Très fiable",  color: "#22c55e" },
  { grade: 2, arabic: "٢", label: "Fiable",       color: "#84cc16" },
  { grade: 3, arabic: "٣", label: "Vigilance",    color: "#f59e0b" },
  { grade: 4, arabic: "٤", label: "Peu fiable",   color: "#f97316" },
  { grade: 5, arabic: "٥", label: "Insuffisant",  color: "#ef4444" },
] as const;

/** Client-side fallback: score → grade (mirrors backend getTrustGrade) */
export function getTrustGradeFromScore(score: number): TrustGrade {
  if (score >= 90) return TRUST_GRADES[0];
  if (score >= 70) return TRUST_GRADES[1];
  if (score >= 51) return TRUST_GRADES[2];
  if (score >= 35) return TRUST_GRADES[3];
  return TRUST_GRADES[4];
}

// ── Props ────────────────────────────────────────────────

interface StripProps {
  variant: "strip";
  grade: TrustGrade;
  /** Show label text next to the strip (default: true) */
  showLabel?: boolean;
}

interface CompactProps {
  variant: "compact";
  grade: TrustGrade;
  /** Show label text next to badge (default: false) */
  showLabel?: boolean;
}

interface MicroProps {
  variant: "micro";
  grade: TrustGrade;
}

export type NaqiyGradeBadgeProps = StripProps | CompactProps | MicroProps;

// ── Component ────────────────────────────────────────────

export const NaqiyGradeBadge = React.memo(function NaqiyGradeBadge(
  props: NaqiyGradeBadgeProps,
) {
  const { isDark } = useTheme();

  if (props.variant === "strip") {
    return <GradeStrip grade={props.grade} showLabel={props.showLabel ?? true} isDark={isDark} />;
  }

  if (props.variant === "compact") {
    return <GradeCompact grade={props.grade} showLabel={props.showLabel ?? false} />;
  }

  return <GradeMicro grade={props.grade} />;
});

// ── Strip variant (NutriScore-style) ─────────────────────

function GradeStrip({
  grade,
  showLabel,
  isDark,
}: {
  grade: TrustGrade;
  showLabel: boolean;
  isDark: boolean;
}) {
  return (
    <View style={styles.stripContainer}>
      {/* Gold "N" prefix */}
      <Text style={styles.stripNaqiyN}>N</Text>

      {/* 5 grade pills */}
      {TRUST_GRADES.map((g) => {
        const isActive = g.grade === grade.grade;
        return (
          <View
            key={g.grade}
            style={[
              styles.stripPill,
              isActive ? styles.stripPillActive : styles.stripPillInactive,
              { backgroundColor: g.color },
              !isActive && { opacity: isDark ? 0.2 : 0.15 },
            ]}
          >
            <Text
              style={[
                styles.stripPillText,
                isActive ? styles.stripPillTextActive : styles.stripPillTextInactive,
              ]}
            >
              {g.arabic}
            </Text>
          </View>
        );
      })}

      {/* Label */}
      {showLabel && (
        <Text style={[styles.stripLabel, { color: grade.color }]}>
          {grade.label}
        </Text>
      )}
    </View>
  );
}

// ── Compact variant ──────────────────────────────────────

function GradeCompact({
  grade,
  showLabel,
}: {
  grade: TrustGrade;
  showLabel: boolean;
}) {
  return (
    <View style={styles.compactContainer}>
      <View style={[styles.compactBadge, { backgroundColor: grade.color }]}>
        <Text style={styles.compactN}>N</Text>
        <Text style={styles.compactArabic}>{grade.arabic}</Text>
      </View>
      {showLabel && (
        <Text style={[styles.compactLabel, { color: grade.color }]}>
          {grade.label}
        </Text>
      )}
    </View>
  );
}

// ── Micro variant ────────────────────────────────────────

function GradeMicro({ grade }: { grade: TrustGrade }) {
  return (
    <View style={[styles.microBadge, { backgroundColor: grade.color }]}>
      <Text style={styles.microN}>N</Text>
      <Text style={styles.microArabic}>{grade.arabic}</Text>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────

const styles = StyleSheet.create({
  // Strip
  stripContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  stripNaqiyN: {
    fontSize: 11,
    fontWeight: fontWeight.black,
    color: gold[500],
    marginRight: 2,
  },
  stripPill: {
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  stripPillActive: {
    width: 44,
    height: 26,
  },
  stripPillInactive: {
    width: 22,
    height: 22,
  },
  stripPillText: {
    color: "white",
    fontWeight: fontWeight.black,
  },
  stripPillTextActive: {
    fontSize: 14,
  },
  stripPillTextInactive: {
    fontSize: 10,
  },
  stripLabel: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semiBold,
    marginLeft: spacing.md,
  },

  // Compact
  compactContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  compactBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
  },
  compactN: {
    fontSize: 9,
    fontWeight: fontWeight.black,
    color: gold[500],
  },
  compactArabic: {
    fontSize: 13,
    fontWeight: fontWeight.black,
    color: "white",
  },
  compactLabel: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semiBold,
  },

  // Micro
  microBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  microN: {
    fontSize: 7,
    fontWeight: fontWeight.black,
    color: gold[500],
  },
  microArabic: {
    fontSize: 11,
    fontWeight: fontWeight.black,
    color: "white",
  },
});
