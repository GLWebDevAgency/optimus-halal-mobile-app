/**
 * HealthNutritionCard — Health & Nutrition Dashboard
 *
 * Yuka's strongest pattern: ScoreRing + badges + per-nutrient colored bars.
 * NutriScore/NOVA/Eco badges with proper grade colors.
 * Dietary chips (Vegan, Bio, etc.) as horizontal scroll.
 * Allergens + traces separated.
 *
 * @module components/scan/HealthNutritionCard
 */

import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { HeartIcon, CaretRightIcon } from "phosphor-react-native";

import { SectionCard } from "./SectionCard";
import { ScoreRing } from "./ScoreRing";
import { NutrientBar } from "./NutrientBar";
import { DietaryChip } from "./DietaryChip";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { gold, halalStatus as halalStatusTokens } from "@/theme/colors";
import { fontSize as fontSizeTokens, fontWeight as fontWeightTokens } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import { NUTRISCORE_COLORS, NOVA_COLORS, letterSpacing } from "./scan-constants";
import type { NutrientItem, DietaryItem } from "./scan-types";

// ── Types ──

export interface HealthNutritionCardProps {
  healthScore: { score: number; label: string } | null;
  nutriScore: string | null;
  novaGroup: number | null;
  ecoScore: string | null;
  nutrientBreakdown: NutrientItem[];
  dietaryAnalysis: DietaryItem[];
  allergens: string[];
  traces: string[];
  onNutrientPress: (nutrient: NutrientItem) => void;
  onPress: () => void;
  staggerIndex?: number;
}

// ── Score label helper ──

function getScoreLabel(score: number, t: any): string {
  if (score >= 80) return t.scanResult.scoreExcellent;
  if (score >= 60) return t.scanResult.scoreBon;
  if (score >= 40) return t.scanResult.scoreMediocre;
  if (score >= 20) return t.scanResult.scoreInsuffisant;
  return t.scanResult.scoreTresInsuffisant;
}

// ── Badge sub-component ──

function GradeBadge({ label, grade, colorMap }: {
  label: string;
  grade: string;
  colorMap: Record<string, string>;
}) {
  const { isDark } = useTheme();
  const color = colorMap[grade.toLowerCase()] ?? "#6b7280";

  return (
    <View style={[styles.badge, {
      backgroundColor: isDark ? `${color}33` : `${color}1F`,
      borderColor: isDark ? `${color}66` : `${color}40`,
    }]}>
      <Text style={[styles.badgeText, { color }]}>
        {label} {grade.toUpperCase()}
      </Text>
    </View>
  );
}

// ── Component ──

export function HealthNutritionCard({
  healthScore,
  nutriScore,
  novaGroup,
  ecoScore,
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

  const scoreLabel = healthScore
    ? getScoreLabel(healthScore.score, t)
    : t.scanResult.donneesInsuffisantes;

  return (
    <SectionCard
      icon={<HeartIcon size={16} color={isDark ? gold[400] : gold[700]} weight="bold" />}
      title={t.scanResult.santeNutrition}
      staggerIndex={staggerIndex}
    >
      {/* Score row: ScoreRing + score bar + label */}
      <View style={styles.scoreRow}>
        <ScoreRing
          score={healthScore?.score ?? null}
          size={80}
          label={scoreLabel}
        />

        <View style={styles.scoreInfo}>
          <Text style={[styles.scoreSanteLabel, { color: colors.textMuted }]}>
            {t.scanResult.scoreSante}
          </Text>

          {/* Score progress bar */}
          <View style={[styles.scoreBarTrack, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }]}>
            <View style={[
              styles.scoreBarFill,
              {
                width: `${healthScore?.score ?? 0}%`,
                backgroundColor: healthScore
                  ? (healthScore.score >= 70 ? halalStatusTokens.halal.base : healthScore.score >= 40 ? halalStatusTokens.doubtful.base : halalStatusTokens.haram.base)
                  : "#6b7280",
              },
            ]} />
          </View>

          {/* NutriScore / NOVA / Eco badges */}
          <View style={styles.badgeRow}>
            {nutriScore && (
              <GradeBadge label="Nutri" grade={nutriScore} colorMap={NUTRISCORE_COLORS} />
            )}
            {novaGroup !== null && (
              <GradeBadge label="NOVA" grade={String(novaGroup)} colorMap={
                Object.fromEntries(Object.entries(NOVA_COLORS).map(([k, v]) => [k, v]))
              } />
            )}
            {ecoScore && (
              <GradeBadge label="Eco" grade={ecoScore} colorMap={NUTRISCORE_COLORS} />
            )}
          </View>
        </View>
      </View>

      {/* Dietary chips */}
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

      {/* Nutrient bars sub-section */}
      {nutrientBreakdown.length > 0 && (
        <>
          <View style={[styles.subDivider, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }]} />
          <Text style={[styles.subHeader, { color: isDark ? gold[400] : gold[700] }]}>
            {t.scanResult.detailNutritionnel}
          </Text>
          <View style={styles.nutrientList}>
            {nutrientBreakdown.map((nb, idx) => (
              <NutrientBar
                key={nb.key}
                name={nb.name}
                value={nb.value}
                unit={nb.unit}
                percentage={nb.percentage}
                level={nb.level}
                isPositive={nb.isPositive}
                indented={nb.indented}
                staggerIndex={idx}
                onInfoPress={() => onNutrientPress(nb)}
              />
            ))}
          </View>
        </>
      )}

      {/* Allergens */}
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

      {/* Footer CTA */}
      <View style={styles.footerCTA}>
        <Pressable
          onPress={onPress}
          style={styles.footerCTARow}
          accessibilityRole="button"
          accessibilityLabel={t.scanResult.voirDetail}
        >
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
  scoreRow: {
    flexDirection: "row",
    gap: spacing.xl,
    alignItems: "flex-start",
  },
  scoreInfo: {
    flex: 1,
    gap: spacing.sm,
  },
  scoreSanteLabel: {
    fontSize: fontSizeTokens.micro,
    textTransform: "uppercase",
    letterSpacing: letterSpacing.wider,
  },
  scoreBarTrack: {
    height: 4,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  scoreBarFill: {
    height: "100%",
    borderRadius: radius.full,
  },
  badgeRow: {
    flexDirection: "row",
    gap: spacing.md,
    flexWrap: "wrap",
    marginTop: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 52,
    alignItems: "center",
  },
  badgeText: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.bold,
  },
  dietaryScroll: {
    marginTop: spacing.lg,
    marginHorizontal: -spacing["3xl"],
  },
  dietaryContent: {
    paddingHorizontal: spacing["3xl"],
    gap: spacing.sm,
  },
  subDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.lg,
  },
  subHeader: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.bold,
    textTransform: "uppercase",
    letterSpacing: letterSpacing.wider,
    marginBottom: spacing.md,
  },
  nutrientList: {
    gap: 0,
  },
  allergenRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  allergenChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  traceChip: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderStyle: "dashed",
  },
  allergenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  allergenText: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.medium,
  },
  tracesLabel: {
    fontSize: fontSizeTokens.caption,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  footerCTA: {
    alignItems: "flex-end",
    marginTop: spacing.lg,
  },
  footerCTARow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerCTAText: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.semiBold,
  },
});
