/**
 * NutrientDetailSheet — Bottom sheet with nutrient details.
 *
 * Shows nutrient name, value, daily value percentage, level indicator,
 * and educational explanation. Triggered by tapping a NutrientBar.
 */

import React, { useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Pressable,
  Modal,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { InfoIcon, XIcon } from "phosphor-react-native";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation, useHaptics } from "@/hooks";
import { semantic } from "@/theme/colors";
import { spacing, radius } from "@/theme/spacing";
import { fontSize, fontWeight } from "@/theme/typography";
import type { NutrientLevel } from "@/services/api/types";
import { AppIcon, type IconName } from "@/lib/icons";

const SHEET_RATIO = 0.45;

// ── Level config ─────────────────────────────────────

const LEVEL_CONFIG: Record<NutrientLevel, { color: string; icon: IconName }> = {
  very_low: { color: "#22c55e", icon: "sentiment-very-satisfied" },
  low: { color: "#84cc16", icon: "sentiment-satisfied" },
  moderate: { color: "#f59e0b", icon: "sentiment-neutral" },
  high: { color: "#f97316", icon: "sentiment-dissatisfied" },
  very_high: { color: "#ef4444", icon: "sentiment-very-dissatisfied" },
};

// ── Educational descriptions ─────────────────────────

const NUTRIENT_INFO: Record<string, { fr: string; en: string; ar: string }> = {
  sugars: {
    fr: "Les sucres ajoutés augmentent le risque de caries, obésité et diabète de type 2. L'OMS recommande de ne pas dépasser 25g par jour.",
    en: "Added sugars increase the risk of cavities, obesity and type 2 diabetes. WHO recommends no more than 25g per day.",
    ar: "السكريات المضافة تزيد من خطر التسوس والسمنة والسكري من النوع 2. توصي منظمة الصحة العالمية بعدم تجاوز 25 غ يومياً.",
  },
  salt: {
    fr: "Un excès de sel favorise l'hypertension artérielle et les maladies cardiovasculaires. Ne pas dépasser 5g par jour (OMS).",
    en: "Excess salt promotes high blood pressure and cardiovascular disease. Do not exceed 5g per day (WHO).",
    ar: "الإفراط في الملح يعزز ارتفاع ضغط الدم وأمراض القلب والأوعية الدموية. لا تتجاوز 5 غ يومياً (منظمة الصحة العالمية).",
  },
  fat: {
    fr: "Les matières grasses sont essentielles mais en excès, elles contribuent à la prise de poids. Privilégiez les graisses insaturées.",
    en: "Fats are essential but in excess, they contribute to weight gain. Prefer unsaturated fats.",
    ar: "الدهون ضرورية لكن بالإفراط تساهم في زيادة الوزن. فضّل الدهون غير المشبعة.",
  },
  saturated_fat: {
    fr: "Les graisses saturées augmentent le cholestérol LDL. Limiter à moins de 11g par jour (ANSES).",
    en: "Saturated fats increase LDL cholesterol. Limit to less than 11g per day.",
    ar: "الدهون المشبعة تزيد الكولسترول الضار. حدها بأقل من 11 غ يومياً.",
  },
  proteins: {
    fr: "Les protéines sont indispensables à la construction et au maintien des muscles. Apport recommandé : 0.83g/kg de poids corporel.",
    en: "Proteins are essential for building and maintaining muscle. Recommended intake: 0.83g/kg body weight.",
    ar: "البروتينات ضرورية لبناء وصيانة العضلات. الكمية الموصى بها: 0.83 غ/كغ من وزن الجسم.",
  },
  fiber: {
    fr: "Les fibres favorisent la digestion et la satiété. Objectif : au moins 25g par jour (ANSES).",
    en: "Fiber promotes digestion and satiety. Target: at least 25g per day.",
    ar: "الألياف تعزز الهضم والشبع. الهدف: 25 غ على الأقل يومياً.",
  },
  carbohydrates: {
    fr: "Les glucides sont la principale source d'énergie. Privilégiez les glucides complexes (céréales complètes, légumineuses).",
    en: "Carbohydrates are the main energy source. Prefer complex carbs (whole grains, legumes).",
    ar: "الكربوهيدرات هي المصدر الرئيسي للطاقة. فضّل الكربوهيدرات المعقدة (الحبوب الكاملة، البقوليات).",
  },
  energy: {
    fr: "L'apport calorique moyen recommandé est de 2000 kcal/jour pour un adulte. Adaptez selon votre activité physique.",
    en: "Average recommended caloric intake is 2000 kcal/day for adults. Adjust based on your activity level.",
    ar: "متوسط السعرات الحرارية الموصى به هو 2000 سعرة/يوم للبالغين. عدّل حسب مستوى نشاطك.",
  },
};

// ── Component ────────────────────────────────────────

