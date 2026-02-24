/**
 * Premium Paywall Screen — Naqiy+
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
import Animated, { FadeIn, FadeInDown, ZoomIn } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { PressableScale } from "@/components/ui/PressableScale";
import { PremiumBackground } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { useHaptics } from "@/hooks/useHaptics";
import { usePremium } from "@/hooks/usePremium";
import { useFeatureFlagsStore } from "@/store";
import { trackEvent } from "@/lib/analytics";

const GOLD = "#d4af37";

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
      <View style={{ flex: 1 }}>
        <PremiumBackground />
        <SafeAreaView style={{ flex: 1 }}>
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
            <View style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              backgroundColor: isDark ? "rgba(212, 175, 55, 0.08)" : "rgba(212, 175, 55, 0.05)",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Image
                source={require("@assets/images/logo_naqiy.webp")}
                style={{ width: 56, height: 56 }}
                contentFit="contain"
                cachePolicy="memory-disk"
              />
            </View>
            <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: "800", marginTop: 16, textAlign: "center" }}>
              Naqiy+
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 15, textAlign: "center", marginTop: 8 }}>
              {t.common.comingSoon}
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // If already premium, show status
  if (isPremium) {
    return (
      <View style={{ flex: 1 }}>
        <PremiumBackground />
        <SafeAreaView style={{ flex: 1 }}>
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
            <MaterialIcons name="verified" size={64} color={GOLD} />
            <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: "800", marginTop: 16 }}>
              {t.premium.alreadyPremium}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 15, textAlign: "center", marginTop: 8 }}>
              {t.premium.enjoyFeatures}
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const handlePurchase = () => {
    impact();
    trackEvent("premium_purchase_started", { product_id: selectedPlan });
    // TODO: Replace with actual RevenueCat purchase flow
    Alert.alert("Naqiy+", t.premium.purchaseComingSoon);
  };

  const handleRestore = () => {
    impact();
    Alert.alert("Naqiy+", t.premium.restoreComingSoon);
  };

  return (
    <View style={{ flex: 1 }}>
      <PremiumBackground />
      <SafeAreaView style={{ flex: 1 }}>
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
          <View style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            backgroundColor: isDark ? "rgba(212, 175, 55, 0.08)" : "rgba(212, 175, 55, 0.05)",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Image
              source={require("@assets/images/logo_naqiy.webp")}
              style={{ width: 50, height: 50 }}
              contentFit="contain"
              cachePolicy="memory-disk"
            />
          </View>
          <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: "900", marginTop: 12 }}>
            Naqiy+
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
                  backgroundColor: isDark ? "rgba(212,175,55,0.1)" : "rgba(212,175,55,0.08)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialIcons name={feature.icon} size={20} color={GOLD} />
              </View>
              <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "500", flex: 1 }}>
                {feature.label}
              </Text>
              <MaterialIcons name="check-circle" size={20} color={GOLD} />
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
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: isSelected ? GOLD : isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                    backgroundColor: isSelected
                      ? isDark ? "rgba(212,175,55,0.06)" : "rgba(212,175,55,0.04)"
                      : isDark ? "rgba(255,255,255,0.03)" : "transparent",
                    ...(isSelected && {
                      shadowColor: GOLD,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 12,
                      elevation: 4,
                    }),
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "700" }}>
                        {plan.price}
                      </Text>
                      {plan.badge && (
                        <View style={{ backgroundColor: "rgba(212,175,55,0.15)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                          <Text style={{ color: GOLD, fontSize: 11, fontWeight: "800" }}>
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
                  {isSelected ? (
                    <Animated.View entering={ZoomIn.springify()}>
                      <MaterialIcons name="check-circle" size={24} color={GOLD} />
                    </Animated.View>
                  ) : (
                    <MaterialIcons name="radio-button-unchecked" size={24} color={colors.textSecondary} />
                  )}
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
                borderRadius: 16,
                overflow: "hidden",
                shadowColor: "#10b981",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 20,
                elevation: 8,
              }}
            >
              <LinearGradient
                colors={["#10b981", "#059669"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  paddingVertical: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 8,
                  borderRadius: 16,
                }}
              >
                <Text style={{ color: "#ffffff", fontSize: 17, fontWeight: "800" }}>
                  {t.premium.subscribe}
                </Text>
              </LinearGradient>
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
    </View>
  );
}
