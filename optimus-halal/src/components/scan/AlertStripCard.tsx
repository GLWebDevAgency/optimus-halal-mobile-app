/**
 * AlertStripCard — Personal Alerts Section Card
 *
 * Severity-sorted alert sub-cards inside a SectionCard.
 * Conditional: only renders if alerts exist.
 * Max 3 visible, "Voir toutes (N)" CTA for overflow.
 *
 * @module components/scan/AlertStripCard
 */

import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { WarningCircleIcon, WarningIcon, InfoIcon } from "phosphor-react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import { SectionCard } from "./SectionCard";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { halalStatus as halalStatusTokens, gold } from "@/theme/colors";
import { semantic } from "@/theme/colors";
import { fontSize as fontSizeTokens, fontWeight as fontWeightTokens } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";

// ── Types ──

export interface AlertItem {
  type: string;
  severity: "danger" | "warning" | "info";
  title: string;
  message: string;
}

export interface AlertStripCardProps {
  alerts: AlertItem[];
  staggerIndex?: number;
  onPress?: () => void;
}

// ── Helpers ──

const SEVERITY_ORDER: Record<string, number> = { danger: 0, warning: 1, info: 2 };
const SEVERITY_COLORS: Record<string, string> = {
  danger: halalStatusTokens.haram.base,
  warning: halalStatusTokens.doubtful.base,
  info: semantic.info.base,
};

function getSeverityIcon(severity: string, size: number, color: string) {
  switch (severity) {
    case "danger": return <WarningCircleIcon size={size} color={color} weight="fill" />;
    case "warning": return <WarningIcon size={size} color={color} weight="fill" />;
    default: return <InfoIcon size={size} color={color} weight="fill" />;
  }
}

const MAX_VISIBLE = 3;

// ── Component ──

export function AlertStripCard({ alerts, staggerIndex = 1, onPress }: AlertStripCardProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(false);

  if (alerts.length === 0) return null;

  // Sort by severity
  const sorted = [...alerts].sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 2) - (SEVERITY_ORDER[b.severity] ?? 2),
  );

  const visible = showAll ? sorted : sorted.slice(0, MAX_VISIBLE);
  const hasMore = sorted.length > MAX_VISIBLE && !showAll;

  return (
    <SectionCard
      icon={<WarningCircleIcon size={16} color={isDark ? gold[400] : gold[700]} weight="bold" />}
      title={t.scanResult.alertsPersonnelles}
      rightElement={
        <Text style={[styles.countBadge, { color: isDark ? gold[400] : gold[700] }]}>
          {alerts.length}
        </Text>
      }
      staggerIndex={staggerIndex}
    >
      <View style={styles.alertList}>
        {visible.map((alert, idx) => {
          const color = SEVERITY_COLORS[alert.severity] ?? SEVERITY_COLORS.info;
          return (
            <Animated.View
              key={`${alert.type}-${idx}`}
              entering={FadeInUp.delay(idx * 60).duration(250)}
              style={[
                styles.alertSubCard,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.03)"
                    : "rgba(0,0,0,0.02)",
                },
              ]}
            >
              <View style={styles.alertRow}>
                {getSeverityIcon(alert.severity, 18, color)}
                <View style={styles.alertContent}>
                  <Text
                    style={[styles.alertTitle, { color: colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {alert.title}
                  </Text>
                  <Text
                    style={[styles.alertMessage, { color: colors.textSecondary }]}
                    numberOfLines={2}
                  >
                    {alert.message}
                  </Text>
                </View>
              </View>
            </Animated.View>
          );
        })}
      </View>

      {hasMore && (
        <Pressable onPress={() => setShowAll(true)} style={styles.showMoreButton}>
          <Text style={[styles.showMoreText, { color: isDark ? gold[400] : gold[700] }]}>
            {t.scanResult.voirTout.replace("{{count}}", String(sorted.length))}
          </Text>
        </Pressable>
      )}
    </SectionCard>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  countBadge: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.bold,
  },
  alertList: {
    gap: spacing.md,
  },
  alertSubCard: {
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  alertRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  alertContent: {
    flex: 1,
    gap: 2,
  },
  alertTitle: {
    fontSize: fontSizeTokens.bodySmall,
    fontWeight: fontWeightTokens.semiBold,
  },
  alertMessage: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.regular,
    lineHeight: 18,
  },
  showMoreButton: {
    alignItems: "center",
    paddingTop: spacing.lg,
  },
  showMoreText: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.semiBold,
  },
});
