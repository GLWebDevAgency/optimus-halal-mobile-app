/**
 * HealthNutritionCard V5 — Horizon Premium Minimalist Santé Tab
 *
 * Pixel-for-pixel match with scan-result-horizon.html mockup.
 * Full circle ring hero → NutriScore bar → Axes rows → 2-col nutrient grid
 * → NOVA card → Allergen tags → Label pills → Disclaimer.
 *
 * Each section separated by hairline dividers with gold section headers.
 * All elements are clickable → open bottom sheet with detail.
 *
 * @module components/scan/HealthNutritionCard
 */

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedProps,
  useAnimatedReaction,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { useReducedMotion } from "react-native-reanimated";
import {
  InfoIcon,
  BabyIcon,
  BabyCarriageIcon,
  ChartBarIcon,
  BowlFoodIcon,
  CookingPotIcon,
  FlaskIcon,
  WarningCircleIcon,
  TagIcon,
  HeartbeatIcon,
} from "phosphor-react-native";

import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { gold } from "@/theme/colors";
import { radius } from "@/theme/spacing";
import { NUTRISCORE_COLORS, NOVA_COLORS } from "./scan-constants";
import type { NutrientItem, DietaryItem, DetectedAdditive } from "./scan-types";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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
  novaLabel?: string;
  ecoScoreGrade?: string;
  nutrientBreakdown: NutrientItem[];
  dietaryAnalysis?: DietaryItem[];
  allergens: string[];
  traces?: string[];
  labels?: string[];
  // Primary callbacks
  onScorePress?: () => void;
  onNutriScorePress?: () => void;
  onAxisPress?: (axis: { name: string; score: number; max: number }) => void;
  onNutrientPress?: (nutrient: NutrientItem) => void;
  onNovaPress?: () => void;
  onAllergenPress?: (allergen: string) => void;
  onLabelPress?: (label: string) => void;
  /** All detected additives — health perspective */
  detectedAdditives?: DetectedAdditive[];
  onAdditivePress?: (additive: DetectedAdditive) => void;
  // Legacy backward-compat
  onPress?: () => void;
  staggerIndex?: number;
}

// ── Helpers ──

const GRADE_THRESHOLDS: [number, string][] = [
  [80, "A"],
  [60, "B"],
  [40, "C"],
  [20, "D"],
  [0, "E"],
];

const GRADE_COLORS: Record<string, string> = {
  A: "#22c55e",
  B: "#22c55e",
  C: "#f59e0b",
  D: "#f97316",
  E: "#ef4444",
};

function getScoreGrade(score: number): string {
  for (const [threshold, grade] of GRADE_THRESHOLDS) {
    if (score >= threshold) return grade;
  }
  return "E";
}

function getGradeColor(grade: string): string {
  return GRADE_COLORS[grade] ?? "#6b7280";
}

function getAxisColor(score: number, max: number): string {
  if (max === 0) return "#6b7280";
  const pct = score / max;
  if (pct >= 0.7) return "#22c55e";
  if (pct >= 0.4) return "#f59e0b";
  return "#ef4444";
}

const NOVA_DESCRIPTIONS: Record<number, string> = {
  1: "Aliments non transformés",
  2: "Ingrédients culinaires transformés",
  3: "Aliments transformés",
  4: "Produits ultra-transformés",
};

// ── Sub: SectionHeader ──

function SectionHeader({
  icon,
  title,
  annotation,
}: {
  icon: React.ReactNode;
  title: string;
  annotation?: string;
}) {
  const { isDark } = useTheme();
  const goldColor = isDark ? gold[400] : gold[700];

  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        {icon}
        <Text
          style={[
            styles.sectionTitle,
            { color: isDark ? "#fff" : "#0d1b13" },
          ]}
        >
          {title}
        </Text>
      </View>
      {annotation ? (
        <Text style={[styles.sectionAnnotation, { color: goldColor }]}>
          {annotation}
        </Text>
      ) : null}
    </View>
  );
}

// ── Sub: HairlineDivider ──

function HairlineDivider() {
  const { isDark } = useTheme();
  return (
    <View
      style={[
        styles.hairline,
        {
          backgroundColor: isDark
            ? "rgba(255,255,255,0.07)"
            : "rgba(0,0,0,0.06)",
        },
      ]}
    />
  );
}

