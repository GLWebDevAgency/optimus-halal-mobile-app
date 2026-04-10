/**
 * PracticeSignalRow — Single certifier practice row.
 *
 * Shows a practice with its score, blocker status, and optional dossier link.
 * Used inside CertifierTrustCard for the certified track.
 *
 * Design: Stitch "certified-avoid" positive/blocker rows.
 *
 * @module components/scan-v2/PracticeSignalRow
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { textStyles, bodyFontFamily } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import { halalStatus } from "@/theme/colors";
import { CheckCircle, Warning } from "phosphor-react-native";
import type { CertifierPractice } from "./scan-v2-types";
import { getVerdictColor, verdictToLevel } from "./scan-v2-utils";

interface PracticeSignalRowProps {
  practice: CertifierPractice;
}

export const PracticeSignalRow: React.FC<PracticeSignalRowProps> = ({
  practice,
}) => {
  const { isDark, colors } = useTheme();
  const isBlocker = practice.isBlocker;
  const level = verdictToLevel(practice.verdict);
  const accentColor = getVerdictColor(level);

  const Icon = isBlocker ? Warning : CheckCircle;
  const iconColor = isBlocker ? halalStatus.haram.base : halalStatus.halal.base;

  return (
    <View style={styles.container}>
      <Icon
        size={16}
        color={iconColor}
        weight="fill"
        style={styles.icon}
      />
      <View style={styles.content}>
        <Text
          style={[
            styles.label,
            { color: isBlocker ? accentColor : colors.textSecondary },
            isBlocker && styles.labelBlocker,
          ]}
          numberOfLines={2}
        >
          {practice.label}
        </Text>
        {isBlocker && practice.descriptionFr && (
          <Text
            style={[styles.description, { color: colors.textMuted }]}
            numberOfLines={2}
          >
            {practice.descriptionFr}
          </Text>
        )}
      </View>
      {isBlocker && (
        <Text style={[styles.scoreText, { color: accentColor }]}>
          Score {practice.score}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.lg,
    paddingVertical: spacing.sm,
  },
  icon: {
    marginTop: 2,
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  label: {
    fontFamily: bodyFontFamily.medium,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
  },
  labelBlocker: {
    fontFamily: bodyFontFamily.semiBold,
    fontWeight: "600",
  },
  description: {
    fontFamily: bodyFontFamily.regular,
    fontSize: 11,
    lineHeight: 15,
  },
  scoreText: {
    fontFamily: bodyFontFamily.bold,
    fontSize: 11,
    fontWeight: "700",
  },
});

export default PracticeSignalRow;
