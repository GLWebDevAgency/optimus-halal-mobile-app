/**
 * StickyHeaderV2 — Scroll-interpolated sticky header for scan result.
 *
 * Fades in with a slight upward shift as the user scrolls past the hero.
 * Shows: back button + product name + status dot + trust grade badge.
 * Uses BlurView on iOS for a glass effect; opaque surface on Android.
 *
 * @module components/scan/StickyHeaderV2
 */

import React, { useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import Animated, {
  interpolate,
  Extrapolation,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CaretLeftIcon, KnifeIcon, HeartbeatIcon } from "phosphor-react-native";

import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { STATUS_CONFIG, type HalalStatusKey } from "./scan-constants";
import { NaqiyGradeBadge, type TrustGrade } from "./NaqiyGradeBadge";
import { PressableScale } from "@/components/ui/PressableScale";
import { fontSize, fontWeight, fontFamily } from "@/theme/typography";
import { spacing } from "@/theme/spacing";
import { gold } from "@/theme/colors";

// ── Constants ────────────────────────────────────────────

export const STICKY_HEADER_V2_HEIGHT = 52;

// ── Types ────────────────────────────────────────────────

export interface StickyHeaderV2Props {
  scrollY: SharedValue<number>;
  heroHeight: number;
  productName: string;
  effectiveHeroStatus: HalalStatusKey;
  trustGrade?: TrustGrade | null;
  onBackPress: () => void;
  activeTab?: 0 | 1;
  onTabPress?: (index: number) => void;
  scrollProgress?: SharedValue<number>;
}

// ── Component ────────────────────────────────────────────

export const StickyHeaderV2 = React.memo(function StickyHeaderV2({
  scrollY,
  heroHeight,
  productName,
  effectiveHeroStatus,
  trustGrade,
  onBackPress,
  activeTab = 0,
  onTabPress,
  scrollProgress,
}: StickyHeaderV2Props) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const SHOW_START = heroHeight * 0.45;
  const SHOW_END = heroHeight * 0.65;

  const statusColor = STATUS_CONFIG[effectiveHeroStatus]?.color ?? colors.textMuted;

  const animatedContainerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [SHOW_START, SHOW_END],
      [0, 1],
      Extrapolation.CLAMP,
    );

    const translateY = interpolate(
      opacity,
      [0, 1],
      [-8, 0],
      Extrapolation.CLAMP,
    );

    return {
      opacity,
      transform: [{ translateY }],
      pointerEvents: (opacity < 0.1 ? "none" : "auto") as "none" | "auto",
    };
  });

  const backgroundElement = useMemo(() => {
    if (Platform.OS === "ios") {
      return (
        <BlurView
          intensity={isDark ? 50 : 70}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
      );
    }
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: isDark
              ? "rgba(18, 18, 18, 0.97)"
              : "rgba(243, 241, 237, 0.97)",
          },
        ]}
      />
    );
  }, [isDark]);

  return (
    <Animated.View
      style={[
        styles.container,
        { paddingTop: insets.top },
        animatedContainerStyle,
      ]}
    >
      {backgroundElement}

      <View
        style={[
          styles.hairline,
          { backgroundColor: colors.border },
        ]}
      />

      <View style={styles.content}>
        <PressableScale
          onPress={onBackPress}
          accessibilityLabel="Retour"
          accessibilityRole="button"
          style={styles.backButton}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <CaretLeftIcon
            size={22}
            weight="bold"
            color={colors.iconPrimary}
          />
        </PressableScale>

        <Text
          numberOfLines={1}
          style={[
            styles.productName,
            { color: colors.textPrimary },
          ]}
        >
          {productName}
        </Text>

        <View
          style={[
            styles.statusDot,
            { backgroundColor: statusColor },
          ]}
        />

        {trustGrade != null && (
          <NaqiyGradeBadge variant="micro" grade={trustGrade} />
        )}
      </View>

      {/* ── Compact tab bar with icons ── */}
      {onTabPress && (
        <View
          style={[
            styles.tabBar,
            { borderTopColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" },
          ]}
        >
          {[
            { label: t.scanResult.tabHalal, Icon: KnifeIcon, index: 0 as const },
            { label: t.scanResult.tabHealth, Icon: HeartbeatIcon, index: 1 as const },
          ].map(({ label, Icon, index }) => {
            const isSelected = activeTab === index;
            const color = isSelected
              ? (isDark ? gold[400] : gold[700])
              : colors.textMuted;
            return (
              <PressableScale
                key={index}
                onPress={() => onTabPress(index)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={label}
                style={styles.stickyTab}
              >
                <Icon size={14} color={color} weight={isSelected ? "fill" : "regular"} />
                <Text style={[styles.stickyTabLabel, { color }]}>{label}</Text>
                {isSelected && (
                  <View style={[styles.stickyTabIndicator, { backgroundColor: color }]} />
                )}
              </PressableScale>
            );
          })}
        </View>
      )}
    </Animated.View>
  );
});

// ── Styles ───────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    overflow: "hidden",
  },
  hairline: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  content: {
    height: STICKY_HEADER_V2_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  productName: {
    flex: 1,
    fontSize: fontSize.bodySmall,
    fontFamily: fontFamily.semiBold,
    fontWeight: fontWeight.semiBold,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tabBar: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  stickyTab: {
    flex: 1,
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  stickyTabLabel: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semiBold,
    letterSpacing: 0.2,
  },
  stickyTabIndicator: {
    position: "absolute",
    bottom: 0,
    left: "25%",
    right: "25%",
    height: 2,
    borderRadius: 1,
  },
});

export default StickyHeaderV2;
