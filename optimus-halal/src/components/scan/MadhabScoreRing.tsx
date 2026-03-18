/**
 * MadhabScoreRing — Premium circular progress ring for per-madhab trust scores.
 *
 * Two visual channels in one element:
 * - RING ARC: trust score fill (0-100%), animated clockwise on mount
 * - CENTER ICON: culturally-appropriate verdict icon
 *
 * Icon philosophy (Al-Niyyah — cultural sensitivity):
 * - handshake      -> halal (agreement, conformity)
 * - shield-warning -> doubtful (caution, uncertainty)
 * - hand-palm      -> haram (stop — NOT a cross symbol)
 * - help-outline   -> unknown (insufficient data)
 *
 * For products without a certifier (no trust score), the ring is hidden
 * and only the verdict icon is shown with a radial glow background.
 *
 * @module components/scan/MadhabScoreRing
 */

import React, { useEffect } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { halalStatus, gold } from "@/theme/colors";
import { AppIcon, type IconName } from "@/lib/icons";
import type { IconWeight } from "phosphor-react-native";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ── Size constants (premium sizing) ──────────────────────────────
const RING_SIZE = 52;
const STROKE_WIDTH = 3.5;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GLOW_SIZE = RING_SIZE + 16;
const CONTAINER_WIDTH = 78;

// ── Verdict visuals (culturally appropriate icons) ───────────────
interface VerdictVisual {
  icon: IconName;
  color: string;
  weight: IconWeight;
}

const VERDICT_CONFIG: Record<string, VerdictVisual> = {
  halal: {
    icon: "handshake",
    color: halalStatus.halal.base,
    weight: "fill",
  },
  doubtful: {
    icon: "shield-warning",
    color: halalStatus.doubtful.base,
    weight: "fill",
  },
  haram: {
    icon: "hand-palm",
    color: halalStatus.haram.base,
    weight: "fill",
  },
  unknown: {
    icon: "help-outline",
    color: halalStatus.unknown.base,
    weight: "regular",
  },
};

// ── Ring color thresholds (trust score) ──────────────────────────
function getRingColor(score: number): string {
  if (score >= 70) return halalStatus.halal.base;
  if (score >= 40) return halalStatus.doubtful.base;
  return halalStatus.haram.base;
}

