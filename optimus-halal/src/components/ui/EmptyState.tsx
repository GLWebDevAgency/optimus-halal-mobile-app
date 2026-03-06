/**
 * EmptyState Component
 *
 * World-class empty state with dark mode, animations, and icon support.
 * Matches the app's NativeWind design system.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/hooks";
import { brand } from "@/theme/colors";
import { PressableScale } from "./PressableScale";

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
  const { isDark, colors } = useTheme();

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
                ? "rgba(19,236,106,0.1)"
                : "rgba(19,236,106,0.08)",
            }}
          >
            <MaterialIcons
              name={icon}
              size={36}
              color={colors.primary}
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
        <PressableScale
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <View style={btnStyles.cta}>
            <LinearGradient
              colors={isDark ? ["#FDE08B", "#CFA533"] : [brand.primary, "#0ea64b"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
            />
            <Text style={[btnStyles.ctaText, { color: isDark ? "#1A1A1A" : "#ffffff" }]}>
              {actionLabel}
            </Text>
          </View>
        </PressableScale>
      ) : null}
    </Animated.View>
  );
};

const btnStyles = StyleSheet.create({
  cta: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
});

export default EmptyState;
