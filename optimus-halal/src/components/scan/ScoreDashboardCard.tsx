/**
 * ScoreDashboardCard — Unified health & nutrition dashboard.
 *
 * Merges Health Score (Naqiy proprietary) with NutriScore/NOVA/Eco-Score
 * into a single premium card. Avoids fragmenting nutritional data into
 * separate sections — one card, one glance, full picture.
 *
 * Layout:
 *   ┌──────────────────────────────────────────────┐
 *   │  TABLEAU DE BORD SANTÉ                       │
 *   │  ┌────────┐     NutriScore  NOVA  Eco-Score  │
 *   │  │   72   │     ┌───┐      ┌───┐   ┌───┐    │
 *   │  │  /100  │     │ B │      │ 2 │   │ C │    │
 *   │  │ Bon●●● │     └───┘      └───┘   └───┘    │
 *   │  └────────┘                                  │
 *   │  Nutrition   ████████████░░░  32/40          │
 *   │  Additifs    ██████████░░░░░  18/30          │
 *   │  Processing  ████████░░░░░░░  12/20          │
 *   │  Transparence████████████░░░   8/10          │
 *   └──────────────────────────────────────────────┘
 */

import React, { useEffect } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from "react-native-reanimated";
import { ChartBarIcon, InfoIcon, QuestionIcon } from "phosphor-react-native";
import { useTheme } from "@/hooks/useTheme";
import { glass } from "@/theme/colors";
import { spacing, radius } from "@/theme/spacing";
import { fontSize, fontWeight } from "@/theme/typography";
import { springNaqiy } from "@/theme/animations";
import type { ScoreExclusionReason } from "@/services/api/types";

// ── Color maps (same as scan-result.tsx, kept local to avoid circular imports) ──

const NUTRISCORE_COLORS: Record<string, string> = {
  a: "#22c55e",
  b: "#84cc16",
  c: "#eab308",
  d: "#f97316",
  e: "#ef4444",
};

const NOVA_COLORS: Record<number, string> = {
  1: "#22c55e",
  2: "#eab308",
  3: "#f97316",
  4: "#ef4444",
};

const HEALTH_SCORE_COLORS: Record<string, string> = {
  excellent: "#2DC653",
  good: "#85C93B",
  mediocre: "#FFC107",
  poor: "#FF6F00",
  very_poor: "#E53935",
};

// ── Types ──

interface HealthScoreAxis {
  score: number;
  max: number;
}

interface HealthScoreData {
  score: number | null;
  label: string | null;
  dataConfidence: string;
  axes: {
    nutrition: HealthScoreAxis | null;
    additives: HealthScoreAxis | null;
    processing: HealthScoreAxis | null;
    transparency: HealthScoreAxis | null;
  };
}

interface ScoreDashboardLabels {
  dashboardTitle: string;
  healthScoreTitle: string;
  healthScoreInsufficient: string;
  healthScoreLabel: string;
  axisNutrition: string;
  axisAdditives: string;
  axisProcessing: string;
  axisTransparency: string;
  nutriScoreDesc: string;
  novaGroupDesc: string;
  ecoScoreDesc: string;
  scoreExclusionLabel: string;
}

interface ScoreDashboardCardProps {
  healthScore: HealthScoreData | null;
  nutriscoreGrade: string | null;
  novaGroup: number | null;
  ecoscoreGrade: string | null;
  scoreExclusion: ScoreExclusionReason | null;
  labels: ScoreDashboardLabels;
}

// ── Animated Axis Bar ──

