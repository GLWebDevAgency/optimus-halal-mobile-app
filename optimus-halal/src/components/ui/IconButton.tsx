/**
 * IconButton Component
 *
 * Bouton avec icône uniquement + spring press scale.
 */

import React from "react";
import { View, Text } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useHaptics } from "@/hooks";
import { neutral } from "@/theme/colors";
import { PressableScale } from "./PressableScale";

export interface IconButtonProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "filled" | "outline";
  color?: string;
  badge?: number;
  /** Required for screen readers since icon-only buttons have no visible text */
  accessibilityLabel: string;
  onPress?: () => void;
  disabled?: boolean;
  className?: string;
  testID?: string;
}

const sizeConfig = {
  sm: { button: 44, icon: 18, badge: 14 },
  md: { button: 44, icon: 22, badge: 16 },
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
  disabled,
  className = "",
  testID,
  accessibilityLabel,
}) => {
  const { impact } = useHaptics();
  const sizeStyles = sizeConfig[size];

  const handlePress = () => {
    impact();
    onPress?.();
  };

  return (
    <PressableScale
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      <View
        className={`
          items-center justify-center rounded-full
          ${variantStyles[variant]}
          ${className}
        `}
        style={{
          width: sizeStyles.button,
          height: sizeStyles.button,
        }}
      >
        <MaterialIcons
          name={icon}
          size={sizeStyles.icon}
          color={color || neutral[600]}
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
            <Text className="text-white text-[10px] font-bold">
              {badge > 99 ? "99+" : badge}
            </Text>
          </View>
        )}
      </View>
    </PressableScale>
  );
};

export default IconButton;
