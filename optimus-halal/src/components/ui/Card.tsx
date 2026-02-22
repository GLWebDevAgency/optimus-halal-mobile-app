/**
 * Card Component
 *
 * Composant carte réutilisable avec différentes variantes.
 * Uses runtime theme tokens from colors.ts for background/border colors,
 * and NativeWind only for layout (rounded, padding, overflow).
 *
 * Android shadow fix: On Android, `elevation` (the only way to get shadows)
 * is clipped by `overflow: hidden` on the same View. The elevated variant
 * uses a nested container pattern:
 *   - Outer: elevation + borderRadius + bg/border (NO overflow hidden)
 *   - Inner: overflow hidden + borderRadius (clips content like images)
 * This only applies on Android for the elevated variant.
 */

import React from "react";
import { View, ViewProps, Platform, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { PressableScale } from "./PressableScale";

export interface CardProps extends Omit<ViewProps, 'onBlur' | 'onFocus'> {
  variant?: "elevated" | "outlined" | "filled";
  pressable?: boolean;
  onPress?: () => void;
}

/**
 * On Android, NativeWind's shadow-soft (CSS boxShadow) produces no visible
 * shadow — Android only supports `elevation`. We apply elevation on the outer
 * wrapper and keep overflow-hidden on an inner wrapper so the shadow is not
 * clipped. rounded-2xl = 1rem = 16px.
 */
const needsAndroidShadowFix = Platform.OS === "android";
const BORDER_RADIUS = 16; // matches rounded-2xl (1rem)

const androidElevatedOuter = StyleSheet.create({
  container: {
    elevation: 2,
    borderRadius: BORDER_RADIUS,
    overflow: "visible" as const,
  },
});

const androidInnerClip = StyleSheet.create({
  container: {
    overflow: "hidden" as const,
    borderRadius: BORDER_RADIUS,
  },
});

export const Card: React.FC<CardProps> = ({
  variant = "elevated",
  pressable = false,
  onPress,
  className = "",
  children,
  ...props
}) => {
  const { colors } = useTheme();
  const isElevated = variant === "elevated";
  const useNestedShadow = isElevated && needsAndroidShadowFix;

  const baseStyles = useNestedShadow
    ? "rounded-2xl"
    : "rounded-2xl overflow-hidden";

  // Runtime theme-aware colors for each variant
  const variantColors = {
    elevated: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    outlined: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: colors.border,
    },
    filled: {
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: "transparent",
    },
  }[variant];

  if (pressable && onPress) {
    const { style, testID, accessibilityLabel, accessibilityHint } = props;

    if (useNestedShadow) {
      return (
        <PressableScale
          onPress={onPress}
          style={[variantColors, style, androidElevatedOuter.container, { borderRadius: BORDER_RADIUS }]}
          testID={testID}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          accessibilityRole="button"
        >
          <View style={androidInnerClip.container}>
            {children}
          </View>
        </PressableScale>
      );
    }

    return (
      <PressableScale
        onPress={onPress}
        style={[variantColors, style, { borderRadius: BORDER_RADIUS, overflow: "hidden" as const }]}
        testID={testID}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
      >
        {children}
      </PressableScale>
    );
  }

  if (useNestedShadow) {
    return (
      <View
        className={`${baseStyles} ${className}`}
        style={[variantColors, props.style, androidElevatedOuter.container]}
        {...props}
      >
        <View style={androidInnerClip.container}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <View className={`${baseStyles} ${className}`} style={[variantColors, props.style]} {...props}>
      {children}
    </View>
  );
};

/**
 * Card Header Component
 */
export const CardHeader: React.FC<ViewProps> = ({
  className = "",
  children,
  ...props
}) => (
  <View className={`p-4 ${className}`} {...props}>
    {children}
  </View>
);

/**
 * Card Content Component
 */
export const CardContent: React.FC<ViewProps> = ({
  className = "",
  children,
  ...props
}) => (
  <View className={`px-4 pb-4 ${className}`} {...props}>
    {children}
  </View>
);

/**
 * Card Footer Component
 */
export const CardFooter: React.FC<ViewProps> = ({
  className = "",
  children,
  ...props
}) => {
  const { colors } = useTheme();
  return (
    <View
      className={`px-4 py-3 ${className}`}
      style={{ borderTopWidth: 1, borderTopColor: colors.borderLight }}
      {...props}
    >
      {children}
    </View>
  );
};

export default Card;
