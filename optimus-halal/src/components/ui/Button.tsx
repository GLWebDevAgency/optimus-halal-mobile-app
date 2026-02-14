/**
 * Button Component
 * 
 * Composant bouton réutilisable avec variantes enterprise-grade
 */

import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  TouchableOpacityProps,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useHaptics } from "@/hooks";

export interface ButtonProps extends TouchableOpacityProps {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  haptic?: boolean;
  children: React.ReactNode;
}

const variantStyles = {
  primary: {
    container: "bg-primary-500",
    text: "text-slate-900 font-bold",
    gradient: ["#1de560", "#0fb350"] as const,
  },
  secondary: {
    container: "bg-slate-900 dark:bg-surface-dark",
    text: "text-white font-bold",
    gradient: null,
  },
  outline: {
    container: "bg-transparent border-2 border-slate-200 dark:border-slate-700",
    text: "text-slate-700 dark:text-slate-300 font-semibold",
    gradient: null,
  },
  ghost: {
    container: "bg-transparent",
    text: "text-primary-500 font-semibold",
    gradient: null,
  },
  danger: {
    container: "bg-danger",
    text: "text-white font-bold",
    gradient: ["#ef4444", "#dc2626"] as const,
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
  ...props
}) => {
  const { impact } = useHaptics();
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  const handlePress = async (e: any) => {
    if (haptic) {
      impact();
    }
    onPress?.(e);
  };

  const content = (
    <View className="flex-row items-center justify-center gap-2">
      {icon && iconPosition === "left" && !loading && icon}
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? "#0d1b13" : "#ffffff"}
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
    ${disabled || loading ? "opacity-50" : "active:scale-[0.98]"}
    flex items-center justify-center
    ${className}
  `;

  const a11yProps = {
    accessibilityRole: "button" as const,
    accessibilityState: { disabled: disabled || loading, busy: loading },
  };

  if (variantStyle.gradient && !disabled) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        className={containerClassName}
        {...a11yProps}
        {...props}
      >
        <LinearGradient
          colors={variantStyle.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="absolute inset-0 rounded-2xl"
        />
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      className={`${containerClassName} ${variantStyle.container}`}
      {...a11yProps}
      {...props}
    >
      {content}
    </TouchableOpacity>
  );
};

export default Button;
