/**
 * Points of Sale Map Screen
 * 
 * Carte interactive avec:
 * - Vue carte en fond
 * - Barre de recherche et filtres
 * - Bottom sheet avec liste des magasins
 * - Marqueurs sur la carte
 */

import React, { useState, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  useColorScheme,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  SlideInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { Card, Avatar, Chip, IconButton, Button } from "@/components/ui";
import { useLocationStore, useLocalAlertsStore } from "@/store";
import { colors } from "@/constants/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CARD_WIDTH = 280;

// Mock data
const FILTERS = [
  { id: "butchers", label: "Boucheries", active: true },
  { id: "restaurants", label: "Restaurants", active: false },
  { id: "grocery", label: "Épiceries", active: false },
  { id: "avs", label: "Cert: AVS", hasDropdown: true, active: false },
  { id: "rating", label: "Note 4.0+", active: false },
];

const STORES = [
  {
    id: "1",
    name: "Al-Baraka Boucherie",
    type: "Ethical & Organic Meat",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDaJTiM5FZsVGCC4NwciZBljJsRhP6Nvqc2lH9lFjXYCzwYwfsOP9OtZB2BF_QGvp1fqlXtvth5oQhnm4KYneWmKC8zyxUDFgc5KlWCLssjHSHbljUUL_8ZL4GTWnzi1ijVam7NCyjr4hfIjnFiPHaNauW6HYrkMVolqGLpwpsQzLxFn5IW2oPpb421-CypZn65orcjpwW2nomeTOHxtLxoRe5hr0K8-N62sWP1RFrNk-vZpcAcSyN1b_k1ad4hh3a5iQ1EHrqASPYx",
    rating: 4.8,
    reviews: 124,
    distance: "0.8 km",
    isOpen: true,
    certification: "AVS",
    isFeatured: true,
  },
  {
    id: "2",
    name: "La Table du Sultan",
    type: "Authentic Turkish Cuisine",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBSe1YI3Als-HS7uVbYrGvXup-uMxRjH_rVwfAxVpw-STD_oeQXSXaIEMGg5h8uVfsRVTNV8Qb24ncJOFQGCSzPsvrpexPMWNOQyGk2mMJKZxSQpcKg45pD72eDi9i4ZtKeXbR_0HULAlhdRhGWsmNn4Bak92D4wUmHj18k5TPS34NyCwVvzQGCCeiOleglw8S8jLS-QpaKpr3ZYQ8M4iLuc1KrVJeIObg_MkXaCSSBICluuR74mCXvDKuYllriW_V3gLpp6Xno7AXn",
    rating: 4.5,
    reviews: 89,
    distance: "1.2 km",
    isOpen: false,
    certification: "HMS",
    isFeatured: false,
  },
  {
    id: "3",
    name: "Medina Market",
    type: "Grocery & Spices",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCCFlUgl8XN7yNCmbG5kcQZBDSDDJPODyXGxiVZ-jqhUZBhRbZz-9FZNqlHY2LaWqsC3hWCrGmgygtcWs8zZANTg4qMsK73SrthCBaS6XajuZAdTRFCrrYlvZbxRC9-tDZjr6OU68ipZd8sxyTDCWp60Zb8h41qRliosGcoS2bJwPuvIFZCVvh9JH67h69EA18i0AhHA5FDAnQZR-wbqCLic7d92uE2kA4gxM6i6hrb6N7YnWMd_qXRvLJQ6XN8-vTVnW3QUwzMSoMF",
    rating: 4.2,
    reviews: 56,
    distance: "2.4 km",
    isOpen: true,
    certification: null,
    isFeatured: false,
  },
];

interface StoreCardProps {
  store: (typeof STORES)[0];
  onPress: () => void;
}

function StoreCard({ store, onPress }: StoreCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      className={`w-[280px] rounded-xl p-3 ${
        store.isFeatured
          ? "bg-slate-800 border border-primary/40"
          : "bg-slate-800 border border-slate-700 opacity-90"
      }`}
      style={{
        shadowColor: store.isFeatured ? "#1de560" : "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: store.isFeatured ? 0.3 : 0.2,
        shadowRadius: 8,
        elevation: 4,
      }}
    >
      <View className="flex-row gap-3">
        {/* Image */}
        <View className="w-20 h-20 rounded-lg bg-slate-700 overflow-hidden">
          <Image
            source={{ uri: store.image }}
            className="w-full h-full"
            contentFit="cover"
            transition={200}
          />
        </View>

        {/* Info */}
        <View className="flex-1 justify-center">
          <View className="flex-row items-start justify-between">
            <Text className="font-bold text-white flex-1 pr-2" numberOfLines={1}>
              {store.name}
            </Text>
            {store.certification && (
              <View
                className={`px-1.5 py-0.5 rounded ${
                  store.certification === "AVS"
                    ? "bg-primary/20"
                    : "bg-slate-700"
                }`}
              >
                <Text
                  className={`text-[10px] font-bold ${
                    store.certification === "AVS"
                      ? "text-primary"
                      : "text-slate-300"
                  }`}
                >
                  {store.certification}
                </Text>
              </View>
            )}
          </View>
          <Text className="text-xs text-slate-400 mb-1" numberOfLines={1}>
            {store.type}
          </Text>
          <View className="flex-row items-center gap-1 mb-1">
            <MaterialIcons name="star" size={14} color="#fbbf24" />
            <Text className="text-xs font-bold text-white">{store.rating}</Text>
            <Text className="text-xs text-slate-400">({store.reviews})</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <MaterialIcons name="near-me" size={12} color="#94a3b8" />
            <Text className="text-xs text-slate-400">{store.distance}</Text>
            <Text className="text-slate-500 mx-1">•</Text>
            <Text
              className={`text-xs font-medium ${
                store.isOpen ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {store.isOpen ? "Ouvert" : "Fermé"}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Button */}
      <TouchableOpacity
        className={`mt-3 w-full py-2 rounded-lg flex-row items-center justify-center gap-2 ${
          store.isFeatured
            ? "bg-primary/20 border border-primary/20"
            : "bg-slate-700"
        }`}
        activeOpacity={0.7}
      >
        <MaterialIcons
          name={store.isFeatured ? "directions" : "visibility"}
          size={18}
          color={store.isFeatured ? "#1de560" : "#ffffff"}
        />
        <Text
          className={`text-sm font-semibold ${
            store.isFeatured ? "text-primary" : "text-white"
          }`}
        >
          {store.isFeatured ? "Itinéraire" : "Voir détails"}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>(["butchers"]);

  const toggleFilter = useCallback(
    async (filterId: string) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setActiveFilters((prev) =>
        prev.includes(filterId)
          ? prev.filter((id) => id !== filterId)
          : [...prev, filterId]
      );
    },
    []
  );

  const handleMyLocation = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Center map on user location
  }, []);

  const handleStorePress = useCallback((storeId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to store details
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

        {/* Store markers */}
        <View className="absolute" style={{ top: "40%", left: "30%" }}>
          <View className="bg-surface-dark border border-slate-700 px-3 py-1 rounded-lg mb-1 flex-row items-center gap-1">
            <Text className="text-primary font-bold text-xs">$$</Text>
            <Text className="text-slate-400 text-xs">•</Text>
            <Text className="text-gold-500 text-xs">4.8★</Text>
          </View>
          <View className="w-10 h-10 rounded-full bg-surface-dark border-2 border-primary items-center justify-center">
            <MaterialIcons name="restaurant" size={20} color="#1de560" />
          </View>
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
          >
            <MaterialIcons name="my-location" size={20} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity
            className="w-10 h-10 rounded-lg bg-surface-dark/90 border border-slate-700 items-center justify-center"
            activeOpacity={0.7}
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
              placeholder="Rechercher kebab, wagyu..."
              placeholderTextColor="#94a3b8"
              className="flex-1 ml-3 text-white text-base"
              style={{ fontFamily: "Inter" }}
            />
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/alerts" as any)}
            className="relative h-12 w-12 rounded-full bg-surface-dark/90 border border-slate-700 items-center justify-center"
            activeOpacity={0.7}
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
          {FILTERS.map((filter) => {
            const isActive = activeFilters.includes(filter.id);
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
                  {filter.label}
                </Text>
                {isActive && (
                  <MaterialIcons name="close" size={18} color="#ffffff" />
                )}
                {filter.hasDropdown && !isActive && (
                  <MaterialIcons name="expand-more" size={18} color="#94a3b8" />
                )}
              </TouchableOpacity>
            );
          })}
        </Animated.ScrollView>
      </LinearGradient>

      {/* List View Toggle */}
      <Animated.View
        entering={FadeIn.delay(400).duration(400)}
        className="absolute right-4"
        style={{ bottom: 280 + insets.bottom }}
      >
        <TouchableOpacity
          className="flex-row items-center gap-2 bg-surface-dark border border-slate-600 h-12 px-5 rounded-full"
          activeOpacity={0.8}
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <MaterialIcons name="format-list-bulleted" size={20} color="#1de560" />
          <Text className="font-semibold text-sm text-white">Vue Liste</Text>
        </TouchableOpacity>
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
            <Text className="text-lg font-bold text-white">Lieux à proximité</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text className="text-primary text-sm font-semibold">Voir tout</Text>
            </TouchableOpacity>
          </View>

          {/* Store Cards */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
            snapToInterval={CARD_WIDTH + 16}
            decelerationRate="fast"
          >
            {STORES.map((store, index) => (
              <Animated.View
                key={store.id}
                entering={FadeInRight.delay(400 + index * 100).duration(400)}
              >
                <StoreCard
                  store={store}
                  onPress={() => handleStorePress(store.id)}
                />
              </Animated.View>
            ))}
          </ScrollView>
        </View>
      </Animated.View>
    </View>
  );
}
