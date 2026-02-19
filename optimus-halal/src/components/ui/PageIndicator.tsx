/**
 * PageIndicator Component
 * 
 * Indicateurs de pagination pour onboarding et carousels
 */

import React from "react";
import { View, ViewProps } from "react-native";
import Animated, {
  useAnimatedStyle,
  interpolate,
  SharedValue,
} from "react-native-reanimated";
import { brand, neutral } from "@/theme/colors";

export interface PageIndicatorProps extends ViewProps {
  count: number;
  currentIndex: number;
  activeColor?: string;
  inactiveColor?: string;
}

export const PageIndicator: React.FC<PageIndicatorProps> = ({
  count,
  currentIndex,
  activeColor = brand.primary,
  inactiveColor = neutral[200],
  className = "",
  ...props
}) => {
  return (
    <View
      className={`flex-row items-center justify-center gap-2 ${className}`}
      {...props}
    >
      {Array.from({ length: count }).map((_, index) => {
        const isActive = index === currentIndex;
        return (
          <View
            key={index}
            style={{
              width: isActive ? 32 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: isActive ? activeColor : inactiveColor,
            }}
          />
        );
      })}
    </View>
  );
};

/**
 * Animated Page Indicator with scroll position
 */
export interface AnimatedPageIndicatorProps extends ViewProps {
  count: number;
  scrollX: SharedValue<number>;
  pageWidth: number;
  activeColor?: string;
  inactiveColor?: string;
}

export const AnimatedPageIndicator: React.FC<AnimatedPageIndicatorProps> = ({
  count,
  scrollX,
  pageWidth,
  activeColor = brand.primary,
  inactiveColor = neutral[200],
  className = "",
  ...props
}) => {
  return (
    <View
      className={`flex-row items-center justify-center gap-2 ${className}`}
      {...props}
    >
      {Array.from({ length: count }).map((_, index) => (
        <AnimatedDot
          key={index}
          index={index}
          scrollX={scrollX}
          pageWidth={pageWidth}
          activeColor={activeColor}
          inactiveColor={inactiveColor}
        />
      ))}
    </View>
  );
};

interface AnimatedDotProps {
  index: number;
  scrollX: SharedValue<number>;
  pageWidth: number;
  activeColor: string;
  inactiveColor: string;
}

const AnimatedDot: React.FC<AnimatedDotProps> = ({
  index,
  scrollX,
  pageWidth,
  activeColor,
  inactiveColor,
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * pageWidth,
      index * pageWidth,
      (index + 1) * pageWidth,
    ];

    const width = interpolate(
      scrollX.value,
      inputRange,
      [8, 32, 8],
      "clamp"
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.5, 1, 0.5],
      "clamp"
    );

    return {
      width,
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        {
          height: 8,
          borderRadius: 4,
          backgroundColor: activeColor,
        },
        animatedStyle,
      ]}
    />
  );
};

export default PageIndicator;
