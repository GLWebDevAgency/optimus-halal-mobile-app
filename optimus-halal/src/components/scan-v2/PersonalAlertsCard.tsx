/**
 * PersonalAlertsCard — Allergen + pregnancy alerts OR upsell banner.
 *
 * Premium users see their personal alerts (allergens, pregnancy risks).
 * Free users see the NaqiyPlusUpsell banner.
 *
 * Design: Stitch "Personal Alerts (Gated)" section.
 *
 * @module components/scan-v2/PersonalAlertsCard
 */

import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { usePremium } from "@/hooks";
import { textStyles, headingFontFamily, bodyFontFamily } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import { halalStatus } from "@/theme/colors";
import { ShieldWarning, Warning, Baby, FirstAid } from "phosphor-react-native";
import type { PersonalAlertV2 } from "./scan-v2-types";
import { NaqiyPlusUpsell } from "./NaqiyPlusUpsell";

interface PersonalAlertsCardProps {
  alerts: PersonalAlertV2[];
  onConfigureProfile?: () => void;
}

const ALERT_ICONS: Record<string, React.FC<any>> = {
  allergen: Warning,
  pregnancy: Baby,
  health: FirstAid,
};

export const PersonalAlertsCard: React.FC<PersonalAlertsCardProps> = ({
  alerts,
  onConfigureProfile,
}) => {
  const { isDark, colors } = useTheme();
  const { isPremium } = usePremium();

  // Free users see the upsell
  if (!isPremium) {
    return (
      <NaqiyPlusUpsell
        featureLabel="Alertes personnalisees"
        description="Debloquez les alertes allergenes et grossesse personnalisees."
      />
    );
  }

  // No alerts configured
  if (alerts.length === 0) {
    return (
      <Animated.View
        entering={FadeInUp.delay(240).springify().damping(14).stiffness(170).mass(0.9)}
      >
        <Pressable
          onPress={onConfigureProfile}
          accessibilityLabel="Configurer votre profil de sante"
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.emptyCard,
            {
              backgroundColor: isDark ? colors.card : colors.card,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <ShieldWarning size={24} color={colors.primary} weight="fill" />
          <View style={styles.emptyContent}>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              Alertes personnalisees
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              Configurez votre profil pour recevoir des alertes allergenes et sante.
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeInUp.delay(240).springify().damping(14).stiffness(170).mass(0.9)}
    >
      <View
        style={[
          styles.card,
          { backgroundColor: isDark ? colors.card : colors.card },
        ]}
      >
        <View style={styles.header}>
          <ShieldWarning size={20} color={colors.primary} weight="fill" />
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Alertes personnalisees
          </Text>
        </View>

        <View style={styles.alertsList}>
          {alerts.map((alert, index) => {
            const Icon = ALERT_ICONS[alert.type] || Warning;
            const severityColor =
              alert.severity === "high"
                ? halalStatus.haram.base
                : alert.severity === "medium"
                  ? halalStatus.doubtful.base
                  : colors.textSecondary;

            return (
              <View
                key={`${alert.type}-${index}`}
                style={[
                  styles.alertRow,
                  {
                    backgroundColor: isDark
                      ? colors.backgroundSecondary
                      : colors.background,
                  },
                ]}
              >
                <Icon size={18} color={severityColor} weight="fill" />
                <View style={styles.alertContent}>
                  <Text
                    style={[styles.alertTitle, { color: colors.textPrimary }]}
                  >
                    {alert.title}
                  </Text>
                  <Text
                    style={[
                      styles.alertDescription,
                      { color: colors.textSecondary },
                    ]}
                    numberOfLines={2}
                  >
                    {alert.description}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: spacing["3xl"],
    gap: spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  title: {
    ...textStyles.h4,
  },
  alertsList: {
    gap: spacing.md,
  },
  alertRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing.xl,
    borderRadius: radius.lg,
    gap: spacing.lg,
  },
  alertContent: {
    flex: 1,
    gap: spacing.xs,
  },
  alertTitle: {
    fontFamily: headingFontFamily.semiBold,
    fontSize: 14,
    fontWeight: "600",
  },
  alertDescription: {
    fontFamily: bodyFontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  emptyCard: {
    borderRadius: radius.xl,
    padding: spacing["3xl"],
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xl,
  },
  emptyContent: {
    flex: 1,
    gap: spacing.xs,
  },
  emptyTitle: {
    fontFamily: headingFontFamily.semiBold,
    fontSize: 15,
    fontWeight: "600",
  },
  emptyDescription: {
    fontFamily: bodyFontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
  },
});

export default PersonalAlertsCard;
