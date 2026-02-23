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
} from "react-native";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { ImpactFeedbackStyle, NotificationFeedbackType } from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  cancelAnimation,
  Easing,
  useReducedMotion,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { IconButton, ArabicCalligraphy, StatusPill, LevelUpCelebration, PremiumBackground } from "@/components/ui";
import { PressableScale } from "@/components/ui/PressableScale";
import { PersonalAlerts, type PersonalAlert } from "@/components/scan/PersonalAlerts";
import { MadhabBottomSheet } from "@/components/scan/MadhabBottomSheet";
import { ShareCardView, captureAndShareCard } from "@/components/scan/ShareCard";
import { trpc } from "@/lib/trpc";
import { useScanBarcode } from "@/hooks/useScan";
import { useTranslation, useHaptics, useAddFavorite, useRemoveFavorite, useCreateReview } from "@/hooks";
import { useTheme } from "@/hooks/useTheme";
import { halalStatus as halalStatusTokens, brand as brandTokens } from "@/theme/colors";
import { GlowCard } from "@/components/ui/GlowCard";
import { usePremium } from "@/hooks/usePremium";
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

// ── Pulsing Glow Ring (behind status icon) ──────────────────

const PulsingGlow = React.memo(function PulsingGlow({
  color,
  size,
}: {
  color: string;
  size: number;
}) {
  const reducedMotion = useReducedMotion();
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.4);

  useEffect(() => {
    if (!reducedMotion) {
      pulseScale.value = withRepeat(
        withTiming(1.35, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      pulseOpacity.value = withRepeat(
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
    return () => {
      cancelAnimation(pulseScale);
      cancelAnimation(pulseOpacity);
    };
  }, [reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 3,
          borderColor: color,
        },
        animatedStyle,
      ]}
    />
  );
});

// ── Suspense Reveal Ring (brief anticipation before verdict) ─

const SUSPENSE_DURATION = 350;

const SuspenseRevealRing = React.memo(function SuspenseRevealRing({
  color,
}: {
  color: string;
}) {
  const reducedMotion = useReducedMotion();
  const ringScale = useSharedValue(0.6);
  const ringOpacity = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) return;
    // Pulse twice then dissolve
    ringScale.value = withSequence(
      withTiming(1.1, { duration: 160, easing: Easing.out(Easing.cubic) }),
      withTiming(0.9, { duration: 140, easing: Easing.inOut(Easing.cubic) }),
      withTiming(1.2, { duration: 160, easing: Easing.out(Easing.cubic) }),
    );
    // Fade in, hold, fade out — all chained to avoid race condition
    ringOpacity.value = withSequence(
      withTiming(0.7, { duration: 150 }),
      withDelay(SUSPENSE_DURATION - 300, withTiming(0, { duration: 150 })),
    );
  }, [reducedMotion, ringScale, ringOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  if (reducedMotion) return null;

  return (
    <Animated.View
      style={[
        {
          width: 76,
          height: 76,
          borderRadius: 38,
          borderWidth: 3,
          borderColor: color,
          position: "absolute",
          top: 0,
        },
        animatedStyle,
      ]}
    />
  );
});

// ── Status Icon with Glow ───────────────────────────────────

