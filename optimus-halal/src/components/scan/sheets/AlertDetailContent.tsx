/**
 * AlertDetailContent — Displays alert detail information.
 *
 * Shows alert type banner colored by severity, description,
 * and manage-alerts link text. Rendered inside an InfoSheet wrapper.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { spacing, radius } from "@/theme/spacing";
import { fontSize, fontWeight } from "@/theme/typography";

// ── Types ────────────────────────────────────────────

type AlertType = "allergen" | "health" | "boycott";
type Severity = "high" | "medium" | "low";

interface Alert {
  type: AlertType;
  severity: Severity;
  title: string;
  description: string;
}

interface Props {
  alert: Alert;
}

// ── Config ───────────────────────────────────────────

const SEVERITY_CONFIG: Record<Severity, { color: string; label: string }> = {
  high: { color: "#ef4444", label: "Critique" },
  medium: { color: "#f97316", label: "Modéré" },
  low: { color: "#eab308", label: "Faible" },
};

const TYPE_LABELS: Record<AlertType, string> = {
  allergen: "Allergène",
  health: "Santé",
  boycott: "Boycott",
};

// ── Component ────────────────────────────────────────

export const AlertDetailContent = React.memo(function AlertDetailContent({
  alert,
}: Props) {
  const { isDark, colors } = useTheme();
  const goldColor = isDark ? "#D4AF37" : "#8B6914";
  const severity = SEVERITY_CONFIG[alert.severity];

  return (
    <View style={styles.container}>
      {/* Alert banner */}
      <View style={[styles.banner, { backgroundColor: `${severity.color}18` }]}>
        <View style={styles.bannerHeader}>
          <View style={[styles.typeBadge, { backgroundColor: `${severity.color}30` }]}>
            <Text style={[styles.typeText, { color: severity.color }]}>
              {TYPE_LABELS[alert.type]}
            </Text>
          </View>
          <View style={[styles.severityBadge, { backgroundColor: `${severity.color}30` }]}>
            <View style={[styles.severityDot, { backgroundColor: severity.color }]} />
            <Text style={[styles.severityText, { color: severity.color }]}>
              {severity.label}
            </Text>
          </View>
        </View>
        <Text style={[styles.bannerTitle, { color: severity.color }]}>
          {alert.title}
        </Text>
      </View>

      {/* Description */}
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        {alert.description}
      </Text>

      {/* Manage alerts link */}
      <View style={[styles.linkBox, {
        backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
        borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
      }]}>
        <Text style={[styles.linkText, { color: goldColor }]}>
          Gérer mes alertes
        </Text>
        <Text style={[styles.linkHint, { color: colors.textMuted }]}>
          Personnalisez vos alertes dans les paramètres pour recevoir
          des notifications adaptées à votre profil.
        </Text>
      </View>
    </View>
  );
});

// ── Styles ───────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  banner: {
    padding: spacing.lg,
    borderRadius: radius.md,
    gap: spacing.md,
  },
  bannerHeader: {
    flexDirection: "row",
    gap: spacing.md,
  },
  typeBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  typeText: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semiBold,
  },
  severityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  severityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  severityText: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semiBold,
  },
  bannerTitle: {
    fontSize: fontSize.h4,
    fontWeight: fontWeight.bold,
  },
  description: {
    fontSize: fontSize.bodySmall,
    lineHeight: 21,
  },
  linkBox: {
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
  },
  linkText: {
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.semiBold,
  },
  linkHint: {
    fontSize: fontSize.caption,
    lineHeight: 18,
  },
});
