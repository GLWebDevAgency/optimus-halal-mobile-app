/**
 * NutriScoreDetailContent — Displays Nutri-Score grade breakdown.
 *
 * Shows big grade letter, A-E visualization with active grade scaled,
 * and calculation explanation. Rendered inside an InfoSheet wrapper.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { spacing, radius } from "@/theme/spacing";
import { fontSize, fontWeight } from "@/theme/typography";

// ── Types ────────────────────────────────────────────

interface Props {
  grade: string;
}

// ── Grade config ─────────────────────────────────────

const GRADES = [
  { letter: "A", color: "#22885c", label: "Excellent" },
  { letter: "B", color: "#85bb2f", label: "Bon" },
  { letter: "C", color: "#fecb02", label: "Moyen" },
  { letter: "D", color: "#ee8100", label: "Médiocre" },
  { letter: "E", color: "#e63e11", label: "Mauvais" },
] as const;

// ── Component ────────────────────────────────────────

export const NutriScoreDetailContent = React.memo(function NutriScoreDetailContent({
  grade,
}: Props) {
  const { isDark, colors } = useTheme();
  const normalizedGrade = grade.toUpperCase();
  const activeGrade = GRADES.find((g) => g.letter === normalizedGrade) ?? GRADES[2];

  return (
    <View style={styles.container}>
      {/* Big grade letter */}
      <View style={styles.gradeSection}>
        <Text style={[styles.gradeLetter, { color: activeGrade.color }]}>
          {activeGrade.letter}
        </Text>
        <Text style={[styles.gradeLabel, { color: colors.textSecondary }]}>
          {activeGrade.label}
        </Text>
      </View>

      {/* A-E blocks */}
      <View style={styles.blocksRow}>
        {GRADES.map((g) => {
          const isActive = g.letter === normalizedGrade;
          return (
            <View
              key={g.letter}
              style={[
                styles.block,
                {
                  backgroundColor: g.color,
                  opacity: isActive ? 1 : 0.3,
                  transform: [{ scale: isActive ? 1.15 : 1 }],
                },
              ]}
            >
              <Text style={styles.blockLetter}>{g.letter}</Text>
            </View>
          );
        })}
      </View>

      {/* Explanation */}
      <View style={[styles.explanationBox, {
        backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
        borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
      }]}>
        <Text style={[styles.explanationTitle, { color: colors.textPrimary }]}>
          Comment est-il calculé ?
        </Text>
        <Text style={[styles.explanationText, { color: colors.textSecondary }]}>
          Le Nutri-Score est calculé à partir de la teneur pour 100g en éléments
          défavorables (énergie, sucres, acides gras saturés, sel) et favorables
          (fibres, protéines, fruits, légumes, légumineuses, oléagineux).
        </Text>
        <Text style={[styles.explanationText, { color: colors.textMuted }]}>
          Source : Santé Publique France / Règlement UE.
        </Text>
      </View>
    </View>
  );
});

// ── Styles ───────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    gap: spacing.xl,
  },
  gradeSection: {
    alignItems: "center",
    gap: spacing.xs,
  },
  gradeLetter: {
    fontSize: 48,
    fontWeight: fontWeight.black,
  },
  gradeLabel: {
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.medium,
  },
  blocksRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.md,
  },
  block: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  blockLetter: {
    color: "#ffffff",
    fontSize: fontSize.h4,
    fontWeight: fontWeight.bold,
  },
  explanationBox: {
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
  },
  explanationTitle: {
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.semiBold,
  },
  explanationText: {
    fontSize: fontSize.caption,
    lineHeight: 18,
  },
});
