/**
 * Marketplace Tab Screen
 * 
 * Point d'entrée marketplace dans les tabs
 * Redirige vers le catalog ou coming-soon selon le feature flag
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useHaptics, useTheme, useTranslation } from "@/hooks";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { IslamicPattern } from "@/components/ui";
import { useFeatureFlagsStore, useLocalCartStore } from "@/store";
import { trpc } from "@/lib/trpc";
import { brand, gold, halalStatus } from "@/theme/colors";

interface Product {
  id: string;
  name: string;
  brand: string | null;
  price: number | null;
  image: string | null;
  halalStatus: string;
  certifierName: string | null;
}

const CATEGORIES = [
  { id: "all" as const, icon: "apps" as const },
  { id: "food" as const, icon: "restaurant" as const },
  { id: "cosmetics" as const, icon: "spa" as const },
  { id: "supplements" as const, icon: "medication" as const },
];

const HALAL_STATUS_COLOR: Record<string, string> = {
  halal: halalStatus.halal.base,
  doubtful: halalStatus.doubtful.base,
  haram: halalStatus.haram.base,
  unknown: halalStatus.unknown.base,
};

const ProductCard = React.memo(function ProductCard({ product, index }: { product: Product; index: number }) {
  const { isDark, colors } = useTheme();
  const { impact, notification } = useHaptics();
  const { t } = useTranslation();
  const { addItem } = useLocalCartStore();

  const handlePress = useCallback(() => {
    impact();
    router.push(`/(marketplace)/product/${product.id}` as any);
  }, [product.id, impact]);

  const handleAddToCart = useCallback(() => {
    notification();
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price ?? 0,
      image: product.image ?? "",
    });
  }, [product, addItem, notification]);

  const statusColor = HALAL_STATUS_COLOR[product.halalStatus] ?? "#6b7280";

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 100).duration(400)}
      className="w-44 mr-4"
    >
      {/* Outer view: elevation + no overflow clipping */}
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`${product.name}, ${product.brand ?? ""}, ${product.halalStatus}`}
        style={{
          backgroundColor: colors.card,
          borderColor: colors.borderLight,
          borderWidth: 1,
          borderRadius: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 12,
          elevation: 4,
        }}
      >
        {/* Inner view: overflow hidden + borderRadius for clipping */}
        <View style={{ borderRadius: 16, overflow: "hidden" }}>
          <View className="relative">
            {product.image ? (
              <Image
                source={{ uri: product.image }}
                className="w-full h-32"
                contentFit="cover"
                transition={200}
                accessibilityLabel={`Photo de ${product.name}`}
              />
            ) : (
              <View
                className="w-full h-32 items-center justify-center"
                style={{ backgroundColor: colors.buttonSecondary }}
              >
                <MaterialIcons name="inventory-2" size={32} color={colors.iconSecondary} />
              </View>
            )}
            {/* Halal status badge */}
            <View
              className="absolute top-2 left-2 px-2 py-1 rounded-full"
              style={{ backgroundColor: statusColor }}
            >
              <Text className="text-[10px] font-bold text-white uppercase">
                {product.halalStatus}
              </Text>
            </View>
          </View>

          <View className="p-3">
            {product.brand && (
              <Text className="text-xs mb-1" style={{ color: colors.textSecondary }}>
                {product.brand}
              </Text>
            )}
            <Text
              className="text-sm font-semibold mb-2"
              numberOfLines={2}
              style={{ color: colors.textPrimary }}
            >
              {product.name}
            </Text>

            {product.certifierName && (
              <View className="flex-row items-center mb-2">
                <MaterialIcons name="verified" size={14} color={colors.primary} />
                <Text className="text-xs ml-1" numberOfLines={1} style={{ color: colors.textSecondary }}>
                  {product.certifierName}
                </Text>
              </View>
            )}

            <View className="flex-row items-center justify-between">
              {product.price != null ? (
                <Text className="text-lg font-bold" style={{ color: colors.primary }}>
                  {product.price.toFixed(2)}€
                </Text>
              ) : (
                <Text className="text-xs" style={{ color: colors.textMuted }}>
                  Prix N/A
                </Text>
              )}
              <TouchableOpacity
                onPress={handleAddToCart}
                className="p-2 rounded-full"
                style={{ backgroundColor: colors.primaryLight }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`${t.marketplace.addToCart} ${product.name}`}
              >
                <MaterialIcons name="add-shopping-cart" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

