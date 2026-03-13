/**
 * HealthNutritionCard V3 — Premium Health & Nutrition Dashboard
 *
 * Gradient bar + axis tile grid + badge strips + nutrient grid.
 * Yuka-level visual density with Naqiy gold accents.
 *
 * @module components/scan/HealthNutritionCard
 */

import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  HeartIcon,
  CaretRightIcon,
  AppleLogoIcon,
  FlaskIcon,
  FactoryIcon,
  DropIcon,
  LeafIcon,
  WarningIcon,
} from "phosphor-react-native";

import { SectionCard } from "./SectionCard";
import { ScoreRing } from "./ScoreRing";
import { NutrientBar } from "./NutrientBar";
import { DietaryChip } from "./DietaryChip";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { gold, halalStatus as halalStatusTokens } from "@/theme/colors";
import { fontSize as fontSizeTokens, fontWeight as fontWeightTokens } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import {
  NUTRISCORE_COLORS,
  NOVA_COLORS,
  ECOSCORE_COLORS,
  GRADIENT_BAR_COLORS,
  letterSpacing,
} from "./scan-constants";
import type { NutrientItem, DietaryItem } from "./scan-types";

// ── Types ──

interface AxisData {
  score: number;
  max: number;
  grade?: string;
  hasHighConcern?: boolean;
}

export interface HealthNutritionCardProps {
  healthScore: {
    score: number;
    label: string;
    axes: {
      nutrition: AxisData | null;
      additives: AxisData;
      processing: AxisData | null;
      beverageSugar?: AxisData;
    };
    bonuses: { bio: number; aop: number };
    dataConfidence: "high" | "medium" | "low" | "very_low";
    cappedByAdditive: boolean;
    category: string;
  } | null;
  nutriScoreGrade?: string;
  novaGroup?: number;
  ecoScoreGrade?: string;
  nutrientBreakdown: NutrientItem[];
  dietaryAnalysis: DietaryItem[];
  allergens: string[];
  traces: string[];
  onNutrientPress: (nutrient: NutrientItem) => void;
  onPress: () => void;
  staggerIndex?: number;
}

// ── Score color helper ──

function getScoreColor(score: number): string {
  if (score >= 76) return "#22c55e";
  if (score >= 51) return "#eab308";
  if (score >= 26) return "#f97316";
  return "#ef4444";
}

function getScoreLabel(score: number, t: any): string {
  if (score >= 80) return t.scanResult.scoreExcellent;
  if (score >= 60) return t.scanResult.scoreBon;
  if (score >= 40) return t.scanResult.scoreMediocre;
  if (score >= 20) return t.scanResult.scoreInsuffisant;
  return t.scanResult.scoreTresInsuffisant;
}

// ── Sub: GradientBar ──

function GradientBar({ score }: { score: number }) {
  const { isDark } = useTheme();
  return (
    <View accessibilityLabel={`Score: ${score}/100`} style={styles.gradientBarContainer}>
      <LinearGradient
        colors={[...GRADIENT_BAR_COLORS]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientBar}
      />
      <View style={[styles.gradientIndicator, {
        left: `${Math.min(98, Math.max(2, score))}%`,
        backgroundColor: isDark ? "#fff" : "#111",
        borderColor: isDark ? "#333" : "#fff",
      }]} />
    </View>
  );
}

// ── Sub: AxisTile ──

const AXIS_ICON_MAP: Record<string, typeof AppleLogoIcon> = {
  nutrition: AppleLogoIcon,
  additives: FlaskIcon,
  processing: FactoryIcon,
  beverageSugar: DropIcon,
};

