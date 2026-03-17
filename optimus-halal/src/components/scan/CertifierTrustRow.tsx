/**
 * CertifierTrustRow — Reusable certifier identity + Naqiy Trust Grade strip.
 *
 * Single source of truth for the "logo + name + N١→N٥ strip + score" pattern
 * used across scan-result, scan-history, bottom sheets, and anywhere a
 * certifier's trust level needs to be displayed consistently.
 *
 * Variants:
 *   - "full"    → Logo + Name row, then Grade strip + score row (scan-result card)
 *   - "inline"  → Logo + Name + Grade strip on one row (compact spaces)
 *   - "sheet"   → Logo + Name + Evidence pill row, then Grade strip + score (bottom sheets)
 *
 * @module components/scan/CertifierTrustRow
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { fontSize, fontWeight } from "@/theme/typography";
import { spacing } from "@/theme/spacing";
import { CertifierLogo } from "./CertifierLogo";
import { NaqiyGradeBadge, getTrustGradeFromScore } from "./NaqiyGradeBadge";

// ── Types ────────────────────────────────────────────────

interface BaseProps {
  certifierId: string;
  certifierName: string;
  trustScore: number;
  /** Show "XX/100" next to the grade strip (default: true) */
  showScore?: boolean;
  /** Show the grade label ("Très fiable") in the strip (default: false) */
  showLabel?: boolean;
}

interface FullProps extends BaseProps {
  variant: "full";
  /** Logo size (default: 18) */
  logoSize?: number;
}

interface InlineProps extends BaseProps {
  variant: "inline";
  /** Logo size (default: 14) */
  logoSize?: number;
}

interface SheetProps extends BaseProps {
  variant: "sheet";
  /** Evidence level badge text (e.g. "Vérifié", "Déclaré") */
  evidenceLabel?: string;
  /** Evidence badge color */
  evidenceColor?: string;
  /** Logo size (default: 28) */
  logoSize?: number;
}

export type CertifierTrustRowProps = FullProps | InlineProps | SheetProps;

// ── Component ────────────────────────────────────────────

export const CertifierTrustRow = React.memo(function CertifierTrustRow(
  props: CertifierTrustRowProps,
) {
  const { isDark, colors } = useTheme();
  const {
    certifierId,
    certifierName,
    trustScore,
    showScore = true,
    showLabel = false,
  } = props;

  const grade = getTrustGradeFromScore(trustScore);
  const scoreColor = trustScore >= 70
    ? "#22c55e"
    : trustScore >= 40
      ? "#f59e0b"
      : "#ef4444";

  // ── Inline: everything on one row ──
  if (props.variant === "inline") {
    const logoSize = props.logoSize ?? 14;
    return (
      <View style={styles.inlineRow}>
        <CertifierLogo certifierId={certifierId} size={logoSize} fallbackColor={scoreColor} />
        <Text
          style={[styles.nameInline, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {certifierName}
        </Text>
        <NaqiyGradeBadge variant="strip" grade={grade} showLabel={showLabel} />
        {showScore && (
          <Text style={[styles.scoreInline, { color: scoreColor }]}>
            {trustScore}/100
          </Text>
        )}
      </View>
    );
  }

  // ── Sheet: logo+name+evidence row, then grade strip row ──
  if (props.variant === "sheet") {
    const logoSize = props.logoSize ?? 28;
    return (
      <View style={styles.sheetContainer}>
        {/* Row 1: Logo + Name + Evidence */}
        <View style={styles.sheetTopRow}>
          <CertifierLogo certifierId={certifierId} size={logoSize} fallbackColor={scoreColor} />
          <View style={styles.sheetInfo}>
            <Text
              style={[styles.nameSheet, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {certifierName}
            </Text>
            {props.evidenceLabel && (
              <View style={[styles.evidencePill, { backgroundColor: `${props.evidenceColor ?? "#6b7280"}15` }]}>
                <Text style={[styles.evidenceText, { color: props.evidenceColor ?? "#6b7280" }]}>
                  {props.evidenceLabel}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Row 2: Grade strip + score */}
        <View style={styles.gradeRow}>
          <NaqiyGradeBadge variant="strip" grade={grade} showLabel={showLabel} />
          {showScore && (
            <Text style={[styles.scoreSheet, { color: scoreColor }]}>
              {trustScore}/100
            </Text>
          )}
        </View>
      </View>
    );
  }

  // ── Full (default): name row, then grade strip row ──
  const logoSize = props.logoSize ?? 18;
  return (
    <View style={styles.fullContainer}>
      {/* Row 1: Logo + Name */}
      <View style={styles.fullTopRow}>
        <CertifierLogo certifierId={certifierId} size={logoSize} fallbackColor={scoreColor} />
        <Text
          style={[styles.nameFull, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {certifierName}
        </Text>
      </View>

      {/* Row 2: Grade strip + score */}
      <View style={styles.gradeRow}>
        <NaqiyGradeBadge variant="strip" grade={grade} showLabel={showLabel} />
        {showScore && (
          <Text style={[styles.scoreFull, { color: scoreColor }]}>
            {trustScore}/100
          </Text>
        )}
      </View>
    </View>
  );
});

// ── Styles ───────────────────────────────────────────────

const styles = StyleSheet.create({
  // Full variant
  fullContainer: {
    gap: 4,
  },
  fullTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  nameFull: {
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.bold,
    flex: 1,
  },
  scoreFull: {
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.bold,
  },

  // Inline variant
  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  nameInline: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    flexShrink: 1,
  },
  scoreInline: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },

  // Sheet variant
  sheetContainer: {
    gap: spacing.md,
  },
  sheetTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sheetInfo: {
    flex: 1,
    gap: 4,
  },
  nameSheet: {
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.semiBold,
  },
  evidencePill: {
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  evidenceText: {
    fontSize: fontSize.micro,
    fontWeight: fontWeight.semiBold,
    letterSpacing: 0.3,
  },
  scoreSheet: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.black,
  },

  // Shared grade row
  gradeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