interface NutrientDetailSheetProps {
  visible: boolean;
  nutrient: string | null;
  value: number | null;
  unit?: string;
  level: NutrientLevel | null;
  dailyValuePercent: number | null;
  isNegative?: boolean;
  onClose: () => void;
}

export const NutrientDetailSheet = React.memo(function NutrientDetailSheet({
  visible,
  nutrient,
  value,
  unit = "g",
  level,
  dailyValuePercent,
  isNegative = true,
  onClose,
}: NutrientDetailSheetProps) {
  const { isDark, colors } = useTheme();
  const { t, language } = useTranslation();
  const insets = useSafeAreaInsets();
  const { impact } = useHaptics();
  const { height: screenHeight } = useWindowDimensions();
  const sheetHeight = screenHeight * SHEET_RATIO;
  const translateY = useSharedValue(sheetHeight);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      impact();
      backdropOpacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSpring(0, { damping: 18, stiffness: 160 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 150 });
      translateY.value = withSpring(sheetHeight, { damping: 20, stiffness: 200 });
    }
  }, [visible, sheetHeight, backdropOpacity, translateY]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleClose = useCallback(() => {
    backdropOpacity.value = withTiming(0, { duration: 150 });
    translateY.value = withSpring(sheetHeight, { damping: 20, stiffness: 200 });
    setTimeout(onClose, 200);
  }, [onClose, backdropOpacity, translateY, sheetHeight]);

  if (!nutrient || !level) return null;

  const config = LEVEL_CONFIG[level];
  const lang = (language ?? "fr") as "fr" | "en" | "ar";
  const info = NUTRIENT_INFO[nutrient];
  const description = info?.[lang] ?? info?.fr ?? "";

  // Nutrient label from translations
  const nutrientLabelKey = `nutrient${nutrient.charAt(0).toUpperCase()}${nutrient.slice(1).replace(/_([a-z])/g, (_, c) => c.toUpperCase())}` as keyof typeof t.scanResult;
  const nutrientLabel = (t.scanResult[nutrientLabelKey] as string) ?? nutrient.replace(/_/g, " ");

  // Level label from translations
  const levelLabelKey = `nutrientLevel${level.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("")}` as keyof typeof t.scanResult;
  const levelLabel = (t.scanResult[levelLabelKey] as string) ?? level.replace(/_/g, " ");

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            sheetStyle,
            {
              backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
              paddingBottom: insets.bottom + 90,
            },
          ]}
        >
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)" }]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: `${config.color}20` }]}>
              <AppIcon name={config.icon} size={24} color={config.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                {nutrientLabel}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {t.scanResult.nutrientPerServing}
              </Text>
            </View>
            <Pressable onPress={handleClose} hitSlop={12}>
              <XIcon size={22} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Value + Level */}
          <View style={styles.valueRow}>
            <Text style={[styles.valueText, { color: colors.textPrimary }]}>
              {value != null ? `${value}${unit}` : "—"}
            </Text>
            <View style={[styles.levelBadge, { backgroundColor: `${config.color}18` }]}>
              <View style={[styles.levelDot, { backgroundColor: config.color }]} />
              <Text style={[styles.levelText, { color: config.color }]}>
                {levelLabel}
              </Text>
            </View>
          </View>

          {/* Daily value bar */}
          {dailyValuePercent != null && (
            <View style={styles.dailyValueSection}>
              <View style={styles.dailyValueHeader}>
                <Text style={[styles.dailyValueLabel, { color: colors.textSecondary }]}>
                  {t.scanResult.nutrientDailyValue.replace("{{percent}}", String(Math.round(dailyValuePercent)))}
                </Text>
              </View>
              <View style={[styles.dailyValueTrack, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }]}>
                <View
                  style={[
                    styles.dailyValueFill,
                    {
                      backgroundColor: config.color,
                      width: `${Math.min(dailyValuePercent, 100)}%`,
                    },
                  ]}
                />
              </View>
            </View>
          )}

          {/* Educational description */}
          {description ? (
            <View style={[styles.infoBox, {
              backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
              borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
            }]}>
              <InfoIcon size={16} color={colors.textMuted} style={{ marginTop: 2 }} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                {description}
              </Text>
            </View>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
  },
  handleContainer: {
    alignItems: "center",
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: fontSize.h3,
    fontWeight: fontWeight.bold,
  },
  subtitle: {
    fontSize: fontSize.caption,
    marginTop: 2,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  valueText: {
    fontSize: 32,
    fontWeight: "700",
  },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  levelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  levelText: {
    fontSize: fontSize.caption,
    fontWeight: "600",
  },
  dailyValueSection: {
    marginBottom: spacing.xl,
  },
  dailyValueHeader: {
    marginBottom: spacing.sm,
  },
  dailyValueLabel: {
    fontSize: fontSize.caption,
  },
  dailyValueTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  dailyValueFill: {
    height: 8,
    borderRadius: 4,
  },
  infoBox: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    fontSize: fontSize.caption,
    lineHeight: 20,
  },
});

export default NutrientDetailSheet;
