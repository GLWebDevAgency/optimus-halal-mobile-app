import React, { useEffect } from "react";
import { type ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
  useReducedMotion,
} from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";

interface ShimmerSkeletonProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const ShimmerSkeleton: React.FC<ShimmerSkeletonProps> = ({
  width,
  height,
  borderRadius = 8,
  style,
}) => {
  const { isDark } = useTheme();
  const reducedMotion = useReducedMotion();
  const shimmer = useSharedValue(0.3);

  useEffect(() => {
    if (!reducedMotion) {
      shimmer.value = withRepeat(
        withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
    return () => cancelAnimation(shimmer);
  }, [reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 0.5 : shimmer.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: isDark ? "rgba(19,236,106,0.06)" : "rgba(19,236,106,0.08)",
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

export default ShimmerSkeleton;
