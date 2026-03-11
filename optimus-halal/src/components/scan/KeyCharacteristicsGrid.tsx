/**
 * KeyCharacteristicsGrid — Unified 2-column grid of product characteristics.
 *
 * Inspired by Stitch design: merges dietary analysis, labels, origins,
 * NutriScore grade, and ingredient analysis tags into a single visual block.
 *
 * Layout:
 *   - Section title "Caractéristiques Clés" (uppercase, muted)
 *   - 2-column grid of icon+label cards (white/glass, border, rounded-xl)
 *   - Row of small green analysis tags below (PALM OIL FREE, VEGAN, etc.)
 */

import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { glass, semantic, halalStatus as halalStatusTokens } from "@/theme/colors";
import { spacing, radius } from "@/theme/spacing";
import { fontSize, fontWeight } from "@/theme/typography";
import type { DietaryAnalysis } from "@/services/api/types";
import { AppIcon, type IconName } from "@/lib/icons";

// ── Icon mapping for characteristic types ──

const CHARACTERISTIC_ICONS: Record<string, {
  icon: IconName;
  color: string;
}> = {
  vegetarian:       { icon: "eco",            color: "#22c55e" },
  vegan:            { icon: "spa",            color: "#16a34a" },
  "gluten-free":    { icon: "grain",          color: "#3b82f6" },
  "lactose-free":   { icon: "water-drop",     color: "#06b6d4" },
  "palm-oil-free":  { icon: "park",           color: "#10b981" },
  organic:          { icon: "eco",            color: "#059669" },
  "no-preservatives": { icon: "shield",       color: "#f97316" },
  "no-sweeteners":  { icon: "science",        color: "#8b5cf6" },
  "no-additives":   { icon: "check-circle",   color: "#22c55e" },
  "no-artificial-flavors": { icon: "science",  color: "#3b82f6" },
  "green-dot":      { icon: "recycling",      color: "#22c55e" },
  "made-in":        { icon: "flag",           color: "#3b82f6" },
  origins:          { icon: "public",         color: "#60a5fa" },
  nutriscore:       { icon: "restaurant",     color: "#eab308" },
  "fair-trade":     { icon: "handshake",      color: "#8b5cf6" },
  default:          { icon: "info",           color: "#6b7280" },
};

interface Characteristic {
  key: string;
  label: string;
  iconType: string;
  /** Which tab this item belongs to: "halal" (Tab 0) or "nutrition" (Tab 1) */
  domain: "halal" | "nutrition";
}

/**
 * mode — Filter which items to show:
 *   "all"       → show everything (legacy behavior)
 *   "halal"     → origins, manufacturing, labels (organic, fair-trade, green-dot)
 *   "nutrition" → dietary analysis, additives indicators (no NutriScore — it's in dashboard)
 */
type GridMode = "all" | "halal" | "nutrition";

interface KeyCharacteristicsGridProps {
  dietaryAnalysis: DietaryAnalysis | null;
  labelsTags: string[] | null;
  ingredientsAnalysisTags: string[] | null;
  nutriscoreGrade: string | null;
  origins: string | null;
  manufacturingPlaces: string | null;
  additivesTags: string[] | null;
  /** Filter items by domain. Defaults to "all". */
  mode?: GridMode;
}

