/**
 * LabelDetailContent — Displays product label/certification details.
 *
 * Shows label name and generic explanation about product labels
 * and certifications. Rendered inside an InfoSheet wrapper.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { spacing, radius } from "@/theme/spacing";
import { fontSize, fontWeight } from "@/theme/typography";

// ── Types ────────────────────────────────────────────

interface Props {
  name: string;
}

// ── Component ────────────────────────────────────────

export const LabelDetailContent = React.memo(function LabelDetailContent({
  name,
}: Props) {
  const { isDark, colors } = useTheme();
  const goldColor = isDark ? "#D4AF37" : "#8B6914";

  return (
    <View style={styles.container}>
      {/* Label name */}
      <View style={[styles.nameBadge, { backgroundColor: `${goldColor}18` }]}>
        <Text style={[styles.nameText, { color: goldColor }]}>{name}</Text>
      </View>

      {/* Description */}
      <View style={styles.descriptionSection}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          À propos de ce label
        </Text>
        <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
          Les labels et certifications garantissent le respect de cahiers
          des charges spécifiques concernant la qualité, l'origine, le mode
          de production ou les engagements environnementaux du produit.
        </Text>
      </View>

      {/* How it works */}
      <View style={[styles.infoBox, {
        backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
        borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
      }]}>
        <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>
          Comment vérifier ?
        </Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          Les labels sont renseignés par la communauté OpenFoodFacts et
          vérifiés à partir des informations présentes sur l'emballage
          du produit. Les données peuvent ne pas être exhaustives.
        </Text>
      </View>

      {/* Source */}
      <Text style={[styles.sourceText, { color: colors.textMuted }]}>
        Source des données : OpenFoodFacts (licence ODbL).
      </Text>
    </View>
  );
});

// ── Styles ───────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  nameBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
  },
  nameText: {
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.semiBold,
  },
  descriptionSection: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.semiBold,
  },
  descriptionText: {
    fontSize: fontSize.bodySmall,
    lineHeight: 21,
  },
  infoBox: {
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
  },
  infoTitle: {
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.semiBold,
  },
  infoText: {
    fontSize: fontSize.caption,
    lineHeight: 18,
  },
  sourceText: {
    fontSize: fontSize.caption,
    fontStyle: "italic",
  },
});
