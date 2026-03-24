import React, { useRef, useEffect } from "react";
import { View, Text } from "react-native";
import { SparkleIcon, LockIcon } from "phosphor-react-native";
import { useAiQuotaStore, useFeatureFlagsStore } from "@/store";
import { usePremium, useTranslation, useTheme, useHaptics } from "@/hooks";
import { PressableScale } from "./PressableScale";

interface AiAnalysisGateProps {
  children: React.ReactNode;
}

/**
 * Gates AI-powered detailed analysis sections.
 *
 * - Payments disabled: always renders children (dev mode)
 * - Premium/Trial users: always renders children
 * - Free users with remaining quota: renders children + auto-decrements
 * - Free users with exhausted quota: renders upgrade prompt
 *
 * The basic scan verdict (halal/haram/douteux + NaqiyScore) is NEVER gated.
 * Only the detailed AI analysis (ingredient breakdown, health impact, scholarly refs) is gated.
 */
export function AiAnalysisGate({ children }: AiAnalysisGateProps) {
  const { flags } = useFeatureFlagsStore();
  const { isPremium, showPaywall, isTrialActive } = usePremium();
  const remaining = useAiQuotaStore((s) => s.getRemainingAiAnalyses());
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { impact } = useHaptics();
  const consumed = useRef(false);

  // Bypass conditions — computed before hooks to respect Rules of Hooks
  const isBypassed = !flags.paymentsEnabled || isPremium || isTrialActive;

  // Auto-consume quota on first render (must be called unconditionally — Rules of Hooks)
  useEffect(() => {
    if (isBypassed) return;
    if (!consumed.current && remaining > 0) {
      consumed.current = true;
      useAiQuotaStore.getState().incrementAiAnalysis();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- mount-only

  if (isBypassed) {
    return <>{children}</>;
  }

  const shouldShow = remaining > 0 || consumed.current;
  if (shouldShow) {
    return <>{children}</>;
  }

  // Free user, quota exhausted — show gate
  return (
    <View
      style={{
        padding: 24,
        alignItems: "center",
        backgroundColor: isDark ? "rgba(212, 175, 55, 0.06)" : "rgba(212, 175, 55, 0.04)",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: isDark ? "rgba(212, 175, 55, 0.15)" : "rgba(212, 175, 55, 0.1)",
        margin: 16,
        marginTop: 8,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <SparkleIcon size={20} color={colors.primary} weight="fill" />
        <LockIcon size={16} color={colors.textSecondary} />
      </View>
      <Text
        style={{
          color: colors.textPrimary,
          fontSize: 15,
          fontWeight: "700",
          textAlign: "center",
        }}
      >
        {t.aiQuota.gateTitle}
      </Text>
      <Text
        style={{
          color: colors.textSecondary,
          fontSize: 13,
          textAlign: "center",
          marginTop: 6,
          lineHeight: 18,
        }}
      >
        {t.aiQuota.gateSubtitle}
      </Text>
      <PressableScale
        onPress={() => {
          impact();
          showPaywall("ai_analysis_quota");
        }}
        style={{
          marginTop: 16,
          backgroundColor: colors.primary,
          paddingHorizontal: 24,
          paddingVertical: 10,
          borderRadius: 12,
        }}
        accessibilityRole="button"
        accessibilityLabel={t.aiQuota.upgradeCta}
      >
        <Text style={{ color: isDark ? "#0f172a" : "#fff", fontWeight: "700", fontSize: 14 }}>
          {t.aiQuota.upgradeCta}
        </Text>
      </PressableScale>
      <Text
        style={{
          color: colors.textMuted,
          fontSize: 11,
          textAlign: "center",
          marginTop: 10,
        }}
      >
        {t.aiQuota.resetInfo}
      </Text>
    </View>
  );
}
