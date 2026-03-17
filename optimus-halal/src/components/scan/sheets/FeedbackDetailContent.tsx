/**
 * FeedbackDetailContent — Displays feedback confirmation or report form.
 *
 * If "correct" shows a thank you message. If "report" shows a list
 * of report categories. Rendered inside an InfoSheet wrapper.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { spacing, radius } from "@/theme/spacing";
import { fontSize, fontWeight } from "@/theme/typography";
import { halalStatus } from "@/theme/colors";

// ── Types ────────────────────────────────────────────

interface Props {
  type: "correct" | "report";
}

// ── Report categories ────────────────────────────────

const REPORT_CATEGORIES = [
  { id: "verdict", label: "Verdict incorrect" },
  { id: "ingredient", label: "Ingrédient manquant" },
  { id: "image", label: "Image incorrecte" },
  { id: "certification", label: "Certification erronée" },
  { id: "other", label: "Autre" },
] as const;

// ── Component ────────────────────────────────────────

export const FeedbackDetailContent = React.memo(function FeedbackDetailContent({
  type,
}: Props) {
  const { isDark, colors } = useTheme();
  const goldColor = isDark ? "#D4AF37" : "#8B6914";

  if (type === "correct") {
    return (
      <View style={styles.container}>
        {/* Thank you */}
        <View style={styles.thankYouSection}>
          <Text style={styles.thankYouEmoji}>{"\u2705"}</Text>
          <Text style={[styles.thankYouTitle, { color: colors.textPrimary }]}>
            Merci pour votre retour !
          </Text>
        </View>

        <Text style={[styles.thankYouText, { color: colors.textSecondary }]}>
          Votre confirmation aide la communauté à valider la fiabilité
          des données de ce produit. Plus il y a de vérifications,
          plus les informations sont précises.
        </Text>

        {/* Info box */}
        <View style={[styles.infoBox, {
          backgroundColor: `${halalStatus.halal.base}12`,
          borderColor: `${halalStatus.halal.base}30`,
        }]}>
          <Text style={[styles.infoText, { color: halalStatus.halal.base }]}>
            Votre contribution a été enregistrée et augmente le score
            de confiance du produit.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Report header */}
      <Text style={[styles.reportTitle, { color: colors.textPrimary }]}>
        Signaler un problème
      </Text>
      <Text style={[styles.reportSubtitle, { color: colors.textSecondary }]}>
        Sélectionnez la catégorie qui correspond au problème rencontré :
      </Text>

      {/* Categories list */}
      <View style={styles.categoriesList}>
        {REPORT_CATEGORIES.map((cat) => (
          <View
            key={cat.id}
            style={[styles.categoryRow, {
              backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
              borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
            }]}
          >
            <View style={[styles.categoryDot, { backgroundColor: goldColor }]} />
            <Text style={[styles.categoryLabel, { color: colors.textPrimary }]}>
              {cat.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Note */}
      <Text style={[styles.noteText, { color: colors.textMuted }]}>
        Les signalements sont examinés par notre équipe et contribuent
        à améliorer la qualité des données pour tous les utilisateurs.
      </Text>
    </View>
  );
});

// ── Styles ───────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  thankYouSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  thankYouEmoji: {
    fontSize: 28,
  },
  thankYouTitle: {
    fontSize: fontSize.h3,
    fontWeight: fontWeight.bold,
  },
  thankYouText: {
    fontSize: fontSize.bodySmall,
    lineHeight: 21,
  },
  infoBox: {
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  infoText: {
    fontSize: fontSize.caption,
    lineHeight: 18,
    fontWeight: fontWeight.medium,
  },
  reportTitle: {
    fontSize: fontSize.h3,
    fontWeight: fontWeight.bold,
  },
  reportSubtitle: {
    fontSize: fontSize.bodySmall,
    lineHeight: 21,
  },
  categoriesList: {
    gap: spacing.md,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryLabel: {
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.medium,
  },
  noteText: {
    fontSize: fontSize.caption,
    lineHeight: 18,
    fontStyle: "italic",
  },
});
