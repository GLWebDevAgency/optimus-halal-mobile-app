/**
 * Soft Paywall Screen
 *
 * Affiché quand un utilisateur anonyme atteint sa limite de 5 scans/jour.
 * Design éthique : bouton "Plus tard" TOUJOURS visible, pas de dark pattern.
 */

import React from "react";
import { View, Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XIcon } from "phosphor-react-native";
import { Image } from "expo-image";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { useHaptics } from "@/hooks";
import { PressableScale } from "@/components/ui/PressableScale";
import { PremiumBackground } from "@/components/ui";
import { useQuotaStore } from "@/store";
import { trackEvent } from "@/lib/analytics";
import { AppIcon } from "@/lib/icons";
import { restorePurchases, isPremiumCustomer } from "@/services/purchases";
import { useTrialStore } from "@/store";
import type { PaywallTrigger } from "@/types/paywall";

const DAILY_SCAN_LIMIT = 5;

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const { impact } = useHaptics();
  const { trigger = "generic" } = useLocalSearchParams<{ trigger?: PaywallTrigger }>();
  const remaining = useQuotaStore((s) => s.getRemainingScans());
  const quotaExhausted = remaining <= 0;
  const trialExpired = useTrialStore((s) => s.hasTrialExpired());
  const [isRestoring, setIsRestoring] = React.useState(false);
  const [restoreMessage, setRestoreMessage] = React.useState<string | null>(null);

  // Define all features with their associated trigger
  const allFeatures = [
    { icon: "all-inclusive" as const, text: t.paywall.featureUnlimitedScans, trigger: "scan_quota" },
    { icon: "favorite" as const, text: t.paywall.featureFavorites, trigger: "favorites" },
    { icon: "history" as const, text: t.paywall.featureHistory, trigger: "history" },
    { icon: "cloud-download" as const, text: t.paywall.featureOffline, trigger: "offline" },
  ];

  // Reorder: matching trigger first, rest unchanged
  const features = [...allFeatures].sort((a, b) => {
    if (a.trigger === trigger) return -1;
    if (b.trigger === trigger) return 1;
    return 0;
  });

  // Track paywall view once on mount
  React.useEffect(() => {
    trackEvent("paywall_viewed", {
      remaining_scans: remaining,
      quota_exhausted: quotaExhausted,
      trigger,
    });
  }, []);

  const handleSubscribe = () => {
    impact();
    trackEvent("paywall_subscribe_tapped", { trigger });
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

  const handleRestore = async () => {
    setIsRestoring(true);
    setRestoreMessage(null);
    impact();
    trackEvent("paywall_restore_tapped");

    try {
      const info = await restorePurchases();
      if (isPremiumCustomer(info)) {
        trackEvent("paywall_restore_success");
        // User has an active entitlement — send them to create/login
        router.replace("/(auth)/signup" as any);
      } else {
        setRestoreMessage(t.paywall.noSubscriptionFound);
      }
    } catch {
      setRestoreMessage(t.paywall.restoreFailed);
    } finally {
      setIsRestoring(false);
    }
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
            <XIcon size={20} color={colors.textSecondary} />
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

        {/* Title — adapts to context (trial expired > quota exhausted > remaining) */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)} className="items-center mb-3">
          <Text className="text-2xl font-bold text-center" style={{ color: colors.textPrimary }}>
            {trialExpired
              ? t.paywall.trialExpired
              : quotaExhausted
                ? t.paywall.title
                : t.paywall.titleRemaining.replace("{n}", String(remaining))}
          </Text>
        </Animated.View>

        {/* Subtitle */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)} className="items-center mb-8">
          <Text className="text-sm text-center leading-5" style={{ color: colors.textSecondary }}>
            {trialExpired
              ? t.paywall.trialExpiredSubtitle
              : quotaExhausted
                ? t.paywall.subtitle
                : t.paywall.subtitleRemaining}
          </Text>
        </Animated.View>

        {/* Features List — reordered by trigger context */}
        <Animated.View entering={FadeInUp.delay(400).duration(600)} className="w-full mb-8">
          {features.map((feature, i) => (
            <View key={i} className="flex-row items-center gap-3 mb-3">
              <View
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{
                  backgroundColor: isDark ? "rgba(212, 175, 55, 0.1)" : "rgba(212, 175, 55, 0.08)",
                }}
              >
                <AppIcon name={feature.icon} size={16} color={colors.primary} />
              </View>
              <Text className="text-sm flex-1" style={{ color: colors.textPrimary }}>
                {feature.text}
              </Text>
            </View>
          ))}
        </Animated.View>

        {/* SANS ENGAGEMENT — prominent badge */}
        <Animated.View entering={FadeInUp.delay(450).duration(600)} className="items-center mb-5">
          <View
            className="px-4 py-1.5 rounded-full"
            style={{
              backgroundColor: isDark ? "rgba(34, 197, 94, 0.1)" : "rgba(34, 197, 94, 0.08)",
              borderWidth: 1,
              borderColor: isDark ? "rgba(34, 197, 94, 0.2)" : "rgba(34, 197, 94, 0.15)",
            }}
          >
            <Text className="text-xs font-bold tracking-wider" style={{ color: isDark ? "#4ade80" : "#16a34a" }}>
              {t.paywall.cancelAnytime}
            </Text>
          </View>
          <Text className="text-[11px] mt-1" style={{ color: colors.textMuted }}>
            {t.paywall.cancelAnytimeDetail}
          </Text>
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

        {/* CTA — mission-driven tone */}
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

        {/* Mission footer — community reciprocity */}
        <Animated.View entering={FadeIn.delay(800).duration(400)} className="mt-4">
          <Text className="text-xs text-center italic" style={{ color: colors.textMuted }}>
            {t.paywall.missionFooter}
          </Text>
        </Animated.View>

        {/* Reset info */}
        <Animated.View entering={FadeIn.delay(850).duration(400)} className="mt-2">
          <Text className="text-xs text-center" style={{ color: colors.textMuted }}>
            {t.paywall.scansResetInfo}
          </Text>
        </Animated.View>

        {/* Restore purchases — critical for "paid but quit before signup" */}
        <Animated.View entering={FadeIn.delay(900).duration(400)} className="mt-4">
          <PressableScale
            onPress={handleRestore}
            disabled={isRestoring}
            accessibilityRole="button"
            accessibilityLabel={t.paywall.restorePurchases}
          >
            <Text
              className="text-xs text-center font-medium"
              style={{ color: colors.primary, opacity: isRestoring ? 0.5 : 1 }}
            >
              {isRestoring ? t.paywall.restoring : t.paywall.restorePurchases}
            </Text>
          </PressableScale>
          {restoreMessage && (
            <Text className="text-[11px] text-center mt-1" style={{ color: colors.textMuted }}>
              {restoreMessage}
            </Text>
          )}
        </Animated.View>

        {/* Existing account */}
        <Animated.View entering={FadeIn.delay(1000).duration(400)} className="mt-3">
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
