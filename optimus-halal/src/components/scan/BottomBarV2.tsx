/**
 * BottomBarV2 — Simplified bottom action bar for scan-result.
 *
 * Layout: 2 icon actions (left) + 1 contextual primary CTA (right).
 * Glass background: BlurView on iOS, opaque fallback on Android.
 * Top hairline border. Entry animation: SlideInDown with springNaqiy.
 *
 * @module components/scan/BottomBarV2
 */

import React, { useCallback, useMemo } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import {
  ArrowsClockwise as ArrowsClockwiseIcon,
  Heart as HeartIcon,
  ShareNetwork as ShareNetworkIcon,
  Storefront as StorefrontIcon,
} from "phosphor-react-native";
import Animated, {
  SlideInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { PressableScale } from "@/components/ui/PressableScale";
import { useHaptics, useTheme, useTranslation } from "@/hooks";
import {
  halalStatus as halalStatusTokens,
  glass,
} from "@/theme/colors";
import { fontSize, fontWeight, bodyFontFamily } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import { type HalalStatusKey } from "./scan-constants";

// ── Spring config ────────────────────────────────────────

const SPRING_NAQIY = { damping: 14, stiffness: 170, mass: 0.9 };

// ── CTA presets per status ───────────────────────────────

interface CTAPreset {
  labelKey: "whereToBuy" | "viewAlternatives";
  Icon: typeof StorefrontIcon;
  gradient: [string, string];
  textColor: string;
  shadowColor: string;
}

function getCTAPreset(status: HalalStatusKey): CTAPreset {
  if (status === "haram") {
    return {
      labelKey: "viewAlternatives",
      Icon: ArrowsClockwiseIcon,
      gradient: ["#f97316", "#ea580c"],
      textColor: "#FFFFFF",
      shadowColor: "rgba(249, 115, 22, 0.35)",
    };
  }
  return {
    labelKey: "whereToBuy",
    Icon: StorefrontIcon,
    gradient: ["#22c55e", "#16a34a"],
    textColor: "#FFFFFF",
    shadowColor: "rgba(34, 197, 94, 0.35)",
  };
}

// ── Types ────────────────────────────────────────────────

export interface BottomBarV2Props {
  effectiveHeroStatus: HalalStatusKey;
  productIsFavorite: boolean;
  isFavMutating: boolean;
  marketplaceEnabled?: boolean;
  onToggleFavorite: () => void;
  onShare: () => void;
  onFindStores: () => void;
  onReport: () => void;
}

// ── Component ────────────────────────────────────────────

export const BottomBarV2 = React.memo(function BottomBarV2({
  effectiveHeroStatus,
  productIsFavorite,
  isFavMutating,
  marketplaceEnabled = true,
  onToggleFavorite,
  onShare,
  onFindStores,
}: BottomBarV2Props) {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const { impact } = useHaptics();
  const { t } = useTranslation();

  const ctaPreset = useMemo(
    () => getCTAPreset(effectiveHeroStatus),
    [effectiveHeroStatus],
  );

  // ── Favorite bounce animation ──

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

  const handleShare = useCallback(() => {
    impact();
    onShare();
  }, [impact, onShare]);

  const handleCTA = useCallback(() => {
    impact();
    onFindStores();
  }, [impact, onFindStores]);

  const favColor = productIsFavorite
    ? halalStatusTokens.haram.base
    : colors.textSecondary;

  const iconBtnBg = isDark ? glass.dark.bg : glass.light.bg;
  const borderColor = isDark ? glass.dark.border : glass.light.border;

  const { Icon: CTAIcon } = ctaPreset;
  const showCTA = marketplaceEnabled || ctaPreset.labelKey !== "whereToBuy";

  const barContent = (
    <View
      style={[
        styles.inner,
        {
          paddingBottom: insets.bottom + spacing.md,
          borderColor,
        },
      ]}
    >
      {/* ── Left: icon actions ── */}
      <View style={[styles.leftGroup, !showCTA && styles.leftGroupExpanded]}>
        {/* Favorite */}
        <PressableScale
          onPress={handleFavAnimated}
          disabled={isFavMutating}
          accessibilityRole="button"
          accessibilityLabel={
            productIsFavorite
              ? "Retirer des favoris"
              : "Ajouter aux favoris"
          }
          accessibilityState={{ selected: productIsFavorite, busy: isFavMutating }}
        >
          <Animated.View
            style={[
              styles.iconBtn,
              {
                backgroundColor: iconBtnBg,
                opacity: isFavMutating ? 0.5 : 1,
              },
            ]}
          >
            <Animated.View style={favAnimatedStyle}>
              <HeartIcon
                size={22}
                color={favColor}
                weight={productIsFavorite ? "fill" : "regular"}
              />
            </Animated.View>
          </Animated.View>
        </PressableScale>

        {/* Share */}
        <PressableScale
          onPress={handleShare}
          accessibilityRole="button"
          accessibilityLabel="Partager le produit"
        >
          <View
            style={[
              styles.iconBtn,
              { backgroundColor: iconBtnBg },
            ]}
          >
            <ShareNetworkIcon
              size={22}
              color={colors.textSecondary}
            />
          </View>
        </PressableScale>
      </View>

      {/* ── Right: primary CTA (hidden when marketplace disabled and CTA is store-related) ── */}
      {(marketplaceEnabled || ctaPreset.labelKey !== "whereToBuy") && (
        <PressableScale
          onPress={handleCTA}
          style={styles.ctaWrapper}
          accessibilityRole="button"
          accessibilityLabel={t.scanResult[ctaPreset.labelKey]}
        >
          <LinearGradient
            colors={ctaPreset.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.ctaButton,
              Platform.OS === "ios" && {
                shadowColor: ctaPreset.shadowColor,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 1,
                shadowRadius: 12,
              },
            ]}
          >
            <CTAIcon size={18} color={ctaPreset.textColor} weight="bold" />
            <Text
              style={[
                styles.ctaText,
                { color: ctaPreset.textColor },
              ]}
              numberOfLines={1}
            >
              {t.scanResult[ctaPreset.labelKey]}
            </Text>
          </LinearGradient>
        </PressableScale>
      )}
    </View>
  );

  return (
    <Animated.View
      entering={SlideInDown.springify()
        .damping(SPRING_NAQIY.damping)
        .stiffness(SPRING_NAQIY.stiffness)
        .mass(SPRING_NAQIY.mass)}
    >
      {Platform.OS === "ios" ? (
        <BlurView
          intensity={isDark ? 60 : 80}
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
});

// ── Styles ───────────────────────────────────────────────

const ICON_BTN_SIZE = 44;

const styles = StyleSheet.create({
  blurFill: {
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  leftGroup: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  leftGroupExpanded: {
    flex: 1,
    justifyContent: "center",
    gap: spacing["3xl"],
  },
  iconBtn: {
    width: ICON_BTN_SIZE,
    height: ICON_BTN_SIZE,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaWrapper: {
    flex: 1,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
    borderRadius: radius.xl,
    gap: spacing.md,
  },
  ctaText: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    fontFamily: bodyFontFamily.bold,
  },
});

export default BottomBarV2;
