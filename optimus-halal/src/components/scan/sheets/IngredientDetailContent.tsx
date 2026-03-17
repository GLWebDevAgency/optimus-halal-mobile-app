/**
 * IngredientDetailContent — Displays ingredient halal status details.
 *
 * Shows status indicator, explanation, and scholarly reference if available.
 * Rendered inside an InfoSheet wrapper.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { spacing, radius } from "@/theme/spacing";
import { fontSize, fontWeight } from "@/theme/typography";
import { halalStatus } from "@/theme/colors";

// ── Types ────────────────────────────────────────────

type IngredientStatus = "halal" | "haram" | "doubtful" | "safe";

interface Props {
  name: string;
  status: IngredientStatus;
  ruling?: {
    explanation: string;
    scholarlyReference: string | null;
  };
}

// ── Status config ────────────────────────────────────

const STATUS_CONFIG: Record<IngredientStatus, { color: string; label: string }> = {
  halal: { color: halalStatus.halal.base, label: "Sans problème" },
  safe: { color: halalStatus.halal.base, label: "Sans problème" },
  haram: { color: halalStatus.haram.base, label: "Interdit" },
  doubtful: { color: halalStatus.doubtful.base, label: "Douteux" },
};

// ── Component ────────────────────────────────────────

export const IngredientDetailContent = React.memo(function IngredientDetailContent({
  name,
  status,
  ruling,
}: Props) {
  const { isDark, colors } = useTheme();
  const config = STATUS_CONFIG[status];
  const goldColor = isDark ? "#D4AF37" : "#8B6914";

  return (
    <View style={styles.container}>
      {/* Ingredient name */}
      <Text style={[styles.name, { color: colors.textPrimary }]}>{name}</Text>

      {/* Status badge */}
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: config.color }]} />
        <Text style={[styles.statusLabel, { color: config.color }]}>
          {config.label}
        </Text>
      </View>

      {/* Explanation */}
      {ruling?.explanation ? (
        <View style={[styles.explanationBox, {
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
        }]}>
          <Text style={[styles.explanationText, { color: colors.textSecondary }]}>
            {ruling.explanation}
          </Text>
        </View>
      ) : null}

      {/* Scholarly reference */}
      {ruling?.scholarlyReference ? (
        <View style={styles.referenceRow}>
          <Text style={[styles.referenceLabel, { color: colors.textMuted }]}>
            Référence :
          </Text>
          <Text style={[styles.referenceValue, { color: goldColor }]}>
            {ruling.scholarlyReference}
          </Text>
        </View>
      ) : null}
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
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.semiBold,
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
  referenceRow: {
    gap: spacing.xs,
  },
  referenceLabel: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
  },
  referenceValue: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semiBold,
    lineHeight: 18,
  },
});
