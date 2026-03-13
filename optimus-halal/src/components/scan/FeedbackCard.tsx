/**
 * FeedbackCard — "Votre avis compte" section.
 *
 * Allows users to mark a scan result as correct or report an issue.
 * All feedback is LOCAL ONLY — no backend interaction.
 *
 * @module components/scan/FeedbackCard
 */

import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import {
  StarIcon,
  ThumbsUpIcon,
  FlagIcon,
  CheckCircleIcon,
  CaretRightIcon,
} from "phosphor-react-native";

import { SectionCard } from "./SectionCard";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { semantic, gold } from "@/theme/colors";
import { spacing, radius } from "@/theme/spacing";
import { fontSize, fontWeight } from "@/theme/typography";

// ── Types ──

interface FeedbackCardProps {
  staggerIndex?: number;
}

type FeedbackState = null | "correct" | "reported";

// ── Component ──

export const FeedbackCard = React.memo(function FeedbackCard({
  staggerIndex = 0,
}: FeedbackCardProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();

  const [feedbackGiven, setFeedbackGiven] = useState<FeedbackState>(null);
  const [showReportOptions, setShowReportOptions] = useState(false);

  const sr = t.scanResult;

  const reportOptions = [
    sr.feedbackReportVerdict,
    sr.feedbackReportScore,
    sr.feedbackReportMissing,
    sr.feedbackReportOther,
  ];

  const handleReportOptionPress = () => {
    setFeedbackGiven("reported");
    setShowReportOptions(false);
  };

  return (
    <SectionCard
      icon={<StarIcon size={16} color={isDark ? gold[400] : gold[700]} weight="fill" />}
      title={sr.feedbackTitle}
      staggerIndex={staggerIndex}
    >
      {feedbackGiven !== null ? (
        // ── Thank-you state ──
        <Animated.View
          entering={FadeIn.duration(400)}
          style={styles.thanksRow}
        >
          <CheckCircleIcon size={20} color={semantic.success.base} weight="fill" />
          <Text style={[styles.thanksText, { color: colors.textPrimary }]}>
            {sr.feedbackThanks}
          </Text>
        </Animated.View>
      ) : (
        // ── Default state ──
        <View>
          <Text style={[styles.desc, { color: colors.textMuted }]}>
            {sr.feedbackDesc}
          </Text>

          {!showReportOptions ? (
            // ── Button row ──
            <View style={styles.buttonRow}>
              {/* Correct button */}
              <Pressable
                style={({ pressed }) => [
                  styles.outlineButton,
                  {
                    borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
                    backgroundColor: pressed
                      ? isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"
                      : "transparent",
                  },
                ]}
                onPress={() => setFeedbackGiven("correct")}
                accessibilityLabel={sr.feedbackCorrect}
              >
                <ThumbsUpIcon size={16} color={colors.textSecondary} />
                <Text style={[styles.buttonLabel, { color: colors.textSecondary }]}>
                  {sr.feedbackCorrect}
                </Text>
              </Pressable>

              {/* Report button */}
              <Pressable
                style={({ pressed }) => [
                  styles.outlineButton,
                  {
                    borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
                    backgroundColor: pressed
                      ? isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"
                      : "transparent",
                  },
                ]}
                onPress={() => setShowReportOptions(true)}
                accessibilityLabel={sr.feedbackReport}
              >
                <FlagIcon size={16} color={colors.textSecondary} />
                <Text style={[styles.buttonLabel, { color: colors.textSecondary }]}>
                  {sr.feedbackReport}
                </Text>
              </Pressable>
            </View>
          ) : (
            // ── Report options (inline) ──
            <View style={styles.reportOptions}>
              {reportOptions.map((label) => (
                <Pressable
                  key={label}
                  style={({ pressed }) => [
                    styles.reportRow,
                    {
                      backgroundColor: pressed
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(255,255,255,0.04)",
                    },
                  ]}
                  onPress={handleReportOptionPress}
                  accessibilityLabel={label}
                >
                  <Text style={[styles.reportLabel, { color: colors.textPrimary }]}>
                    {label}
                  </Text>
                  <CaretRightIcon size={16} color={colors.textMuted} />
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}
    </SectionCard>
  );
});

// ── Styles ──

const styles = StyleSheet.create({
  desc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  outlineButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  buttonLabel: {
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.medium,
  },
  thanksRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  thanksText: {
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.medium,
  },
  reportOptions: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  reportRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.sm,
  },
  reportLabel: {
    fontSize: 14,
    fontWeight: fontWeight.regular,
  },
});

export default FeedbackCard;
