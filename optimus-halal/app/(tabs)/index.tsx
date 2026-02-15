/**
 * Home Dashboard Screen
 * 
 * Écran principal avec:
 * - Header avec avatar et notifications
 * - Impact card
 * - Quick actions (Scanner, Magasins, Marketplace, Historique)
 * - Featured content carousel
 * - Favorites section
 * - Nearby stores
 */

import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useHaptics } from "@/hooks";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  FadeInUp,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { FlashList } from "@shopify/flash-list";

import { Card, Avatar } from "@/components/ui";
import { HomeSkeleton } from "@/components/skeletons";
import { useLocalFavoritesStore } from "@/store";
import { useAuthStore } from "@/store/apiStores";
import { useTranslation } from "@/hooks/useTranslation";
import { trpc } from "@/lib/trpc";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 40 - 16; // padding + gap
const FAVORITE_CIRCLE_SIZE = 72;

const featuredKeyExtractor = (item: (typeof FEATURED_CONTENT)[0]) => item.id;

// Mock data
const FEATURED_CONTENT = [
  {
    id: "1",
    type: "new",
    title: "Essentiels du Ramadan",
    subtitle: "Découvrez notre sélection certifiée",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB4m35jbV38n3NIkY8ZOHKsQAs_cnFj_jt55v4ZxSrpVIaY5ObsvVz0LcBa0CIoA-oUuB0T8VfU9HuP1T9ns7AdDd3fDXH4YynSEi3P6vmmbB8BE13265EV9Jk4jnZR4R0oHBvZXic6FRUnDcH2ZeRsdreMxemciz1VM8ImikGYMF5Q7FZ4SU9nXY1IteWJK5k8mi6wole88ZmjYnSp0F10GW9Z9HAfGqNHHNoomH2sU7o3O9RLZz3E6lEsZk1svGL1wcvuY6svibIW",
  },
  {
    id: "2",
    type: "blog",
    title: "Comprendre les labels",
    subtitle: "Guide de transparence 2024",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCgLGDyyFngcYlOwZcMBzQCFRSNPYZiiaiKx7vWGn0di4zYjUGmS9BbmFtR-Js_lJ_uFWqD7NbdEGOaQovwHxLfpu6ZpoTOCA35Ef-Yuh4C-2wJLCOK2UTxDG2VYAF1HcqMeRcSlebqQCJF1nagbwElTWOQfk4pMhRCCGwR2YLFc8hYYBDsBIQ8UL4-GUTVMjMA4uL2GiaP02-K3CJu1M_ve6C1B3--qB1mK01hoTck3h52eyzJ43Po7efke0B4nmxyR3f2cWveqeba",
  },
];

interface QuickActionProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  primary?: boolean;
  iconColor?: string;
}

