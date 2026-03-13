/**
 * AlertPillStrip — Compact horizontal pill strip for alerts.
 *
 * Replaces BoycottCard (~200px red glow) + AlertStripCard (separate component)
 * with a single ~56px horizontal scrollable row of compact pills.
 *
 * @module components/scan/AlertPillStrip
 */

import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import {
  HandHeartIcon,
  WarningCircleIcon,
  PillIcon,
  CaretRightIcon,
} from "phosphor-react-native";
import Animated, { FadeInRight } from "react-native-reanimated";
import { PressableScale } from "@/components/ui/PressableScale";
import { useTheme } from "@/hooks/useTheme";
import { fontSize as fontSizeTokens, fontWeight as fontWeightTokens } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import type { PersonalAlert } from "./scan-types";

// ── Pill color mapping ──

const PILL_CONFIG: Record<string, { color: string; Icon: typeof HandHeartIcon }> = {
  boycott:  { color: "#ef4444", Icon: HandHeartIcon },
  allergen: { color: "#f97316", Icon: WarningCircleIcon },
  health:   { color: "#3b82f6", Icon: PillIcon },
};

// ── Props ──

export interface AlertPillStripProps {
  alerts: PersonalAlert[];
  staggerIndex?: number;
  onPillPress?: (alert: PersonalAlert) => void;
}

// ── Sub-component: AlertPill ──

function AlertPill({
  alert,
  index,
  onPress,
}: {
  alert: PersonalAlert;
  index: number;
  onPress?: (alert: PersonalAlert) => void;
}) {
  const { isDark } = useTheme();
  const config = PILL_CONFIG[alert.type] ?? PILL_CONFIG.health;
  const { color, Icon } = config;

  return (
    <Animated.View
      entering={FadeInRight.duration(250).delay(index * 80).springify()}
    >
      <PressableScale
        onPress={() => onPress?.(alert)}
        style={[styles.pill, {
          backgroundColor: isDark ? `${color}1A` : `${color}14`,
          borderColor: isDark ? `${color}40` : `${color}30`,
        }]}
        accessibilityRole="button"
        accessibilityLabel={alert.title}
      >
        <View style={[styles.iconCircle, { backgroundColor: `${color}26` }]}>
          <Icon size={11} color={color} weight="bold" />
        </View>
        <Text
          style={[styles.pillLabel, { color }]}
          numberOfLines={1}
        >
          {alert.title}
        </Text>
        <CaretRightIcon size={10} color={`${color}80`} />
      </PressableScale>
    </Animated.View>
  );
}

// ── Main Component ──

export function AlertPillStrip({
  alerts,
  staggerIndex = 1,
  onPillPress,
}: AlertPillStripProps) {
  if (alerts.length === 0) return null;

  // Sort: boycott first, then allergens, then health
  const sorted = [...alerts].sort((a, b) => {
    const order: Record<string, number> = { boycott: 0, allergen: 1, health: 2 };
    return (order[a.type] ?? 3) - (order[b.type] ?? 3);
  });

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.scroll}
    >
      {sorted.map((alert, idx) => (
        <AlertPill
          key={`${alert.type}-${idx}`}
          alert={alert}
          index={idx}
          onPress={onPillPress}
        />
      ))}
    </ScrollView>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  scroll: {
    marginHorizontal: -spacing.xl,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  iconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  pillLabel: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.semiBold,
    maxWidth: 200,
  },
});
