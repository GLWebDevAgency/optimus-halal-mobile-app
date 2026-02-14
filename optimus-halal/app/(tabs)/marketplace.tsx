/**
 * Marketplace Tab Screen
 * 
 * Point d'entrée marketplace dans les tabs
 * Redirige vers le catalog ou coming-soon selon le feature flag
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  useColorScheme,
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
  SlideInRight,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { Card, Badge } from "@/components/ui";
import { useFeatureFlagsStore, useLocalCartStore, useLocalAlertsStore } from "@/store";
import { colors } from "@/constants/theme";

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  badges: string[];
  isNew?: boolean;
}

const FEATURED_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Huile d'Olive Bio Extra Vierge",
    brand: "Al-Baraka",
    price: 12.99,
    originalPrice: 15.99,
    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400",
    rating: 4.8,
    reviewCount: 234,
    badges: ["Halal", "Bio", "Premium"],
    isNew: true,
  },
  {
    id: "2",
    name: "Miel de Sidr du Yémen",
    brand: "Hadhramout",
    price: 45.00,
    image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400",
    rating: 4.9,
    reviewCount: 156,
    badges: ["Halal", "Premium", "Authentique"],
  },
  {
    id: "3",
    name: "Dattes Medjool Premium",
    brand: "Jordan Valley",
    price: 18.50,
    image: "https://images.unsplash.com/photo-1593085512500-5d55148d6f0d?w=400",
    rating: 4.7,
    reviewCount: 89,
    badges: ["Halal", "Bio"],
  },
];

const CATEGORIES = [
  { id: "all", name: "Tous", icon: "apps" as const },
  { id: "food", name: "Alimentaire", icon: "restaurant" as const },
  { id: "cosmetics", name: "Cosmétiques", icon: "spa" as const },
  { id: "supplements", name: "Compléments", icon: "medication" as const },
];

function ProductCard({ product, index }: { product: Product; index: number }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { addItem } = useLocalCartStore();

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/(marketplace)/product/${product.id}` as any);
  }, [product.id]);

  const handleAddToCart = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    });
  }, [product, addItem]);

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 100).duration(400)}
      className="w-44 mr-4"
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`${product.name}, ${product.brand}, ${product.price.toFixed(2)} euros, note ${product.rating}`}
        className="bg-white dark:bg-surface-dark rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700/50"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 12,
          elevation: 4,
        }}
      >
        <View className="relative">
          <Image
            source={{ uri: product.image }}
            className="w-full h-32"
            contentFit="cover"
            transition={200}
            accessibilityLabel={`Photo de ${product.name}`}
          />
          {product.isNew && (
            <View className="absolute top-2 left-2">
              <LinearGradient
                colors={[colors.primary.DEFAULT, colors.primary[700]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="px-2 py-1 rounded-full"
              >
                <Text className="text-[10px] font-bold text-white">NOUVEAU</Text>
              </LinearGradient>
            </View>
          )}
          {product.originalPrice && (
            <View className="absolute top-2 right-2 bg-red-500 px-2 py-1 rounded-full">
              <Text className="text-[10px] font-bold text-white">
                -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
              </Text>
            </View>
          )}
        </View>

        <View className="p-3">
          <Text className="text-xs text-slate-500 dark:text-slate-400 mb-1">
            {product.brand}
          </Text>
          <Text
            className="text-sm font-semibold text-slate-900 dark:text-white mb-2"
            numberOfLines={2}
          >
            {product.name}
          </Text>

          <View className="flex-row items-center mb-2">
            <MaterialIcons name="star" size={14} color={colors.gold.DEFAULT} />
            <Text className="text-xs font-medium text-slate-700 dark:text-slate-300 ml-1">
              {product.rating}
            </Text>
            <Text className="text-xs text-slate-400 dark:text-slate-500 ml-1">
              ({product.reviewCount})
            </Text>
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-baseline">
              <Text className="text-lg font-bold text-primary dark:text-primary">
                {product.price.toFixed(2)}€
              </Text>
              {product.originalPrice && (
                <Text className="text-xs text-slate-400 line-through ml-1">
                  {product.originalPrice.toFixed(2)}€
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={handleAddToCart}
              className="bg-primary/10 dark:bg-primary/20 p-2 rounded-full"
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Ajouter ${product.name} au panier`}
            >
              <MaterialIcons name="add-shopping-cart" size={16} color={colors.primary.DEFAULT} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function MarketplaceTab() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { flags } = useFeatureFlagsStore();
  const { unreadCount } = useLocalAlertsStore();
  const { itemCount } = useLocalCartStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const handleCategoryPress = useCallback((categoryId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(categoryId);
  }, []);

  const handleViewAllPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(marketplace)/catalog" as any);
  }, []);

  const handleCartPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(marketplace)/cart" as any);
  }, []);

  const handleAlertsPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(tabs)/alerts" as any);
  }, []);

  if (!flags.marketplaceEnabled) {
    return (
      <View className="flex-1 bg-background-light dark:bg-background-dark">
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
                <Text className="text-2xl font-bold text-slate-900 dark:text-white">
                  Marketplace
                </Text>
                <Text className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Bientôt disponible
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleAlertsPress}
                className="relative h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-700/50"
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Notifications"
                accessibilityHint="Voir les alertes"
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
                shadowColor: colors.primary.DEFAULT,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.15,
                shadowRadius: 24,
                elevation: 8,
              }}
            >
              <View className="w-24 h-24 rounded-full bg-primary/20 items-center justify-center mb-6">
                <MaterialIcons name="storefront" size={48} color={colors.primary.DEFAULT} />
              </View>
              <Text className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">
                Le Marketplace arrive bientôt !
              </Text>
              <Text className="text-sm text-slate-600 dark:text-slate-400 text-center mb-6">
                Découvrez bientôt des produits halal certifiés, éthiques et de qualité premium.
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(marketplace)/coming-soon" as any)}
                className="bg-primary px-6 py-3 rounded-xl flex-row items-center gap-2"
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Rejoindre la liste d'attente"
                accessibilityHint="S'inscrire pour être notifié du lancement du marketplace"
              >
                <MaterialIcons name="notifications-active" size={20} color="#0d1b12" />
                <Text className="font-bold text-slate-900">Rejoindre la liste d'attente</Text>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
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
            tintColor={colors.primary.DEFAULT}
          />
        }
      >
        <Animated.View
          entering={FadeIn.delay(100).duration(400)}
          className="flex-row items-center justify-between px-5 mb-4"
        >
          <View>
            <Text accessibilityRole="header" className="text-2xl font-bold text-slate-900 dark:text-white">
              Marketplace
            </Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Produits halal certifiés
            </Text>
          </View>

          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={handleAlertsPress}
              className="relative h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-700/50"
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              accessibilityHint="Voir les alertes"
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

            <TouchableOpacity
              onPress={handleCartPress}
              className="relative h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-700/50"
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Panier"
              accessibilityHint="Voir le panier"
            >
              <MaterialIcons
                name="shopping-cart"
                size={22}
                color={isDark ? "#ffffff" : "#0d1b13"}
              />
              {itemCount > 0 && (
                <View className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-primary items-center justify-center px-1">
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
            {CATEGORIES.map((category, index) => (
              <TouchableOpacity
                key={category.id}
                onPress={() => handleCategoryPress(category.id)}
                className={`flex-row items-center px-4 py-2 rounded-full mr-3 ${
                  selectedCategory === category.id
                    ? "bg-primary"
                    : "bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700"
                }`}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`${category.name}${selectedCategory === category.id ? ", sélectionné" : ""}`}
              >
                <MaterialIcons
                  name={category.icon}
                  size={18}
                  color={selectedCategory === category.id ? "#fff" : (isDark ? "#94a3b8" : "#64748b")}
                />
                <Text
                  className={`ml-2 text-sm font-medium ${
                    selectedCategory === category.id
                      ? "text-white"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          className="mb-6"
        >
          <View className="flex-row items-center justify-between px-5 mb-4">
            <Text accessibilityRole="header" className="text-lg font-bold text-slate-900 dark:text-white">
              Produits vedettes
            </Text>
            <TouchableOpacity onPress={handleViewAllPress} activeOpacity={0.7} accessibilityRole="link" accessibilityLabel="Voir tous les produits">
              <Text className="text-sm font-medium text-primary">
                Voir tout
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 20, paddingRight: 8 }}
          >
            {FEATURED_PRODUCTS.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </ScrollView>
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
              shadowColor: colors.gold.DEFAULT,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <View className="flex-1 mr-4">
              <Text className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                Livraison gratuite
              </Text>
              <Text className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                Sur toutes les commandes de plus de 50€
              </Text>
              <TouchableOpacity
                onPress={handleViewAllPress}
                className="flex-row items-center"
                activeOpacity={0.7}
                accessibilityRole="link"
                accessibilityLabel="Découvrir les offres"
                accessibilityHint="Voir toutes les offres avec livraison gratuite"
              >
                <Text className="text-sm font-semibold text-gold-600 dark:text-gold-500">
                  Découvrir les offres
                </Text>
                <MaterialIcons name="arrow-forward" size={16} color={colors.gold.DEFAULT} />
              </TouchableOpacity>
            </View>
            <View className="w-16 h-16 rounded-full bg-gold-500/20 items-center justify-center">
              <MaterialIcons name="local-shipping" size={32} color={colors.gold.DEFAULT} />
            </View>
          </LinearGradient>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
