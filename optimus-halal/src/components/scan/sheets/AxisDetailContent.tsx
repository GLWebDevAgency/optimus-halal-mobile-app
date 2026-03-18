/**
 * AxisDetailContent — Displays a health score axis breakdown.
 *
 * Shows score, progress bar, and axis-specific explanation.
 * Rendered inside an InfoSheet wrapper.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { spacing, radius } from "@/theme/spacing";
import { fontSize, fontWeight } from "@/theme/typography";

// ── Types ────────────────────────────────────────────

interface Props {
  name: string;
  score: number;
  max: number;
  color: string;
}

// ── Axis explanations ────────────────────────────────

function getAxisExplanation(name: string): string {
  switch (name) {
    case "Nutrition":
      return "Évalue la qualité nutritionnelle globale du produit basée sur le Nutri-Score. Prend en compte les éléments positifs (fibres, protéines, fruits et légumes) et négatifs (sucres, sel, graisses saturées, énergie).";
    case "Additifs":
      return "Évalue la présence et le niveau de risque des additifs alimentaires. Moins il y a d'additifs controversés, plus le score est élevé. Les additifs sont classés par niveau de risque selon les données scientifiques disponibles.";
    case "Transformation":
      return "Basé sur la classification NOVA, cet axe mesure le degré de transformation du produit. Les aliments non transformés ou peu transformés obtiennent un meilleur score que les ultra-transformés.";
    case "Alertes":
      return "Prend en compte les alertes personnalisées liées à vos préférences et votre profil de santé. Inclut les allergènes, les restrictions alimentaires et les composants surveillés.";
    default:
      return "Cet axe contribue au calcul du score santé global du produit.";
  }
}

// ── Component ────────────────────────────────────────

export const AxisDetailContent = React.memo(function AxisDetailContent({
  name,
  score,
  max,
  color,
}: Props) {
  const { isDark, colors } = useTheme();
  const pct = Math.round((score / max) * 100);

  return (
    <View style={styles.container}>
      {/* Axis name */}
      <Text style={[styles.name, { color: colors.textPrimary }]}>{name}</Text>

      {/* Score display */}
      <View style={styles.scoreRow}>
        <Text style={[styles.scoreValue, { color }]}>{score}</Text>
        <Text style={[styles.scoreMax, { color: colors.textMuted }]}>/{max}</Text>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressTrack, {
        backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
      }]}>
        <View
          style={[styles.progressFill, {
            backgroundColor: color,
            width: `${Math.min(pct, 100)}%`,
          }]}
        />
      </View>
      <Text style={[styles.pctLabel, { color: colors.textMuted }]}>
        {pct}% du maximum
      </Text>

      {/* Explanation */}
      <View style={[styles.explanationBox, {
        backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
        borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
      }]}>
        <Text style={[styles.explanationText, { color: colors.textSecondary }]}>
          {getAxisExplanation(name)}
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
  name: {
    fontSize: fontSize.h3,
    fontWeight: fontWeight.bold,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: fontWeight.bold,
  },
  scoreMax: {
    fontSize: fontSize.h4,
    fontWeight: fontWeight.medium,
    marginLeft: spacing["2xs"],
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  pctLabel: {
    fontSize: fontSize.caption,
    marginTop: -spacing.md,
  },
  explanationBox: {
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  explanationText: {
    fontSize: fontSize.bodySmall,
    lineHeight: 21,
  },
});
