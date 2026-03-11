/**
 * DietaryChip — Compact indicator for dietary concerns.
 *
 * Shows one dietary concern (gluten, lactose, palm oil, vegetarian, vegan)
 * with a tri-state visual: safe (green), contains (red), unknown (gray).
 *
 * Inspired by Yuka's diet system — 5 auto-detected concerns displayed
 * as a horizontal scrollable row of compact chips.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { CheckIcon, QuestionIcon, XIcon } from "phosphor-react-native";
import Animated, { FadeInRight } from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { semantic } from "@/theme/colors";
import { spacing, radius } from "@/theme/spacing";
import { fontSize, fontWeight } from "@/theme/typography";
import { AppIcon, type IconName } from "@/lib/icons";

export type DietaryStatus = "safe" | "contains" | "unknown";

interface DietaryChipProps {
  label: string;
  status: DietaryStatus;
  icon: IconName;
  /** Stagger index for entry animation */
  index?: number;
}

const STATUS_CONFIG: Record<DietaryStatus, { color: string; bgOpacity: string; borderOpacity: string }> = {
  safe: {
    color: semantic.success.base,
    bgOpacity: "12",
    borderOpacity: "25",
  },
  contains: {
    color: semantic.danger.base,
    bgOpacity: "12",
    borderOpacity: "25",
  },
  unknown: {
    color: "#6b7280",
    bgOpacity: "10",
    borderOpacity: "20",
  },
};

export const DietaryChip = React.memo(function DietaryChip({
  label,
  status,
  icon,
  index = 0,
}: DietaryChipProps) {
  const { isDark, colors } = useTheme();
  const config = STATUS_CONFIG[status];

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 70).duration(250)}
      accessible
      accessibilityLabel={`${label}: ${status === "safe" ? "OK" : status === "contains" ? "contient" : "inconnu"}`}
      style={[
        styles.chip,
        {
          backgroundColor: `${config.color}${config.bgOpacity}`,
          borderColor: `${config.color}${config.borderOpacity}`,
        },
      ]}
    >
      <AppIcon name={icon} size={14} color={config.color} />
      <Text style={[styles.label, { color: config.color }]} numberOfLines={1}>
        {label}
      </Text>
      {status === "safe" && (
        <CheckIcon size={12} color={config.color} />
      )}
      {status === "contains" && (
        <XIcon size={12} color={config.color} />
      )}
      {status === "unknown" && (
        <QuestionIcon size={12} color={config.color} />
      )}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semiBold,
  },
});

export default DietaryChip;
