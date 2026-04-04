/**
 * Home Dashboard Screen — "Premium Fintech Ethique"
 *
 * 4-section layout:
 * 1. Hero Header — gradient, avatar, Salam greeting, impact stats pill, notification bell
 * 2. Quick Actions — 2x2 grid, primary Scanner card with glow, glass-morphism cards
 * 3. Featured Content — horizontal scroll mixing alerts + articles with cover cards
 * 4. Quick Favorites — Instagram-stories style circles with halal status border
 */

import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  Dimensions,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { Shadow } from "react-native-shadow-2";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowClockwiseIcon, ArrowRightIcon, ArticleIcon, BellIcon, BellSimpleRingingIcon, CaretRightIcon, CloudSlashIcon, HamburgerIcon, HeartIcon, MapPinIcon, MapPinPlusIcon, ScanIcon, StarIcon, StorefrontIcon, UserCirclePlusIcon, WarningIcon } from "phosphor-react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { Avatar, PremiumBackground } from "@/components/ui";
import { PressableScale } from "@/components/ui/PressableScale";
import { HomeSkeleton } from "@/components/skeletons";
import { CertifierLogo } from "@/components/scan/CertifierLogo";
import { openStatusColor, openStatusLabel, STORE_CERTIFIER_TO_ID, STORE_TYPE_COLOR } from "@/components/map/types";
import type { StoreFeatureProperties } from "@/components/map/types";
import { useAuth } from "../_layout";
import { useFavoritesList } from "@/hooks/useFavorites";
import { useStoreFavoritesList } from "@/hooks/useStoreFavorites";
import { useTranslation } from "@/hooks/useTranslation";
import { useTheme } from "@/hooks/useTheme";
import { brand, glass, lightTheme, darkTheme, storeTypeColors } from "@/theme/colors";
import { useHaptics, useUserLocation, useMapStores, usePremium } from "@/hooks";
import { trpc } from "@/lib/trpc";
import { useQuotaStore, useLocalFavoritesStore, useLocalStoreFavoritesStore, useTrialStore, DAILY_SCAN_LIMIT } from "@/store";
import { defaultFeatureFlags } from "@/constants/config";
import { AppIcon, type IconName } from "@/lib/icons";
import { NaqiyBrandSheet } from "@/components/NaqiyBrandSheet";
import { ProfileUpsellSheet } from "@/components/ProfileUpsellSheet";

const logoSource = require("@assets/images/logo_naqiy.webp");
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const STAGGER_MS = 60;

// ---------------------------------------------------------------------------
// Animated ScrollView wrapper
// ---------------------------------------------------------------------------
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

// ---- Impact Stat Pill Item ----
interface StatPillItemProps {
  value: string | number;
  label: string;
  primaryColor: string;
  secondaryColor: string;
}

const StatPillItem = React.memo(function StatPillItem({
  value,
  label,
  primaryColor,
  secondaryColor,
}: StatPillItemProps) {
  return (
    <View className="items-center px-3">
      <Text
        style={{ color: primaryColor }}
        className="text-base font-bold"
      >
        {value}
      </Text>
      <Text
        style={{ color: secondaryColor }}
        className="text-[10px] font-medium mt-0.5"
      >
        {label}
      </Text>
    </View>
  );
});

// ---- Quick Action Card ----
interface QuickActionCardProps {
  icon: IconName;
  title: string;
  subtitle: string;
  onPress: () => void;
  primary?: boolean;
  isDark: boolean;
  iconBgColor?: string;
  iconColor?: string;
  index: number;
}

const QuickActionCard = React.memo(function QuickActionCard({
  icon,
  title,
  subtitle,
  onPress,
  primary = false,
  isDark,
  iconBgColor,
  iconColor,
  index,
}: QuickActionCardProps) {
  const { impact } = useHaptics();

  const handlePress = useCallback(() => {
    impact();
    onPress();
  }, [impact, onPress]);

  if (primary) {
    return (
      <Animated.View
        entering={FadeInDown.delay(240 + index * STAGGER_MS)
          .duration(500)
          .springify()
          .damping(18)}
        style={[styles.quickActionHalf]}
      >
        <Shadow distance={12} startColor={isDark ? "#CFA53340" : "#13ec6a25"} offset={[0, 0]} style={{ borderRadius: 20, width: "100%" }}>
          <PressableScale
            onPress={handlePress}
            accessibilityRole="button"
            accessibilityLabel={title}
            accessibilityHint={subtitle}
          >
            <View style={styles.quickActionPrimary}>
              <LinearGradient
                colors={isDark ? ["#FDE08B", "#CFA533"] : ["#13ec6a", "#0ea64b"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              {/* Glow overlay */}
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: "rgba(255,255,255,0.08)",
                    borderRadius: 20,
                  },
                ]}
              />
              <View style={styles.quickActionContent}>
                <View style={styles.quickActionIconWrapPrimary}>
                  <AppIcon name={icon} size={24} color={isDark ? "#1A1A1A" : "#ffffff"} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.quickActionTitlePrimary, isDark && { color: "#1A1A1A" }]}>{title}</Text>
                  <Text style={[styles.quickActionSubPrimary, isDark && { color: "rgba(26,26,26,0.7)" }]}>{subtitle}</Text>
                </View>
                <ArrowRightIcon size={18} color={isDark ? "rgba(26,26,26,0.5)" : "rgba(255,255,255,0.6)"} />
              </View>
            </View>
          </PressableScale>
        </Shadow>
      </Animated.View>
    );
  }

  // Gold halo gradient direction based on proximity to scanner card (index 0, top-left)
  // index 1 (top-right): glow from left | index 2 (bottom-left): glow from top | index 3 (bottom-right): glow diagonal
  const glowStart = index === 2 ? { x: 0, y: 0 } : index === 3 ? { x: 0, y: 0 } : { x: 0, y: 0 };
  const glowEnd = index === 2 ? { x: 0, y: 0.5 } : index === 3 ? { x: 0.5, y: 0.5 } : { x: 0.5, y: 0 };

  // Glass-morphism card for non-primary
  return (
    <Animated.View
      entering={FadeInDown.delay(240 + index * STAGGER_MS)
        .duration(500)
        .springify()
        .damping(18)}
      style={[styles.quickActionHalf]}
    >
      <Shadow distance={4} startColor={isDark ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.04)"} offset={[0, 1]} style={{ borderRadius: 20, width: "100%" }}>
        <PressableScale
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel={title}
          accessibilityHint={subtitle}
        >
          <View
            style={[
              styles.quickActionGlass,
              {
                backgroundColor: isDark ? glass.dark.bg : glass.light.bg,
                borderColor: isDark
                  ? glass.dark.border
                  : "rgba(212,175,55,0.10)",
              },
            ]}
          >
            {/* Directional halo — radiates from scanner card direction */}
            {/* Dark: gold glow | Light: green glow (like the scanner card) */}
            <LinearGradient
              colors={
                isDark
                  ? ["rgba(207,165,51,0.18)", "rgba(207,165,51,0.07)", "transparent"]
                  : ["rgba(19,236,106,0.12)", "rgba(19,236,106,0.04)", "transparent"]
              }
              start={glowStart}
              end={glowEnd}
              style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
              pointerEvents="none"
            />
            <View style={styles.quickActionContent}>
              <View
                style={[
                  styles.quickActionIconWrap,
                  {
                    backgroundColor:
                      iconBgColor ??
                      (isDark ? "rgba(19,236,106,0.12)" : "rgba(19,236,106,0.08)"),
                  },
                ]}
              >
                <AppIcon name={icon}
                  size={22}
                  color={iconColor ?? brand.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.quickActionTitle,
                    { color: isDark ? darkTheme.textPrimary : lightTheme.textPrimary },
                  ]}
                >
                  {title}
                </Text>
                <Text
                  style={[
                    styles.quickActionSub,
                    { color: isDark ? darkTheme.textSecondary : lightTheme.textSecondary },
                  ]}
                >
                  {subtitle}
                </Text>
              </View>
            </View>
          </View>
        </PressableScale>
      </Shadow>
    </Animated.View>
  );
});

