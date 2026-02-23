/**
 * Button Component
 *
 * Composant bouton réutilisable avec variantes enterprise-grade.
 * Uses PressableScale for spring-animated press feedback.
 */

import React from "react";
import {
  Text,
  ActivityIndicator,
  View,
  type ViewStyle,
  type StyleProp,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useHaptics, useTheme } from "@/hooks";
import { semantic, darkTheme, brand, primary } from "@/theme/colors";
import { PressableScale } from "./PressableScale";

export interface ButtonProps {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  haptic?: boolean;
  children: React.ReactNode;
  onPress?: (e?: any) => void;
  className?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const variantStyles = {
  primary: {
    container: "bg-primary-500",
    text: "text-slate-900 font-bold",
    gradient: [brand.primary, primary[600]] as const,
  },
  secondary: {
    container: "bg-slate-900 dark:bg-surface-dark",
    text: "text-white font-bold",
    gradient: null,
  },
  outline: {
    container: "bg-transparent border-2 border-gold-200 dark:border-gold-700",
    text: "text-slate-700 dark:text-slate-300 font-semibold",
    gradient: null,
  },
  ghost: {
    container: "bg-transparent",
    text: "text-gold-500 font-semibold",
    gradient: null,
  },
  danger: {
    container: "bg-danger",
    text: "text-white font-bold",
    gradient: [semantic.danger.base, semantic.danger.dark] as const,
  },
};

const sizeStyles = {
  sm: {
    container: "h-10 px-4 rounded-xl",
    text: "text-sm",
  },
  md: {
    container: "h-12 px-6 rounded-xl",
    text: "text-base",
  },
  lg: {
    container: "h-14 px-8 rounded-2xl",
    text: "text-lg",
  },
};

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  iconPosition = "right",
  fullWidth = false,
  haptic = true,
  children,
  onPress,
  className = "",
  style,
  testID,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { impact } = useHaptics();
  const { isDark } = useTheme();
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  const handlePress = () => {
    if (haptic) impact();
    onPress?.();
  };

  const content = (
    <View className="flex-row items-center justify-center gap-2">
      {icon && iconPosition === "left" && !loading && icon}
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? darkTheme.textInverse : brand.white}
          size="small"
        />
      ) : (
        <Text className={`${variantStyle.text} ${sizeStyle.text}`}>
          {children}
        </Text>
      )}
      {icon && iconPosition === "right" && !loading && icon}
    </View>
  );

  const containerClassName = `
    ${sizeStyle.container}
    ${fullWidth ? "w-full" : ""}
    ${disabled || loading ? "opacity-50" : ""}
    flex items-center justify-center
    ${className}
  `;

  const a11yProps = {
    accessibilityRole: "button" as const,
    accessibilityState: { disabled: disabled || loading, busy: loading },
    accessibilityLabel,
    accessibilityHint,
  };

  const resolvedGradient = variant === "primary" && isDark
    ? (["#FDE08B", "#CFA533"] as const)
    : variantStyle.gradient;

  if (resolvedGradient && !disabled) {
    return (
      <PressableScale
        onPress={handlePress}
        disabled={disabled || loading}
        activeScale={disabled ? 1 : 0.97}
        style={style}
        testID={testID}
        {...a11yProps}
      >
        <View
          className={containerClassName}
          style={{
            overflow: "hidden",
            ...(variant === "primary"
              ? { borderWidth: 1, borderColor: isDark ? "rgba(207,165,51,0.5)" : "rgba(19,236,106,0.3)" }
              : {}),
          }}
        >
          <LinearGradient
            colors={resolvedGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderRadius: 16 }}
          />
          {content}
        </View>
      </PressableScale>
    );
  }

  return (
    <PressableScale
      onPress={handlePress}
      disabled={disabled || loading}
      activeScale={disabled ? 1 : 0.97}
      style={style}
      testID={testID}
      {...a11yProps}
    >
      <View className={`${containerClassName} ${variantStyle.container}`}>
        {content}
      </View>
    </PressableScale>
  );
};

export default Button;
