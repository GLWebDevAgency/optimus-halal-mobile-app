/**
 * Skeleton Component
 *
 * Composant placeholder avec animation shimmer via Reanimated v4.
 * Respecte le mode reduced motion du systeme.
 */

import React, { useEffect } from "react";
import { View, StyleSheet, type ViewStyle, type StyleProp } from "react-native";
import { useTheme } from "@/hooks";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  useReducedMotion,
} from "react-native-reanimated";

// ---------------------------------------------------------------------------
// Base Skeleton
// ---------------------------------------------------------------------------

export interface SkeletonProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  borderRadius = 4,
  style,
}) => {
  const { isDark } = useTheme();
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    if (!reducedMotion) {
      opacity.value = withRepeat(
        withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1, // infinite
        true, // reverse
      );
    }
  }, [reducedMotion, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 0.5 : opacity.value,
  }));

  const baseStyle: ViewStyle = {
    width: width as ViewStyle["width"],
    height,
    borderRadius,
    backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb",
  };

  return (
    <Animated.View
      style={[baseStyle, animatedStyle, style]}
    />
  );
};

// ---------------------------------------------------------------------------
// SkeletonText
// ---------------------------------------------------------------------------

export interface SkeletonTextProps {
  lines?: number;
  lineHeight?: number;
  lineSpacing?: number;
  style?: StyleProp<ViewStyle>;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  lineHeight = 14,
  lineSpacing = 10,
  style,
}) => (
  <View style={style}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        width={i === lines - 1 ? "60%" : "100%"}
        height={lineHeight}
        borderRadius={4}
        style={i < lines - 1 ? { marginBottom: lineSpacing } : undefined}
      />
    ))}
  </View>
);

// ---------------------------------------------------------------------------
// SkeletonCard
// ---------------------------------------------------------------------------

export interface SkeletonCardProps {
  style?: StyleProp<ViewStyle>;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ style }) => (
  <View style={[styles.card, style]}>
    <Skeleton width={80} height={80} borderRadius={8} />
    <View style={styles.cardContent}>
      <SkeletonText lines={3} />
    </View>
  </View>
);

// ---------------------------------------------------------------------------
// SkeletonList
// ---------------------------------------------------------------------------

export interface SkeletonListProps {
  count?: number;
  style?: StyleProp<ViewStyle>;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
  count = 3,
  style,
}) => (
  <View style={style}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} style={i < count - 1 ? { marginBottom: 16 } : undefined} />
    ))}
  </View>
);

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
});

export default Skeleton;
