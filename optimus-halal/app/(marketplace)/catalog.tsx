/**
 * Marketplace Product Catalog Screen
 * 
 * Catalogue de produits avec:
 * - Header avec avatar et panier
 * - Barre de recherche
 * - Filtres par catégorie (chips)
 * - Carousel featured
 * - Grille de produits
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { FlashList } from "@shopify/flash-list";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useHaptics, useTheme, useTranslation } from "@/hooks";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { PremiumBackground } from "@/components/ui";
import { PressableScale } from "@/components/ui/PressableScale";

import { useLocalAuthStore, useLocalCartStore } from "@/store";

const CATEGORY_IDS = ["all", "food", "cosmetics", "supplements", "fashion"] as const;

const FEATURED_PRODUCTS = [
  {
    id: "featured-1",
    title: "Essentiels du Ramadan",
    subtitle: "Dattes & miel premium jusqu'à -20%",
    badge: "Featured",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBSydPdxZkbVTmdP0z1yTXIQ4kfDkK9f0tJTboDSHFVpxaIERf0-KjUPVCm02rM3wH9Zvc-fhRgX-Wo4F_rc8H2_f3QuEv75cIQAXIHuZrnTtTbVLECemqmRhRr_vMMos-0jvwBkvjOjrr5_pin7l_A92wUlqUdflCqiIbRedV8yfhelyGCaLIw07bOhswLhJ2oQuUFxOKF_UWcU-EkfEnnommR9nnpcONndGg_JYMhrD8QMtEIZcSybIjoekxWDz7v3fwPpDRT8UGZ",
  },
];

const PRODUCTS = [
  {
    id: "1",
    name: "Miel Sidr Bio Pur",
    brand: "Nature's Gold",
    price: 24.99,
    rating: 4.9,
    reviews: 120,
    certification: "HALAL",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBdIiUR4fY67MPw4owAn-A9H27gIwfWc24nLl8PIPZBnKIZRkJcP4k6Fyi9QGh4b0lzJklAM4B3WURgNrhaSEO7FlTGPnPrbtO3mjksFhgxxF8o_RK7Y9jVqKp106t3awgaz6AZxD2OukOnEmZEHFRN5wHGd-myBS6CsSY9k1BIKsKf-BRykq5EGah9LrnAP4n6yYilz9t9hzGsCl1Usga_x1BZ8pWCmI6apcNGY-AG4w1ua2lIgZEw0Wt6BxBWytLyy07sNxUWAVKt",
    isFavorite: false,
  },
  {
    id: "2",
    name: "Beef Jerky Artisanal - Épicé",
    brand: "Halal Snacks",
    price: 8.50,
    rating: 4.5,
    reviews: 86,
    certification: "HMC",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAoGC4fmXbGWty8vcc5jGibgsVTzyLlW3pN2YROoOver_ohA-p5DbecKc4HgqLdh3ywSPQ60bjvhow2YXEO81B0ejYKn-cAn55WwRN5PxhAKpnfpwFGRtE7BmJ_PsnuZeBuWp64M_6rImswZwkJuV0um8lfn8FsqP3of9dv88ED57R6T719WCSVDkbHmclQcj3X2znv3My7d2pJdoMv4FLzrdLdWFwpW7dDmKJ36frndQu3FqXo9qIdXQ-AN9iGJNbfRJHcQwehdYYX",
    isFavorite: true,
  },
  {
    id: "3",
    name: "Huile d'Olive Extra Vierge",
    brand: "Pure Press",
    price: 18.50,
    rating: 4.8,
    reviews: 203,
    certification: "BIO",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuANqkIXSLfL5zsGM8nxUo8ADFCKXU4qNAkLEI9WkRHAFZKoFtvtBwaFNo4by1yQ3YD2Ey5ovfeyz92AmzoEc4Euky7Ak6DRwtT3SjcPcz7LhpxqYhBBblTMBx668TfnclgvFvD3S2TaDC2YL0tk16CZXJ1wiM2KpksSFckKBo_7Z5lIIsxTC_UiQWhG142gBeQi8ZlJB7NbYWPip1hRDNtO1AUrkYGBTNjhuEKKVaL1ezJFuIS9hncNIG5OAgNbY1a-voH1W1g8nBSN",
    isFavorite: false,
  },
  {
    id: "4",
    name: "Flocons d'Avoine Bio",
    brand: "Grain Masters",
    price: 4.99,
    rating: 4.7,
    reviews: 156,
    certification: "BIO",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA3NEB9XwxYqOF9dmPA43aItsxAjGv5NuFLXDnchqleK9zmSKL3atP34x8GVzIrePFXTHdqu47xFygf82pDDgVEEja5i13Rl34xLqeQMJpBiLj4eGQqOkCmfMpq1j_mXJJP8FULjq1VRztL_ZYqI6tdQkIsevnxfFdsN9iQjf1LwTydb7dTNr0Ln6ssjHg6UY3uqBGWDyQoBrodOPn64uhbOyGkugEj1LEPjDI8_lCysSw7dDgXfeYllUfUFlI1IYijuIufnOqJoxB7",
    isFavorite: false,
  },
  {
    id: "5",
    name: "Dattes Medjool Premium",
    brand: "Desert Gold",
    price: 12.99,
    rating: 4.9,
    reviews: 312,
    certification: "HALAL",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBSydPdxZkbVTmdP0z1yTXIQ4kfDkK9f0tJTboDSHFVpxaIERf0-KjUPVCm02rM3wH9Zvc-fhRgX-Wo4F_rc8H2_f3QuEv75cIQAXIHuZrnTtTbVLECemqmRhRr_vMMos-0jvwBkvjOjrr5_pin7l_A92wUlqUdflCqiIbRedV8yfhelyGCaLIw07bOhswLhJ2oQuUFxOKF_UWcU-EkfEnnommR9nnpcONndGg_JYMhrD8QMtEIZcSybIjoekxWDz7v3fwPpDRT8UGZ",
    isFavorite: true,
  },
  {
    id: "6",
    name: "Savon Noir Marocain",
    brand: "Hammam Secrets",
    price: 9.99,
    rating: 4.6,
    reviews: 78,
    certification: "BIO",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDtxMnAlTfjVJBFwD6YetTmUam4oYp6PkDhy16DDP4FTjQCKDqwshRDyh27jtCc09KbmA9s9C-FStSP9p5yaxvM3Dh7F8N-sMZRrK67395MgUmMTSZnoRA-kQJYOhZuv128AMCBI8LfbPoEqgIaWlnZkmMfJ-KI3QYiP7VvtcO7jgAcV8zhs5GbddiZIObB10oLHdUKRyl8hWxrsMS0sn2fr2sCp9YZGVj9ItdWRu48Hxw_5uyihW2GQBDymNlccfZHM-vwm36xOZeJ",
    isFavorite: false,
  },
];

const catalogKeyExtractor = (item: (typeof PRODUCTS)[0]) => item.id;

interface ProductCardProps {
  product: typeof PRODUCTS[0];
  onPress: () => void;
  onAddToCart: () => void;
  onToggleFavorite: () => void;
}

const ProductCard = React.memo(function ProductCard({ product, onPress, onAddToCart, onToggleFavorite }: ProductCardProps) {
  const { isDark, colors } = useTheme();

  return (
    <PressableScale
      onPress={onPress}
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View className="flex-1 bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700">
        {/* Image */}
        <View className="relative aspect-[4/5] bg-slate-100 dark:bg-slate-700">
          <Image
            source={{ uri: product.image }}
            className="w-full h-full"
            contentFit="cover"
            transition={200}
          />

          {/* Certification Badge */}
          <View className="absolute top-2 left-2 flex-row items-center gap-1 bg-white/95 dark:bg-slate-900/90 px-2 py-1 rounded-md">
            <MaterialIcons name="verified" size={12} color="#059669" />
            <Text className="text-[10px] font-bold text-green-700 dark:text-primary">
              {product.certification}
            </Text>
          </View>

          {/* Favorite Button */}
          <Pressable
            onPress={onToggleFavorite}
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/60 dark:bg-black/40 items-center justify-center"
          >
            <MaterialIcons
              name={product.isFavorite ? "favorite" : "favorite-border"}
              size={18}
              color={product.isFavorite ? "#ef4444" : isDark ? "#ffffff" : "#475569"}
            />
          </Pressable>
        </View>

        {/* Content */}
        <View className="p-3 flex-1">
          {/* Rating */}
          <View className="flex-row items-center gap-1 mb-1">
            <MaterialIcons name="star" size={14} color="#fbbf24" />
            <Text className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {product.rating} ({product.reviews})
            </Text>
          </View>

          {/* Name */}
          <Text
            className="text-sm font-semibold text-slate-800 dark:text-white leading-snug mb-2"
            numberOfLines={2}
          >
            {product.name}
          </Text>

          {/* Price & Add Button */}
          <View className="flex-row items-center justify-between mt-auto">
            <Text className="text-base font-bold text-slate-800 dark:text-white">
              €{product.price.toFixed(2)}
            </Text>
            <PressableScale
              onPress={onAddToCart}
              style={{
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
              }}
            >
              <View className="h-8 w-8 rounded-lg bg-primary items-center justify-center">
                <MaterialIcons name="add" size={20} color="#102216" />
              </View>
            </PressableScale>
          </View>
        </View>
      </View>
    </PressableScale>
  );
});

