/**
 * AllergenDetailContent — Displays allergen detail information.
 *
 * Shows warning banner, trace vs direct explanation, and EU regulation note.
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
  isTrace: boolean;
}

// ── Component ────────────────────────────────────────

export const AllergenDetailContent = React.memo(function AllergenDetailContent({
  name,
  isTrace,
}: Props) {
  const { isDark, colors } = useTheme();
  const warningColor = isTrace ? "#f97316" : "#ef4444";

  return (
    <View style={styles.container}>
      {/* Warning banner */}
      <View style={[styles.banner, { backgroundColor: `${warningColor}18` }]}>
        <Text style={[styles.bannerIcon]}>
          {"\u26a0\ufe0f"}
        </Text>
        <View style={styles.bannerContent}>
          <Text style={[styles.bannerTitle, { color: warningColor }]}>
            {name}
          </Text>
          <Text style={[styles.bannerSubtitle, { color: warningColor }]}>
            {isTrace ? "Traces possibles" : "Présence directe"}
          </Text>
        </View>
      </View>

      {/* Explanation */}
      <View style={styles.explanationSection}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          {isTrace ? "Que signifie « traces » ?" : "Présence directe"}
        </Text>
        <Text style={[styles.explanationText, { color: colors.textSecondary }]}>
          {isTrace
            ? "L'allergène n'est pas un ingrédient du produit mais peut être présent en quantités infimes en raison d'une contamination croisée lors de la fabrication. Le risque dépend de votre sensibilité individuelle."
            : "Cet allergène fait partie des ingrédients du produit. Il est directement incorporé dans la recette et est présent en quantité significative."
          }
        </Text>
      </View>

      {/* Recommendation */}
      <View style={[styles.infoBox, {
        backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
        borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
      }]}>
        <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>
          Recommandation
        </Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          {isTrace
            ? "Consultez votre allergologue pour déterminer si vous pouvez consommer des produits portant cette mention."
            : "Ce produit est déconseillé si vous êtes allergique ou intolérant à cet ingrédient."
          }
        </Text>
      </View>

      {/* EU regulation */}
      <Text style={[styles.regulationText, { color: colors.textMuted }]}>
        Règlement UE n°1169/2011 relatif à l'information des consommateurs
        sur les denrées alimentaires — les 14 allergènes majeurs doivent
        être clairement indiqués.
      </Text>
    </View>
  );
});

// ── Styles ───────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.md,
  },
  bannerIcon: {
    fontSize: 24,
  },
  bannerContent: {
    flex: 1,
    gap: spacing["2xs"],
  },
  bannerTitle: {
    fontSize: fontSize.h4,
    fontWeight: fontWeight.bold,
  },
  bannerSubtitle: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
  },
  explanationSection: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.semiBold,
  },
  explanationText: {
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
  regulationText: {
    fontSize: fontSize.caption,
    lineHeight: 18,
    fontStyle: "italic",
  },
});
