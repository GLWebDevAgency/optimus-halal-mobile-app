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
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
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
import Svg, { Path } from "react-native-svg";

import { Avatar, PremiumBackground } from "@/components/ui";
const logoSource = require("@assets/images/logo_naqiy.webp");
import { PressableScale } from "@/components/ui/PressableScale";
import { HomeSkeleton } from "@/components/skeletons";
import { useMe } from "@/hooks/useAuth";
import { useFavoritesList } from "@/hooks/useFavorites";
import { useTranslation } from "@/hooks/useTranslation";
import { useTheme } from "@/hooks/useTheme";
import { brand, glass, lightTheme, darkTheme } from "@/theme/colors";
import { useHaptics, useUserLocation, useMapStores } from "@/hooks";
import { trpc } from "@/lib/trpc";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const STAGGER_MS = 60;


// Severity mappings for alerts
const SEVERITY_ACCENT: Record<string, string> = {
  critical: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",
};

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
  icon: keyof typeof MaterialIcons.glyphMap;
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
                  <MaterialIcons name={icon} size={24} color={isDark ? "#1A1A1A" : "#ffffff"} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.quickActionTitlePrimary, isDark && { color: "#1A1A1A" }]}>{title}</Text>
                  <Text style={[styles.quickActionSubPrimary, isDark && { color: "rgba(26,26,26,0.7)" }]}>{subtitle}</Text>
                </View>
                <MaterialIcons name="arrow-forward" size={18} color={isDark ? "rgba(26,26,26,0.5)" : "rgba(255,255,255,0.6)"} />
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
                <MaterialIcons
                  name={icon}
                  size={22}
                  color={iconColor ?? brand.primary}
                />
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
    >
      <Shadow distance={8} startColor={isDark ? "rgba(19,236,106,0.15)" : "rgba(0,0,0,0.06)"} offset={[0, 2]} style={{ borderRadius: 24, width: "100%", marginBottom: 16 }}>
        <PressableScale
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={item.title}
          accessibilityHint={item.subtitle}
        >
          <View style={styles.featuredCard}>
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
      </Shadow>
    </Animated.View>
  );
});

// ---- Discover Store Card (Map Preview) ----
interface DiscoverStoreCardProps {
  store: any;
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

  const handlePress = useCallback(() => {
    impact();
    onPress();
  }, [impact, onPress]);

  return (
    <Animated.View entering={FadeInRight.delay(400 + index * 80).duration(500)}>
      <PressableScale
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={store.name}
      >
        <View
          className="w-[200px] h-[120px] rounded-[18px] overflow-hidden p-3 justify-end"
          style={{
            backgroundColor: isDark ? glass.dark.bg : glass.light.bg,
            borderWidth: 1,
            borderColor: isDark ? glass.dark.border : glass.light.border,
          }}
        >
          {store.imageUrl ? (
            <Image
              source={{ uri: store.imageUrl }}
              style={[StyleSheet.absoluteFill, { opacity: 0.65 }]}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', opacity: 0.1 }]}>
               <MaterialIcons name="fastfood" size={48} color={isDark ? "#fff" : "#000"} />
            </View>
          )}
          <LinearGradient
            colors={["transparent", isDark ? "rgba(15,23,42,0.9)" : "rgba(255,255,255,0.95)"]}
            locations={[0, 0.8]}
            style={StyleSheet.absoluteFill}
          />
          <View className="relative z-10">
            <Text className="text-sm font-bold mb-0.5" style={{ color: colors.textPrimary }} numberOfLines={1}>
              {store.name}
            </Text>
            <Text className="text-[10px] font-medium" style={{ color: brand.gold }} numberOfLines={1}>
              {store.storeType.toUpperCase()} {store.halalCertified ? "• CERTIFIÉ" : ""}
            </Text>
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
                <MaterialIcons
                  name="fastfood"
                  size={22}
                  color={isDark ? "#475569" : "#94a3b8"}
                />
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
          {name.length > 12 ? name.split(" ")[0] : name}
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

  // ---- Data ----
  const meQuery = useMe();
  const me = meQuery.data;
  const isReady = !meQuery.isLoading;

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
    { limit: 5 }
  );
  const nearbyStores = useMemo(() => storesQuery.data ?? [], [storesQuery.data]);

  const favoritesQuery = useFavoritesList({ limit: 8 });

