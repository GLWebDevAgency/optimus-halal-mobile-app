/**
 * NutrientBar — Yuka-Style Per-Nutrient Colored Bar
 *
 * Single-row layout with animated fill bar.
 * Negative nutrients (fat, sugar, salt): red = bad, green = good.
 * Positive nutrients (fiber, protein): green = good, red = bad.
 *
 * @module components/scan/NutrientBar
 */

import React, { useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { InfoIcon } from "phosphor-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useReducedMotion } from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { spacing, radius } from "@/theme/spacing";
import { fontSize, fontWeight } from "@/theme/typography";
import { NUTRIENT_BAR_COLORS } from "./scan-constants";

// ── Types ──

export interface NutrientBarProps {
  name: string;
  value: number;
  unit: string;
  percentage: number;         // 0-100 of daily value
  level: "very_low" | "low" | "moderate" | "high" | "very_high";
  isPositive: boolean;        // fiber/protein = positive
  indented?: boolean;         // "dont saturés" style
  staggerIndex: number;
  onInfoPress?: () => void;
}

// ── Level label keys ──

const LEVEL_LABEL_KEYS: Record<string, string> = {
  very_low: "levelVeryLow",
  low: "levelLow",
  moderate: "levelModerate",
  high: "levelHigh",
  very_high: "levelVeryHigh",
};

// ── Component ──

export const NutrientBar = React.memo(function NutrientBar({
  name,
  value,
  unit,
  percentage,
  level,
  isPositive,
  indented = false,
  staggerIndex,
  onInfoPress,
}: NutrientBarProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();

  const colorMap = isPositive ? NUTRIENT_BAR_COLORS.positive : NUTRIENT_BAR_COLORS.negative;
  const barColor = colorMap[level];

  // Animated bar fill
  const barWidth = useSharedValue(0);
  const targetWidth = Math.min(percentage, 100);

  useEffect(() => {
    if (reducedMotion) {
      barWidth.value = targetWidth;
    } else {
      barWidth.value = withTiming(targetWidth, {
        duration: 800,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [targetWidth, reducedMotion]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value}%`,
  }));

  const levelLabel = (t.scanResult as Record<string, string>)[LEVEL_LABEL_KEYS[level]] ?? level;

  return (
    <View
      style={[styles.row, indented && styles.indented]}
      accessibilityLabel={`${name}: ${value}${unit}, ${levelLabel}, ${percentage}% valeur quotidienne`}
    >
      {/* Name */}
      <Text
        style={[styles.name, { color: colors.textPrimary }]}
        numberOfLines={1}
      >
        {name}
      </Text>

      {/* Value */}
      <Text style={[styles.value, { color: colors.textSecondary }]}>
        {value}{unit}
      </Text>

      {/* Bar */}
      <View style={[styles.barTrack, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }]}>
        <Animated.View
          style={[styles.barFill, { backgroundColor: barColor }, barStyle]}
        />
      </View>

      {/* Level label */}
      <Text style={[styles.levelText, { color: barColor }]} numberOfLines={1}>
        {levelLabel}
      </Text>

      {/* % DV */}
      <Text style={[styles.percent, { color: colors.textMuted }]}>
        {percentage}%
      </Text>

      {/* Info icon */}
      {onInfoPress && (
        <Pressable
          onPress={onInfoPress}
          hitSlop={8}
          style={styles.infoButton}
          accessibilityRole="button"
          accessibilityLabel={`Détail ${name}`}
        >
          <InfoIcon size={16} color={colors.textMuted} />
        </Pressable>
      )}
    </View>
  );
});

// ── Styles ──

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    height: 36,
    gap: spacing.sm,
  },
  indented: {
    paddingLeft: spacing.lg,
  },
  name: {
    width: 80,
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.regular,
  },
  value: {
    width: 48,
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.medium,
    textAlign: "right",
  },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: radius.full,
  },
  levelText: {
    width: 56,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semiBold,
    textAlign: "center",
  },
  percent: {
    width: 32,
    fontSize: fontSize.caption,
    textAlign: "right",
  },
  infoButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default NutrientBar;
