import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { usePremium, useTranslation, useTheme, useHaptics } from "@/hooks";
import { useFeatureFlagsStore } from "@/store";

interface PremiumGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Wraps premium-only content.
 * If paymentsEnabled=false OR user is premium: renders children.
 * If paymentsEnabled=true AND user is free: renders fallback or upgrade prompt.
 */
export function PremiumGate({ feature, children, fallback }: PremiumGateProps) {
  const { flags } = useFeatureFlagsStore();
  const { isPremium, showPaywall } = usePremium();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { impact } = useHaptics();

  // Gates inactive when payments disabled
  if (!flags.paymentsEnabled || isPremium) {
    return <>{children}</>;
  }

  if (fallback) return <>{fallback}</>;

  // Default upgrade prompt
  return (
    <View
      style={{
        padding: 20,
        alignItems: "center",
        backgroundColor: isDark
          ? "rgba(19,236,106,0.05)"
          : "rgba(19,236,106,0.03)",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: isDark
          ? "rgba(19,236,106,0.15)"
          : "rgba(19,236,106,0.1)",
        margin: 16,
      }}
    >
      <MaterialIcons name="workspace-premium" size={32} color="#13ec6a" />
      <Text
        style={{
          color: colors.textPrimary,
          fontSize: 16,
          fontWeight: "700",
          marginTop: 8,
          textAlign: "center",
        }}
      >
        Optimus+
      </Text>
      <Text
        style={{
          color: colors.textSecondary,
          fontSize: 13,
          textAlign: "center",
          marginTop: 4,
        }}
      >
        {t.common.premiumRequired}
      </Text>
      <TouchableOpacity
        onPress={() => {
          impact();
          showPaywall();
        }}
        style={{
          marginTop: 12,
          backgroundColor: "#13ec6a",
          paddingHorizontal: 24,
          paddingVertical: 10,
          borderRadius: 12,
        }}
        accessibilityRole="button"
        accessibilityLabel="Upgrade to Optimus+"
      >
        <Text style={{ color: "#0d1b13", fontWeight: "700", fontSize: 14 }}>
          {t.common.upgrade}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
