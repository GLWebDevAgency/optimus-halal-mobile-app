/**
 * ScanResultTabBar — Inline 3-tab switcher for scan result screen.
 *
 * Tabs: Halal Analysis | Mon Profil | Alternatives
 * Pattern: Glassmorphic bar with sliding indicator (Reanimated spring).
 * Not a navigation tab bar — purely presentational, display:'none' switching.
 */

import React, { useCallback, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useReducedMotion,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme, useTranslation, useHaptics } from "@/hooks";

interface ScanResultTabBarProps {
  activeTab: number;
  onTabChange: (tab: number) => void;
}

interface TabDef {
  icon: keyof typeof MaterialIcons.glyphMap;
  labelKey: "tabHalal" | "tabProfile" | "tabAlternatives";
}

const TABS: TabDef[] = [
  { icon: "verified-user", labelKey: "tabHalal" },
  { icon: "person", labelKey: "tabProfile" },
  { icon: "swap-horiz", labelKey: "tabAlternatives" },
];

const TAB_COUNT = TABS.length;

export const ScanResultTabBar = React.memo(function ScanResultTabBar({
  activeTab,
  onTabChange,
}: ScanResultTabBarProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const { selection } = useHaptics();
  const reducedMotion = useReducedMotion();

  const indicatorX = useSharedValue(activeTab / TAB_COUNT);

  // Sync indicator on programmatic activeTab changes (e.g. CTA "Voir alternatives")
  useEffect(() => {
    const target = activeTab / TAB_COUNT;
    if (reducedMotion) {
      indicatorX.value = target;
    } else {
      indicatorX.value = withSpring(target, { damping: 18, stiffness: 200 });
    }
  }, [activeTab, reducedMotion, indicatorX]);

  const handlePress = useCallback(
    (index: number) => {
      selection();
      if (reducedMotion) {
        indicatorX.value = index / TAB_COUNT;
      } else {
        indicatorX.value = withSpring(index / TAB_COUNT, {
          damping: 18,
          stiffness: 200,
        });
      }
      onTabChange(index);
    },
    [onTabChange, selection, reducedMotion, indicatorX],
  );

  const indicatorStyle = useAnimatedStyle(() => ({
    left: `${indicatorX.value * 100}%`,
    width: `${100 / TAB_COUNT}%`,
  }));

  const barBg = isDark ? "rgba(30,30,30,0.85)" : "rgba(255,255,255,0.9)";
  const indicatorBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const borderColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";

  const content = (
    <View style={[styles.inner, { borderBottomColor: borderColor }]}>
      {/* Sliding indicator */}
      <Animated.View
        style={[styles.indicator, { backgroundColor: indicatorBg }, indicatorStyle]}
      />

      {/* Tabs */}
      {TABS.map((tab, i) => {
        const isActive = activeTab === i;
        const color = isActive ? colors.textPrimary : colors.textMuted;

        return (
          <Pressable
            key={tab.labelKey}
            style={styles.tab}
            onPress={() => handlePress(i)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={t.scanResult[tab.labelKey]}
          >
            <MaterialIcons name={tab.icon} size={20} color={color} />
            <Text
              style={[
                styles.label,
                { color },
                isActive && styles.labelActive,
              ]}
              numberOfLines={1}
            >
              {t.scanResult[tab.labelKey]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  // Glassmorphic on iOS, opaque on Android
  if (Platform.OS === "ios") {
    return (
      <BlurView intensity={60} tint={isDark ? "dark" : "light"} style={styles.container}>
        {content}
      </BlurView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: barBg }]}>
      {content}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 14,
    overflow: "hidden",
  },
  inner: {
    flexDirection: "row",
    height: 44,
    position: "relative",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  indicator: {
    position: "absolute",
    top: 0,
    bottom: 0,
    borderRadius: 14,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.1,
  },
  labelActive: {
    fontWeight: "700",
  },
});
