/**
 * Favorites Screen — Refonte Premium 2-onglets (Produits | Magasins)
 *
 * Auth users  → tRPC favorites.list + store.listFavorites
 * Guest users → MMKV local stores (3 max each)
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { CameraPlusIcon, CloudSlashIcon, HeartIcon, MapPinPlusIcon, MapTrifoldIcon, ScanIcon, StorefrontIcon } from "phosphor-react-native";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { useFavoritesList, useRemoveFavorite } from "@/hooks/useFavorites";
import {
  useStoreFavoritesList,
  useRemoveStoreFavorite,
} from "@/hooks/useStoreFavorites";
import { useMe } from "@/hooks/useAuth";
import {
  useLocalFavoritesStore,
  useLocalStoreFavoritesStore,
} from "@/store";
import {
  FavoritesTabBar,
  ProductFavoriteCard,
  StoreFavoriteCard,
} from "@/components/favorites";
import { PressableScale } from "@/components/ui/PressableScale";
import { PremiumBackground } from "@/components/ui";
import { BackButton } from "@/components/ui/BackButton";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { trpc } from "@/lib/trpc";
import { STORE_CERTIFIER_TO_ID } from "@/components/map/types";

const { width } = Dimensions.get("window");

// ── Filter Categories ────────────────────────────────

function getProductCategories(t: ReturnType<typeof useTranslation>["t"]) {
  return [
    { id: "all", label: t.favorites.categories.all },
    { id: "food", label: t.favorites.categories.food },
    { id: "cosmetic", label: t.favorites.categories.cosmetic },
    { id: "halal", label: t.favorites.categories.halal },
  ];
}

function getStoreCategories(t: ReturnType<typeof useTranslation>["t"]) {
  return [
    { id: "all", label: t.favorites.storeCategories.all },
    { id: "butcher", label: t.favorites.storeCategories.butcher },
    { id: "restaurant", label: t.favorites.storeCategories.restaurant },
    { id: "supermarket", label: t.favorites.storeCategories.supermarket },
    { id: "bakery", label: t.favorites.storeCategories.bakery },
    { id: "wholesaler", label: t.favorites.storeCategories.wholesaler },
  ];
}

/** Map product category string to filter category */
function mapToFilterCategory(category: string | null | undefined): string {
  if (!category) return "food";
  const lower = category.toLowerCase();
  if (
    lower.includes("cosmétique") ||
    lower.includes("cosmetic") ||
    lower.includes("beauté") ||
    lower.includes("hygiene") ||
    lower.includes("soin")
  )
    return "cosmetic";
  if (lower.includes("halal certifié") || lower.includes("halal certified"))
    return "halal";
  return "food";
}

// ── Types ──────────────────────────────────────────────

interface MappedProduct {
  id: string;
  barcode: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  halalStatus: string | null;
  category: string | null;
  filterCategory: string;
  confidenceScore: number | null;
  certifierId: string | null;
  certifierName: string | null;
  certifierLogo: string | null;
}

interface MappedStore {
  id: string;
  name: string;
  storeType: string;
  imageUrl: string | null;
  logoUrl: string | null;
  address: string;
  city: string;
  phone: string | null;
  halalCertified: boolean;
  certifier: string;
  certifierName: string | null;
  averageRating: number;
  reviewCount: number;
  latitude: number;
  longitude: number;
}

// ── Filter Chips Component ────────────────────────────

interface FilterChipsProps {
  categories: { id: string; label: string }[];
  selected: string;
  onSelect: (id: string) => void;
  isDark: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
}