const StatusIcon = React.memo(function StatusIcon({
  config,
}: {
  config: StatusVisualConfig;
}) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(reducedMotion ? 1 : 0.3);
  const iconOpacity = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    if (!reducedMotion) {
      // Dramatic entrance using springOptimus timing after suspense
      scale.value = withDelay(
        SUSPENSE_DURATION,
        withSpring(1, { damping: 14, stiffness: 170, mass: 0.9 })
      );
      iconOpacity.value = withDelay(SUSPENSE_DURATION + 100, withTiming(1, { duration: 350 }));
    }
  }, [reducedMotion]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
  }));

  return (
    <View style={styles.statusIconWrapper}>
      <SuspenseRevealRing color={config.glowColor} />
      <PulsingGlow color={config.glowColor} size={76} />
      <Animated.View
        style={[
          styles.statusIconCircle,
          {
            backgroundColor: `${config.color}18`,
            borderColor: config.color,
            shadowColor: config.glowColor,
          },
          containerStyle,
        ]}
      >
        <Animated.View style={iconStyle}>
          <MaterialIcons name={config.icon} size={32} color={config.color} />
        </Animated.View>
      </Animated.View>
    </View>
  );
});

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
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 4 }}>
      <View
        style={{
          width: 44, height: 44, borderRadius: 22,
          backgroundColor: `${color}15`,
          borderWidth: 2, borderColor: color,
          alignItems: "center", justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "900", color }}>{String(value).toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textPrimary }}>{label}</Text>
        <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{description}</Text>
      </View>
    </View>
  );
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

  const toggle = useCallback(() => {
    impact();
    setIsOpen((prev) => !prev);
  }, [impact]);

  return (
    <View
      style={[
        styles.collapsibleContainer,
        {
          backgroundColor: isDark
            ? "rgba(255,255,255,0.03)"
            : "#ffffff",
          borderColor: isDark
            ? "rgba(212,175,55,0.1)"
            : "rgba(212,175,55,0.08)",
        },
      ]}
    >
      <PressableScale
        onPress={toggle}
        style={styles.collapsibleHeader}
        accessibilityRole="button"
        accessibilityLabel={title}
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
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.05)",
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
        <MaterialIcons
          name={isOpen ? "expand-less" : "expand-more"}
          size={24}
          color={colors.textSecondary}
        />
      </PressableScale>
      {isOpen && <View style={styles.collapsibleContent}>{children}</View>}
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
}: {
  name: string;
  isLast: boolean;
  isProblematic?: boolean;
  problemColor?: string;
  explanation?: string;
  problemStatus?: string;
  scholarlyReference?: string | null;
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
      duration: 250,
      easing: Easing.out(Easing.cubic),
    });
  }, [expanded, isProblematic, explanation, expandHeight]);

  const detailHeight = scholarlyReference ? 96 : 72;
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
      <View style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 10 }}>
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
        <Animated.View style={[{ marginTop: 4, paddingLeft: 18 }, detailStyle]}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <View
              style={{
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 4,
                backgroundColor: (problemColor ?? halalStatusTokens.doubtful.base) + "20",
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: problemColor ?? halalStatusTokens.doubtful.base,
                  textTransform: "uppercase",
                }}
              >
                {statusLabel}
              </Text>
            </View>
          </View>
          <Text
            style={{
              fontSize: 13,
              color: colors.textSecondary,
              lineHeight: 18,
            }}
            numberOfLines={2}
          >
            {explanation}
          </Text>
          {scholarlyReference && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
              <MaterialIcons name="menu-book" size={11} color={colors.textMuted} />
              <Text
                style={{
                  fontSize: 11,
                  fontStyle: "italic",
                  color: colors.textMuted,
                  flex: 1,
                }}
                numberOfLines={1}
              >
                {scholarlyReference}
              </Text>
            </View>
          )}
        </Animated.View>
      )}
    </PressableScale>
  );
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
    <View style={{ flex: 1, backgroundColor: isDark ? "#0a1a10" : "#f6f8f7" }}>
      <LinearGradient
        colors={[...bgColors]}
        style={[styles.heroGradient, { height: HERO_HEIGHT, paddingTop: insets.top }]}
      >
        <View style={styles.loadingContent}>
          {/* Skeleton status circle */}
          <Animated.View
            style={[
              {
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: isDark
                  ? "rgba(19,236,106,0.08)"
                  : "rgba(19,236,106,0.12)",
                borderWidth: 3,
                borderColor: isDark
                  ? "rgba(19,236,106,0.2)"
                  : "rgba(19,236,106,0.25)",
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
                style={{
                  fontSize: 12,
                  fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                  color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)",
                  marginStart: 6,
                }}
              >
                {barcode}
              </Text>
            </View>
          )}

          {/* Skeleton certifier badge placeholder */}
          <Animated.View
            style={[
              {
                width: 160,
                height: 28,
                borderRadius: 14,
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(0,0,0,0.05)",
                marginTop: 16,
              },
              shimmerStyle,
            ]}
          />
        </View>
      </LinearGradient>

      {/* Skeleton cards below hero */}
      <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
        <Animated.View
          style={[
            {
              height: 80,
              borderRadius: 16,
              backgroundColor: isDark
                ? "rgba(255,255,255,0.04)"
                : "rgba(0,0,0,0.04)",
            },
            shimmerStyle,
          ]}
        />
        <Animated.View
          style={[
            {
              height: 60,
              borderRadius: 16,
              marginTop: 12,
              backgroundColor: isDark
                ? "rgba(255,255,255,0.03)"
                : "rgba(0,0,0,0.03)",
            },
            shimmerStyle,
          ]}
        />
      </View>
    </View>
  );
});

