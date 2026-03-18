/**
 * AlertPillStrip — Inline wrapped alert tags.
 *
 * Compact inline format: icon + text on the same line (e.g. "⚠ contient: lait").
 * Wraps to multiple lines if needed instead of horizontal scroll.
 *
 * @module components/scan/AlertPillStrip
 */

import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import {
  HandHeartIcon,
  WarningCircleIcon,
  PillIcon,
} from "phosphor-react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { fontSize as fontSizeTokens, fontWeight as fontWeightTokens } from "@/theme/typography";
import { spacing } from "@/theme/spacing";
import type { PersonalAlert } from "./scan-types";

// ── Color + icon mapping ──

const ALERT_CONFIG: Record<string, { color: string; Icon: typeof HandHeartIcon }> = {
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

// ── Component ──

export function AlertPillStrip({
  alerts,
  onPillPress,
}: AlertPillStripProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  if (alerts.length === 0) return null;

  const sorted = [...alerts].sort((a, b) => {
    const order: Record<string, number> = { boycott: 0, allergen: 1, health: 2 };
    return (order[a.type] ?? 3) - (order[b.type] ?? 3);
  });

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.wrapper}>
      <Text style={[styles.sectionTitle, { color: isDark ? "#ffffff80" : "#00000060" }]}>
        {t.scanResult.myPersonalAlerts}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {sorted.map((alert, idx) => (
          <InlineAlert key={`${alert.type}-${idx}`} alert={alert} onPress={onPillPress} />
        ))}
      </ScrollView>
    </Animated.View>
  );
}

// ── InlineAlert — icon + text on same line ──

function InlineAlert({ alert, onPress }: { alert: PersonalAlert; onPress?: (alert: PersonalAlert) => void }) {
  const { isDark } = useTheme();
  const config = ALERT_CONFIG[alert.type] ?? ALERT_CONFIG.health;
  const { color, Icon } = config;

  const content = (
    <View style={[styles.tag, {
      backgroundColor: isDark ? `${color}14` : `${color}0C`,
    }]}>
      <Icon size={13} color={color} weight="bold" />
      <Text style={[styles.tagText, { color }]} numberOfLines={1}>
        {alert.title}
      </Text>
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      onPress={() => onPress(alert)}
      accessibilityRole="button"
      accessibilityLabel={alert.title}
      style={({ pressed }) => pressed ? styles.pressed : undefined}
    >
      {content}
    </Pressable>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
    marginBottom: -spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.medium,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  container: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: spacing.sm,
  },
  tagText: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.semiBold,
  },
  pressed: {
    opacity: 0.7,
  },
});
