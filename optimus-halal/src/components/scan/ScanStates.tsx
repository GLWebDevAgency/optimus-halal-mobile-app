/**
 * ScanStates — Error & Not Found states for scan-result screen.
 *
 * Extracted from scan-result.tsx (final cleanup sprint).
 *
 * @module components/scan/ScanStates
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MagnifyingGlassIcon, WarningCircleIcon } from "phosphor-react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { PressableScale } from "@/components/ui/PressableScale";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { halalStatus as halalStatusTokens, brand as brandTokens, lightTheme } from "@/theme/colors";
import { textStyles, fontSize as fontSizeTokens, fontWeight as fontWeightTokens } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";

// ── Error State ───────────────────────────────────────────────────────────────

export const ScanErrorState = React.memo(function ScanErrorState({
  onRetry,
  onGoBack,
}: {
  onRetry: () => void;
  onGoBack: () => void;
}) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.stateContainer}>
      <Animated.View entering={FadeIn.duration(300)} style={styles.stateContent}>
        <View
          style={[
            styles.stateIconCircle,
            {
              backgroundColor: isDark
                ? halalStatusTokens.haram.bgDark
                : halalStatusTokens.haram.bg,
            },
          ]}
        >
          <WarningCircleIcon size={36}
            color={halalStatusTokens.haram.base} />
        </View>
        <Text style={[styles.stateTitle, { color: colors.textPrimary }]}>
          {t.scanResult.analysisError}
        </Text>
        <Text style={[styles.stateDesc, { color: colors.textSecondary }]}>
          {t.scanResult.analysisErrorDesc}
        </Text>
        <View style={styles.stateButtons}>
          <PressableScale
            onPress={onGoBack}
            style={[
              styles.stateButton,
              {
                backgroundColor: colors.buttonSecondary,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t.common.back}
          >
            <Text style={[styles.stateButtonText, { color: colors.textPrimary }]}>
              {t.common.back}
            </Text>
          </PressableScale>
          <PressableScale
            onPress={onRetry}
            style={[styles.stateButton, { backgroundColor: colors.primary }]}
            accessibilityRole="button"
            accessibilityLabel={t.common.retry}
          >
            <Text style={[styles.stateButtonText, { color: lightTheme.textPrimary }]}>
              {t.common.retry}
            </Text>
          </PressableScale>
        </View>
      </Animated.View>
    </View>
  );
});

// ── Not Found State ───────────────────────────────────────────────────────────

export const ScanNotFoundState = React.memo(function ScanNotFoundState({
  onGoBack,
}: {
  onGoBack: () => void;
}) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.stateContainer}>
      <Animated.View entering={FadeIn.duration(300)} style={styles.stateContent}>
        <View
          style={[
            styles.stateIconCircle,
            {
              backgroundColor: isDark
                ? `${brandTokens.gold}1A`
                : `${brandTokens.gold}14`,
            },
          ]}
        >
          <MagnifyingGlassIcon size={36}
            color={brandTokens.gold} />
        </View>
        <Text style={[styles.stateTitle, { color: colors.textPrimary }]}>
          {t.scanResult.productNotFound}
        </Text>
        <Text style={[styles.stateDesc, { color: colors.textSecondary }]}>
          {t.scanResult.productNotFoundDesc}
        </Text>
        <PressableScale
          onPress={onGoBack}
          style={[styles.stateButton, { backgroundColor: colors.primary, marginTop: 16 }]}
          accessibilityRole="button"
          accessibilityLabel={t.scanResult.scanAnother}
        >
          <Text style={[styles.stateButtonText, { color: lightTheme.textPrimary }]}>
            {t.scanResult.scanAnother}
          </Text>
        </PressableScale>
      </Animated.View>
    </View>
  );
});

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  stateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing["4xl"],
  },
  stateContent: {
    alignItems: "center",
    gap: spacing.xl,
  },
  stateIconCircle: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  stateTitle: {
    fontSize: fontSizeTokens.h4,
    fontWeight: fontWeightTokens.black,
    textAlign: "center",
  },
  stateDesc: {
    ...textStyles.bodySmall,
    textAlign: "center" as const,
  },
  stateButtons: {
    flexDirection: "row",
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  stateButton: {
    paddingHorizontal: spacing["3xl"],
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
  },
  stateButtonText: {
    fontSize: fontSizeTokens.bodySmall,
    fontWeight: fontWeightTokens.bold,
  },
});
