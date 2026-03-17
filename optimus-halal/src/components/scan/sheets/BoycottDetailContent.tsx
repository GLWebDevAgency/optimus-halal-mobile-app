/**
 * BoycottDetailContent — Displays boycott information for a product.
 *
 * Shows red banner with boycott info, company name, reason,
 * and source attribution. Rendered inside an InfoSheet wrapper.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { spacing, radius } from "@/theme/spacing";
import { fontSize, fontWeight } from "@/theme/typography";
import { halalStatus } from "@/theme/colors";

// ── Types ────────────────────────────────────────────

interface Props {
  companyName: string;
  reason: string;
  sourceUrl?: string | null;
  sourceName?: string | null;
}

// ── Component ────────────────────────────────────────

export const BoycottDetailContent = React.memo(function BoycottDetailContent({
  companyName,
  reason,
  sourceUrl,
  sourceName,
}: Props) {
  const { isDark, colors } = useTheme();
  const boycottColor = halalStatus.haram.base;

  return (
    <View style={styles.container}>
      {/* Red boycott banner */}
      <View style={[styles.banner, { backgroundColor: `${boycottColor}18` }]}>
        <Text style={styles.bannerIcon}>{"\ud83d\udeab"}</Text>
        <View style={styles.bannerContent}>
          <Text style={[styles.bannerLabel, { color: boycottColor }]}>
            Boycott
          </Text>
          <Text style={[styles.companyName, { color: boycottColor }]}>
            {companyName}
          </Text>
        </View>
      </View>

      {/* Reason */}
      <View style={styles.reasonSection}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Motif du boycott
        </Text>
        <Text style={[styles.reasonText, { color: colors.textSecondary }]}>
          {reason}
        </Text>
      </View>

      {/* Source */}
      {sourceName || sourceUrl ? (
        <View style={[styles.sourceBox, {
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
        }]}>
          <Text style={[styles.sourceLabel, { color: colors.textMuted }]}>
            Source
          </Text>
          <Text style={[styles.sourceName, { color: colors.textSecondary }]}>
            {sourceName ?? sourceUrl}
          </Text>
          {sourceUrl && sourceName ? (
            <Text style={[styles.sourceUrl, { color: colors.textMuted }]} numberOfLines={1}>
              {sourceUrl}
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* Disclaimer */}
      <Text style={[styles.disclaimer, { color: colors.textMuted }]}>
        Les informations de boycott sont fournies à titre indicatif et
        proviennent de sources communautaires. Naqiy ne prend pas position
        et vous encourage à vérifier ces informations.
      </Text>
    </View>
  );
});

// ── Styles ───────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.md,
  },
  bannerIcon: {
    fontSize: 28,
  },
  bannerContent: {
    flex: 1,
    gap: spacing["2xs"],
  },
  bannerLabel: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semiBold,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  companyName: {
    fontSize: fontSize.h4,
    fontWeight: fontWeight.bold,
  },
  reasonSection: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.semiBold,
  },
  reasonText: {
    fontSize: fontSize.bodySmall,
    lineHeight: 21,
  },
  sourceBox: {
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
  },
  sourceLabel: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
  },
  sourceName: {
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.semiBold,
  },
  sourceUrl: {
    fontSize: fontSize.caption,
  },
  disclaimer: {
    fontSize: fontSize.caption,
    lineHeight: 18,
    fontStyle: "italic",
  },
});