export default function MarketplaceTab() {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const { impact } = useHaptics();
  const { t } = useTranslation();
  const { flags } = useFeatureFlagsStore();
  const { itemCount } = useLocalCartStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const unreadQuery = trpc.notification.getUnreadCount.useQuery(undefined, {
    staleTime: 30_000,
  });
  const unreadCount = unreadQuery.data?.count ?? 0;

  const productsQuery = trpc.product.search.useQuery(
    {
      category: selectedCategory === "all" ? undefined : selectedCategory,
      halalStatus: "halal" as const,
      limit: 10,
    },
    { staleTime: 60_000 },
  );

  const products = useMemo<Product[]>(
    () =>
      (productsQuery.data?.items ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        price: p.price,
        image: p.imageUrl,
        halalStatus: p.halalStatus,
        certifierName: p.certifierName,
      })),
    [productsQuery.data?.items],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([productsQuery.refetch(), unreadQuery.refetch()]);
    setRefreshing(false);
  }, [productsQuery, unreadQuery]);

  const handleCategoryPress = useCallback((categoryId: string) => {
    impact();
    setSelectedCategory(categoryId);
  }, []);

  const handleViewAllPress = useCallback(() => {
    impact();
    router.push("/(marketplace)/catalog" as any);
  }, []);

  const handleCartPress = useCallback(() => {
    impact();
    router.push("/(marketplace)/cart" as any);
  }, []);

  const handleAlertsPress = useCallback(() => {
    impact();
    router.navigate("/(tabs)/alerts" as any);
  }, []);

  if (!flags.marketplaceEnabled) {
    return (
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        {/* Background Islamic Pattern */}
        <IslamicPattern variant="khatam" opacity={0.04} />

        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 16,
            paddingBottom: 100,
          }}
        >
          <Animated.View
            entering={FadeIn.delay(100).duration(400)}
            className="px-5 mb-6"
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                  {t.marketplace.title}
                </Text>
                <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                  {t.common.comingSoon}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleAlertsPress}
                className="relative h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: colors.card, borderColor: colors.borderLight, borderWidth: 1 }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t.common.notifications}
                accessibilityHint={t.common.viewAlerts}
              >
                <MaterialIcons
                  name="notifications"
                  size={22}
                  color={colors.iconPrimary}
                />
                {unreadCount > 0 && (
                  <View
                    className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: gold[500], borderColor: colors.card, borderWidth: 2 }}
                  />
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(200).duration(600)}
            className="px-5"
          >
            <LinearGradient
              colors={isDark ? ["#1a2420", "#0d1b13"] : ["#f0fdf4", "#dcfce7"]}
              className="rounded-3xl p-8 items-center"
              style={{
                shadowColor: brand.primary,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.15,
                shadowRadius: 24,
                elevation: 8,
              }}
            >
              <View
                className="w-24 h-24 rounded-full items-center justify-center mb-6"
                style={{ backgroundColor: colors.primaryLight }}
              >
                <MaterialIcons name="storefront" size={48} color={colors.primary} />
              </View>
              <Text className="text-xl font-bold text-center mb-2" style={{ color: colors.textPrimary }}>
                {t.marketplace.comingSoon}
              </Text>
              <Text className="text-sm text-center mb-6" style={{ color: colors.textSecondary }}>
                {t.marketplace.comingSoonDesc}
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(marketplace)/coming-soon" as any)}
                className="px-6 py-3 rounded-xl flex-row items-center gap-2"
                style={{ backgroundColor: colors.primary }}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={t.marketplace.joinWaitlist}
                accessibilityHint={t.marketplace.joinWaitlist}
              >
                <MaterialIcons name="notifications-active" size={20} color="#0d1b12" />
                <Text className="font-bold" style={{ color: colors.textPrimary }}>{t.marketplace.joinWaitlist}</Text>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Background Islamic Pattern */}
      <IslamicPattern variant="khatam" opacity={0.04} />

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={brand.primary}
          />
        }
      >
        <Animated.View
          entering={FadeIn.delay(100).duration(400)}
          className="flex-row items-center justify-between px-5 mb-4"
        >
          <View>
            <Text accessibilityRole="header" className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
              {t.marketplace.title}
            </Text>
            <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              {t.marketplace.subtitle}
            </Text>
          </View>

          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={handleAlertsPress}
              className="relative h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.card, borderColor: colors.borderLight, borderWidth: 1 }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t.common.notifications}
              accessibilityHint={t.common.viewAlerts}
            >
              <MaterialIcons
                name="notifications"
                size={22}
                color={colors.iconPrimary}
              />
              {unreadCount > 0 && (
                <View
                  className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: gold[500], borderColor: colors.card, borderWidth: 2 }}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCartPress}
              className="relative h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.card, borderColor: colors.borderLight, borderWidth: 1 }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t.marketplace.viewCart}
              accessibilityHint={t.marketplace.viewCart}
            >
              <MaterialIcons
                name="shopping-cart"
                size={22}
                color={colors.iconPrimary}
              />
              {itemCount > 0 && (
                <View
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full items-center justify-center px-1"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Text className="text-[10px] font-bold text-white">
                    {itemCount > 99 ? "99+" : itemCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(150).duration(400)}
          className="mb-6"
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          >
            {CATEGORIES.map((category, index) => {
              const categoryLabel = t.marketplace.categories[category.id];
              const isSelected = selectedCategory === category.id;
              return (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => handleCategoryPress(category.id)}
                  className="flex-row items-center px-4 py-2 rounded-full mr-3"
                  style={
                    isSelected
                      ? { backgroundColor: colors.primary }
                      : { backgroundColor: colors.card, borderColor: colors.borderLight, borderWidth: 1 }
                  }
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`${categoryLabel}${isSelected ? `, ${t.common.selected}` : ""}`}
                >
                  <MaterialIcons
                    name={category.icon}
                    size={18}
                    color={isSelected ? "#fff" : colors.iconSecondary}
                  />
                  <Text
                    className="ml-2 text-sm font-medium"
                    style={{ color: isSelected ? "#fff" : colors.textSecondary }}
                  >
                    {categoryLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          className="mb-6"
        >
          <View className="flex-row items-center justify-between px-5 mb-4">
            <Text accessibilityRole="header" className="text-lg font-bold" style={{ color: colors.textPrimary }}>
              {t.marketplace.featured}
            </Text>
            <TouchableOpacity onPress={handleViewAllPress} activeOpacity={0.7} accessibilityRole="link" accessibilityLabel={`${t.home.viewAll} ${t.marketplace.featured}`}>
              <Text className="text-sm font-medium" style={{ color: colors.primary }}>
                {t.home.viewAll}
              </Text>
            </TouchableOpacity>
          </View>

          {productsQuery.isLoading ? (
            <View className="items-center justify-center py-8">
              <RefreshControl refreshing={true} tintColor={brand.primary} />
            </View>
          ) : products.length === 0 ? (
            <View className="items-center justify-center py-8 px-5">
              <MaterialIcons name="inventory-2" size={40} color={colors.iconSecondary} />
              <Text className="text-sm mt-3 text-center" style={{ color: colors.textSecondary }}>
                Aucun produit trouvé
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 20, paddingRight: 8 }}
            >
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </ScrollView>
          )}
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(300).duration(400)}
          className="px-5"
        >
          <LinearGradient
            colors={isDark ? ["#1e293b", "#0f172a"] : ["#fff7ed", "#ffedd5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-2xl p-5 flex-row items-center"
            style={{
              shadowColor: gold[500],
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <View className="flex-1 mr-4">
              <Text className="text-lg font-bold mb-1" style={{ color: colors.textPrimary }}>
                {t.marketplace.freeShipping}
              </Text>
              <Text className="text-sm mb-3" style={{ color: colors.textSecondary }}>
                {t.marketplace.freeShippingDesc}
              </Text>
              <TouchableOpacity
                onPress={handleViewAllPress}
                className="flex-row items-center"
                activeOpacity={0.7}
                accessibilityRole="link"
                accessibilityLabel={t.marketplace.discoverOffers}
                accessibilityHint={t.marketplace.freeShipping}
              >
                <Text className="text-sm font-semibold" style={{ color: gold[500] }}>
                  {t.marketplace.discoverOffers}
                </Text>
                <MaterialIcons name="arrow-forward" size={16} color={gold[500]} />
              </TouchableOpacity>
            </View>
            <View
              className="w-16 h-16 rounded-full items-center justify-center"
              style={{ backgroundColor: "rgba(212, 175, 55, 0.20)" }}
            >
              <MaterialIcons name="local-shipping" size={32} color={gold[500]} />
            </View>
          </LinearGradient>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
