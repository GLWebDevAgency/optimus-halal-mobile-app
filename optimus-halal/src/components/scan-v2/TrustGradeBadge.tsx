/**
 * TrustGradeBadge — Displays N١-N٥ trust grade with color.
 *
 * Compact pill badge showing the Naqiy Trust Grade for a certifier.
 * Color-coded using the grade's canonical color.
 *
 * @module components/scan-v2/TrustGradeBadge
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { textStyles } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import { getTrustGrade, formatTrustGrade } from "./scan-v2-utils";

interface TrustGradeBadgeProps {
  /** Trust score (0-100) — will be mapped to N١-N٥ */
  score: number;
  /** Show the label next to the grade (e.g. "Fiable") */
  showLabel?: boolean;
  /** Compact mode for inline usage */
  compact?: boolean;
}

export const TrustGradeBadge: React.FC<TrustGradeBadgeProps> = ({
  score,
  showLabel = false,
  compact = false,
}) => {
  const { isDark, colors } = useTheme();
  const grade = getTrustGrade(score);
  const gradeText = formatTrustGrade(grade);

  return (
    <View
      style={[
        styles.container,
        compact && styles.containerCompact,
        { backgroundColor: isDark ? `${grade.color}22` : `${grade.color}15` },
      ]}
    >
      <Text
        style={[
          compact ? styles.gradeTextCompact : styles.gradeText,
          { color: grade.color },
        ]}
      >
        {gradeText}
      </Text>
      {showLabel && (
        <Text
          style={[
            styles.label,
            { color: isDark ? colors.textSecondary : grade.color },
          ]}
        >
          {grade.label}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    gap: spacing.sm,
  },
  containerCompact: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  gradeText: {
    ...textStyles.h4,
    fontWeight: "700",
  },
  gradeTextCompact: {
    ...textStyles.caption,
    fontWeight: "700",
  },
  label: {
    ...textStyles.caption,
  },
});

export default TrustGradeBadge;
