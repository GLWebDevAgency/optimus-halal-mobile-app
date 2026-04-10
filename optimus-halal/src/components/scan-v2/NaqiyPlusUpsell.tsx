/**
 * NaqiyPlusUpsell — Upsell banner for gated premium features.
 *
 * Shows a call-to-action banner when a free user encounters
 * premium-gated content. Uses primary brand color as accent.
 *
 * @module components/scan-v2/NaqiyPlusUpsell
 */

import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { usePremium } from "@/hooks";
import { textStyles, headingFontFamily, bodyFontFamily } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import { gold } from "@/theme/colors";
import { Lock, Sparkle } from "phosphor-react-native";

interface NaqiyPlusUpsellProps {
  /** Context label to show what feature is locked */
  featureLabel: string;
  /** Optional description text */
  description?: string;
  /** Compact inline variant vs full-width card */
  compact?: boolean;
}

export const NaqiyPlusUpsell: React.FC<NaqiyPlusUpsellProps> = ({
  featureLabel,
  description,
  compact = false,
}) => {
  const { isDark, colors } = useTheme();
  const { showPaywall } = usePremium();

  if (compact) {
    return (
      <Pressable
        onPress={() => showPaywall("feature_locked")}
        accessibilityLabel={`Debloquer ${featureLabel} avec Naqiy+`}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.compactContainer,
          {
            backgroundColor: isDark ? `${gold[500]}15` : `${gold[500]}10`,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Lock size={14} color={gold[500]} weight="fill" />
        <Text style={[styles.compactText, { color: gold[500] }]}>
          Naqiy+ requis
        </Text>
      </Pressable>
    );
  }

  return (
    <Animated.View entering={FadeInUp.delay(200).springify().damping(14).stiffness(170).mass(0.9)}>
      <Pressable
        onPress={() => showPaywall("feature_locked")}
        accessibilityLabel={`Debloquer ${featureLabel} avec Naqiy Plus`}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.container,
          {
            backgroundColor: isDark ? colors.backgroundSecondary : colors.card,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <Sparkle size={28} color={gold[500]} weight="fill" />
        </View>
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {featureLabel}
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {description || "Disponible avec Naqiy+. Debloquez l'analyse complete."}
          </Text>
        </View>
        <View
          style={[
            styles.ctaButton,
            { backgroundColor: gold[500] },
          ]}
        >
          <Text style={styles.ctaText}>Voir</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.xl,
    borderRadius: radius.lg,
    gap: spacing.lg,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: `${gold[500]}12`,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontFamily: headingFontFamily.semiBold,
    fontSize: 15,
    fontWeight: "600",
  },
  description: {
    fontFamily: bodyFontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  ctaButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  ctaText: {
    fontFamily: bodyFontFamily.bold,
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  compactContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    alignSelf: "flex-start",
  },
  compactText: {
    fontFamily: bodyFontFamily.bold,
    fontSize: 11,
    fontWeight: "700",
  },
});

export default NaqiyPlusUpsell;