  const dashboardQuery = trpc.stats.userDashboard.useQuery(undefined, {
    enabled: isReady,
    staleTime: 60_000,
  });
  const unreadQuery = trpc.notification.getUnreadCount.useQuery(undefined, {
    enabled: isReady,
    staleTime: 30_000,
  });
  const alertsQuery = trpc.alert.list.useQuery(
    { limit: 5 },
    { enabled: isReady, staleTime: 60_000 },
  );
  const articlesQuery = trpc.article.list.useQuery(
    { limit: 5 },
    { enabled: isReady, staleTime: 120_000 },
  );

  // ---- Derived data ----
  const userName = useMemo(() => {
    if (me?.displayName) return me.displayName.split(" ")[0];
    return t.common.user;
  }, [me, t]);

  const totalScans = dashboardQuery.data?.totalScans ?? 0;
  const totalReports = dashboardQuery.data?.totalReports ?? 0;
  const userLevel = me?.level ?? 1;
  const currentStreak = me?.currentStreak ?? 0;
  const unreadCount = unreadQuery.data?.count ?? 0;

  const favoriteProducts = useMemo(
    () =>
      (favoritesQuery.data ?? [])
        .filter((f) => f.product !== null)
        .map((f) => ({
          id: f.id,
          name: f.product!.name,
          image: f.product!.imageUrl ?? "",
        })),
    [favoritesQuery.data],
  );