export default function MarketplaceCatalogScreen() {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const { impact, notification } = useHaptics();
  const { t } = useTranslation();

  const categories = useMemo(() => CATEGORY_IDS.map((id) => ({
    id,
    label: t.catalog.categories[id],
  })), [t]);

  const { user } = useLocalAuthStore();
  const { itemCount } = useLocalCartStore();

  // Accept optional search/category params from scan-result navigation
  const { search: initialSearch, category: initialCategory } = useLocalSearchParams<{
    search?: string;
    category?: string;
  }>();

  const [searchQuery, setSearchQuery] = useState(initialSearch ?? "");
  const [selectedCategory, setSelectedCategory] = useState(
    initialCategory && CATEGORY_IDS.includes(initialCategory as any) ? initialCategory : "all"
  );
  const [products, setProducts] = useState(PRODUCTS);

  const filteredProducts = useMemo(() => {
    let result = products;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(query) || p.brand.toLowerCase().includes(query)
      );
    }
    return result;
  }, [products, searchQuery]);

  const handleCategoryPress = useCallback(async (categoryId: string) => {
    impact();
    setSelectedCategory(categoryId);
  }, []);

  const handleProductPress = useCallback(async (productId: string) => {
    impact();
    router.navigate({ pathname: "/(marketplace)/product/[id]", params: { id: productId } } as any);
  }, []);

  const handleAddToCart = useCallback(async (_productId: string) => {
    notification();
    // Add to cart logic
  }, []);

  const handleToggleFavorite = useCallback(async (productId: string) => {
    impact();
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, isFavorite: !p.isFavorite } : p
      )
    );
  }, []);

  const handleCartPress = useCallback(async () => {
    impact();
    router.navigate("/(marketplace)/cart" as any);
  }, []);

  return (
    <View className="flex-1">
      <PremiumBackground />
      {/* Sticky Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        className="border-b border-slate-200/50 dark:border-slate-800"
        style={{ paddingTop: insets.top, backgroundColor: isDark ? "rgba(12,12,12,0.92)" : "rgba(243,241,237,0.92)" }}
      >
        {/* Top Row */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <View className="flex-row items-center gap-3">
            <View className="h-9 w-9 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
              <Image
                source={{
                  uri: user?.avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuC21UIb5DPLKk9hCMsQFts76mIFDU9E59eHURz_1sJY7VCuIdFDM3dF4uWvbol6S4YsiI_I8V_Uxb75wJIsSMhoN44b87aYjZPtRRDKA7meEVYi_tUecDyCISlPFaoE-A414mdoDdW3CsHQzmyTBMR3VuPE_VFY6FnRAVBTF29U0N6JyZ8-AD7tTXjSV98_LL5rCswxiaIMnbGsRi2KtWUm2lJKaccwbssUxibPATHQzjbQ30J49KwYw7lOKC5nWJfI6SKUlxINJvsT",
                }}
                className="w-full h-full"
                contentFit="cover"
                transition={200}
              />
            </View>
            <Text className="text-xl font-bold text-slate-800 dark:text-white">
              Marketplace
            </Text>
          </View>

          {/* Cart Button */}
          <Pressable
            onPress={handleCartPress}
            className="relative p-2 rounded-full"
          >
            <MaterialIcons
              name="shopping-bag"
              size={24}
              color={isDark ? "#ffffff" : "#1e293b"}
            />
            {itemCount > 0 && (
              <View className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-primary rounded-full border-2 border-background-light dark:border-background-dark" />
            )}
          </Pressable>
        </View>

        {/* Search Bar */}
        <View className="px-4 pb-3">
          <View className="relative">
            <View className="absolute inset-y-0 left-0 pl-3 justify-center">
              <MaterialIcons name="search" size={20} color="#9ca3af" />
            </View>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t.location.searchProducts}
              placeholderTextColor="#9ca3af"
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 rounded-2xl text-sm text-slate-900 dark:text-white"
              style={{ fontSize: 14 }}
            />
          </View>
        </View>
      </Animated.View>

      <FlashList
        data={filteredProducts}
        keyExtractor={catalogKeyExtractor}
        numColumns={2}
        renderItem={({ item }) => (
          <View style={{ flex: 1, paddingHorizontal: 8, marginBottom: 16 }}>
            <ProductCard
              product={item}
              onPress={() => handleProductPress(item.id)}
              onAddToCart={() => handleAddToCart(item.id)}
              onToggleFavorite={() => handleToggleFavorite(item.id)}
            />
          </View>
        )}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Category Chips */}
            <Animated.View entering={FadeInRight.delay(200).duration(400)} className="py-2">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
              >
                {categories.map((category) => (
                  <PressableScale
                    key={category.id}
                    onPress={() => handleCategoryPress(category.id)}
                  >
                    <View
                      className={`px-5 py-2 rounded-full ${
                        selectedCategory === category.id
                          ? "bg-primary"
                          : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700"
                      }`}
                    >
                      <Text
                        className={`text-sm font-semibold ${
                          selectedCategory === category.id
                            ? "text-slate-900"
                            : "text-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {category.label}
                      </Text>
                    </View>
                  </PressableScale>
                ))}
              </ScrollView>
            </Animated.View>

            {/* Featured Carousel */}
            <Animated.View
              entering={FadeInDown.delay(300).duration(500)}
              className="mt-2 px-4"
            >
              <View className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden">
                <Image
                  source={{ uri: FEATURED_PRODUCTS[0].image }}
                  className="w-full h-full"
                  contentFit="cover"
                  transition={200}
                />
                <LinearGradient
                  colors={["rgba(15,23,42,0.8)", "rgba(15,23,42,0.4)", "transparent"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="absolute inset-0"
                />
                <View className="absolute inset-0 justify-center pl-6 pr-12">
                  <View className="bg-amber-500/90 px-2 py-1 rounded self-start mb-2">
                    <Text className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">
                      Featured
                    </Text>
                  </View>
                  <Text className="text-white text-xl font-bold leading-tight mb-1">
                    {FEATURED_PRODUCTS[0].title}
                  </Text>
                  <Text className="text-slate-200 text-xs font-medium mb-4 max-w-[200px]">
                    {FEATURED_PRODUCTS[0].subtitle}
                  </Text>
                  <PressableScale
                    style={{
                      alignSelf: "flex-start",
                      shadowColor: colors.primary,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                    }}
                  >
                    <View className="bg-primary px-4 py-2.5 rounded-lg">
                      <Text className="text-slate-900 text-xs font-bold">
                        {t.catalog.viewCollection}
                      </Text>
                    </View>
                  </PressableScale>
                </View>
              </View>
            </Animated.View>

            {/* Section Header */}
            <Animated.View
              entering={FadeIn.delay(400).duration(400)}
              className="flex-row items-center justify-between px-4 pt-6 pb-3"
            >
              <Text className="text-lg font-bold text-slate-800 dark:text-white">
                {t.catalog.popularSelection}
              </Text>
              <PressableScale>
                <Text className="text-sm font-medium text-primary">{t.home.viewAll}</Text>
              </PressableScale>
            </Animated.View>
          </>
        }
      />
    </View>
  );
}
