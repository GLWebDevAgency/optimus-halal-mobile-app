/**
 * FeedbackBar — Compact feedback bar for scan results.
 *
 * Centered column layout: question label above, two chips below.
 * After selection, collapses to a "Merci !" confirmation with a check icon.
 * Guests see the same UI but the mutation is skipped (protectedProcedure).
 *
 * @module components/scan/FeedbackBar
 */

import React, { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { CheckIcon, FlagIcon, CheckCircleIcon } from "phosphor-react-native";

import { useTheme } from "@/hooks/useTheme";
import { useHaptics, useTranslation } from "@/hooks";
import { PressableScale } from "@/components/ui/PressableScale";
import { trpc } from "@/lib/trpc";
import { halalStatus as halalStatusTokens } from "@/theme/colors";
import { hexToRgba } from "@/utils/color";
import { fontSize, fontWeight, fontFamily } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";

// ── Types ────────────────────────────────────────────────

type FeedbackState = null | "correct" | "reported";

interface FeedbackBarProps {
  productId: string;
  isGuest: boolean;
  staggerIndex?: number;
}

// ── Component ────────────────────────────────────────────

export const FeedbackBar = React.memo(function FeedbackBar({
  productId,
  isGuest,
  staggerIndex = 0,
}: FeedbackBarProps) {
  const { colors } = useTheme();
  const { selection } = useHaptics();
  const { t } = useTranslation();
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const submitFeedback = trpc.scan.submitFeedback.useMutation();

  const handleCorrect = useCallback(() => {
    selection();
    setFeedback("correct");
    if (!isGuest) {
      submitFeedback.mutate({ productId, isCorrect: true });
    }
  }, [selection, isGuest, submitFeedback, productId]);

  const handleReport = useCallback(() => {
    selection();
    setFeedback("reported");
    if (!isGuest) {
      submitFeedback.mutate({ productId, isCorrect: false });
    }
  }, [selection, isGuest, submitFeedback, productId]);

  const greenColor = halalStatusTokens.halal.base;
  const redColor = halalStatusTokens.haram.base;

  return (
    <Animated.View
      entering={FadeInUp.delay(staggerIndex * 80).duration(400)}
      style={styles.wrapper}
    >
      {feedback != null ? (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={styles.confirmationRow}
        >
          <CheckCircleIcon size={18} weight="fill" color={greenColor} />
          <Text style={[styles.confirmationText, { color: colors.textSecondary }]}>
            {t.scanResult.feedbackThanks}
          </Text>
        </Animated.View>
      ) : (
        <View style={styles.column}>
          <Text style={[styles.question, { color: colors.textMuted }]}>
            {t.scanResult.isThisResultAccurate}
          </Text>

          <View style={styles.chips}>
            <PressableScale
              onPress={handleCorrect}
              accessibilityLabel={t.scanResult.feedbackCorrect}
              accessibilityRole="button"
              style={styles.chipPressable}
            >
              <View
                style={[
                  styles.chip,
                  {
                    borderColor: hexToRgba(greenColor, 0.3),
                    backgroundColor: hexToRgba(greenColor, 0.07),
                  },
                ]}
              >
                <CheckIcon size={15} weight="bold" color={greenColor} />
                <Text style={[styles.chipText, { color: greenColor }]}>
                  {t.scanResult.feedbackCorrect}
                </Text>
              </View>
            </PressableScale>

            <PressableScale
              onPress={handleReport}
              accessibilityLabel={t.scanResult.feedbackReport}
              accessibilityRole="button"
              style={styles.chipPressable}
            >
              <View
                style={[
                  styles.chip,
                  {
                    borderColor: hexToRgba(redColor, 0.3),
                    backgroundColor: hexToRgba(redColor, 0.07),
                  },
                ]}
              >
                <FlagIcon size={15} weight="bold" color={redColor} />
                <Text style={[styles.chipText, { color: redColor }]}>
                  {t.scanResult.feedbackReport}
                </Text>
              </View>
            </PressableScale>
          </View>
        </View>
      )}
    </Animated.View>
  );
});

// ── Styles ───────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
  column: {
    alignItems: "center",
    gap: spacing.xl,
    width: "100%",
  },
  question: {
    fontSize: fontSize.caption,
    fontFamily: fontFamily.regular,
    fontWeight: fontWeight.regular,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  chips: {
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "center",
  },
  chipPressable: {
    flex: 1,
    maxWidth: 160,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: 11,
  },
  chipText: {
    fontSize: fontSize.bodySmall,
    fontFamily: fontFamily.semiBold,
    fontWeight: fontWeight.semiBold,
  },
  confirmationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  confirmationText: {
    fontSize: fontSize.bodySmall,
    fontFamily: fontFamily.medium,
    fontWeight: fontWeight.medium,
  },
});

export default FeedbackBar;
