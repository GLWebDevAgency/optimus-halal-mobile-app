/**
 * EmptyState Component
 *
 * World-class empty state with dark mode, animations, and icon support.
 * Matches the app's NativeWind design system.
 */

import React from "react";
import { View, Text, TouchableOpacity, useColorScheme } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";

export interface EmptyStateProps {
  /** MaterialIcons icon name */
  icon?: keyof typeof MaterialIcons.glyphMap;
  /** Title displayed in bold */
  title: string;
  /** Optional secondary message */
  message?: string;
  /** Action button label */
  actionLabel?: string;
  /** Action button callback */
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      className="flex-1 items-center justify-center px-8 py-12"
    >
      {icon && (
        <Animated.View entering={FadeInUp.delay(100).duration(500)}>
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-6"
            style={{
              backgroundColor: isDark
                ? "rgba(29,229,96,0.1)"
                : "rgba(29,229,96,0.08)",
            }}
          >
            <MaterialIcons
              name={icon}
              size={36}
              color={isDark ? "#1de560" : "#059669"}
            />
          </View>
        </Animated.View>
      )}
      <Text className="text-lg font-bold text-slate-900 dark:text-white text-center mb-2">
        {title}
      </Text>
      {message ? (
        <Text className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6 leading-relaxed">
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <TouchableOpacity
          onPress={onAction}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          className="bg-primary px-6 py-3 rounded-xl"
        >
          <Text className="font-bold text-sm text-white">{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </Animated.View>
  );
};

export default EmptyState;
