/**
 * IconButton Component
 * 
 * Bouton avec icône uniquement
 */

import React from "react";
import { TouchableOpacity, TouchableOpacityProps, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

export interface IconButtonProps extends TouchableOpacityProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "filled" | "outline";
  color?: string;
  badge?: number;
  /** Required for screen readers since icon-only buttons have no visible text */
  accessibilityLabel: string;
}

const sizeConfig = {
  sm: { button: 32, icon: 18, badge: 14 },
  md: { button: 40, icon: 22, badge: 16 },
  lg: { button: 48, icon: 26, badge: 18 },
};

const variantStyles = {
  default: "bg-transparent",
  filled: "bg-white dark:bg-surface-dark shadow-soft dark:shadow-soft-dark border border-slate-100 dark:border-slate-700",
  outline: "bg-transparent border border-slate-200 dark:border-slate-700",
};

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  size = "md",
  variant = "default",
  color,
  badge,
  onPress,
  className = "",
  ...props
}) => {
  const sizeStyles = sizeConfig[size];

  const handlePress = async (e: any) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(e);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      accessibilityRole="button"
      className={`
        items-center justify-center rounded-full
        ${variantStyles[variant]}
        ${className}
      `}
      style={{
        width: sizeStyles.button,
        height: sizeStyles.button,
      }}
      {...props}
    >
      <MaterialIcons
        name={icon}
        size={sizeStyles.icon}
        color={color || "#64748b"}
      />
      {badge !== undefined && badge > 0 && (
        <View
          className="absolute -top-1 -right-1 bg-danger rounded-full items-center justify-center"
          style={{
            minWidth: sizeStyles.badge,
            height: sizeStyles.badge,
            paddingHorizontal: 4,
          }}
        >
          <View className="text-white text-[10px] font-bold">
            {badge > 99 ? "99+" : badge}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default IconButton;