// ---- Alert Quick Action Card (dual badges + pulse) ----
interface AlertQuickActionCardProps {
  title: string;
  subtitle: string;
  isDark: boolean;
  urgentCount: number;
  infoCount: number;
  index: number;
  onPress: () => void;
}

const AlertQuickActionCard = React.memo(function AlertQuickActionCard({
  title,
  subtitle,
  isDark,
  urgentCount,
  infoCount,
  index,
  onPress,
}: AlertQuickActionCardProps) {
  const { impact } = useHaptics();

  const handlePress = useCallback(() => {
    impact();
    onPress();
  }, [impact, onPress]);

  const hasUrgent = urgentCount > 0;

  return (
    <Animated.View
      entering={FadeInDown.delay(240 + index * STAGGER_MS)
        .duration(500)
        .springify()
        .damping(18)}
      style={[styles.quickActionHalf]}
    >
      <Shadow
        distance={4}
        startColor={isDark ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.04)"}
        offset={[0, 1]}
        style={{ borderRadius: 20, width: "100%" }}
      >
        <PressableScale
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel={title}
          accessibilityHint={subtitle}
        >
          <View
            style={[
              styles.quickActionGlass,
              {
                backgroundColor: isDark ? glass.dark.bg : glass.light.bg,
                borderColor: isDark
                  ? glass.dark.border
                  : "rgba(212,175,55,0.10)",
              },
            ]}
          >
            {/* Directional halo from scanner card */}
            <LinearGradient
              colors={
                isDark
                  ? ["rgba(207,165,51,0.18)", "rgba(207,165,51,0.07)", "transparent"]
                  : ["rgba(19,236,106,0.12)", "rgba(19,236,106,0.04)", "transparent"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 0.5 }}
              style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
              pointerEvents="none"
            />
            <View style={styles.quickActionContent}>
              {/* Dual icon badges */}
              <View style={styles.alertBadgesRow}>
                {/* Urgent badge (warning) */}
                <View
                  style={[
                    styles.alertBadgeIcon,
                    {
                      backgroundColor: isDark
                        ? "rgba(245,158,11,0.15)"
                        : "rgba(245,158,11,0.08)",
                    },
                  ]}
                >
                  <WarningIcon size={18} color="#f59e0b" weight={hasUrgent ? "fill" : "regular"} />
                  {urgentCount > 0 && (
                    <View style={[styles.alertCountBadge, { backgroundColor: "#ef4444" }]}>
                      <Text style={styles.alertCountText}>
                        {urgentCount > 9 ? "9+" : urgentCount}
                      </Text>
                    </View>
                  )}
                </View>
                {/* Info badge (bell) */}
                <View
                  style={[
                    styles.alertBadgeIcon,
                    {
                      backgroundColor: isDark
                        ? "rgba(59,130,246,0.15)"
                        : "rgba(59,130,246,0.08)",
                    },
                  ]}
                >
                  <BellSimpleRingingIcon size={18} color="#3b82f6" weight={infoCount > 0 ? "fill" : "regular"} />
                  {infoCount > 0 && (
                    <View style={[styles.alertCountBadge, { backgroundColor: "#3b82f6" }]}>
                      <Text style={styles.alertCountText}>
                        {infoCount > 9 ? "9+" : infoCount}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.quickActionTitle,
                    { color: isDark ? darkTheme.textPrimary : lightTheme.textPrimary },
                  ]}
                >
                  {title}
                </Text>
                <Text
                  style={[
                    styles.quickActionSub,
                    { color: isDark ? darkTheme.textSecondary : lightTheme.textSecondary },
                  ]}
                >
                  {subtitle}
                </Text>
              </View>
            </View>
          </View>
        </PressableScale>
      </Shadow>
    </Animated.View>
  );
});

// ---- Featured Content Card (Alerts + Articles merged) ----
type FeaturedCardType = "alert" | "article";

interface FeaturedCardData {
  id: string;
  type: FeaturedCardType;
  title: string;
  subtitle: string;
  coverImage?: string | null;
  badgeLabel: string;
  badgeColor: string;
  accentColor: string;
  readTime?: number | null;
}

interface FeaturedCardProps {
  item: FeaturedCardData;
  isDark: boolean;
  index: number;
  onPress: () => void;
}

const FeaturedCard = React.memo(function FeaturedCard({
  item,
  isDark,
  index,
  onPress,
}: FeaturedCardProps) {
  return (
    <Animated.View
      entering={FadeInRight.delay(420 + index * 80).duration(500)}
      style={{ marginBottom: 16 }}
    >
      <PressableScale
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={item.title}
        accessibilityHint={item.subtitle}
      >
        <View
          style={[
            styles.featuredCard,
            {
              borderColor: isDark
                ? glass.dark.border
                : glass.light.border,
            },
          ]}
        >
          {/* Background */}
          {item.coverImage ? (
            <Image
              source={{ uri: item.coverImage }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={200}
              accessible={false}
            />
          ) : (
            <LinearGradient
              colors={
                isDark
                  ? [darkTheme.card, darkTheme.background]
                  : ["#f0fdf4", "#ecfdf5"]
              }
              style={StyleSheet.absoluteFill}
            />
          )}

          {/* Scrim overlay */}
          <LinearGradient
            colors={[
              "transparent",
              "rgba(0,0,0,0.35)",
              "rgba(0,0,0,0.85)",
            ]}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* Badge top-left */}
          <View style={styles.featuredBadgeWrap}>
            <View
              style={[
                styles.featuredBadge,
                { backgroundColor: item.badgeColor },
              ]}
            >
              <Text style={styles.featuredBadgeText}>{item.badgeLabel}</Text>
            </View>
          </View>

          {/* Content bottom */}
          <View style={styles.featuredContent}>
            <Text style={styles.featuredTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.featuredSubtitle} numberOfLines={1}>
              {item.subtitle}
            </Text>
          </View>

          {/* Accent left border */}
          <View
            style={[
              styles.featuredAccent,
              { backgroundColor: item.accentColor },
            ]}
          />
        </View>
      </PressableScale>
    </Animated.View>
  );
});

// ---- Discover Store Card (Map Preview) ----
interface DiscoverStoreCardProps {
  store: StoreFeatureProperties;
  isDark: boolean;
  colors: any;
  index: number;
  onPress: () => void;
}

