/**
 * HealthSummaryCard — Nutri-Score + NOVA + additifs (redesigned).
 *
 * Compact card showing health indicators with cross-reference
 * to halal-relevant additives. No borders, background shift only.
 *
 * Design: Stitch HealthCard pattern with grid layout.
 *
 * @module components/scan-v2/HealthSummaryCard
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { textStyles, headingFontFamily, bodyFontFamily } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import { Heartbeat, ArrowsLeftRight } from "phosphor-react-native";
import type { HealthSummaryData } from "./scan-v2-types";
import { getNutriScoreColor, getNovaColor } from "./scan-v2-utils";

interface HealthSummaryCardProps {
  data: HealthSummaryData;
}

export const HealthSummaryCard: React.FC<HealthSummaryCardProps> = ({
  data,
}) => {
  const { isDark, colors } = useTheme();

  return (
    <Animated.View
      entering={FadeInUp.delay(180).springify().damping(14).stiffness(170).mass(0.9)}
    >
      <View
        style={[
          styles.card,
          { backgroundColor: isDark ? colors.card : colors.card },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Heartbeat size={20} color={colors.primary} weight="fill" />
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Profil Nutritionnel
            </Text>
          </View>

          <View style={styles.badges}>
            {data.nutriScore && (
              <View
                style={[
                  styles.scoreBadge,
                  { backgroundColor: getNutriScoreColor(data.nutriScore) },
                ]}
              >
                <Text style={styles.scoreBadgeText}>
                  {data.nutriScore.toUpperCase()}
                </Text>
              </View>
            )}
            {data.novaGroup !== null && (
              <View
                style={[
                  styles.scoreBadge,
                  { backgroundColor: getNovaColor(data.novaGroup) },
                ]}
              >
                <Text style={styles.scoreBadgeText}>
                  NOVA {data.novaGroup}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.grid}>
          {data.nutriScore && (
            <View
              style={[
                styles.statCell,
                { backgroundColor: isDark ? colors.backgroundSecondary : colors.background },
              ]}
            >
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                NUTRI-SCORE
              </Text>
              <Text
                style={[
                  styles.statValue,
                  { color: getNutriScoreColor(data.nutriScore) },
                ]}
              >
                {data.nutriScore.toUpperCase()}
              </Text>
            </View>
          )}
          <View
            style={[
              styles.statCell,
              { backgroundColor: isDark ? colors.backgroundSecondary : colors.background },
            ]}
          >
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              ADDITIFS
            </Text>
            <View style={styles.statRow}>
              <Text
                style={[
                  styles.statValue,
                  { color: data.additivesCount > 3 ? "#f97316" : colors.textPrimary },
                ]}
              >
                {data.additivesCount}
              </Text>
              <Text style={[styles.statUnit, { color: colors.textMuted }]}>
                detectes
              </Text>
            </View>
          </View>
        </View>

        {/* Cross-reference with halal */}
        {data.additivesHalalRelevant.length > 0 && (
          <View
            style={[
              styles.crossRef,
              { backgroundColor: isDark ? colors.backgroundSecondary : colors.background },
            ]}
          >
            <ArrowsLeftRight size={14} color={colors.primary} />
            <Text style={[styles.crossRefText, { color: colors.textSecondary }]}>
              {data.additivesHalalRelevant.join(", ")} aussi analyses dans Halal
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: spacing["3xl"],
    gap: spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  title: {
    ...textStyles.h4,
  },
  badges: {
    flexDirection: "row",
    gap: spacing.md,
  },
  scoreBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  scoreBadgeText: {
    fontFamily: headingFontFamily.black,
    fontSize: 12,
    fontWeight: "900",
    color: "#ffffff",
  },
  grid: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  statCell: {
    flex: 1,
    padding: spacing.xl,
    borderRadius: radius.lg,
    gap: spacing.xs,
  },
  statLabel: {
    ...textStyles.micro,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  statValue: {
    fontFamily: headingFontFamily.extraBold,
    fontSize: 24,
    fontWeight: "800",
  },
  statUnit: {
    fontFamily: bodyFontFamily.regular,
    fontSize: 10,
    marginBottom: 4,
  },
  crossRef: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  crossRefText: {
    fontFamily: bodyFontFamily.medium,
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },
});

export default HealthSummaryCard;
