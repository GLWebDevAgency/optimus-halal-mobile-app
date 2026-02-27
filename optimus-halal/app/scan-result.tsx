/**
 * Scan Result Screen — "Verdict First" Redesign
 *
 * The crown jewel of Optimus Halal. Every design decision serves one goal:
 * the user sees the halal verdict within 0.5 seconds, above the fold,
 * with zero scrolling required.
 *
 * Layout:
 *   HERO (50% viewport) — status icon, verdict text, trust ring, product info
 *   Certifier card — glass-morphism with verified badge
 *   Ingredients — collapsible, highlighting problematic items
 *   Nutrition — horizontal Nutri-Score / NOVA / Eco-Score cards
 *   Boycott & Personal Alerts — conditional alert cards
 *   Fixed bottom action bar — favorite, share, report, "Ou acheter?"
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  StyleSheet,
  Platform,
  Alert,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { ImpactFeedbackStyle, NotificationFeedbackType } from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  SlideInUp,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  useDerivedValue,
  runOnJS,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
  useReducedMotion,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { IconButton, StatusPill, LevelUpCelebration, PremiumBackground } from "@/components/ui";
import { PressableScale } from "@/components/ui/PressableScale";
import { PersonalAlerts, type PersonalAlert } from "@/components/scan/PersonalAlerts";
import { MadhabBottomSheet } from "@/components/scan/MadhabBottomSheet";
import { MadhabScoreRing } from "@/components/scan/MadhabScoreRing";
import { TrustScoreBottomSheet } from "@/components/scan/TrustScoreBottomSheet";
import { ScoreDetailBottomSheet } from "@/components/scan/ScoreDetailBottomSheet";
import { ShareCardView, captureAndShareCard } from "@/components/scan/ShareCard";
import { trpc } from "@/lib/trpc";
import { useScanBarcode } from "@/hooks/useScan";
import { useTranslation, useHaptics, useAddFavorite, useRemoveFavorite, useCreateReview } from "@/hooks";
import { useTheme } from "@/hooks/useTheme";
import { halalStatus as halalStatusTokens, brand as brandTokens, glass, lightTheme, semantic, gold } from "@/theme/colors";
import { textStyles, fontSize as fontSizeTokens, fontWeight as fontWeightTokens } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import { getShadows } from "@/theme/shadows";
import { durations, easings, entryAnimations } from "@/theme/animations";
import { GlowCard } from "@/components/ui/GlowCard";

import { CertifierLogo } from "@/components/scan/CertifierLogo";


import { useFeatureFlagsStore } from "@/store";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const HERO_HEIGHT = SCREEN_HEIGHT * 0.5;

// ── Status Visual Config ────────────────────────────────────

interface StatusVisualConfig {
  labelKey: "certifiedHalal" | "haramDetected" | "doubtfulStatus" | "unverified";
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  glowColor: string;
  gradientDark: [string, string, string];
  gradientLight: [string, string, string];
}

const STATUS_CONFIG: Record<string, StatusVisualConfig> = {
  halal: {
    labelKey: "certifiedHalal",
    icon: "verified",
    color: halalStatusTokens.halal.base,
    glowColor: brandTokens.primary,
    gradientDark: ["#0a1a10", "#0f2418", "#132a1a"],
    gradientLight: ["#ecfdf5", "#d1fae5", "#a7f3d0"],
  },
  haram: {
    labelKey: "haramDetected",
    icon: "dangerous",
    color: halalStatusTokens.haram.base,
    glowColor: "#dc2626",
    gradientDark: ["#1a0a0a", "#221111", "#2a1313"],
    gradientLight: ["#fef2f2", "#fecaca", "#fca5a5"],
  },
  doubtful: {
    labelKey: "doubtfulStatus",
    icon: "help",
    color: halalStatusTokens.doubtful.base,
    glowColor: "#ea580c",
    gradientDark: ["#1a140a", "#221b11", "#2a1f13"],
    gradientLight: ["#fff7ed", "#fed7aa", "#fdba74"],
  },
  unknown: {
    labelKey: "unverified",
    icon: "help-outline",
    color: halalStatusTokens.unknown.base,
    glowColor: "#64748b",
    gradientDark: ["#0f0f0f", "#151515", "#1a1a1a"],
    gradientLight: ["#f8fafc", "#e2e8f0", "#cbd5e1"],
  },
};

type HalalStatusKey = keyof typeof STATUS_CONFIG;

// Madhab label lookup (type-safe, avoids runtime string interpolation)
const MADHAB_LABEL_KEY = {
  hanafi: "madhabHanafi",
  shafii: "madhabShafii",
  maliki: "madhabMaliki",
  hanbali: "madhabHanbali",
} as const;

const MADHAB_TRUST_KEY = {
  hanafi: "trustScoreHanafi",
  shafii: "trustScoreShafii",
  maliki: "trustScoreMaliki",
  hanbali: "trustScoreHanbali",
} as const;

// Nutri-Score color map (follows international nutrition labelling standard)
const NUTRISCORE_COLORS: Record<string, string> = {
  a: halalStatusTokens.halal.base,
  b: "#84cc16",
  c: "#eab308",
  d: halalStatusTokens.doubtful.base,
  e: halalStatusTokens.haram.base,
};

// NOVA group color map (1=unprocessed → 4=ultra-processed)
const NOVA_COLORS: Record<number, string> = {
  1: halalStatusTokens.halal.base,
  2: "#eab308",
  3: halalStatusTokens.doubtful.base,
  4: halalStatusTokens.haram.base,
};

const SUSPENSE_DURATION = 350;

// ── Nutrition Card ───────────────────────────────────────────

const NutritionCard = React.memo(function NutritionCard({
  label,
  value,
  color,
  description,
}: {
  label: string;
  value: string | number;
  color: string;
  description: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={nutritionStyles.row}>
      <View
        style={[nutritionStyles.badge, { backgroundColor: `${color}15`, borderColor: color }]}
      >
        <Text style={[nutritionStyles.badgeText, { color }]}>{String(value).toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[nutritionStyles.label, { color: colors.textPrimary }]}>{label}</Text>
        <Text style={[nutritionStyles.desc, { color: colors.textSecondary }]}>{description}</Text>
      </View>
    </View>
  );
});

const nutritionStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.lg, paddingVertical: spacing.lg, paddingHorizontal: spacing.xs },
  badge: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  badgeText: { fontSize: fontSizeTokens.h4, fontWeight: fontWeightTokens.black },
  label: { fontSize: fontSizeTokens.bodySmall, fontWeight: fontWeightTokens.bold },
  desc: { fontSize: fontSizeTokens.caption, marginTop: spacing["2xs"] },
});

// ── Collapsible Section ─────────────────────────────────────

const CollapsibleSection = React.memo(function CollapsibleSection({
  title,
  badge,
  children,
  defaultOpen = false,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { isDark, colors } = useTheme();
  const { impact } = useHaptics();
  const reducedMotion = useReducedMotion();
  const [contentHeight, setContentHeight] = useState(0);
  const animProgress = useSharedValue(defaultOpen ? 1 : 0);

  const toggle = useCallback(() => {
    impact();
    setIsOpen((prev) => {
      const next = !prev;
      animProgress.value = reducedMotion
        ? next ? 1 : 0
        : withTiming(next ? 1 : 0, { duration: durations.normal, easing: easings.easeOut });
      return next;
    });
  }, [impact, animProgress, reducedMotion]);

  const contentStyle = useAnimatedStyle(() => ({
    height: contentHeight > 0 ? animProgress.value * contentHeight : undefined,
    opacity: animProgress.value,
    overflow: "hidden" as const,
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${animProgress.value * 180}deg` }],
  }));

  return (
    <View
      style={[
        styles.collapsibleContainer,
        {
          backgroundColor: isDark
            ? glass.dark.bg
            : colors.card,
          borderColor: isDark
            ? glass.dark.border
            : glass.light.border,
        },
      ]}
    >
      <PressableScale
        onPress={toggle}
        style={styles.collapsibleHeader}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded: isOpen }}
      >
        <View style={styles.collapsibleHeaderLeft}>
          <Text
            style={[styles.collapsibleTitle, { color: colors.textPrimary }]}
          >
            {title}
          </Text>
          {badge && (
            <View
              style={[
                styles.collapsibleBadge,
                {
                  backgroundColor: isDark
                    ? glass.dark.highlight
                    : glass.light.bgSubtle,
                },
              ]}
            >
              <Text
                style={[
                  styles.collapsibleBadgeText,
                  { color: colors.textSecondary },
                ]}
              >
                {badge}
              </Text>
            </View>
          )}
        </View>
        <Animated.View style={chevronStyle}>
          <MaterialIcons
            name="expand-more"
            size={24}
            color={colors.textSecondary}
          />
        </Animated.View>
      </PressableScale>
      <Animated.View style={contentStyle}>
        <View
          style={styles.collapsibleContent}
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0 && h !== contentHeight) setContentHeight(h);
          }}
        >
          {children}
        </View>
      </Animated.View>
    </View>
  );
});

// ── Ingredient Row (expandable for problematic items) ──────────

const IngredientRow = React.memo(function IngredientRow({
  name,
  isLast,
  isProblematic,
  problemColor,
  explanation,
  problemStatus,
  scholarlyReference,
  fatwaSourceName,
  fatwaSourceUrl,
}: {
  name: string;
  isLast: boolean;
  isProblematic?: boolean;
  problemColor?: string;
  explanation?: string;
  problemStatus?: string;
  scholarlyReference?: string | null;
  fatwaSourceName?: string | null;
  fatwaSourceUrl?: string | null;
}) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const expandHeight = useSharedValue(0);

  const toggleExpand = useCallback(() => {
    if (!isProblematic || !explanation) return;
    const next = !expanded;
    setExpanded(next);
    expandHeight.value = withTiming(next ? 1 : 0, {
      duration: durations.normal,
      easing: easings.easeOut,
    });
  }, [expanded, isProblematic, explanation, expandHeight]);

  const hasFatwa = !!(fatwaSourceName || fatwaSourceUrl);
  const detailHeight = (scholarlyReference ? 96 : 72) + (hasFatwa ? 22 : 0);
  const detailStyle = useAnimatedStyle(() => ({
    height: expandHeight.value * detailHeight,
    opacity: expandHeight.value,
    overflow: "hidden" as const,
  }));

  const statusLabel =
    problemStatus === "haram"
      ? t.scanResult.ingredientHaram
      : t.scanResult.ingredientDoubtful;

  return (
    <PressableScale
      onPress={toggleExpand}
      disabled={!isProblematic || !explanation}
      accessibilityRole={isProblematic && explanation ? "button" : "text"}
      accessibilityLabel={name}
      accessibilityHint={isProblematic && explanation ? t.scanResult.tapForDetail : undefined}
      style={[
        styles.ingredientRow,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: isDark
            ? "rgba(255,255,255,0.06)"
            : "rgba(0,0,0,0.06)",
        },
      ]}
    >
      <View style={ingredientStyles.nameRow}>
        <View
          style={[
            styles.ingredientDot,
            {
              backgroundColor: isProblematic
                ? problemColor ?? halalStatusTokens.doubtful.base
                : isDark
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(0,0,0,0.12)",
            },
          ]}
        />
        <Text
          style={[
            styles.ingredientName,
            {
              color: isProblematic
                ? problemColor ?? halalStatusTokens.doubtful.base
                : colors.textPrimary,
              fontWeight: isProblematic ? "600" : "400",
            },
          ]}
        >
          {name}
        </Text>
        {isProblematic && explanation && (
          <MaterialIcons
            name={expanded ? "expand-less" : "expand-more"}
            size={18}
            color={problemColor ?? halalStatusTokens.doubtful.base}
            style={{ marginStart: "auto" }}
          />
        )}
      </View>

      {/* Expandable detail */}
      {isProblematic && explanation && (
        <Animated.View style={[ingredientStyles.detailWrap, detailStyle]}>
          <View style={ingredientStyles.statusRow}>
            <View
              style={[ingredientStyles.statusBadge, { backgroundColor: (problemColor ?? halalStatusTokens.doubtful.base) + "20" }]}
            >
              <Text
                style={[ingredientStyles.statusText, { color: problemColor ?? halalStatusTokens.doubtful.base }]}
              >
                {statusLabel}
              </Text>
            </View>
          </View>
          <Text
            style={[ingredientStyles.explanation, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {explanation}
          </Text>
          {scholarlyReference && (
            <View style={ingredientStyles.refRow}>
              <MaterialIcons name="menu-book" size={11} color={colors.textMuted} />
              <Text style={[ingredientStyles.refText, { color: colors.textMuted }]} numberOfLines={1}>
                {scholarlyReference}
              </Text>
            </View>
          )}
          {hasFatwa && (
            <PressableScale
              onPress={() => fatwaSourceUrl && Linking.openURL(fatwaSourceUrl)}
              disabled={!fatwaSourceUrl}
              style={ingredientStyles.refRow}
            >
              <MaterialIcons name="gavel" size={11} color={colors.primary} />
              <Text
                style={[
                  ingredientStyles.refText,
                  { color: fatwaSourceUrl ? colors.primary : colors.textMuted },
                ]}
                numberOfLines={1}
              >
                {fatwaSourceName ?? t.scanResult.fatwaSource}
              </Text>
              {fatwaSourceUrl && (
                <MaterialIcons name="open-in-new" size={10} color={colors.primary} />
              )}
            </PressableScale>
          )}
        </Animated.View>
      )}
    </PressableScale>
  );
});

