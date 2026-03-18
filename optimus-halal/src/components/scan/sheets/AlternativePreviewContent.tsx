/**
 * AlternativePreviewContent — Displays a product alternative preview.
 *
 * Shows product name, brand, health score, halal status badge, and CTA.
 * Rendered inside an InfoSheet wrapper.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { spacing, radius } from "@/theme/spacing";
import { fontSize, fontWeight } from "@/theme/typography";
import { halalStatus } from "@/theme/colors";

// ── Types ────────────────────────────────────────────

interface Props {
  name: string;
  brand?: string | null;
  imageUrl?: string | null;
  healthScore?: number | null;
  halalStatus: string;
}

// ── Helpers ──────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score >= 75) return "#22c55e";
  if (score >= 50) return "#eab308";
  if (score >= 25) return "#f97316";
  return "#ef4444";
}

function getStatusColor(status: string): string {
  if (status === "halal") return halalStatus.halal.base;
  if (status === "haram") return halalStatus.haram.base;
  if (status === "doubtful") return halalStatus.doubtful.base;
  return halalStatus.unknown.base;
}

function getStatusLabel(status: string): string {
  if (status === "halal") return "Halal";
  if (status === "haram") return "Haram";
  if (status === "doubtful") return "Douteux";
  return "Inconnu";
}

// ── Component ────────────────────────────────────────

export const AlternativePreviewContent = React.memo(function AlternativePreviewContent({
  name,
  brand,
  healthScore,
  halalStatus: status,
}: Props) {
  const { isDark, colors } = useTheme();
  const goldColor = isDark ? "#D4AF37" : "#8B6914";
  const statusColor = getStatusColor(status);

  return (
    <View style={styles.container}>
      {/* Product info */}
      <Text style={[styles.name, { color: colors.textPrimary }]}>{name}</Text>
      {brand ? (
        <Text style={[styles.brand, { color: colors.textMuted }]}>{brand}</Text>
      ) : null}

      {/* Score + Status row */}
      <View style={styles.metricsRow}>
        {/* Health score */}
        {healthScore != null ? (
          <View style={styles.scoreBlock}>
            <Text style={[styles.scoreValue, { color: getScoreColor(healthScore) }]}>
              {healthScore}
            </Text>
            <Text style={[styles.scoreLabel, { color: colors.textMuted }]}>
              Score santé
            </Text>
          </View>
        ) : null}

        {/* Halal status badge */}
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18` }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {getStatusLabel(status)}
          </Text>
        </View>
      </View>

      {/* CTA */}
      <View style={[styles.ctaBox, {
        backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
        borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
      }]}>
        <Text style={[styles.ctaText, { color: goldColor }]}>
          Scanner ce produit
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
  name: {
    fontSize: fontSize.h3,
    fontWeight: fontWeight.bold,
  },
  brand: {
    fontSize: fontSize.bodySmall,
    marginTop: -spacing.md,
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xl,
  },
  scoreBlock: {
    alignItems: "center",
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: fontWeight.bold,
  },
  scoreLabel: {
    fontSize: fontSize.caption,
    marginTop: spacing["2xs"],
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.semiBold,
  },
  ctaBox: {
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
  },
  ctaText: {
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.semiBold,
  },
});
