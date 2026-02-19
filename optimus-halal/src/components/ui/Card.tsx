/**
 * Card Component
 * 
 * Composant carte réutilisable avec différentes variantes
 */

import React from "react";
import { View, ViewProps, TouchableOpacity, Platform } from "react-native";

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

export const Card: React.FC<CardProps> = ({
  variant = "elevated",
  pressable = false,
  onPress,
  className = "",
  children,
  ...props
}) => {
  const baseStyles = "rounded-2xl overflow-hidden";
  const variantStyle = variantStyles[variant];
  const androidElevation = variant === "elevated" && Platform.OS === "android" ? { elevation: 2 } : undefined;

  if (pressable && onPress) {
    // Extract only the props compatible with TouchableOpacity
    const { style, testID, accessibilityLabel, accessibilityHint } = props;

    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        className={`${baseStyles} ${variantStyle} ${className}`}
        style={[style, androidElevation]}
        testID={testID}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View className={`${baseStyles} ${variantStyle} ${className}`} style={[props.style, androidElevation]} {...props}>
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
