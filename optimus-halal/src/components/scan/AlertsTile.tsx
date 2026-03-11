/**
 * AlertsTile — Personal alerts summary tile (1/3 width).
 *
 * With alerts: count + icon + top 2 preview lines.
 * Zero alerts: CheckCircle + "Aucune alerte" + "Tout est bon".
 *
 * @module components/scan/AlertsTile
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { CheckCircleIcon, WarningCircleIcon } from "phosphor-react-native";
import { BentoTile } from "./BentoTile";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { halalStatus as halalStatusTokens, gold } from "@/theme/colors";
import {
  fontSize as fontSizeTokens,
  fontWeight as fontWeightTokens,
} from "@/theme/typography";
import { spacing } from "@/theme/spacing";

interface AlertItem {
  type: string;
  severity: "warning" | "info" | "danger";
  title: string;
  message: string;
}

export interface AlertsTileProps {
  alerts: AlertItem[];
  staggerIndex: number;
  onPress: () => void;
}

export function AlertsTile({ alerts, staggerIndex, onPress }: AlertsTileProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();

  const hasAlerts = alerts.length > 0;
  const glowColor = hasAlerts
    ? halalStatusTokens.doubtful.base
    : halalStatusTokens.halal.base;

  return (
    <BentoTile
      onPress={onPress}
      glowColor={glowColor}
      staggerIndex={staggerIndex}
      accessibilityLabel={
        hasAlerts
          ? `${alerts.length} ${alerts.length === 1 ? "alerte" : "alertes"}`
          : t("home.noAlerts")
      }
      style={styles.tileOuter}
    >
      <View style={styles.content}>
        {hasAlerts ? (
          <>
            <View style={styles.headerRow}>
              <WarningCircleIcon
                size={20}
                color={halalStatusTokens.doubtful.base}
                weight="fill"
              />
              <Text
                style={[
                  styles.count,
                  { color: halalStatusTokens.doubtful.base },
                ]}
              >
                {alerts.length}
              </Text>
            </View>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {alerts.length === 1 ? "alerte" : "alertes"}
            </Text>
            {/* Top 2 alert previews */}
            {alerts.slice(0, 2).map((alert, i) => (
              <Text
                key={i}
                style={[styles.alertPreview, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {"\u2022"} {alert.title}
              </Text>
            ))}
          </>
        ) : (
          <>
            <CheckCircleIcon
              size={20}
              color={halalStatusTokens.halal.base}
              weight="fill"
            />
            <Text
              style={[
                styles.cleanTitle,
                { color: halalStatusTokens.halal.base },
              ]}
            >
              Aucune alerte
            </Text>
            <Text style={[styles.cleanSubtitle, { color: colors.textMuted }]}>
              Tout est bon
            </Text>
          </>
        )}

        {/* CTA */}
        {hasAlerts && (
          <Text
            style={[
              styles.ctaText,
              { color: isDark ? gold[400] : gold[700] },
            ]}
          >
            {t("common.viewAlerts")} {"\u2192"}
          </Text>
        )}
      </View>
    </BentoTile>
  );
}

const styles = StyleSheet.create({
  tileOuter: { flex: 1 },
  content: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  count: {
    fontSize: fontSizeTokens.h3,
    fontWeight: fontWeightTokens.bold,
  },
  subtitle: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.medium,
  },
  alertPreview: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.medium,
  },
  cleanTitle: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.semiBold,
  },
  cleanSubtitle: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.medium,
  },
  ctaText: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.semiBold,
    textAlign: "right",
    marginTop: spacing.xs,
  },
});
