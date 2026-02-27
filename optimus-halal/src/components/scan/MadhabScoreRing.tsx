/**
 * MadhabScoreRing — Circular progress ring for per-madhab trust scores.
 *
 * Two visual channels in one compact element:
 * - RING ARC: trust score fill (0-100%), animated clockwise on mount
 * - CENTER ICON: verdict (✓ halal, ⚠ doubtful, ✗ haram)
 *
 * For products without a certifier (no trust score), the ring is hidden
 * and only the verdict icon is shown, larger and centered.
 *
 * Philosophy: The ring INFORMS (how rigorous is the certifier for this school).
 * The icon STATES (what is the ingredient verdict). Two separate signals,
 * never mixed — aligned with Naqiy's informative-not-prescriptive values.
 */

import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { halalStatus, gold } from "@/theme/colors";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ── Size constants ──────────────────────────────────────────────
const RING_SIZE = 40;
const STROKE_WIDTH = 3;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// ── Verdict visuals ─────────────────────────────────────────────
const VERDICT_CONFIG = {
  halal: { icon: "check" as const, color: halalStatus.halal.base },
  doubtful: { icon: "help" as const, color: halalStatus.doubtful.base },
  haram: { icon: "close" as const, color: halalStatus.haram.base },
  unknown: { icon: "help-outline" as const, color: halalStatus.unknown.base },
} as const;

// ── Ring color thresholds (trust score) ─────────────────────────
function getRingColor(score: number): string {
  if (score >= 70) return halalStatus.halal.base;
  if (score >= 40) return halalStatus.doubtful.base;
  return halalStatus.haram.base;
}

interface MadhabScoreRingProps {
  /** School name displayed below the ring */
  label: string;
  /** Ingredient verdict: halal / doubtful / haram */
  verdict: "halal" | "doubtful" | "haram";
  /** Per-madhab trust score (0-100). Null = no certifier → ring hidden */
  trustScore: number | null;
  /** Number of conflicting additives for this school (shown when no trust score) */
  conflictCount?: number;
  /** Whether this is the user's preferred school */
  isUserSchool?: boolean;
  /** Stagger delay index for entry animation */
  staggerIndex?: number;
  /** Show the numeric score in the center instead of the verdict icon */
  showScore?: boolean;
  /** Called when the ring is tapped */
  onPress?: () => void;
}

export const MadhabScoreRing = React.memo(function MadhabScoreRing({
  label,
  verdict,
  trustScore,
  conflictCount = 0,
  isUserSchool = false,
  staggerIndex = 0,
  showScore = false,
  onPress,
}: MadhabScoreRingProps) {
  const { isDark, colors } = useTheme();
  const hasTrustScore = trustScore !== null;
  const verdictConfig = VERDICT_CONFIG[verdict] ?? VERDICT_CONFIG.unknown;

  // ── Animated ring fill ──────────────────────────────────────
  const progress = useSharedValue(0);

  useEffect(() => {
    if (hasTrustScore) {
      progress.value = withDelay(
        staggerIndex * 120,
        withTiming(trustScore / 100, {
          duration: 900,
          easing: Easing.out(Easing.cubic),
        })
      );
    }
  }, [trustScore, hasTrustScore, staggerIndex, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  const ringColor = hasTrustScore ? getRingColor(trustScore) : "transparent";
  const trackColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";

  // ── Icon sizing: larger when no ring ────────────────────────
  const iconSize = hasTrustScore ? 16 : 20;

  // ── Sub-label: trust score number or conflict count ─────────
  const subLabel = hasTrustScore
    ? `${trustScore}`
    : conflictCount > 0
      ? `${conflictCount}`
      : null;

  const subLabelColor = hasTrustScore
    ? ringColor
    : conflictCount > 0
      ? halalStatus.doubtful.base
      : colors.textMuted;

  return (
    <View style={styles.container}>
      {/* ── Ring + Icon ── */}
      <View
        style={[
          styles.ringContainer,
          isUserSchool && {
            borderWidth: 1.5,
            borderColor: `${gold[500]}40`,
            borderRadius: (RING_SIZE + 8) / 2,
            padding: 2,
          },
        ]}
      >
        {hasTrustScore ? (
          <View style={styles.svgContainer}>
            <Svg
              width={RING_SIZE}
              height={RING_SIZE}
              style={{ transform: [{ rotate: "-90deg" }] }}
            >
              {/* Track (background circle) */}
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={trackColor}
                strokeWidth={STROKE_WIDTH}
              />
              {/* Progress arc */}
              <AnimatedCircle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={ringColor}
                strokeWidth={STROKE_WIDTH}
                strokeLinecap="round"
                strokeDasharray={`${CIRCUMFERENCE}`}
                animatedProps={animatedProps}
              />
            </Svg>
            {/* Center: score number or verdict icon */}
            <View style={styles.iconOverlay}>
              {showScore && hasTrustScore ? (
                <Text style={[styles.scoreText, { color: ringColor }]}>
                  {trustScore}
                </Text>
              ) : (
                <MaterialIcons
                  name={verdictConfig.icon}
                  size={iconSize}
                  color={verdictConfig.color}
                />
              )}
            </View>
          </View>
        ) : (
          /* No ring — just the verdict icon, bigger */
          <View
            style={[
              styles.iconOnly,
              {
                backgroundColor: `${verdictConfig.color}${isDark ? "18" : "10"}`,
              },
            ]}
          >
            <MaterialIcons
              name={verdictConfig.icon}
              size={iconSize}
              color={verdictConfig.color}
            />
          </View>
        )}
      </View>

      {/* ── School label ── */}
      {label !== "" && (
        <Text
          style={[
            styles.label,
            { color: isUserSchool ? gold[500] : colors.textSecondary },
            isUserSchool && styles.labelHighlight,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      )}

      {/* ── Sub-label (score or conflict count) ── */}
      {label !== "" && subLabel !== null && (
        <Text style={[styles.subLabel, { color: subLabelColor }]}>
          {hasTrustScore ? subLabel : `${subLabel} ⚠`}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    width: 72,
  },
  ringContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  svgContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  iconOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  iconOnly: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 5,
    letterSpacing: 0.2,
  },
  labelHighlight: {
    fontWeight: "700",
  },
  subLabel: {
    fontSize: 10,
    fontWeight: "700",
    marginTop: 1,
  },
});

export default MadhabScoreRing;
