/**
 * FavoritesTabBar — 2-tab glassmorphic switcher (Produits | Magasins)
 *
 * Cloned from ScanResultTabBar pattern:
 * - BlurView on iOS, opaque on Android
 * - Sliding animated indicator (Reanimated spring)
 * - Haptic feedback on selection
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
import { useTheme, useTranslation, useHaptics } from "@/hooks";
import { AppIcon, type IconName } from "@/lib/icons";

interface FavoritesTabBarProps {
  activeTab: number;
  onTabChange: (tab: number) => void;
  productCount?: number;
  storeCount?: number;
}

interface TabDef {
  icon: IconName;
  labelKey: "productsTab" | "storesTab";
}

const TABS: TabDef[] = [
  { icon: "inventory-2", labelKey: "productsTab" },
  { icon: "store", labelKey: "storesTab" },
];

const TAB_COUNT = TABS.length;

export const FavoritesTabBar = React.memo(function FavoritesTabBar({
  activeTab,
  onTabChange,
  productCount,
  storeCount,
}: FavoritesTabBarProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const { selection } = useHaptics();
  const reducedMotion = useReducedMotion();

  const indicatorX = useSharedValue(activeTab / TAB_COUNT);

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

  const counts = [productCount, storeCount];

  const content = (
    <View style={[styles.inner, { borderBottomColor: borderColor }]}>
      <Animated.View
        style={[styles.indicator, { backgroundColor: indicatorBg }, indicatorStyle]}
      />

      {TABS.map((tab, i) => {
        const isActive = activeTab === i;
        const color = isActive ? colors.textPrimary : colors.textMuted;
        const count = counts[i];

        return (
          <Pressable
            key={tab.labelKey}
            style={styles.tab}
            onPress={() => handlePress(i)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={t.favorites[tab.labelKey]}
          >
            <AppIcon name={tab.icon} size={18} color={color} />
            <Text
              style={[styles.label, { color }, isActive && styles.labelActive]}
              numberOfLines={1}
            >
              {t.favorites[tab.labelKey]}
            </Text>
            {count != null && count > 0 && (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: isActive ? colors.primary : colors.textMuted + "30" },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { color: isActive ? "#fff" : colors.textMuted },
                  ]}
                >
                  {count}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );

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
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.1,
  },
  labelActive: {
    fontWeight: "700",
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
});
