/**
 * HalalMadhabTile — Halal verdict + madhab summary tile (2/3 width).
 *
 * Shows verdict icon with radial glow, verdict text, trust bar,
 * 4 mini madhab dots with labels, ingredient/additive count summary,
 * consensus chip (if unanimous), and "Voir détail" CTA.
 *
 * Wrapped in BentoTile for glass card styling and stagger entry.
 *
 * @module components/scan/HalalMadhabTile
 */

import React, { useEffect, useMemo } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  useReducedMotion,
} from "react-native-reanimated";
import { BentoTile } from "./BentoTile";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { halalStatus as halalStatusTokens, gold } from "@/theme/colors";
import {
  fontSize as fontSizeTokens,
  fontWeight as fontWeightTokens,
  fontFamily,
} from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import {
  STATUS_CONFIG,
  MADHAB_LABEL_KEY,
  type HalalStatusKey,
} from "./scan-constants";

// ── Types ────────────────────────────────────────────────────────────────────

export interface HalalMadhabTileProps {
  /** Overall halal verdict */
  halalStatus: HalalStatusKey;
  /** Effective hero status (may differ from halalStatus for weak certifiers) */
  effectiveHeroStatus: HalalStatusKey;
  /** Trust score for the hero certifier (0-100, null if no certifier) */
  trustScore: number | null;
  /** Per-madhab verdicts */
  madhabVerdicts: Array<{
    madhab: string;
    status: HalalStatusKey;
    conflictingAdditives: Array<{
      code: string;
      name: string;
      ruling: string;
      explanation: string;
      scholarlyReference: string | null;
    }>;
    conflictingIngredients?: Array<{
      pattern: string;
      ruling: string;
      explanation: string;
      scholarlyReference: string | null;
    }>;
  }>;
  /** User's selected madhab for gold star highlight */
  userMadhab: string;
  /** Number of analysed ingredients */
  ingredientCount: number;
  /** Number of detected additives */
  additiveCount: number;
  /** Stagger index for entry animation */
  staggerIndex?: number;
  /** Called when tile is tapped — opens madhab detail sheet */
  onPress: () => void;
}

// ── Madhab dot color mapping ─────────────────────────────────────────────────

const STATUS_DOT_COLOR: Record<string, string> = {
  halal: halalStatusTokens.halal.base,
  doubtful: halalStatusTokens.doubtful.base,
  haram: halalStatusTokens.haram.base,
  unknown: halalStatusTokens.unknown.base,
};

// ── Ordered madhab keys ──────────────────────────────────────────────────────

const MADHAB_ORDER = ["hanafi", "shafii", "maliki", "hanbali"] as const;

// ── Component ────────────────────────────────────────────────────────────────

