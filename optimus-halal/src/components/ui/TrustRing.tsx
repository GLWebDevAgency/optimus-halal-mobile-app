import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import Svg, { Path } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedReaction,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { brand } from "@/theme/colors";
import { useTheme } from "@/hooks/useTheme";

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface TrustRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  children?: React.ReactNode;
}

function octagonPath(cx: number, cy: number, r: number): string {
  const points: string[] = [];
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI / 4) * i - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    points.push(`${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return points.join(" ") + " Z";
}

export const TrustRing: React.FC<TrustRingProps> = ({
  score,
  size = 140,
  strokeWidth = 6,
  color = brand.primary,
  children,
}) => {
  const { isDark, colors } = useTheme();
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - strokeWidth) / 2;
  const sideLength = 2 * r * Math.sin(Math.PI / 8);
  const perimeter = 8 * sideLength;
  const pathD = octagonPath(cx, cy, r);

  const progress = useSharedValue(0);
  const animatedScore = useSharedValue(0);
  const [displayScore, setDisplayScore] = useState(0);

  useAnimatedReaction(
    () => Math.round(animatedScore.value),
    (current, previous) => {
      if (current !== previous) {
        runOnJS(setDisplayScore)(current);
      }
    }
  );

  useEffect(() => {
    progress.value = withTiming(score / 100, { duration: 800, easing: Easing.out(Easing.cubic) });
    animatedScore.value = withTiming(score, { duration: 800, easing: Easing.out(Easing.cubic) });
  }, [score]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: perimeter * (1 - progress.value),
  }));

  return (
    <View style={{ alignItems: "center", justifyContent: "center", width: size, height: size }}>
      <Svg width={size} height={size}>
        <Path
          d={pathD}
          fill="none"
          stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}
          strokeWidth={strokeWidth}
        />
        <AnimatedPath
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${perimeter}`}
          animatedProps={animatedProps}
        />
      </Svg>
      <View style={{ position: "absolute", alignItems: "center", justifyContent: "center" }}>
        {children ?? (
          <>
            <Text style={{ fontSize: size * 0.22, fontWeight: "900", color: colors.textPrimary }}>
              {displayScore}
            </Text>
            <Text style={{ fontSize: size * 0.09, fontWeight: "600", color: colors.textSecondary, marginTop: -2 }}>
              %
            </Text>
          </>
        )}
      </View>
    </View>
  );
};

export default TrustRing;