const ingredientStyles = StyleSheet.create({
  nameRow: { flexDirection: "row", alignItems: "center", flex: 1, gap: spacing.md },
  detailWrap: { marginTop: spacing.xs, paddingLeft: spacing["2xl"] },
  statusRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing.xs },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  statusText: { fontSize: fontSizeTokens.micro, fontWeight: fontWeightTokens.bold, textTransform: "uppercase" },
  explanation: { fontSize: fontSizeTokens.caption, lineHeight: 18 },
  refRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.xs },
  refText: { fontSize: fontSizeTokens.micro, fontStyle: "italic", flex: 1 },
});

// ── Loading Skeleton ────────────────────────────────────────

const ScanLoadingSkeleton = React.memo(function ScanLoadingSkeleton({
  barcode,
}: {
  barcode?: string;
}) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const shimmer = useSharedValue(0.3);
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (!reducedMotion) {
      shimmer.value = withRepeat(
        withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
    // Animated dots
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);
    return () => clearInterval(interval);
  }, [reducedMotion]);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 0.5 : shimmer.value,
  }));

  const bgColors = isDark
    ? (["#0a1a10", "#0f2418", "#132a1a"] as const)
    : (["#ecfdf5", "#d1fae5", "#a7f3d0"] as const);

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#0a1a10" : lightTheme.backgroundSecondary }}>
      <LinearGradient
        colors={[...bgColors]}
        style={[styles.heroGradient, { height: HERO_HEIGHT, paddingTop: insets.top }]}
      >
        <View style={styles.loadingContent}>
          {/* Skeleton status circle */}
          <Animated.View
            style={[
              skeletonStyles.circle,
              {
                backgroundColor: isDark
                  ? halalStatusTokens.halal.bgDark
                  : halalStatusTokens.halal.bg,
                borderColor: isDark
                  ? `${brandTokens.primary}33`
                  : `${brandTokens.primary}40`,
              },
              shimmerStyle,
            ]}
          />

          {/* Loading text */}
          <Text
            style={[
              styles.loadingTitle,
              { color: isDark ? colors.primary : colors.primaryDark },
            ]}
          >
            {t.scanResult.analyzing.replace("...", "")}{dots}
          </Text>

          {/* Barcode chip */}
          {barcode && (
            <View
              style={[
                styles.loadingBarcode,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.04)",
                },
              ]}
            >
              <MaterialIcons
                name="qr-code"
                size={14}
                color={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)"}
              />
              <Text
                style={[skeletonStyles.barcodeText, { color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)" }]}
              >
                {barcode}
              </Text>
            </View>
          )}

          {/* Skeleton certifier badge placeholder */}
          <Animated.View
            style={[
              skeletonStyles.badge,
              { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" },
              shimmerStyle,
            ]}
          />
        </View>
      </LinearGradient>

      {/* Skeleton cards below hero */}
      <View style={skeletonStyles.cardsWrap}>
        <Animated.View
          style={[
            skeletonStyles.cardLarge,
            { backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" },
            shimmerStyle,
          ]}
        />
        <Animated.View
          style={[
            skeletonStyles.cardSmall,
            { backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)" },
            shimmerStyle,
          ]}
        />
      </View>
    </View>
  );
});

// ── Error State ─────────────────────────────────────────────

const skeletonStyles = StyleSheet.create({
  circle: { width: 80, height: 80, borderRadius: 40, borderWidth: 3 },
  barcodeText: { fontSize: fontSizeTokens.caption, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", marginStart: spacing.sm },
  badge: { width: 160, height: 28, borderRadius: 14, marginTop: spacing.xl },
  cardsWrap: { paddingHorizontal: spacing["2xl"], paddingTop: spacing["2xl"] },
  cardLarge: { height: 80, borderRadius: radius.lg },
  cardSmall: { height: 60, borderRadius: radius.lg, marginTop: spacing.lg },
});

const ScanErrorState = React.memo(function ScanErrorState({
  onRetry,
  onGoBack,
}: {
  onRetry: () => void;
  onGoBack: () => void;
}) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.stateContainer]}>
      <Animated.View entering={FadeIn.duration(300)} style={styles.stateContent}>
        <View
          style={[
            styles.stateIconCircle,
            {
              backgroundColor: isDark
                ? halalStatusTokens.haram.bgDark
                : halalStatusTokens.haram.bg,
            },
          ]}
        >
          <MaterialIcons
            name="error-outline"
            size={36}
            color={halalStatusTokens.haram.base}
          />
        </View>
        <Text style={[styles.stateTitle, { color: colors.textPrimary }]}>
          {t.scanResult.analysisError}
        </Text>
        <Text style={[styles.stateDesc, { color: colors.textSecondary }]}>
          {t.scanResult.analysisErrorDesc}
        </Text>
        <View style={styles.stateButtons}>
          <PressableScale
            onPress={onGoBack}
            style={[
              styles.stateButton,
              {
                backgroundColor: colors.buttonSecondary,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t.common.back}
          >
            <Text style={[styles.stateButtonText, { color: colors.textPrimary }]}>
              {t.common.back}
            </Text>
          </PressableScale>
          <PressableScale
            onPress={onRetry}
            style={[styles.stateButton, { backgroundColor: colors.primary }]}
            accessibilityRole="button"
            accessibilityLabel={t.common.retry}
          >
            <Text style={[styles.stateButtonText, { color: lightTheme.textPrimary }]}>
              {t.common.retry}
            </Text>
          </PressableScale>
        </View>
      </Animated.View>
    </View>
  );
});

// ── Not Found State ─────────────────────────────────────────

const ScanNotFoundState = React.memo(function ScanNotFoundState({
  onGoBack,
}: {
  onGoBack: () => void;
}) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.stateContainer]}>
      <Animated.View entering={FadeIn.duration(300)} style={styles.stateContent}>
        <View
          style={[
            styles.stateIconCircle,
            {
              backgroundColor: isDark
                ? `${brandTokens.gold}1A`
                : `${brandTokens.gold}14`,
            },
          ]}
        >
          <MaterialIcons
            name="search-off"
            size={36}
            color={brandTokens.gold}
          />
        </View>
        <Text style={[styles.stateTitle, { color: colors.textPrimary }]}>
          {t.scanResult.productNotFound}
        </Text>
        <Text style={[styles.stateDesc, { color: colors.textSecondary }]}>
          {t.scanResult.productNotFoundDesc}
        </Text>
        <PressableScale
          onPress={onGoBack}
          style={[styles.stateButton, { backgroundColor: colors.primary, marginTop: 16 }]}
          accessibilityRole="button"
          accessibilityLabel={t.scanResult.scanAnother}
        >
          <Text style={[styles.stateButtonText, { color: lightTheme.textPrimary }]}>
            {t.scanResult.scanAnother}
          </Text>
        </PressableScale>
      </Animated.View>
    </View>
  );
});

// ══════════════════════════════════════════════════════════════
// MAIN SCREEN
// ══════════════════════════════════════════════════════════════

