/**
 * CommunityDetailContent — Displays community verification info.
 *
 * Shows user count, how-it-works steps, and contribution CTA.
 * Rendered inside an InfoSheet wrapper.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { spacing, radius } from "@/theme/spacing";
import { fontSize, fontWeight } from "@/theme/typography";

// ── Types ────────────────────────────────────────────

interface Props {
  count: number;
}

// ── Steps ────────────────────────────────────────────

const STEPS = [
  { num: "1", text: "Un utilisateur scanne le produit" },
  { num: "2", text: "Il vérifie les informations affichées" },
  { num: "3", text: "Il confirme ou signale une erreur" },
  { num: "4", text: "La fiabilité du produit augmente" },
] as const;

// ── Component ────────────────────────────────────────

export const CommunityDetailContent = React.memo(function CommunityDetailContent({
  count,
}: Props) {
  const { isDark, colors } = useTheme();
  const goldColor = isDark ? "#D4AF37" : "#8B6914";

  return (
    <View style={styles.container}>
      {/* Count headline */}
      <View style={styles.countSection}>
        <Text style={styles.countEmoji}>{"\ud83d\udc65"}</Text>
        <Text style={[styles.countText, { color: colors.textPrimary }]}>
          {count} utilisateur{count > 1 ? "s" : ""} {count > 1 ? "ont" : "a"} vérifié ce produit
        </Text>
      </View>

      {/* How it works */}
      <View style={styles.stepsSection}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Comment ça fonctionne
        </Text>
        {STEPS.map((step) => (
          <View key={step.num} style={styles.stepRow}>
            <View style={[styles.stepCircle, { backgroundColor: `${goldColor}18` }]}>
              <Text style={[styles.stepNum, { color: goldColor }]}>{step.num}</Text>
            </View>
            <Text style={[styles.stepText, { color: colors.textSecondary }]}>
              {step.text}
            </Text>
          </View>
        ))}
      </View>

      {/* CTA */}
      <View style={[styles.ctaBox, {
        backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
        borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
      }]}>
        <Text style={[styles.ctaTitle, { color: colors.textPrimary }]}>
          Contribuer
        </Text>
        <Text style={[styles.ctaText, { color: colors.textSecondary }]}>
          Vérifiez les informations de ce produit et aidez la communauté
          à obtenir des données plus fiables.
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
  countSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  countEmoji: {
    fontSize: 28,
  },
  countText: {
    flex: 1,
    fontSize: fontSize.h4,
    fontWeight: fontWeight.semiBold,
    lineHeight: 24,
  },
  stepsSection: {
    gap: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.semiBold,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNum: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.bold,
  },
  stepText: {
    flex: 1,
    fontSize: fontSize.bodySmall,
    lineHeight: 21,
  },
  ctaBox: {
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
  },
  ctaTitle: {
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.semiBold,
  },
  ctaText: {
    fontSize: fontSize.caption,
    lineHeight: 18,
  },
});