function AxisTile({ axisKey, data, label }: {
  axisKey: string;
  data: AxisData;
  label: string;
}) {
  const { isDark } = useTheme();
  const pct = data.max > 0 ? data.score / data.max : 0;
  const color = pct >= 0.7 ? "#22c55e" : pct >= 0.4 ? "#f97316" : "#ef4444";
  const Icon = AXIS_ICON_MAP[axisKey] ?? AppleLogoIcon;

  return (
    <View accessibilityLabel={`${label}: ${data.score}/${data.max}`} style={[styles.axisTile, {
      backgroundColor: isDark ? `${color}14` : `${color}0A`,
    }]}>
      <View style={styles.axisTileHeader}>
        <Icon size={14} color={color} weight="bold" />
        <Text style={[styles.axisTileLabel, { color: isDark ? "#e5e7eb" : "#374151" }]}>
          {label}
        </Text>
      </View>
      <Text style={[styles.axisTileScore, { color }]}>
        {data.score}/{data.max}
      </Text>
      <View style={[styles.axisTileBar, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }]}>
        <View style={[styles.axisTileBarFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

// ── Sub: BadgeStrip ──

function BadgeStrip({ label, grades, activeGrade, colorMap }: {
  label: string;
  grades: string[];
  activeGrade: string;
  colorMap: Record<string, string>;
}) {
  const { isDark } = useTheme();
  return (
    <View style={styles.badgeStripRow}>
      <View style={styles.badgeStripGrades}>
        {grades.map((g) => {
          const isActive = g.toLowerCase() === activeGrade.toLowerCase();
          const color = colorMap[g.toLowerCase()] ?? "#6b7280";
          return (
            <View
              key={g}
              style={[
                styles.badgeRect,
                isActive
                  ? { backgroundColor: color, transform: [{ scale: 1.15 }] }
                  : { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" },
              ]}
            >
              <Text style={[
                styles.badgeRectText,
                isActive
                  ? { color: "#fff", fontWeight: "800" }
                  : { color: isDark ? "#6b7280" : "#9ca3af", opacity: 0.5 },
              ]}>
                {g.toUpperCase()}
              </Text>
            </View>
          );
        })}
      </View>
      <Text style={[styles.badgeStripLabel, { color: isDark ? "#9ca3af" : "#6b7280" }]}>
        {label}
      </Text>
    </View>
  );
}

// ── Sub: BonusBadge ──

function BonusBadge({ label, points }: { label: string; points: number }) {
  const { isDark } = useTheme();
  if (points === 0) return null;
  return (
    <View style={[styles.bonusBadge, {
      backgroundColor: isDark ? "rgba(34,197,94,0.12)" : "rgba(34,197,94,0.08)",
      borderColor: isDark ? "rgba(34,197,94,0.30)" : "rgba(34,197,94,0.20)",
    }]}>
      <LeafIcon size={14} color="#22c55e" weight="bold" />
      <Text style={[styles.bonusBadgeText, { color: "#22c55e" }]}>
        {label}
      </Text>
      <Text style={[styles.bonusBadgePoints, { color: "#22c55e" }]}>
        +{points}
      </Text>
    </View>
  );
}

// ── Sub: NutrientGridCell ──

function NutrientGridCell({ name, value, unit, level, onPress }: {
  name: string;
  value: number;
  unit: string;
  level: string;
  onPress: () => void;
}) {
  const { isDark } = useTheme();
  const color = level === "low" ? "#22c55e" : level === "high" ? "#ef4444" : "#f97316";
  const pct = Math.min(100, value * 3); // rough visual scale

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${name}: ${value}${unit}`} style={[styles.nutrientCell, {
      backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
    }]}>
      <Text style={[styles.nutrientCellName, { color: isDark ? "#d1d5db" : "#4b5563" }]}>
        {name}
      </Text>
      <Text style={[styles.nutrientCellValue, { color: isDark ? "#f3f4f6" : "#111827" }]}>
        {value}{unit}
      </Text>
      <View style={[styles.nutrientCellBar, {
        backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
      }]}>
        <View style={[styles.nutrientCellBarFill, {
          width: `${Math.min(100, pct)}%`,
          backgroundColor: color,
        }]} />
      </View>
    </Pressable>
  );
}

// ── Main Component ──

export function HealthNutritionCard({
  healthScore,
  nutriScoreGrade,
  novaGroup,
  ecoScoreGrade,
  nutrientBreakdown,
  dietaryAnalysis,
  allergens,
  traces,
  onNutrientPress,
  onPress,
  staggerIndex = 4,
}: HealthNutritionCardProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();

  const score = healthScore?.score ?? 0;
  const scoreLabel = healthScore
    ? getScoreLabel(score, t)
    : t.scanResult.donneesInsuffisantes;

  const axes = healthScore?.axes;
  const bonuses = healthScore?.bonuses;
  const isBeverage = healthScore?.category === "beverages";

  // Top 4 nutrients for grid
  const topNutrients = nutrientBreakdown.slice(0, 4);

  return (
    <SectionCard
      icon={<HeartIcon size={16} color={isDark ? gold[400] : gold[700]} weight="bold" />}
      title={t.scanResult.santeNutrition}
      staggerIndex={staggerIndex}
    >
      {/* ── Score hero: ScoreRing + label + confidence ── */}
      <View style={styles.scoreRow}>
        <View style={styles.scoreRingWrapper}>
          <ScoreRing score={healthScore?.score ?? null} size={90} label={scoreLabel} />
        </View>
        <View style={styles.scoreInfo}>
          <Text style={[styles.scoreValue, { color: getScoreColor(score) }]}>
            {score}<Text style={styles.scoreMax}>/100</Text>
          </Text>
          <Text style={[styles.scoreLabel, { color: colors.textMuted }]}>
            {scoreLabel}
          </Text>
          {healthScore?.dataConfidence && (
            <Text style={[styles.confidenceBadge, { color: colors.textMuted }]}>
              {({ high: t.scanResult.confidenceHigh, medium: t.scanResult.confidenceMedium, low: t.scanResult.confidenceLow, very_low: t.scanResult.confidenceVeryLow } as Record<string, string>)[healthScore.dataConfidence]
                ?? healthScore.dataConfidence}
            </Text>
          )}
          {healthScore?.cappedByAdditive && (
            <View style={[styles.cappedBadge, {
              backgroundColor: isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)",
            }]}>
              <WarningIcon size={10} color="#ef4444" weight="bold" />
              <Text style={[styles.cappedText, { color: "#ef4444" }]}>
                {t.scanResult.cappedWarning}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Gradient bar ── */}
      {healthScore && <GradientBar score={score} />}

      {/* ── Axis tiles (2x2 grid) ── */}
      {axes && (
        <View style={styles.axisTileGrid}>
          {axes.nutrition && (
            <AxisTile axisKey="nutrition" data={axes.nutrition} label={t.scanResult.axisNutrition} />
          )}
          <AxisTile axisKey="additives" data={axes.additives} label={t.scanResult.axisAdditives} />
          {axes.processing && (
            <AxisTile axisKey="processing" data={axes.processing} label={t.scanResult.axisProcessing} />
          )}
          {isBeverage && axes.beverageSugar && (
            <AxisTile axisKey="beverageSugar" data={axes.beverageSugar} label={t.scanResult.axisBeverageSugar} />
          )}
        </View>
      )}

      {/* ── Bio/AOP bonuses ── */}
      {bonuses && (bonuses.bio > 0 || bonuses.aop > 0) && (
        <View style={styles.bonusRow}>
          {bonuses.bio > 0 && <BonusBadge label={t.scanResult.bonusBio} points={bonuses.bio} />}
          {bonuses.aop > 0 && <BonusBadge label={t.scanResult.bonusAop} points={bonuses.aop} />}
        </View>
      )}

      {/* ── Badge strips (NutriScore / NOVA / Eco-Score) ── */}
      {(nutriScoreGrade || novaGroup != null || ecoScoreGrade) && (
        <>
          <View style={[styles.subDivider, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }]} />
          {nutriScoreGrade && (
            <BadgeStrip
              label={t.scanResult.nutriScoreLabel}
              grades={["a", "b", "c", "d", "e"]}
              activeGrade={nutriScoreGrade}
              colorMap={NUTRISCORE_COLORS}
            />
          )}
          {novaGroup != null && (
            <BadgeStrip
              label={t.scanResult.novaLabel}
              grades={["1", "2", "3", "4"]}
              activeGrade={String(novaGroup)}
              colorMap={Object.fromEntries(Object.entries(NOVA_COLORS).map(([k, v]) => [k, v]))}
            />
          )}
          {ecoScoreGrade && (
            <BadgeStrip
              label={t.scanResult.ecoScoreLabel}
              grades={["a", "b", "c", "d", "e"]}
              activeGrade={ecoScoreGrade}
              colorMap={ECOSCORE_COLORS}
            />
          )}
        </>
      )}

      {/* ── Dietary chips ── */}
      {dietaryAnalysis.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.dietaryScroll}
          contentContainerStyle={styles.dietaryContent}
        >
          {dietaryAnalysis.map((item, idx) => (
            <DietaryChip
              key={item.key}
              label={item.label}
              status={item.status}
              icon={item.icon as any}
              index={idx}
            />
          ))}
        </ScrollView>
      )}

      {/* ── Nutrient grid (2x2) ── */}
      {topNutrients.length > 0 && (
        <>
          <View style={[styles.subDivider, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }]} />
          <Text style={[styles.subHeader, { color: isDark ? gold[400] : gold[700] }]}>
            {t.scanResult.detailNutritionnel}
          </Text>
          <View style={styles.nutrientGrid}>
            {topNutrients.map((nb) => (
              <NutrientGridCell
                key={nb.key}
                name={nb.name}
                value={nb.value}
                unit={nb.unit}
                level={nb.level}
                onPress={() => onNutrientPress(nb)}
              />
            ))}
          </View>
        </>
      )}

      {/* ── Allergens ── */}
      {(allergens.length > 0 || traces.length > 0) && (
        <>
          <View style={[styles.subDivider, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }]} />
          <Text style={[styles.subHeader, { color: isDark ? gold[400] : gold[700] }]}>
            {t.scanResult.allergenesTitle}
          </Text>
          <View style={styles.allergenRow}>
            {allergens.map((a) => (
              <View key={a} style={[styles.allergenChip, {
                backgroundColor: isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)",
              }]}>
                <View style={[styles.allergenDot, { backgroundColor: halalStatusTokens.haram.base }]} />
                <Text style={[styles.allergenText, { color: colors.textPrimary }]}>{a}</Text>
              </View>
            ))}
          </View>
          {traces.length > 0 && (
            <>
              <Text style={[styles.tracesLabel, { color: colors.textMuted }]}>
                {t.scanResult.tracesLabel}
              </Text>
              <View style={styles.allergenRow}>
                {traces.map((tr) => (
                  <View key={tr} style={[styles.allergenChip, styles.traceChip, {
                    borderColor: isDark ? "rgba(249,115,22,0.30)" : "rgba(249,115,22,0.20)",
                  }]}>
                    <View style={[styles.allergenDot, { backgroundColor: halalStatusTokens.doubtful.base }]} />
                    <Text style={[styles.allergenText, { color: colors.textPrimary }]}>{tr}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </>
      )}

      {/* ── Footer CTA ── */}
      <View style={styles.footerCTA}>
        <Pressable onPress={onPress} style={styles.footerCTARow} accessibilityRole="button">
          <Text style={[styles.footerCTAText, { color: isDark ? gold[400] : gold[700] }]}>
            {t.scanResult.voirDetail}
          </Text>
          <CaretRightIcon size={14} color={isDark ? gold[400] : gold[700]} />
        </Pressable>
      </View>
    </SectionCard>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  // Score hero
  scoreRow: { flexDirection: "row", gap: spacing.lg, alignItems: "center" },
  scoreRingWrapper: { alignItems: "center" },
  scoreInfo: { flex: 1, gap: 4 },
  scoreValue: { fontSize: 28, fontWeight: "800" },
  scoreMax: { fontSize: 14, fontWeight: "400", opacity: 0.5 },
  scoreLabel: { fontSize: fontSizeTokens.caption, fontWeight: fontWeightTokens.medium },
  confidenceBadge: { fontSize: fontSizeTokens.micro, fontWeight: fontWeightTokens.medium },
  cappedBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 2,
    alignSelf: "flex-start",
  },
  cappedText: { fontSize: fontSizeTokens.micro, fontWeight: fontWeightTokens.semiBold },

  // Gradient bar
  gradientBarContainer: { height: 8, borderRadius: 4, overflow: "hidden", marginTop: spacing.lg, position: "relative" },
  gradientBar: { flex: 1, borderRadius: 4 },
  gradientIndicator: {
    position: "absolute", top: -2, width: 12, height: 12, borderRadius: 6,
    borderWidth: 2, marginLeft: -6,
  },

  // Axis tiles
  axisTileGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.lg,
  },
  axisTile: {
    flex: 1, minWidth: "45%", padding: spacing.md, borderRadius: radius.md,
  },
  axisTileHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  axisTileLabel: { fontSize: fontSizeTokens.micro, fontWeight: fontWeightTokens.semiBold },
  axisTileScore: { fontSize: 18, fontWeight: "800", marginTop: 4 },
  axisTileBar: { height: 3, borderRadius: 2, marginTop: 6, overflow: "hidden" },
  axisTileBarFill: { height: "100%", borderRadius: 2 },

  // Bonus badges
  bonusRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  bonusBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full, borderWidth: 1,
  },
  bonusBadgeText: { fontSize: fontSizeTokens.caption, fontWeight: fontWeightTokens.semiBold },
  bonusBadgePoints: { fontSize: fontSizeTokens.caption, fontWeight: "800" },

  // Badge strips
  badgeStripRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginTop: spacing.md,
  },
  badgeStripGrades: { flexDirection: "row", gap: 4 },
  badgeRect: {
    width: 28, height: 24, borderRadius: 4,
    alignItems: "center", justifyContent: "center",
  },
  badgeRectText: { fontSize: 11, fontWeight: "700" },
  badgeStripLabel: { fontSize: fontSizeTokens.micro, fontWeight: fontWeightTokens.medium },

  // Dietary
  dietaryScroll: { marginTop: spacing.lg, marginHorizontal: -spacing["3xl"] },
  dietaryContent: { paddingHorizontal: spacing["3xl"], gap: spacing.sm },

  // Nutrient grid
  nutrientGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  nutrientCell: {
    flex: 1, minWidth: "45%", padding: spacing.md, borderRadius: radius.md,
  },
  nutrientCellName: { fontSize: fontSizeTokens.micro, fontWeight: fontWeightTokens.medium },
  nutrientCellValue: { fontSize: 16, fontWeight: "700", marginTop: 2 },
  nutrientCellBar: { height: 3, borderRadius: 2, marginTop: 6, overflow: "hidden" },
  nutrientCellBarFill: { height: "100%", borderRadius: 2 },

  // Shared
  subDivider: { height: StyleSheet.hairlineWidth, marginVertical: spacing.lg },
  subHeader: {
    fontSize: fontSizeTokens.micro, fontWeight: fontWeightTokens.bold,
    textTransform: "uppercase", letterSpacing: letterSpacing.wider, marginBottom: spacing.md,
  },
  allergenRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  allergenChip: {
    flexDirection: "row", alignItems: "center", gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full,
  },
  traceChip: { backgroundColor: "transparent", borderWidth: 1, borderStyle: "dashed" },
  allergenDot: { width: 8, height: 8, borderRadius: 4 },
  allergenText: { fontSize: fontSizeTokens.caption, fontWeight: fontWeightTokens.medium },
  tracesLabel: { fontSize: fontSizeTokens.caption, marginTop: spacing.md, marginBottom: spacing.sm },
  footerCTA: { alignItems: "flex-end", marginTop: spacing.lg },
  footerCTARow: { flexDirection: "row", alignItems: "center", gap: 4 },
  footerCTAText: { fontSize: fontSizeTokens.caption, fontWeight: fontWeightTokens.semiBold },
});