export function HalalMadhabTile({
  halalStatus,
  effectiveHeroStatus,
  trustScore,
  madhabVerdicts,
  userMadhab,
  ingredientCount,
  additiveCount,
  staggerIndex = 0,
  onPress,
}: HalalMadhabTileProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();

  // Resolve status config for the effective hero status
  const config = STATUS_CONFIG[effectiveHeroStatus] ?? STATUS_CONFIG.unknown;
  const statusColor = config.color;

  // ── Animated trust bar fill ──────────────────────────────────────────────

  const barFill = useSharedValue(0);
  const normalizedTrust = trustScore !== null ? Math.min(100, Math.max(0, trustScore)) : 0;

  useEffect(() => {
    if (trustScore !== null && !reducedMotion) {
      barFill.value = withTiming(normalizedTrust / 100, {
        duration: 900,
        easing: Easing.out(Easing.cubic),
      });
    } else if (trustScore !== null) {
      barFill.value = normalizedTrust / 100;
    }
  }, [normalizedTrust, trustScore, reducedMotion, barFill]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${barFill.value * 100}%` as any,
  }));

  // ── Consensus detection ──────────────────────────────────────────────────

  const unanimousStatus = useMemo(() => {
    if (madhabVerdicts.length < 4) return null;
    const statuses = madhabVerdicts.map((v) => v.status);
    const allSame = statuses.every((s) => s === statuses[0]);
    return allSame ? statuses[0] : null;
  }, [madhabVerdicts]);

  // ── Verdict label key mapping ────────────────────────────────────────────

  const verdictLabelMap: Record<string, string> = {
    halal: t.scanResult.certifiedHalal,
    haram: t.scanResult.haramDetected,
    doubtful: t.scanResult.doubtfulStatus,
    unknown: t.scanResult.unverified,
  };

  const verdictLabel = verdictLabelMap[effectiveHeroStatus] ?? verdictLabelMap.unknown;

  // ── Build madhab lookup for dots ─────────────────────────────────────────

  const madhabMap = useMemo(() => {
    const map: Record<string, HalalStatusKey> = {};
    for (const v of madhabVerdicts) {
      map[v.madhab] = v.status;
    }
    return map;
  }, [madhabVerdicts]);

  // ── Render ───────────────────────────────────────────────────────────────

  const StatusIcon = config.Icon;

  return (
    <BentoTile
      onPress={onPress}
      glowColor={config.glowColor}
      staggerIndex={staggerIndex}
      accessibilityLabel={`${t.scanResult.halalStatus}: ${verdictLabel}`}
      style={styles.outerTile}
    >
      <View style={styles.container}>
        {/* ── Row 1: Verdict Icon + Text + Trust bar ── */}
        <View style={styles.verdictRow}>
          {/* Icon with radial glow */}
          <View style={styles.iconContainer}>
            {/* Radial glow layer */}
            <View
              style={[
                styles.iconGlow,
                { backgroundColor: `${statusColor}${isDark ? "30" : "18"}` },
              ]}
            />
            <StatusIcon
              size={32}
              color={statusColor}
              weight={config.iconWeight}
            />
          </View>

          {/* Verdict text + trust bar */}
          <View style={styles.verdictContent}>
            <Text
              style={[
                styles.verdictLabel,
                { color: statusColor },
              ]}
              numberOfLines={1}
            >
              {verdictLabel}
            </Text>

            {/* Trust bar (only if certifier trust score exists) */}
            {trustScore !== null && (
              <View style={styles.trustBarContainer}>
                <View
                  style={[
                    styles.trustBarTrack,
                    {
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(0,0,0,0.06)",
                    },
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.trustBarFill,
                      { backgroundColor: statusColor },
                      barStyle,
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.trustBarLabel,
                    { color: colors.textMuted },
                  ]}
                >
                  {trustScore}%
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Row 2: 4 Mini madhab dots ── */}
        <View style={styles.madhabRow}>
          {MADHAB_ORDER.map((madhab) => {
            const status = madhabMap[madhab] ?? "unknown";
            const dotColor = STATUS_DOT_COLOR[status] ?? STATUS_DOT_COLOR.unknown;
            const isUserMadhab = madhab === userMadhab;
            const labelKey = MADHAB_LABEL_KEY[madhab];
            const label = t.scanResult[labelKey as keyof typeof t.scanResult] as string;

            return (
              <View key={madhab} style={styles.madhabDotGroup}>
                <View style={styles.madhabDotWrapper}>
                  <View
                    style={[
                      styles.madhabDot,
                      { backgroundColor: dotColor },
                      isUserMadhab && styles.madhabDotHighlighted,
                      isUserMadhab && {
                        borderColor: gold[500],
                      },
                    ]}
                  />
                  {isUserMadhab && (
                    <Text style={styles.madhabStar}>★</Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.madhabLabel,
                    { color: colors.textMuted },
                    isUserMadhab && {
                      color: isDark ? gold[400] : gold[700],
                      fontWeight: fontWeightTokens.semiBold,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </View>
            );
          })}
        </View>

        {/* ── Row 3: Ingredient/Additive count + Consensus chip ── */}
        <View style={styles.bottomRow}>
          {/* Count summary */}
          <Text
            style={[
              styles.countSummary,
              { color: colors.textSecondary },
            ]}
            numberOfLines={1}
          >
            {ingredientCount > 0 && (
              `${ingredientCount} ${t.scanResult.ingredients.toLowerCase()}`
            )}
            {ingredientCount > 0 && additiveCount > 0 && " · "}
            {additiveCount > 0 && (
              `${additiveCount} ${t.scanResult.additives.toLowerCase()}`
            )}
            {ingredientCount === 0 && additiveCount === 0 && t.scanResult.unverified}
          </Text>

          {/* Consensus chip */}
          {unanimousStatus && (
            <View
              style={[
                styles.consensusChip,
                {
                  backgroundColor: `${STATUS_DOT_COLOR[unanimousStatus]}${isDark ? "20" : "12"}`,
                  borderColor: `${STATUS_DOT_COLOR[unanimousStatus]}${isDark ? "40" : "25"}`,
                },
              ]}
            >
              <Text
                style={[
                  styles.consensusText,
                  { color: STATUS_DOT_COLOR[unanimousStatus] },
                ]}
                numberOfLines={1}
              >
                {t.scanResult.madhabAllAgree}
              </Text>
            </View>
          )}
        </View>

        {/* ── CTA ── */}
        <Text
          style={[
            styles.ctaText,
            { color: isDark ? gold[400] : colors.primary },
          ]}
        >
          {t.scanResult.showIndicators.replace(/ par indicateur$/, "")} →
        </Text>
      </View>
    </BentoTile>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  outerTile: {
    flex: 2,
  },
  container: {
    padding: spacing.xl,
    gap: spacing.lg,
  },

  // ── Verdict row ──
  verdictRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  iconContainer: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  iconGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
  },
  verdictContent: {
    flex: 1,
    gap: spacing.xs,
  },
  verdictLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSizeTokens.bodySmall,
    fontWeight: fontWeightTokens.semiBold,
  },

  // ── Trust bar ──
  trustBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  trustBarTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  trustBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  trustBarLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.medium,
    minWidth: 28,
    textAlign: "right",
  },

  // ── Madhab dots ──
  madhabRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  madhabDotGroup: {
    alignItems: "center",
    gap: spacing["2xs"],
    flex: 1,
  },
  madhabDotWrapper: {
    position: "relative",
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  madhabDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  madhabDotHighlighted: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
  },
  madhabStar: {
    position: "absolute",
    top: -4,
    right: -4,
    fontSize: 8,
    color: gold[500],
    lineHeight: 10,
  },
  madhabLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.medium,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  // ── Bottom row ──
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  countSummary: {
    fontFamily: fontFamily.regular,
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.regular,
    flexShrink: 1,
  },
  consensusChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing["2xs"],
    borderRadius: radius.full,
    borderWidth: 1,
  },
  consensusText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.medium,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // ── CTA ──
  ctaText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.semiBold,
    textAlign: "right",
  },
});
