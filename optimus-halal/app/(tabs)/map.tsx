/**
 * Points of Sale Map Screen
 *
 * Carte interactive avec:
 * - Vue carte en fond
 * - Barre de recherche et filtres
 * - Bottom sheet avec liste des magasins (from trpc.store.search)
 * - Marqueurs sur la carte
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  useColorScheme,
  ActivityIndicator,
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
  SlideInUp,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { useTranslation } from "@/hooks/useTranslation";
import { trpc } from "@/lib/trpc";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const CARD_WIDTH = 280;

// Filter → storeType mapping (backend enum values)
const FILTER_IDS = [
  { id: "butcher", filterKey: "butchers" as const, storeType: "butcher" as const },
  { id: "restaurant", filterKey: "restaurants" as const, storeType: "restaurant" as const },
  { id: "supermarket", filterKey: "grocery" as const, storeType: "supermarket" as const },
  { id: "certified", filterKey: "certified" as const, halalOnly: true },
  { id: "abattoir", filterKey: "rating" as const, storeType: "abattoir" as const },
];

// ── Store type icons ────────────────────────────────────────
const STORE_TYPE_ICON: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  butcher: "restaurant",
  restaurant: "restaurant-menu",
  supermarket: "shopping-cart",
  bakery: "bakery-dining",
  abattoir: "agriculture",
  wholesaler: "local-shipping",
  online: "language",
  other: "store",
};

// ── Store Card (adapted to real DB shape) ───────────────────
interface StoreItem {
  id: string;
  name: string;
  storeType: string;
  imageUrl: string | null;
  address: string;
  city: string;
  certifier: string;
  halalCertified: boolean;
  averageRating: number;
  reviewCount: number;
}

const StoreCard = React.memo(function StoreCard({
  store,
  index,
  onPress,
}: {
  store: StoreItem;
  index: number;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const isFeatured = index === 0;
  const certLabel = store.certifier !== "none" ? store.certifier.toUpperCase() : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={`${store.name}, ${store.city}, note ${store.averageRating}`}
      className={`w-[280px] rounded-xl p-3 ${
        isFeatured
          ? "bg-slate-800 border border-primary/40"
          : "bg-slate-800 border border-slate-700 opacity-90"
      }`}
      style={{
        shadowColor: isFeatured ? "#1de560" : "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isFeatured ? 0.3 : 0.2,
        shadowRadius: 8,
        elevation: 4,
      }}
    >
      <View className="flex-row gap-3">
        {/* Image */}
        <View className="w-20 h-20 rounded-lg bg-slate-700 overflow-hidden items-center justify-center">
          {store.imageUrl ? (
            <Image
              source={{ uri: store.imageUrl }}
              className="w-full h-full"
              contentFit="cover"
              transition={200}
              accessibilityLabel={`Photo de ${store.name}`}
            />
          ) : (
            <MaterialIcons
              name={STORE_TYPE_ICON[store.storeType] ?? "store"}
              size={28}
              color="#94a3b8"
            />
          )}
        </View>

        {/* Info */}
        <View className="flex-1 justify-center">
          <View className="flex-row items-start justify-between">
            <Text className="font-bold text-white flex-1 pr-2" numberOfLines={1}>
              {store.name}
            </Text>
            {certLabel && (
              <View
                className={`px-1.5 py-0.5 rounded ${
                  certLabel === "AVS" || certLabel === "ACHAHADA"
                    ? "bg-primary/20"
                    : "bg-slate-700"
                }`}
              >
                <Text
                  className={`text-[10px] font-bold ${
                    certLabel === "AVS" || certLabel === "ACHAHADA"
                      ? "text-primary"
                      : "text-slate-300"
                  }`}
                >
                  {certLabel}
                </Text>
              </View>
            )}
          </View>
          <Text className="text-xs text-slate-400 mb-1" numberOfLines={1}>
            {store.city}
          </Text>
          {store.averageRating > 0 && (
            <View className="flex-row items-center gap-1 mb-1">
              <MaterialIcons name="star" size={14} color="#fbbf24" />
              <Text className="text-xs font-bold text-white">{store.averageRating.toFixed(1)}</Text>
              <Text className="text-xs text-slate-400">({store.reviewCount})</Text>
            </View>
          )}
          <View className="flex-row items-center gap-1">
            <MaterialIcons name="near-me" size={12} color="#94a3b8" />
            <Text className="text-xs text-slate-400" numberOfLines={1}>{store.address}</Text>
          </View>
        </View>
      </View>

      {/* Action Button */}
      <TouchableOpacity
        className={`mt-3 w-full py-2 rounded-lg flex-row items-center justify-center gap-2 ${
          isFeatured
            ? "bg-primary/20 border border-primary/20"
            : "bg-slate-700"
        }`}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={isFeatured ? `Itinéraire vers ${store.name}` : `Voir détails de ${store.name}`}
      >
        <MaterialIcons
          name={isFeatured ? "directions" : "visibility"}
          size={18}
          color={isFeatured ? "#1de560" : "#ffffff"}
        />
        <Text
          className={`text-sm font-semibold ${
            isFeatured ? "text-primary" : "text-white"
          }`}
        >
          {isFeatured ? t.map.directions : "Voir détails"}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { impact } = useHaptics();
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>(["butcher"]);

  // Build query params from active filters
  const queryParams = useMemo(() => {
    const params: {
      query?: string;
      storeType?: "supermarket" | "butcher" | "restaurant" | "bakery" | "abattoir" | "wholesaler" | "online" | "other";
      halalCertifiedOnly: boolean;
      limit: number;
    } = { halalCertifiedOnly: false, limit: 20 };

    if (searchQuery.trim()) params.query = searchQuery.trim();

    // Apply storeType from first matching type filter
    for (const f of FILTER_IDS) {
      if (activeFilters.includes(f.id) && "storeType" in f) {
        params.storeType = f.storeType;
        break;
      }
    }

    if (activeFilters.includes("certified")) {
      params.halalCertifiedOnly = true;
    }

    return params;
  }, [searchQuery, activeFilters]);

  const storesQuery = trpc.store.search.useQuery(queryParams, {
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });

  const stores = storesQuery.data?.items ?? [];

  const toggleFilter = useCallback(
    (filterId: string) => {
      impact();
      setActiveFilters((prev) =>
        prev.includes(filterId)
          ? prev.filter((id) => id !== filterId)
          : [...prev, filterId]
      );
    },
    []
  );

  const handleMyLocation = useCallback(() => {
    impact();
  }, []);

  const handleStorePress = useCallback((storeId: string) => {
    impact();
  }, []);

  return (
    <View className="flex-1 bg-slate-900">
      {/* Map Background */}
      <View className="absolute inset-0">
        <Image
          source={{
            uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBYIKA5a0FeZU9C9EfDX-8wvGXljSyovGnPZrYXKcMzyiy2RxkFKrXfAo2M1M0_etwk27ZD2QkAeDysIKRGwCITJkwkZIjkulQ_j0GawjhXMkoW9WmQFFhNkOfAOPSj2rY6R2zTIzGwu98nyYuJvCVSY6S2ot88mj0gyXcidEFYxiPT10UpH2E6Om3yUHjkZ6HQwB9apITnYGqV4dm8AgWT9xIVtl4niS_DydRv5jmgTFv6j7M4QB0276EHezcSrTy7y3Y0lO7KMjkV",
          }}
          className="w-full h-full"
          contentFit="cover"
          transition={200}
          style={{ opacity: 0.7 }}
          accessible={false}
        />
        <View className="absolute inset-0 bg-slate-900/40" />

        {/* User location marker */}
        <View className="absolute" style={{ top: "45%", left: "48%" }}>
          <View className="w-16 h-16 rounded-full bg-primary/20 absolute" />
          <View
            className="w-4 h-4 rounded-full bg-primary border-2 border-white z-10"
            style={{
              shadowColor: "#1de560",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 15,
            }}
          />
        </View>

        {/* Map Controls */}
        <View
          className="absolute right-4 gap-2"
          style={{ top: SCREEN_HEIGHT * 0.25 }}
        >
          <TouchableOpacity
            onPress={handleMyLocation}
            className="w-10 h-10 rounded-lg bg-surface-dark/90 border border-slate-700 items-center justify-center"
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Ma position"
            accessibilityHint="Centrer la carte sur ma position"
          >
            <MaterialIcons name="my-location" size={20} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity
            className="w-10 h-10 rounded-lg bg-surface-dark/90 border border-slate-700 items-center justify-center"
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Couches de la carte"
            accessibilityHint="Changer le style de la carte"
          >
            <MaterialIcons name="layers" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Top Header with gradient */}
      <LinearGradient
        colors={["rgba(15,23,42,0.9)", "rgba(15,23,42,0.5)", "transparent"]}
        style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 40 }}
      >
        {/* Search Bar */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          className="flex-row gap-3 mb-4"
        >
          <View className="flex-1 h-12 flex-row items-center px-4 rounded-lg bg-surface-dark/90 border border-slate-700">
            <MaterialIcons name="search" size={20} color="#94a3b8" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t.map.searchPlaceholder}
              placeholderTextColor="#94a3b8"
              className="flex-1 ml-3 text-white text-base"
              style={{ fontFamily: "Inter" }}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/alerts" as any)}
            className="relative h-12 w-12 rounded-full bg-surface-dark/90 border border-slate-700 items-center justify-center"
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            accessibilityHint="Voir les alertes"
          >
            <MaterialIcons name="notifications" size={22} color="#ffffff" />
          </TouchableOpacity>
        </Animated.View>

        {/* Filter Chips */}
        <Animated.ScrollView
          entering={FadeInRight.delay(200).duration(400)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {FILTER_IDS.map((filter) => {
            const isActive = activeFilters.includes(filter.id);
            const filterLabel = t.map.filters[filter.filterKey];
            return (
              <TouchableOpacity
                key={filter.id}
                onPress={() => toggleFilter(filter.id)}
                className={`h-9 flex-row items-center gap-1.5 px-4 rounded-full ${
                  isActive
                    ? "bg-primary"
                    : "bg-surface-dark/80 border border-slate-700"
                }`}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`${filterLabel}${isActive ? ", sélectionné" : ""}`}
                accessibilityHint={isActive ? `Désactiver le filtre ${filterLabel}` : `Filtrer par ${filterLabel}`}
                style={
                  isActive
                    ? {
                        shadowColor: "#1de560",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                      }
                    : {}
                }
              >
                <Text
                  className={`text-sm ${
                    isActive ? "font-semibold text-white" : "font-medium text-gray-200"
                  }`}
                >
                  {filterLabel}
                </Text>
                {isActive && (
                  <MaterialIcons name="close" size={18} color="#ffffff" />
                )}
              </TouchableOpacity>
            );
          })}
        </Animated.ScrollView>
      </LinearGradient>

      {/* Results count badge */}
      <Animated.View
        entering={FadeIn.delay(400).duration(400)}
        className="absolute right-4"
        style={{ bottom: 280 + insets.bottom }}
      >
        <View
          className="flex-row items-center gap-2 bg-surface-dark border border-slate-600 h-12 px-5 rounded-full"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <MaterialIcons name="format-list-bulleted" size={20} color="#1de560" />
          <Text className="font-semibold text-sm text-white">
            {storesQuery.data?.total ?? "..."} résultats
          </Text>
        </View>
      </Animated.View>

      {/* Bottom Sheet */}
      <Animated.View
        entering={SlideInUp.delay(300).duration(500)}
        className="absolute bottom-0 left-0 right-0 bg-surface-dark rounded-t-2xl border-t border-slate-700/50"
        style={{
          height: 260 + insets.bottom,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
          elevation: 8,
        }}
      >
        {/* Handle */}
        <View className="w-full h-6 items-center justify-center pt-2">
          <View className="w-10 h-1 rounded-full bg-slate-600" />
        </View>

        {/* Content */}
        <View className="flex-1 pb-6">
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 mb-3">
            <Text accessibilityRole="header" className="text-lg font-bold text-white">{t.map.nearYou}</Text>
            <Text className="text-primary text-sm font-semibold">
              {storesQuery.data?.total ?? 0} magasin{(storesQuery.data?.total ?? 0) > 1 ? "s" : ""}
            </Text>
          </View>

          {/* Store Cards */}
          {storesQuery.isPending ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="small" color="#1de560" />
            </View>
          ) : stores.length === 0 ? (
            <View className="flex-1 items-center justify-center px-8">
              <MaterialIcons name="search-off" size={32} color="#64748b" />
              <Text className="text-sm text-slate-400 mt-2 text-center">
                Aucun magasin trouvé pour ces filtres
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
              snapToInterval={CARD_WIDTH + 16}
              decelerationRate="fast"
            >
              {stores.map((store: any, index: number) => (
                <Animated.View
                  key={store.id}
                  entering={FadeInRight.delay(400 + index * 100).duration(400)}
                >
                  <StoreCard
                    store={store}
                    index={index}
                    onPress={() => handleStorePress(store.id)}
                  />
                </Animated.View>
              ))}
            </ScrollView>
          )}
        </View>
      </Animated.View>
    </View>
  );
}