const DiscoverStoreCard = React.memo(function DiscoverStoreCard({
  store,
  isDark,
  colors,
  index,
  onPress,
}: DiscoverStoreCardProps) {
  const { impact } = useHaptics();
  const { t } = useTranslation();

  const handlePress = useCallback(() => {
    impact();
    onPress();
  }, [impact, onPress]);

  const hasOpenStatus = store.openStatus && store.openStatus !== "unknown";
  const statusColor = hasOpenStatus ? openStatusColor(store.openStatus!, isDark) : undefined;
  const certifierId = STORE_CERTIFIER_TO_ID[store.certifier];
  const typeColor = STORE_TYPE_COLOR[store.storeType] ?? STORE_TYPE_COLOR.other;

  return (
    <Animated.View entering={FadeInRight.delay(400 + index * 80).duration(500)}>
      <PressableScale
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`${store.name}${hasOpenStatus ? `, ${openStatusLabel(store.openStatus!, t)}` : ""}`}
      >
        <View
          style={{
            width: 220,
            height: 140,
            borderRadius: 18,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
          }}
        >
          {/* ── Image zone — top ~64% (90px), full opacity ── */}
          <View style={{ height: 90, overflow: "hidden" }}>
            {store.imageUrl ? (
              <Image
                source={{ uri: store.imageUrl }}
                style={{ width: 220, height: 90 }}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}>
                <HamburgerIcon size={32} color={isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"} />
              </View>
            )}

            {/* Glass badges floating over image */}
            {hasOpenStatus && (
              <View style={{
                position: "absolute", top: 7, right: 7,
                flexDirection: "row", alignItems: "center", gap: 3,
                paddingHorizontal: 6, paddingVertical: 3,
                borderRadius: 6,
                backgroundColor: isDark ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.88)",
              }}>
                <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: statusColor }} />
                <Text style={{
                  fontSize: 9, fontWeight: "700",
                  color: statusColor,
                  textTransform: "uppercase",
                  letterSpacing: 0.2,
                }}>
                  {openStatusLabel(store.openStatus!, t)}
                </Text>
              </View>
            )}

            {store.averageRating > 0 && (
              <View style={{
                position: "absolute", top: 7, left: 7,
                flexDirection: "row", alignItems: "center", gap: 2,
                paddingHorizontal: 5, paddingVertical: 3,
                borderRadius: 6,
                backgroundColor: isDark ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.88)",
              }}>
                <StarIcon size={9} color="#f59e0b" weight="fill" />
                <Text style={{ fontSize: 9, fontWeight: "800", color: isDark ? "#fff" : "#111" }}>
                  {store.averageRating.toFixed(1)}
                </Text>
              </View>
            )}
          </View>

          {/* ── Info zone — bottom ~36% (50px), opaque background ── */}
          <View style={{
            flex: 1,
            paddingHorizontal: 10,
            paddingVertical: 6,
            justifyContent: "center",
            backgroundColor: isDark ? "#111" : "#fff",
            gap: 2,
          }}>
            <Text
              style={{ fontSize: 13, fontWeight: "700", color: colors.textPrimary, letterSpacing: -0.2 }}
              numberOfLines={1}
            >
              {store.name}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={{ fontSize: 9.5, fontWeight: "700", color: typeColor }} numberOfLines={1}>
                {store.storeType.toUpperCase()}
              </Text>
              {store.halalCertified && (
                <>
                  <View style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: colors.textMuted }} />
                  <Text style={{ fontSize: 9.5, fontWeight: "700", color: brand.gold }}>
                    CERTIFIÉ
                  </Text>
                  {certifierId && (
                    <CertifierLogo certifierId={certifierId} size={11} />
                  )}
                </>
              )}
            </View>
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
});

// ---- Favorite Circle (Instagram-stories style) ----
interface FavoriteCircleProps {
  id: string;
  name: string;
  image: string;
  isDark: boolean;
  index: number;
  onPress: () => void;
}

const CIRCLE_SIZE = 68;
const CIRCLE_BORDER = 2.5;

