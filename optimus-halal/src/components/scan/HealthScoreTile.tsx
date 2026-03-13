/**
 * HealthScoreTile — 1/3-width Bento tile for the Naqiy Health Score.
 *
 * Shows:
 * - 180-degree SVG arc (half-circle) colored by score threshold
 * - Centered score number with animated fill
 * - Score label ("Excellent" / "Bon" / "Mediocre" / etc.)
 * - NutriScore, NOVA, EcoScore mini badges
 * - CTA text
 *
 * Uses `react-native-svg` + Reanimated for the animated arc,
 * following the same pattern as `MadhabScoreRing.tsx`.
 *
 * @module components/scan/HealthScoreTile
 */

import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { BentoTile } from "./BentoTile";
import { HEALTH_SCORE_LABEL_KEYS } from "./scan-constants";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { halalStatus as halalStatusTokens, gold } from "@/theme/colors";
import {
  fontSize as fontSizeTokens,
  fontWeight as fontWeightTokens,
  fontFamily,
} from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";

// ── Animated SVG circle ────────────────────────────────────────────────────

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ── Arc constants (180-degree half-circle) ─────────────────────────────────

const ARC_SIZE = 64;
const STROKE_WIDTH = 4;
const ARC_RADIUS = (ARC_SIZE - STROKE_WIDTH) / 2;
const HALF_CIRCUMFERENCE = Math.PI * ARC_RADIUS; // 180deg arc length

// ── Score color thresholds ────────────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score >= 70) return halalStatusTokens.halal.base;
  if (score >= 40) return halalStatusTokens.doubtful.base;
  return halalStatusTokens.haram.base;
}

// ── Score label bucket ────────────────────────────────────────────────────

function getScoreLabelKey(
  score: number,
): keyof typeof HEALTH_SCORE_LABEL_KEYS {
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  if (score >= 40) return "mediocre";
  if (score >= 20) return "poor";
  return "very_poor";
}

// ── Badge color maps ──────────────────────────────────────────────────────

const NUTRI_COLORS: Record<string, string> = {
  a: "#038141",
  b: "#85BB2F",
  c: "#FECB02",
  d: "#EE8100",
  e: "#E63E11",
};

const NOVA_COLORS: Record<number, string> = {
  1: "#038141",
  2: "#85BB2F",
  3: "#FECB02",
  4: "#E63E11",
};

const ECO_COLORS: Record<string, string> = {
  a: "#038141",
  b: "#85BB2F",
  c: "#FECB02",
  d: "#EE8100",
  e: "#E63E11",
};

// ── Props ──────────────────────────────────────────────────────────────────