  // ---- Featured content: merge alerts + articles ----
  const featuredItems = useMemo<FeaturedCardData[]>(() => {
    const items: FeaturedCardData[] = [];

    // Alerts first (max 3)
    const alerts = alertsQuery.data?.items ?? [];
    for (const alert of alerts.slice(0, 3)) {
      items.push({
        id: `alert-${alert.id}`,
        type: "alert",
        title: alert.title,
        subtitle: alert.summary,
        coverImage: null,
        badgeLabel:
          alert.severity === "critical"
            ? "Urgent"
            : alert.severity === "warning"
              ? "Alerte"
              : "Info",
        badgeColor: SEVERITY_ACCENT[alert.severity] ?? "#3b82f6",
        accentColor: SEVERITY_ACCENT[alert.severity] ?? "#3b82f6",
      });
    }

    // Articles
    const articles = articlesQuery.data?.items ?? [];
    for (const article of articles.slice(0, 4)) {
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
  }, [alertsQuery.data?.items, articlesQuery.data?.items, t, colors.primary]);

  const hasApiError = dashboardQuery.isError && meQuery.isError;

  // ---- Pull-to-refresh ----
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      meQuery.refetch(),
      dashboardQuery.refetch(),
      unreadQuery.refetch(),
      alertsQuery.refetch(),
      articlesQuery.refetch(),
      favoritesQuery.refetch(),
    ]);
    setRefreshing(false);
  }, [
    meQuery,
    dashboardQuery,
    unreadQuery,
    alertsQuery,
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
    (route: string) => {
      impact();
      if (route === "scanner") router.navigate("/(tabs)/scanner");
      else if (route === "map") router.navigate("/(tabs)/map");
      else if (route === "alerts") router.navigate("/(tabs)/alerts");
      else if (route === "history")
        router.push("/settings/scan-history" as any);
      else if (route === "favorites")
        router.push("/settings/favorites" as any);
    },
    [impact],
  );

  const handleFeaturedPress = useCallback(
    (item: FeaturedCardData) => {
      impact();
      if (item.type === "alert") {
        router.navigate("/(tabs)/alerts");
      } else if (item.type === "article") {
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
          {/* Row: Avatar + Greeting + Brand + Bell */}
          <Animated.View
            entering={FadeInDown.delay(0).duration(500).springify().damping(20)}
            style={styles.headerRow}
          >
            <View style={styles.headerLeft}>
              <Avatar
                size="lg"
                source={me?.avatarUrl ?? undefined}
                fallback={userName}
                borderColor="primary"
              />
              <View style={{ marginStart: 12 }}>
                <Text
                  style={[
                    styles.greetingLabel,
                    {
                      color: colors.textSecondary,
                    },
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
              </View>
            </View>

            {/* Right: Brand Mark + Notification Bell */}
            <View style={styles.headerRight}>
              {/* Naqiy brand mark */}
              <View style={styles.brandMark} accessible={false}>
                <Image
                  source={logoSource}
                  style={{ width: 20, height: 20 }}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                />
                <Text style={[styles.brandMarkText, { color: colors.textPrimary }]}>
                  Naqiy
                </Text>
              </View>

              {/* Notification Bell */}
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
                <MaterialIcons
                  name="notifications-none"
                  size={22}
                  color={isDark ? brand.gold : colors.textPrimary}
                />
                {unreadCount > 0 && (
                  <View style={styles.bellBadge}>
                    <Text style={styles.bellBadgeText}>
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>
          </Animated.View>

          {/* Impact Stats Pill */}
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
        </Animated.View>

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
              <QuickActionCard
                icon="shield"
                title={t.home.alertsSection.split("&")[0].trim()}
                subtitle={t.home.alertsSeeAll}
                isDark={isDark}
                iconBgColor={
                  isDark
                    ? "rgba(245,158,11,0.15)"
                    : "rgba(245,158,11,0.08)"
                }
                iconColor="#f59e0b"
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

        {/* API Error Banner */}
        {hasApiError && (
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
              <MaterialIcons name="cloud-off" size={16} color="#ef4444" />
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
        {nearbyStores.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(320).duration(500)}
            style={{ marginTop: 24 }}
          >
            {/* Section header */}
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text
                  accessibilityRole="header"
                  style={[
                    styles.sectionTitle,
                    { color: colors.textPrimary },
                  ]}
                >
                  Autour de vous
                </Text>
                <Svg width={20} height={10} viewBox="0 0 24 12">
                  <Path d="M0,6 Q6,0 12,6 Q18,12 24,6" stroke={brand.gold} strokeWidth={1.5} fill="none" opacity={0.8} />
                </Svg>
              </View>
              <Pressable
                onPress={() => router.push("/(tabs)/map")}
              >
                <Text style={[styles.seeAllText, { color: brand.gold }]}>
                  Ouvrir la Map
                </Text>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 20,
                gap: 12,
              }}
              decelerationRate="fast"
              snapToInterval={212}
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
          </Animated.View>
        )}

        {/* ====================================================
            SECTION 3: FEATURED CONTENT (horizontal carousel)
            ==================================================== */}
        {featuredItems.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(360).duration(500)}
            style={{ marginTop: 24 }}
          >
            {/* Section header */}
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text
                  accessibilityRole="header"
                  style={[
                    styles.sectionTitle,
                    { color: colors.textPrimary },
                  ]}
                >
                  {t.home.featured}
                </Text>
                <Svg width={20} height={10} viewBox="0 0 24 12">
                  <Path d="M0,6 Q6,0 12,6 Q18,12 24,6" stroke={brand.gold} strokeWidth={1.5} fill="none" opacity={0.7} />
                </Svg>
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
          </Animated.View>
        )}

        {/* ====================================================
            SECTION 4: QUICK FAVORITES (stories-style)
            ==================================================== */}
        <Animated.View
          entering={FadeInDown.delay(480).duration(500)}
          style={{ marginTop: 24 }}
        >
          {/* Section header */}
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text
                accessibilityRole="header"
                style={[
                  styles.sectionTitle,
                  { color: colors.textPrimary },
                ]}
              >
                {t.home.favorites}
              </Text>
              <Svg width={20} height={10} viewBox="0 0 24 12">
                <Path d="M0,6 Q6,0 12,6 Q18,12 24,6" stroke={brand.gold} strokeWidth={1.5} fill="none" opacity={0.7} />
              </Svg>
            </View>
            {favoriteProducts.length > 0 && (
              <Pressable
                onPress={() => handleNavigate("favorites")}
                accessibilityRole="link"
                accessibilityLabel={`${t.home.viewAll} ${t.home.favorites}`}
              >
                <Text
                  style={[styles.seeAllText, { color: brand.gold }]}
                >
                  {t.home.viewAll} ({favoriteProducts.length})
                </Text>
              </Pressable>
            )}
          </View>

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
                  <MaterialIcons
                    name="favorite-border"
                    size={24}
                    color={isDark ? "#6b7280" : "#94a3b8"}
                  />
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
                onPress={() => router.navigate("/(tabs)/scanner")}
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
                  <MaterialIcons
                    name="add"
                    size={26}
                    color={isDark ? "#6b7280" : "#94a3b8"}
                  />
                </View>
                <Text
                  style={[
                    styles.favName,
                    {
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  {t.home.add}
                </Text>
              </PressableScale>
            </Animated.View>
          </ScrollView>
        </Animated.View>
      </AnimatedScrollView>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // ---- Header ----
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

  // ---- Bell ----
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
    width: CIRCLE_SIZE + 12,
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
    gap: 8,
    paddingHorizontal: 16,
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
