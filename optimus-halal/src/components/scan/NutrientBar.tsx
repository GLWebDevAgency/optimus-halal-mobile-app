/**
 * NutrientBar — Per-nutrient horizontal bar with tiered level colors.
 *
 * Inspired by Yuka's NutritionFact display: each nutrient gets a
 * colored bar showing its level (very_low → very_high) and %DRV.
 *
 * Negative nutrients (fat, sugar, salt) use red for high values.
 * Positive nutrients (fiber, proteins) use green for high values.
 */

import React, { useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInRight,
} from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { spacing, radius } from "@/theme/spacing";
import { fontSize, fontWeight } from "@/theme/typography";
import { springNaqiy } from "@/theme/animations";
import type { NutrientLevel } from "@/services/api/types";

interface NutrientBarProps {
  label: string;
  value: number;
  unit: string;
  level: NutrientLevel;
  dailyValuePercent: number;
  isNegative: boolean;
  /** Stagger index for entry animation */
  index?: number;
  /** Called when the bar is tapped (opens detail sheet) */
  onPress?: () => void;
}

// Color mapping: for negative nutrients, red = bad; for positive, green = good
const LEVEL_COLORS_NEGATIVE: Record<NutrientLevel, string> = {
  very_low: "#22c55e",  // excellent (green)
  low: "#84cc16",       // good (lime)
  moderate: "#eab308",  // moderate (yellow)
  high: "#f97316",      // concerning (orange)
  very_high: "#ef4444", // bad (red)
};

const LEVEL_COLORS_POSITIVE: Record<NutrientLevel, string> = {
  very_low: "#ef4444",  // poor (red)
  low: "#f97316",       // low (orange)
  moderate: "#eab308",  // moderate (yellow)
  high: "#84cc16",      // good (lime)
  very_high: "#22c55e", // excellent (green)
};

// Bar fill percentage per level
const LEVEL_FILL: Record<NutrientLevel, number> = {
  very_low: 10,
  low: 30,
  moderate: 50,
  high: 75,
  very_high: 95,
};

export const NutrientBar = React.memo(function NutrientBar({
  label,
  value,
  unit,
  level,
  dailyValuePercent,
  isNegative,
  index = 0,
  onPress,
}: NutrientBarProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const barWidth = useSharedValue(0);

  const LEVEL_KEYS: Record<string, string> = {
    very_low: "nutrientLevelVeryLow",
    low: "nutrientLevelLow",
    moderate: "nutrientLevelModerate",
    high: "nutrientLevelHigh",
    very_high: "nutrientLevelVeryHigh",
  };
  const levelLabel = (t.scanResult[LEVEL_KEYS[level] as keyof typeof t.scanResult] as string) ?? level.replace(/_/g, " ");

  const levelColor = isNegative
    ? LEVEL_COLORS_NEGATIVE[level]
    : LEVEL_COLORS_POSITIVE[level];

  const targetWidth = LEVEL_FILL[level];

  useEffect(() => {
    barWidth.value = withSpring(targetWidth, springNaqiy);
  }, [targetWidth]);

  const barAnimStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value}%`,
  }));

  const content = (
    <Animated.View
      entering={FadeInRight.delay(index * 60).duration(250)}
      style={styles.container}
    >
      {/* Top row: label + value */}
      <View style={styles.topRow}>
        <Text style={[styles.label, { color: colors.textPrimary }]} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[styles.value, { color: colors.textSecondary }]}>
          {value}{unit}
        </Text>
      </View>

      {/* Bar */}
      <View style={[styles.barTrack, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }]}>
        <Animated.View
          style={[
            styles.barFill,
            { backgroundColor: levelColor },
            barAnimStyle,
          ]}
        />
      </View>

      {/* Bottom row: level label + %DRV */}
      <View style={styles.bottomRow}>
        <View style={[styles.levelBadge, { backgroundColor: `${levelColor}20` }]}>
          <Text style={[styles.levelText, { color: levelColor }]}>
            {levelLabel}
          </Text>
        </View>
        <Text style={[styles.drv, { color: colors.textMuted }]}>
          {dailyValuePercent}% VNR
        </Text>
      </View>
    </Animated.View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }
  return content;
});

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  value: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.semiBold,
    marginLeft: spacing.md,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 3,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  levelBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  levelText: {
    fontSize: fontSize.micro,
    fontWeight: fontWeight.bold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  drv: {
    fontSize: fontSize.micro,
  },
});

export default NutrientBar;
