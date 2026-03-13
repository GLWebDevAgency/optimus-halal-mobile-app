/**
 * ScanResultTabBar — 2-tab bar with gold animated indicator.
 *
 * Features:
 *   - Gold underline indicator animated via Reanimated interpolation on scrollProgress
 *   - Tabs: "Halal" | "Santé" (i18n keys: tabHalal, tabHealth)
 *   - Tab text opacity: active = 1.0, inactive = 0.5 (animated on scroll progress)
 *
 * @module components/scan/ScanResultTabBar
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  type SharedValue,
} from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { gold } from "@/theme/colors";
import { fontSize as fontSizeTokens, fontWeight as fontWeightTokens } from "@/theme/typography";

// ── Constants ──

export const TAB_BAR_HEIGHT = 44;

// ── Types ──

export interface ScanResultTabBarProps {
  activeTab: 0 | 1;
  onTabPress: (index: number) => void;
  scrollProgress: SharedValue<number>;
}

// ── Component ──

export function ScanResultTabBar({
  activeTab,
  onTabPress,
  scrollProgress,
}: ScanResultTabBarProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();

  const tabWidth = width / 2;

  const indicatorColor = isDark ? gold[400] : gold[600];
  const activeTextColor = isDark ? gold[400] : gold[700];

  // Animated indicator translateX: slides from 0 (tab 0) to tabWidth (tab 1)
  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          scrollProgress.value,
          [0, 1],
          [0, tabWidth],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  // Animated opacity for each tab text
  const tab0TextStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollProgress.value,
      [0, 1],
      [1.0, 0.5],
      Extrapolation.CLAMP,
    ),
  }));

  const tab1TextStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollProgress.value,
      [0, 1],
      [0.5, 1.0],
      Extrapolation.CLAMP,
    ),
  }));

  const tabs = [
    {
      label: t.scanResult.tabHalal,
      index: 0 as const,
      animatedTextStyle: tab0TextStyle,
    },
    {
      label: t.scanResult.tabHealth,
      index: 1 as const,
      animatedTextStyle: tab1TextStyle,
    },
  ];

  return (
    <View
      style={[
        styles.container,
        { borderBottomColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" },
      ]}
    >
      {/* Tab buttons */}
      {tabs.map(({ label, index, animatedTextStyle }) => {
        const isSelected = activeTab === index;
        return (
          <Pressable
            key={index}
            style={[styles.tab, { width: tabWidth }]}
            onPress={() => onTabPress(index)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={label}
          >
            <Animated.Text
              style={[
                styles.tabLabel,
                { color: isSelected ? activeTextColor : colors.textMuted },
                animatedTextStyle,
              ]}
            >
              {label}
            </Animated.Text>
          </Pressable>
        );
      })}

      {/* Gold animated indicator */}
      <Animated.View
        style={[
          styles.indicator,
          { width: tabWidth, backgroundColor: indicatorColor },
          indicatorStyle,
        ]}
      />
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  container: {
    height: TAB_BAR_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    height: TAB_BAR_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: fontSizeTokens.bodySmall,
    fontWeight: fontWeightTokens.semiBold,
    letterSpacing: 0.2,
  },
  indicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    height: 2,
  },
});