const FilterChips = React.memo(function FilterChips({
  categories,
  selected,
  onSelect,
  isDark,
  colors,
}: FilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
      style={{ paddingBottom: 12, paddingTop: 4 }}
    >
      {categories.map((cat) => {
        const isSelected = selected === cat.id;
        return (
          <PressableScale
            key={cat.id}
            onPress={() => onSelect(cat.id)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 20,
              backgroundColor: isSelected ? colors.primary : colors.card,
              borderColor: isSelected ? colors.primary : colors.borderLight,
              borderWidth: 1,
            }}
            accessibilityRole="button"
            accessibilityLabel={cat.label}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: isSelected ? "700" : "500",
                color: isSelected
                  ? isDark
                    ? "#102217"
                    : "#0d1b13"
                  : colors.textSecondary,
              }}
            >
              {cat.label}
            </Text>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
});

// ── Main Screen ──────────────────────────────────────

export default function FavoritesScreen() {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ tab?: string }>();

  // Tab state — support ?tab=stores deep link from home
  const [activeTab, setActiveTab] = useState(params.tab === "stores" ? 1 : 0);
  const [productCategory, setProductCategory] = useState("all");
  const [storeCategory, setStoreCategory] = useState("all");

  // Auth state
  const { data: me } = useMe();
  const isAuth = !!me;

  // ── Certifier trust scores + user madhab (for MadhabScoreRing) ──
  const certifierRanking = trpc.certifier.ranking.useQuery(undefined, {
    staleTime: 1000 * 60 * 30, // 30min cache
  });
  const { data: userProfile } = trpc.profile.getProfile.useQuery(undefined, { enabled: isAuth });
  const userMadhab = (userProfile?.madhab as string) ?? "general";

  const certifierScoreMap = useMemo(() => {
    const map = new Map<string, {
      trustScore: number;
      trustScoreHanafi: number | null;
      trustScoreShafii: number | null;
      trustScoreMaliki: number | null;
      trustScoreHanbali: number | null;
    }>();
    if (certifierRanking.data) {
      for (const c of certifierRanking.data) {
        map.set(c.id, {
          trustScore: c.trustScore,
          trustScoreHanafi: null,
          trustScoreShafii: null,
          trustScoreMaliki: null,
          trustScoreHanbali: null,
        });
      }
    }
    return map;
  }, [certifierRanking.data]);

  // ── Product Favorites (Auth) ──
  const {
    data: rawProductFavorites,
    isLoading: productsLoading,
    isError: productsError,
    refetch: refetchProducts,
  } = useFavoritesList({ enabled: isAuth });
  const removeProductMutation = useRemoveFavorite();

  // ── Product Favorites (Guest) ──
  const localProducts = useLocalFavoritesStore((s) => s.favorites);
  const removeLocalProduct = useLocalFavoritesStore((s) => s.removeFavorite);

  // ── Store Favorites (Auth) ──
  const {
    data: rawStoreFavorites,
    isLoading: storesLoading,
    isError: storesError,
    refetch: refetchStores,
  } = useStoreFavoritesList({ enabled: isAuth });
  const removeStoreMutation = useRemoveStoreFavorite();

  // Refetch favorites when screen regains focus (e.g. returning from scan-result
  // after toggling a favorite) — ensures the list is always fresh
  useFocusEffect(
    useCallback(() => {
      if (isAuth) {
        refetchProducts();
        refetchStores();
      }
    }, [isAuth, refetchProducts, refetchStores])
  );

  // ── Store Favorites (Guest) ──
  const localStores = useLocalStoreFavoritesStore((s) => s.favorites);
  const removeLocalStore = useLocalStoreFavoritesStore((s) => s.removeFavorite);

  // ── Map products ──
  const products: MappedProduct[] = useMemo(() => {
    if (isAuth) {
      if (!rawProductFavorites) return [];
      return rawProductFavorites
        .filter((fav) => fav.product !== null)
        .map((fav) => ({
          id: fav.productId,
          barcode: fav.product!.barcode,
          name: fav.product!.name,
          brand: fav.product!.brand ?? null,
          imageUrl: fav.product!.imageUrl ?? null,
          halalStatus: fav.product!.halalStatus ?? null,
          category: fav.product!.category ?? null,
          filterCategory: mapToFilterCategory(fav.product!.category),
          confidenceScore: fav.product!.confidenceScore ?? null,
          certifierId: fav.product!.certifierId ?? null,
          certifierName: fav.product!.certifierName ?? null,
          certifierLogo: fav.product!.certifierLogo ?? null,
        }));
    }
    // Guest: map from local MMKV store
    return localProducts.map((fav) => ({
      id: fav.productId,
      barcode: "", // guest can't navigate to scan-result without barcode
      name: fav.name,
      brand: null,
      imageUrl: fav.imageUrl,
      halalStatus: fav.halalStatus,
      category: null,
      filterCategory: "food",
      confidenceScore: null,
      certifierId: null,
      certifierName: null,
      certifierLogo: null,
    }));
  }, [isAuth, rawProductFavorites, localProducts]);

  // ── Map stores ──
  const stores: MappedStore[] = useMemo(() => {
    if (isAuth) {
      if (!rawStoreFavorites) return [];
      return rawStoreFavorites.map((fav) => ({
        id: fav.store.id,
        name: fav.store.name,
        storeType: fav.store.storeType,
        imageUrl: fav.store.imageUrl,
        logoUrl: fav.store.logoUrl,
        address: fav.store.address,
        city: fav.store.city,
        phone: fav.store.phone,
        halalCertified: fav.store.halalCertified,
        certifier: fav.store.certifier,
        certifierName: fav.store.certifierName,
        averageRating: Number(fav.store.averageRating) || 0,
        reviewCount: fav.store.reviewCount ?? 0,
        latitude: Number(fav.store.latitude),
        longitude: Number(fav.store.longitude),
      }));
    }
    // Guest: limited store data
    return localStores.map((fav) => ({
      id: fav.storeId,
      name: fav.name,
      storeType: fav.storeType,
      imageUrl: fav.imageUrl,
      logoUrl: null,
      address: "",
      city: fav.city,
      phone: null,
      halalCertified: !!fav.certifier,
      certifier: fav.certifier,
      certifierName: null,
      averageRating: 0,
      reviewCount: 0,
      latitude: 0,
      longitude: 0,
    }));
  }, [isAuth, rawStoreFavorites, localStores]);

  // ── Filtered data ──
  const filteredProducts = useMemo(
    () =>
      productCategory === "all"
        ? products
        : products.filter((p) => p.filterCategory === productCategory),
    [productCategory, products]
  );

  const filteredStores = useMemo(
    () =>
      storeCategory === "all"
        ? stores
        : stores.filter((s) => s.storeType === storeCategory),
    [storeCategory, stores]
  );

  // ── Handlers ──
  const handleRemoveProduct = useCallback(
    (productId: string) => {
      if (isAuth) {
        removeProductMutation.mutate({ productId });
      } else {
        removeLocalProduct(productId);
      }
    },
    [isAuth, removeProductMutation, removeLocalProduct]
  );

  const handleRemoveStore = useCallback(
    (storeId: string) => {
      if (isAuth) {
        removeStoreMutation.mutate({ storeId });
      } else {
        removeLocalStore(storeId);
      }
    },
    [isAuth, removeStoreMutation, removeLocalStore]
  );

  const isLoading = isAuth && (productsLoading || storesLoading);
  const isError = isAuth && (productsError || storesError);

  const productCategories = useMemo(() => getProductCategories(t), [t]);
  const storeCategoriesList = useMemo(() => getStoreCategories(t), [t]);

  // ── Loading state ──
  if (isLoading) {
    return (
      <View style={styles.flex}>
        <PremiumBackground />
        <SafeAreaView style={styles.flex}>
          <Header colors={colors} t={t} isDark={isDark} />
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              {t.favorites.loadingFavorites}
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ── Error state ──
  if (isError) {
    return (
      <View style={styles.flex}>
        <PremiumBackground />
        <SafeAreaView style={styles.flex}>
          <Header colors={colors} t={t} isDark={isDark} />
          <View style={[styles.centered, { paddingHorizontal: 32 }]}>
            <CloudSlashIcon size={64} color={colors.textMuted} />
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 16,
                marginTop: 16,
                textAlign: "center",
              }}
            >
              {t.favorites.loadError}
            </Text>
            <PressableScale
              onPress={() => {
                refetchProducts();
                refetchStores();
              }}
              style={[styles.retryBtn, { backgroundColor: colors.primary }]}
              accessibilityRole="button"
              accessibilityLabel={t.common.retry}
            >
              <Text
                style={{
                  color: isDark ? "#102217" : "#0d1b13",
                  fontWeight: "700",
                }}
              >
                {t.common.retry}
              </Text>
            </PressableScale>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ── Subtitle ──
  const subtitle = t.favorites.combinedCount
    .replace("{{products}}", String(products.length))
    .replace("{{stores}}", String(stores.length));

  return (
    <View style={styles.flex}>
      <PremiumBackground />
      <SafeAreaView style={styles.flex}>
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(400)}
          style={styles.headerContainer}
        >
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <BackButton />
              <View>
                <Text
                  style={[styles.title, { color: colors.textPrimary }]}
                  accessibilityRole="header"
                >
                  {t.favorites.title}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {subtitle}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Tab Bar */}
        <FavoritesTabBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          productCount={products.length}
          storeCount={stores.length}
        />

        {/* ── Tab: Products ── */}
        <View style={[styles.flex, { display: activeTab === 0 ? "flex" : "none" }]}>
          <Animated.View entering={FadeIn.delay(100).duration(300)}>
            <FilterChips
              categories={productCategories}
              selected={productCategory}
              onSelect={setProductCategory}
              isDark={isDark}
              colors={colors}
            />
          </Animated.View>

          {filteredProducts.length === 0 ? (
            <EmptyProducts colors={colors} isDark={isDark} t={t} />
          ) : (
            <FlashList
              data={filteredProducts}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <ProductFavoriteCard
                  product={item}
                  certifierScores={item.certifierId ? certifierScoreMap.get(item.certifierId) ?? null : null}
                  userMadhab={userMadhab}
                  index={index}
                  onRemove={handleRemoveProduct}
                />
              )}
              contentContainerStyle={{ paddingBottom: 100 }}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={
                <ProductsFooter colors={colors} isDark={isDark} t={t} />
              }
            />
          )}
        </View>

        {/* ── Tab: Stores ── */}
        <View style={[styles.flex, { display: activeTab === 1 ? "flex" : "none" }]}>
          <Animated.View entering={FadeIn.delay(100).duration(300)}>
            <FilterChips
              categories={storeCategoriesList}
              selected={storeCategory}
              onSelect={setStoreCategory}
              isDark={isDark}
              colors={colors}
            />
          </Animated.View>

          {filteredStores.length === 0 ? (
            <EmptyStores colors={colors} isDark={isDark} t={t} />
          ) : (
            <FlashList
              data={filteredStores}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => {
                const certId = STORE_CERTIFIER_TO_ID[item.certifier] ?? item.certifier;
                const scores = certifierScoreMap.get(certId);
                return (
                  <StoreFavoriteCard
                    store={item}
                    certifierTrustScore={scores?.trustScore ?? null}
                    index={index}
                    onRemove={handleRemoveStore}
                  />
                );
              }}
              contentContainerStyle={{ paddingBottom: 100 }}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={
                <StoresFooter colors={colors} isDark={isDark} t={t} />
              }
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

// ── Sub-Components ──────────────────────────────────

function Header({
  colors,
  t,
  isDark,
}: {
  colors: ReturnType<typeof useTheme>["colors"];
  t: ReturnType<typeof useTranslation>["t"];
  isDark: boolean;
}) {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerLeft}>
        <BackButton />
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {t.favorites.title}
        </Text>
      </View>
    </View>
  );
}