const AxisBar = React.memo(function AxisBar({
  label,
  axis,
  index,
}: {
  label: string;
  axis: HealthScoreAxis | null;
  index: number;
}) {
  const { isDark, colors } = useTheme();
  const barWidth = useSharedValue(0);

  const pct = axis ? (axis.score / axis.max) * 100 : 0;
  const barColor = axis
    ? pct >= 70
      ? "#2DC653"
      : pct >= 40
        ? "#FFC107"
        : "#E53935"
    : colors.textMuted;

  useEffect(() => {
    if (axis) {
      barWidth.value = withDelay(
        200 + index * 100,
        withSpring(pct, springNaqiy)
      );
    }
  }, [axis, pct, index, barWidth]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value}%`,
    backgroundColor: barColor,
  }));

  return (
    <View style={axisStyles.row}>
      <Text
        style={[axisStyles.label, { color: colors.textSecondary }]}
        numberOfLines={1}
      >
        {label}
      </Text>
      <View
        style={[
          axisStyles.barBg,
          {
            backgroundColor: isDark
              ? "rgba(255,255,255,0.06)"
              : "rgba(0,0,0,0.06)",
          },
        ]}
      >
        <Animated.View style={[axisStyles.barFill, barStyle]} />
      </View>
      <Text style={[axisStyles.fraction, { color: colors.textMuted }]}>
        {axis ? `${axis.score}/${axis.max}` : "—"}
      </Text>
    </View>
  );
});

const axisStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  label: {
    width: 100,
    fontSize: fontSize.micro,
    fontWeight: fontWeight.medium,
  },
  barBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },
  fraction: {
    width: 40,
    fontSize: fontSize.micro,
    fontWeight: fontWeight.semiBold,
    textAlign: "right" as const,
  },
});

// ── Inline Score Badge ──

const InlineBadge = React.memo(function InlineBadge({
  label,
  value,
  color,
  desc,
}: {
  label: string;
  value: string;
  color: string;
  desc: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={badgeStyles.container}>
      <View
        style={[
          badgeStyles.circle,
          { backgroundColor: `${color}15`, borderColor: color },
        ]}
      >
        <Text style={[badgeStyles.value, { color }]}>
          {value.toUpperCase()}
        </Text>
      </View>
      <Text
        style={[badgeStyles.label, { color: colors.textPrimary }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
});

const badgeStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.xs,
    flex: 1,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.black,
  },
  label: {
    fontSize: fontSize.micro,
    fontWeight: fontWeight.medium,
  },
});

// ── Main Component ──

export const ScoreDashboardCard = React.memo(function ScoreDashboardCard({
  healthScore,
  nutriscoreGrade,
  novaGroup,
  ecoscoreGrade,
  scoreExclusion,
  labels,
}: ScoreDashboardCardProps) {
  const { isDark, colors } = useTheme();

  const hasInlineBadges = nutriscoreGrade || novaGroup || ecoscoreGrade;
  const hsColor = HEALTH_SCORE_COLORS[healthScore?.label ?? "mediocre"];

  const confidenceDots =
    healthScore?.dataConfidence === "high"
      ? "●●●"
      : healthScore?.dataConfidence === "medium"
        ? "●●○"
        : "●○○";

  // Score exclusion — show info message instead
  if (scoreExclusion) {
    return (
      <Animated.View entering={FadeInDown.delay(60).duration(300)}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? glass.dark.bg : "#ffffff",
              borderColor: isDark ? glass.dark.border : "rgba(0,0,0,0.06)",
            },
          ]}
        >
          <View style={styles.exclusionRow}>
            <InfoIcon size={22}
              color={colors.textMuted} />
            <View style={styles.exclusionText}>
              <Text
                style={[styles.exclusionTitle, { color: colors.textPrimary }]}
              >
                {labels.scoreExclusionLabel}
              </Text>
              <Text
                style={[styles.exclusionDesc, { color: colors.textSecondary }]}
              >
                {scoreExclusion.replace(/_/g, " ")}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInDown.delay(60).duration(300)}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? glass.dark.bg : "#ffffff",
            borderColor: isDark ? glass.dark.border : "rgba(0,0,0,0.06)",
          },
        ]}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <ChartBarIcon size={16} color={colors.textMuted} />
          <Text style={[styles.headerText, { color: colors.textMuted }]}>
            {labels.dashboardTitle}
          </Text>
        </View>

        {/* ── Top row: Health Score circle + inline badges ── */}
        <View style={styles.topRow}>
          {/* Health Score circle */}
          {healthScore?.score != null ? (
            <View style={styles.scoreColumn}>
              <View
                style={[
                  styles.scoreCircle,
                  {
                    borderColor: hsColor,
                    backgroundColor: `${hsColor}15`,
                  },
                ]}
              >
                <Text style={[styles.scoreValue, { color: hsColor }]}>
                  {healthScore.score}
                </Text>
                <Text
                  style={[styles.scoreMax, { color: colors.textMuted }]}
                >
                  /100
                </Text>
              </View>
              <Text style={[styles.scoreLabel, { color: hsColor }]}>
                {labels.healthScoreLabel}
              </Text>
              <Text
                style={[styles.confidenceDots, { color: colors.textMuted }]}
              >
                {confidenceDots}
              </Text>
            </View>
          ) : (
            <View style={styles.scoreColumn}>
              <View
                style={[
                  styles.scoreCircleMuted,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.04)"
                      : "rgba(0,0,0,0.03)",
                    borderColor: isDark
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.08)",
                  },
                ]}
              >
                <QuestionIcon size={24}
                  color={colors.textMuted} />
              </View>
              <Text
                style={[
                  styles.insufficientText,
                  { color: colors.textMuted },
                ]}
                numberOfLines={2}
              >
                {labels.healthScoreInsufficient}
              </Text>
            </View>
          )}

          {/* Inline NutriScore / NOVA / Eco badges */}
          {hasInlineBadges && (
            <View style={styles.badgesColumn}>
              {nutriscoreGrade && (
                <InlineBadge
                  label="Nutri-Score"
                  value={nutriscoreGrade}
                  color={NUTRISCORE_COLORS[nutriscoreGrade] ?? "#94a3b8"}
                  desc={labels.nutriScoreDesc}
                />
              )}
              {novaGroup && (
                <InlineBadge
                  label="NOVA"
                  value={String(novaGroup)}
                  color={NOVA_COLORS[novaGroup] ?? "#94a3b8"}
                  desc={labels.novaGroupDesc}
                />
              )}
              {ecoscoreGrade && (
                <InlineBadge
                  label="Eco-Score"
                  value={ecoscoreGrade}
                  color={NUTRISCORE_COLORS[ecoscoreGrade] ?? "#94a3b8"}
                  desc={labels.ecoScoreDesc}
                />
              )}
            </View>
          )}
        </View>

        {/* ── Divider ── */}
        {healthScore?.score != null && (
          <View
            style={[
              styles.divider,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(0,0,0,0.06)",
              },
            ]}
          />
        )}

        {/* ── 4 axis bars ── */}
        {healthScore?.score != null && (
          <View style={styles.axes}>
            {(
              [
                { key: "nutrition", label: labels.axisNutrition, axis: healthScore.axes.nutrition },
                { key: "additives", label: labels.axisAdditives, axis: healthScore.axes.additives },
                { key: "processing", label: labels.axisProcessing, axis: healthScore.axes.processing },
                { key: "transparency", label: labels.axisTransparency, axis: healthScore.axes.transparency },
              ] as const
            ).map(({ key, label, axis }, idx) => (
              <AxisBar key={key} label={label} axis={axis} index={idx} />
            ))}
          </View>
        )}
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing["2xl"],
    marginBottom: spacing["3xl"],
    gap: spacing.lg,
    ...(Platform.OS === "ios"
      ? {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        }
      : { elevation: 2 }),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerText: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.8,
    textTransform: "uppercase" as const,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xl,
  },
  scoreColumn: {
    alignItems: "center",
    gap: spacing.xs,
    minWidth: 80,
  },
  scoreCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreCircleMuted: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreValue: {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.black,
    lineHeight: 30,
  },
  scoreMax: {
    fontSize: fontSize.micro,
    fontWeight: fontWeight.medium,
    marginTop: -2,
  },
  scoreLabel: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.bold,
  },
  confidenceDots: {
    fontSize: fontSize.caption,
    letterSpacing: Platform.OS === "android" ? 0.3 : 2,
    marginTop: -2,
  },
  insufficientText: {
    fontSize: fontSize.micro,
    fontWeight: fontWeight.medium,
    textAlign: "center" as const,
    maxWidth: 80,
    lineHeight: 14,
  },
  badgesColumn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    gap: spacing.sm,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.xs,
  },
  axes: {
    gap: spacing.md,
  },
  exclusionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    paddingVertical: spacing.md,
  },
  exclusionText: {
    flex: 1,
    gap: spacing.xs,
  },
  exclusionTitle: {
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.bold,
  },
  exclusionDesc: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    textTransform: "capitalize" as const,
  },
});

export default ScoreDashboardCard;
