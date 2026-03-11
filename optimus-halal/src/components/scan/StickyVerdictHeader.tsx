/**
 * StickyVerdictHeader — Compact Header That Appears on Scroll
 *
 * Once the user scrolls past the hero section, this 40pt glassmorphic
 * header slides in from the top with product name, verdict badge,
 * and favorite toggle.
 *
 * Design: Al-Ihsan — springNaqiy entrance, glass surface,
 * gold accents in dark mode.
 *
 * @module components/scan/StickyVerdictHeader
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from "react-native";
import Animated, {
  FadeInUp,
  FadeOutUp,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/hooks/useTheme";
import { halalStatus as halalStatusTokens, glass } from "@/theme/colors";
import { fontSize as fontSizeTokens, fontWeight as fontWeightTokens } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import { STATUS_CONFIG, type HalalStatusKey } from "./scan-constants";

// ── Types ──

export interface StickyVerdictHeaderProps {
  visible: boolean;
  productName: string;
  brand: string | null;
  effectiveHeroStatus: HalalStatusKey;
  heroLabel: string;
}

// ── Component ──

export function StickyVerdictHeader({
  visible,
  productName,
  brand,
  effectiveHeroStatus,
  heroLabel,
}: StickyVerdictHeaderProps) {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();

  const statusConfig = STATUS_CONFIG[effectiveHeroStatus] ?? STATUS_CONFIG.unknown;

  if (!visible) return null;

  const headerContent = (
    <View style={styles.inner}>
      {/* Product name — truncated */}
      <Text
        style={[styles.productName, { color: colors.textPrimary }]}
        numberOfLines={1}
      >
        {productName}{brand ? ` · ${brand}` : ""}
      </Text>

      {/* Verdict badge */}
      <View
        style={[
          styles.verdictBadge,
          { backgroundColor: `${statusConfig.color}18` },
        ]}
      >
        <statusConfig.Icon size={12} color={statusConfig.color} weight={statusConfig.iconWeight} />
        <Text
          style={[styles.verdictText, { color: statusConfig.color }]}
          numberOfLines={1}
        >
          {heroLabel}
        </Text>
      </View>
    </View>
  );

  return (
    <Animated.View
      entering={FadeInUp.duration(250).springify().damping(14).stiffness(170).mass(0.9)}
      exiting={FadeOutUp.duration(150)}
      style={[
        styles.container,
        { paddingTop: insets.top },
      ]}
    >
      {Platform.OS === "ios" ? (
        <BlurView
          intensity={isDark ? 50 : 70}
          tint={isDark ? "dark" : "light"}
          style={[StyleSheet.absoluteFill, {
            backgroundColor: isDark ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.5)",
          }]}
        />
      ) : (
        <View
          style={[StyleSheet.absoluteFill, {
            backgroundColor: isDark ? "rgba(12,12,12,0.95)" : "rgba(243,241,237,0.95)",
          }]}
        />
      )}
      {/* Bottom border */}
      <View style={[
        styles.borderBottom,
        { backgroundColor: isDark ? glass.dark.border : glass.light.borderStrong },
      ]} />
      {headerContent}
    </Animated.View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    overflow: "hidden",
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.md,
    minHeight: 40,
  },
  productName: {
    flex: 1,
    fontSize: fontSizeTokens.bodySmall,
    fontWeight: fontWeightTokens.semiBold,
  },
  verdictBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  verdictText: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.bold,
  },
  borderBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
});
