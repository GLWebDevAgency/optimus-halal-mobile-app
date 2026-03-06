/**
 * Soft Paywall Screen
 *
 * Affiché quand un utilisateur anonyme atteint sa limite de 5 scans/jour.
 * Design éthique : bouton "Plus tard" TOUJOURS visible, pas de dark pattern.
 */

import React from "react";
import { View, Text } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { useHaptics } from "@/hooks";
import { PressableScale } from "@/components/ui/PressableScale";
import { PremiumBackground } from "@/components/ui";
import { useQuotaStore } from "@/store";
import { trackEvent } from "@/lib/analytics";

const DAILY_SCAN_LIMIT = 5;

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const { impact } = useHaptics();
  const remaining = useQuotaStore((s) => s.getRemainingScans());
  const quotaExhausted = remaining <= 0;

  // Track paywall view once on mount
  React.useEffect(() => {
    trackEvent("paywall_viewed", {
      remaining_scans: remaining,
      quota_exhausted: quotaExhausted,
    });
  }, []);

  const handleSubscribe = () => {
    impact();
    trackEvent("paywall_subscribe_tapped");
    router.replace("/settings/premium" as any);
  };

  const handleLater = () => {
    impact();
    trackEvent("paywall_dismissed");
    router.back();
  };

  const handleLogin = () => {
    impact();
    trackEvent("paywall_login_tapped");
    router.replace("/(auth)/welcome" as any);
  };

  return (
    <View className="flex-1">
      <PremiumBackground />

      {/* Close button */}
      <Animated.View
        entering={FadeIn.delay(200)}
        className="absolute z-10"
        style={{ top: insets.top + 12, right: 16 }}
      >
        <PressableScale
          onPress={handleLater}
          accessibilityRole="button"
          accessibilityLabel={t.common.close}
        >
          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{
              backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
            }}
          >
            <MaterialIcons name="close" size={20} color={colors.textSecondary} />
          </View>
        </PressableScale>
      </Animated.View>

      {/* Content */}
      <View
        className="flex-1 justify-center items-center px-6"
        style={{ paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 }}
      >
        {/* Logo */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)}>
          <Image
            source={require("@assets/images/logo_naqiy.webp")}
            style={{ width: 72, height: 72, marginBottom: 20 }}
            contentFit="contain"
            cachePolicy="memory-disk"
          />
        </Animated.View>

        {/* Title — adapts to remaining scans */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)} className="items-center mb-3">
          <Text className="text-2xl font-bold text-center" style={{ color: colors.textPrimary }}>
            {quotaExhausted
              ? t.paywall.title
              : t.paywall.titleRemaining.replace("{n}", String(remaining))}
          </Text>
        </Animated.View>

        {/* Subtitle */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)} className="items-center mb-8">
          <Text className="text-sm text-center leading-5" style={{ color: colors.textSecondary }}>
            {quotaExhausted ? t.paywall.subtitle : t.paywall.subtitleRemaining}
          </Text>
        </Animated.View>

        {/* Features List */}
        <Animated.View entering={FadeInUp.delay(400).duration(600)} className="w-full mb-8">
          {[
            { icon: "all-inclusive" as const, text: t.paywall.featureUnlimitedScans },
            { icon: "favorite" as const, text: t.paywall.featureFavorites },
            { icon: "history" as const, text: t.paywall.featureHistory },
            { icon: "cloud-download" as const, text: t.paywall.featureOffline },
          ].map((feature, i) => (
            <View key={i} className="flex-row items-center gap-3 mb-3">
              <View
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{
                  backgroundColor: isDark ? "rgba(212, 175, 55, 0.1)" : "rgba(212, 175, 55, 0.08)",
                }}
              >
                <MaterialIcons name={feature.icon} size={16} color={colors.primary} />
              </View>
              <Text className="text-sm flex-1" style={{ color: colors.textPrimary }}>
                {feature.text}
              </Text>
            </View>
          ))}
        </Animated.View>

        {/* Plans */}
        <Animated.View entering={FadeInUp.delay(500).duration(600)} className="w-full gap-3 mb-6">
          {/* Monthly */}
          <PressableScale onPress={handleSubscribe} accessibilityRole="button" accessibilityLabel={t.paywall.monthly}>
            <View
              className="flex-row items-center justify-between p-4 rounded-2xl"
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.cardBorder,
              }}
            >
              <View>
                <Text className="font-semibold text-sm" style={{ color: colors.textPrimary }}>
                  {t.paywall.monthly}
                </Text>
                <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
                  {t.paywall.cancelAnytime}
                </Text>
              </View>
              <Text className="font-bold text-base" style={{ color: colors.primary }}>
                2,99 {t.paywall.perMonth}
              </Text>
            </View>
          </PressableScale>

          {/* Annual (recommended) */}
          <PressableScale onPress={handleSubscribe} accessibilityRole="button" accessibilityLabel={t.paywall.annual}>
            <View
              className="flex-row items-center justify-between p-4 rounded-2xl"
              style={{
                backgroundColor: isDark ? "rgba(212, 175, 55, 0.06)" : "rgba(212, 175, 55, 0.04)",
                borderWidth: 1.5,
                borderColor: isDark ? "rgba(212, 175, 55, 0.25)" : "rgba(212, 175, 55, 0.2)",
              }}
            >
              <View>
                <View className="flex-row items-center gap-2">
                  <Text className="font-bold text-sm" style={{ color: colors.textPrimary }}>
                    {t.paywall.annual}
                  </Text>
                  <View
                    className="px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: isDark ? "rgba(212, 175, 55, 0.15)" : "rgba(212, 175, 55, 0.12)" }}
                  >
                    <Text className="text-[10px] font-bold" style={{ color: colors.primary }}>
                      -30%
                    </Text>
                  </View>
                </View>
                <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
                  {t.paywall.freeTrialDays}
                </Text>
              </View>
              <Text className="font-bold text-base" style={{ color: colors.primary }}>
                24,99 {t.paywall.perYear}
              </Text>
            </View>
          </PressableScale>
        </Animated.View>

        {/* CTA */}
        <Animated.View entering={FadeInUp.delay(600).duration(600)} className="w-full mb-4">
          <PressableScale onPress={handleSubscribe} accessibilityRole="button" accessibilityLabel={t.paywall.subscribe}>
            <View
              className="h-14 rounded-2xl items-center justify-center"
              style={{ backgroundColor: isDark ? colors.primary : "#0f172a" }}
            >
              <Text className="font-bold text-base" style={{ color: isDark ? "#0f172a" : "#fff" }}>
                {t.paywall.subscribe}
              </Text>
            </View>
          </PressableScale>
        </Animated.View>

        {/* Later button — ALWAYS visible (ethical design) */}
        <Animated.View entering={FadeIn.delay(700).duration(400)}>
          <PressableScale onPress={handleLater} accessibilityRole="button" accessibilityLabel={t.paywall.later}>
            <Text className="text-sm font-medium py-2" style={{ color: colors.textSecondary }}>
              {t.paywall.later}
            </Text>
          </PressableScale>
        </Animated.View>

        {/* Reset info */}
        <Animated.View entering={FadeIn.delay(800).duration(400)} className="mt-4">
          <Text className="text-xs text-center" style={{ color: colors.textMuted }}>
            {t.paywall.scansResetInfo}
          </Text>
        </Animated.View>

        {/* Existing account */}
        <Animated.View entering={FadeIn.delay(900).duration(400)} className="mt-3">
          <PressableScale onPress={handleLogin}>
            <Text className="text-xs text-center underline" style={{ color: colors.textSecondary }}>
              {t.paywall.existingAccount}
            </Text>
          </PressableScale>
        </Animated.View>
      </View>
    </View>
  );
}
