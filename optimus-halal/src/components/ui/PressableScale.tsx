/**
 * PressableScale — Ultra-premium press micro-interaction
 *
 * Wraps any content with a spring-animated scale-down on press.
 * Uses Reanimated on the UI thread for 0 frame-drop, even during gestures.
 *
 * Usage:
 *   <PressableScale onPress={handleTap}>
 *     <MyCard />
 *   </PressableScale>
 */

import React, { useCallback } from "react";
import { Pressable, type PressableProps, type ViewStyle, type StyleProp } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

interface Props extends Omit<PressableProps, "style"> {
  /** Scale factor when pressed (default 0.97) */
  activeScale?: number;
  /** Layout style applied to the outer Pressable (flex, width, margin…) */
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export const PressableScale = React.memo(function PressableScale({
  activeScale = 0.97,
  style,
  children,
  onPressIn,
  onPressOut,
  ...rest
}: Props) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(
    (e: any) => {
      scale.value = withSpring(activeScale, { damping: 15, stiffness: 300 });
      onPressIn?.(e);
    },
    [activeScale, onPressIn, scale],
  );

  const handlePressOut = useCallback(
    (e: any) => {
      scale.value = withSpring(1, { damping: 12, stiffness: 200 });
      onPressOut?.(e);
    },
    [onPressOut, scale],
  );

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} style={style} {...rest}>
      <Animated.View style={animStyle}>{children}</Animated.View>
    </Pressable>
  );
});

export default PressableScale;
