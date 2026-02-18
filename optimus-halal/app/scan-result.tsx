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
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Platform,
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
import { IconButton, IslamicPattern, ArabicCalligraphy, StatusPill, LevelUpCelebration } from "@/components/ui";
import { PersonalAlerts, type PersonalAlert } from "@/components/scan/PersonalAlerts";
import { MadhabBottomSheet } from "@/components/scan/MadhabBottomSheet";
import { shareProductCard } from "@/components/scan/ShareCard";
import { trpc } from "@/lib/trpc";
import { useScanBarcode } from "@/hooks/useScan";
import { useTranslation, useHaptics, useAddFavorite, useRemoveFavorite, useCreateReview } from "@/hooks";
import { useTheme } from "@/hooks/useTheme";

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
    color: "#22c55e",
    glowColor: "#13ec6a",
    gradientDark: ["#0a1a10", "#0f2418", "#132a1a"],
    gradientLight: ["#ecfdf5", "#d1fae5", "#a7f3d0"],
  },
  haram: {
    labelKey: "haramDetected",
    icon: "dangerous",
    color: "#ef4444",
    glowColor: "#dc2626",
    gradientDark: ["#1a0a0a", "#221111", "#2a1313"],
    gradientLight: ["#fef2f2", "#fecaca", "#fca5a5"],
  },
  doubtful: {
    labelKey: "doubtfulStatus",
    icon: "help",
    color: "#f97316",
    glowColor: "#ea580c",
    gradientDark: ["#1a140a", "#221b11", "#2a1f13"],
    gradientLight: ["#fff7ed", "#fed7aa", "#fdba74"],
  },
  unknown: {
    labelKey: "unverified",
    icon: "help-outline",
    color: "#94a3b8",
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

// Nutri-Score color map
const NUTRISCORE_COLORS: Record<string, string> = {
  a: "#22c55e",
  b: "#84cc16",
  c: "#eab308",
  d: "#f97316",
  e: "#ef4444",
};

// NOVA group color map
const NOVA_COLORS: Record<number, string> = {
  1: "#22c55e",
  2: "#eab308",
  3: "#f97316",
  4: "#ef4444",
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

// ── Nutrition Badge ─────────────────────────────────────────

const NutritionBadge = React.memo(function NutritionBadge({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  const { isDark, colors } = useTheme();
  return (
    <View
      style={[
        styles.nutritionBadge,
        {
          backgroundColor: isDark
            ? "rgba(255,255,255,0.04)"
            : "rgba(0,0,0,0.03)",
          borderColor: isDark
            ? "rgba(255,255,255,0.08)"
            : "rgba(0,0,0,0.06)",
        },
      ]}
    >
      {/* Mini circular indicator */}
      <View
        style={[
          styles.nutritionIndicator,
          { backgroundColor: `${color}20`, borderColor: color },
        ]}
      >
        <Text
          style={[styles.nutritionValue, { color }]}
          numberOfLines={1}
        >
          {String(value).toUpperCase()}
        </Text>
      </View>
      <Text
        style={[
          styles.nutritionLabel,
          { color: colors.textSecondary },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
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
            ? "rgba(255,255,255,0.06)"
            : "rgba(0,0,0,0.06)",
        },
      ]}
    >
      <TouchableOpacity
        onPress={toggle}
        style={styles.collapsibleHeader}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
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
      </TouchableOpacity>
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
}: {
  name: string;
  isLast: boolean;
  isProblematic?: boolean;
  problemColor?: string;
  explanation?: string;
  problemStatus?: string;
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

  const detailStyle = useAnimatedStyle(() => ({
    height: expandHeight.value * 72,
    opacity: expandHeight.value,
    overflow: "hidden" as const,
  }));

  const statusLabel =
    problemStatus === "haram"
      ? t.scanResult.ingredientHaram
      : t.scanResult.ingredientDoubtful;

  return (
    <TouchableOpacity
      activeOpacity={isProblematic ? 0.7 : 1}
      onPress={toggleExpand}
      disabled={!isProblematic || !explanation}
      accessibilityRole={isProblematic && explanation ? "button" : "text"}
      accessibilityState={isProblematic ? { expanded } : undefined}
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
                ? problemColor ?? "#f97316"
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
                ? problemColor ?? "#f97316"
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
            color={problemColor ?? "#f97316"}
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
                backgroundColor: (problemColor ?? "#f97316") + "20",
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: problemColor ?? "#f97316",
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
        </Animated.View>
      )}
    </TouchableOpacity>
  );
});

// ── Loading Skeleton ────────────────────────────────────────

const ScanLoadingSkeleton = React.memo(function ScanLoadingSkeleton({
  barcode,
}: {
  barcode?: string;
}) {
  const { isDark } = useTheme();
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
              { color: isDark ? "#13ec6a" : "#0ea64b" },
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
    <View style={[styles.stateContainer, { backgroundColor: colors.background }]}>
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
          <TouchableOpacity
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
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onRetry}
            style={[styles.stateButton, { backgroundColor: "#13ec6a" }]}
            accessibilityRole="button"
            accessibilityLabel={t.common.retry}
          >
            <Text style={[styles.stateButtonText, { color: "#0d1b13" }]}>
              {t.common.retry}
            </Text>
          </TouchableOpacity>
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
    <View style={[styles.stateContainer, { backgroundColor: colors.background }]}>
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
        <TouchableOpacity
          onPress={onGoBack}
          style={[styles.stateButton, { backgroundColor: "#13ec6a", marginTop: 16 }]}
          accessibilityRole="button"
          accessibilityLabel={t.scanResult.scanAnother}
        >
          <Text style={[styles.stateButtonText, { color: "#0d1b13" }]}>
            {t.scanResult.scanAnother}
          </Text>
        </TouchableOpacity>
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
  const levelUp = scanMutation.data?.levelUp ?? null;

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
  } | null>(null);

  const handleCloseMadhab = useCallback(() => setSelectedMadhab(null), []);

  // ── User Vote (backend-synced) ────────────────
  const [userVote, setUserVote] = useState<"up" | "down" | null>(null);
  const reviewMutation = useCreateReview();

  // Build a Map of problematic ingredient names for fast lookup
  // Includes color + explanation for expandable ingredient detail
  const problematicIngredients = useMemo(() => {
    const names = new Map<string, { color: string; explanation: string; status: string }>();
    for (const r of haramReasons) {
      names.set(r.name.toLowerCase(), {
        color: "#ef4444",
        explanation: r.explanation,
        status: r.status,
      });
    }
    for (const r of doubtfulReasons) {
      if (!names.has(r.name.toLowerCase())) {
        names.set(r.name.toLowerCase(), {
          color: "#f97316",
          explanation: r.explanation,
          status: r.status,
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
  // Two-phase haptic: immediate feedback + delayed reinforcement.
  // Halal = relief (success + soft landing), Haram = alarm (double error),
  // Doubtful = caution (warning + light nudge).
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
      } else {
        notification(NotificationFeedbackType.Warning);
        setTimeout(() => impact(ImpactFeedbackStyle.Light), 250);
      }
    }
  }, [product, halalStatus, notification, impact]);

  // ── Callbacks ──────────────────────────────────
  const handleGoBack = useCallback(() => {
    impact();
    router.back();
  }, [impact]);

  const handleShare = useCallback(async () => {
    impact();
    if (!product) return;
    const statusLabelMap: Record<string, string> = {
      halal: t.scanResult.certifiedHalal,
      haram: t.scanResult.haramDetected,
      doubtful: t.scanResult.doubtfulStatus,
      unknown: t.scanResult.unverified,
    };
    await shareProductCard(
      {
        productName: product.name,
        brand: product.brand ?? null,
        halalStatus: halalStatus as "halal" | "haram" | "doubtful" | "unknown",
        certifier: halalAnalysis?.certifierName ?? null,
        isBoycotted: !!boycott,
        barcode: product.barcode,
      },
      {
        statusLabel: statusLabelMap[halalStatus] ?? statusLabelMap.unknown,
        certifiedBy: t.scanResult.certifiedBy,
        boycotted: t.scanResult.shareBoycotted,
        verifiedWith: t.scanResult.verifiedWith,
        tagline: t.scanResult.shareTagline,
      },
    );
  }, [product, halalStatus, halalAnalysis, boycott, impact, t]);

  const handleToggleFavorite = useCallback(() => {
    impact(ImpactFeedbackStyle.Medium);
    if (!product?.id) return;
    if (productIsFavorite) {
      removeFavoriteMutation.mutate({ productId: product.id });
    } else {
      addFavoriteMutation.mutate({ productId: product.id });
    }
  }, [product, productIsFavorite, addFavoriteMutation, removeFavoriteMutation, impact]);

  const handleFindStores = useCallback(() => {
    impact();
    router.push("/(tabs)/map");
  }, [impact]);

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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
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
          {/* Islamic pattern overlay */}
          <IslamicPattern variant="khatam" opacity={0.03} />

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
                const badgeColor = v.status === "halal" ? "#22c55e" : v.status === "doubtful" ? "#f97316" : "#ef4444";
                const badgeIcon = v.status === "halal" ? "check-circle" : v.status === "doubtful" ? "help" : "cancel";
                return (
                  <TouchableOpacity
                    key={v.madhab}
                    onPress={() => {
                      if (v.status !== "halal") {
                        impact();
                        setSelectedMadhab(v);
                      }
                    }}
                    disabled={v.status === "halal"}
                    activeOpacity={v.status === "halal" ? 1 : 0.7}
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
                  </TouchableOpacity>
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
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(0,0,0,0.06)",
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

        {/* ════════════════════════════════════════════════════
            CONTENT SECTIONS (below the fold)
            ════════════════════════════════════════════════════ */}
        <View style={styles.contentContainer}>
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
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.06)",
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
                        color="#13ec6a"
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
                          ? "rgba(255,255,255,0.06)"
                          : "rgba(0,0,0,0.06)",
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
                            additive.status === "haram"
                              ? "#ef4444"
                              : additive.status === "doubtful"
                                ? "#f97316"
                                : "#22c55e",
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
                            additive.status === "haram"
                              ? "#ef4444"
                              : additive.status === "doubtful"
                                ? "#f97316"
                                : "#22c55e",
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

          {/* ── Nutrition Badges ── */}
          {offExtras &&
            (offExtras.nutriscoreGrade || offExtras.novaGroup) && (
              <Animated.View entering={FadeInDown.delay(350).duration(500)}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: colors.textPrimary },
                  ]}
                  accessibilityRole="header"
                >
                  {t.scanResult.nutrition}
                </Text>
                <View style={styles.nutritionRow}>
                  {offExtras.nutriscoreGrade && (
                    <NutritionBadge
                      label={t.scanResult.nutriScore ?? "Nutri-Score"}
                      value={offExtras.nutriscoreGrade}
                      color={
                        NUTRISCORE_COLORS[offExtras.nutriscoreGrade] ??
                        "#94a3b8"
                      }
                    />
                  )}
                  {offExtras.novaGroup && (
                    <NutritionBadge
                      label={t.scanResult.novaGroup ?? "NOVA"}
                      value={offExtras.novaGroup}
                      color={NOVA_COLORS[offExtras.novaGroup] ?? "#94a3b8"}
                    />
                  )}
                  {offExtras.ecoscoreGrade && (
                    <NutritionBadge
                      label={t.scanResult.ecoScore ?? "Eco-Score"}
                      value={offExtras.ecoscoreGrade}
                      color={
                        NUTRISCORE_COLORS[offExtras.ecoscoreGrade] ?? "#94a3b8"
                      }
                    />
                  )}
                </View>
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
                  const problemInfo = problematicIngredients.get(lower);
                  return (
                    <IngredientRow
                      key={index}
                      name={ingredient}
                      isLast={index === ingredients.length - 1}
                      isProblematic={!!problemInfo}
                      problemColor={problemInfo?.color}
                      explanation={problemInfo?.explanation}
                      problemStatus={problemInfo?.status}
                    />
                  );
                })}
              </CollapsibleSection>
            </Animated.View>
          )}

          {/* ── Halal Alternatives ── */}
          {alternativesQuery.data && alternativesQuery.data.length > 0 && (
            <Animated.View entering={FadeInDown.delay(420).duration(500)}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.textPrimary, marginBottom: 8 }}>{t.scanResult.halalAlternatives}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 4 }}>
                {alternativesQuery.data.map((alt: any) => (
                  <TouchableOpacity
                    key={alt.id}
                    onPress={() => router.push({ pathname: "/scan-result", params: { barcode: alt.barcode } })}
                    style={{
                      width: 140,
                      borderRadius: 16,
                      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#ffffff",
                      borderWidth: 1,
                      borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                      padding: 12,
                    }}
                  >
                    {alt.imageUrl ? (
                      <Image
                        source={{ uri: alt.imageUrl }}
                        style={{ width: 60, height: 60, borderRadius: 8, alignSelf: "center" }}
                        contentFit="cover"
                        transition={200}
                      />
                    ) : (
                      <View style={{
                        width: 60, height: 60, borderRadius: 8, alignSelf: "center",
                        backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
                        alignItems: "center", justifyContent: "center",
                      }}>
                        <MaterialIcons name="image" size={24} color={colors.textMuted} />
                      </View>
                    )}
                    <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textPrimary, marginTop: 8 }} numberOfLines={2}>
                      {alt.name}
                    </Text>
                    <StatusPill status={(alt.halalStatus ?? "unknown") as "halal" | "haram" | "doubtful" | "unknown"} size="sm" animated={false} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Animated.View>
          )}

          {/* ── Votre Avis Compte (local vote) ── */}
          {product && (
            <Animated.View entering={FadeInDown.delay(460).duration(500)}>
              <View style={{ alignItems: "center", paddingVertical: 12, gap: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textPrimary }}>
                  {t.scanResult.yourOpinionMatters}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: "center" }}>
                  {t.scanResult.isThisResultAccurate}
                </Text>
                <View style={{ flexDirection: "row", gap: 16, marginTop: 4 }}>
                  <TouchableOpacity
                    onPress={() => {
                      impact();
                      const newVote = userVote === "up" ? null : "up";
                      setUserVote(newVote);
                      if (newVote && product?.id) {
                        reviewMutation.mutate({ productId: product.id, rating: 5 });
                      }
                    }}
                    style={{
                      width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center",
                      backgroundColor: userVote === "up" ? "#13ec6a20" : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                      borderWidth: userVote === "up" ? 2 : 1,
                      borderColor: userVote === "up" ? "#13ec6a" : isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={t.scanResult.accurateResult}
                  >
                    <MaterialIcons name="thumb-up" size={24} color={userVote === "up" ? "#13ec6a" : colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      impact();
                      const newVote = userVote === "down" ? null : "down";
                      setUserVote(newVote);
                      if (newVote && product?.id) {
                        reviewMutation.mutate({ productId: product.id, rating: 1 });
                      }
                    }}
                    style={{
                      width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center",
                      backgroundColor: userVote === "down" ? "#ef444420" : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                      borderWidth: userVote === "down" ? 2 : 1,
                      borderColor: userVote === "down" ? "#ef4444" : isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={t.scanResult.inaccurateResult}
                  >
                    <MaterialIcons name="thumb-down" size={24} color={userVote === "down" ? "#ef4444" : colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                {userVote && (
                  <Animated.View entering={FadeIn.duration(300)}>
                    <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "600", marginTop: 4 }}>
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
                      ? "rgba(59,130,246,0.08)"
                      : "rgba(59,130,246,0.04)",
                    borderColor: isDark
                      ? "rgba(59,130,246,0.2)"
                      : "rgba(59,130,246,0.15)",
                  },
                ]}
              >
                <MaterialIcons
                  name="new-releases"
                  size={20}
                  color="#3b82f6"
                  style={{ marginTop: 2 }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: isDark ? "#93c5fd" : "#1e40af",
                    }}
                  >
                    {t.scanResult.newProductAdded}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: isDark ? "#93c5fdcc" : "#1e40afcc",
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
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(0,0,0,0.06)",
              },
            ]}
          >
            {/* Favorite */}
            <TouchableOpacity
              onPress={handleFavAnimated}
              style={[
                styles.actionButton,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.04)",
                },
              ]}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={
                productIsFavorite
                  ? t.scanResult.removeFromFavorites
                  : t.scanResult.addToFavorites
              }
              accessibilityState={{ selected: productIsFavorite }}
            >
              <Animated.View style={favAnimatedStyle}>
                <MaterialIcons
                  name={productIsFavorite ? "favorite" : "favorite-border"}
                  size={24}
                  color={productIsFavorite ? "#ef4444" : colors.textSecondary}
                />
              </Animated.View>
            </TouchableOpacity>

            {/* Share */}
            <TouchableOpacity
              onPress={handleShare}
              style={[
                styles.actionButton,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.04)",
                },
              ]}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t.scanResult.shareProduct}
            >
              <MaterialIcons
                name="share"
                size={22}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {/* Where to Buy (primary CTA) */}
            <TouchableOpacity
              onPress={handleFindStores}
              style={styles.ctaButton}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t.scanResult.whereToBuy}
              accessibilityHint={t.scanResult.findStores}
            >
              <MaterialIcons name="location-on" size={20} color="#0d1b13" />
              <Text style={styles.ctaText}>{t.scanResult.whereToBuy}</Text>
            </TouchableOpacity>

            {/* Report */}
            <TouchableOpacity
              onPress={handleReport}
              style={[
                styles.actionButton,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.04)",
                },
              ]}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t.scanResult.report}
            >
              <MaterialIcons
                name="flag"
                size={22}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </BlurView>
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
        onClose={handleCloseMadhab}
      />
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
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  productThumbImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
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

  // ── Nutrition ──────────────────────────────────
  nutritionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  nutritionBadge: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    gap: 6,
  },
  nutritionIndicator: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  nutritionLabel: {
    fontSize: 11,
    fontWeight: "600",
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
    backgroundColor: "#13ec6a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    // Green glow
    shadowColor: "#13ec6a",
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
});