// ── Sub: HealthRing — Full circle animated SVG (pure visual, no layout) ──

const RING_SIZE = 80;
const RING_R = 34;
const RING_STROKE = 6;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R;

function HealthRing({
  score,
  grade,
  gradeColor,
}: {
  score: number;
  grade: string;
  gradeColor: string;
}) {
  const { isDark } = useTheme();
  const reducedMotion = useReducedMotion();

  const progress = useSharedValue(0);
  const [displayScore, setDisplayScore] = useState(reducedMotion ? score : 0);
  const trackColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";

  useEffect(() => {
    const target = score / 100;
    if (reducedMotion) {
      progress.value = target;
      setDisplayScore(score);
    } else {
      progress.value = withTiming(target, {
        duration: 1200,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [score, reducedMotion]);

  useAnimatedReaction(
    () => Math.round(progress.value * 100),
    (val) => {
      if (!reducedMotion) {
        runOnJS(setDisplayScore)(val);
      }
    },
  );

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: RING_CIRCUMFERENCE * (1 - progress.value),
  }));

  return (
    <View style={styles.ringWrapper}>
      <Svg
        width={RING_SIZE}
        height={RING_SIZE}
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        style={{ transform: [{ rotate: "-90deg" }] }}
      >
        {/* Track */}
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_R}
          fill="none"
          stroke={trackColor}
          strokeWidth={RING_STROKE}
        />
        {/* Progress */}
        <AnimatedCircle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_R}
          fill="none"
          stroke={gradeColor}
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          animatedProps={animatedProps}
        />
      </Svg>
      {/* Numeric score inside ring (colored) */}
      <View style={styles.ringOverlay} pointerEvents="none">
        <Text style={[styles.ringGrade, { color: gradeColor }]}>{displayScore}</Text>
        <Text
          style={[
            styles.ringScore,
            { color: isDark ? "#A0A0A0" : "#6b7280" },
          ]}
        >
          /100
        </Text>
      </View>
    </View>
  );
}

// ── Sub: NutriScoreBar ──

const NS_GRADES = ["A", "B", "C", "D", "E"] as const;

function NutriScoreBar({
  activeGrade,
  onPress,
}: {
  activeGrade: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Nutri-Score ${activeGrade.toUpperCase()}`}
      style={styles.nutriScoreBarContainer}
    >
      <View style={styles.nutriScoreBar}>
        {NS_GRADES.map((g) => {
          const isActive =
            g.toLowerCase() === activeGrade.toLowerCase();
          const color = NUTRISCORE_COLORS[g.toLowerCase()] ?? "#6b7280";
          return (
            <View
              key={g}
              style={[
                styles.nutriScoreSegment,
                { backgroundColor: color, opacity: isActive ? 1 : 0.25 },
                isActive && styles.nutriScoreSegmentActive,
              ]}
            >
              <Text
                style={[
                  styles.nutriScoreSegmentText,
                  isActive && { fontWeight: "800" },
                ]}
              >
                {g}
              </Text>
            </View>
          );
        })}
      </View>
    </Pressable>
  );
}

// ── Sub: AxisRow ──

function AxisRow({
  name,
  score,
  max,
  color,
  onPress,
}: {
  name: string;
  score: number;
  max: number;
  color: string;
  onPress?: () => void;
}) {
  const { isDark } = useTheme();
  const pct = max > 0 ? Math.min(100, (score / max) * 100) : 0;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name}: ${score}/${max}`}
      style={styles.axisRow}
    >
      <View style={styles.axisHeader}>
        <Text
          style={[
            styles.axisName,
            { color: isDark ? "#fff" : "#0d1b13" },
          ]}
        >
          {name}
        </Text>
        <Text style={[styles.axisScore, { color }]}>
          {score}/{max}
        </Text>
      </View>
      <View
        style={[
          styles.axisBar,
          {
            backgroundColor: isDark
              ? "rgba(255,255,255,0.06)"
              : "rgba(0,0,0,0.06)",
          },
        ]}
      >
        <View
          style={[
            styles.axisBarFill,
            { width: `${pct}%`, backgroundColor: color },
          ]}
        />
      </View>
    </Pressable>
  );
}

// ── Sub: NutrientGridCell ──

