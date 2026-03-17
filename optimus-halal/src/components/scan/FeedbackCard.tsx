/**
 * FeedbackCard — "Votre avis compte" section (Horizon Premium Minimalist).
 *
 * Flat layout: no SectionCard wrapper. Gold uppercase header + flat content.
 * All feedback is LOCAL ONLY — no backend interaction.
 *
 * @module components/scan/FeedbackCard
 */

import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import {
  StarIcon,
  ThumbsUpIcon,
  FlagIcon,
  CheckCircleIcon,
  CaretRightIcon,
} from "phosphor-react-native";

import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { semantic, gold } from "@/theme/colors";
import { spacing, radius } from "@/theme/spacing";
import { fontSize, fontWeight, fontFamily } from "@/theme/typography";
import { letterSpacing } from "./scan-constants";

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

  const goldColor = isDark ? gold[400] : gold[700];

  return (
    <Animated.View
      entering={FadeInUp.delay(staggerIndex * 100)
        .springify()
        .damping(14)
        .stiffness(170)
        .mass(0.9)}
    >
      {/* ── Gold section header ── */}
      <View style={styles.header}>
        <StarIcon size={15} color={goldColor} weight="fill" />
        <Text style={[styles.headerTitle, { color: goldColor }]}>
          {sr.feedbackTitle}
        </Text>
      </View>

      {feedbackGiven !== null ? (
        // ── Thank-you state ──
        <Animated.View
          entering={FadeIn.duration(400)}
          style={styles.thanksRow}
        >
          <CheckCircleIcon
            size={20}
            color={semantic.success.base}
            weight="fill"
          />
          <Text style={[styles.thanksText, { color: colors.textPrimary }]}>
            {sr.feedbackThanks}
          </Text>
        </Animated.View>
      ) : (
        // ── Default state ──
        <>
          <Text style={[styles.desc, { color: colors.textMuted }]}>
            {sr.feedbackDesc}
          </Text>

          {!showReportOptions ? (
            // ── Button row ──
            <View style={styles.buttonRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.voteButton,
                  {
                    backgroundColor: isDark
                      ? pressed
                        ? "rgba(34,197,94,0.14)"
                        : "rgba(34,197,94,0.07)"
                      : pressed
                        ? "rgba(34,197,94,0.12)"
                        : "rgba(34,197,94,0.06)",
                    borderColor: isDark
                      ? "rgba(34,197,94,0.18)"
                      : "rgba(34,197,94,0.14)",
                  },
                ]}
                onPress={() => setFeedbackGiven("correct")}
                accessibilityLabel={sr.feedbackCorrect}
              >
                <View
                  style={[
                    styles.voteIconCircle,
                    {
                      backgroundColor: isDark
                        ? "rgba(34,197,94,0.15)"
                        : "rgba(34,197,94,0.10)",
                    },
                  ]}
                >
                  <ThumbsUpIcon
                    size={20}
                    color={semantic.success.base}
                    weight="bold"
                  />
                </View>
                <Text
                  style={[styles.voteLabel, { color: semantic.success.base }]}
                >
                  {sr.feedbackCorrect}
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.voteButton,
                  {
                    backgroundColor: isDark
                      ? pressed
                        ? "rgba(239,68,68,0.14)"
                        : "rgba(239,68,68,0.07)"
                      : pressed
                        ? "rgba(239,68,68,0.12)"
                        : "rgba(239,68,68,0.06)",
                    borderColor: isDark
                      ? "rgba(239,68,68,0.18)"
                      : "rgba(239,68,68,0.14)",
                  },
                ]}
                onPress={() => setShowReportOptions(true)}
                accessibilityLabel={sr.feedbackReport}
              >
                <View
                  style={[
                    styles.voteIconCircle,
                    {
                      backgroundColor: isDark
                        ? "rgba(239,68,68,0.15)"
                        : "rgba(239,68,68,0.10)",
                    },
                  ]}
                >
                  <FlagIcon
                    size={20}
                    color={semantic.danger.base}
                    weight="bold"
                  />
                </View>
                <Text
                  style={[styles.voteLabel, { color: semantic.danger.base }]}
                >
                  {sr.feedbackReport}
                </Text>
              </Pressable>
            </View>
          ) : (
            // ── Report options (flat, no bg) ──
            <View style={styles.reportOptions}>
              {reportOptions.map((label, idx) => (
                <Pressable
                  key={label}
                  style={({ pressed }) => [
                    styles.reportRow,
                    idx > 0 && {
                      borderTopWidth: StyleSheet.hairlineWidth,
                      borderTopColor: isDark
                        ? "rgba(255,255,255,0.07)"
                        : "rgba(0,0,0,0.06)",
                    },
                    pressed && {
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.04)"
                        : "rgba(0,0,0,0.03)",
                    },
                  ]}
                  onPress={handleReportOptionPress}
                  accessibilityLabel={label}
                >
                  <Text
                    style={[styles.reportLabel, { color: colors.textPrimary }]}
                  >
                    {label}
                  </Text>
                  <CaretRightIcon size={16} color={colors.textMuted} />
                </Pressable>
              ))}
            </View>
          )}
        </>
      )}
    </Animated.View>
  );
});

// ── Styles ──

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: fontSize.micro,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeight.bold,
    textTransform: "uppercase",
    letterSpacing: letterSpacing.wider,
  },
  desc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  voteButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  voteIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  voteLabel: {
    fontSize: 13,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.3,
  },
  thanksRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  thanksText: {
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.medium,
  },
  reportOptions: {
    marginTop: spacing.xs,
  },
  reportRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.lg,
  },
  reportLabel: {
    fontSize: 14,
    fontWeight: fontWeight.regular,
  },
});

export default FeedbackCard;