const FavoriteCircle = React.memo(function FavoriteCircle({
  name,
  image,
  isDark,
  index,
  onPress,
}: FavoriteCircleProps) {
  return (
    <Animated.View
      entering={FadeInRight.delay(540 + index * 70).duration(400)}
    >
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={name}
        onPress={onPress}
        style={styles.favCircleTouch}
      >
        {/* Gradient ring */}
        <LinearGradient
          colors={isDark ? ["#D4AF37", "#CFA533", "#FDE08B"] : ["#13ec6a", "#0ea64b", "#D4AF37"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.favGradientRing}
        >
          <View
            style={[
              styles.favInnerRing,
              {
                backgroundColor: isDark ? darkTheme.background : lightTheme.background,
              },
            ]}
          >
            {image ? (
              <Image
                source={{ uri: image }}
                style={styles.favImage}
                contentFit="cover"
                transition={200}
                accessibilityLabel={`Photo de ${name}`}
              />
            ) : (
              <View
                style={[
                  styles.favImage,
                  {
                    backgroundColor: isDark ? darkTheme.card : "#f3f4f6",
                    alignItems: "center",
                    justifyContent: "center",
                  },
                ]}
              >
                <HamburgerIcon size={22}
                  color={isDark ? "#475569" : "#94a3b8"} />
              </View>
            )}
          </View>
        </LinearGradient>
        <Text
          style={[
            styles.favName,
            { color: isDark ? darkTheme.textSecondary : lightTheme.textSecondary },
          ]}
          numberOfLines={2}
        >
          {name}
        </Text>
      </PressableScale>
    </Animated.View>
  );
});

// ---- Favorite Store Circle (store type colored ring) ----
interface FavoriteStoreCircleProps {
  id: string;
  name: string;
  image: string;
  storeType: string;
  isDark: boolean;
  index: number;
  onPress: () => void;
}

const STORE_TYPE_RING_COLORS: Record<string, string[]> = {
  butcher: ["#ef4444", "#f87171", "#fca5a5"],
  restaurant: ["#f97316", "#fb923c", "#fdba74"],
  supermarket: ["#3b82f6", "#60a5fa", "#93c5fd"],
  bakery: ["#D4AF37", "#e6c04b", "#fde68a"],
  wholesaler: ["#06b6d4", "#22d3ee", "#67e8f9"],
  abattoir: ["#8b5cf6", "#a78bfa", "#c4b5fd"],
  online: ["#10b981", "#34d399", "#6ee7b7"],
  other: ["#6b7280", "#9ca3af", "#d1d5db"],
};

const FavoriteStoreCircle = React.memo(function FavoriteStoreCircle({
  name,
  image,
  storeType,
  isDark,
  index,
  onPress,
}: FavoriteStoreCircleProps) {
  const ringColors = STORE_TYPE_RING_COLORS[storeType] ?? STORE_TYPE_RING_COLORS.other;
  const storeIcon = storeTypeColors[storeType as keyof typeof storeTypeColors]?.icon ?? "store";

  return (
    <Animated.View
      entering={FadeInRight.delay(540 + index * 70).duration(400)}
    >
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={name}
        onPress={onPress}
        style={styles.favCircleTouch}
      >
        <LinearGradient
          colors={ringColors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.favGradientRing}
        >
          <View
            style={[
              styles.favInnerRing,
              { backgroundColor: isDark ? darkTheme.background : lightTheme.background },
            ]}
          >
            {image ? (
              <Image
                source={{ uri: image }}
                style={styles.favImage}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View
                style={[
                  styles.favImage,
                  {
                    backgroundColor: isDark ? darkTheme.card : "#f3f4f6",
                    alignItems: "center",
                    justifyContent: "center",
                  },
                ]}
              >
                <AppIcon name={storeIcon}
                  size={22}
                  color={ringColors[0]} />
              </View>
            )}
          </View>
        </LinearGradient>
        <Text
          style={[
            styles.favName,
            { color: isDark ? darkTheme.textSecondary : lightTheme.textSecondary },
          ]}
          numberOfLines={2}
        >
          {name}
        </Text>
      </PressableScale>
    </Animated.View>
  );
});

// ============================================================================
// MAIN HOME SCREEN
// ============================================================================

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { isDark, isRamadan, colors } = useTheme();
  const { impact } = useHaptics();
  const { t } = useTranslation();
  const { isPremium, isTrialActive, trialDaysRemaining } = usePremium();

  // Pause store polling when home tab is not visible — saves battery & network
  const [isTabFocused, setIsTabFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setIsTabFocused(true);
      return () => setIsTabFocused(false);
    }, [])
  );

  // ---- Auth state from context (reactive, provided by AppInitializer) ----
  const { user: me, isGuest, isAuthLoading, isAuthError, refetchAuth } = useAuth();
  const isReady = !isAuthLoading;

  // ---- Quick Favorites tab (products | stores) ----
  const [favTab, setFavTab] = useState<"products" | "stores">("products");
  const [brandSheetVisible, setBrandSheetVisible] = useState(false);
  const [profileUpsellVisible, setProfileUpsellVisible] = useState(false);

  // ---- Map Stores (Around You) ----
  const { location: userLocation } = useUserLocation();
  const storesQuery = useMapStores(
    userLocation
      ? {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          radiusKm: 20,
        }
      : {
          // Fallback to Paris center if location denied/unavailable
          latitude: 48.8566,
          longitude: 2.3522,
          radiusKm: 20,
        },
    { limit: 5, refetchInterval: isTabFocused ? 2 * 60_000 : undefined }
  );
  const nearbyStores = useMemo(() => storesQuery.data ?? [], [storesQuery.data]);

  const favoritesQuery = useFavoritesList({ limit: 8, enabled: !!me });
  const localFavorites = useLocalFavoritesStore((s) => s.favorites);
  const localFavFull = useLocalFavoritesStore((s) => s.isFull());
  const storeFavoritesQuery = useStoreFavoritesList({ limit: 8, enabled: !!me });
  const localStoreFavorites = useLocalStoreFavoritesStore((s) => s.favorites);

  const dashboardQuery = trpc.stats.userDashboard.useQuery(undefined, {
    enabled: !!me,
    staleTime: 60_000,
  });
  const unreadQuery = trpc.notification.getUnreadCount.useQuery(undefined, {
    enabled: !!me,
    staleTime: 30_000,
  });
  const alertUnreadQuery = trpc.alert.getUnreadCount.useQuery(undefined, {
    enabled: !!me && defaultFeatureFlags.alertsEnabled,
    staleTime: 30_000,
  });

  // Refetch unread counts every time the home tab is focused
  // (e.g. after reading alerts, scanning products, navigating back)
  useFocusEffect(
    useCallback(() => {
      if (me) {
        unreadQuery.refetch();
        alertUnreadQuery.refetch();
      }
    }, [me?.id]),
  );

  const articlesQuery = trpc.article.list.useQuery(
    { limit: 5 },
    { enabled: true, staleTime: 120_000 },
  );

  // ---- Quota (anonymous) ----
  const quotaUsed = useQuotaStore((s) => s.dailyScansUsed);

  // ---- Derived data ----
  const userName = useMemo(() => {
    if (me?.displayName) return me.displayName.split(" ")[0];
    return null;
  }, [me]);

  const hasAvatar = !!me?.avatarUrl;

  const totalScans = dashboardQuery.data?.totalScans ?? 0;
  const totalReports = dashboardQuery.data?.totalReports ?? 0;
  const userLevel = me?.level ?? 1;
  const currentStreak = me?.currentStreak ?? 0;
  const unreadCount = unreadQuery.data?.count ?? 0;
  const alertUnreadCount = alertUnreadQuery.data?.count ?? 0;
  const alertUrgentCount = alertUnreadQuery.data?.urgent ?? 0;
  const alertInfoCount = alertUnreadQuery.data?.info ?? 0;

  const favoriteProducts = useMemo(() => {
    if (isGuest) {
      return localFavorites.map((f) => ({
        id: f.productId,
        name: f.name,
        image: f.imageUrl ?? "",
      }));
    }
    return (favoritesQuery.data ?? [])
      .filter((f) => f.product !== null)
      .map((f) => ({
        id: f.id,
        name: f.product!.name,
        image: f.product!.imageUrl ?? "",
      }));
  }, [isGuest, localFavorites, favoritesQuery.data]);

  const favoriteStores = useMemo(() => {
    if (isGuest) {
      return localStoreFavorites.map((f) => ({
        id: f.storeId,
        name: f.name,
        image: f.imageUrl ?? "",
        storeType: f.storeType,
      }));
    }
    return (storeFavoritesQuery.data ?? []).map((f) => ({
      id: f.store.id,
      name: f.store.name,
      image: f.store.imageUrl ?? f.store.logoUrl ?? "",
      storeType: f.store.storeType,
    }));
  }, [isGuest, localStoreFavorites, storeFavoritesQuery.data]);

  // ---- Featured content: articles only (alerts are in Veille éthique) ----
  const featuredItems = useMemo<FeaturedCardData[]>(() => {
    const items: FeaturedCardData[] = [];

    const articles = articlesQuery.data?.items ?? [];
    for (const article of articles.slice(0, 5)) {
      items.push({
        id: `article-${article.id}`,
        type: "article",
        title: article.title,
        subtitle:
          article.excerpt ??
          `${article.readTimeMinutes ?? 3} min · ${article.author}`,
        coverImage: article.coverImage,
        badgeLabel:
          article.type === "partner_news"
            ? t.home.partnerBadge
            : article.type === "educational"
              ? t.home.guideBadge
              : t.home.blogBadge,
        badgeColor:
          article.type === "partner_news"
            ? brand.gold
            : article.type === "educational"
              ? colors.primary
              : "rgba(255,255,255,0.25)",
        accentColor: colors.primary,
        readTime: article.readTimeMinutes,
      });
    }

    return items;
  }, [articlesQuery.data?.items, t, colors.primary]);

  const hasApiError = dashboardQuery.isError && isAuthError;

  // ---- Pull-to-refresh ----
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchAuth(),
      dashboardQuery.refetch(),
      unreadQuery.refetch(),
      alertUnreadQuery.refetch(),
      articlesQuery.refetch(),
      favoritesQuery.refetch(),
    ]);
    setRefreshing(false);
  }, [
    refetchAuth,
    dashboardQuery,
    unreadQuery,
    alertUnreadQuery,
    articlesQuery,
    favoritesQuery,
  ]);

  // ---- Parallax scroll ----
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const heroAnimStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [-100, 0, 150],
          [50, 0, -40],
          Extrapolation.CLAMP,
        ),
      },
    ],
    opacity: interpolate(
      scrollY.value,
      [0, 200],
      [1, 0.85],
      Extrapolation.CLAMP,
    ),
  }));

  // ---- Navigation handlers ----
  const handleNavigate = useCallback(
    (route: string, params?: Record<string, string>) => {
      impact();
      if (route === "scanner") router.navigate("/(tabs)/scanner");
      else if (route === "map") router.navigate("/(tabs)/map");
      else if (route === "alerts") router.navigate("/(tabs)/alerts");
      else if (route === "history")
        router.push("/settings/scan-history" as any);
      else if (route === "favorites") {
        const query = params ? `?${new URLSearchParams(params).toString()}` : "";
        router.push(`/settings/favorites${query}` as any);
      }
    },
    [impact],
  );

  const handleFeaturedPress = useCallback(
    (item: FeaturedCardData) => {
      impact();
      if (item.type === "article") {
        const articleId = item.id.replace("article-", "");
        router.push(`/articles/${articleId}`);
      }
    },
    [impact],
  );

  // ---- Skeleton ----
  if (!isReady) return <HomeSkeleton />;

  // ---- Render ----
  return (
    <View style={{ flex: 1 }}>
      {/* Ultra-premium ambient background */}
      <PremiumBackground />

      <AnimatedScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: 110,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressViewOffset={insets.top}
          />
        }
      >
        {/* ====================================================
            SECTION 1: HERO HEADER
            ==================================================== */}
        <Animated.View style={[{ paddingHorizontal: 20 }, heroAnimStyle]}>
          {/* Row: Avatar + Greeting + Brand + BellIcon */}
          <Animated.View
            entering={FadeInDown.delay(0).duration(500).springify().damping(20)}
            style={styles.headerRow}
          >
            <Pressable
              style={styles.headerLeft}
              onPress={() => {
                if (isPremium) {
                  router.push("/(tabs)/profile");
                } else {
                  setProfileUpsellVisible(true);
                }
              }}
              accessibilityRole="button"
              accessibilityLabel={isPremium ? t.home.editProfile : t.home.discoverNaqiyPlus}
            >
              {hasAvatar ? (
                <Avatar
                  size="lg"
                  source={me?.avatarUrl ?? undefined}
                  fallback={userName ?? "N"}
                  borderColor={isPremium ? "none" : "primary"}
                  premiumRing={isPremium}
                />
              ) : (
                <View style={[
                  styles.avatarPlaceholder,
                  {
                    borderWidth: isPremium ? 0 : 2,
                    borderColor: isPremium ? undefined : brand.primary,
                  },
                ]}>
                  {isPremium && (
                    <LinearGradient
                      colors={["#D4AF37", "#F5E6A3", "#CFA533", "#D4AF37"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[StyleSheet.absoluteFill, { borderRadius: 27 }]}
                    />
                  )}
                  <View style={[
                    styles.avatarPlaceholderInner,
                    { backgroundColor: isDark ? "#0C0C0C" : colors.background },
                  ]}>
                    <UserCirclePlusIcon
                      size={26}
                      color={isDark ? "#ffffff" : "#1a1a1a"}
                      weight="duotone"
                    />
                  </View>
                </View>
              )}
              <View style={{ marginStart: 12 }}>
                {userName ? (
                  <>
                    <Text
                      style={[
                        styles.greetingLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {isRamadan ? t.home.greetingRamadan : t.home.greeting}
                    </Text>
                    <Text
                      style={[
                        styles.greetingName,
                        { color: colors.textPrimary },
                      ]}
                    >
                      {userName}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text
                      style={[
                        styles.greetingLabel,
                        { color: colors.textPrimary, fontWeight: "700" },
                      ]}
                    >
                      {isRamadan ? t.home.greetingRamadan.replace(",", "") : t.home.greetingNoName}
                    </Text>
                    <Text
                      style={[
                        styles.greetingLabel,
                        { color: colors.textSecondary, fontWeight: "300" },
                      ]}
                    >
                      {t.home.greetingSubtitle}
                    </Text>
                  </>
                )}
              </View>
            </Pressable>

            {/* Right: Brand Mark + Notification BellIcon */}
            <View style={styles.headerRight}>
              {/* Naqiy brand mark — opens NaqiyBrandSheet */}
              <Pressable
                onPress={() => setBrandSheetVisible(true)}
                accessibilityRole="button"
                accessibilityLabel={isPremium ? "Naqiy+" : "Naqiy"}
                style={styles.brandMark}
              >
                <View style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  backgroundColor: isDark ? "rgba(212, 175, 55, 0.08)" : "rgba(212, 175, 55, 0.05)",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Image
                    source={logoSource}
                    style={{ width: 28, height: 28 }}
                    contentFit="contain"
                    cachePolicy="memory-disk"
                  />
                </View>
                <Text style={[styles.brandMarkText, { color: colors.textPrimary }]}>
                  Naqiy{isPremium && (
                    <Text style={{ color: brand.gold, fontWeight: "800" }}>+</Text>
                  )}
                </Text>
              </Pressable>

              {/* Notification BellIcon — hidden when alerts feature flag is off */}
              {defaultFeatureFlags.alertsEnabled && (
                <Pressable
                  onPress={() => router.navigate("/(tabs)/alerts")}
                  accessibilityRole="button"
                  accessibilityLabel={t.common.notifications}
                  accessibilityHint={t.common.viewAlerts}
                  style={[
                    styles.bellButton,
                    {
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.06)"
                        : "rgba(255,255,255,0.7)",
                      borderColor: isDark
                        ? "rgba(207,165,51,0.15)"
                        : "rgba(212,175,55,0.12)",
                    },
                  ]}
                >
                  <BellIcon size={22}
                    color={isDark ? brand.gold : colors.textPrimary} />
                  {(unreadCount + alertUnreadCount) > 0 && (
                    <View style={styles.bellBadge}>
                      <Text style={styles.bellBadgeText}>
                        {(unreadCount + alertUnreadCount) > 9 ? "9+" : unreadCount + alertUnreadCount}
                      </Text>
                    </View>
                  )}
                </Pressable>
              )}
            </View>
          </Animated.View>

          {/* Impact Stats Pill — gamification gated */}
          {!isGuest && defaultFeatureFlags.gamificationEnabled && (
          <Animated.View
            entering={FadeInDown.delay(STAGGER_MS)
              .duration(500)
              .springify()
              .damping(18)}
            style={[
              styles.statsPill,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(255,255,255,0.75)",
                borderColor: isDark
                  ? "rgba(207,165,51,0.15)"
                  : "rgba(212,175,55,0.12)",
              },
            ]}
          >
            <StatPillItem
              value={totalScans}
              label={t.home.productsVerified}
              primaryColor={colors.textPrimary}
              secondaryColor={colors.textSecondary}
            />
            <View
              style={[
                styles.statsDivider,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.06)",
                },
              ]}
            />
            <StatPillItem
              value={totalReports}
              label={t.home.alertsSent}
              primaryColor={colors.textPrimary}
              secondaryColor={colors.textSecondary}
            />
            <View
              style={[
                styles.statsDivider,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.06)",
                },
              ]}
            />
            <StatPillItem
              value={`${t.home.guardianLevel} ${userLevel}`}
              label={t.home.level}
              primaryColor={colors.textPrimary}
              secondaryColor={colors.textSecondary}
            />
            {/* Streak flame — only visible when streak > 0 */}
            {currentStreak > 0 && (
              <>
                <View
                  style={[
                    styles.statsDivider,
                    {
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(0,0,0,0.06)",
                    },
                  ]}
                />
                <View className="items-center px-3">
                  <View style={styles.streakRow}>
                    <Text style={styles.streakFlame}>🔥</Text>
                    <Text
                      style={{ color: brand.gold, fontSize: 16, fontWeight: "800" }}
                    >
                      {currentStreak}
                    </Text>
                  </View>
                  <Text
                    style={{ color: colors.textSecondary, fontSize: 10, fontWeight: "500", marginTop: 2 }}
                  >
                    {currentStreak > 1 ? t.home.streakDays : t.home.streakDay}
                  </Text>
                </View>
              </>
            )}
          </Animated.View>
          )}
        </Animated.View>

        {/* Trial Banner — shown during active 7-day trial */}
        {isGuest && isTrialActive && (
          <Animated.View
            entering={FadeInDown.delay(STAGGER_MS * 2).duration(500).springify().damping(18)}
            style={{ paddingHorizontal: 20, marginBottom: 16 }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 14,
                borderRadius: 16,
                backgroundColor: isDark ? "rgba(34, 197, 94, 0.08)" : "rgba(34, 197, 94, 0.06)",
                borderWidth: 1,
                borderColor: isDark ? "rgba(34, 197, 94, 0.2)" : "rgba(34, 197, 94, 0.15)",
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: isDark ? "rgba(34, 197, 94, 0.12)" : "rgba(34, 197, 94, 0.1)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AppIcon name="verified" size={20} color={isDark ? "#4ade80" : "#16a34a"} />
              </View>
              <View style={{ flex: 1, marginStart: 12 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "700" }}>
                  {t.paywall.trialBanner.replace("{n}", String(trialDaysRemaining))}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                  {t.home.trialAllFeaturesUnlocked}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Quota Widget — anonymous users only, hidden during trial */}
        {isGuest && !isTrialActive && (
          <Animated.View
            entering={FadeInDown.delay(STAGGER_MS * 2).duration(500).springify().damping(18)}
            style={{ paddingHorizontal: 20, marginBottom: 16 }}
          >
            <PressableScale
              onPress={() => {
                impact();
                router.push({ pathname: "/paywall" as any, params: { trigger: "scan_quota" } });
              }}
              accessibilityRole="button"
              accessibilityLabel={t.guest.dailyScans}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 14,
                  borderRadius: 16,
                  backgroundColor: isDark ? "rgba(212, 175, 55, 0.06)" : "rgba(212, 175, 55, 0.04)",
                  borderWidth: 1,
                  borderColor: isDark ? "rgba(212, 175, 55, 0.15)" : "rgba(212, 175, 55, 0.1)",
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: isDark ? "rgba(212, 175, 55, 0.1)" : "rgba(212, 175, 55, 0.08)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ScanIcon size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1, marginStart: 12 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "700" }}>
                    {quotaUsed}/{DAILY_SCAN_LIMIT} {t.guest.scansToday}
                  </Text>
                  <View
                    style={{
                      height: 4,
                      borderRadius: 2,
                      marginTop: 6,
                      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                    }}
                  >
                    <View
                      style={{
                        height: "100%",
                        borderRadius: 2,
                        width: `${Math.round((quotaUsed / DAILY_SCAN_LIMIT) * 100)}%`,
                        backgroundColor: quotaUsed < DAILY_SCAN_LIMIT ? colors.primary : "#ef4444",
                      }}
                    />
                  </View>
                </View>
                <CaretRightIcon size={20} color={colors.textSecondary} style={{ marginStart: 8 }} />
              </View>
            </PressableScale>
          </Animated.View>
        )}

        {/* ====================================================
            SECTION 2: QUICK ACTIONS (2x2 grid)
            ==================================================== */}
        <View style={styles.sectionWrap}>
          <View style={styles.quickActionsGrid}>
            {/* Row 1 */}
            <View style={styles.quickActionsRow}>
              <QuickActionCard
                icon="qr-code-scanner"
                title={t.home.quickActions.scanner}
                subtitle={t.home.quickActions.scannerSub}
                primary
                isDark={isDark}
                index={0}
                onPress={() => handleNavigate("scanner")}
              />
              <QuickActionCard
                icon="location-on"
                title={t.home.quickActions.stores}
                subtitle={t.home.quickActions.storesSub}
                isDark={isDark}
                iconBgColor={
                  isDark
                    ? "rgba(59,130,246,0.15)"
                    : "rgba(59,130,246,0.08)"
                }
                iconColor="#3b82f6"
                index={1}
                onPress={() => handleNavigate("map")}
              />
            </View>
            {/* Row 2 */}
            <View style={styles.quickActionsRow}>
              <AlertQuickActionCard
                title={t.home.alertsSection.split("&")[0].trim()}
                subtitle={t.home.alertsSeeAll}
                isDark={isDark}
                urgentCount={alertUrgentCount}
                infoCount={alertInfoCount}
                index={2}
                onPress={() => handleNavigate("alerts")}
              />
              <QuickActionCard
                icon="history"
                title={t.home.quickActions.history}
                subtitle={t.home.quickActions.historySub}
                isDark={isDark}
                iconBgColor={
                  isDark
                    ? "rgba(148,163,184,0.15)"
                    : "rgba(148,163,184,0.08)"
                }
                iconColor={isDark ? "#94a3b8" : "#64748b"}
                index={3}
                onPress={() => handleNavigate("history")}
              />
            </View>
          </View>
        </View>

        {/* API Error Banner — auth only */}
        {!isGuest && hasApiError && (
          <Animated.View
            entering={FadeIn.duration(300)}
            style={{ paddingHorizontal: 20, marginBottom: 8 }}
          >
            <View
              style={[
                styles.errorBanner,
                {
                  backgroundColor: isDark
                    ? "rgba(239,68,68,0.1)"
                    : "#fef2f2",
                  borderColor: isDark
                    ? "rgba(239,68,68,0.2)"
                    : "#fecaca",
                },
              ]}
            >
              <CloudSlashIcon size={16} color="#ef4444" />
              <Text
                style={[
                  styles.errorBannerText,
                  { color: isDark ? "#fca5a5" : "#b91c1c" },
                ]}
              >
                {t.errors.network}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* ====================================================
            SECTION 2.5: DISCOVER AROUND YOU (Social Map Preview)
            ==================================================== */}
        {(nearbyStores.length > 0 || storesQuery.isError) && (
          <Animated.View
            entering={FadeInDown.delay(320).duration(500)}
            style={{ marginTop: 24 }}
          >
            {/* Section header */}
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <MapPinIcon size={16} color={brand.gold} weight="bold" />
                <Text
                  accessibilityRole="header"
                  style={[
                    styles.sectionTitle,
                    { color: colors.textPrimary },
                  ]}
                >
                  Autour de vous
                </Text>
              </View>
              <Pressable
                onPress={() => router.push("/(tabs)/map")}
              >
                <Text style={[styles.seeAllText, { color: brand.gold }]}>
                  Ouvrir la Map
                </Text>
              </Pressable>
            </View>

            {storesQuery.isError ? (
              <Pressable
                onPress={() => storesQuery.refetch()}
                style={{
                  marginHorizontal: 20,
                  paddingVertical: 20,
                  paddingHorizontal: 16,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderStyle: "dashed",
                  borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                  backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)",
                  alignItems: "center",
                  gap: 6,
                }}
                accessibilityRole="button"
                accessibilityLabel={t.common.retry}
              >
                <ArrowClockwiseIcon size={20} color={colors.textMuted} />
                <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: "500" }}>
                  {t.errors.network} · {t.common.retry}
                </Text>
              </Pressable>
            ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 20,
                gap: 12,
              }}
              decelerationRate="fast"
              snapToInterval={232}
              snapToAlignment="start"
            >
              {nearbyStores.map((store, index) => (
                <DiscoverStoreCard
                  key={store.id}
                  store={store}
                  isDark={isDark}
                  colors={colors}
                  index={index}
                  onPress={() =>
                    router.navigate({
                      pathname: "/(tabs)/map",
                      params: {
                        storeId: store.id,
                        storeLat: String(store.latitude),
                        storeLng: String(store.longitude),
                        storeName: store.name,
                      },
                    })
                  }
                />
              ))}
            </ScrollView>
            )}
          </Animated.View>
        )}

        {/* ====================================================
            SECTION 3: FEATURED CONTENT (horizontal carousel)
            ==================================================== */}
        {defaultFeatureFlags.featuredArticlesEnabled && isPremium && (featuredItems.length > 0 || articlesQuery.isError) && (
          <Animated.View
            entering={FadeInDown.delay(360).duration(500)}
            style={{ marginTop: 24 }}
          >
            {/* Section header */}
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <ArticleIcon size={16} color={brand.gold} weight="bold" />
                <Text
                  accessibilityRole="header"
                  style={[
                    styles.sectionTitle,
                    { color: colors.textPrimary },
                  ]}
                >
                  {t.home.featured}
                </Text>
              </View>
              <Pressable
                onPress={() => router.push("/articles")}
                accessibilityRole="link"
                accessibilityLabel={t.home.viewAll}
              >
                <Text style={[styles.seeAllText, { color: brand.gold }]}>
                  {t.home.viewAll}
                </Text>
              </Pressable>
            </View>

            {articlesQuery.isError ? (
              <Pressable
                onPress={() => articlesQuery.refetch()}
                style={{
                  marginHorizontal: 20,
                  paddingVertical: 20,
                  paddingHorizontal: 16,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderStyle: "dashed",
                  borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                  backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)",
                  alignItems: "center",
                  gap: 6,
                }}
                accessibilityRole="button"
                accessibilityLabel={t.common.retry}
              >
                <ArrowClockwiseIcon size={20} color={colors.textMuted} />
                <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: "500" }}>
                  {t.errors.network} · {t.common.retry}
                </Text>
              </Pressable>
            ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 20,
                gap: 14,
              }}
              decelerationRate="fast"
              snapToInterval={SCREEN_WIDTH * 0.7 + 14}
              snapToAlignment="start"
            >
              {featuredItems.map((item, index) => (
                <FeaturedCard
                  key={item.id}
                  item={item}
                  isDark={isDark}
                  index={index}
                  onPress={() => handleFeaturedPress(item)}
                />
              ))}
            </ScrollView>
            )}
          </Animated.View>
        )}

        {/* ====================================================
            SECTION 4: QUICK FAVORITES (stories-style + toggle)
            ==================================================== */}
        {(
        <Animated.View
          entering={FadeInDown.delay(480).duration(500)}
          style={{ marginTop: 24 }}
        >
          {/* Section header with mini segment control */}
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <HeartIcon size={16} color={brand.gold} weight="bold" />
              <Text
                accessibilityRole="header"
                style={[
                  styles.sectionTitle,
                  { color: colors.textPrimary },
                ]}
              >
                {t.home.favorites}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {/* Mini segment: Produits | Magasins */}
              <View
                style={{
                  flexDirection: "row",
                  borderRadius: 10,
                  overflow: "hidden",
                  backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                }}
              >
                <Pressable
                  onPress={() => setFavTab("products")}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 10,
                    backgroundColor: favTab === "products"
                      ? isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"
                      : "transparent",
                  }}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: favTab === "products" }}
                >
                  <Text style={{
                    fontSize: 11,
                    fontWeight: favTab === "products" ? "700" : "500",
                    color: favTab === "products" ? colors.textPrimary : colors.textMuted,
                  }}>
                    {t.favorites.quickFavProducts}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setFavTab("stores")}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 10,
                    backgroundColor: favTab === "stores"
                      ? isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"
                      : "transparent",
                  }}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: favTab === "stores" }}
                >
                  <Text style={{
                    fontSize: 11,
                    fontWeight: favTab === "stores" ? "700" : "500",
                    color: favTab === "stores" ? colors.textPrimary : colors.textMuted,
                  }}>
                    {t.favorites.quickFavStores}
                  </Text>
                </Pressable>
              </View>
              {/* View All link */}
              {((favTab === "products" && favoriteProducts.length > 0) ||
                (favTab === "stores" && favoriteStores.length > 0)) && !isGuest && (
                <Pressable
                  onPress={() => handleNavigate("favorites", favTab === "stores" ? { tab: "stores" } : undefined)}
                  accessibilityRole="link"
                  accessibilityLabel={`${t.home.viewAll} ${t.home.favorites}`}
                >
                  <Text style={[styles.seeAllText, { color: brand.gold }]}>
                    {t.favorites.viewAll}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Products stories */}
          {favTab === "products" && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              gap: 16,
            }}
          >
            {favoriteProducts.length === 0 ? (
              <Animated.View entering={FadeInRight.delay(540).duration(400)}>
                <PressableScale
                  accessibilityRole="button"
                  accessibilityLabel={t.home.addFavorite}
                  accessibilityHint={t.home.emptyFavorites}
                  onPress={() => router.navigate("/(tabs)/scanner")}
                  style={[
                    styles.emptyFavCard,
                    {
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.03)"
                        : "rgba(212,175,55,0.03)",
                      borderColor: isDark
                        ? "rgba(207,165,51,0.12)"
                        : "rgba(212,175,55,0.15)",
                    },
                  ]}
                >
                  <View style={styles.emptyFavContent}>
                    <HeartIcon size={24}
                      color={isDark ? "#6b7280" : "#94a3b8"} />
                    <Text
                      style={[
                        styles.emptyFavText,
                        {
                          color: colors.textSecondary,
                        },
                      ]}
                    >
                      {t.home.emptyFavorites}
                    </Text>
                  </View>
                </PressableScale>
              </Animated.View>
            ) : (
              favoriteProducts.slice(0, 8).map((item, index) => (
                <FavoriteCircle
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  image={item.image}
                  isDark={isDark}
                  index={index}
                  onPress={() => handleNavigate("favorites")}
                />
              ))
            )}

            {/* Always-visible "Add" circle */}
            <Animated.View
              entering={FadeInRight.delay(
                540 + favoriteProducts.length * 70,
              ).duration(400)}
            >
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={t.home.addFavorite}
                onPress={() => (isGuest && localFavFull) ? router.push({ pathname: "/paywall" as any, params: { trigger: "favorites" } }) : router.navigate("/(tabs)/scanner")}
                style={styles.favCircleTouch}
              >
                <View
                  style={[
                    styles.addCircle,
                    {
                      borderColor: isDark
                        ? "rgba(207,165,51,0.15)"
                        : "rgba(212,175,55,0.18)",
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.04)"
                        : "rgba(212,175,55,0.03)",
                    },
                  ]}
                >
                  <AppIcon name={(isGuest && localFavFull) ? "lock-outline" : "add"}
                    size={26}
                    color={isDark ? "#6b7280" : "#94a3b8"} />
                </View>
                <Text
                  style={[
                    styles.favName,
                    {
                      color: colors.textSecondary,
                    },
                  ]}
                  numberOfLines={2}
                >
                  {(isGuest && localFavFull) ? "Naqiy+" : t.home.add}
                </Text>
              </PressableScale>
            </Animated.View>
          </ScrollView>
          )}

          {/* Stores stories */}
          {favTab === "stores" && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              gap: 16,
            }}
          >
            {favoriteStores.length === 0 ? (
              <Animated.View entering={FadeInRight.delay(540).duration(400)}>
                <PressableScale
                  accessibilityRole="button"
                  accessibilityLabel={t.favorites.exploreMap}
                  onPress={() => router.navigate("/(tabs)/map")}
                  style={[
                    styles.emptyFavCard,
                    {
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.03)"
                        : "rgba(212,175,55,0.03)",
                      borderColor: isDark
                        ? "rgba(207,165,51,0.12)"
                        : "rgba(212,175,55,0.15)",
                    },
                  ]}
                >
                  <View style={styles.emptyFavContent}>
                    <StorefrontIcon size={24}
                      color={isDark ? "#6b7280" : "#94a3b8"} />
                    <Text
                      style={[
                        styles.emptyFavText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {t.favorites.emptyStores}
                    </Text>
                  </View>
                </PressableScale>
              </Animated.View>
            ) : (
              favoriteStores.slice(0, 8).map((item, index) => (
                <FavoriteStoreCircle
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  image={item.image}
                  storeType={item.storeType}
                  isDark={isDark}
                  index={index}
                  onPress={() => handleNavigate("favorites", { tab: "stores" })}
                />
              ))
            )}

            {/* Add store circle */}
            <Animated.View
              entering={FadeInRight.delay(
                540 + favoriteStores.length * 70,
              ).duration(400)}
            >
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={t.favorites.exploreMap}
                onPress={() => router.navigate("/(tabs)/map")}
                style={styles.favCircleTouch}
              >
                <View
                  style={[
                    styles.addCircle,
                    {
                      borderColor: isDark
                        ? "rgba(207,165,51,0.15)"
                        : "rgba(212,175,55,0.18)",
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.04)"
                        : "rgba(212,175,55,0.03)",
                    },
                  ]}
                >
                  <MapPinPlusIcon size={26} color={isDark ? "#6b7280" : "#94a3b8"} />
                </View>
                <Text
                  style={[styles.favName, { color: colors.textSecondary }]}
                  numberOfLines={2}
                >
                  {t.home.add}
                </Text>
              </PressableScale>
            </Animated.View>
          </ScrollView>
          )}
        </Animated.View>
        )}
      </AnimatedScrollView>

      {/* Naqiy Brand Bottom Sheet */}
      <NaqiyBrandSheet
        visible={brandSheetVisible}
        onClose={() => setBrandSheetVisible(false)}
        isGuest={isGuest}
        user={me}
      />

      {/* Profile Upsell Bottom Sheet (free/trial users) */}
      <ProfileUpsellSheet
        visible={profileUpsellVisible}
        onClose={() => setProfileUpsellVisible(false)}
      />
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // ---- Header ----
  avatarPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarPlaceholderInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandMark: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  brandMarkText: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  greetingLabel: {
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  greetingName: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginTop: 1,
  },

  // ---- BellIcon ----
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  bellBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "transparent",
  },
  bellBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#ffffff",
  },

  // ---- Stats Pill ----
  statsPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  statsDivider: {
    width: 1,
    height: 28,
    borderRadius: 0.5,
  },
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  streakFlame: {
    fontSize: 14,
  },

  // ---- Quick Actions ----
  sectionWrap: {
    paddingHorizontal: 20,
  },
  quickActionsGrid: {
    gap: 10,
  },
  quickActionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  quickActionHalf: {
    flex: 1,
  },
  quickActionPrimary: {
    borderRadius: 20,
    overflow: "hidden",
    padding: 16,
    minHeight: 80,
    justifyContent: "center" as const,
  },
  quickActionGlass: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    minHeight: 80,
    justifyContent: "center" as const,
  },
  quickActionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  quickActionIconWrapPrimary: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  alertBadgesRow: {
    flexDirection: "row",
    gap: 6,
  },
  alertBadgeIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  alertCountBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  alertCountText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.3,
  },
  quickActionTitlePrimary: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: -0.2,
  },
  quickActionSubPrimary: {
    fontSize: 11,
    color: "rgba(255,255,255,0.75)",
    marginTop: 1,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  quickActionSub: {
    fontSize: 11,
    marginTop: 1,
  },

  // ---- Featured ----
  featuredCard: {
    width: SCREEN_WIDTH * 0.7,
    height: 170,
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  featuredBadgeWrap: {
    position: "absolute",
    top: 12,
    left: 12,
    zIndex: 10,
  },
  featuredBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  featuredBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  featuredContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    paddingStart: 18,
  },
  featuredTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  featuredSubtitle: {
    fontSize: 11,
    color: "rgba(255,255,255,0.65)",
    marginTop: 3,
  },
  featuredAccent: {
    position: "absolute",
    top: 12,
    bottom: 12,
    left: 0,
    width: 3,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },

  // ---- Section headers ----
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // ---- Favorites ----
  favCircleTouch: {
    alignItems: "center",
    width: CIRCLE_SIZE + 20,
    gap: 6,
  },
  favGradientRing: {
    width: CIRCLE_SIZE + CIRCLE_BORDER * 2 + 4,
    height: CIRCLE_SIZE + CIRCLE_BORDER * 2 + 4,
    borderRadius: (CIRCLE_SIZE + CIRCLE_BORDER * 2 + 4) / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  favInnerRing: {
    width: CIRCLE_SIZE + 2,
    height: CIRCLE_SIZE + 2,
    borderRadius: (CIRCLE_SIZE + 2) / 2,
    alignItems: "center",
    justifyContent: "center",
    padding: CIRCLE_BORDER,
  },
  favImage: {
    width: CIRCLE_SIZE - CIRCLE_BORDER * 2,
    height: CIRCLE_SIZE - CIRCLE_BORDER * 2,
    borderRadius: (CIRCLE_SIZE - CIRCLE_BORDER * 2) / 2,
  },
  favName: {
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 13,
  },
  addCircle: {
    width: CIRCLE_SIZE + CIRCLE_BORDER * 2 + 4,
    height: CIRCLE_SIZE + CIRCLE_BORDER * 2 + 4,
    borderRadius: (CIRCLE_SIZE + CIRCLE_BORDER * 2 + 4) / 2,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyFavCard: {
    width: 220,
    height: 90,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  emptyFavContent: {
    alignItems: "center",
    gap: 8,
  },
  emptyFavText: {
    fontSize: 11,
    textAlign: "center",
    lineHeight: 15,
  },

  // ---- Error ----
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  errorBannerText: {
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },

});
