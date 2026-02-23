/**
 * Marketplace Tab Screen — Premium Naqiy Edition
 *
 * Point d'entrée marketplace dans les tabs.
 * Coming-soon state: gold glass hero + waitlist CTA + Naqiy branding.
 * Active state: product catalog with premium gold styling.
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
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

import { PremiumBackground } from "@/components/ui";
import { PressableScale } from "@/components/ui/PressableScale";
import { useFeatureFlagsStore, useLocalCartStore } from "@/store";
import { trpc } from "@/lib/trpc";
import { brand, glass, halalStatus } from "@/theme/colors";

const GOLD = "#d4af37";
const logoSource = require("@assets/images/logo_naqiy.webp");

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

/* ─── Product Card ─── */

const ProductCard = React.memo(function ProductCard({
  product,
  index,
}: {
  product: Product;
  index: number;
}) {
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
      style={{ width: 176, marginRight: 16 }}
    >
      <PressableScale
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`${product.name}, ${product.brand ?? ""}, ${product.halalStatus}`}
      >
        <View
          style={[
            styles.productCard,
            {
              backgroundColor: isDark ? glass.dark.bg : glass.light.bg,
              borderColor: isDark
                ? "rgba(207,165,51,0.15)"
                : "rgba(212,175,55,0.12)",
              shadowOpacity: isDark ? 0.2 : 0.08,
            },
          ]}
        >
          <View style={{ borderRadius: 16, overflow: "hidden" }}>
            {/* Image */}
            <View style={{ position: "relative" }}>
              {product.image ? (
                <Image
                  source={{ uri: product.image }}
                  style={{ width: "100%", height: 128 }}
                  contentFit="cover"
                  transition={200}
                  accessibilityLabel={`Photo de ${product.name}`}
                />
              ) : (
                <View
                  style={{
                    width: "100%",
                    height: 128,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.04)"
                      : "rgba(0,0,0,0.03)",
                  }}
                >
                  <MaterialIcons
                    name="inventory-2"
                    size={32}
                    color={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)"}
                  />
                </View>
              )}
              {/* Halal status badge */}
              <View
                style={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 999,
                  backgroundColor: statusColor,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "700",
                    color: "#fff",
                    textTransform: "uppercase",
                  }}
                >
                  {product.halalStatus}
                </Text>
              </View>
            </View>

            {/* Details */}
            <View style={{ padding: 12 }}>
              {product.brand && (
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textSecondary,
                    marginBottom: 4,
                  }}
                >
                  {product.brand}
                </Text>
              )}
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: colors.textPrimary,
                  marginBottom: 8,
                }}
                numberOfLines={2}
              >
                {product.name}
              </Text>

              {product.certifierName && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <MaterialIcons name="verified" size={14} color={GOLD} />
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.textSecondary,
                      marginLeft: 4,
                    }}
                    numberOfLines={1}
                  >
                    {product.certifierName}
                  </Text>
                </View>
              )}

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                {product.price != null ? (
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "700",
                      color: isDark ? GOLD : brand.primary,
                    }}
                  >
                    {product.price.toFixed(2)}€
                  </Text>
                ) : (
                  <Text style={{ fontSize: 12, color: colors.textMuted }}>
                    Prix N/A
                  </Text>
                )}
                <PressableScale
                  onPress={handleAddToCart}
                  accessibilityRole="button"
                  accessibilityLabel={`${t.marketplace.addToCart} ${product.name}`}
                >
                  <View
                    style={{
                      backgroundColor: isDark
                        ? "rgba(212,175,55,0.12)"
                        : "rgba(212,175,55,0.08)",
                      padding: 8,
                      borderRadius: 999,
                    }}
                  >
                    <MaterialIcons
                      name="add-shopping-cart"
                      size={16}
                      color={isDark ? GOLD : brand.primary}
                    />
                  </View>
                </PressableScale>
              </View>
            </View>
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
});