export interface HealthScoreTileProps {
  /** Naqiy health score (0-100). Null if insufficient data. */
  healthScore: number | null;
  /** NutriScore grade: "a" | "b" | "c" | "d" | "e" | null */
  nutriScore: string | null;
  /** NOVA group: 1 | 2 | 3 | 4 | null */
  novaGroup: number | null;
  /** EcoScore grade: "a" | "b" | "c" | "d" | "e" | null */
  ecoScore: string | null;
  /** Stagger index for entry animation */
  staggerIndex?: number;
  /** Called when tile is tapped — opens health detail sheet */
  onPress: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export function HealthScoreTile({
  healthScore,
  nutriScore,
  novaGroup,
  ecoScore,
  staggerIndex = 0,
  onPress,
}: HealthScoreTileProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();

  const hasScore = healthScore !== null;
  const score = healthScore ?? 0;
  const scoreColor = hasScore ? getScoreColor(score) : halalStatusTokens.unknown.base;
  const trackColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  // ── Animated arc fill ──────────────────────────────────────────────────

  const progress = useSharedValue(0);

  useEffect(() => {
    if (hasScore) {
      progress.value = withTiming(score / 100, {
        duration: 1000,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [score, hasScore, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: HALF_CIRCUMFERENCE * (1 - progress.value),
  }));

  // ── Score label ────────────────────────────────────────────────────────

  const scoreLabelText = hasScore
    ? (t.scanResult[HEALTH_SCORE_LABEL_KEYS[getScoreLabelKey(score)]] as string)
    : t.scanResult.healthScoreInsufficient;

  // ── Badge data ─────────────────────────────────────────────────────────

  const badges: Array<{ label: string; value: string; color: string }> = [];

  if (nutriScore) {
    const grade = nutriScore.toLowerCase();
    badges.push({
      label: grade.toUpperCase(),
      value: t.scanResult.nutriScore,
      color: NUTRI_COLORS[grade] ?? halalStatusTokens.unknown.base,
    });
  }

  if (novaGroup && novaGroup >= 1 && novaGroup <= 4) {
    badges.push({
      label: `${novaGroup}`,
      value: t.scanResult.novaGroup,
      color: NOVA_COLORS[novaGroup] ?? halalStatusTokens.unknown.base,
    });
  }

  if (ecoScore) {
    const grade = ecoScore.toLowerCase();
    badges.push({
      label: grade.toUpperCase(),
      value: t.scanResult.ecoScore,
      color: ECO_COLORS[grade] ?? halalStatusTokens.unknown.base,
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <BentoTile
      onPress={onPress}
      glowColor={scoreColor}
      staggerIndex={staggerIndex}
      accessibilityLabel={`${t.scanResult.healthScoreTitle}: ${hasScore ? `${score}/100 — ${scoreLabelText}` : scoreLabelText}`}
      style={styles.outerTile}
    >
      <View style={styles.container}>
        {/* ── Title ── */}
        <Text
          style={[
            styles.title,
            { color: colors.textMuted },
          ]}
          numberOfLines={1}
        >
          {t.scanResult.healthScoreTitle}
        </Text>

        {/* ── 180-degree SVG arc with centered score ── */}
        <View style={styles.arcContainer}>
          <Svg width={ARC_SIZE} height={ARC_SIZE / 2 + STROKE_WIDTH}>
            {/* Track (background half-circle) */}
            <Circle
              cx={ARC_SIZE / 2}
              cy={ARC_SIZE / 2}
              r={ARC_RADIUS}
              fill="none"
              stroke={trackColor}
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={`${HALF_CIRCUMFERENCE} ${HALF_CIRCUMFERENCE}`}
              strokeDashoffset={0}
              strokeLinecap="round"
              rotation={180}
              origin={`${ARC_SIZE / 2}, ${ARC_SIZE / 2}`}
            />
            {/* Animated progress arc */}
            <AnimatedCircle
              cx={ARC_SIZE / 2}
              cy={ARC_SIZE / 2}
              r={ARC_RADIUS}
              fill="none"
              stroke={scoreColor}
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeDasharray={`${HALF_CIRCUMFERENCE} ${HALF_CIRCUMFERENCE}`}
              animatedProps={animatedProps}
              rotation={180}
              origin={`${ARC_SIZE / 2}, ${ARC_SIZE / 2}`}
            />
          </Svg>
          {/* Centered score number */}
          <View style={styles.scoreOverlay}>
            <Text
              style={[
                styles.scoreNumber,
                { color: hasScore ? scoreColor : colors.textMuted },
              ]}
            >
              {hasScore ? score : "—"}
            </Text>
          </View>
        </View>

        {/* ── Score label ── */}
        <Text
          style={[
            styles.scoreLabel,
            { color: hasScore ? scoreColor : colors.textMuted },
          ]}
          numberOfLines={1}
        >
          {scoreLabelText}
        </Text>

        {/* ── Mini badges (NutriScore / NOVA / EcoScore) ── */}
        {badges.length > 0 && (
          <View style={styles.badgesRow}>
            {badges.map((badge) => (
              <View
                key={badge.value}
                style={[
                  styles.badge,
                  {
                    backgroundColor: `${badge.color}${isDark ? "20" : "12"}`,
                    borderColor: `${badge.color}${isDark ? "40" : "25"}`,
                  },
                ]}
              >
                <Text style={[styles.badgeGrade, { color: badge.color }]}>
                  {badge.label}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ── CTA ── */}
        <Text
          style={[
            styles.ctaText,
            { color: isDark ? gold[400] : colors.primary },
          ]}
          numberOfLines={1}
        >
          {t.scanResult.healthDashboardTitle.charAt(0) +
            t.scanResult.healthDashboardTitle.slice(1).toLowerCase()}{" "}
          →
        </Text>
      </View>
    </BentoTile>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  outerTile: {
    flex: 1,
  },
  container: {
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.md,
  },

  // ── Title ──
  title: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.semiBold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    textAlign: "center",
  },

  // ── Arc ──
  arcContainer: {
    width: ARC_SIZE,
    height: ARC_SIZE / 2 + STROKE_WIDTH,
    alignItems: "center",
    justifyContent: "flex-end",
    position: "relative",
  },
  scoreOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  scoreNumber: {
    fontFamily: fontFamily.bold,
    fontSize: fontSizeTokens.h2,
    fontWeight: fontWeightTokens.black,
    letterSpacing: -0.5,
  },

  // ── Score label ──
  scoreLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.semiBold,
    textAlign: "center",
  },

  // ── Badges ──
  badgesRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing["2xs"],
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeGrade: {
    fontFamily: fontFamily.bold,
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.bold,
    letterSpacing: 0.3,
  },

  // ── CTA ──
  ctaText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.semiBold,
    textAlign: "center",
    marginTop: spacing.xs,
  },
});

export default HealthScoreTile;