// ── Error State ─────────────────────────────────────────────

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
                ? "rgba(239,68,68,0.1)"
                : "rgba(239,68,68,0.08)",
            },
          ]}
        >
          <MaterialIcons
            name="error-outline"
            size={36}
            color={isDark ? "#f87171" : "#ef4444"}
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
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.06)"
                  : "#f1f5f9",
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
            <Text style={[styles.stateButtonText, { color: "#0d1b13" }]}>
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
                ? "rgba(234,179,8,0.1)"
                : "rgba(234,179,8,0.08)",
            },
          ]}
        >
          <MaterialIcons
            name="search-off"
            size={36}
            color={isDark ? "#fbbf24" : "#d97706"}
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
          <Text style={[styles.stateButtonText, { color: "#0d1b13" }]}>
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
  const { barcode } = useLocalSearchParams<{ barcode: string }>();

  // ── tRPC Mutation ──────────────────────────────
  const scanMutation = useScanBarcode();
  const hasFired = useRef(false);
  const shareCardRef = useRef<View>(null);

  useEffect(() => {
    if (barcode && !hasFired.current) {
      hasFired.current = true;
      scanMutation.mutate({ barcode });
    }
  }, [barcode]);

  // ── Derived State ──────────────────────────────
  const product = scanMutation.data?.product ?? null;
  const halalAnalysis = scanMutation.data?.halalAnalysis ?? null;
  const boycott = scanMutation.data?.boycott ?? null;
  const offExtras = scanMutation.data?.offExtras ?? null;
  const communityVerifiedCount = scanMutation.data?.communityVerifiedCount ?? 0;
  const madhabVerdicts = scanMutation.data?.madhabVerdicts ?? [];
  const ingredientRulings = scanMutation.data?.ingredientRulings ?? [];
  const levelUp = scanMutation.data?.levelUp ?? null;

  // ── Social Proof (From Backend) ──────
  const totalScansCount = communityVerifiedCount;

  const halalStatus: HalalStatusKey =
    (product?.halalStatus as HalalStatusKey) ?? "unknown";
  const statusConfig = STATUS_CONFIG[halalStatus] ?? STATUS_CONFIG.unknown;
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

  // ── Halal Alternatives Query ──────────────────
  const { isPremium, showPaywall } = usePremium();
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
    }>();
    for (const r of haramReasons) {
      names.set(r.name.toLowerCase(), {
        color: halalStatusTokens.haram.base,
        explanation: r.explanation,
        status: r.status,
        scholarlyReference: r.scholarlyReference,
        fatwaSourceName: r.fatwaSourceName,
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
  }, [haramReasons, doubtfulReasons]);

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
      halal: t.scanResult.certifiedHalal,
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
  }, [halalStatus, t]);

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
      scanMutation.mutate({ barcode });
    }
  }, [barcode]);

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
          color={isDark ? "#ffffff" : "#0d1b13"}
          accessibilityLabel={t.common.back}
        />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* ════════════════════════════════════════════════════
            HERO SECTION — compact, verdict-first, premium layout
            ════════════════════════════════════════════════════ */}
        <LinearGradient
          colors={[...gradientColors]}
          style={[styles.heroGradient, { paddingTop: insets.top + 48 }]}
          accessibilityRole="summary"
          accessibilityLabel={`${t.scanResult[statusConfig.labelKey]}`}
        >
          {/* ── GROUP 1: Verdict Cluster ── */}
          <Animated.View entering={FadeIn.delay(50).duration(400)} style={styles.verdictCluster}>
            <StatusIcon config={statusConfig} />

            {/* Verdict text — dramatic drop after suspense */}
            <Animated.View
              entering={FadeInDown.delay(SUSPENSE_DURATION + 200).duration(500)}
              style={styles.verdictTextContainer}
            >
              <Text
                style={[styles.verdictText, { color: statusConfig.color }]}
                accessibilityRole="header"
              >
                {t.scanResult[statusConfig.labelKey]}
              </Text>

              {/* Arabic calligraphy — subtle accent below verdict */}
              {halalStatus === "halal" && (
                <View style={{ marginTop: 2 }}>
                  <ArabicCalligraphy text="halalTayyib" color={statusConfig.color} size={16} opacity={0.35} />
                </View>
              )}
            </Animated.View>
          </Animated.View>

          {/* ── GROUP 2: Metadata Band (certifier + madhab) ── */}
          <Animated.View
            entering={FadeIn.delay(SUSPENSE_DURATION + 350).duration(500)}
            style={styles.metadataBand}
          >
            {/* Certifier chip */}
            <View
              style={[
                styles.certifierHeroBadge,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.04)",
                  borderColor: isDark
                    ? "rgba(255,255,255,0.10)"
                    : "rgba(0,0,0,0.06)",
                },
              ]}
            >
              <MaterialIcons
                name={halalAnalysis?.certifierName ? "verified" : "analytics"}
                size={14}
                color={statusConfig.color}
              />
              <Text style={[styles.certifierHeroBadgeText, { color: isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.7)" }]}>
                {halalAnalysis?.certifierName
                  ? `${t.scanResult.certifierBadge} ${halalAnalysis.certifierName}`
                  : t.scanResult.noCertifier}
              </Text>
            </View>

            {/* Confidence Score badge — Al-Ilm: transparency on certainty level */}
            {product?.confidenceScore != null && product.confidenceScore > 0 && (
              <View
                style={[
                  styles.communityBadge,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.04)",
                    borderColor: isDark
                      ? "rgba(255,255,255,0.10)"
                      : "rgba(0,0,0,0.06)",
                  },
                ]}
              >
                <MaterialIcons name="speed" size={12} color={statusConfig.color} />
                <Text style={[styles.communityBadgeText, { color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)" }]}>
                  {`${Math.round(product.confidenceScore * 100)}% ${t.scanResult.confidence}`}
                </Text>
              </View>
            )}

            {/* Community badge — inline with certifier */}
            {communityVerifiedCount >= 1 && (
              <View
                style={[
                  styles.communityBadge,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.04)",
                    borderColor: isDark
                      ? "rgba(255,255,255,0.10)"
                      : "rgba(0,0,0,0.06)",
                  },
                ]}
              >
                <MaterialIcons name="group" size={12} color={statusConfig.color} />
                <Text style={[styles.communityBadgeText, { color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)" }]}>
                  {(communityVerifiedCount === 1
                    ? t.scanResult.verifiedByCount
                    : t.scanResult.verifiedByCountPlural
                  ).replace("{{count}}", String(communityVerifiedCount))}
                </Text>
              </View>
            )}

            {/* Social Proof badge (Scanned X times) — only show when meaningful */}
            {totalScansCount > 0 && (
              <View
                style={[
                  styles.communityBadge,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.04)",
                    borderColor: isDark
                      ? "rgba(212,175,55,0.2)"
                      : "rgba(212,175,55,0.15)",
                  },
                ]}
              >
                <MaterialIcons name="local-fire-department" size={12} color={brandTokens.gold} />
                <Text style={[styles.communityBadgeText, { color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)" }]}>
                  {(t.scanResult as any).scannedByCommunity?.replace(
                    "{{count}}",
                    totalScansCount >= 1000
                      ? `${(totalScansCount / 1000).toFixed(1)}k`
                      : String(totalScansCount)
                  ) ?? `Scanné ${totalScansCount >= 1000 ? `${(totalScansCount / 1000).toFixed(1)}k` : totalScansCount} fois`}
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Madhab verdicts row — compact, below metadata */}
          {madhabVerdicts.length > 0 && (
            <Animated.View
              entering={FadeIn.delay(SUSPENSE_DURATION + 450).duration(500)}
              style={styles.madhabRow}
            >
              {madhabVerdicts.map((v) => {
                const labelKey = MADHAB_LABEL_KEY[v.madhab as keyof typeof MADHAB_LABEL_KEY];
                const label = labelKey ? t.scanResult[labelKey] : v.madhab;
                const badgeColor = halalStatusTokens[v.status as keyof typeof halalStatusTokens]?.base ?? halalStatusTokens.unknown.base;
                const badgeIcon = v.status === "halal" ? "check-circle" : v.status === "doubtful" ? "help" : "cancel";
                return (
                  <PressableScale
                    key={v.madhab}
                    onPress={() => {
                      if (v.status !== "halal") {
                        impact();
                        setSelectedMadhab(v);
                      }
                    }}
                    disabled={v.status === "halal"}
                    style={[
                      styles.madhabBadge,
                      {
                        backgroundColor: isDark
                          ? `${badgeColor}10`
                          : `${badgeColor}08`,
                        borderColor: `${badgeColor}30`,
                      },
                    ]}
                    accessibilityRole={v.status !== "halal" ? "button" : "text"}
                    accessibilityLabel={`${label}: ${v.status}`}
                  >
                    <MaterialIcons name={badgeIcon} size={13} color={badgeColor} />
                    <Text style={[styles.madhabBadgeLabel, { color: isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.7)" }]}>
                      {label}
                    </Text>
                  </PressableScale>
                );
              })}
            </Animated.View>
          )}

          {/* ── GROUP 3: Product Card ── */}
          <Animated.View
            entering={FadeInUp.delay(SUSPENSE_DURATION + 500).duration(500)}
            style={[
              styles.productOverlay,
              {
                backgroundColor: isDark
                  ? "rgba(0,0,0,0.35)"
                  : "rgba(255,255,255,0.6)",
                borderColor: isDark
                  ? "rgba(212,175,55,0.12)"
                  : "rgba(212,175,55,0.1)",
              },
            ]}
          >
            {/* Product thumbnail */}
            <View
              style={[
                styles.productThumb,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.04)",
                },
              ]}
            >
              {product.imageUrl ? (
                <Image
                  source={{ uri: product.imageUrl }}
                  style={styles.productThumbImage}
                  contentFit="cover"
                  transition={200}
                  accessibilityLabel={product.name}
                />
              ) : (
                <MaterialIcons
                  name="image-not-supported"
                  size={24}
                  color={isDark ? "#334155" : "#cbd5e1"}
                />
              )}
            </View>

            {/* Product text */}
            <View style={styles.productTextContainer}>
              <Text
                style={[styles.productName, { color: colors.textPrimary }]}
                numberOfLines={2}
                accessibilityRole="header"
              >
                {product.name}
              </Text>
              {product.brand && (
                <Text
                  style={[styles.productBrand, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {product.brand}
                </Text>
              )}
              <Text
                style={[styles.productBarcode, { color: colors.textMuted }]}
              >
                {product.barcode}
              </Text>
            </View>
          </Animated.View>
        </LinearGradient>

        {/* ── Product Image Showcase (max 200px) ── */}
        {product.imageUrl && (
          <Animated.View
            entering={FadeIn.delay(SUSPENSE_DURATION + 600).duration(400)}
            style={[
              styles.productImageShowcase,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.03)"
                  : "rgba(0,0,0,0.02)",
                borderWidth: 1,
                borderColor: isDark
                  ? "rgba(212,175,55,0.08)"
                  : "rgba(212,175,55,0.06)",
              },
            ]}
          >
            <Image
              source={{ uri: product.imageUrl }}
              style={styles.productImageLarge}
              contentFit="contain"
              transition={300}
              accessibilityLabel={product.name}
            />
          </Animated.View>
        )}

        {/* ════════════════════════════════════════════════════
            CONTENT SECTIONS (below the fold)
            ════════════════════════════════════════════════════ */}
        <View style={styles.contentContainer}>
          {/* ── Halal Alternatives (Contextual Cross-Selling) ── */}
          {(halalStatus === "haram" || halalStatus === "doubtful") &&
            alternativesQuery.data && alternativesQuery.data.length > 0 && (
            <Animated.View entering={FadeInDown.delay(100).duration(500)} style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: isDark ? "rgba(212,175,55,0.15)" : "rgba(212,175,55,0.1)", alignItems: "center", justifyContent: "center" }}>
                    <MaterialIcons name="swap-horiz" size={14} color="#d4af37" />
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: "800", color: colors.textPrimary }}>
                    {t.scanResult.halalAlternatives}
                  </Text>
                </View>
                <MaterialIcons name={marketplaceEnabled ? "storefront" : "local-mall"} size={20} color={brandTokens.gold} />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 4 }}>
                {alternativesQuery.data.slice(0, 3).map((alt: any, index: number) => {
                  const isPremiumLocked = index === 2 && !isPremium;
                  return (
                    <PressableScale
                      key={alt.id}
                      onPress={() => {
                        if (isPremiumLocked) {
                          showPaywall();
                        } else if (marketplaceEnabled) {
                          // Navigate to marketplace product page (cross-tab: use navigate)
                          router.navigate({ pathname: "/(marketplace)/product/[id]", params: { id: alt.id } } as any);
                        } else {
                          // Fallback: open scan-result for the alternative
                          router.navigate({ pathname: "/scan-result", params: { barcode: alt.barcode } });
                        }
                      }}
                    >
                      <GlowCard
                        glowColor={brandTokens.gold}
                        glowIntensity="subtle"
                        style={{
                          width: 150,
                          padding: 12,
                          backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
                          justifyContent: "space-between",
                          overflow: "hidden"
                        }}
                      >
                        {isPremiumLocked && (
                          <View style={[StyleSheet.absoluteFill, { zIndex: 10, backgroundColor: isDark ? "rgba(10,10,10,0.85)" : "rgba(255,255,255,0.85)", alignItems: "center", justifyContent: "center", borderRadius: 16 }]}>
                             <MaterialIcons name="lock" size={24} color={brandTokens.gold} />
                             <Text style={{ color: brandTokens.gold, fontSize: 11, fontWeight: "800", marginTop: 4, textAlign: "center", letterSpacing: 1 }}>Naqiy+</Text>
                          </View>
                        )}
                        <View style={{ opacity: isPremiumLocked ? 0.3 : 1 }}>
                          {alt.imageUrl ? (
                            <Image source={{ uri: alt.imageUrl }} style={{ width: 70, height: 70, borderRadius: 10, alignSelf: "center", marginBottom: 8 }} contentFit="cover" transition={200} />
                          ) : (
                            <View style={{ width: 70, height: 70, borderRadius: 10, alignSelf: "center", marginBottom: 8, backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)", alignItems: "center", justifyContent: "center" }}>
                              <MaterialIcons name="image" size={24} color={colors.textMuted} />
                            </View>
                          )}
                          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textPrimary, marginBottom: 4 }} numberOfLines={2}>
                            {alt.name}
                          </Text>
                          <StatusPill status={(alt.halalStatus ?? "halal") as "halal" | "haram" | "doubtful" | "unknown"} size="sm" animated={false} />
                          {/* Marketplace buy indicator */}
                          {marketplaceEnabled && !isPremiumLocked && (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6, backgroundColor: isDark ? "rgba(19,236,106,0.1)" : "rgba(19,236,106,0.08)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: "flex-start" }}>
                              <MaterialIcons name="shopping-cart" size={11} color={brandTokens.primary} />
                              <Text style={{ fontSize: 10, fontWeight: "700", color: brandTokens.primary }}>{t.scanResult.buyAlternative}</Text>
                            </View>
                          )}
                        </View>
                      </GlowCard>
                    </PressableScale>
                  );
                })}
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
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  marginTop: 14,
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  borderRadius: 14,
                  backgroundColor: isDark ? "rgba(212,175,55,0.06)" : "rgba(212,175,55,0.04)",
                  borderWidth: 1,
                  borderColor: isDark ? "rgba(212,175,55,0.2)" : "rgba(212,175,55,0.15)",
                }}
              >
                <MaterialIcons name="storefront" size={18} color={brandTokens.gold} />
                <Text style={{ fontSize: 14, fontWeight: "700", color: brandTokens.gold }}>
                  {marketplaceEnabled ? t.scanResult.shopHalalAlternatives : t.scanResult.shopOnMarketplace}
                </Text>
                <MaterialIcons name="arrow-forward" size={16} color={brandTokens.gold} />
              </PressableScale>
            </Animated.View>
          )}

          {/* ── Boycott Alert (highest priority after verdict) ── */}
          {boycott?.isBoycotted && (
            <Animated.View entering={FadeInDown.delay(100).duration(500)}>
              <View
                style={[
                  styles.boycottCard,
                  {
                    backgroundColor: isDark
                      ? "rgba(239,68,68,0.08)"
                      : "rgba(239,68,68,0.04)",
                    borderColor: isDark
                      ? "rgba(239,68,68,0.2)"
                      : "rgba(239,68,68,0.15)",
                  },
                ]}
              >
                <View style={styles.boycottHeader}>
                  <View
                    style={[
                      styles.boycottIconCircle,
                      {
                        backgroundColor: isDark
                          ? "rgba(239,68,68,0.15)"
                          : "rgba(239,68,68,0.1)",
                      },
                    ]}
                  >
                    <MaterialIcons name="block" size={20} color="#ef4444" />
                  </View>
                  <Text
                    style={[
                      styles.boycottTitle,
                      { color: isDark ? "#fca5a5" : "#dc2626" },
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
                          ? "rgba(239,68,68,0.15)"
                          : "rgba(239,68,68,0.1)",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.boycottCompany,
                        { color: isDark ? "#fca5a5" : "#b91c1c" },
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
                        { color: isDark ? "#fca5a5cc" : "#dc2626cc" },
                      ]}
                    >
                      {target.reasonSummary ?? target.companyName}
                    </Text>
                    {target.sourceUrl && (
                      <Text
                        style={[
                          styles.boycottSource,
                          { color: isDark ? "#ef4444aa" : "#ef4444aa" },
                        ]}
                      >
                        {t.scanResult.source}: {target.sourceName ?? "BDS"}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* ── Personal Alerts ── */}
          {personalAlerts.length > 0 && (
            <View style={{ marginHorizontal: -20 }}>
              <PersonalAlerts alerts={personalAlerts} />
            </View>
          )}

          {/* ── Certifier / Analysis Source (2-column) ── */}
          {halalAnalysis && (
            <Animated.View entering={FadeInDown.delay(200).duration(500)}>
              <View
                style={[
                  styles.certifierCard,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.03)"
                      : "#ffffff",
                    borderColor: isDark
                      ? "rgba(212,175,55,0.12)"
                      : "rgba(212,175,55,0.1)",
                  },
                ]}
              >
                <View style={styles.certifierTwoCol}>
                  {/* Left column: Certifier / Analysis method */}
                  <View style={styles.certifierCol}>
                    <View
                      style={[
                        styles.certifierIconCircle,
                        {
                          backgroundColor: isDark
                            ? "rgba(19,236,106,0.12)"
                            : "rgba(19,236,106,0.08)",
                        },
                      ]}
                    >
                      <MaterialIcons
                        name={halalAnalysis.certifierName ? "verified" : "analytics"}
                        size={20}
                        color={colors.primary}
                      />
                    </View>
                    <Text
                      style={[styles.certifierName, { color: colors.textPrimary }]}
                      numberOfLines={2}
                    >
                      {halalAnalysis.certifierName
                        ? halalAnalysis.certifierName
                        : t.scanResult.algorithmicAnalysis}
                    </Text>
                    <Text
                      style={[styles.certifierSource, { color: colors.textSecondary }]}
                      numberOfLines={1}
                    >
                      {halalAnalysis.analysisSource}
                    </Text>
                  </View>

                  {/* Divider */}
                  <View
                    style={[
                      styles.certifierDivider,
                      {
                        backgroundColor: isDark
                          ? "rgba(212,175,55,0.15)"
                          : "rgba(212,175,55,0.12)",
                      },
                    ]}
                  />

                  {/* Right column: Tier / Reliability */}
                  <View style={styles.certifierCol}>
                    <View
                      style={[
                        styles.certifierIconCircle,
                        {
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.06)"
                            : "rgba(0,0,0,0.04)",
                        },
                      ]}
                    >
                      <MaterialIcons
                        name="shield"
                        size={20}
                        color={statusConfig.color}
                      />
                    </View>
                    <Text
                      style={[styles.certifierName, { color: colors.textPrimary }]}
                    >
                      {t.scanResult.tier}{" "}
                      {halalAnalysis.tier === "certified"
                        ? "1"
                        : halalAnalysis.tier === "analyzed_clean"
                          ? "2"
                          : halalAnalysis.tier === "doubtful"
                            ? "3"
                            : "4"}
                    </Text>
                    <Text
                      style={[styles.certifierSource, { color: colors.textSecondary }]}
                    >
                      {halalAnalysis.tier === "certified"
                        ? t.scanResult.tierCertified
                        : halalAnalysis.tier === "analyzed_clean"
                          ? t.scanResult.tierAnalyzed
                          : halalAnalysis.tier === "doubtful"
                            ? t.scanResult.tierDoubtful
                            : t.scanResult.tierUnknown}
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          )}

          {/* ── Why This Status ── */}
          {halalAnalysis &&
            (haramReasons.length > 0 || doubtfulReasons.length > 0) && (
              <Animated.View entering={FadeInDown.delay(250).duration(500)}>
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
                            ? "rgba(255,255,255,0.06)"
                            : "rgba(0,0,0,0.06)",
                        },
                      ]}
                    >
                      <MaterialIcons
                        name="dangerous"
                        size={18}
                        color="#ef4444"
                        style={{ marginTop: 1 }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.reasonName,
                            { color: isDark ? "#fca5a5" : "#dc2626" },
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
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                            <MaterialIcons name="menu-book" size={11} color={colors.textMuted} />
                            <Text style={{ fontSize: 11, fontStyle: "italic", color: colors.textMuted, flex: 1 }} numberOfLines={1}>
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
                            ? "rgba(255,255,255,0.06)"
                            : "rgba(0,0,0,0.06)",
                        },
                      ]}
                    >
                      <MaterialIcons
                        name="help"
                        size={18}
                        color="#f97316"
                        style={{ marginTop: 1 }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.reasonName,
                            { color: isDark ? "#fdba74" : "#c2410c" },
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
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                            <MaterialIcons name="menu-book" size={11} color={colors.textMuted} />
                            <Text style={{ fontSize: 11, fontStyle: "italic", color: colors.textMuted, flex: 1 }} numberOfLines={1}>
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
            <Animated.View entering={FadeInDown.delay(300).duration(500)}>
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
              <Animated.View entering={FadeInDown.delay(340).duration(500)}>
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
              <Animated.View entering={FadeInDown.delay(360).duration(500)}>
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
            <Animated.View entering={FadeInDown.delay(380).duration(500)}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.textPrimary },
                ]}
                accessibilityRole="header"
              >
                {t.scanResult.allergens}
              </Text>
              <View style={styles.allergensRow}>
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
                            ? "rgba(245,158,11,0.1)"
                            : "rgba(245,158,11,0.06)",
                          borderColor: isDark
                            ? "rgba(245,158,11,0.25)"
                            : "rgba(245,158,11,0.2)",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.allergenText,
                          { color: isDark ? "#fbbf24" : "#b45309" },
                        ]}
                      >
                        {label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </Animated.View>
          )}

          {/* ── Ingredients (Collapsible) ── */}
          {ingredients.length > 0 && (
            <Animated.View entering={FadeInDown.delay(400).duration(500)}>
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
                    />
                  );
                })}
              </CollapsibleSection>
            </Animated.View>
          )}

          {/* ── Halal Alternatives previously here, moved to top of contentContainer ── */}

          {/* ── Votre Avis Compte (community trust) ── */}
          {product && (
            <Animated.View entering={FadeInDown.delay(460).duration(500)}>
              <View
                style={{
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: isDark ? "rgba(212,175,55,0.12)" : "rgba(212,175,55,0.1)",
                  backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
                  padding: 20,
                  marginBottom: 16,
                  alignItems: "center",
                  gap: 10,
                }}
              >
                {/* Gold shield icon */}
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: isDark ? "rgba(212,175,55,0.12)" : "rgba(212,175,55,0.08)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 2,
                  }}
                >
                  <MaterialIcons name="verified-user" size={18} color="#d4af37" />
                </View>
                <Text style={{ fontSize: 15, fontWeight: "800", color: colors.textPrimary, letterSpacing: 0.3 }}>
                  {t.scanResult.yourOpinionMatters}
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: "center", lineHeight: 18, paddingHorizontal: 12 }}>
                  {t.scanResult.isThisResultAccurate}
                </Text>
                <View style={{ flexDirection: "row", gap: 16, marginTop: 6 }}>
                  <PressableScale
                    onPress={() => {
                      impact();
                      const newVote = userVote === "up" ? null : "up";
                      setUserVote(newVote);
                      if (newVote && product?.id) {
                        reviewMutation.mutate({ productId: product.id, rating: 5 });
                      }
                    }}
                    style={{
                      width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center",
                      backgroundColor: userVote === "up"
                        ? (isDark ? "rgba(19,236,106,0.15)" : "rgba(19,236,106,0.1)")
                        : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)"),
                      borderWidth: userVote === "up" ? 2 : 1,
                      borderColor: userVote === "up" ? colors.primary : isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                      ...(userVote === "up" ? {
                        shadowColor: colors.primary,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.3,
                        shadowRadius: 10,
                        elevation: 4,
                      } : {}),
                    }}
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
                    style={{
                      width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center",
                      backgroundColor: userVote === "down"
                        ? (isDark ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.08)")
                        : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)"),
                      borderWidth: userVote === "down" ? 2 : 1,
                      borderColor: userVote === "down" ? "#ef4444" : isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                      ...(userVote === "down" ? {
                        shadowColor: "#ef4444",
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.3,
                        shadowRadius: 10,
                        elevation: 4,
                      } : {}),
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={t.scanResult.inaccurateResult}
                  >
                    <MaterialIcons name="thumb-down" size={24} color={userVote === "down" ? "#ef4444" : colors.textSecondary} />
                  </PressableScale>
                </View>
                {userVote && (
                  <Animated.View entering={FadeIn.duration(300)}>
                    <Text style={{ fontSize: 13, color: "#d4af37", fontWeight: "700", marginTop: 2 }}>
                      {t.scanResult.thankYouForFeedback}
                    </Text>
                  </Animated.View>
                )}
              </View>
            </Animated.View>
          )}

          {/* ── New Product Banner ── */}
          {scanMutation.data?.isNewProduct && (
            <Animated.View entering={FadeInDown.delay(450).duration(500)}>
              <View
                style={[
                  styles.newProductBanner,
                  {
                    backgroundColor: isDark
                      ? "rgba(212,175,55,0.06)"
                      : "rgba(212,175,55,0.04)",
                    borderColor: isDark
                      ? "rgba(212,175,55,0.2)"
                      : "rgba(212,175,55,0.15)",
                  },
                ]}
              >
                <MaterialIcons
                  name="new-releases"
                  size={20}
                  color="#d4af37"
                  style={{ marginTop: 2 }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: isDark ? "#fcd880" : "#92700c",
                    }}
                  >
                    {t.scanResult.newProductAdded}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: isDark ? "#fcd880cc" : "#92700ccc",
                      marginTop: 2,
                      lineHeight: 18,
                    }}
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
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 8,
              paddingVertical: 12,
              paddingHorizontal: 4,
              marginTop: 4,
              marginBottom: 8,
            }}
          >
            <MaterialIcons
              name="info-outline"
              size={14}
              color={isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)"}
              style={{ marginTop: 1 }}
            />
            <Text
              style={{
                flex: 1,
                fontSize: 11,
                lineHeight: 16,
                color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)",
                fontStyle: "italic",
              }}
            >
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
            <View
              style={[
                styles.actionBarInner,
                {
                  borderColor: isDark
                    ? "rgba(212,175,55,0.12)"
                    : "rgba(212,175,55,0.1)",
                },
              ]}
            >
              {/* Favorite */}
              <PressableScale
                onPress={handleFavAnimated}
                disabled={isFavMutating}
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.04)",
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
                    color={productIsFavorite ? "#ef4444" : colors.textSecondary}
                  />
                </Animated.View>
              </PressableScale>

              {/* Share */}
              <PressableScale
                onPress={handleShare}
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.04)",
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={t.scanResult.shareProduct}
              >
                <MaterialIcons
                  name="share"
                  size={22}
                  color={colors.textSecondary}
                />
              </PressableScale>

              {/* Where to Buy (primary CTA) */}
              <PressableScale
                onPress={handleFindStores}
                style={[styles.ctaButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
                accessibilityRole="button"
                accessibilityLabel={t.scanResult.whereToBuy}
                accessibilityHint={t.scanResult.findStores}
              >
                <MaterialIcons name={marketplaceEnabled ? "shopping-cart" : "location-on"} size={20} color="#0d1b13" />
                <Text style={styles.ctaText}>{marketplaceEnabled ? t.scanResult.viewOnMarketplace : t.scanResult.whereToBuy}</Text>
              </PressableScale>

              {/* Report */}
              <PressableScale
                onPress={handleReport}
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.04)",
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={t.scanResult.report}
              >
                <MaterialIcons
                  name="flag"
                  size={22}
                  color={colors.textSecondary}
                />
              </PressableScale>
            </View>
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
            <View
              style={[
                styles.actionBarInner,
                {
                  borderColor: isDark
                    ? "rgba(212,175,55,0.12)"
                    : "rgba(212,175,55,0.1)",
                },
              ]}
            >
              {/* Favorite */}
              <PressableScale
                onPress={handleFavAnimated}
                disabled={isFavMutating}
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.04)",
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
                    color={productIsFavorite ? "#ef4444" : colors.textSecondary}
                  />
                </Animated.View>
              </PressableScale>

              {/* Share */}
              <PressableScale
                onPress={handleShare}
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.04)",
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={t.scanResult.shareProduct}
              >
                <MaterialIcons
                  name="share"
                  size={22}
                  color={colors.textSecondary}
                />
              </PressableScale>

              {/* Where to Buy (primary CTA) */}
              <PressableScale
                onPress={handleFindStores}
                style={[styles.ctaButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
                accessibilityRole="button"
                accessibilityLabel={t.scanResult.whereToBuy}
                accessibilityHint={t.scanResult.findStores}
              >
                <MaterialIcons name={marketplaceEnabled ? "shopping-cart" : "location-on"} size={20} color="#0d1b13" />
                <Text style={styles.ctaText}>{marketplaceEnabled ? t.scanResult.viewOnMarketplace : t.scanResult.whereToBuy}</Text>
              </PressableScale>

              {/* Report */}
              <PressableScale
                onPress={handleReport}
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.04)",
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={t.scanResult.report}
              >
                <MaterialIcons
                  name="flag"
                  size={22}
                  color={colors.textSecondary}
                />
              </PressableScale>
            </View>
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
  // ── Hero ───────────────────────────────────────
  heroGradient: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // ── Floating back button ───────────────────────
  floatingBackButton: {
    position: "absolute",
    left: 16,
    zIndex: 50,
  },

  // ── Verdict cluster (icon + text, tightly grouped) ─
  verdictCluster: {
    alignItems: "center",
    marginBottom: 16,
  },

  // ── Status icon (compact) ─────────────────────
  statusIconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 76,
    height: 76,
    marginBottom: 6,
  },
  statusIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
  },

  // ── Verdict text ───────────────────────────────
  verdictTextContainer: {
    alignItems: "center",
  },
  verdictText: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 2,
    textTransform: "uppercase",
    textAlign: "center",
  },

  // ── Metadata band (certifier + community, horizontal) ─
  metadataBand: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    flexWrap: "wrap" as const,
    gap: 6,
    marginBottom: 8,
  },

  // ── Community badge ──────────────────────────────
  communityBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  communityBadgeText: {
    fontSize: 11,
    fontWeight: "600" as const,
  },

  // ── Certifier hero badge ────────────────────────
  certifierHeroBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  certifierHeroBadgeText: {
    fontSize: 11,
    fontWeight: "600" as const,
  },

  // ── Madhab badges row ───────────────────────────
  madhabRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    flexWrap: "wrap" as const,
    justifyContent: "center" as const,
    gap: 5,
    marginBottom: 14,
    paddingHorizontal: 8,
  },
  madhabBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  madhabBadgeLabel: {
    fontSize: 10,
    fontWeight: "600" as const,
  },

  // ── Product image showcase (below HERO) ────────
  productImageShowcase: {
    alignItems: "center",
    paddingVertical: 16,
    marginHorizontal: 20,
    marginTop: -8,
    borderRadius: 16,
  },
  productImageLarge: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },

  // ── Product overlay ────────────────────────────
  productOverlay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    // Glass-morphism look
    overflow: "hidden",
  },
  productThumb: {
    width: 80,
    height: 80,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  productThumbImage: {
    width: 80,
    height: 80,
    borderRadius: 14,
  },
  productTextContainer: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 20,
  },
  productBrand: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
  productBarcode: {
    fontSize: 11,
    marginTop: 2,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },

  // ── Content ────────────────────────────────────
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // ── Section title ──────────────────────────────
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 12,
    marginTop: 8,
  },

  // ── Certifier card (2-column) ─────────────────
  certifierCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  certifierTwoCol: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
  },
  certifierCol: {
    flex: 1,
    alignItems: "center" as const,
    gap: 6,
  },
  certifierDivider: {
    width: 1,
    alignSelf: "stretch" as const,
    marginHorizontal: 12,
  },
  certifierIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  certifierName: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center" as const,
  },
  certifierSource: {
    fontSize: 12,
    textAlign: "center" as const,
  },

  // ── Boycott card ───────────────────────────────
  boycottCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderLeftColor: "#ef4444",
    padding: 16,
    marginBottom: 16,
  },
  boycottHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  boycottIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  boycottTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  boycottTarget: {
    paddingVertical: 8,
  },
  boycottCompany: {
    fontSize: 13,
    fontWeight: "700",
  },
  boycottReason: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 17,
  },
  boycottSource: {
    fontSize: 11,
    marginTop: 4,
  },

  // ── Collapsible ────────────────────────────────
  collapsibleContainer: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: "hidden",
  },
  collapsibleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  collapsibleHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  collapsibleTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  collapsibleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  collapsibleBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  collapsibleContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  // ── Reason rows ────────────────────────────────
  reasonRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 10,
  },
  reasonName: {
    fontSize: 13,
    fontWeight: "700",
  },
  reasonExplanation: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 17,
  },

  // ── Additive rows ──────────────────────────────
  additiveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  additiveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  additiveName: {
    fontSize: 13,
    fontWeight: "600",
  },
  additiveExplanation: {
    fontSize: 11,
    marginTop: 1,
  },
  additiveStatus: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  // ── Allergens ──────────────────────────────────
  allergensRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  allergenChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  allergenText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },

  // ── Ingredient row ─────────────────────────────
  ingredientRow: {
    paddingVertical: 10,
  },
  ingredientDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  ingredientName: {
    fontSize: 13,
    flex: 1,
  },

  // ── New product banner ─────────────────────────
  newProductBanner: {
    flexDirection: "row",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },

  // ── Loading state ──────────────────────────────
  loadingContent: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    gap: 16,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  loadingBarcode: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },

  // ── Error / Not Found states ───────────────────
  stateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  stateContent: {
    alignItems: "center",
    gap: 16,
  },
  stateIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  stateDesc: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
  },
  stateButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  stateButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  stateButtonText: {
    fontSize: 14,
    fontWeight: "700",
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  actionBarInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    // Green glow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0d1b13",
  },
  offScreen: {
    position: "absolute",
    left: -9999,
    top: 0,
    opacity: 1,
  },
});
