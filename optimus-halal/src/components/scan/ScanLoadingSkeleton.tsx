/**
 * ScanLoadingSkeleton — "Le Scribe Sacré" storytelling loader.
 *
 * 4 animated steps narrate the analysis journey while the backend
 * processes the scan. Each step activates → completes in sequence,
 * turning the wait into an informative micro-experience.
 *
 * Extracted from scan-result.tsx (final cleanup sprint).
 *
 * @module components/scan/ScanLoadingSkeleton
 */

import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { CheckIcon, QrCodeIcon } from "phosphor-react-native";
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
  useReducedMotion,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { halalStatus as halalStatusTokens, lightTheme, gold } from "@/theme/colors";
import { fontSize as fontSizeTokens, fontWeight as fontWeightTokens } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import { AppIcon } from "@/lib/icons";

import { Dimensions } from "react-native";
const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const HERO_HEIGHT = SCREEN_HEIGHT * 0.5;

// ── Constants ─────────────────────────────────────────────────────────────────

const SCRIBE_ICONS = [
  "qr-code-scanner",
  "inventory-2",
  "science",
  "balance",
] as const;

const MADHAB_CHIPS = ["Hanafi", "Shafi'i", "Maliki", "Hanbali"] as const;

type ScribeStatus = "pending" | "active" | "completed";

// ── ScribeStepNode ────────────────────────────────────────────────────────────

const ScribeStepNode = React.memo(function ScribeStepNode({
  icon,
  label,
  status,
  isLast,
  reducedMotion,
  isDark,
  showMadhabs,
}: {
  icon: (typeof SCRIBE_ICONS)[number];
  label: string;
  status: ScribeStatus;
  isLast: boolean;
  reducedMotion: boolean;
  isDark: boolean;
  showMadhabs: boolean;
}) {
  const nodeScale = useSharedValue(status === "pending" ? 0.85 : 1);
  const glowOpacity = useSharedValue(0);
  const checkScale = useSharedValue(0);

  useEffect(() => {
    if (status === "active") {
      nodeScale.value = withSpring(1, { damping: 12, stiffness: 150 });
      glowOpacity.value = withTiming(1, { duration: 350 });
      if (!reducedMotion) {
        nodeScale.value = withRepeat(
          withSequence(
            withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          ),
          -1,
          false,
        );
      }
    } else if (status === "completed") {
      nodeScale.value = withSpring(1, { damping: 15 });
      glowOpacity.value = withTiming(0, { duration: 200 });
      checkScale.value = withSpring(1, { damping: 8, stiffness: 200 });
    }
  }, [status, reducedMotion]);

  const nodeAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: nodeScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));

  const isActive = status === "active";
  const isDone = status === "completed";

  const nodeBorder = isDone
    ? halalStatusTokens.halal.base
    : isActive
      ? gold[500]
      : isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";

  const nodeBg = isDone ? halalStatusTokens.halal.base : "transparent";

  const iconColor = isDone
    ? "#fff"
    : isActive
      ? gold[500]
      : isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.15)";

  const textColor = isActive
    ? (isDark ? gold[400] : gold[600])
    : isDone
      ? (isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.45)")
      : (isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.12)");

  const lineColor = isDone
    ? `${halalStatusTokens.halal.base}50`
    : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";

  return (
    <View style={styles.stepRow}>
      <View style={styles.nodeColumn}>
        {isActive && (
          <Animated.View
            style={[
              styles.nodeGlow,
              { backgroundColor: `${gold[500]}20`, borderColor: `${gold[500]}30` },
              glowStyle,
            ]}
          />
        )}
        <Animated.View
          style={[
            styles.node,
            { borderColor: nodeBorder, backgroundColor: nodeBg },
            nodeAnimStyle,
          ]}
        >
          {isDone ? (
            <Animated.View style={checkStyle}>
              <CheckIcon size={14} color="#fff" />
            </Animated.View>
          ) : (
            <AppIcon name={icon} size={13} color={iconColor} />
          )}
        </Animated.View>

        {!isLast && (
          <View style={[styles.line, { backgroundColor: lineColor }]} />
        )}
      </View>

      <View style={styles.labelColumn}>
        <Text
          style={[
            styles.stepLabel,
            { color: textColor },
            isActive && styles.stepLabelActive,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>

        {showMadhabs && isActive && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.madhabRow}>
            {MADHAB_CHIPS.map((name, i) => (
              <Animated.View
                key={name}
                entering={FadeIn.delay(i * 120).duration(250)}
                style={[
                  styles.madhabChip,
                  {
                    backgroundColor: isDark ? `${gold[500]}15` : `${gold[500]}10`,
                    borderColor: `${gold[500]}25`,
                  },
                ]}
              >
                <Text style={[styles.madhabChipText, { color: gold[500] }]}>
                  {name}
                </Text>
              </Animated.View>
            ))}
          </Animated.View>
        )}
      </View>
    </View>
  );
});