export default function ScanResultScreen() {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const { impact, notification } = useHaptics();
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const { barcode, viewOnly } = useLocalSearchParams<{ barcode: string; viewOnly?: string }>();
  const isViewOnly = viewOnly === "1";

  // ── tRPC Mutation ──────────────────────────────
  const scanMutation = useScanBarcode();
  const { data: userProfile } = trpc.profile.getProfile.useQuery();
  const hasFired = useRef(false);
  const shareCardRef = useRef<View>(null);

  useEffect(() => {
    if (barcode && !hasFired.current) {
      hasFired.current = true;
      scanMutation.mutate({ barcode, viewOnly: isViewOnly || undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hasFired ref guards re-fire
  }, [barcode, isViewOnly]);

  // ── Derived State ──────────────────────────────
  const product = scanMutation.data?.product ?? null;
  const halalAnalysis = scanMutation.data?.halalAnalysis ?? null;
  const boycott = scanMutation.data?.boycott ?? null;
  const offExtras = scanMutation.data?.offExtras ?? null;
  const madhabVerdicts = scanMutation.data?.madhabVerdicts ?? [];
  const ingredientRulings = useMemo(
    () => scanMutation.data?.ingredientRulings ?? [],
    [scanMutation.data?.ingredientRulings]
  );
  const levelUp = scanMutation.data?.levelUp ?? null;

  const halalStatus: HalalStatusKey =
    (product?.halalStatus as HalalStatusKey) ?? "unknown";

  // ── Per-madhab trust score selection ──
  // If user has a madhab preference (hanafi/shafii/maliki/hanbali), use
  // the school-specific score. Otherwise fall back to universal score.
  const userMadhab = (userProfile?.madhab as "hanafi" | "shafii" | "maliki" | "hanbali" | "general" | null) ?? "general";
  const certifierData_ = scanMutation.data?.certifierData;
  const certifierTrustScore = useMemo(() => {
    if (!certifierData_) return null;
    const MADHAB_SCORE_KEY = {
      hanafi: "trustScoreHanafi",
      shafii: "trustScoreShafii",
      maliki: "trustScoreMaliki",
      hanbali: "trustScoreHanbali",
    } as const;
    if (userMadhab !== "general" && userMadhab in MADHAB_SCORE_KEY) {
      return certifierData_[MADHAB_SCORE_KEY[userMadhab as keyof typeof MADHAB_SCORE_KEY]] ?? certifierData_.trustScore;
    }
    return certifierData_.trustScore;
  }, [certifierData_, userMadhab]);

  // ── Hero color rule: combine halal status + certifier trust score ──
  // For halal products, if the certifier has a trust score < 70, downgrade
  // the hero to "doubtful" visuals (orange) so color matches the bar.
  const effectiveHeroStatus: HalalStatusKey =
    halalStatus === "halal" && certifierTrustScore !== null && certifierTrustScore < 70
      ? "doubtful"
      : halalStatus;
  const statusConfig = STATUS_CONFIG[effectiveHeroStatus] ?? STATUS_CONFIG.unknown;
  // Dynamic hero label: "Certification Détectée" only when a certifier exists,
  // otherwise "Composition Conforme" for halal-by-analysis products (e.g. bread)
  const heroLabel =
    effectiveHeroStatus === "halal" && !certifierData_
      ? t.scanResult.compositionCompliant
      : t.scanResult[statusConfig.labelKey];
  const shadows = getShadows(isDark);
  const ingredients: string[] = (product?.ingredients as string[]) ?? [];

  const haramReasons = useMemo(
    () => halalAnalysis?.reasons.filter((r) => r.status === "haram") ?? [],
    [halalAnalysis?.reasons]
  );
  const doubtfulReasons = useMemo(
    () => halalAnalysis?.reasons.filter((r) => r.status === "doubtful") ?? [],
    [halalAnalysis?.reasons]
  );
  const additiveReasons = useMemo(
    () => halalAnalysis?.reasons.filter((r) => r.type === "additive") ?? [],
    [halalAnalysis?.reasons]
  );
  const allergensTags: string[] = offExtras?.allergensTags ?? [];

  const personalAlerts: PersonalAlert[] =
    scanMutation.data?.personalAlerts ?? [];
  const communityVerifiedCount = scanMutation.data?.communityVerifiedCount ?? 0;
  const certifierData = scanMutation.data?.certifierData ?? null;

  // ── Halal Alternatives Query ──────────────────
  const { isFeatureEnabled } = useFeatureFlagsStore();
  const marketplaceEnabled = isFeatureEnabled("marketplaceEnabled");
  const alternativesQuery = trpc.product.getAlternatives.useQuery(
    { productId: product?.id ?? "", limit: 3 },
    { enabled: !!product?.id }
  );

  // ── Level-Up Celebration ─────────────────────
  const [showLevelUp, setShowLevelUp] = useState(false);
  const handleDismissLevelUp = useCallback(() => setShowLevelUp(false), []);

  useEffect(() => {
    if (levelUp) setShowLevelUp(true);
  }, [levelUp]);

  // ── Madhab Bottom Sheet ─────────────────────
  const [selectedMadhab, setSelectedMadhab] = useState<{
    madhab: string;
    status: "halal" | "doubtful" | "haram";
    conflictingAdditives: Array<{
      code: string;
      name: string;
      ruling: string;
      explanation: string;
      scholarlyReference: string | null;
    }>;
    conflictingIngredients: Array<{
      pattern: string;
      ruling: string;
      explanation: string;
      scholarlyReference: string | null;
    }>;
  } | null>(null);

  const handleCloseMadhab = useCallback(() => setSelectedMadhab(null), []);

  // ── Trust Score Bottom Sheet ─────────────────
  const [showTrustScoreSheet, setShowTrustScoreSheet] = useState(false);
  const handleCloseTrustScore = useCallback(() => setShowTrustScoreSheet(false), []);

  // ── Score Detail Bottom Sheet ──────────────
  const [showScoreDetailSheet, setShowScoreDetailSheet] = useState(false);
  const handleCloseScoreDetail = useCallback(() => setShowScoreDetailSheet(false), []);

  // ── User Vote (backend-synced) ────────────────
  const [userVote, setUserVote] = useState<"up" | "down" | null>(null);
  const reviewMutation = useCreateReview();

  // Build a Map of problematic ingredient names for fast lookup
  // Includes color + explanation for expandable ingredient detail
  const problematicIngredients = useMemo(() => {
    const names = new Map<string, {
      color: string;
      explanation: string;
      status: string;
      scholarlyReference?: string | null;
      fatwaSourceName?: string | null;
      fatwaSourceUrl?: string | null;
    }>();
    // Build from ingredient rulings first (has fatwaSourceUrl)
    for (const ir of ingredientRulings) {
      if (ir.ruling !== "halal") {
        names.set(ir.pattern.toLowerCase(), {
          color: ir.ruling === "haram" ? halalStatusTokens.haram.base : halalStatusTokens.doubtful.base,
          explanation: ir.explanationFr,
          status: ir.ruling,
          scholarlyReference: ir.scholarlyReference,
          fatwaSourceName: ir.fatwaSourceName,
          fatwaSourceUrl: ir.fatwaSourceUrl,
        });
      }
    }
    // Overlay with haram/doubtful reasons (may have more details)
    for (const r of haramReasons) {
      const existing = names.get(r.name.toLowerCase());
      names.set(r.name.toLowerCase(), {
        color: halalStatusTokens.haram.base,
        explanation: r.explanation,
        status: r.status,
        scholarlyReference: r.scholarlyReference ?? existing?.scholarlyReference,
        fatwaSourceName: r.fatwaSourceName ?? existing?.fatwaSourceName,
        fatwaSourceUrl: existing?.fatwaSourceUrl,
      });
    }
    for (const r of doubtfulReasons) {
      if (!names.has(r.name.toLowerCase())) {
        names.set(r.name.toLowerCase(), {
          color: halalStatusTokens.doubtful.base,
          explanation: r.explanation,
          status: r.status,
          scholarlyReference: r.scholarlyReference,
          fatwaSourceName: r.fatwaSourceName,
        });
      }
    }
    return names;
  }, [haramReasons, doubtfulReasons, ingredientRulings]);

  // ── Favorites (backend-synced) ─────────────────
  const favoritesQuery = trpc.favorites.list.useQuery(
    { limit: 200 },
    { staleTime: 1000 * 60 * 5 }
  );
  const addFavoriteMutation = useAddFavorite();
  const removeFavoriteMutation = useRemoveFavorite();
  const productIsFavorite = useMemo(
    () => favoritesQuery.data?.some((f: any) => f.productId === product?.id) ?? false,
    [favoritesQuery.data, product?.id]
  );

  // ── Haptic orchestration on verdict ────────────
  // Context-aware two-phase haptic: each verdict gets a distinct tactile signature.
  // Halal   = relief   (success + soft landing)
  // Haram   = alarm    (double error pulse)
  // Doubtful = caution (warning + light nudge)
  // Unknown  = neutral (single light tap, no notification)
  const hasFiredHaptic = useRef(false);
  useEffect(() => {
    if (product && !hasFiredHaptic.current) {
      hasFiredHaptic.current = true;
      if (halalStatus === "halal") {
        notification(NotificationFeedbackType.Success);
        setTimeout(() => impact(ImpactFeedbackStyle.Light), 200);
      } else if (halalStatus === "haram") {
        notification(NotificationFeedbackType.Error);
        setTimeout(() => notification(NotificationFeedbackType.Error), 180);
      } else if (halalStatus === "doubtful") {
        notification(NotificationFeedbackType.Warning);
        setTimeout(() => impact(ImpactFeedbackStyle.Light), 250);
      } else {
        // unknown — neutral single tap, no notification vibration
        impact(ImpactFeedbackStyle.Light);
      }
    }
  }, [product, halalStatus, notification, impact]);

  // ── Callbacks ──────────────────────────────────
  const handleGoBack = useCallback(() => {
    impact();
    router.back();
  }, [impact]);

  const shareData = useMemo(() => {
    if (!product) return null;
    return {
      productName: product.name,
      brand: product.brand ?? null,
      halalStatus: halalStatus as "halal" | "haram" | "doubtful" | "unknown",
      certifier: halalAnalysis?.certifierName ?? null,
      isBoycotted: !!boycott,
      barcode: product.barcode,
    };
  }, [product, halalStatus, halalAnalysis, boycott]);

  const shareLabels = useMemo(() => {
    const statusLabelMap: Record<string, string> = {
      halal: certifierData
        ? t.scanResult.certifiedHalal
        : t.scanResult.compositionCompliant,
      haram: t.scanResult.haramDetected,
      doubtful: t.scanResult.doubtfulStatus,
      unknown: t.scanResult.unverified,
    };
    return {
      statusLabel: statusLabelMap[halalStatus] ?? statusLabelMap.unknown,
      certifiedBy: t.scanResult.certifiedBy,
      boycotted: t.scanResult.shareBoycotted,
      verifiedWith: t.scanResult.verifiedWith,
      tagline: t.scanResult.shareTagline,
    };
  }, [halalStatus, certifierData, t]);

  const handleShare = useCallback(async () => {
    impact();
    if (!shareData) return;
    await captureAndShareCard(shareCardRef, shareData, shareLabels);
  }, [shareData, shareLabels, impact]);

  const isFavMutating = addFavoriteMutation.isPending || removeFavoriteMutation.isPending;

  const handleToggleFavorite = useCallback(() => {
    if (isFavMutating || !product?.id) return;
    impact(ImpactFeedbackStyle.Medium);
    if (productIsFavorite) {
      removeFavoriteMutation.mutate(
        { productId: product.id },
        {
          onError: () => {
            Alert.alert(t.favorites.removeError);
          },
        }
      );
    } else {
      addFavoriteMutation.mutate(
        { productId: product.id },
        {
          onError: (err) => {
            if (err.data?.code === "FORBIDDEN") {
              Alert.alert(
                t.favorites.premiumLimitTitle,
                t.favorites.premiumLimitMessage,
                [{ text: "OK" }]
              );
            } else if (err.data?.code === "CONFLICT") {
              // Already favorited — stale cache, will self-correct on refetch
            } else {
              Alert.alert(t.favorites.addError);
            }
          },
        }
      );
    }
  }, [isFavMutating, product, productIsFavorite, addFavoriteMutation, removeFavoriteMutation, impact, t]);

  const handleFindStores = useCallback(() => {
    impact();
    if (marketplaceEnabled) {
      // Navigate to marketplace catalog, pre-filtered by product name/category
      router.navigate({
        pathname: "/(marketplace)/catalog",
        params: {
          ...(product?.name ? { search: product.name } : {}),
        },
      } as any);
    } else {
      router.navigate("/(tabs)/map");
    }
  }, [impact, marketplaceEnabled, product?.name]);

  const handleReport = useCallback(() => {
    impact();
    router.push({
      pathname: "/report",
      params: { productId: product?.id, productName: product?.name },
    });
  }, [product, impact]);

  const handleRetry = useCallback(() => {
    hasFired.current = false;
    hasFiredHaptic.current = false;
    scanMutation.reset();
    if (barcode) {
      hasFired.current = true;
      scanMutation.mutate({ barcode, viewOnly: isViewOnly || undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barcode, isViewOnly]);

  // ── Favorite animation ─────────────────────────
  const favScale = useSharedValue(1);
  const handleFavAnimated = useCallback(() => {
    handleToggleFavorite();
    favScale.value = withSequence(
      withSpring(1.3, { damping: 6, stiffness: 300 }),
      withSpring(1, { damping: 8, stiffness: 200 })
    );
  }, [handleToggleFavorite]);

  const favAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: favScale.value }],
  }));

  // ── CTA shimmer animation ──────────────────────
  const shimmerX = useSharedValue(-80);

  useEffect(() => {
    if (!reducedMotion) {
      shimmerX.value = withRepeat(
        withSequence(
          withTiming(300, { duration: 2500, easing: Easing.linear }),
          withTiming(-80, { duration: 0 })
        ),
        -1,
        false
      );
    }
  }, [reducedMotion]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }, { skewX: "-20deg" }],
  }));

  // ── Hero: Animated score counter (0→N) ────────
  const scoreDisplay = useSharedValue(0);
  const barScale = useSharedValue(0);
  const [displayedScore, setDisplayedScore] = useState(0);

  useEffect(() => {
    if (certifierTrustScore != null) {
      scoreDisplay.value = withTiming(certifierTrustScore, {
        duration: 1200,
        easing: Easing.out(Easing.cubic),
      });
      barScale.value = withTiming(certifierTrustScore / 100, {
        duration: 1400,
        easing: Easing.out(Easing.cubic),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [certifierTrustScore]);

  const roundedScore = useDerivedValue(() => Math.round(scoreDisplay.value));
  useAnimatedReaction(
    () => roundedScore.value,
    (val) => runOnJS(setDisplayedScore)(val),
  );

  // Bar fill via scaleX — GPU-only, no layout recalc
  const animatedBarStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: barScale.value }],
  }));

  // ── Hero: Image glow pulse (opacity overlay, not shadowOpacity) ──
  const glowOpacity = useSharedValue(0.15);

  useEffect(() => {
    if (!reducedMotion) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.15, { duration: 2000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      );
    }
  }, [reducedMotion]);

  const imageGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  // ── Hero: Ambient orb drift ───────────────────
  const orbX = useSharedValue(0);
  const orbY = useSharedValue(0);

  useEffect(() => {
    if (!reducedMotion) {
      orbX.value = withRepeat(
        withSequence(
          withTiming(20, { duration: 6000, easing: Easing.inOut(Easing.sin) }),
          withTiming(-20, { duration: 6000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      );
      orbY.value = withRepeat(
        withSequence(
          withTiming(15, { duration: 5000, easing: Easing.inOut(Easing.sin) }),
          withTiming(-15, { duration: 5000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      );
    }
  }, [reducedMotion]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: orbX.value }, { translateY: orbY.value }],
  }));

  // ── RENDER: Loading ────────────────────────────
  if (scanMutation.isPending) {
    return <ScanLoadingSkeleton barcode={barcode} />;
  }

  // ── RENDER: Error ──────────────────────────────
  if (scanMutation.error) {
    return <ScanErrorState onRetry={handleRetry} onGoBack={handleGoBack} />;
  }

  // ── RENDER: Not Found ──────────────────────────
  if (!product) {
    return <ScanNotFoundState onGoBack={handleGoBack} />;
  }

  // ── RENDER: Success ────────────────────────────
  const gradientColors = isDark
    ? statusConfig.gradientDark
    : statusConfig.gradientLight;

  const actionButtonBg = isDark ? glass.dark.bg : glass.light.border;

  // Shared action bar buttons — rendered once, used in both iOS (BlurView) and Android (View) wrappers
  const actionBarButtons = (
    <View
      style={[
        styles.actionBarInner,
        { borderColor: isDark ? glass.dark.border : glass.light.border },
      ]}
    >
      {/* Favorite */}
      <PressableScale
        onPress={handleFavAnimated}
        disabled={isFavMutating}
        style={[
          styles.actionButton,
          {
            backgroundColor: actionButtonBg,
            opacity: isFavMutating ? 0.5 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={
          productIsFavorite
            ? t.scanResult.removeFromFavorites
            : t.scanResult.addToFavorites
        }
        accessibilityState={{ selected: productIsFavorite, busy: isFavMutating }}
      >
        <Animated.View style={favAnimatedStyle}>
          <MaterialIcons
            name={productIsFavorite ? "favorite" : "favorite-border"}
            size={24}
            color={productIsFavorite ? halalStatusTokens.haram.base : colors.textSecondary}
          />
        </Animated.View>
      </PressableScale>

      {/* Share */}
      <PressableScale
        onPress={handleShare}
        style={[styles.actionButton, { backgroundColor: actionButtonBg }]}
        accessibilityRole="button"
        accessibilityLabel={t.scanResult.shareProduct}
      >
        <MaterialIcons name="share" size={22} color={colors.textSecondary} />
      </PressableScale>

      {/* Primary CTA — contextual: halal → "Où acheter ?", haram/doubtful → "Scanner un autre" */}
      {halalStatus === "halal" ? (
        <PressableScale
          onPress={handleFindStores}
          style={[styles.ctaButton, { backgroundColor: colors.primary, ...shadows.float, shadowColor: colors.primary }]}
          accessibilityRole="button"
          accessibilityLabel={t.scanResult.whereToBuy}
          accessibilityHint={t.scanResult.findStores}
        >
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              shimmerStyle,
              { width: 60, backgroundColor: "rgba(255,255,255,0.15)" },
            ]}
            pointerEvents="none"
          />
          <MaterialIcons name={marketplaceEnabled ? "shopping-cart" : "location-on"} size={20} color={lightTheme.textPrimary} />
          <Text style={[styles.ctaText, { color: lightTheme.textPrimary }]}>
            {marketplaceEnabled ? t.scanResult.viewOnMarketplace : t.scanResult.whereToBuy}
          </Text>
        </PressableScale>
      ) : (
        <PressableScale
          onPress={handleGoBack}
          style={[styles.ctaButton, { backgroundColor: colors.primary, ...shadows.float, shadowColor: colors.primary }]}
          accessibilityRole="button"
          accessibilityLabel={t.scanResult.scanAnother}
        >
          <MaterialIcons name="qr-code-scanner" size={20} color={lightTheme.textPrimary} />
          <Text style={[styles.ctaText, { color: lightTheme.textPrimary }]}>
            {t.scanResult.scanAnother}
          </Text>
        </PressableScale>
      )}

      {/* Report */}
      <PressableScale
        onPress={handleReport}
        style={[styles.actionButton, { backgroundColor: actionButtonBg }]}
        accessibilityRole="button"
        accessibilityLabel={t.scanResult.report}
      >
        <MaterialIcons name="flag" size={22} color={colors.textSecondary} />
      </PressableScale>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <PremiumBackground />
      {/* ── Floating Back Button (absolute, above everything) ── */}
      <View
        style={[
          styles.floatingBackButton,
          { top: insets.top + 8 },
        ]}
      >
        <IconButton
          icon="arrow-back"
          variant="filled"
          onPress={handleGoBack}
          color={isDark ? brandTokens.white : lightTheme.textPrimary}
          accessibilityLabel={t.common.back}
        />
      </View>

      {/* ── Floating Info Button (top-right, certified products only) ── */}
      {certifierData && (
        <View
          style={[
            styles.floatingInfoButton,
            { top: insets.top + 8 },
          ]}
        >
          <IconButton
            icon="info-outline"
            variant="filled"
            onPress={() => {
              impact();
              setShowTrustScoreSheet(true);
            }}
            color={isDark ? brandTokens.white : lightTheme.textPrimary}
            accessibilityLabel={t.scanResult.trustScoreExplainTitle}
          />
        </View>
      )}

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* ════════════════════════════════════════════════════
            HERO SECTION — compact, verdict-first, premium layout
            ════════════════════════════════════════════════════ */}
        <View
          style={[styles.heroGradient, { paddingTop: insets.top + 64 }]}
          accessibilityRole="summary"
          accessibilityLabel={heroLabel}
        >
          {/* L0: Status-tinted gradient base */}
          <LinearGradient
            colors={[...gradientColors]}
            style={StyleSheet.absoluteFill}
          />
          {/* L1: Glassmorphic blur overlay */}
          {Platform.OS === "ios" ? (
            <BlurView
              intensity={60}
              tint={isDark ? "dark" : "light"}
              style={[StyleSheet.absoluteFill, {
                backgroundColor: isDark ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.2)",
              }]}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, {
              backgroundColor: isDark ? "rgba(12,12,12,0.92)" : "rgba(243,241,237,0.92)",
            }]} />
          )}
          {/* L2: Subtle status-colored accent wash */}
          <View style={[StyleSheet.absoluteFill, {
            backgroundColor: `${statusConfig.glowColor}08`,
          }]} />
          {/* L4: Ambient orb — drifting slowly */}
          <Animated.View
            style={[
              {
                position: "absolute",
                top: -80,
                right: -60,
                width: 280,
                height: 280,
                borderRadius: 140,
              },
              orbStyle,
            ]}
          >
            <LinearGradient
              colors={[`${statusConfig.glowColor}18`, `${statusConfig.glowColor}08`, "transparent"]}
              style={{ width: 280, height: 280, borderRadius: 140 }}
            />
          </Animated.View>

          {/* ── ROW 1: HERO HORIZONTAL SPLIT ── */}
          <Animated.View
            entering={FadeIn.delay(50).duration(400)}
            style={styles.heroSplit}
          >
            {/* LEFT COLUMN: Product Image + Brand */}
            <View style={styles.heroImageColumn}>
              <View style={{ width: 80, height: 80 }}>
                {/* Glow halo — separate layer, animates opacity only (GPU cheap) */}
                <Animated.View
                  style={[
                    {
                      position: "absolute",
                      top: -6,
                      left: -6,
                      right: -6,
                      bottom: -6,
                      borderRadius: 18,
                      backgroundColor: statusConfig.glowColor,
                    },
                    imageGlowStyle,
                  ]}
                  pointerEvents="none"
                />
                <Animated.View
                  entering={FadeIn.delay(SUSPENSE_DURATION).duration(400)}
                  style={[
                    styles.heroImageWrapper,
                    {
                      borderColor: `${statusConfig.color}25`,
                      backgroundColor: isDark ? glass.dark.highlight : glass.light.border,
                    },
                  ]}
                >
                {product.imageUrl ? (
                  <Image
                    source={{ uri: product.imageUrl }}
                    style={styles.heroImage}
                    contentFit="cover"
                    transition={200}
                    accessibilityLabel={product.name}
                  />
                ) : (
                  <MaterialIcons name="image-not-supported" size={24} color={colors.textMuted} />
                )}
              </Animated.View>
              </View>
              {product.brand && (
                <Text
                  style={[styles.heroBrandLabel, { color: colors.textMuted }]}
                  numberOfLines={1}
                >
                  {product.brand}
                </Text>
              )}
            </View>

            {/* RIGHT COLUMN: Certifier Trust Score + Verdict */}
            <View style={styles.heroInfoColumn}>
              {/* Naqiy Score label row */}
              <View style={styles.heroScoreLabelRow}>
                <Image
                  source={require("@assets/images/logo_naqiy.webp")}
                  style={{ width: 18, height: 18, opacity: isDark ? 0.5 : 0.35 }}
                  contentFit="contain"
                />
                <Text style={[styles.heroScoreLabelText, { color: colors.textMuted }]}>
                  {t.scanResult.naqiyScoreLabel}{userMadhab !== "general" && ` · ${t.madhab.options[userMadhab].label}`}
                </Text>
              </View>

              {/* Certifier trust score bar OR verdict fallback */}
              <Animated.View
                entering={FadeInDown.delay(SUSPENSE_DURATION + 100).duration(500)}
                style={styles.heroScoreRow}
              >
                {certifierData ? (
                  <View style={styles.heroCertifierRow}>
                    {/* Left: name + score + bar */}
                    <View style={styles.heroCertifierBar}>
                      <View style={styles.heroCertifierHeader}>
                        <CertifierLogo certifierId={certifierData.id} size={20} fallbackColor={statusConfig.color} />
                        <Text
                          style={[styles.heroCertifierName, { color: colors.textPrimary }]}
                          numberOfLines={1}
                        >
                          {certifierData.name}
                        </Text>
                        <Text
                          style={[
                            styles.heroCertifierScore,
                            {
                              color: certifierTrustScore! >= 70
                                ? halalStatusTokens.halal.base
                                : certifierTrustScore! >= 40
                                  ? halalStatusTokens.doubtful.base
                                  : halalStatusTokens.haram.base,
                            },
                          ]}
                        >
                          {displayedScore}/100
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.heroCertifierBarBg,
                          { backgroundColor: isDark ? glass.dark.border : glass.light.borderStrong },
                        ]}
                      >
                        <Animated.View
                          style={[
                            styles.heroCertifierBarFill,
                            {
                              width: "100%",
                              transformOrigin: "left",
                              backgroundColor: certifierTrustScore! >= 70
                                ? halalStatusTokens.halal.base
                                : certifierTrustScore! >= 40
                                  ? halalStatusTokens.doubtful.base
                                  : halalStatusTokens.haram.base,
                            },
                            animatedBarStyle,
                          ]}
                        />
                      </View>
                      {/* Tier sub-label — tucked under progress bar */}
                      {halalAnalysis && (
                        <Text style={[styles.heroTierLabel, { color: colors.textMuted }]}>
                          {t.scanResult.tier}{" "}
                          {halalAnalysis.tier === "certified" ? "1" : halalAnalysis.tier === "analyzed_clean" ? "2" : halalAnalysis.tier === "doubtful" ? "3" : "4"}
                          {" · "}
                          {halalAnalysis.tier === "certified" ? t.scanResult.tierCertified : halalAnalysis.tier === "analyzed_clean" ? t.scanResult.tierAnalyzed : halalAnalysis.tier === "doubtful" ? t.scanResult.tierDoubtful : t.scanResult.tierUnknown}
                        </Text>
                      )}
                    </View>
                    {/* Right: stats icon — opens per-theme score detail */}
                    <PressableScale
                      onPress={() => {
                        impact();
                        setShowScoreDetailSheet(true);
                      }}
                      accessibilityLabel={t.scanResult.scoreDetailTitle}
                      accessibilityRole="button"
                    >
                      <View
                        style={[
                          styles.heroHelpButton,
                          {
                            backgroundColor: isDark ? glass.dark.bg : glass.light.border,
                            borderColor: isDark ? glass.dark.border : glass.light.borderStrong,
                          },
                        ]}
                      >
                        <MaterialIcons
                          name="leaderboard"
                          size={20}
                          color={isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.35)"}
                        />
                      </View>
                    </PressableScale>
                  </View>
                ) : (
                  <View style={styles.heroVerdictColumn}>
                    <Text
                      style={[styles.heroVerdictText, { color: statusConfig.color }]}
                      numberOfLines={1}
                      accessibilityRole="header"
                    >
                      {heroLabel}
                    </Text>
                  </View>
                )}
              </Animated.View>
            </View>
          </Animated.View>

          {/* ── Product name + barcode (full-width below split) ── */}
          <View style={[
            styles.heroDivider,
            { backgroundColor: isDark ? glass.dark.border : glass.light.border },
          ]} />
          <View style={styles.heroProductRow}>
            <Text
              style={[styles.heroProductName, { color: colors.textPrimary }]}
              numberOfLines={2}
              accessibilityRole="header"
            >
              {product.name}
            </Text>
            <View style={styles.heroBarcodeChip}>
              <Svg width={14} height={10} viewBox="0 0 14 10">
                <Path d="M0 0h1v10H0zM2 0h1v10H2zM4 0h2v10H4zM7 0h1v10H7zM9 0h1v8H9zM11 0h1v10h-1zM13 0h1v10h-1z" fill={colors.textMuted} opacity={0.6} />
              </Svg>
              <Text style={[styles.heroBarcode, { color: colors.textMuted }]}>
                {product.barcode}
              </Text>
            </View>
          </View>

          {/* ── ROW 2: METADATA BAND (community badge only) ── */}
          {communityVerifiedCount > 0 && (
            <Animated.View
              entering={FadeIn.delay(SUSPENSE_DURATION + 350).duration(500)}
              style={styles.metadataBand}
            >
              <View
                style={[
                  styles.certifierHeroBadge,
                  {
                    backgroundColor: isDark
                      ? glass.dark.bg
                      : glass.light.border,
                    borderColor: isDark
                      ? glass.dark.borderStrong
                      : glass.light.borderStrong,
                  },
                ]}
              >
                <MaterialIcons name="groups" size={13} color={colors.textMuted} />
                <Text style={[styles.certifierHeroBadgeText, { color: colors.textSecondary }]}>
                  {(communityVerifiedCount > 1
                    ? t.scanResult.verifiedByCountPlural
                    : t.scanResult.verifiedByCount
                  ).replace("{{count}}", String(communityVerifiedCount))}
                </Text>
              </View>
            </Animated.View>
          )}

          {/* ── ROW 3: Madhab Score Rings (Plan B — Score Orbitaire) ── */}
          {madhabVerdicts.length > 0 && (
            <Animated.View
              entering={FadeIn.delay(SUSPENSE_DURATION + 550).duration(500)}
              style={[
                styles.madhabRow,
                { borderTopColor: isDark ? glass.dark.border : glass.light.border },
              ]}
            >
              {madhabVerdicts.map((v, i) => {
                const labelKey = MADHAB_LABEL_KEY[v.madhab as keyof typeof MADHAB_LABEL_KEY];
                const label = labelKey ? t.scanResult[labelKey] : v.madhab;

                const trustKey = MADHAB_TRUST_KEY[v.madhab as keyof typeof MADHAB_TRUST_KEY];
                const madhabTrustScore = certifierData_ && trustKey
                  ? (certifierData_ as Record<string, unknown>)[trustKey] as number | null ?? null
                  : null;

                return (
                  <PressableScale
                    key={v.madhab}
                    onPress={() => {
                      impact();
                      setSelectedMadhab(v);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`${label}: ${v.status}${madhabTrustScore !== null ? `, ${t.scanResult.madhabTrustScoreLabel} ${madhabTrustScore}/100` : ""}`}
                  >
                    <MadhabScoreRing
                      label={label}
                      verdict={v.status as "halal" | "doubtful" | "haram"}
                      trustScore={madhabTrustScore}
                      conflictCount={v.conflictingAdditives.length + (v.conflictingIngredients?.length ?? 0)}
                      isUserSchool={userMadhab === v.madhab}
                      staggerIndex={i}
                    />
                  </PressableScale>
                );
              })}

              {/* ── Info note below rings ── */}
              <View style={styles.madhabInfoNote}>
                <MaterialIcons name="info-outline" size={11} color={colors.textMuted} style={{ marginTop: 1 }} />
                <Text style={[styles.madhabInfoNoteText, { color: colors.textMuted }]}>
                  {certifierData_?.name
                    ? t.scanResult.madhabCertifierNote.replace("{{certifier}}", certifierData_.name)
                    : t.scanResult.madhabAlgoNote}
                </Text>
              </View>

              {/* ── Hadith "Al-Halal Bayyin" — only for doubtful status ── */}
              {effectiveHeroStatus === "doubtful" && (
                <Animated.View
                  entering={FadeInDown.delay(SUSPENSE_DURATION + 800).duration(500)}
                  style={[
                    styles.hadithCard,
                    {
                      backgroundColor: isDark ? `${gold[500]}0C` : `${gold[500]}08`,
                      borderColor: isDark ? `${gold[500]}20` : `${gold[500]}15`,
                      shadowColor: gold[500],
                      shadowOpacity: isDark ? 0.12 : 0.06,
                      shadowOffset: { width: 0, height: 2 },
                      shadowRadius: 8,
                      elevation: 3,
                    },
                  ]}
                >
                  {/* Single gold accent line — top */}
                  <LinearGradient
                    colors={[`${gold[500]}00`, gold[500], `${gold[500]}00`]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.hadithAccentLine}
                  />

                  {/* Quote text in user's language */}
                  <Text
                    style={[
                      styles.hadithText,
                      { color: isDark ? gold[200] : gold[800] },
                    ]}
                  >
                    {t.scanResult.hadithHalalBayyin}
                  </Text>

                  {/* Source */}
                  <Text
                    style={[
                      styles.hadithSource,
                      { color: isDark ? gold[400] : gold[600] },
                    ]}
                  >
                    — {t.scanResult.hadithHalalBayyinSource}
                  </Text>
                </Animated.View>
              )}
            </Animated.View>
          )}
        </View>

        {/* ════════════════════════════════════════════════════
            CONTENT SECTIONS (below the fold)
            ════════════════════════════════════════════════════ */}
        <View style={styles.contentContainer}>
          {/* ── Halal Alternatives (Contextual Cross-Selling) ── */}
          {(halalStatus === "haram" || halalStatus === "doubtful") &&
            alternativesQuery.data && alternativesQuery.data.length > 0 && (
            <Animated.View entering={entryAnimations.fadeInDown(1)} style={styles.altSection}>
              <View style={styles.altHeader}>
                <View style={styles.altHeaderLeft}>
                  <View style={[styles.altHeaderIcon, { backgroundColor: isDark ? `${brandTokens.gold}25` : `${brandTokens.gold}1A` }]}>
                    <MaterialIcons name="swap-horiz" size={14} color={brandTokens.gold} />
                  </View>
                  <Text style={[styles.altHeaderTitle, { color: colors.textPrimary }]}>
                    {t.scanResult.halalAlternatives}
                  </Text>
                </View>
                <MaterialIcons name={marketplaceEnabled ? "storefront" : "local-mall"} size={20} color={brandTokens.gold} />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.xs }}>
                {alternativesQuery.data.slice(0, 3).map((alt: any, index: number) => (
                    <PressableScale
                      key={alt.id}
                      onPress={() => {
                        if (marketplaceEnabled) {
                          router.navigate({ pathname: "/(marketplace)/product/[id]", params: { id: alt.id } } as any);
                        } else {
                          router.navigate({ pathname: "/scan-result", params: { barcode: alt.barcode } });
                        }
                      }}
                    >
                      <GlowCard
                        glowColor={brandTokens.gold}
                        glowIntensity="subtle"
                        style={{ ...styles.altCard, backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#ffffff" }}
                      >
                        <View>
                          {alt.imageUrl ? (
                            <Image source={{ uri: alt.imageUrl }} style={styles.altImage} contentFit="cover" transition={200} />
                          ) : (
                            <View style={[styles.altImagePlaceholder, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)" }]}>
                              <MaterialIcons name="image" size={24} color={colors.textMuted} />
                            </View>
                          )}
                          <Text style={[styles.altName, { color: colors.textPrimary }]} numberOfLines={2}>
                            {alt.name}
                          </Text>
                          <StatusPill status={(alt.halalStatus ?? "halal") as "halal" | "haram" | "doubtful" | "unknown"} size="sm" animated={false} />
                          {marketplaceEnabled && (
                            <View style={[styles.altBuyBadge, { backgroundColor: isDark ? `${brandTokens.primary}1A` : `${brandTokens.primary}14` }]}>
                              <MaterialIcons name="shopping-cart" size={11} color={brandTokens.primary} />
                              <Text style={styles.altBuyText}>{t.scanResult.buyAlternative}</Text>
                            </View>
                          )}
                        </View>
                      </GlowCard>
                    </PressableScale>
                ))}
              </ScrollView>
              {/* ── "Explore marketplace" CTA — shop halal alternatives by category ── */}
              <PressableScale
                onPress={() => {
                  impact();
                  if (marketplaceEnabled) {
                    router.navigate({
                      pathname: "/(marketplace)/catalog",
                      params: {
                        ...(product?.category ? { search: product.category } : {}),
                      },
                    } as any);
                  } else {
                    router.navigate("/(marketplace)/" as any);
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel={t.scanResult.shopHalalAlternatives}
                style={[
                  styles.altExploreCta,
                  {
                    backgroundColor: isDark ? `${brandTokens.gold}0F` : `${brandTokens.gold}0A`,
                    borderColor: isDark ? `${brandTokens.gold}33` : `${brandTokens.gold}26`,
                  },
                ]}
              >
                <MaterialIcons name="storefront" size={18} color={brandTokens.gold} />
                <Text style={styles.altExploreCtaText}>
                  {marketplaceEnabled ? t.scanResult.shopHalalAlternatives : t.scanResult.shopOnMarketplace}
                </Text>
                <MaterialIcons name="arrow-forward" size={16} color={brandTokens.gold} />
              </PressableScale>
            </Animated.View>
          )}

          {/* ── Boycott Alert (highest priority after verdict) ── */}
          {boycott?.isBoycotted && (
            <Animated.View entering={entryAnimations.fadeInDown(2)}>
              <GlowCard
                glowColor={halalStatusTokens.haram.base}
                glowIntensity="medium"
                style={styles.boycottCard}
              >
                <View style={styles.boycottHeader}>
                  <View
                    style={[
                      styles.boycottIconCircle,
                      {
                        backgroundColor: isDark
                          ? halalStatusTokens.haram.bgDark
                          : halalStatusTokens.haram.bg,
                      },
                    ]}
                  >
                    <MaterialIcons name="block" size={20} color={halalStatusTokens.haram.base} />
                  </View>
                  <Text
                    style={[
                      styles.boycottTitle,
                      { color: isDark ? "#fca5a5" : lightTheme.statusMauvais },
                    ]}
                  >
                    {t.scanResult.boycottActive}
                  </Text>
                </View>
                {boycott.targets.map((target: any, idx: number) => (
                  <View
                    key={target.id ?? idx}
                    style={[
                      styles.boycottTarget,
                      idx > 0 && {
                        borderTopWidth: StyleSheet.hairlineWidth,
                        borderTopColor: isDark
                          ? halalStatusTokens.haram.bgDark
                          : halalStatusTokens.haram.bg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.boycottCompany,
                        { color: isDark ? "#fca5a5" : lightTheme.statusMauvais },
                      ]}
                    >
                      {target.companyName}
                      {target.boycottLevel === "official_bds"
                        ? ` ${t.scanResult.bdsOfficial}`
                        : ""}
                    </Text>
                    <Text
                      style={[
                        styles.boycottReason,
                        { color: isDark ? "#fca5a5cc" : `${lightTheme.statusMauvais}cc` },
                      ]}
                    >
                      {target.reasonSummary ?? target.companyName}
                    </Text>
                    {target.sourceUrl && (
                      <Text
                        style={[
                          styles.boycottSource,
                          { color: `${halalStatusTokens.haram.base}aa` },
                        ]}
                      >
                        {t.scanResult.source}: {target.sourceName ?? "BDS"}
                      </Text>
                    )}
                  </View>
                ))}
              </GlowCard>
            </Animated.View>
          )}

          {/* ── Personal Alerts ── */}
          {personalAlerts.length > 0 && (
            <PersonalAlerts alerts={personalAlerts} />
          )}

          {/* ── Analysis Source (compact line) ── */}
          {halalAnalysis?.analysisSource && (
            <Animated.View
              entering={entryAnimations.fadeInDown(3)}
              style={styles.analysisSourceRow}
            >
              <MaterialIcons name="info-outline" size={13} color={colors.textMuted} />
              <Text style={[styles.analysisSourceText, { color: colors.textMuted }]}>
                {t.scanResult.source}: {halalAnalysis.analysisSource}
              </Text>
            </Animated.View>
          )}

          {/* ── Product Details (Labels, Origins, Analysis Tags) ── */}
          {offExtras && (
            (() => {
              const labelChips = (offExtras.labelsTags ?? [])
                .map((tag: string) => tag.replace(/^en:/, "").replace(/-/g, " "))
                .filter((l: string) => l.length > 1)
                .slice(0, 8);
              const analysisTags = (offExtras.ingredientsAnalysisTags ?? [])
                .map((tag: string) => tag.replace(/^en:/, "").replace(/-/g, " "))
                .filter((l: string) => l.length > 1);
              const hasContent = labelChips.length > 0 || offExtras.manufacturingPlaces || offExtras.origins || analysisTags.length > 0;
              if (!hasContent) return null;
              return (
                <Animated.View entering={entryAnimations.fadeInDown(3)} style={styles.productDetailsSection}>
                  {/* P1: Quality labels */}
                  {labelChips.length > 0 && (
                    <View style={styles.productDetailRow}>
                      <MaterialIcons name="label" size={14} color={colors.textMuted} />
                      <View style={styles.productDetailChips}>
                        {labelChips.map((label: string, i: number) => (
                          <View
                            key={i}
                            style={[
                              styles.productDetailChip,
                              {
                                backgroundColor: isDark ? glass.dark.bg : glass.light.border,
                                borderColor: isDark ? glass.dark.borderStrong : glass.light.borderStrong,
                              },
                            ]}
                          >
                            <Text style={[styles.productDetailChipText, { color: colors.textSecondary }]} numberOfLines={1}>
                              {label}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* P2: Manufacturing + Origins */}
                  {offExtras.manufacturingPlaces && (
                    <View style={styles.productDetailRow}>
                      <MaterialIcons name="factory" size={14} color={colors.textMuted} />
                      <Text style={[styles.productDetailText, { color: colors.textSecondary }]}>
                        {t.scanResult.madeIn} {offExtras.manufacturingPlaces}
                      </Text>
                    </View>
                  )}
                  {offExtras.origins && (
                    <View style={styles.productDetailRow}>
                      <MaterialIcons name="public" size={14} color={colors.textMuted} />
                      <Text style={[styles.productDetailText, { color: colors.textSecondary }]}>
                        {t.scanResult.originFrom}: {offExtras.origins}
                      </Text>
                    </View>
                  )}

                  {/* P3: Ingredient analysis tags (vegan, palm oil free, etc.) */}
                  {analysisTags.length > 0 && (
                    <View style={styles.productDetailRow}>
                      <MaterialIcons name="eco" size={14} color={colors.textMuted} />
                      <View style={styles.productDetailChips}>
                        {analysisTags.map((tag: string, i: number) => (
                          <View
                            key={i}
                            style={[
                              styles.productDetailChip,
                              {
                                backgroundColor: isDark ? `${halalStatusTokens.halal.base}15` : `${halalStatusTokens.halal.base}0D`,
                                borderColor: isDark ? `${halalStatusTokens.halal.base}30` : `${halalStatusTokens.halal.base}20`,
                              },
                            ]}
                          >
                            <Text style={[styles.productDetailChipText, { color: halalStatusTokens.halal.base }]} numberOfLines={1}>
                              {tag}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </Animated.View>
              );
            })()
          )}

          {/* ── Why This Status ── */}
          {halalAnalysis &&
            (haramReasons.length > 0 || doubtfulReasons.length > 0) && (
              <Animated.View entering={entryAnimations.fadeInDown(4)}>
                <CollapsibleSection
                  title={t.scanResult.whyThisStatus}
                  defaultOpen={true}
                >
                  {haramReasons.map((reason, idx) => (
                    <View
                      key={`haram-${idx}`}
                      style={[
                        styles.reasonRow,
                        idx > 0 && {
                          borderTopWidth: StyleSheet.hairlineWidth,
                          borderTopColor: isDark
                            ? glass.dark.bg
                            : glass.light.border,
                        },
                      ]}
                    >
                      <MaterialIcons
                        name="dangerous"
                        size={18}
                        color={halalStatusTokens.haram.base}
                        style={{ marginTop: 1 }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.reasonName,
                            { color: isDark ? "#fca5a5" : halalStatusTokens.haram.base },
                          ]}
                        >
                          {reason.name}
                        </Text>
                        <Text
                          style={[
                            styles.reasonExplanation,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {reason.explanation}
                        </Text>
                        {reason.scholarlyReference && (
                          <View style={ingredientStyles.refRow}>
                            <MaterialIcons name="menu-book" size={11} color={colors.textMuted} />
                            <Text style={[ingredientStyles.refText, { color: colors.textMuted }]} numberOfLines={1}>
                              {reason.scholarlyReference}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                  {doubtfulReasons.map((reason, idx) => (
                    <View
                      key={`doubtful-${idx}`}
                      style={[
                        styles.reasonRow,
                        (haramReasons.length > 0 || idx > 0) && {
                          borderTopWidth: StyleSheet.hairlineWidth,
                          borderTopColor: isDark
                            ? glass.dark.bg
                            : glass.light.border,
                        },
                      ]}
                    >
                      <MaterialIcons
                        name="help"
                        size={18}
                        color={halalStatusTokens.doubtful.base}
                        style={{ marginTop: 1 }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.reasonName,
                            { color: isDark ? "#fdba74" : halalStatusTokens.doubtful.base },
                          ]}
                        >
                          {reason.name}
                        </Text>
                        <Text
                          style={[
                            styles.reasonExplanation,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {reason.explanation}
                        </Text>
                        {reason.scholarlyReference && (
                          <View style={ingredientStyles.refRow}>
                            <MaterialIcons name="menu-book" size={11} color={colors.textMuted} />
                            <Text style={[ingredientStyles.refText, { color: colors.textMuted }]} numberOfLines={1}>
                              {reason.scholarlyReference}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </CollapsibleSection>
              </Animated.View>
            )}

          {/* ── Additives ── */}
          {additiveReasons.length > 0 && (
            <Animated.View entering={entryAnimations.fadeInDown(5)}>
              <CollapsibleSection
                title={t.scanResult.additivesDetected}
                badge={`${additiveReasons.length} ${t.scanResult.additive}${additiveReasons.length > 1 ? "s" : ""}`}
                defaultOpen={false}
              >
                {additiveReasons.map((additive, idx) => (
                  <View
                    key={`add-${idx}`}
                    style={[
                      styles.additiveRow,
                      idx > 0 && {
                        borderTopWidth: StyleSheet.hairlineWidth,
                        borderTopColor: isDark
                          ? "rgba(255,255,255,0.06)"
                          : "rgba(0,0,0,0.06)",
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.additiveDot,
                        {
                          backgroundColor:
                            halalStatusTokens[additive.status as keyof typeof halalStatusTokens]?.base ?? halalStatusTokens.halal.base,
                        },
                      ]}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.additiveName,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {additive.name}
                      </Text>
                      <Text
                        style={[
                          styles.additiveExplanation,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {additive.explanation}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.additiveStatus,
                        {
                          color:
                            halalStatusTokens[additive.status as keyof typeof halalStatusTokens]?.base ?? halalStatusTokens.halal.base,
                        },
                      ]}
                    >
                      {additive.status === "haram"
                        ? t.scanResult.haram
                        : additive.status === "doubtful"
                          ? t.scanResult.doubtful
                          : t.scanResult.halal}
                    </Text>
                  </View>
                ))}
              </CollapsibleSection>
            </Animated.View>
          )}

          {/* ── Sources Savantes ── */}
          {ingredientRulings.length > 0 &&
            ingredientRulings.some((r: any) => r.fatwaSourceName) && (
              <Animated.View entering={entryAnimations.fadeInDown(6)}>
                <CollapsibleSection
                  title={t.scanResult.scholarlyReferences}
                  badge={`${new Set(ingredientRulings.filter((r: any) => r.fatwaSourceName).map((r: any) => r.fatwaSourceName)).size} ${t.scanResult.sourceLabel}`}
                  defaultOpen={false}
                >
                  {[...new Map(
                    ingredientRulings
                      .filter((r: any) => r.fatwaSourceName)
                      .map((r: any) => [r.fatwaSourceName, r] as const)
                  ).values()].map((ruling: any, idx: number) => (
                    <View
                      key={`ref-${idx}`}
                      style={[
                        styles.reasonRow,
                        idx > 0 && {
                          borderTopWidth: StyleSheet.hairlineWidth,
                          borderTopColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                        },
                      ]}
                    >
                      <MaterialIcons name="menu-book" size={16} color={brandTokens.gold} style={{ marginTop: 1 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.reasonName, { color: colors.textPrimary }]}>
                          {ruling.fatwaSourceName}
                        </Text>
                        {ruling.scholarlyReference && (
                          <Text style={[styles.reasonExplanation, { color: colors.textSecondary }]} numberOfLines={3}>
                            {ruling.scholarlyReference}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </CollapsibleSection>
              </Animated.View>
            )}

          {/* ── Nutrition & Impact ── */}
          {offExtras &&
            (offExtras.nutriscoreGrade || offExtras.novaGroup || offExtras.ecoscoreGrade) && (
              <Animated.View entering={entryAnimations.fadeInDown(7)}>
                <CollapsibleSection
                  title={t.scanResult.nutritionEnvironment}
                  badge={[
                    offExtras.nutriscoreGrade && `Nutri ${offExtras.nutriscoreGrade.toUpperCase()}`,
                    offExtras.novaGroup && `NOVA ${offExtras.novaGroup}`,
                    offExtras.ecoscoreGrade && `Eco ${offExtras.ecoscoreGrade.toUpperCase()}`,
                  ].filter(Boolean).join(" · ")}
                  defaultOpen={false}
                >
                  {offExtras.nutriscoreGrade && (
                    <NutritionCard
                      label="Nutri-Score"
                      value={offExtras.nutriscoreGrade}
                      color={NUTRISCORE_COLORS[offExtras.nutriscoreGrade] ?? "#94a3b8"}
                      description={t.scanResult.nutriScoreDesc}
                    />
                  )}
                  {offExtras.novaGroup && (
                    <NutritionCard
                      label="NOVA"
                      value={offExtras.novaGroup}
                      color={NOVA_COLORS[offExtras.novaGroup] ?? "#94a3b8"}
                      description={t.scanResult.novaGroupDesc}
                    />
                  )}
                  {offExtras.ecoscoreGrade && (
                    <NutritionCard
                      label="Eco-Score"
                      value={offExtras.ecoscoreGrade}
                      color={NUTRISCORE_COLORS[offExtras.ecoscoreGrade] ?? "#94a3b8"}
                      description={t.scanResult.ecoScoreDesc}
                    />
                  )}
                </CollapsibleSection>
              </Animated.View>
            )}

          {/* ── Allergens ── */}
          {allergensTags.length > 0 && (
            <Animated.View entering={entryAnimations.fadeInDown(8)}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.textPrimary },
                ]}
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
                  const label = tag
                    .replace(/^(en|fr):/, "")
                    .replace(/-/g, " ");
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

          {/* ── Ingredients (Collapsible) ── */}
          {ingredients.length > 0 && (
            <Animated.View entering={entryAnimations.fadeInDown(9)}>
              <CollapsibleSection
                title={t.scanResult.composition}
                badge={`${ingredients.length} ${t.scanResult.ingredients}`}
                defaultOpen={false}
              >
                {ingredients.map((ingredient, index) => {
                  const lower = ingredient.toLowerCase();
                  // Direct match on ingredient name
                  let problemInfo = problematicIngredients.get(lower);
                  // Fallback: check if any ruling pattern matches inside this ingredient
                  if (!problemInfo) {
                    for (const [pattern, info] of problematicIngredients.entries()) {
                      if (lower.includes(pattern) || pattern.includes(lower)) {
                        problemInfo = info;
                        break;
                      }
                    }
                  }
                  return (
                    <IngredientRow
                      key={index}
                      name={ingredient}
                      isLast={index === ingredients.length - 1}
                      isProblematic={!!problemInfo}
                      problemColor={problemInfo?.color}
                      explanation={problemInfo?.explanation}
                      problemStatus={problemInfo?.status}
                      scholarlyReference={problemInfo?.scholarlyReference}
                      fatwaSourceName={problemInfo?.fatwaSourceName}
                      fatwaSourceUrl={problemInfo?.fatwaSourceUrl}
                    />
                  );
                })}
              </CollapsibleSection>
            </Animated.View>
          )}


          {/* ── Votre Avis Compte (community trust) ── */}
          {product && (
            <Animated.View entering={entryAnimations.fadeInDown(10)}>
              <GlowCard
                glowColor={brandTokens.gold}
                glowIntensity="subtle"
                style={styles.voteCard}
              >
                <View
                  style={[styles.voteShieldIcon, { backgroundColor: isDark ? glass.dark.border : glass.dark.highlight }]}
                >
                  <MaterialIcons name="verified-user" size={18} color={brandTokens.gold} />
                </View>
                <Text style={[styles.voteTitle, { color: colors.textPrimary }]}>
                  {t.scanResult.yourOpinionMatters}
                </Text>
                <Text style={[styles.voteSubtitle, { color: colors.textSecondary }]}>
                  {t.scanResult.isThisResultAccurate}
                </Text>
                <View style={styles.voteButtonRow}>
                  <PressableScale
                    onPress={() => {
                      impact();
                      const newVote = userVote === "up" ? null : "up";
                      setUserVote(newVote);
                      if (newVote && product?.id) {
                        reviewMutation.mutate({ productId: product.id, rating: 5 });
                      }
                    }}
                    style={[
                      styles.voteButton,
                      {
                        backgroundColor: userVote === "up"
                          ? (isDark ? halalStatusTokens.halal.bgDark : halalStatusTokens.halal.bg)
                          : (isDark ? glass.dark.bg : glass.light.border),
                        borderWidth: userVote === "up" ? 2 : 1,
                        borderColor: userVote === "up" ? colors.primary : isDark ? glass.dark.borderStrong : glass.light.borderStrong,
                        ...(userVote === "up" ? {
                          shadowColor: colors.primary,
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: 0.3,
                          shadowRadius: 10,
                          elevation: 4,
                        } : {}),
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={t.scanResult.accurateResult}
                  >
                    <MaterialIcons name="thumb-up" size={24} color={userVote === "up" ? colors.primary : colors.textSecondary} />
                  </PressableScale>
                  <PressableScale
                    onPress={() => {
                      impact();
                      const newVote = userVote === "down" ? null : "down";
                      setUserVote(newVote);
                      if (newVote && product?.id) {
                        reviewMutation.mutate({ productId: product.id, rating: 1 });
                      }
                    }}
                    style={[
                      styles.voteButton,
                      {
                        backgroundColor: userVote === "down"
                          ? (isDark ? halalStatusTokens.haram.bgDark : halalStatusTokens.haram.bg)
                          : (isDark ? glass.dark.bg : glass.light.border),
                        borderWidth: userVote === "down" ? 2 : 1,
                        borderColor: userVote === "down" ? halalStatusTokens.haram.base : isDark ? glass.dark.borderStrong : glass.light.borderStrong,
                        ...(userVote === "down" ? {
                          shadowColor: halalStatusTokens.haram.base,
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: 0.3,
                          shadowRadius: 10,
                          elevation: 4,
                        } : {}),
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={t.scanResult.inaccurateResult}
                  >
                    <MaterialIcons name="thumb-down" size={24} color={userVote === "down" ? halalStatusTokens.haram.base : colors.textSecondary} />
                  </PressableScale>
                </View>
                {userVote && (
                  <Animated.View entering={FadeIn.duration(300)}>
                    <Text style={styles.voteThanks}>
                      {t.scanResult.thankYouForFeedback}
                    </Text>
                  </Animated.View>
                )}
              </GlowCard>
            </Animated.View>
          )}

          {/* ── New Product Banner ── */}
          {scanMutation.data?.isNewProduct && (
            <Animated.View entering={entryAnimations.fadeInDown(11)}>
              <View
                style={[
                  styles.newProductBanner,
                  {
                    backgroundColor: isDark
                      ? glass.dark.highlight
                      : glass.dark.highlight,
                    borderColor: isDark
                      ? glass.dark.border
                      : `${brandTokens.gold}26`,
                  },
                ]}
              >
                <MaterialIcons
                  name="new-releases"
                  size={20}
                  color={brandTokens.gold}
                  style={{ marginTop: 2 }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.newProductTitle, { color: isDark ? brandTokens.gold : colors.textSecondary }]}
                  >
                    {t.scanResult.newProductAdded}
                  </Text>
                  <Text
                    style={[styles.newProductDesc, { color: isDark ? colors.textSecondary : colors.textMuted }]}
                  >
                    {t.scanResult.newProductAddedDesc}
                  </Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* ── Legal Disclaimer (Ch09 Al-Qadar — mandatory) ──
               "Servir, pas juger" (Ch00 Principe 5).
               This is NOT optional — docs/naqiy/internal/09-al-qadar §2.2:
               "Le disclaimer legal doit apparaitre en bas de chaque ecran de scan result" */}
          <View style={styles.disclaimerRow}>
            <MaterialIcons
              name="info-outline"
              size={14}
              color={colors.textMuted}
              style={{ marginTop: 1 }}
            />
            <Text style={[styles.disclaimerText, { color: colors.textMuted }]}>
              {t.scanResult.disclaimer}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ════════════════════════════════════════════════════
          FIXED BOTTOM ACTION BAR — glass-morphism
          ════════════════════════════════════════════════════ */}
      <Animated.View
        entering={SlideInUp.delay(500).duration(400)}
        style={[
          styles.actionBarOuter,
          {
            paddingBottom: insets.bottom + 12,
          },
        ]}
      >
        {/* Glassmorphism bar — BlurView is iOS-only; Android gets opaque fallback */}
        {Platform.OS === "ios" ? (
          <BlurView
            intensity={isDark ? 40 : 60}
            tint={isDark ? "dark" : "light"}
            style={styles.actionBarBlur}
          >
            {actionBarButtons}
          </BlurView>
        ) : (
          <View
            style={[
              styles.actionBarBlur,
              {
                backgroundColor: isDark
                  ? "rgba(10, 20, 14, 0.97)"
                  : "rgba(255, 255, 255, 0.97)",
              },
            ]}
          >
            {actionBarButtons}
          </View>
        )}
      </Animated.View>

      {/* ── Level-Up Celebration Overlay ── */}
      {showLevelUp && levelUp && (
        <LevelUpCelebration
          newLevel={levelUp.newLevel}
          title={t.scanResult.levelUp}
          subtitle={t.scanResult.reachedLevel.replace("{{level}}", String(levelUp.newLevel))}
          onDismiss={handleDismissLevelUp}
        />
      )}

      {/* ── Trust Score Bottom Sheet ── */}
      <TrustScoreBottomSheet
        visible={showTrustScoreSheet}
        certifierName={certifierData?.name ?? null}
        trustScore={certifierTrustScore}
        madhab={userMadhab !== "general" ? userMadhab : null}
        onClose={handleCloseTrustScore}
      />

      {/* ── Score Detail Bottom Sheet (per-theme breakdown) ── */}
      <ScoreDetailBottomSheet
        visible={showScoreDetailSheet}
        certifierId={certifierData?.id ?? null}
        certifierName={certifierData?.name ?? null}
        trustScore={certifierTrustScore}
        practices={certifierData?.practices ?? null}
        onClose={handleCloseScoreDetail}
      />

      {/* ── Madhab Bottom Sheet ── */}
      <MadhabBottomSheet
        visible={!!selectedMadhab}
        madhab={selectedMadhab?.madhab ?? ""}
        madhabLabel={
          selectedMadhab
            ? (MADHAB_LABEL_KEY[selectedMadhab.madhab as keyof typeof MADHAB_LABEL_KEY]
                ? t.scanResult[MADHAB_LABEL_KEY[selectedMadhab.madhab as keyof typeof MADHAB_LABEL_KEY]]
                : selectedMadhab.madhab)
            : ""
        }
        status={selectedMadhab?.status ?? "halal"}
        conflictingAdditives={selectedMadhab?.conflictingAdditives ?? []}
        conflictingIngredients={selectedMadhab?.conflictingIngredients ?? []}
        certifierName={certifierData_?.name ?? null}
        certifierTrustScore={
          selectedMadhab && certifierData_
            ? ((certifierData_ as Record<string, unknown>)[MADHAB_TRUST_KEY[selectedMadhab.madhab as keyof typeof MADHAB_TRUST_KEY]] as number | null) ?? null
            : null
        }
        certifierTrustScoreUniversal={certifierData_?.trustScore ?? null}
        onClose={handleCloseMadhab}
      />

      {/* ── Off-screen Share Card (captured as image) ── */}
      {shareData && (
        <View style={styles.offScreen} pointerEvents="none">
          <ShareCardView ref={shareCardRef} data={shareData} labels={shareLabels} />
        </View>
      )}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  // ── Hero container ─────────────────────────────
  heroGradient: {
    paddingHorizontal: spacing["3xl"],
    paddingBottom: spacing["3xl"],
    overflow: "hidden",
  },

  // ── Floating back button ───────────────────────
  floatingBackButton: {
    position: "absolute",
    left: spacing.xl,
    zIndex: 50,
  },
  floatingInfoButton: {
    position: "absolute",
    right: spacing.xl,
    zIndex: 50,
  },

  // ── Hero horizontal split ─────────────────────
  heroSplit: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: spacing.xl,
  },

  // ── Hero: Left column (product image + brand) ─
  heroImageColumn: {
    alignItems: "center" as const,
    gap: spacing.xs,
  },
  heroImageWrapper: {
    width: 80,
    height: 80,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  heroImage: {
    width: 80,
    height: 80,
    borderRadius: radius.lg,
  },
  heroBrandLabel: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.medium,
    marginTop: spacing["2xs"],
    textAlign: "center" as const,
    maxWidth: 80,
  },

  // ── Hero: Right column (score + verdict + product info) ─
  heroInfoColumn: {
    flex: 1,
    paddingVertical: spacing.xs,
  },
  heroScoreLabelRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  heroScoreLabelText: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.semiBold,
    letterSpacing: 1.5,
    textTransform: "uppercase" as const,
  },

  // ── Hero: Score row + certifier bar ─────────────
  heroScoreRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  heroCertifierRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: spacing.lg,
  },
  heroCertifierBar: {
    flex: 1,
    gap: spacing.sm,
  },
  heroCertifierHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: spacing.sm,
  },
  heroCertifierName: {
    flex: 1,
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.semiBold,
  },
  heroCertifierScore: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.bold,
  },
  heroCertifierBarBg: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden" as const,
  },
  heroCertifierBarFill: {
    height: 4,
    borderRadius: 2,
  },
  heroTierLabel: {
    fontSize: 9,
    fontWeight: fontWeightTokens.medium,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  heroHelpButton: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  heroVerdictColumn: {
    flex: 1,
    gap: spacing["2xs"],
  },
  heroVerdictText: {
    fontSize: fontSizeTokens.h4,
    fontWeight: fontWeightTokens.bold,
    letterSpacing: 0.3,
  },

  // ── Hero: Divider ─────────────────────────────
  heroDivider: {
    height: StyleSheet.hairlineWidth,
    width: "100%" as const,
    marginVertical: spacing.md,
    opacity: 0.2,
  },

  // ── Hero: Product info in right column ────────
  heroProductRow: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    justifyContent: "space-between" as const,
    gap: spacing.lg,
  },
  heroProductName: {
    fontSize: fontSizeTokens.h4,
    fontWeight: fontWeightTokens.bold,
    lineHeight: 24,
    flex: 1,
  },
  heroBarcodeChip: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: spacing.xs,
    paddingTop: spacing["2xs"],
  },
  heroBarcode: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.medium,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },

  // ── Metadata band (certifier + confidence) ────
  metadataBand: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "flex-start" as const,
    flexWrap: "wrap" as const,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },

  // ── Community badge ──────────────────────────────
  communityBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  communityBadgeText: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.semiBold,
  },

  // ── Certifier hero badge ────────────────────────
  certifierHeroBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  certifierHeroBadgeText: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.semiBold,
  },

  // ── Madhab chips row ────────────────────────────
  madhabRow: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    justifyContent: "center" as const,
    flexWrap: "wrap" as const,
    gap: spacing.xl,
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  madhabInfoNote: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    width: "100%" as const,
  },
  madhabInfoNoteText: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.medium,
    lineHeight: 14,
    flex: 1,
  },

  // ── Hadith premium card ──────────────────────
  hadithCard: {
    width: "100%" as const,
    marginTop: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden" as const,
  },
  hadithAccentLine: {
    width: "40%" as const,
    height: 1,
    alignSelf: "center" as const,
    marginBottom: spacing.sm,
  },
  hadithText: {
    fontSize: 11,
    fontWeight: fontWeightTokens.medium,
    lineHeight: 18,
    fontStyle: "italic" as const,
    textAlign: "center" as const,
  },
  hadithSource: {
    fontSize: 9,
    fontWeight: fontWeightTokens.semiBold,
    textAlign: "center" as const,
    marginTop: spacing.xs,
    letterSpacing: 0.4,
  },

  // ── Content ────────────────────────────────────
  contentContainer: {
    paddingHorizontal: spacing["3xl"],
    paddingTop: spacing["3xl"],
  },

  // ── Section title ──────────────────────────────
  sectionTitle: {
    fontSize: fontSizeTokens.h4,
    fontWeight: fontWeightTokens.bold,
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },

  // ── Analysis source (compact line) ─────────────
  analysisSourceRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: spacing.xs,
    marginBottom: spacing["2xl"],
  },
  analysisSourceText: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.medium,
  },


  // ── Product details (labels, origins, analysis) ─
  productDetailsSection: {
    gap: spacing.md,
    marginBottom: spacing["2xl"],
  },
  productDetailRow: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: spacing.md,
    paddingTop: spacing["2xs"],
  },
  productDetailChips: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: spacing.xs,
    flex: 1,
  },
  productDetailChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  productDetailChipText: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.medium,
    textTransform: "capitalize" as const,
  },
  productDetailText: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.medium,
    flex: 1,
  },

  // ── Boycott card (wrapped in GlowCard) ─────────
  boycottCard: {
    borderLeftWidth: 4,
    borderLeftColor: halalStatusTokens.haram.base,
    marginBottom: spacing["3xl"],
  },
  boycottHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  boycottIconCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  boycottTitle: {
    fontSize: fontSizeTokens.bodySmall,
    fontWeight: fontWeightTokens.black,
  },
  boycottTarget: {
    paddingVertical: spacing.md,
  },
  boycottCompany: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.bold,
  },
  boycottReason: {
    fontSize: fontSizeTokens.caption,
    marginTop: spacing["2xs"],
    lineHeight: 17,
  },
  boycottSource: {
    fontSize: fontSizeTokens.micro,
    marginTop: spacing.xs,
  },

  // ── Collapsible ────────────────────────────────
  collapsibleContainer: {
    borderRadius: radius.xl,
    borderWidth: 1,
    marginBottom: spacing["3xl"],
    overflow: "hidden",
  },
  collapsibleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing["2xl"],
    paddingVertical: spacing.xl,
  },
  collapsibleHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  collapsibleTitle: {
    fontSize: fontSizeTokens.bodySmall,
    fontWeight: fontWeightTokens.bold,
  },
  collapsibleBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  collapsibleBadgeText: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.semiBold,
  },
  collapsibleContent: {
    paddingHorizontal: spacing["2xl"],
    paddingBottom: spacing["2xl"],
  },

  // ── Reason rows ────────────────────────────────
  reasonRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.lg,
    paddingVertical: spacing.lg,
  },
  reasonName: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.bold,
  },
  reasonExplanation: {
    fontSize: fontSizeTokens.caption,
    marginTop: spacing["2xs"],
    lineHeight: 17,
  },

  // ── Additive rows ──────────────────────────────
  additiveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    paddingVertical: spacing.lg,
  },
  additiveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  additiveName: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.semiBold,
  },
  additiveExplanation: {
    fontSize: fontSizeTokens.micro,
    marginTop: 1,
  },
  additiveStatus: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.black,
    textTransform: "uppercase",
  },

  // ── Allergens ──────────────────────────────────
  allergensRow: {
    flexDirection: "row" as const,
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

  // ── Ingredient row ─────────────────────────────
  ingredientRow: {
    paddingVertical: spacing.lg,
  },
  ingredientDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  ingredientName: {
    fontSize: fontSizeTokens.caption,
    flex: 1,
  },

  // ── New product banner ─────────────────────────
  newProductBanner: {
    flexDirection: "row",
    gap: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },

  // ── Loading state ──────────────────────────────
  loadingContent: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    gap: spacing.xl,
  },
  loadingTitle: {
    fontSize: fontSizeTokens.h4,
    fontWeight: fontWeightTokens.bold,
    letterSpacing: 0.5,
  },
  loadingBarcode: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },

  // ── Error / Not Found states ───────────────────
  stateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing["4xl"],
  },
  stateContent: {
    alignItems: "center",
    gap: spacing.xl,
  },
  stateIconCircle: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  stateTitle: {
    fontSize: fontSizeTokens.h4,
    fontWeight: fontWeightTokens.black,
    textAlign: "center",
  },
  stateDesc: {
    ...textStyles.bodySmall,
    textAlign: "center" as const,
  },
  stateButtons: {
    flexDirection: "row",
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  stateButton: {
    paddingHorizontal: spacing["3xl"],
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
  },
  stateButtonText: {
    fontSize: fontSizeTokens.bodySmall,
    fontWeight: fontWeightTokens.bold,
  },

  // ── Bottom action bar ──────────────────────────
  actionBarOuter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  actionBarBlur: {
    overflow: "hidden",
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  actionBarInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xl,
    paddingHorizontal: spacing["2xl"],
    paddingVertical: spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionButton: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaButton: {
    flex: 1,
    height: 50,
    borderRadius: radius.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    overflow: "hidden",
  },
  ctaText: {
    fontSize: fontSizeTokens.bodySmall,
    fontWeight: fontWeightTokens.black,
  },
  // ── Vote card (wrapped in GlowCard) ────────
  voteCard: {
    marginBottom: spacing["3xl"],
    alignItems: "center" as const,
    gap: spacing.lg,
  },
  voteShieldIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: spacing["2xs"],
  },
  voteTitle: {
    fontSize: fontSizeTokens.bodySmall,
    fontWeight: fontWeightTokens.black,
    letterSpacing: 0.3,
  },
  voteSubtitle: {
    fontSize: fontSizeTokens.caption,
    textAlign: "center" as const,
    lineHeight: 18,
    paddingHorizontal: spacing.lg,
  },
  voteButtonRow: {
    flexDirection: "row" as const,
    gap: spacing.xl,
    marginTop: spacing.sm,
  },
  voteButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderWidth: 1,
  },
  voteThanks: {
    fontSize: fontSizeTokens.caption,
    color: brandTokens.gold,
    fontWeight: fontWeightTokens.bold,
    marginTop: spacing["2xs"],
  },

  // ── Alternatives section ───────────────────────
  altSection: {
    marginBottom: spacing["2xl"],
  },
  altHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    marginBottom: spacing.lg,
  },
  altHeaderLeft: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: spacing.md,
  },
  altHeaderIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  altHeaderTitle: {
    fontSize: fontSizeTokens.body,
    fontWeight: fontWeightTokens.black,
  },

  // ── Alternatives cards ────────────────────────
  altCard: {
    width: 150,
    padding: spacing.lg,
    justifyContent: "space-between" as const,
    overflow: "hidden" as const,
  },
  altLockOverlay: {
    zIndex: 10,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderRadius: radius.lg,
  },
  altLockText: {
    color: brandTokens.gold,
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.black,
    marginTop: spacing.xs,
    textAlign: "center" as const,
    letterSpacing: 1,
  },
  altImage: {
    width: 70,
    height: 70,
    borderRadius: radius.md,
    alignSelf: "center" as const,
    marginBottom: spacing.md,
  },
  altImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: radius.md,
    alignSelf: "center" as const,
    marginBottom: spacing.md,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  altName: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.bold,
    marginBottom: spacing.xs,
  },
  altBuyBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: spacing.sm,
    alignSelf: "flex-start" as const,
  },
  altBuyText: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.bold,
    color: brandTokens.primary,
  },
  altExploreCta: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: spacing.md,
    marginTop: spacing.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing["2xl"],
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  altExploreCtaText: {
    fontSize: fontSizeTokens.bodySmall,
    fontWeight: fontWeightTokens.bold,
    color: brandTokens.gold,
  },

  // ── New product banner ─────────────────────────
  newProductTitle: {
    fontSize: fontSizeTokens.bodySmall,
    fontWeight: fontWeightTokens.bold,
  },
  newProductDesc: {
    fontSize: fontSizeTokens.caption,
    marginTop: spacing["2xs"],
    lineHeight: 18,
  },

  // ── Disclaimer ─────────────────────────────────
  disclaimerRow: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  disclaimerText: {
    flex: 1,
    fontSize: fontSizeTokens.micro,
    lineHeight: 16,
    opacity: 0.5,
    fontStyle: "italic" as const,
  },

  offScreen: {
    position: "absolute",
    left: -9999,
    top: 0,
    opacity: 1,
  },
});
