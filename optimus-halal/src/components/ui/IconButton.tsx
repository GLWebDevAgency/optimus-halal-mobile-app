/**
 * IconButton Component
 *
 * Bouton avec icône uniquement + spring press scale.
 */

import React from "react";
import { View, Text, StyleSheet, type ViewStyle } from "react-native";
import { useHaptics } from "@/hooks";
import { useTheme } from "@/hooks/useTheme";
import { neutral } from "@/theme/colors";
import { PressableScale } from "./PressableScale";
import { AppIcon, type IconName } from "@/lib/icons";

export interface IconButtonProps {
  icon: IconName;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "filled" | "outline";
  color?: string;
  badge?: number;
  /** Required for screen readers since icon-only buttons have no visible text */
  accessibilityLabel: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
}

const sizeConfig = {
  sm: { button: 44, icon: 18, badge: 14 },
  md: { button: 44, icon: 22, badge: 16 },
  lg: { button: 48, icon: 26, badge: 18 },
};

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  size = "md",
  variant = "default",
  color,
  badge,
  onPress,
  disabled,
  style,
  testID,
  accessibilityLabel,
}) => {
  const { impact } = useHaptics();
  const { isDark } = useTheme();
  const sizeStyles = sizeConfig[size];

  const filledBg = isDark ? "rgba(38,38,38,0.92)" : "#ffffff";
  const filledBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

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
        style={[
          styles.base,
          variant === "filled" && [styles.filled, { backgroundColor: filledBg, borderColor: filledBorder }],
          variant === "outline" && styles.outline,
          {
            width: sizeStyles.button,
            height: sizeStyles.button,
          },
          style,
        ]}
      >
        <AppIcon name={icon}
          size={sizeStyles.icon}
          color={color || neutral[600]} />
        {badge !== undefined && badge > 0 && (
          <View
            style={[
              styles.badge,
              {
                minWidth: sizeStyles.badge,
                height: sizeStyles.badge,
              },
            ]}
          >
            <Text style={styles.badgeText}>
              {badge > 99 ? "99+" : badge}
            </Text>
          </View>
        )}
      </View>
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9999,
  },
  filled: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#ef4444",
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
  },
});

export default IconButton;