// ── ScanLoadingSkeleton ───────────────────────────────────────────────────────

export interface ScanLoadingSkeletonProps {
  barcode?: string;
  /** Called when the stepper has finished all 4 steps (minimum dignity) */
  onComplete?: () => void;
}

export const ScanLoadingSkeleton = React.memo(function ScanLoadingSkeleton({
  barcode,
  onComplete,
}: ScanLoadingSkeletonProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const shimmer = useSharedValue(0.3);

  const [activeIndex, setActiveIndex] = useState(0);
  const [dots, setDots] = useState("");
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setActiveIndex(3);
      onCompleteRef.current?.();
      return;
    }
    const t1 = setTimeout(() => setActiveIndex(1), 350);
    const t2 = setTimeout(() => setActiveIndex(2), 700);
    const t3 = setTimeout(() => setActiveIndex(3), 1050);
    const t4 = setTimeout(() => onCompleteRef.current?.(), 1250);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [reducedMotion]);

  useEffect(() => {
    if (!reducedMotion) {
      shimmer.value = withRepeat(
        withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    }
  }, [reducedMotion]);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 0.5 : shimmer.value,
  }));

  const stepLabels = [
    t.scanResult.stepBarcode,
    t.scanResult.stepProduct,
    t.scanResult.stepIngredients,
    t.scanResult.stepScholars,
  ];

  const bgColors = isDark
    ? (["#0a1a10", "#0f2418", "#132a1a"] as const)
    : (["#ecfdf5", "#d1fae5", "#a7f3d0"] as const);

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#0a1a10" : lightTheme.backgroundSecondary }}>
      <LinearGradient
        colors={[...bgColors]}
        style={[styles.heroGradient, { height: HERO_HEIGHT, paddingTop: insets.top }]}
      >
        <View style={styles.container}>
          {barcode && (
            <View
              style={[
                styles.barcodeChip,
                { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" },
              ]}
            >
              <QrCodeIcon size={14}
                color={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)"} />
              <Text
                style={[
                  styles.barcodeText,
                  { color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)" },
                ]}
              >
                {barcode}
              </Text>
            </View>
          )}

          <View style={styles.stepper}>
            {SCRIBE_ICONS.map((icon, i) => {
              const status: ScribeStatus =
                i < activeIndex ? "completed" : i === activeIndex ? "active" : "pending";
              return (
                <ScribeStepNode
                  key={i}
                  icon={icon}
                  label={stepLabels[i] + (status === "active" ? dots : "")}
                  status={status}
                  isLast={i === 3}
                  reducedMotion={reducedMotion ?? false}
                  isDark={isDark}
                  showMadhabs={i === 3}
                />
              );
            })}
          </View>
        </View>
      </LinearGradient>

      <View style={styles.cardsWrap}>
        <Animated.View
          style={[
            styles.cardLarge,
            { backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" },
            shimmerStyle,
          ]}
        />
        <Animated.View
          style={[
            styles.cardSmall,
            { backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)" },
            shimmerStyle,
          ]}
        />
      </View>
    </View>
  );
});

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  heroGradient: {
    paddingHorizontal: spacing["3xl"],
    paddingBottom: spacing["3xl"],
    overflow: "hidden",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing["3xl"],
  },
  barcodeChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing["3xl"],
  },
  barcodeText: {
    fontSize: fontSizeTokens.caption,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginStart: spacing.sm,
  },
  stepper: {
    paddingStart: spacing.lg,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  nodeColumn: {
    alignItems: "center",
    width: 32,
    marginEnd: spacing.lg,
  },
  node: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    zIndex: 2,
  },
  nodeGlow: {
    position: "absolute",
    top: -4,
    left: -2,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    zIndex: 1,
  },
  line: {
    width: 2,
    height: 22,
    borderRadius: 1,
    marginVertical: 3,
  },
  labelColumn: {
    flex: 1,
    justifyContent: "center",
    minHeight: 28,
    paddingTop: 3,
  },
  stepLabel: {
    fontSize: fontSizeTokens.body,
    fontWeight: fontWeightTokens.medium,
    letterSpacing: 0.2,
  },
  stepLabelActive: {
    fontWeight: fontWeightTokens.bold,
  },
  madhabRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
    flexWrap: "wrap",
  },
  madhabChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  madhabChipText: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.bold,
    letterSpacing: 0.3,
  },
  cardsWrap: { paddingHorizontal: spacing["2xl"], paddingTop: spacing["2xl"] },
  cardLarge: { height: 80, borderRadius: radius.lg },
  cardSmall: { height: 60, borderRadius: radius.lg, marginTop: spacing.lg },
});