export const KeyCharacteristicsGrid = React.memo(function KeyCharacteristicsGrid({
  dietaryAnalysis,
  labelsTags,
  ingredientsAnalysisTags,
  nutriscoreGrade,
  origins,
  manufacturingPlaces,
  additivesTags,
  mode = "all",
}: KeyCharacteristicsGridProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();

  // ── Build characteristics list from available data ──
  const characteristics = useMemo(() => {
    const items: Characteristic[] = [];

    // Dietary analysis items → nutrition domain
    if (dietaryAnalysis?.isVegetarian === true) {
      items.push({ key: "vegetarian", label: t.scanResult.vegetarian ?? "Vegetarian", iconType: "vegetarian", domain: "nutrition" });
    }
    if (dietaryAnalysis?.isVegan === true) {
      items.push({ key: "vegan", label: t.scanResult.vegan ?? "Vegan", iconType: "vegan", domain: "nutrition" });
    }
    if (dietaryAnalysis?.containsGluten === false) {
      items.push({ key: "gluten-free", label: t.scanResult.glutenFree ?? "Sans gluten", iconType: "gluten-free", domain: "nutrition" });
    }
    if (dietaryAnalysis?.containsLactose === false) {
      items.push({ key: "lactose-free", label: t.scanResult.lactoseFree ?? "Sans lactose", iconType: "lactose-free", domain: "nutrition" });
    }
    if (dietaryAnalysis?.containsPalmOil === false) {
      items.push({ key: "palm-oil-free", label: t.scanResult.palmOilFree ?? "Sans huile de palme", iconType: "palm-oil-free", domain: "nutrition" });
    }

    // Labels-based items → halal domain (product identity)
    if (labelsTags) {
      const lowerTags = labelsTags.map((l) => l.toLowerCase());
      if (lowerTags.some((l) => ["en:organic", "fr:bio", "fr:agriculture-biologique", "en:eu-organic"].includes(l))) {
        items.push({ key: "organic", label: "Bio", iconType: "organic", domain: "halal" });
      }
      if (lowerTags.some((l) => l.includes("fair-trade") || l.includes("commerce-equitable"))) {
        items.push({ key: "fair-trade", label: "Commerce équitable", iconType: "fair-trade", domain: "halal" });
      }
      if (lowerTags.some((l) => l.includes("green-dot") || l.includes("point-vert"))) {
        items.push({ key: "green-dot", label: "Green Dot", iconType: "green-dot", domain: "halal" });
      }
    }

    // Additives-based qualitative indicators → nutrition domain
    if (additivesTags) {
      if (additivesTags.length === 0) {
        items.push({ key: "no-additives", label: t.scanResult.noAdditivesShort ?? "Sans additifs", iconType: "no-additives", domain: "nutrition" });
      }
      const hasSweeteners = additivesTags.some((a) =>
        /e950|e951|e952|e954|e955|e960|e961|e962|e967|e968|aspartame|sucralose|stevia/i.test(a)
      );
      if (!hasSweeteners) {
        items.push({ key: "no-sweeteners", label: t.scanResult.noSweetenersShort ?? "Sans édulcorants", iconType: "no-sweeteners", domain: "nutrition" });
      }
    }

    // NutriScore grade → skipped (now in ScoreDashboardCard)

    // Origins / Manufacturing → halal domain
    if (manufacturingPlaces) {
      items.push({
        key: "made-in",
        label: `${t.scanResult.madeIn ?? "Fabriqué en"} ${manufacturingPlaces}`.trim(),
        iconType: "made-in",
        domain: "halal",
      });
    }
    if (origins) {
      items.push({
        key: "origins",
        label: `${t.scanResult.originsLabel ?? "Origines"}: ${origins}`,
        iconType: "origins",
        domain: "halal",
      });
    }

    // Filter by mode
    if (mode === "all") return items;
    return items.filter((item) => item.domain === mode);
  }, [dietaryAnalysis, labelsTags, additivesTags, nutriscoreGrade, origins, manufacturingPlaces, mode, t]);

  // ── Build analysis tags (small green pills) ──
  const analysisTags = useMemo(() => {
    if (!ingredientsAnalysisTags) return [];
    return ingredientsAnalysisTags
      .map((tag) => tag.replace(/^en:/, "").replace(/-/g, " "))
      .filter((l) => l.length > 1);
  }, [ingredientsAnalysisTags]);

  // Don't render if nothing to show
  if (characteristics.length === 0 && analysisTags.length === 0) return null;

  const cardBg = isDark ? glass.dark.bg : "#ffffff";
  const cardBorder = isDark ? glass.dark.border : "rgba(0,0,0,0.06)";

  return (
    <Animated.View entering={FadeInDown.delay(100).duration(350)} style={gridStyles.container}>
      {/* Section title */}
      <Text style={[gridStyles.title, { color: colors.textMuted }]}>
        {t.scanResult.keyCharacteristics ?? "CARACTÉRISTIQUES CLÉS"}
      </Text>

      {/* 2-column grid */}
      {characteristics.length > 0 && (
        <View style={gridStyles.grid}>
          {characteristics.map((item, idx) => {
            const config = CHARACTERISTIC_ICONS[item.iconType] ?? CHARACTERISTIC_ICONS.default;
            return (
              <Animated.View
                key={item.key}
                entering={FadeInDown.delay(60 + idx * 40).duration(300)}
                style={[
                  gridStyles.card,
                  {
                    backgroundColor: cardBg,
                    borderColor: cardBorder,
                  },
                ]}
              >
                <AppIcon name={config.icon} size={18} color={config.color} />
                <Text
                  style={[gridStyles.cardLabel, { color: colors.textPrimary }]}
                  numberOfLines={2}
                >
                  {item.label}
                </Text>
              </Animated.View>
            );
          })}
        </View>
      )}

      {/* Analysis tags — small green pills */}
      {analysisTags.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={gridStyles.tagsRow}
        >
          {analysisTags.map((tag, idx) => (
            <Animated.View
              key={tag}
              entering={FadeInRight.delay(idx * 50).duration(250)}
              style={[
                gridStyles.tag,
                {
                  backgroundColor: isDark
                    ? `${semantic.success.base}18`
                    : `${semantic.success.base}12`,
                  borderColor: isDark
                    ? `${semantic.success.base}35`
                    : `${semantic.success.base}25`,
                },
              ]}
            >
              <Text
                style={[
                  gridStyles.tagText,
                  { color: isDark ? semantic.success.base : "#166534" },
                ]}
              >
                {tag.toUpperCase()}
              </Text>
            </Animated.View>
          ))}
        </ScrollView>
      )}
    </Animated.View>
  );
});

const gridStyles = StyleSheet.create({
  container: {
    marginBottom: spacing["2xl"],
  },
  title: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.bold,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: spacing.lg,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  card: {
    width: "48.5%",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    // Subtle shadow for light mode
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardLabel: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    flex: 1,
    lineHeight: 16,
  },
  tagsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingRight: spacing.xl,
  },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 9,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.8,
  },
});

export default KeyCharacteristicsGrid;
