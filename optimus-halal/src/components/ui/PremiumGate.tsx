import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { usePremium, useTranslation, useTheme, useHaptics } from "@/hooks";
import { useFeatureFlagsStore } from "@/store";
import { PressableScale } from "./PressableScale";
import type { PaywallTrigger } from "@/types/paywall";
import { fontSize, fontWeight, headingFontFamily } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import { trpc } from "@/lib/trpc";

interface PremiumGateProps {
  feature: string;
  trigger?: PaywallTrigger;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Wraps premium-only content.
 * If paymentsEnabled=false OR user is premium: renders children.
 * If paymentsEnabled=true AND user is free: renders fallback or upgrade prompt.
 */
export function PremiumGate({ feature, trigger, children, fallback }: PremiumGateProps) {
  const { flags } = useFeatureFlagsStore();
  const { isPremium, showPaywall } = usePremium();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { impact } = useHaptics();
  const trackFeatureBlocked = trpc.analytics.trackFeatureBlocked.useMutation();

  const isBlocked = flags.paymentsEnabled && !isPremium && !fallback;

  // Track feature block once when the gate renders
  useEffect(() => {
    if (isBlocked) {
      trackFeatureBlocked.mutate({ feature });
    }
  }, [isBlocked]);

  if (!flags.paymentsEnabled || isPremium) {
    return <>{children}</>;
  }

  if (fallback) return <>{fallback}</>;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark
            ? "rgba(212,175,55,0.08)"
            : "rgba(212,175,55,0.05)",
        },
      ]}
    >
      <Image
        source={require("@assets/images/logo_naqiy.webp")}
        style={styles.logo}
        contentFit="contain"
        cachePolicy="memory-disk"
      />

      <Text style={[styles.title, { color: colors.textPrimary }]}>
        Naqiy+
      </Text>

      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {t.common.premiumRequired}
      </Text>

      <PressableScale
        onPress={() => {
          impact();
          showPaywall(trigger);
        }}
        style={[
          styles.cta,
          { backgroundColor: isDark ? colors.primary : "#0f172a" },
        ]}
        accessibilityRole="button"
        accessibilityLabel={t.common.upgrade}
      >
        <Text
          style={[
            styles.ctaText,
            { color: isDark ? "#0f172a" : "#ffffff" },
          ]}
        >
          {t.common.upgrade}
        </Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: spacing.xl,
    padding: spacing["2xl"],
    borderRadius: radius["2xl"],
    alignItems: "center",
    gap: spacing.lg,
  },
  logo: {
    width: 40,
    height: 40,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.h4,
    fontFamily: headingFontFamily.extraBold,
    fontWeight: fontWeight.extraBold,
    textAlign: "center",
  },
  subtitle: {
    fontSize: fontSize.bodySmall,
    textAlign: "center",
    lineHeight: 20,
  },
  cta: {
    marginTop: spacing.sm,
    height: 44,
    paddingHorizontal: spacing["4xl"],
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
  },
});
