/**
 * CompactStickyHeader — Scroll-Interpolated Compact Header
 *
 * Replaces StickyVerdictHeader with a smoother, scroll-driven animation.
 * Instead of a boolean visible/hidden toggle, the header's opacity and
 * translateY are interpolated from the parent's shared `scrollY` value,
 * creating a seamless slide-in effect as the user scrolls past the hero.
 *
 * Layout: [product image 28x28] [name . brand] [verdict pill with dot] [certifier 16px]
 * Height: 52pt inner content.
 * Glass background: BlurView on iOS, opaque fallback on Android.
 *
 * @module components/scan/CompactStickyHeader
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Pressable,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  type SharedValue,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/hooks/useTheme";
import { glass } from "@/theme/colors";
import { fontSize as fontSizeTokens, fontWeight as fontWeightTokens } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import { STATUS_CONFIG, type HalalStatusKey } from "./scan-constants";

// ── Types ──

export interface CompactStickyHeaderProps {
  scrollY: SharedValue<number>;
  heroHeight: number;
  productName: string;
  brand: string | null;
  imageUrl: string | null;
  effectiveHeroStatus: HalalStatusKey;
  heroLabel: string;
  certifierData: { name: string; logoUrl?: string | null } | null;
  onTrustScorePress?: () => void;
}

// ── Component ──

export function CompactStickyHeader({
  scrollY,
  heroHeight,
  productName,
  brand,
  imageUrl,
  effectiveHeroStatus,
  heroLabel,
  certifierData,
  onTrustScorePress,
}: CompactStickyHeaderProps) {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();

  const statusConfig = STATUS_CONFIG[effectiveHeroStatus] ?? STATUS_CONFIG.unknown;

  // Scroll-interpolated entrance animation
  const animatedStyle = useAnimatedStyle(() => {
    const start = heroHeight - 60;
    const end = heroHeight;
    return {
      opacity: interpolate(scrollY.value, [start, end], [0, 1], Extrapolation.CLAMP),
      transform: [{
        translateY: interpolate(scrollY.value, [start, end], [-52, 0], Extrapolation.CLAMP),
      }],
    };
  });

  const headerContent = (
    <View style={styles.inner}>
      {/* Product thumbnail */}
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.productImage}
          contentFit="cover"
          transition={150}
        />
      ) : (
        <View style={[styles.productImagePlaceholder, { backgroundColor: colors.buttonSecondary }]} />
      )}

      {/* Product name + brand — truncated */}
      <Text
        style={[styles.productName, { color: colors.textPrimary }]}
        numberOfLines={1}
      >
        {productName}{brand ? ` \u00B7 ${brand}` : ""}
      </Text>

      {/* Verdict pill with colored dot */}
      <View
        style={[
          styles.verdictPill,
          { backgroundColor: `${statusConfig.color}18` },
        ]}
      >
        <View style={[styles.verdictDot, { backgroundColor: statusConfig.color }]} />
        <Text
          style={[styles.verdictText, { color: statusConfig.color }]}
          numberOfLines={1}
        >
          {heroLabel}
        </Text>
      </View>

      {/* Certifier logo — 16px, pressable for trust score */}
      {certifierData && (
        <Pressable
          onPress={onTrustScorePress}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          accessibilityLabel={certifierData.name}
          accessibilityRole="button"
        >
          {certifierData.logoUrl ? (
            <Image
              source={{ uri: certifierData.logoUrl }}
              style={styles.certifierLogo}
              contentFit="contain"
              transition={150}
            />
          ) : (
            <View style={[styles.certifierFallback, { borderColor: colors.textMuted }]}>
              <Text style={[styles.certifierFallbackText, { color: colors.textMuted }]}>
                {certifierData.name.slice(0, 2).toUpperCase()}
              </Text>
            </View>
          )}
        </Pressable>
      )}
    </View>
  );

  return (
    <Animated.View
      style={[
        styles.container,
        { paddingTop: insets.top },
        animatedStyle,
      ]}
      pointerEvents="box-none"
    >
      {/* Glass / opaque background */}
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

const HEADER_HEIGHT = 52;
const PRODUCT_IMAGE_SIZE = 28;
const CERTIFIER_LOGO_SIZE = 16;

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
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    height: HEADER_HEIGHT,
  },
  productImage: {
    width: PRODUCT_IMAGE_SIZE,
    height: PRODUCT_IMAGE_SIZE,
    borderRadius: radius.sm,
  },
  productImagePlaceholder: {
    width: PRODUCT_IMAGE_SIZE,
    height: PRODUCT_IMAGE_SIZE,
    borderRadius: radius.sm,
  },
  productName: {
    flex: 1,
    fontSize: fontSizeTokens.bodySmall,
    fontWeight: fontWeightTokens.semiBold,
  },
  verdictPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  verdictDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  verdictText: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.bold,
  },
  certifierLogo: {
    width: CERTIFIER_LOGO_SIZE,
    height: CERTIFIER_LOGO_SIZE,
    borderRadius: CERTIFIER_LOGO_SIZE * 0.25,
  },
  certifierFallback: {
    width: CERTIFIER_LOGO_SIZE,
    height: CERTIFIER_LOGO_SIZE,
    borderRadius: CERTIFIER_LOGO_SIZE * 0.25,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  certifierFallbackText: {
    fontSize: 6,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  borderBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
});
