/**
 * PersonalAlerts Component
 *
 * Displays personalized health + allergen warnings in scan results.
 * Uses data from the user's profile (allergens, isPregnant, hasChildren)
 * cross-matched against product data by the backend.
 */

import React from "react";
import { View, Text } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import Animated, { FadeInDown } from "react-native-reanimated";

export interface PersonalAlert {
  type: "allergen" | "health" | "boycott";
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
}

const ALERT_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  allergen: "warning",
  health: "monitor-heart",
  boycott: "block",
};

export function PersonalAlerts({ alerts }: { alerts: PersonalAlert[] }) {
  const { colors, isDark } = useTheme();
  if (alerts.length === 0) return null;

  return (
    <Animated.View entering={FadeInDown.delay(280).duration(500)} className="px-4 mt-6">
      <Text
        className="text-lg font-bold text-slate-900 dark:text-white mb-3"
        accessibilityRole="header"
      >
        Alertes personnalis\u00E9es
      </Text>
      {alerts.map((alert, i) => {
        const isHigh = alert.severity === "high";
        const accentColor = isHigh ? "#ef4444" : "#f97316";
        const bgColor = isHigh
          ? isDark
            ? "rgba(239,68,68,0.1)"
            : "rgba(239,68,68,0.06)"
          : isDark
            ? "rgba(249,115,22,0.1)"
            : "rgba(249,115,22,0.06)";
        const borderColor = isHigh
          ? isDark
            ? "rgba(239,68,68,0.25)"
            : "rgba(239,68,68,0.15)"
          : isDark
            ? "rgba(249,115,22,0.25)"
            : "rgba(249,115,22,0.15)";

        return (
          <View
            key={`${alert.type}-${i}`}
            className="flex-row items-start gap-3 rounded-xl p-3 mb-2"
            style={{
              backgroundColor: bgColor,
              borderWidth: 1,
              borderColor: borderColor,
              borderLeftWidth: 3,
              borderLeftColor: accentColor,
            }}
            accessibilityRole="alert"
            accessibilityLabel={`${alert.title}. ${alert.description}`}
          >
            <MaterialIcons
              name={ALERT_ICONS[alert.type] ?? "warning"}
              size={18}
              color={accentColor}
              style={{ marginTop: 1 }}
            />
            <View className="flex-1">
              <Text className="text-sm font-semibold text-slate-900 dark:text-white">
                {alert.title}
              </Text>
              <Text className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                {alert.description}
              </Text>
            </View>
          </View>
        );
      })}
    </Animated.View>
  );
}