const QuickAction = React.memo(function QuickAction({
  icon,
  title,
  subtitle,
  onPress,
  primary,
  iconColor,
}: QuickActionProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { impact } = useHaptics();

  const handlePress = useCallback(() => {
    impact();
    onPress();
  }, [impact, onPress]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={subtitle}
      className={`flex-1 flex-col items-start gap-3 rounded-2xl p-4 ${
        primary
          ? "bg-primary dark:bg-emerald-600"
          : "bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-700/50"
      }`}
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: primary ? 0.2 : 0.05,
        shadowRadius: 8,
        elevation: primary ? 4 : 2,
      }}
    >
      <View
        className={`h-10 w-10 items-center justify-center rounded-full ${
          primary
            ? "bg-white/20"
            : "bg-slate-100 dark:bg-white/5"
        }`}
      >
        <MaterialIcons
          name={icon}
          size={22}
          color={
            primary
              ? "#ffffff"
              : iconColor || (isDark ? "#1de560" : "#0d1b13")
          }
        />
      </View>
      <View>
        <Text
          className={`text-base font-bold ${
            primary ? "text-white" : "text-slate-900 dark:text-white"
          }`}
        >
          {title}
        </Text>
        <Text
          className={`text-xs ${
            primary
              ? "text-white/80"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          {subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { impact } = useHaptics();
  const isDark = colorScheme === "dark";
  const { t } = useTranslation();

  const isInitializing = useAuthStore((s) => s.isInitializing);
  const profile = useAuthStore((s) => s.profile);
  const { favorites: favoriteProducts } = useLocalFavoritesStore();

  // Real API queries
  const dashboardQuery = trpc.stats.userDashboard.useQuery(undefined, {
    enabled: !isInitializing,
    staleTime: 60_000,
  });
  const unreadQuery = trpc.notification.getUnreadCount.useQuery(undefined, {
    enabled: !isInitializing,
    staleTime: 30_000,
  });
  const nearbyStoreQuery = trpc.store.search.useQuery(
    { halalCertifiedOnly: true, limit: 1 },
    { enabled: !isInitializing, staleTime: 120_000 },
  );

  const unreadCount = unreadQuery.data?.count ?? 0;
  const nearbyStore = nearbyStoreQuery.data?.items?.[0] ?? null;

  const userName = useMemo(() => {
    if (profile?.displayName) {
      return profile.displayName.split(" ")[0];
    }
    return t.common.user;
  }, [profile, t]);

  const totalScans = dashboardQuery.data?.totalScans ?? 0;

  const handleNavigate = useCallback((route: string) => {
    impact();
    if (route === "scanner") {
      router.push("/(tabs)/scanner");
    } else if (route === "map") {
      router.push("/(tabs)/map");
    } else if (route === "marketplace") {
      router.push("/(tabs)/marketplace" as any);
    } else if (route === "history") {
      router.push("/scan-result" as any);
    } else if (route === "favorites") {
      router.push("/settings/favorites" as any);
    }
  }, []);

  // Skeleton while auth store initializes (placed after all hooks)
  if (isInitializing) return <HomeSkeleton />;

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          entering={FadeIn.delay(100).duration(400)}
          className="flex-row items-center justify-between px-5 mb-4"
        >
          <View className="flex-row items-center gap-3">
            <View className="relative">
              <Avatar
                size="lg"
                source={profile?.avatarUrl ?? undefined}
                fallback={userName}
                borderColor="primary"
              />
            </View>
            <View>
              <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {t.home.greeting}
              </Text>
              <Text className="text-xl font-bold text-slate-900 dark:text-white">
                {userName}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => router.push("/(tabs)/alerts")}
            className="relative h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-700/50"
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t.common.notifications}
            accessibilityHint={t.common.viewAlerts}
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <MaterialIcons
              name="notifications"
              size={22}
              color={isDark ? "#ffffff" : "#0d1b13"}
            />
            {unreadCount > 0 && (
              <View className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-gold-500 border-2 border-white dark:border-surface-dark" />
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Impact Card */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(600)}
          className="px-5 mb-6"
        >
          <View
            className="relative overflow-hidden rounded-2xl bg-white dark:bg-surface-dark p-5 border border-slate-100 dark:border-slate-700/50"
            style={{
              shadowColor: isDark ? "#000" : "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.3 : 0.08,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            {/* Decorative blurs */}
            <View
              className="absolute -right-6 -top-6 h-32 w-32 rounded-full"
              style={{
                backgroundColor: "rgba(29, 229, 96, 0.15)",
              }}
            />
            <View
              className="absolute -left-6 -bottom-6 h-24 w-24 rounded-full"
              style={{
                backgroundColor: "rgba(212, 175, 55, 0.1)",
              }}
            />

            <View className="flex-row items-start justify-between">
              <View className="gap-1">
                <Text accessibilityRole="header" className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {t.home.dailyImpact}
                </Text>
                <View className="flex-row items-baseline gap-2">
                  <Text className="text-3xl font-bold text-slate-900 dark:text-gold-500">
                    {totalScans}
                  </Text>
                  <Text className="text-sm font-medium text-primary-dark dark:text-primary">
                    {t.home.healthyProducts}
                  </Text>
                </View>
                <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {dashboardQuery.data?.totalReports ?? 0} {(dashboardQuery.data?.totalReports ?? 0) > 1 ? t.home.reportsPlural : t.home.reports} · Niveau {profile?.level ?? 1}
                </Text>
              </View>

              <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
                <MaterialIcons
                  name="eco"
                  size={24}
                  color={isDark ? "#1de560" : "#047857"}
                />
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View
          entering={FadeInUp.delay(300).duration(600)}
          className="px-5 mb-6"
        >
          <View className="flex-row gap-3 mb-3">
            <QuickAction
              icon="qr-code-scanner"
              title={t.home.quickActions.scanner}
              subtitle={t.home.quickActions.scannerSub}
              primary
              onPress={() => handleNavigate("scanner")}
            />
            <QuickAction
              icon="location-on"
              title={t.home.quickActions.stores}
              subtitle={t.home.quickActions.storesSub}
              iconColor={isDark ? "#1de560" : "#0d1b13"}
              onPress={() => handleNavigate("map")}
            />
          </View>
          <View className="flex-row gap-3">
            <QuickAction
              icon="storefront"
              title={t.home.quickActions.marketplace}
              subtitle={t.home.quickActions.marketplaceSub}
              iconColor={isDark ? "#D4AF37" : "#0d1b13"}
              onPress={() => handleNavigate("marketplace")}
            />
            <QuickAction
              icon="history"
              title={t.home.quickActions.history}
              subtitle={t.home.quickActions.historySub}
              iconColor={isDark ? "#94a3b8" : "#0d1b13"}
              onPress={() => handleNavigate("history")}
            />
          </View>
        </Animated.View>

        {/* Featured Content */}
        <Animated.View entering={FadeIn.delay(400).duration(500)}>
          <View className="flex-row items-center justify-between px-5 mb-3">
            <Text accessibilityRole="header" className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              {t.home.featured}
            </Text>
            <TouchableOpacity activeOpacity={0.7} accessibilityRole="link" accessibilityLabel={`${t.home.viewAll} ${t.home.featured}`}>
              <Text className="text-xs font-semibold text-primary-dark dark:text-primary">
                {t.home.viewAll}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 160, paddingHorizontal: 20 }}>
            <FlashList
              data={FEATURED_CONTENT}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={featuredKeyExtractor}
              snapToInterval={CARD_WIDTH + 16}
              decelerationRate="fast"
              ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
              renderItem={({ item, index }) => (
                <Animated.View
                  entering={FadeInRight.delay(450 + index * 100).duration(500)}
                >
                  <TouchableOpacity
                    activeOpacity={0.9}
                    accessibilityRole="button"
                    accessibilityLabel={item.title}
                    accessibilityHint={item.subtitle}
                    className="relative h-40 overflow-hidden rounded-2xl"
                    style={{ width: 280 }}
                  >
                    <Image
                      source={{ uri: item.image }}
                      className="absolute inset-0 w-full h-full"
                      contentFit="cover"
                      transition={200}
                      accessible={false}
                    />
                    <LinearGradient
                      colors={["transparent", "rgba(0,0,0,0.7)", "rgba(0,0,0,0.9)"]}
                      className="absolute inset-0"
                    />
                    <View className="absolute bottom-0 left-0 right-0 p-4">
                      <View
                        className={`self-start mb-1 px-2 py-0.5 rounded ${
                          item.type === "new"
                            ? "bg-primary"
                            : "bg-white/20"
                        }`}
                      >
                        <Text className="text-[10px] font-bold uppercase tracking-wider text-white">
                          {item.type === "new" ? t.home.newBadge : t.home.blogBadge}
                        </Text>
                      </View>
                      <Text className="text-base font-bold text-white">
                        {item.title}
                      </Text>
                      <Text className="text-xs text-gray-300">{item.subtitle}</Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              )}
            />
          </View>
        </Animated.View>

        {/* Favorites */}
        <Animated.View
          entering={FadeIn.delay(500).duration(500)}
          className="mt-6"
        >
          <View className="flex-row items-center justify-between px-5 mb-3">
            <Text accessibilityRole="header" className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              {t.home.favorites}
            </Text>
            {favoriteProducts.length > 0 && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleNavigate("favorites")}
                accessibilityRole="link"
                accessibilityLabel={`${t.home.viewAll} ${t.home.favorites}, ${favoriteProducts.length}`}
              >
                <Text className="text-xs font-semibold text-primary-dark dark:text-primary">
                  {t.home.viewAll} ({favoriteProducts.length})
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
          >
            {favoriteProducts.length === 0 ? (
              <Animated.View entering={FadeInRight.delay(550).duration(400)}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={t.home.addFavorite}
                  accessibilityHint={t.home.emptyFavorites}
                  className="items-center justify-center gap-2 rounded-2xl bg-slate-50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-slate-700/50"
                  style={{ width: 200, height: 100, paddingHorizontal: 16 }}
                  onPress={() => router.push("/(tabs)/scanner")}
                >
                  <MaterialIcons
                    name="favorite-border"
                    size={24}
                    color={isDark ? "#94a3b8" : "#64748b"}
                  />
                  <Text className="text-xs text-center text-slate-500 dark:text-slate-400">
                    {t.home.emptyFavorites}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ) : (
              favoriteProducts.slice(0, 6).map((item, index) => (
                <Animated.View
                  key={item.id}
                  entering={FadeInRight.delay(550 + index * 80).duration(400)}
                >
                  <TouchableOpacity
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={`${t.home.favorites} ${item.name}`}
                    accessibilityHint={t.home.favorites}
                    className="items-center gap-2"
                    style={{ width: FAVORITE_CIRCLE_SIZE }}
                    onPress={() => handleNavigate("favorites")}
                  >
                    <View className="h-[72px] w-[72px] rounded-full border border-slate-100 dark:border-slate-700/50 bg-white dark:bg-surface-dark p-1 overflow-hidden">
                      <Image
                        source={{ uri: item.image }}
                        className="h-full w-full rounded-full"
                        contentFit="cover"
                        transition={200}
                        accessibilityLabel={`Photo de ${item.name}`}
                      />
                    </View>
                    <Text
                      className="text-xs font-medium text-slate-500 dark:text-slate-400 text-center"
                      numberOfLines={1}
                    >
                      {item.name.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              ))
            )}

            {/* Add button - toujours visible */}
            <Animated.View entering={FadeInRight.delay(700).duration(400)}>
              <TouchableOpacity
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t.home.addFavorite}
                accessibilityHint={t.home.emptyFavorites}
                className="items-center gap-2"
                style={{ width: FAVORITE_CIRCLE_SIZE }}
                onPress={() => router.push("/(tabs)/scanner")}
              >
                <View className="h-[72px] w-[72px] rounded-full items-center justify-center bg-slate-100 dark:bg-white/5 border border-transparent dark:border-slate-700/50">
                  <MaterialIcons
                    name="add"
                    size={28}
                    color={isDark ? "#94a3b8" : "#64748b"}
                  />
                </View>
                <Text className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {t.home.add}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </Animated.View>

        {/* Nearby Store */}
        <Animated.View
          entering={FadeInUp.delay(600).duration(600)}
          className="mt-6 px-5"
        >
          <Text accessibilityRole="header" className="text-lg font-bold tracking-tight text-slate-900 dark:text-white mb-3">
            {t.home.nearYou}
          </Text>

          <Card variant="outlined" className="overflow-hidden">
            {/* Map Preview */}
            <TouchableOpacity
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel={t.map.title}
              accessibilityHint={t.home.nearYou}
              onPress={() => router.push("/(tabs)/map")}
            >
              <View className="relative h-32 w-full overflow-hidden rounded-t-xl bg-slate-200 dark:bg-slate-800">
                {nearbyStore?.imageUrl ? (
                  <Image
                    source={{ uri: nearbyStore.imageUrl }}
                    className="absolute inset-0 w-full h-full opacity-80 dark:opacity-60"
                    contentFit="cover"
                    transition={200}
                    accessible={false}
                  />
                ) : (
                  <View className="absolute inset-0 items-center justify-center">
                    <MaterialIcons name="storefront" size={48} color={isDark ? "#334155" : "#cbd5e1"} />
                  </View>
                )}
                {nearbyStore?.halalCertified && (
                  <View className="absolute top-2 left-2 flex-row items-center gap-1 rounded-lg bg-primary/90 px-2 py-1">
                    <MaterialIcons name="verified" size={12} color="#ffffff" />
                    <Text className="text-[10px] font-bold text-white uppercase">
                      {nearbyStore.certifier !== "none" ? nearbyStore.certifier.toUpperCase() : "Halal"}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            {/* Store Info */}
            <View className="flex-row items-center gap-3 p-3">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-primary/20">
                <MaterialIcons
                  name="store"
                  size={20}
                  color={isDark ? "#1de560" : "#047857"}
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                  {nearbyStore?.name ?? t.common.loading}
                </Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400" numberOfLines={1}>
                  {nearbyStore ? `${nearbyStore.address}, ${nearbyStore.city}` : t.common.loading}
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t.map.title}
                accessibilityHint={t.home.nearYou}
                className="rounded-full p-2 bg-slate-100 dark:bg-white/5"
                onPress={() => router.push("/(tabs)/map")}
              >
                <MaterialIcons
                  name="directions"
                  size={20}
                  color={isDark ? "#ffffff" : "#0d1b13"}
                />
              </TouchableOpacity>
            </View>
          </Card>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
