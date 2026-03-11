/**
 * ScanBottomBar — Fixed bottom action bar for scan results
 *
 * Replaces ScanActionBar with a PremiumTabBar-style layout:
 * 4 slots (icon above label): Favori, Partager, contextual CTA, Signaler.
 *
 * Glass background: BlurView on iOS, opaque fallback on Android.
 * Top hairline border. Entry animation: SlideInDown with springNaqiy.
 *
 * @module components/scan/ScanBottomBar
 */

import React, { useCallback } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import {
  BarcodeIcon,
  FlagIcon,
  HeartIcon,
  ShareNetworkIcon,
  StorefrontIcon,
} from "phosphor-react-native";
import Animated, {
  SlideInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "@/components/ui/PressableScale";
import { useHaptics, useTheme, useTranslation } from "@/hooks";
import {
  halalStatus as halalStatusTokens,
  glass,
} from "@/theme/colors";
import { fontSize as fontSizeTokens, fontWeight as fontWeightTokens } from "@/theme/typography";
import { spacing } from "@/theme/spacing";
import { type HalalStatusKey } from "./scan-constants";

// ── springNaqiy config ──
const SPRING_NAQIY = { damping: 14, stiffness: 170, mass: 0.9 };

// ── Types ──

export interface ScanBottomBarProps {
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

export function ScanBottomBar({
  effectiveHeroStatus,
  productIsFavorite,
  isFavMutating,
  marketplaceEnabled: _marketplaceEnabled,
  onToggleFavorite,
  onShare,
  onFindStores,
  onGoBack,
  onReport,
}: ScanBottomBarProps) {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const { impact, notification } = useHaptics();

  // Determine contextual CTA based on status
  const isPositiveStatus =
    effectiveHeroStatus === "halal" || effectiveHeroStatus === "doubtful";

  // ── Favorite animation ──
  const favScale = useSharedValue(1);
  const favRotate = useSharedValue(0);

  const handleFavAnimated = useCallback(() => {
    impact();
    const wasLiked = productIsFavorite;
    onToggleFavorite();
    if (wasLiked) {
      favScale.value = withSequence(
        withSpring(0.7, { damping: 12, stiffness: 400 }),
        withSpring(1, { damping: 10, stiffness: 250 }),
      );
    } else {
      favScale.value = withSequence(
        withSpring(1.4, { damping: 5, stiffness: 350 }),
        withSpring(0.9, { damping: 8, stiffness: 300 }),
        withSpring(1, { damping: 10, stiffness: 200 }),
      );
      favRotate.value = withSequence(
        withSpring(-8, { damping: 12, stiffness: 400 }),
        withSpring(6, { damping: 12, stiffness: 300 }),
        withSpring(0, { damping: 12, stiffness: 250 }),
      );
    }
  }, [onToggleFavorite, productIsFavorite, favScale, favRotate, impact]);

  const favAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: favScale.value },
      { rotate: `${favRotate.value}deg` },
    ],
  }));

  // ── Handlers ──

  const handleShare = useCallback(() => {
    impact();
    onShare();
  }, [impact, onShare]);

  const handleCTA = useCallback(() => {
    impact();
    if (isPositiveStatus) {
      onFindStores();
    } else {
      onGoBack();
    }
  }, [impact, isPositiveStatus, onFindStores, onGoBack]);

  const handleReport = useCallback(() => {
    notification(Haptics.NotificationFeedbackType.Warning);
    onReport();
  }, [notification, onReport]);

  // ── Slot colors ──
  const favColor = productIsFavorite
    ? halalStatusTokens.haram.base
    : colors.textMuted;
  const mutedColor = colors.textMuted;

  // ── CTA label & icon ──
  const ctaLabel = isPositiveStatus
    ? t.scanResult.whereToBuy
    : t.scanResult.scanAnother;
  const CTAIcon = isPositiveStatus ? StorefrontIcon : BarcodeIcon;

  // ── Bar content ──
  const barContent = (
    <View
      style={[
        styles.inner,
        {
          paddingBottom: insets.bottom + spacing.md,
          borderColor: isDark ? glass.dark.border : glass.light.border,
        },
      ]}
    >
      {/* 1. Favori */}
      <PressableScale
        onPress={handleFavAnimated}
        disabled={isFavMutating}
        style={[styles.slot, { opacity: isFavMutating ? 0.5 : 1 }]}
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
            color={favColor}
            weight={productIsFavorite ? "fill" : "regular"}
          />
        </Animated.View>
        <Text
          style={[
            styles.slotLabel,
            { color: productIsFavorite ? halalStatusTokens.haram.base : mutedColor },
          ]}
          numberOfLines={1}
        >
          {t.scanResult.addToFavorites.split(" ")[0]}
        </Text>
      </PressableScale>

      {/* 2. Partager */}
      <PressableScale
        onPress={handleShare}
        style={styles.slot}
        accessibilityRole="button"
        accessibilityLabel={t.scanResult.shareProduct}
      >
        <ShareNetworkIcon size={22} color={mutedColor} />
        <Text style={[styles.slotLabel, { color: mutedColor }]} numberOfLines={1}>
          {t.scanResult.shareProduct.split(" ")[0]}
        </Text>
      </PressableScale>

      {/* 3. Contextual CTA */}
      <PressableScale
        onPress={handleCTA}
        style={styles.slot}
        accessibilityRole="button"
        accessibilityLabel={ctaLabel}
      >
        <CTAIcon size={22} color={colors.primary} weight="bold" />
        <Text
          style={[styles.slotLabel, { color: colors.primary, fontWeight: fontWeightTokens.semiBold }]}
          numberOfLines={1}
        >
          {ctaLabel}
        </Text>
      </PressableScale>

      {/* 4. Signaler */}
      <PressableScale
        onPress={handleReport}
        style={styles.slot}
        accessibilityRole="button"
        accessibilityLabel={t.scanResult.report}
      >
        <FlagIcon size={22} color={mutedColor} />
        <Text style={[styles.slotLabel, { color: mutedColor }]} numberOfLines={1}>
          {t.scanResult.report.split(" ")[0]}
        </Text>
      </PressableScale>
    </View>
  );

  return (
    <Animated.View
      entering={SlideInDown.springify()
        .damping(SPRING_NAQIY.damping)
        .stiffness(SPRING_NAQIY.stiffness)
        .mass(SPRING_NAQIY.mass)}
      style={styles.outer}
    >
      {Platform.OS === "ios" ? (
        <BlurView
          intensity={isDark ? 50 : 70}
          tint={isDark ? "dark" : "light"}
          style={styles.blurFill}
        >
          {barContent}
        </BlurView>
      ) : (
        <View
          style={[
            styles.blurFill,
            {
              backgroundColor: isDark
                ? "rgba(10, 20, 14, 0.97)"
                : "rgba(255, 255, 255, 0.97)",
            },
          ]}
        >
          {barContent}
        </View>
      )}
    </Animated.View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  outer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  blurFill: {
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  slot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    minHeight: 48,
  },
  slotLabel: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.medium,
    letterSpacing: 0.2,
    textAlign: "center",
  },
});

export default ScanBottomBar;
