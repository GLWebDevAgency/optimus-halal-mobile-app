/**
 * HealthEffectBadge — Additive health effect indicator.
 *
 * Inspired by Yuka's HealthEffect pattern: 4 types of health effects
 * (endocrine disruptor, allergen, irritant, carcinogenic) each with
 * a confirmed vs. potential distinction.
 *
 * Confirmed effects use filled badges, potential uses outlined badges.
 */

import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { spacing, radius } from "@/theme/spacing";
import { fontSize, fontWeight } from "@/theme/typography";
import type { HealthEffectType } from "@/services/api/types";

interface HealthEffectBadgeProps {
  type: HealthEffectType;
  confirmed: boolean;
  /** Compact mode for inline display */
  compact?: boolean;
}

interface EffectConfig {
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  labelKey: string;
  label: string;
}

const EFFECT_CONFIG: Record<HealthEffectType, EffectConfig> = {
  endocrine_disruptor: {
    icon: "warning",
    color: "#7c3aed", // purple
    labelKey: "healthEffectEndocrineDisruptor",
    label: "Perturbateur endocrinien",
  },
  allergen: {
    icon: "do-not-disturb-alt",
    color: "#f59e0b", // amber
    labelKey: "healthEffectAllergen",
    label: "Allergène",
  },
  irritant: {
    icon: "local-fire-department",
    color: "#f97316", // orange
    labelKey: "healthEffectIrritant",
    label: "Irritant",
  },
  carcinogenic: {
    icon: "dangerous",
    color: "#ef4444", // red
    labelKey: "healthEffectCarcinogenic",
    label: "Cancérogène",
  },
};

export const HealthEffectBadge = React.memo(function HealthEffectBadge({
  type,
  confirmed,
  compact = false,
}: HealthEffectBadgeProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const config = EFFECT_CONFIG[type];
  const label = (t.scanResult[config.labelKey as keyof typeof t.scanResult] as string) ?? config.label;
  const confirmedLabel = (t.scanResult.healthEffectConfirmed as string) ?? "Avéré";
  const potentialLabel = (t.scanResult.healthEffectPotential as string) ?? "Potentiel";

  if (compact) {
    return (
      <View
        style={[
          styles.compactBadge,
          confirmed
            ? { backgroundColor: `${config.color}20` }
            : { backgroundColor: "transparent", borderWidth: 1, borderColor: `${config.color}40` },
        ]}
      >
        <MaterialIcons name={config.icon} size={12} color={config.color} />
        <Text style={[styles.compactText, { color: config.color }]} numberOfLines={1}>
          {confirmed ? label : `${label} ?`}
        </Text>
      </View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(300)}>
      <View
        style={[
          styles.badge,
          confirmed
            ? { backgroundColor: `${config.color}15`, borderColor: `${config.color}30` }
            : { backgroundColor: "transparent", borderColor: `${config.color}30`, ...(Platform.OS === "ios" ? { borderStyle: "dashed" as const } : {}) },
        ]}
      >
        <View style={[styles.iconCircle, { backgroundColor: `${config.color}20` }]}>
          <MaterialIcons name={config.icon} size={16} color={config.color} />
        </View>
        <View style={styles.textColumn}>
          <Text style={[styles.label, { color: config.color }]} numberOfLines={1}>
            {label}
          </Text>
          <Text style={[styles.status, { color: colors.textMuted }]}>
            {confirmed ? confirmedLabel : potentialLabel}
          </Text>
        </View>
        {!confirmed && (
          <View style={[styles.potentialBadge, { borderColor: `${config.color}40` }]}>
            <Text style={[styles.potentialText, { color: config.color }]}>?</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  textColumn: {
    flex: 1,
  },
  label: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.semiBold,
  },
  status: {
    fontSize: fontSize.caption,
    marginTop: 1,
  },
  potentialBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  potentialText: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
  },
  // Compact variant
  compactBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: radius.full,
    gap: spacing.xs,
  },
  compactText: {
    fontSize: fontSize.micro,
    fontWeight: fontWeight.semiBold,
  },
});

export default HealthEffectBadge;
