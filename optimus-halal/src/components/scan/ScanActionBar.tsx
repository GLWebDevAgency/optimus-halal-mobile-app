/**
 * ScanActionBar — Fixed Bottom Glass-Morphism Action Bar
 *
 * Contains: Favorite toggle (animated), Share, contextual CTA
 * ("Où acheter?" for halal, "Scanner un autre" for haram/doubtful),
 * and Report button.
 *
 * Glassmorphism: BlurView on iOS, opaque fallback on Android.
 *
 * @module components/scan/ScanActionBar
 */

import React, { useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from "react-native";
import { BarcodeIcon, FlagIcon, HeartIcon, MapPinIcon, ShareNetworkIcon, ShoppingCartIcon } from "phosphor-react-native";
import Animated, {
  SlideInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
  useReducedMotion,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "@/components/ui/PressableScale";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import {
  halalStatus as halalStatusTokens,
  glass,
  lightTheme,
} from "@/theme/colors";
import { fontSize as fontSizeTokens, fontWeight as fontWeightTokens } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import { type HalalStatusKey, STATUS_CONFIG } from "./scan-constants";

// ── Types ──

export interface ScanActionBarProps {
  halalStatus: HalalStatusKey;
  effectiveHeroStatus: HalalStatusKey;
  productIsFavorite: boolean;
  isFavMutating: boolean;
  marketplaceEnabled: boolean;
  onToggleFavorite: () => void;
  onShare: () => void;
  onFindStores: () => void;
  onGoBack: () => void;
  onReport: () => void;
}

// ── Component ──

export function ScanActionBar({
  halalStatus,
  effectiveHeroStatus,
  productIsFavorite,
  isFavMutating,
  marketplaceEnabled,
  onToggleFavorite,
  onShare,
  onFindStores,
  onGoBack,
  onReport,
}: ScanActionBarProps) {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();

  const statusConfig = STATUS_CONFIG[effectiveHeroStatus] ?? STATUS_CONFIG.unknown;

  // ── Favorite animation ──
  const favScale = useSharedValue(1);
  const favRotate = useSharedValue(0);

  const handleFavAnimated = useCallback(() => {
    const wasLiked = productIsFavorite;
    onToggleFavorite();
    if (wasLiked) {
      favScale.value = withSequence(
        withSpring(0.7, { damping: 12, stiffness: 400 }),
        withSpring(1, { damping: 10, stiffness: 250 })
      );
    } else {
      favScale.value = withSequence(
        withSpring(1.4, { damping: 5, stiffness: 350 }),
        withSpring(0.9, { damping: 8, stiffness: 300 }),
        withSpring(1, { damping: 10, stiffness: 200 })
      );
      favRotate.value = withSequence(
        withTiming(-8, { duration: 100 }),
        withTiming(6, { duration: 80 }),
        withSpring(0, { damping: 12, stiffness: 250 })
      );
    }
  }, [onToggleFavorite, productIsFavorite, favScale, favRotate]);

  const favAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: favScale.value },
      { rotate: `${favRotate.value}deg` },
    ],
  }));

  // ── CTA shimmer animation ──
  const shimmerX = useSharedValue(-80);

  useEffect(() => {
    if (!reducedMotion) {
      shimmerX.value = withRepeat(
        withSequence(
          withTiming(300, { duration: 2500, easing: Easing.linear }),
          withTiming(-80, { duration: 0 })
        ),
        -1,
        false
      );
    }
  }, [reducedMotion]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }, { skewX: "-20deg" }],
  }));

  // ── Button content ──
  const actionBarButtons = (
    <View
      style={[
        styles.actionBarInner,
        { borderColor: isDark ? glass.dark.border : `${statusConfig.glowColor}12` },
      ]}
    >
      {/* Favorite */}
      <PressableScale
        onPress={handleFavAnimated}
        disabled={isFavMutating}
        style={[
          styles.actionButton,
          {
            backgroundColor: productIsFavorite
              ? `${halalStatusTokens.haram.base}14`
              : isDark ? glass.dark.bg : `${colors.textMuted}08`,
            opacity: isFavMutating ? 0.5 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={
          productIsFavorite
            ? t.scanResult.removeFromFavorites
            : t.scanResult.addToFavorites
        }
        accessibilityState={{ selected: productIsFavorite, busy: isFavMutating }}
      >
        <Animated.View style={favAnimatedStyle}>
          <HeartIcon
            size={22}
            color={productIsFavorite ? halalStatusTokens.haram.base : colors.textMuted}
            weight={productIsFavorite ? "fill" : "regular"}
          />
        </Animated.View>
      </PressableScale>

      {/* Share */}
      <PressableScale
        onPress={onShare}
        style={[styles.actionButton, { backgroundColor: isDark ? glass.dark.bg : `${colors.textMuted}08` }]}
        accessibilityRole="button"
        accessibilityLabel={t.scanResult.shareProduct}
      >
        <ShareNetworkIcon size={20} color={colors.textMuted} />
      </PressableScale>

      {/* Primary CTA — contextual */}
      {halalStatus === "halal" ? (
        <PressableScale
          onPress={onFindStores}
          style={[
            styles.ctaButton,
            {
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t.scanResult.whereToBuy}
          accessibilityHint={t.scanResult.findStores}
        >
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              shimmerStyle,
              { width: 60, backgroundColor: "rgba(255,255,255,0.18)" },
            ]}
            pointerEvents="none"
          />
          <View style={styles.ctaContent}>
            {marketplaceEnabled
              ? <ShoppingCartIcon size={18} color={lightTheme.textPrimary} weight="bold" />
              : <MapPinIcon size={18} color={lightTheme.textPrimary} weight="fill" />
            }
            <Text style={[styles.ctaText, { color: lightTheme.textPrimary }]}>
              {marketplaceEnabled ? t.scanResult.viewOnMarketplace : t.scanResult.whereToBuy}
            </Text>
          </View>
        </PressableScale>
      ) : (
        <PressableScale
          onPress={onGoBack}
          style={[
            styles.ctaButton,
            {
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t.scanResult.scanAnother}
        >
          <View style={styles.ctaContent}>
            <BarcodeIcon size={18} color={lightTheme.textPrimary} />
            <Text style={[styles.ctaText, { color: lightTheme.textPrimary }]}>
              {t.scanResult.scanAnother}
            </Text>
          </View>
        </PressableScale>
      )}

      {/* Report */}
      <PressableScale
        onPress={onReport}
        style={[styles.actionButton, { backgroundColor: isDark ? glass.dark.bg : `${colors.textMuted}08` }]}
        accessibilityRole="button"
        accessibilityLabel={t.scanResult.report}
      >
        <FlagIcon size={20} color={colors.textMuted} />
      </PressableScale>
    </View>
  );

  return (
    <Animated.View
      entering={SlideInDown.delay(800).duration(500).springify().damping(28).stiffness(120)}
      style={[
        styles.actionBarOuter,
        { paddingBottom: insets.bottom + 12 },
      ]}
    >
      {Platform.OS === "ios" ? (
        <BlurView
          intensity={isDark ? 40 : 60}
          tint={isDark ? "dark" : "light"}
          style={styles.actionBarBlur}
        >
          {actionBarButtons}
        </BlurView>
      ) : (
        <View
          style={[
            styles.actionBarBlur,
            {
              backgroundColor: isDark
                ? "rgba(10, 20, 14, 0.97)"
                : "rgba(255, 255, 255, 0.97)",
            },
          ]}
        >
          {actionBarButtons}
        </View>
      )}
    </Animated.View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  actionBarOuter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  actionBarBlur: {
    overflow: "hidden",
    borderTopLeftRadius: radius["2xl"],
    borderTopRightRadius: radius["2xl"],
  },
  actionBarInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
    paddingHorizontal: spacing["2xl"],
    paddingVertical: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaButton: {
    flex: 1,
    height: 48,
    borderRadius: radius.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    overflow: "hidden",
  },
  ctaContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  ctaText: {
    fontSize: fontSizeTokens.bodySmall,
    fontWeight: fontWeightTokens.bold,
    letterSpacing: 0.3,
  },
});
