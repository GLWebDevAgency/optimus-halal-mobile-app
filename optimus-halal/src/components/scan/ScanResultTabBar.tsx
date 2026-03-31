/**
 * ScanResultTabBar — 2-tab bar with gold animated indicator.
 *
 * Features:
 *   - Gold underline indicator animated via Reanimated interpolation on scrollProgress
 *   - Tabs: "Halal" | "Santé" (i18n keys: tabHalal, tabHealth)
 *   - Tab text opacity: active = 1.0, inactive = 0.5 (animated on scroll progress)
 *   - Self-measuring width via onLayout (works in both inline and sticky contexts)
 *
 * @module components/scan/ScanResultTabBar
 */

import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  type LayoutChangeEvent,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolation,
  type SharedValue,
} from "react-native-reanimated";
import { KnifeIcon, HeartbeatIcon } from "phosphor-react-native";

import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { gold, primary } from "@/theme/colors";
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

  // Self-measured container width (handles both inline padded & sticky full-width).
  const [containerWidth, setContainerWidth] = useState(0);
  const containerWidthSV = useSharedValue(0);

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - containerWidth) > 1) {
      setContainerWidth(w);
      containerWidthSV.value = w;
    }
  };

  const tabWidth = containerWidth > 0 ? containerWidth / 2 : 0;

  // Per-tab brand colors: gold for Halal, green for Santé
  const halalColor = isDark ? gold[400] : gold[700];
  const santeColor = isDark ? primary[400] : primary[700];
  const halalIndicator = isDark ? gold[400] : gold[600];
  const santeIndicator = isDark ? primary[400] : primary[600];

  // Animated indicator: slides + interpolates color from gold → green
  const indicatorStyle = useAnimatedStyle(() => {
    const w = containerWidthSV.value;
    if (w === 0) return { opacity: 0 };
    const halfW = w / 2;
    const progress = scrollProgress.value;
    return {
      opacity: 1,
      backgroundColor: progress < 0.5 ? halalIndicator : santeIndicator,
      transform: [
        {
          translateX: interpolate(
            progress,
            [0, 1],
            [0, halfW],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

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
      Icon: KnifeIcon,
      index: 0 as const,
      animatedTextStyle: tab0TextStyle,
      activeColor: halalColor,
    },
    {
      label: t.scanResult.tabHealth,
      Icon: HeartbeatIcon,
      index: 1 as const,
      animatedTextStyle: tab1TextStyle,
      activeColor: santeColor,
    },
  ];

  return (
    <View
      onLayout={handleLayout}
      style={styles.container}
    >
      {/* Tab buttons */}
      {tabs.map(({ label, Icon, index, animatedTextStyle, activeColor }) => {
        const isSelected = activeTab === index;
        const color = isSelected ? activeColor : colors.textMuted;
        return (
          <Animated.View
            key={index}
            style={[styles.tab, tabWidth > 0 ? { width: tabWidth } : { flex: 1 }, animatedTextStyle]}
          >
            <Pressable
              onPress={() => onTabPress(index)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={label}
              style={styles.tabInner}
            >
              <Icon size={14} color={color} weight={isSelected ? "fill" : "regular"} />
              <Animated.Text style={[styles.tabLabel, { color }]}>
                {label}
              </Animated.Text>
            </Pressable>
          </Animated.View>
        );
      })}

      {/* Animated indicator — gold for Halal, green for Santé */}
      <Animated.View
        style={[
          styles.indicator,
          tabWidth > 0 ? { width: tabWidth } : { width: "50%" },
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
  },
  tab: {
    height: TAB_BAR_HEIGHT,
  },
  tabInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
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