/* ─── Marketplace Tab ─── */

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

  const handleCategoryPress = useCallback(
    (categoryId: string) => {
      impact();
      setSelectedCategory(categoryId);
    },
    [impact],
  );

  const handleViewAllPress = useCallback(() => {
    impact();
    router.push("/(marketplace)/catalog" as any);
  }, [impact]);

  const handleCartPress = useCallback(() => {
    impact();
    router.push("/(marketplace)/cart" as any);
  }, [impact]);

  const handleAlertsPress = useCallback(() => {
    impact();
    router.navigate("/(tabs)/alerts" as any);
  }, [impact]);

  /* ─── Coming Soon ─── */

  if (!flags.marketplaceEnabled) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <PremiumBackground />

        {/* Header */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <View style={styles.headerBrand}>
            <Image
              source={logoSource}
              style={{ width: 26, height: 26 }}
              contentFit="contain"
              cachePolicy="memory-disk"
            />
            <Text
              style={[styles.headerTitle, { color: colors.textPrimary }]}
            >
              Naqiy{" "}
              <Text style={{ fontWeight: "400", color: colors.textSecondary }}>
                Marketplace
              </Text>
            </Text>
          </View>

          <PressableScale
            onPress={handleAlertsPress}
            accessibilityRole="button"
            accessibilityLabel={t.common.notifications}
          >
            <View
              style={[
                styles.iconButton,
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
                size={20}
                color={isDark ? GOLD : colors.textPrimary}
              />
              {unreadCount > 0 && (
                <View
                  style={[
                    styles.unreadDot,
                    { borderColor: isDark ? "#0C0C0C" : "#f3f1ed" },
                  ]}
                />
              )}
            </View>
          </PressableScale>
        </Animated.View>

        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingBottom: insets.bottom + 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Card */}
          <Animated.View
            entering={FadeInDown.delay(150).duration(600)}
            style={{ marginTop: 16 }}
          >
            <View
              style={[
                styles.heroCard,
                {
                  backgroundColor: isDark ? glass.dark.bg : glass.light.bg,
                  borderColor: isDark
                    ? "rgba(207,165,51,0.18)"
                    : "rgba(212,175,55,0.12)",
                },
              ]}
            >
              {/* Directional halo */}
              <LinearGradient
                colors={
                  isDark
                    ? ["rgba(207,165,51,0.15)", "transparent"]
                    : ["rgba(19,236,106,0.08)", "transparent"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
                pointerEvents="none"
              />

              {/* Store icon */}
              <View
                style={[
                  styles.heroIconWrap,
                  {
                    backgroundColor: isDark
                      ? "rgba(212,175,55,0.12)"
                      : "rgba(212,175,55,0.08)",
                  },
                ]}
              >
                <MaterialIcons name="storefront" size={40} color={GOLD} />
              </View>

              <Text
                style={[styles.heroTitle, { color: colors.textPrimary }]}
              >
                {t.marketplace.comingSoon}
              </Text>
              <Text
                style={[styles.heroSubtitle, { color: colors.textSecondary }]}
              >
                {t.marketplace.comingSoonDesc}
              </Text>

              {/* Feature chips */}
              <View style={styles.featuresRow}>
                {[
                  { icon: "verified" as const, label: "Certifié Halal" },
                  { icon: "local-shipping" as const, label: "Livraison" },
                  { icon: "shield" as const, label: "Traçabilité" },
                ].map((item, i) => (
                  <View key={i} style={styles.featureChip}>
                    <MaterialIcons
                      name={item.icon}
                      size={14}
                      color={isDark ? GOLD : brand.primary}
                    />
                    <Text
                      style={[
                        styles.featureChipText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>

          {/* CTA */}
          <Animated.View
            entering={FadeInDown.delay(350).duration(600)}
            style={{ marginTop: 24 }}
          >
            <PressableScale
              onPress={() =>
                router.push("/(marketplace)/coming-soon" as any)
              }
              accessibilityRole="button"
              accessibilityLabel={t.marketplace.joinWaitlist}
            >
              <View style={styles.ctaButton}>
                <LinearGradient
                  colors={
                    isDark
                      ? ["#FDE08B", "#CFA533"]
                      : [brand.primary, "#0ea64b"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
                />
                <MaterialIcons
                  name="notifications-active"
                  size={18}
                  color={isDark ? "#1A1A1A" : "#ffffff"}
                />
                <Text
                  style={[
                    styles.ctaText,
                    { color: isDark ? "#1A1A1A" : "#ffffff" },
                  ]}
                >
                  {t.marketplace.joinWaitlist}
                </Text>
              </View>
            </PressableScale>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  /* ─── Active Marketplace ─── */

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <PremiumBackground />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={brand.primary}
          />
        }
      >
        {/* Header */}
        <Animated.View
          entering={FadeIn.delay(100).duration(400)}
          style={styles.header}
        >
          <View style={styles.headerBrand}>
            <Image
              source={logoSource}
              style={{ width: 26, height: 26 }}
              contentFit="contain"
              cachePolicy="memory-disk"
            />
            <Text
              style={[styles.headerTitle, { color: colors.textPrimary }]}
            >
              Naqiy{" "}
              <Text style={{ fontWeight: "400", color: colors.textSecondary }}>
                Marketplace
              </Text>
            </Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {/* Alerts */}
            <PressableScale
              onPress={handleAlertsPress}
              accessibilityRole="button"
              accessibilityLabel={t.common.notifications}
            >
              <View
                style={[
                  styles.iconButton,
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
                  size={20}
                  color={isDark ? GOLD : colors.textPrimary}
                />
                {unreadCount > 0 && (
                  <View
                    style={[
                      styles.unreadDot,
                      { borderColor: isDark ? "#0C0C0C" : "#f3f1ed" },
                    ]}
                  />
                )}
              </View>
            </PressableScale>

            {/* Cart */}
            <PressableScale
              onPress={handleCartPress}
              accessibilityRole="button"
              accessibilityLabel={t.marketplace.viewCart}
            >
              <View
                style={[
                  styles.iconButton,
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
                  name="shopping-cart-checkout"
                  size={20}
                  color={isDark ? GOLD : colors.textPrimary}
                />
                {itemCount > 0 && (
                  <View
                    style={[
                      styles.cartBadge,
                      {
                        backgroundColor: isDark ? GOLD : brand.primary,
                      },
                    ]}
                  >
                    <Text style={styles.cartBadgeText}>
                      {itemCount > 99 ? "99+" : itemCount}
                    </Text>
                  </View>
                )}
              </View>
            </PressableScale>
          </View>
        </Animated.View>

        {/* Categories */}
        <Animated.View
          entering={FadeInDown.delay(150).duration(400)}
          style={{ marginBottom: 24 }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          >
            {CATEGORIES.map((category) => {
              const categoryLabel = t.marketplace.categories[category.id];
              const isSelected = selectedCategory === category.id;
              return (
                <PressableScale
                  key={category.id}
                  onPress={() => handleCategoryPress(category.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`${categoryLabel}${isSelected ? `, ${t.common.selected}` : ""}`}
                >
                  <View
                    style={[
                      styles.categoryChip,
                      isSelected
                        ? {
                            backgroundColor: isDark ? GOLD : brand.primary,
                            borderColor: "transparent",
                          }
                        : {
                            backgroundColor: isDark
                              ? glass.dark.bg
                              : glass.light.bg,
                            borderColor: isDark
                              ? "rgba(207,165,51,0.12)"
                              : "rgba(212,175,55,0.1)",
                          },
                    ]}
                  >
                    <MaterialIcons
                      name={category.icon}
                      size={18}
                      color={
                        isSelected
                          ? isDark
                            ? "#1A1A1A"
                            : "#fff"
                          : isDark
                            ? "rgba(255,255,255,0.5)"
                            : "rgba(0,0,0,0.4)"
                      }
                    />
                    <Text
                      style={{
                        marginLeft: 8,
                        fontSize: 14,
                        fontWeight: "600",
                        color: isSelected
                          ? isDark
                            ? "#1A1A1A"
                            : "#fff"
                          : colors.textSecondary,
                      }}
                    >
                      {categoryLabel}
                    </Text>
                  </View>
                </PressableScale>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Featured Products */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={{ marginBottom: 24 }}
        >
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={styles.sectionWave}>
                <MaterialIcons name="auto-awesome" size={14} color={GOLD} />
              </View>
              <Text
                accessibilityRole="header"
                style={[styles.sectionTitle, { color: colors.textPrimary }]}
              >
                {t.marketplace.featured}
              </Text>
            </View>
            <PressableScale
              onPress={handleViewAllPress}
              accessibilityRole="link"
              accessibilityLabel={`${t.home.viewAll} ${t.marketplace.featured}`}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: GOLD }}>
                {t.home.viewAll}
              </Text>
            </PressableScale>
          </View>

          {productsQuery.isLoading ? (
            <View
              style={{ alignItems: "center", justifyContent: "center", paddingVertical: 32 }}
            >
              <RefreshControl refreshing={true} tintColor={brand.primary} />
            </View>
          ) : products.length === 0 ? (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 32,
                paddingHorizontal: 20,
              }}
            >
              <MaterialIcons
                name="inventory-2"
                size={40}
                color={isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"}
              />
              <Text
                style={{
                  fontSize: 14,
                  color: colors.textSecondary,
                  marginTop: 12,
                  textAlign: "center",
                }}
              >
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

        {/* Promo Banner */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(400)}
          style={{ paddingHorizontal: 20 }}
        >
          <View
            style={[
              styles.promoBanner,
              {
                backgroundColor: isDark ? glass.dark.bg : glass.light.bg,
                borderColor: isDark
                  ? "rgba(207,165,51,0.18)"
                  : "rgba(212,175,55,0.12)",
              },
            ]}
          >
            {/* Gold halo */}
            <LinearGradient
              colors={
                isDark
                  ? ["rgba(207,165,51,0.1)", "transparent"]
                  : ["rgba(212,175,55,0.06)", "transparent"]
              }
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
              pointerEvents="none"
            />

            <View style={{ flex: 1, marginRight: 16 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: colors.textPrimary,
                  marginBottom: 4,
                  letterSpacing: -0.2,
                }}
              >
                {t.marketplace.freeShipping}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: colors.textSecondary,
                  marginBottom: 12,
                  lineHeight: 18,
                }}
              >
                {t.marketplace.freeShippingDesc}
              </Text>
              <PressableScale
                onPress={handleViewAllPress}
                accessibilityRole="link"
                accessibilityLabel={t.marketplace.discoverOffers}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text
                    style={{ fontSize: 14, fontWeight: "700", color: GOLD }}
                  >
                    {t.marketplace.discoverOffers}
                  </Text>
                  <MaterialIcons
                    name="arrow-forward"
                    size={16}
                    color={GOLD}
                    style={{ marginLeft: 4 }}
                  />
                </View>
              </PressableScale>
            </View>

            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isDark
                  ? "rgba(212,175,55,0.12)"
                  : "rgba(212,175,55,0.08)",
              }}
            >
              <MaterialIcons name="local-shipping" size={32} color={GOLD} />
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

/* ─── Styles ─── */

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  unreadDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GOLD,
    borderWidth: 2,
  },
  cartBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
  },

  // Hero (coming soon)
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
    overflow: "hidden",
  },
  heroIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 300,
    marginBottom: 20,
  },
  featuresRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  featureChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(212,175,55,0.06)",
  },
  featureChipText: {
    fontSize: 11,
    fontWeight: "600",
  },
  ctaButton: {
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    overflow: "hidden",
  },
  ctaText: {
    fontSize: 15,
    fontWeight: "700",
  },

  // Marketplace active
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    marginRight: 10,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionWave: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(212,175,55,0.08)",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  productCard: {
    borderWidth: 1,
    borderRadius: 16,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  promoBanner: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
});
