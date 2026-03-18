/**
 * ScoreRing — Animated SVG Semi-Arc Score Display
 *
 * A 180° top-half arc that fills based on a 0-100 score.
 * Naqiy's signature visual anchor — more elegant than Yuka's solid circle.
 *
 * Uses react-native-svg for the arc and react-native-reanimated
 * for animated stroke-dashoffset fill + counter.
 *
 * @module components/scan/ScoreRing
 */

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedReaction,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { useReducedMotion } from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { halalStatus as halalStatusTokens } from "@/theme/colors";
import { fontSize as fontSizeTokens, fontWeight as fontWeightTokens } from "@/theme/typography";

const AnimatedPath = Animated.createAnimatedComponent(Path);

// ── Types ──

export interface ScoreRingProps {
  /** Score 0-100, or null for no data */
  score: number | null;
  /** Container width (default 80) */
  size?: number;
  /** Arc stroke width (default 5) */
  strokeWidth?: number;
  /** Whether to animate on mount (default true) */
  animated?: boolean;
  /** Optional label below score number */
  label?: string;
  /** Label color override */
  labelColor?: string;
}

// ── Helpers ──

function getScoreColor(score: number | null): string {
  if (score === null) return "#6b7280"; // unknown.base
  if (score >= 70) return halalStatusTokens.halal.base;
  if (score >= 40) return halalStatusTokens.doubtful.base;
  return halalStatusTokens.haram.base;
}

/**
 * Describe a 180° arc (top half) as an SVG path.
 * Arc goes from left to right along the top semicircle.
 */
function describeArc(cx: number, cy: number, r: number): string {
  const startX = cx - r;
  const startY = cy;
  const endX = cx + r;
  const endY = cy;
  return `M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`;
}

// ── Component ──

export function ScoreRing({
  score,
  size = 80,
  strokeWidth = 5,
  animated = true,
  label,
  labelColor,
}: ScoreRingProps) {
  const { isDark } = useTheme();
  const reducedMotion = useReducedMotion();

  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const arcLength = Math.PI * r; // half circle circumference

  const progress = useSharedValue(0);
  const [displayScore, setDisplayScore] = useState(
    reducedMotion || !animated ? (score ?? 0) : 0,
  );

  const scoreColor = getScoreColor(score);
  const trackColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  useEffect(() => {
    const target = score !== null ? score / 100 : 0;
    if (reducedMotion || !animated) {
      progress.value = target;
      setDisplayScore(score ?? 0);
    } else {
      progress.value = withTiming(target, {
        duration: 1200,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [score, animated, reducedMotion]);

  // Animate the counter
  useAnimatedReaction(
    () => Math.round(progress.value * 100),
    (val) => {
      if (!reducedMotion && animated) {
        runOnJS(setDisplayScore)(val);
      }
    },
  );

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: arcLength * (1 - progress.value),
  }));

  const arcPath = describeArc(cx, cy, r);
  const svgHeight = size / 2 + strokeWidth;

  return (
    <View style={[styles.container, { width: size, height: svgHeight }]}>
      <Svg width={size} height={svgHeight} viewBox={`0 0 ${size} ${svgHeight}`}>
        {/* Track */}
        <Path
          d={arcPath}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Fill */}
        {score !== null && (
          <AnimatedPath
            d={arcPath}
            fill="none"
            stroke={scoreColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={arcLength}
            animatedProps={animatedProps}
          />
        )}
      </Svg>

      {/* Score number + label — overlaid inside the arc */}
      <View style={styles.scoreOverlay} pointerEvents="none">
        <Text style={[styles.scoreNumber, { color: scoreColor, fontSize: size * 0.3 }]}>
          {score !== null ? displayScore : "—"}
        </Text>
        {label && (
          <Text style={[styles.scoreLabel, { color: labelColor ?? scoreColor }]}>
            {label}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  scoreOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 2,
  },
  scoreNumber: {
    fontSize: fontSizeTokens.h2,
    fontWeight: fontWeightTokens.black,
  },
  scoreLabel: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.semiBold,
    marginTop: -2,
  },
});
