/**
 * TrustScoreBottomSheet — "Pourquoi ce score ?" generic educational sheet.
 *
 * Explains the Naqiy Trust Grade system (N١→N٥) with:
 *   - NaqiyGradeBadge strip showing all 5 grades with active highlighted
 *   - Current certifier score + grade badge
 *   - 4 themed evaluation blocks (ritual, ops, tayyib, transparency)
 *   - Madhab-specific note when applicable
 *
 * Design: Al-Ilm (transparence épistemique) + Al-Ihsan (springNaqiy)
 *
 * @module components/scan/TrustScoreBottomSheet
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  ScrollView,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
  useReducedMotion,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  InfoIcon,
  ShieldCheckIcon,
  GearSixIcon,
  LeafIcon,
  EyeIcon,
} from "phosphor-react-native";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation, useHaptics } from "@/hooks";
import { darkTheme, lightTheme, gold } from "@/theme/colors";
import { spacing, radius } from "@/theme/spacing";
import { fontSize, fontWeight } from "@/theme/typography";
import {
  NaqiyGradeBadge,
  TRUST_GRADES,
  getTrustGradeFromScore,
  type TrustGrade,
} from "./NaqiyGradeBadge";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface TrustScoreBottomSheetProps {
  visible: boolean;
  certifierName: string | null;
  trustScore: number | null;
  /** If set, indicates the score uses madhab-specific weights */
  madhab?: "hanafi" | "shafii" | "maliki" | "hanbali" | null;
  onClose: () => void;
}

const MADHAB_DISPLAY: Record<string, string> = {
  hanafi: "Hanafi",
  shafii: "Shafi'i",
  maliki: "Maliki",
  hanbali: "Hanbali",
};

// ── Theme block config ────────────────────────────────────

interface ThemeBlock {
  icon: typeof ShieldCheckIcon;
  color: string;
  titleKey: string;
  description: string;
}

const THEME_BLOCKS: ThemeBlock[] = [
  {
    icon: ShieldCheckIcon,
    color: "#ef4444",
    titleKey: "Validité Rituelle",
    description: "Abattage rituel, absence d'étourdissement, électronarcose et électrocution post-mortem.",
  },
  {
    icon: GearSixIcon,
    color: "#22c55e",
    titleKey: "Assurance Opérationnelle",
    description: "Contrôleurs salariés, présents à chaque production, sacrificateurs employés.",
  },
  {
    icon: LeafIcon,
    color: "#8b5cf6",
    titleKey: "Qualité Produit — Tayyib",
    description: "Absence de VSM (viande séparée mécaniquement).",
  },
  {
    icon: EyeIcon,
    color: "#3b82f6",
    titleKey: "Transparence",
    description: "Charte publique, rapports d'audit accessibles, liste des entreprises certifiées.",
  },
];

// ── Component ────────────────────────────────────────────

