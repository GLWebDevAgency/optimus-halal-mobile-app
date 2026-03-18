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
  useAnimatedReaction,
  useSharedValue,
  interpolate,
  Extrapolation,
  runOnJS,
  type SharedValue,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/hooks/useTheme";
import { useHaptics } from "@/hooks";
import { glass } from "@/theme/colors";
import { fontSize as fontSizeTokens, fontWeight as fontWeightTokens } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import { STATUS_CONFIG, type HalalStatusKey } from "./scan-constants";
import { NaqiyGradeBadge, type TrustGrade } from "./NaqiyGradeBadge";
import { CertifierLogo } from "./CertifierLogo";

// ── Types ──

export interface CompactStickyHeaderProps {
  scrollY: SharedValue<number>;
  heroHeight: number;
  productName: string;
  brand: string | null;
  imageUrl: string | null;
  effectiveHeroStatus: HalalStatusKey;
  heroLabel: string;
  certifierData: { id: string; name: string } | null;
  /** Naqiy Trust Grade for micro-badge display */
  trustGrade?: TrustGrade | null;
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
  trustGrade,
  onTrustScorePress,
}: CompactStickyHeaderProps) {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const { impact } = useHaptics();

  const statusConfig = STATUS_CONFIG[effectiveHeroStatus] ?? STATUS_CONFIG.unknown;

  // Haptic feedback when compact header becomes visible
  const wasVisible = useSharedValue(false);
  useAnimatedReaction(
    () => {
      const start = heroHeight * 0.45;
      const end = heroHeight * 0.65;
      return interpolate(scrollY.value, [start, end], [0, 1], Extrapolation.CLAMP) > 0.5;
    },
    (isVisible, prev) => {
      if (isVisible && !prev) {
        wasVisible.value = true;
        runOnJS(impact)();
      }
      if (!isVisible && prev) {
        wasVisible.value = false;
      }
    },
  );

  // Scroll-interpolated entrance animation — tight sync with hero disappearance
  const animatedStyle = useAnimatedStyle(() => {
    const start = heroHeight * 0.45;
    const end = heroHeight * 0.65;
    const progress = interpolate(scrollY.value, [start, end], [0, 1], Extrapolation.CLAMP);
    return {
      opacity: progress,
      transform: [{
        translateY: interpolate(progress, [0, 1], [-20, 0], Extrapolation.CLAMP),
      }],
      pointerEvents: progress > 0.5 ? "auto" as const : "none" as const,
    };
  });

  const headerContent = (
    <View style={styles.inner}>
      {/* Product thumbnail */}
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          placeholder={{ blurhash: "LGF5]+Yk^6#M@-5c,1J5@[or[Q6." }}
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

      {/* Naqiy Trust Grade micro-badge + certifier logo — pressable */}
      {certifierData && (
        <Pressable
          onPress={onTrustScorePress}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          accessibilityLabel={certifierData.name}
          accessibilityRole="button"
          style={styles.certifierGroup}
        >
          {trustGrade && (
            <NaqiyGradeBadge variant="micro" grade={trustGrade} />
          )}
          <CertifierLogo
            certifierId={certifierData.id}
            size={CERTIFIER_LOGO_SIZE}
          />
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

export const COMPACT_HEADER_HEIGHT = 52;
const HEADER_HEIGHT = COMPACT_HEADER_HEIGHT;
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
  certifierGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  borderBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
});
