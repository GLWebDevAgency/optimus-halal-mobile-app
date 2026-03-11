/**
 * HealthNutritionSection — Santé & Nutrition (ex-Tab 1)
 *
 * Contains: ScoreDashboard, dietary chips, allergens, nutrient bars.
 * Now part of the continuous scroll flow.
 *
 * @module components/scan/HealthNutritionSection
 */

import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from "react-native";
import Animated from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { semantic, gold } from "@/theme/colors";
import { fontSize as fontSizeTokens, fontWeight as fontWeightTokens } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import { entryAnimations } from "@/theme/animations";
import { ScoreDashboardCard } from "@/components/scan/ScoreDashboardCard";
import { KeyCharacteristicsGrid } from "@/components/scan/KeyCharacteristicsGrid";
import { NutrientBar } from "@/components/scan/NutrientBar";
import { HEALTH_SCORE_LABEL_KEYS } from "@/components/scan/scan-constants";
import type { NutrientLevel, ScoreExclusionReason } from "@/services/api/types";

export interface HealthNutritionSectionProps {
  /** Pass-through to ScoreDashboardCard — matches HealthScoreData */
  healthScore: any;

  offExtras: {
    nutriscoreGrade?: string | null;
    novaGroup?: number | null;
    ecoscoreGrade?: string | null;
    ingredientsAnalysisTags?: string[] | null;
    additivesTags?: string[] | null;
  } | null;

  scoreExclusion: ScoreExclusionReason | null;
  dietaryAnalysis: any;
  allergensTags: string[];

  nutrientBreakdown: Array<{
    nutrient: string;
    labelKey: string;
    value: number;
    unit: string;
    level: NutrientLevel;
    dailyValuePercent: number;
    isNegative: boolean;
  }> | null;

  onNutrientPress: (nutrient: {
    nutrient: string;
    value: number;
    unit: string;
    level: NutrientLevel;
    dailyValuePercent: number;
    isNegative: boolean;
  }) => void;
}

export function HealthNutritionSection({
  healthScore,
  offExtras,
  scoreExclusion,
  dietaryAnalysis,
  allergensTags,
  nutrientBreakdown,
  onNutrientPress,
}: HealthNutritionSectionProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View>
      {/* Score Dashboard */}
      <ScoreDashboardCard
        healthScore={healthScore}
        nutriscoreGrade={offExtras?.nutriscoreGrade ?? null}
        novaGroup={offExtras?.novaGroup ?? null}
        ecoscoreGrade={offExtras?.ecoscoreGrade ?? null}
        scoreExclusion={scoreExclusion}
        labels={{
          dashboardTitle: t.scanResult.healthDashboardTitle ?? "TABLEAU DE BORD SANTÉ",
          healthScoreTitle: t.scanResult.healthScoreTitle,
          healthScoreInsufficient: t.scanResult.healthScoreInsufficient,
          healthScoreLabel: t.scanResult[HEALTH_SCORE_LABEL_KEYS[healthScore?.label ?? "mediocre"]],
          axisNutrition: t.scanResult.axisNutrition,
          axisAdditives: t.scanResult.axisAdditives,
          axisProcessing: t.scanResult.axisProcessing,
          axisTransparency: t.scanResult.axisTransparency,
          nutriScoreDesc: t.scanResult.nutriScoreDesc,
          novaGroupDesc: t.scanResult.novaGroupDesc,
          ecoScoreDesc: t.scanResult.ecoScoreDesc,
          scoreExclusionLabel: t.scanResult.scoreExclusionTitle ?? "Score non applicable",
        }}
      />

      {/* Key Characteristics — nutrition mode */}
      <KeyCharacteristicsGrid
        dietaryAnalysis={dietaryAnalysis}
        labelsTags={null}
        ingredientsAnalysisTags={offExtras?.ingredientsAnalysisTags ?? null}
        nutriscoreGrade={null}
        origins={null}
        manufacturingPlaces={null}
        additivesTags={offExtras?.additivesTags ?? null}
        mode="nutrition"
      />

      {/* Allergens */}
      {allergensTags.length > 0 && (
        <Animated.View entering={entryAnimations.slideInUp(2)}>
          <Text
            style={[styles.sectionTitle, { color: colors.textPrimary }]}
            accessibilityRole="header"
          >
            {t.scanResult.allergens}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.allergensRow}
          >
            {allergensTags.map((tag) => {
              const label = tag.replace(/^(en|fr):/, "").replace(/-/g, " ");
              return (
                <View
                  key={tag}
                  style={[
                    styles.allergenChip,
                    {
                      backgroundColor: isDark
                        ? `${semantic.warning.base}18`
                        : `${semantic.warning.base}0F`,
                      borderColor: isDark
                        ? `${semantic.warning.base}40`
                        : `${semantic.warning.base}33`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.allergenText,
                      { color: isDark ? gold[300] : gold[700] },
                    ]}
                  >
                    {label}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </Animated.View>
      )}

      {/* Nutrient Breakdown Bars */}
      {nutrientBreakdown && nutrientBreakdown.length > 0 && (
        <Animated.View entering={entryAnimations.slideInUp(4)}>
          <Text
            style={[styles.sectionTitle, { color: colors.textPrimary }]}
            accessibilityRole="header"
          >
            {t.scanResult.nutrientBreakdown ?? "Détail nutritionnel"}
          </Text>
          <View style={styles.nutrientBarsContainer}>
            {nutrientBreakdown.map((nb, idx) => (
              <NutrientBar
                key={nb.nutrient}
                label={t.scanResult[nb.labelKey as keyof typeof t.scanResult] ?? nb.nutrient.replace(/_/g, " ")}
                value={nb.value}
                unit={nb.unit}
                level={nb.level}
                dailyValuePercent={nb.dailyValuePercent}
                isNegative={nb.isNegative}
                index={idx}
                onPress={() => onNutrientPress(nb)}
              />
            ))}
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: fontSizeTokens.h4,
    fontWeight: fontWeightTokens.bold,
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
  allergensRow: {
    flexDirection: "row",
    gap: spacing.md,
    paddingRight: spacing.xl,
    marginBottom: spacing.xl,
  },
  allergenChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  allergenText: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.semiBold,
    textTransform: "capitalize",
  },
  nutrientBarsContainer: {
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.xl,
  },
});
