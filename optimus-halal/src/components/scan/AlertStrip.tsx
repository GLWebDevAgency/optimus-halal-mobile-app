/**
 * AlertStrip Component
 *
 * Renders personal alerts (allergens, boycott, dietary) as styled cards
 * sorted by severity. Positioned after the hero section, before the
 * madhab card in the continuous scroll layout.
 *
 * Design principle (Al-Taqwa): Informative, NOT alarmist.
 * No scare tactics or urgency language.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { WarningIcon, ProhibitIcon, ForkKnifeIcon, type IconProps } from "phosphor-react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { halalStatus as halalStatusTokens, glass, gold } from "@/theme/colors";
import { fontSize as fontSizeTokens, fontWeight as fontWeightTokens } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import { SUSPENSE_DURATION } from "./scan-constants";
import { type PersonalAlert } from "@/components/scan/PersonalAlerts";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AlertStripProps {
  alerts: PersonalAlert[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALERT_ICON_COMPONENTS: Record<PersonalAlert["type"], React.ComponentType<IconProps>> = {
  allergen: WarningIcon,
  boycott: ProhibitIcon,
  health: ForkKnifeIcon,
};

const SEVERITY_ORDER: Record<PersonalAlert["severity"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function getAccentColor(severity: PersonalAlert["severity"]): string {
  switch (severity) {
    case "high":
      return halalStatusTokens.haram.base;
    case "medium":
      return halalStatusTokens.doubtful.base;
    case "low":
      return gold[500];
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AlertStrip({ alerts }: AlertStripProps) {
  const { colors, isDark } = useTheme();

  if (alerts.length === 0) return null;

  const sorted = [...alerts].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );

  return (
    <View style={styles.container}>
      {sorted.map((alert, index) => {
        const accent = getAccentColor(alert.severity);
        const cardBg = isDark ? glass.dark.bg : colors.card;
        const borderColor = isDark ? glass.dark.border : `${accent}20`;
        const IconComponent = ALERT_ICON_COMPONENTS[alert.type] ?? WarningIcon;

        return (
          <Animated.View
            key={`${alert.type}-${alert.severity}-${index}`}
            entering={FadeInUp.delay(SUSPENSE_DURATION + index * 80)
              .duration(400)
              .springify()
              .damping(14)
              .stiffness(170)
              .mass(0.9)}
            style={[
              styles.card,
              {
                backgroundColor: cardBg,
                borderColor,
                borderLeftColor: accent,
              },
            ]}
            accessibilityRole="alert"
            accessibilityLabel={`${alert.title}. ${alert.description}`}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${accent}14` }]}>
              <IconComponent size={18} color={accent} weight="bold" />
            </View>

            <View style={styles.content}>
              <Text
                style={[styles.title, { color: colors.textPrimary }]}
                numberOfLines={2}
              >
                {alert.title}
              </Text>
              <Text
                style={[styles.description, { color: colors.textSecondary }]}
                numberOfLines={3}
              >
                {alert.description}
              </Text>
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.lg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderLeftWidth: 3,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing["2xs"],
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: fontSizeTokens.bodySmall,
    fontWeight: fontWeightTokens.semiBold,
  },
  description: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.regular,
    marginTop: spacing["2xs"],
    lineHeight: 18,
  },
});