function EmptyProducts({
  colors,
  isDark,
  t,
}: {
  colors: ReturnType<typeof useTheme>["colors"];
  isDark: boolean;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  return (
    <View style={styles.emptyContainer}>
      <HeartIcon size={56} color={colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
        {t.favorites.empty}
      </Text>
      <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
        {t.favorites.emptyHint}
      </Text>
      <PressableScale
        onPress={() => router.navigate("/(tabs)/scanner")}
        style={[styles.emptyCta, { backgroundColor: colors.primary }]}
        accessibilityRole="button"
        accessibilityLabel={t.favorites.scanProduct}
      >
        <View style={styles.btnRow}>
          <ScanIcon size={18}
            color={isDark ? "#102217" : "#0d1b13"} />
          <Text style={{ color: isDark ? "#102217" : "#0d1b13", fontWeight: "700" }}>
            {t.favorites.scanProduct}
          </Text>
        </View>
      </PressableScale>
    </View>
  );
}

function EmptyStores({
  colors,
  isDark,
  t,
}: {
  colors: ReturnType<typeof useTheme>["colors"];
  isDark: boolean;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  return (
    <View style={styles.emptyContainer}>
      <StorefrontIcon size={56} color={colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
        {t.favorites.emptyStores}
      </Text>
      <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
        {t.favorites.emptyStoresHint}
      </Text>
      <PressableScale
        onPress={() => router.navigate("/(tabs)/map")}
        style={[styles.emptyCta, { backgroundColor: colors.primary }]}
        accessibilityRole="button"
        accessibilityLabel={t.favorites.exploreMap}
      >
        <View style={styles.btnRow}>
          <MapTrifoldIcon size={18}
            color={isDark ? "#102217" : "#0d1b13"} />
          <Text style={{ color: isDark ? "#102217" : "#0d1b13", fontWeight: "700" }}>
            {t.favorites.exploreMap}
          </Text>
        </View>
      </PressableScale>
    </View>
  );
}

function ProductsFooter({
  colors,
  isDark,
  t,
}: {
  colors: ReturnType<typeof useTheme>["colors"];
  isDark: boolean;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(400).duration(400)}
      style={[
        styles.footerCard,
        {
          borderColor: colors.borderLight,
          backgroundColor: colors.card,
        },
      ]}
    >
      <View
        style={[
          styles.footerIcon,
          {
            backgroundColor: colors.buttonSecondary,
            borderColor: colors.borderLight,
          },
        ]}
      >
        <CameraPlusIcon size={22} color={colors.textSecondary} />
      </View>
      <Text style={[styles.footerTitle, { color: colors.textPrimary }]}>
        {t.favorites.incompleteList}
      </Text>
      <Text style={[styles.footerHint, { color: colors.textSecondary }]}>
        {t.favorites.incompleteListHint}
      </Text>
      <PressableScale
        onPress={() => router.navigate("/(tabs)/scanner")}
        style={[styles.footerBtn, { backgroundColor: colors.primary }]}
        accessibilityRole="button"
        accessibilityLabel={t.favorites.scanProduct}
      >
        <View style={styles.footerBtnInner}>
          <ScanIcon size={16}
            color={isDark ? "#102217" : "#0d1b13"} />
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: isDark ? "#102217" : "#0d1b13",
            }}
          >
            {t.favorites.scanProduct}
          </Text>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

function StoresFooter({
  colors,
  isDark,
  t,
}: {
  colors: ReturnType<typeof useTheme>["colors"];
  isDark: boolean;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(400).duration(400)}
      style={[
        styles.footerCard,
        {
          borderColor: colors.borderLight,
          backgroundColor: colors.card,
          marginHorizontal: 16,
        },
      ]}
    >
      <View
        style={[
          styles.footerIcon,
          {
            backgroundColor: colors.buttonSecondary,
            borderColor: colors.borderLight,
          },
        ]}
      >
        <MapPinPlusIcon size={22} color={colors.textSecondary} />
      </View>
      <Text style={[styles.footerTitle, { color: colors.textPrimary }]}>
        {t.favorites.storeIncompleteList}
      </Text>
      <Text style={[styles.footerHint, { color: colors.textSecondary }]}>
        {t.favorites.storeIncompleteListHint}
      </Text>
      <PressableScale
        onPress={() => router.navigate("/(tabs)/map")}
        style={[styles.footerBtn, { backgroundColor: colors.primary }]}
        accessibilityRole="button"
        accessibilityLabel={t.favorites.exploreMap}
      >
        <View style={styles.footerBtnInner}>
          <MapTrifoldIcon size={16}
            color={isDark ? "#102217" : "#0d1b13"} />
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: isDark ? "#102217" : "#0d1b13",
            }}
          >
            {t.favorites.exploreMap}
          </Text>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

// ── Styles ──────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 12 },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  retryBtn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    marginTop: 16,
  },
  emptyHint: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  emptyCta: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  footerCard: {
    marginTop: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    padding: 24,
    alignItems: "center",
  },
  footerIcon: {
    marginBottom: 12,
    height: 44,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    borderWidth: 1,
  },
  footerTitle: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  footerHint: {
    marginTop: 4,
    fontSize: 12,
    textAlign: "center",
  },
  footerBtn: {
    marginTop: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  footerBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