export const TrustScoreBottomSheet = React.memo(function TrustScoreBottomSheet({
  visible,
  certifierName,
  trustScore,
  madhab,
  onClose,
}: TrustScoreBottomSheetProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const { impact } = useHaptics();

  const [isMounted, setIsMounted] = useState(false);
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      impact();
      backdropOpacity.value = withTiming(1, { duration: 200 });
      translateY.value = reducedMotion
        ? 0
        : withSpring(0, { damping: 28, stiffness: 120 });
    } else if (isMounted) {
      backdropOpacity.value = withTiming(0, { duration: 150 });
      translateY.value = withTiming(
        SCREEN_HEIGHT,
        { duration: 250, easing: Easing.in(Easing.cubic) },
        (finished) => {
          if (finished) runOnJS(setIsMounted)(false);
        },
      );
    }
  }, [visible, reducedMotion, translateY, backdropOpacity, isMounted]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!isMounted) return null;

  const currentGrade: TrustGrade | null =
    trustScore != null ? getTrustGradeFromScore(trustScore) : null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        accessibilityViewIsModal
        style={[
          styles.sheet,
          {
            backgroundColor: isDark ? darkTheme.background : lightTheme.backgroundSecondary,
            paddingBottom: insets.bottom + 90,
            maxHeight: SCREEN_HEIGHT * 0.88,
          },
          sheetStyle,
        ]}
      >
        {/* Drag handle */}
        <View style={styles.handleContainer}>
          <View
            style={[
              styles.handle,
              { backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)" },
            ]}
          />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <InfoIcon size={22} color={isDark ? gold[400] : gold[600]} />
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {t.scanResult.trustScoreExplainTitle}
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Intro */}
          <Text style={[styles.intro, { color: colors.textSecondary }]}>
            {t.scanResult.trustScoreExplainIntro}
          </Text>

          {/* ── Naqiy Trust Grade Scale ── */}
          <View
            style={[
              styles.gradeScaleCard,
              {
                backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
              },
            ]}
          >
            <Text style={[styles.gradeScaleTitle, { color: isDark ? gold[400] : gold[600] }]}>
              Échelle Naqiy Trust Grade
            </Text>

            {/* Grade strip — shows current certifier grade */}
            {currentGrade && (
              <View style={styles.gradeStripCenter}>
                <NaqiyGradeBadge variant="strip" grade={currentGrade} showLabel />
              </View>
            )}

            {/* Grade legend */}
            <View style={styles.gradeLegend}>
              {TRUST_GRADES.map((g) => {
                const isActive = currentGrade?.grade === g.grade;
                return (
                  <View
                    key={g.grade}
                    style={[
                      styles.gradeLegendRow,
                      isActive && {
                        backgroundColor: `${g.color}${isDark ? "18" : "10"}`,
                        borderRadius: 8,
                      },
                    ]}
                  >
                    <View style={[styles.gradeLegendDot, { backgroundColor: g.color }]} />
                    <Text style={[styles.gradeLegendGrade, { color: g.color }]}>
                      N{g.arabic}
                    </Text>
                    <Text
                      style={[
                        styles.gradeLegendLabel,
                        { color: isActive ? colors.textPrimary : colors.textSecondary },
                        isActive && { fontWeight: fontWeight.bold },
                      ]}
                    >
                      {g.label}
                    </Text>
                    <Text style={[styles.gradeLegendRange, { color: colors.textMuted }]}>
                      {g.grade === 1 ? "90-100"
                        : g.grade === 2 ? "70-89"
                        : g.grade === 3 ? "51-69"
                        : g.grade === 4 ? "35-50"
                        : "0-34"}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Current certifier score */}
          {certifierName && trustScore != null && currentGrade && (
            <View
              style={[
                styles.currentScore,
                {
                  backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                  borderColor: `${currentGrade.color}30`,
                  borderLeftColor: currentGrade.color,
                  borderLeftWidth: 3,
                },
              ]}
            >
              <View style={styles.currentScoreInfo}>
                <Text style={[styles.currentScoreName, { color: colors.textPrimary }]}>
                  {certifierName}
                </Text>
                <Text style={[styles.currentScoreLabel, { color: colors.textMuted }]}>
                  {trustScore}/100
                </Text>
              </View>
              <NaqiyGradeBadge variant="compact" grade={currentGrade} showLabel />
            </View>
          )}

          {/* Madhab-specific note */}
          {madhab && (
            <Text style={[styles.madhabNote, { color: colors.textMuted }]}>
              {t.scanResult.trustScoreMadhabNote.replace("{{madhab}}", MADHAB_DISPLAY[madhab])}
            </Text>
          )}

          {/* ── 4 Evaluation Themes ── */}
          <Text style={[styles.themesTitle, { color: isDark ? gold[400] : gold[600] }]}>
            Critères d'évaluation
          </Text>

          {THEME_BLOCKS.map((block, i) => {
            const Icon = block.icon;
            return (
              <View
                key={i}
                style={[
                  styles.themeCard,
                  {
                    backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)",
                    borderColor: `${block.color}${isDark ? "25" : "18"}`,
                  },
                ]}
              >
                <View style={styles.themeCardHeader}>
                  <View style={[styles.themeIconCircle, { backgroundColor: `${block.color}15` }]}>
                    <Icon size={16} color={block.color} weight="fill" />
                  </View>
                  <Text style={[styles.themeCardTitle, { color: block.color }]}>
                    {block.titleKey}
                  </Text>
                </View>
                <Text style={[styles.themeCardDesc, { color: colors.textSecondary }]}>
                  {block.description}
                </Text>
              </View>
            );
          })}

          {/* Footer note */}
          <Text style={[styles.footerNote, { color: colors.textMuted }]}>
            {t.scanResult.trustScoreNote}
          </Text>
        </ScrollView>
      </Animated.View>
    </View>
  );
});

// ── Styles ───────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: radius["2xl"],
    borderTopRightRadius: radius["2xl"],
    paddingHorizontal: spacing["3xl"],
  },
  handleContainer: {
    alignItems: "center",
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: spacing.lg,
    paddingTop: spacing.md,
  },
  headerTitle: {
    fontSize: fontSize.h4,
    fontWeight: fontWeight.bold,
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.md,
  },
  intro: {
    fontSize: fontSize.bodySmall,
    lineHeight: 20,
    marginBottom: spacing.xl,
  },

  // Grade scale card
  gradeScaleCard: {
    padding: spacing.xl,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.xl,
  },
  gradeScaleTitle: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: spacing.lg,
  },
  gradeStripCenter: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  gradeLegend: {
    gap: 4,
  },
  gradeLegendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  gradeLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  gradeLegendGrade: {
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.black,
    width: 28,
  },
  gradeLegendLabel: {
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  gradeLegendRange: {
    fontSize: fontSize.micro,
    fontWeight: fontWeight.medium,
    fontVariant: ["tabular-nums"],
  },

  // Current score
  currentScore: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.xl,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  currentScoreInfo: {
    flex: 1,
    gap: 2,
  },
  currentScoreName: {
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.semiBold,
  },
  currentScoreLabel: {
    fontSize: fontSize.micro,
    fontWeight: fontWeight.medium,
  },

  // Madhab note
  madhabNote: {
    fontSize: fontSize.caption,
    lineHeight: 17,
    fontStyle: "italic",
    marginBottom: spacing.xl,
    paddingLeft: 4,
  },

  // Themes
  themesTitle: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: spacing.lg,
  },
  themeCard: {
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  themeCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  themeIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  themeCardTitle: {
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.bold,
    flex: 1,
  },
  themeCardDesc: {
    fontSize: fontSize.caption,
    lineHeight: 18,
    paddingLeft: 36,
  },

  // Footer
  footerNote: {
    fontSize: fontSize.caption,
    lineHeight: 17,
    marginTop: spacing["2xl"],
    fontStyle: "italic",
  },
});
