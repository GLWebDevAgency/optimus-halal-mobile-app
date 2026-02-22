/**
 * Premium Paywall Screen — Optimus+
 *
 * Full-screen paywall with hero, feature list, plan cards,
 * CTA, restore purchases, and legal notice.
 * Feature-flag aware: shows "Coming soon" when payments disabled.
 * Analytics: tracks paywall_shown, purchase_started, paywall_closed.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { PressableScale } from "@/components/ui/PressableScale";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { useHaptics } from "@/hooks/useHaptics";
import { usePremium } from "@/hooks/usePremium";
import { useFeatureFlagsStore } from "@/store";
import { trackEvent } from "@/lib/analytics";

type PlanId = "monthly" | "annual" | "lifetime";

interface Plan {
  id: PlanId;
  price: string;
  period: string;
  savings?: string;
  badge?: string;
}

export default function PremiumPaywallScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const { impact } = useHaptics();
  const { isPremium } = usePremium();
  const { flags } = useFeatureFlagsStore();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("annual");

  // Analytics: track paywall shown
  useEffect(() => {
    trackEvent("premium_paywall_shown", { trigger: "settings" });
  }, []);

  // Analytics: track paywall closed on unmount
  const handleClose = useCallback(() => {
    trackEvent("premium_paywall_closed", { selected_plan: selectedPlan });
    router.back();
  }, [selectedPlan]);

  const plans: Plan[] = [
    {
      id: "monthly",
      price: "4,99 \u20ac",
      period: t.premium.perMonth,
    },
    {
      id: "annual",
      price: "29,99 \u20ac",
      period: t.premium.perYear,
      savings: t.premium.save50,
      badge: t.premium.bestValue,
    },
    {
      id: "lifetime",
      price: "79,99 \u20ac",
      period: t.premium.oneTime,
    },
  ];

  const features = [
    { icon: "favorite" as const, label: t.premium.unlimitedFavorites },
    { icon: "history" as const, label: t.premium.fullHistory },
    { icon: "mosque" as const, label: t.premium.madhabAlerts },
    { icon: "health-and-safety" as const, label: t.premium.healthProfile },
    { icon: "offline-bolt" as const, label: t.premium.offlineCache },
    { icon: "map" as const, label: t.premium.premiumMap },
    { icon: "verified" as const, label: t.premium.badge },
    { icon: "support-agent" as const, label: t.premium.prioritySupport },
  ];

  // If payments not enabled, show coming soon
  if (!flags.paymentsEnabled) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ padding: 16, flexDirection: "row", alignItems: "center" }}>
          <Pressable
            onPress={handleClose}
            hitSlop={16}
            accessibilityRole="button"
            accessibilityLabel={t.common.close}
          >
            <MaterialIcons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <MaterialIcons name="workspace-premium" size={64} color={colors.primary} />
          <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: "800", marginTop: 16, textAlign: "center" }}>
            Optimus+
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 15, textAlign: "center", marginTop: 8 }}>
            {t.common.comingSoon}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // If already premium, show status
  if (isPremium) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ padding: 16, flexDirection: "row", alignItems: "center" }}>
          <Pressable
            onPress={handleClose}
            hitSlop={16}
            accessibilityRole="button"
            accessibilityLabel={t.common.close}
          >
            <MaterialIcons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <MaterialIcons name="verified" size={64} color={colors.primary} />
          <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: "800", marginTop: 16 }}>
            {t.premium.alreadyPremium}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 15, textAlign: "center", marginTop: 8 }}>
            {t.premium.enjoyFeatures}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const handlePurchase = () => {
    impact();
    trackEvent("premium_purchase_started", { product_id: selectedPlan });
    // TODO: Replace with actual RevenueCat purchase flow
    Alert.alert("Optimus+", t.premium.purchaseComingSoon);
  };

  const handleRestore = () => {
    impact();
    Alert.alert("Optimus+", t.premium.restoreComingSoon);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Close button */}
      <View style={{ padding: 16, flexDirection: "row", alignItems: "center" }}>
        <Pressable
          onPress={handleClose}
          hitSlop={16}
          accessibilityRole="button"
          accessibilityLabel={t.common.close}
        >
          <MaterialIcons name="close" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <Animated.View entering={FadeIn.duration(400)} style={{ alignItems: "center", paddingVertical: 24 }}>
          <MaterialIcons name="workspace-premium" size={56} color={colors.primary} />
          <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "900", marginTop: 12 }}>
            Optimus+
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 15, textAlign: "center", marginTop: 6, paddingHorizontal: 32 }}>
            {t.premium.subtitle}
          </Text>
        </Animated.View>

        {/* Features */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={{ paddingHorizontal: 20, marginTop: 8 }}>
          {features.map((feature, index) => (
            <View key={index} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 12 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: isDark ? "rgba(19,236,106,0.1)" : "rgba(19,236,106,0.08)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialIcons name={feature.icon} size={20} color={colors.primary} />
              </View>
              <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "500", flex: 1 }}>
                {feature.label}
              </Text>
              <MaterialIcons name="check-circle" size={20} color={colors.primary} />
            </View>
          ))}
        </Animated.View>

        {/* Plan cards */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={{ paddingHorizontal: 20, marginTop: 24, gap: 12 }}>
          {plans.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <PressableScale
                key={plan.id}
                onPress={() => {
                  impact();
                  setSelectedPlan(plan.id);
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 16,
                    borderRadius: 14,
                    borderWidth: 2,
                    borderColor: isSelected ? colors.primary : isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                    backgroundColor: isSelected
                      ? isDark ? "rgba(19,236,106,0.08)" : "rgba(19,236,106,0.04)"
                      : "transparent",
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "700" }}>
                        {plan.price}
                      </Text>
                      {plan.badge && (
                        <View style={{ backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                          <Text style={{ color: "#0d1b13", fontSize: 11, fontWeight: "800" }}>
                            {plan.badge}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                      {plan.period}
                      {plan.savings ? ` \u00b7 ${plan.savings}` : ""}
                    </Text>
                  </View>
                  <MaterialIcons
                    name={isSelected ? "radio-button-checked" : "radio-button-unchecked"}
                    size={24}
                    color={isSelected ? colors.primary : colors.textSecondary}
                  />
                </View>
              </PressableScale>
            );
          })}
        </Animated.View>

        {/* CTA */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <PressableScale
            onPress={handlePurchase}
            accessibilityRole="button"
            accessibilityLabel={t.premium.subscribe}
          >
            <View
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 16,
                borderRadius: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#0d1b13", fontSize: 17, fontWeight: "800" }}>
                {t.premium.subscribe}
              </Text>
            </View>
          </PressableScale>
        </Animated.View>

        {/* Restore */}
        <PressableScale onPress={handleRestore} style={{ alignItems: "center", marginTop: 16 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 13, textDecorationLine: "underline" }}>
            {t.premium.restorePurchases}
          </Text>
        </PressableScale>

        {/* Legal */}
        <View style={{ alignItems: "center", marginTop: 16, paddingHorizontal: 32 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 11, textAlign: "center", lineHeight: 16, opacity: 0.7 }}>
            {t.premium.legal}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
