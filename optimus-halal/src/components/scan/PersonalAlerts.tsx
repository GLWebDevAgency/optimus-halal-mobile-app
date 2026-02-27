/**
 * PersonalAlerts Component
 *
 * Displays personalized health + allergen warnings in scan results.
 * Uses data from the user's profile (allergens, isPregnant, hasChildren)
 * cross-matched against product data by the backend.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import Animated, { FadeInDown } from "react-native-reanimated";
import { semantic, halalStatus } from "@/theme/colors";
import { spacing, radius } from "@/theme/spacing";
import { fontSize, fontWeight } from "@/theme/typography";

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
  const { t } = useTranslation();
  if (alerts.length === 0) return null;

  return (
    <Animated.View entering={FadeInDown.delay(280).duration(500)} style={styles.container}>
      <View style={styles.headingRow}>
        <MaterialIcons name="person-pin" size={18} color={semantic.danger.base} />
        <Text
          style={[styles.heading, { color: colors.textPrimary }]}
          accessibilityRole="header"
        >
          {t.scanResult.personalAlerts}
        </Text>
      </View>
      {alerts.map((alert, i) => {
        const isHigh = alert.severity === "high";
        const accentColor = isHigh ? semantic.danger.base : halalStatus.doubtful.base;

        return (
          <View
            key={`${alert.type}-${i}`}
            style={[
              styles.alertCard,
              {
                backgroundColor: `${accentColor}${isDark ? "1A" : "0F"}`,
                borderColor: `${accentColor}${isDark ? "40" : "26"}`,
                borderLeftColor: accentColor,
              },
            ]}
            accessibilityRole="alert"
            accessibilityLabel={`${alert.title}. ${alert.description}`}
          >
            <MaterialIcons
              name={ALERT_ICONS[alert.type] ?? "warning"}
              size={18}
              color={accentColor}
              style={styles.alertIcon}
            />
            <View style={styles.alertContent}>
              <Text style={[styles.alertTitle, { color: colors.textPrimary }]}>
                {alert.title}
              </Text>
              <Text style={[styles.alertDesc, { color: colors.textSecondary }]}>
                {alert.description}
              </Text>
            </View>
          </View>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing["3xl"],
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  heading: {
    fontSize: fontSize.h4,
    fontWeight: fontWeight.bold,
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.lg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderLeftWidth: 3,
  },
  alertIcon: {
    marginTop: 1,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.semiBold,
  },
  alertDesc: {
    fontSize: fontSize.caption,
    marginTop: spacing["2xs"],
    lineHeight: 18,
  },
});
