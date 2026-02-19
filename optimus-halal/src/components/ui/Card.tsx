/**
 * Card Component
 *
 * Composant carte réutilisable avec différentes variantes.
 *
 * Android shadow fix: On Android, `elevation` (the only way to get shadows)
 * is clipped by `overflow: hidden` on the same View. The elevated variant
 * uses a nested container pattern:
 *   - Outer: elevation + borderRadius + bg/border (NO overflow hidden)
 *   - Inner: overflow hidden + borderRadius (clips content like images)
 * This only applies on Android for the elevated variant.
 */

import React from "react";
import { View, ViewProps, TouchableOpacity, Platform, StyleSheet } from "react-native";

export interface CardProps extends Omit<ViewProps, 'onBlur' | 'onFocus'> {
  variant?: "elevated" | "outlined" | "filled";
  pressable?: boolean;
  onPress?: () => void;
}

const variantStyles = {
  elevated: `
    bg-white dark:bg-surface-dark
    shadow-soft dark:shadow-soft-dark
    border border-slate-100 dark:border-slate-700/50
  `,
  outlined: `
    bg-transparent
    border border-slate-200 dark:border-slate-700
  `,
  filled: `
    bg-slate-50 dark:bg-surface-dark
    border border-transparent
  `,
};

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
    // Force overflow visible so elevation shadow is not clipped, even if
    // the consumer passes className="overflow-hidden" on the Card.
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
  const isElevated = variant === "elevated";
  const useNestedShadow = isElevated && needsAndroidShadowFix;

  // On Android elevated: outer has no overflow-hidden (shadow not clipped)
  // On all others: single container with overflow-hidden as before
  const baseStyles = useNestedShadow
    ? "rounded-2xl"                    // outer: no overflow-hidden
    : "rounded-2xl overflow-hidden";   // single container: overflow-hidden OK
  const variantStyle = variantStyles[variant];

  if (pressable && onPress) {
    const { style, testID, accessibilityLabel, accessibilityHint } = props;

    if (useNestedShadow) {
      // Android elevated pressable: outer TouchableOpacity (shadow) + inner View (clip)
      return (
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.8}
          className={`${baseStyles} ${variantStyle} ${className}`}
          style={[style, androidElevatedOuter.container]}
          testID={testID}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
        >
          <View style={androidInnerClip.container}>
            {children}
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        className={`${baseStyles} ${variantStyle} ${className}`}
        style={style}
        testID={testID}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
      >
        {children}
      </TouchableOpacity>
    );
  }

  if (useNestedShadow) {
    // Android elevated non-pressable: outer View (shadow) + inner View (clip)
    return (
      <View
        className={`${baseStyles} ${variantStyle} ${className}`}
        style={[props.style, androidElevatedOuter.container]}
        {...props}
      >
        <View style={androidInnerClip.container}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <View className={`${baseStyles} ${variantStyle} ${className}`} style={props.style} {...props}>
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
}) => (
  <View
    className={`px-4 py-3 border-t border-slate-100 dark:border-slate-700/50 ${className}`}
    {...props}
  >
    {children}
  </View>
);

export default Card;