function NutrientGridCell({
  nutrient,
  onPress,
}: {
  nutrient: NutrientItem;
  onPress?: () => void;
}) {
  const { isDark } = useTheme();
  const barColor =
    nutrient.level === "low" || nutrient.level === "very_low"
      ? "#22c55e"
      : nutrient.level === "high" || nutrient.level === "very_high"
        ? "#ef4444"
        : isDark
          ? "rgba(255,255,255,0.2)"
          : "rgba(0,0,0,0.15)";

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${nutrient.name}: ${nutrient.value}${nutrient.unit}`}
      style={[
        styles.nutrientCell,
        {
          backgroundColor: isDark
            ? "rgba(255,255,255,0.03)"
            : "rgba(255,255,255,0.6)",
          borderColor: isDark
            ? "rgba(255,255,255,0.06)"
            : "rgba(0,0,0,0.04)",
        },
      ]}
    >
      <Text
        style={[
          styles.nutrientCellLabel,
          { color: isDark ? "#A0A0A0" : "#6b7280" },
        ]}
        numberOfLines={1}
      >
        {nutrient.name.toUpperCase()}
      </Text>
      <View style={styles.nutrientCellValueRow}>
        <Text
          style={[
            styles.nutrientCellValue,
            { color: isDark ? "#fff" : "#0d1b13" },
          ]}
        >
          {nutrient.value}
        </Text>
        <Text
          style={[
            styles.nutrientCellUnit,
            { color: isDark ? "#A0A0A0" : "#6b7280" },
          ]}
        >
          {" "}
          {nutrient.unit}
        </Text>
      </View>
      <View
        style={[
          styles.nutrientCellBar,
          {
            backgroundColor: isDark
              ? "rgba(255,255,255,0.06)"
              : "rgba(0,0,0,0.06)",
          },
        ]}
      >
        <View
          style={[
            styles.nutrientCellBarFill,
            {
              width: `${Math.min(100, nutrient.percentage)}%`,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>
    </Pressable>
  );
}

// ── Sub: NovaCard ──

function NovaCard({
  group,
  label,
  onPress,
}: {
  group: number;
  label: string;
  onPress?: () => void;
}) {
  const { isDark } = useTheme();
  const color =
    NOVA_COLORS[group as keyof typeof NOVA_COLORS] ?? "#6b7280";

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`NOVA ${group}: ${label}`}
      style={[
        styles.novaCard,
        {
          backgroundColor: isDark
            ? "rgba(255,255,255,0.03)"
            : "rgba(255,255,255,0.6)",
          borderColor: isDark
            ? "rgba(255,255,255,0.06)"
            : "rgba(0,0,0,0.04)",
        },
      ]}
    >
      <View style={[styles.novaBadge, { backgroundColor: color }]}>
        <Text style={styles.novaBadgeText}>{group}</Text>
      </View>
      <View style={styles.novaInfo}>
        <Text
          style={[
            styles.novaTitle,
            { color: isDark ? "#fff" : "#0d1b13" },
          ]}
        >
          NOVA {group}
        </Text>
        <Text
          style={[
            styles.novaDesc,
            { color: isDark ? "#A0A0A0" : "#6b7280" },
          ]}
          numberOfLines={2}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

// ── Sub: AllergenTag ──

function AllergenTag({
  allergen,
  onPress,
}: {
  allergen: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={allergen}
      style={styles.allergenTag}
    >
      <Text style={styles.allergenTagText}>{"\u26A0"} {allergen}</Text>
    </Pressable>
  );
}

// ── Sub: LabelPill ──

function LabelPill({
  label,
  onPress,
}: {
  label: string;
  onPress?: () => void;
}) {
  const { isDark } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        styles.labelPill,
        {
          backgroundColor: isDark
            ? "rgba(255,255,255,0.03)"
            : "rgba(0,0,0,0.02)",
          borderColor: isDark
            ? "rgba(255,255,255,0.08)"
            : "rgba(0,0,0,0.06)",
        },
      ]}
    >
      <Text
        style={[
          styles.labelPillText,
          { color: isDark ? "#d1d5db" : "#4b5563" },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ── Sub: HealthAdditivesSection — Health-focused additive list ──

const HEALTH_TOXICITY_CONFIG: Record<string, { color: string; label: string; weight: number }> = {
  high_concern:     { color: "#ef4444", label: "Élevé",  weight: 4 },
  moderate_concern: { color: "#f97316", label: "Modéré", weight: 3 },
  low_concern:      { color: "#84cc16", label: "Limité", weight: 2 },
  safe:             { color: "#22c55e", label: "Aucun",  weight: 1 },
};

function HealthAdditivesSection({
  additives,
  onAdditivePress,
}: {
  additives: DetectedAdditive[];
  onAdditivePress?: (additive: DetectedAdditive) => void;
}) {
  const { isDark, colors } = useTheme();

  // Sort by toxicity (most concerning first), then by pregnancy/children risk
  const sorted = React.useMemo(() => {
    return [...additives].sort((a, b) => {
      const wa = HEALTH_TOXICITY_CONFIG[a.toxicityLevel]?.weight ?? 0;
      const wb = HEALTH_TOXICITY_CONFIG[b.toxicityLevel]?.weight ?? 0;
      if (wa !== wb) return wb - wa;
      // Secondary: risk flags
      const ra = (a.riskPregnant ? 2 : 0) + (a.riskChildren ? 1 : 0);
      const rb = (b.riskPregnant ? 2 : 0) + (b.riskChildren ? 1 : 0);
      if (ra !== rb) return rb - ra;
      return a.code.localeCompare(b.code);
    });
  }, [additives]);

  return (
    <View style={styles.healthAdditivesList}>
      {sorted.map((additive, index) => {
        const tox = HEALTH_TOXICITY_CONFIG[additive.toxicityLevel] ?? HEALTH_TOXICITY_CONFIG.safe;
        const hasWarnings = additive.riskPregnant || additive.riskChildren;
        const hasEffect = !!additive.healthEffectsFr;
        const isConcerning = tox.weight >= 3; // moderate_concern or high_concern

        return (
          <Pressable
            key={additive.code}
            onPress={onAdditivePress ? () => onAdditivePress(additive) : undefined}
            accessibilityRole="button"
            accessibilityLabel={`${additive.code} ${additive.nameFr}`}
            style={[
              styles.healthAdditiveRow,
              index > 0 && {
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
              },
            ]}
          >
            {/* Left color bar for concerning additives */}
            {isConcerning && (
              <View style={[styles.healthAdditiveBar, { backgroundColor: tox.color }]} />
            )}

            <View style={{ flex: 1 }}>
              {/* Code + Name row */}
              <View style={styles.healthAdditiveHeader}>
                <Text
                  style={[
                    styles.healthAdditiveCode,
                    { color: isConcerning ? tox.color : colors.textMuted },
                  ]}
                >
                  {additive.code}
                </Text>
                <Text
                  style={[
                    styles.healthAdditiveName,
                    { color: isConcerning ? tox.color : colors.textPrimary },
                  ]}
                  numberOfLines={1}
                >
                  {additive.nameFr}
                </Text>
              </View>

              {/* Health effect description */}
              {hasEffect && (
                <Text
                  style={[
                    styles.healthAdditiveEffect,
                    { color: isConcerning ? tox.color : colors.textMuted },
                  ]}
                  numberOfLines={2}
                >
                  {additive.healthEffectsFr}
                </Text>
              )}

              {/* Risk warning pills */}
              {hasWarnings && (
                <View style={styles.healthAdditiveWarnings}>
                  {additive.riskPregnant && (
                    <View style={[styles.healthWarningPill, { backgroundColor: "#ef444414" }]}>
                      <BabyIcon size={13} color="#ef4444" weight="bold" />
                      <Text style={[styles.healthWarningText, { color: "#ef4444" }]}>
                        Grossesse
                      </Text>
                    </View>
                  )}
                  {additive.riskChildren && (
                    <View style={[styles.healthWarningPill, { backgroundColor: "#f9731614" }]}>
                      <BabyCarriageIcon size={13} color="#f97316" weight="bold" />
                      <Text style={[styles.healthWarningText, { color: "#f97316" }]}>
                        Enfants
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Right: toxicity badge */}
            <View style={[styles.healthToxBadge, { backgroundColor: `${tox.color}14` }]}>
              <View style={[styles.healthToxDot, { backgroundColor: tox.color }]} />
              <Text style={[styles.healthToxText, { color: tox.color }]}>
                {tox.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

// ── Main Component ──

export function HealthNutritionCard({
  healthScore,
  nutriScoreGrade,
  novaGroup,
  novaLabel,
  nutrientBreakdown,
  allergens,
  labels,
  onScorePress,
  onNutriScorePress,
  onAxisPress,
  onNutrientPress,
  onNovaPress,
  onAllergenPress,
  onLabelPress,
  detectedAdditives,
  onAdditivePress,
  onPress,
  staggerIndex = 4,
}: HealthNutritionCardProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();

  const score = healthScore?.score ?? 0;
  const grade = getScoreGrade(score);
  const gradeColor = getGradeColor(grade);

  // Map backend label key to i18n
  const SCORE_LABEL_KEYS: Record<string, string> = {
    excellent: "healthScoreExcellent",
    good: "healthScoreGood",
    mediocre: "healthScoreMediocre",
    poor: "healthScorePoor",
    very_poor: "healthScoreVeryPoor",
  };
  const scoreLabelKey = SCORE_LABEL_KEYS[healthScore?.label ?? ""] ?? "";
  const scoreLabel = scoreLabelKey
    ? ((t.scanResult as Record<string, string>)[scoreLabelKey] ?? healthScore?.label ?? "")
    : (healthScore?.label ?? "");

  const confidence = healthScore
    ? (
        {
          high: t.scanResult.confidenceHigh,
          medium: t.scanResult.confidenceMedium,
          low: t.scanResult.confidenceLow,
          very_low: t.scanResult.confidenceVeryLow,
        } as Record<string, string>
      )[healthScore.dataConfidence] ?? ""
    : "";

  // Resolve score press handler (new callback or legacy)
  const handleScorePress = onScorePress ?? onPress;

  // Convert axes object to array for rendering
  const axesArray: { name: string; score: number; max: number; color: string }[] = [];
  if (healthScore?.axes) {
    const axes = healthScore.axes;
    if (axes.nutrition) {
      axesArray.push({
        name: t.scanResult.axisNutrition,
        score: axes.nutrition.score,
        max: axes.nutrition.max,
        color: getAxisColor(axes.nutrition.score, axes.nutrition.max),
      });
    }
    axesArray.push({
      name: t.scanResult.axisAdditives,
      score: axes.additives.score,
      max: axes.additives.max,
      color: getAxisColor(axes.additives.score, axes.additives.max),
    });
    if (axes.processing) {
      axesArray.push({
        name: t.scanResult.axisProcessing,
        score: axes.processing.score,
        max: axes.processing.max,
        color: getAxisColor(axes.processing.score, axes.processing.max),
      });
    }
    if (axes.beverageSugar) {
      axesArray.push({
        name: t.scanResult.axisBeverageSugar ?? "Sucres boissons",
        score: axes.beverageSugar.score,
        max: axes.beverageSugar.max,
        color: getAxisColor(axes.beverageSugar.score, axes.beverageSugar.max),
      });
    }
  }

  // NOVA label fallback
  const novaDescription =
    novaLabel ??
    (novaGroup ? (NOVA_DESCRIPTIONS[novaGroup] ?? "") : "");

  const SPRING_NAQIY = { damping: 14, stiffness: 170, mass: 0.9 };

  return (
    <Animated.View
      entering={FadeInUp.delay(staggerIndex * 100)
        .springify()
        .damping(SPRING_NAQIY.damping)
        .stiffness(SPRING_NAQIY.stiffness)
        .mass(SPRING_NAQIY.mass)}
      style={styles.container}
    >
      {/* ═══ 1. Health Score Hero (mockup: .hsh) ═══ */}
      {healthScore && (
        <Pressable
          onPress={handleScorePress}
          accessibilityRole="button"
          accessibilityLabel={`Score santé ${grade} ${score}/100`}
          style={styles.healthHero}
        >
          <HealthRing score={score} grade={grade} gradeColor={gradeColor} />
          <View style={styles.healthHeroInfo}>
            <Text
              style={[
                styles.healthHeroLabel,
                { color: gradeColor },
              ]}
            >
              {scoreLabel}
            </Text>
            <Text
              style={[
                styles.healthHeroDesc,
                { color: isDark ? "#A0A0A0" : "#4b5563" },
              ]}
            >
              Score Naqiy Santé V3 — {confidence}
            </Text>
          </View>
        </Pressable>
      )}

      {/* ═══ 2. Nutri-Score ═══ */}
      {nutriScoreGrade && (
        <>
          <HairlineDivider />
          <SectionHeader icon={<ChartBarIcon size={16} color={isDark ? gold[400] : gold[700]} weight="bold" />} title={t.scanResult.nutriScoreLabel} />
          <NutriScoreBar
            activeGrade={nutriScoreGrade}
            onPress={onNutriScorePress}
          />
        </>
      )}

      {/* ═══ 3. Axes de santé ═══ */}
      {axesArray.length > 0 && (
        <>
          <HairlineDivider />
          <SectionHeader icon={<HeartbeatIcon size={16} color={isDark ? gold[400] : gold[700]} weight="bold" />} title="Axes de santé" />
          <View style={styles.axesList}>
            {axesArray.map((axis) => (
              <AxisRow
                key={axis.name}
                name={axis.name}
                score={axis.score}
                max={axis.max}
                color={axis.color}
                onPress={
                  onAxisPress
                    ? () =>
                        onAxisPress({
                          name: axis.name,
                          score: axis.score,
                          max: axis.max,
                        })
                    : undefined
                }
              />
            ))}
          </View>
        </>
      )}

      {/* ═══ 4. Nutriments ═══ */}
      {nutrientBreakdown.length > 0 && (
        <>
          <HairlineDivider />
          <SectionHeader icon={<BowlFoodIcon size={16} color={isDark ? gold[400] : gold[700]} weight="bold" />} title="Nutriments" annotation="pour 100g" />
          <View style={styles.nutrientGrid}>
            {nutrientBreakdown.map((nb) => (
              <NutrientGridCell
                key={nb.key}
                nutrient={nb}
                onPress={onNutrientPress ? () => onNutrientPress(nb) : undefined}
              />
            ))}
          </View>
        </>
      )}

      {/* ═══ 5. Transformation (NOVA) ═══ */}
      {novaGroup != null && (
        <>
          <HairlineDivider />
          <SectionHeader icon={<CookingPotIcon size={16} color={isDark ? gold[400] : gold[700]} weight="bold" />} title={t.scanResult.axisProcessing} />
          <NovaCard
            group={novaGroup}
            label={novaDescription}
            onPress={onNovaPress}
          />
        </>
      )}

      {/* ═══ 6. Additifs détectés — Health perspective ═══ */}
      {detectedAdditives && detectedAdditives.length > 0 && (
        <>
          <HairlineDivider />
          <SectionHeader icon={<FlaskIcon size={16} color={isDark ? gold[400] : gold[700]} weight="bold" />} title={t.scanResult.accordionAdditives} />
          <HealthAdditivesSection
            additives={detectedAdditives}
            onAdditivePress={onAdditivePress}
          />
        </>
      )}

      {/* ═══ 7. Allergènes ═══ */}
      {allergens.length > 0 && (
        <>
          <HairlineDivider />
          <SectionHeader icon={<WarningCircleIcon size={16} color={isDark ? gold[400] : gold[700]} weight="bold" />} title={t.scanResult.allergenesTitle} />
          <View style={styles.allergenList}>
            {allergens.map((a) => (
              <AllergenTag
                key={a}
                allergen={a}
                onPress={
                  onAllergenPress ? () => onAllergenPress(a) : undefined
                }
              />
            ))}
          </View>
        </>
      )}

      {/* ═══ 7. Labels ═══ */}
      {labels && labels.length > 0 && (
        <>
          <HairlineDivider />
          <SectionHeader icon={<TagIcon size={16} color={isDark ? gold[400] : gold[700]} weight="bold" />} title="Labels" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.labelsRow}
          >
            {labels.map((l) => (
              <LabelPill
                key={l}
                label={l}
                onPress={onLabelPress ? () => onLabelPress(l) : undefined}
              />
            ))}
          </ScrollView>
        </>
      )}

      {/* ═══ 8. Disclaimer ═══ */}
      <HairlineDivider />
      <View style={styles.disclaimer}>
        <InfoIcon
          size={14}
          color={isDark ? "#8b929a" : "#6b7280"}
          style={{ flexShrink: 0 }}
        />
        <Text style={[styles.disclaimerText, { color: isDark ? "#8b929a" : "#6b7280" }]}>
          {t.scanResult.scoreFooterNote}
        </Text>
      </View>
    </Animated.View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  container: {},

  // ── Section headers (mockup: .sh) ──
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    marginTop: 28,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  sectionAnnotation: {
    fontSize: 12,
    fontWeight: "600",
  },

  // ── Hairline divider (mockup: .hl) ──
  hairline: {
    height: StyleSheet.hairlineWidth,
  },

  // ── Health Hero (mockup: .hsh) ──
  healthHero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    paddingVertical: 24,
  },
  ringWrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    flexShrink: 0,
  },
  ringOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  ringGrade: {
    fontSize: 24,
    fontWeight: "900",
  },
  ringScore: {
    fontSize: 10,
    fontWeight: "600",
    opacity: 0.6,
  },
  healthHeroInfo: {
    flex: 1,
  },
  healthHeroLabel: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  healthHeroDesc: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.6,
  },

  // ── Nutri-Score bar (mockup: .nss/.nsb/.nsg) ──
  nutriScoreBarContainer: {
    paddingBottom: 16,
  },
  nutriScoreBar: {
    flexDirection: "row",
    borderRadius: 10,
    overflow: "hidden",
    height: 36,
  },
  nutriScoreSegment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  nutriScoreSegmentActive: {
    transform: [{ scaleY: 1.15 }],
    borderRadius: 6,
    zIndex: 1,
    // Shadow approximation
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  nutriScoreSegmentText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },

  // ── Axes (mockup: .axs/.axi/.axh/.axb/.axf) ──
  axesList: {
    paddingBottom: 20,
  },
  axisRow: {
    marginBottom: 16,
  },
  axisHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  axisName: {
    fontSize: 13,
    fontWeight: "600",
  },
  axisScore: {
    fontSize: 13,
    fontWeight: "700",
  },
  axisBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  axisBarFill: {
    height: "100%",
    borderRadius: 3,
  },

  // ── Nutrient grid (mockup: .ng/.nc) ──
  nutrientGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingBottom: 16,
  },
  nutrientCell: {
    flexBasis: "47%",
    flexGrow: 1,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  nutrientCellLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  nutrientCellValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  nutrientCellValue: {
    fontSize: 20,
    fontWeight: "800",
  },
  nutrientCellUnit: {
    fontSize: 11,
    fontWeight: "500",
    opacity: 0.4,
  },
  nutrientCellBar: {
    height: 3,
    borderRadius: 2,
    marginTop: 8,
    overflow: "hidden",
  },
  nutrientCellBarFill: {
    height: "100%",
    borderRadius: 2,
  },

  // ── NOVA card (mockup: .nos/.noc/.nob/.noi) ──
  novaCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  novaBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  novaBadgeText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#fff",
  },
  novaInfo: {
    flex: 1,
  },
  novaTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  novaDesc: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 2,
  },

  // ── Allergen tags (mockup: .als/.alt2/.atag) ──
  allergenList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingBottom: 16,
  },
  allergenTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: "rgba(249,115,22,0.12)",
  },
  allergenTagText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#f97316",
  },

  // ── Label pills (mockup: .lr/.lp) ──
  labelsRow: {
    gap: 8,
    paddingBottom: 16,
  },
  labelPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  labelPillText: {
    fontSize: 11,
    fontWeight: "600",
  },

  // ── Health Additives Section ──
  healthAdditivesList: {
    gap: 0,
  },
  healthAdditiveRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingVertical: 14,
  },
  healthAdditiveBar: {
    width: 3,
    borderRadius: 1.5,
    alignSelf: "stretch",
  },
  healthAdditiveHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  healthAdditiveCode: {
    fontSize: 11,
    fontWeight: "700",
    marginRight: 6,
  },
  healthAdditiveName: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  healthAdditiveEffect: {
    fontSize: 11,
    marginTop: 3,
    lineHeight: 15,
  },
  healthAdditiveWarnings: {
    flexDirection: "row",
    gap: 6,
    marginTop: 6,
  },
  healthWarningPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  healthWarningText: {
    fontSize: 10,
    fontWeight: "700",
  },
  healthToxBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  healthToxDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  healthToxText: {
    fontSize: 10,
    fontWeight: "700",
  },

  // ── Disclaimer (mockup: .disc) ──
  disclaimer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    paddingVertical: 20,
  },
  disclaimerText: {
    fontSize: 11,
    lineHeight: 16.5,
    flex: 1,
  },
});