interface MadhabScoreRingProps {
  /** School name displayed below the ring */
  label: string;
  /** Ingredient verdict: halal / doubtful / haram / unknown */
  verdict: "halal" | "doubtful" | "haram" | "unknown";
  /** Per-madhab trust score (0-100). Null = no certifier -> ring hidden */
  trustScore: number | null;
  /** Translated verdict label: "halal" / "douteux" / "haram" */
  verdictLabel?: string;
  /** Number of conflicting additives for this school (shown when no trust score) */
  conflictCount?: number;
  /** Whether this is the user's preferred school */
  isUserSchool?: boolean;
  /** Whether this is the currently active/selected school */
  isActive?: boolean;
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
  verdictLabel,
  conflictCount = 0,
  isUserSchool = false,
  isActive = false,
  staggerIndex = 0,
  showScore = false,
}: MadhabScoreRingProps) {
  const { isDark, colors } = useTheme();
  const hasTrustScore = trustScore !== null;
  const verdictConfig = VERDICT_CONFIG[verdict] ?? VERDICT_CONFIG.unknown;

  // ── Animated ring fill ──────────────────────────────────────
  const progress = useSharedValue(0);

  useEffect(() => {
    if (hasTrustScore) {
      progress.value = withDelay(
        staggerIndex * 150,
        withTiming(trustScore / 100, {
          duration: 1000,
          easing: Easing.out(Easing.cubic),
        })
      );
    }
  }, [trustScore, hasTrustScore, staggerIndex, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  const ringColor = hasTrustScore ? getRingColor(trustScore) : "transparent";
  const trackColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";

  // Icon sizing: smaller when ring is present (less space), larger without
  const iconSize = hasTrustScore ? 20 : 24;

  // Sub-label: trust score number or conflict count
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
      {/* ── Radial glow behind ring ── */}
      <View
        style={[
          styles.glow,
          {
            backgroundColor: verdictConfig.color,
            opacity: isDark ? 0.14 : 0.08,
          },
          Platform.OS === "ios" && {
            shadowColor: verdictConfig.color,
            shadowOpacity: isDark ? 0.25 : 0.12,
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: 14,
          },
        ]}
      />

      {/* ── Ring wrapper (gold border ONLY for user's profile school,
           scale-up for actively selected school) ── */}
      <View
        style={[
          styles.ringWrapper,
          isActive && styles.activeScale,
          isUserSchool && [
            styles.userSchoolBorder,
            Platform.OS === "ios" && {
              shadowColor: gold[500],
              shadowOpacity: 0.25,
              shadowOffset: { width: 0, height: 0 },
              shadowRadius: 8,
            },
          ],
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
              {/* Animated progress arc */}
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
                <AppIcon
                  name={verdictConfig.icon}
                  size={iconSize}
                  color={verdictConfig.color}
                  weight={verdictConfig.weight}
                />
              )}
            </View>
          </View>
        ) : (
          /* No ring — verdict icon with tinted background */
          <View
            style={[
              styles.iconOnly,
              {
                backgroundColor: `${verdictConfig.color}${isDark ? "14" : "0A"}`,
                borderWidth: 1,
                borderColor: `${verdictConfig.color}${isDark ? "25" : "15"}`,
              },
            ]}
          >
            <AppIcon
              name={verdictConfig.icon}
              size={iconSize}
              color={verdictConfig.color}
              weight={verdictConfig.weight}
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
            isActive && styles.activeLabel,
          ]}
          numberOfLines={1}
        >
          {isUserSchool ? `\u2605 ${label}` : label}
        </Text>
      )}

      {/* ── Verdict pill (colored badge) ── */}
      {label !== "" && verdictLabel && (
        <View
          style={[
            styles.verdictPill,
            {
              backgroundColor: `${verdictConfig.color}${isDark ? "18" : "0E"}`,
              borderColor: `${verdictConfig.color}${isDark ? "30" : "1A"}`,
            },
          ]}
        >
          <Text
            style={[styles.verdictPillText, { color: verdictConfig.color }]}
            numberOfLines={1}
          >
            {verdictLabel}
          </Text>
        </View>
      )}

      {/* ── Sub-label (trust score or conflict count) ── */}
      {label !== "" && !verdictLabel && subLabel !== null && (
        <Text style={[styles.subLabel, { color: subLabelColor }]}>
          {hasTrustScore ? subLabel : `${subLabel} \u26A0`}
        </Text>
      )}
    </View>
  );
});

// ── Styles ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    width: CONTAINER_WIDTH,
  },
  glow: {
    position: "absolute",
    // Center on ring wrapper (RING_SIZE + 8), not on full container
    top: ((RING_SIZE + 8) - GLOW_SIZE) / 2,
    left: (CONTAINER_WIDTH - GLOW_SIZE) / 2,
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    borderRadius: GLOW_SIZE / 2,
  },
  ringWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: RING_SIZE + 8,
    height: RING_SIZE + 8,
    borderRadius: (RING_SIZE + 8) / 2,
  },
  userSchoolBorder: {
    borderWidth: 1.5,
    borderColor: `${gold[500]}50`,
    borderRadius: 999,
  },
  activeScale: {
    transform: [{ scale: 1.1 }],
  },
  activeLabel: {
    fontSize: 12.5,
    fontWeight: "700",
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
    fontSize: 13,
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
    marginTop: 6,
    letterSpacing: 0.2,
  },
  labelHighlight: {
    fontWeight: "700",
  },
  verdictPill: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  verdictPillText: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "lowercase" as const,
    letterSpacing: 0.3,
  },
  subLabel: {
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
});

export default MadhabScoreRing;
