/**
 * HealthScoreDetailContent — Displays full health score breakdown.
 *
 * Shows big score, 4 axes with progress bars, confidence badge,
 * and methodology note. Rendered inside an InfoSheet wrapper.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { spacing, radius } from "@/theme/spacing";
import { fontSize, fontWeight } from "@/theme/typography";

// ── Types ────────────────────────────────────────────

interface Axis {
  name: string;
  score: number;
  max: number;
  color: string;
}

interface Props {
  score: number;
  label: string;
  axes: Axis[];
  confidence: string;
}

// ── Helpers ──────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score >= 75) return "#22c55e";
  if (score >= 50) return "#eab308";
  if (score >= 25) return "#f97316";
  return "#ef4444";
}

// ── Component ────────────────────────────────────────

export const HealthScoreDetailContent = React.memo(function HealthScoreDetailContent({
  score,
  label,
  axes,
  confidence,
}: Props) {
  const { isDark, colors } = useTheme();
  const goldColor = isDark ? "#D4AF37" : "#8B6914";

  return (
    <View style={styles.container}>
      {/* Big score */}
      <View style={styles.scoreSection}>
        <Text style={[styles.scoreValue, { color: getScoreColor(score) }]}>
          {score}
        </Text>
        <Text style={[styles.scoreMax, { color: colors.textMuted }]}>/100</Text>
      </View>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>

      {/* Axes */}
      <View style={styles.axesSection}>
        {axes.map((axis) => {
          const pct = Math.round((axis.score / axis.max) * 100);
          return (
            <View key={axis.name} style={styles.axisRow}>
              <View style={styles.axisHeader}>
                <Text style={[styles.axisName, { color: colors.textPrimary }]}>
                  {axis.name}
                </Text>
                <Text style={[styles.axisScore, { color: axis.color }]}>
                  {axis.score}/{axis.max}
                </Text>
              </View>
              <View style={[styles.progressTrack, {
                backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
              }]}>
                <View
                  style={[styles.progressFill, {
                    backgroundColor: axis.color,
                    width: `${Math.min(pct, 100)}%`,
                  }]}
                />
              </View>
            </View>
          );
        })}
      </View>

      {/* Confidence badge */}
      <View style={[styles.confidenceBadge, { backgroundColor: `${goldColor}18` }]}>
        <Text style={[styles.confidenceText, { color: goldColor }]}>
          Confiance : {confidence}
        </Text>
      </View>

      {/* Methodology note */}
      <View style={[styles.noteBox, {
        backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
        borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
      }]}>
        <Text style={[styles.noteText, { color: colors.textMuted }]}>
          Score calculé à partir du Nutri-Score, du niveau de transformation (NOVA),
          des additifs et des alertes personnalisées.
        </Text>
      </View>
    </View>
  );
});

// ── Styles ───────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  scoreSection: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: fontWeight.bold,
  },
  scoreMax: {
    fontSize: fontSize.h4,
    fontWeight: fontWeight.medium,
    marginLeft: spacing["2xs"],
  },
  label: {
    fontSize: fontSize.bodySmall,
    textAlign: "center",
    marginTop: -spacing.md,
  },
  axesSection: {
    gap: spacing.lg,
  },
  axisRow: {
    gap: spacing.sm,
  },
  axisHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  axisName: {
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.medium,
  },
  axisScore: {
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.semiBold,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  confidenceBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  confidenceText: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semiBold,
  },
  noteBox: {
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  noteText: {
    fontSize: fontSize.caption,
    lineHeight: 18,
  },
});
