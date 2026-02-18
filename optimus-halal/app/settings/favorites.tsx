/**
 * Favorites Screen - Mes Favoris
 * Wired to tRPC favorites.list backend (Sprint 9)
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { useFavoritesList, useRemoveFavorite } from "@/hooks/useFavorites";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

// Categories pour le filtre - dynamic with i18n
function getCategories(t: ReturnType<typeof useTranslation>["t"]) {
  return [
    { id: "all", label: t.favorites.categories.all },
    { id: "food", label: t.favorites.categories.food },
    { id: "cosmetic", label: t.favorites.categories.cosmetic },
    { id: "halal", label: t.favorites.categories.halal },
  ];
}

type StatusType = "excellent" | "bon" | "moyen" | "mauvais";

interface StatusConfig {
  label: string;
  bgColor: string;
  textColor: string;
}

const getStatusConfig = (status: StatusType, isDark: boolean, t: ReturnType<typeof useTranslation>["t"]): StatusConfig => {
  switch (status) {
    case "excellent":
      return {
        label: t.favorites.status.excellent,
        bgColor: isDark ? "rgba(34,197,94,0.2)" : "rgba(34,197,94,0.15)",
        textColor: isDark ? "#4ade80" : "#15803d",
      };
    case "bon":
      return {
        label: t.favorites.status.good,
        bgColor: isDark ? "rgba(19,236,106,0.2)" : "rgba(19,236,106,0.15)",
        textColor: isDark ? "#13ec6a" : "#0ea64b",
      };
    case "moyen":
      return {
        label: t.favorites.status.average,
        bgColor: isDark ? "rgba(249,115,22,0.2)" : "rgba(249,115,22,0.15)",
        textColor: isDark ? "#fb923c" : "#c2410c",
      };
    case "mauvais":
      return {
        label: t.favorites.status.bad,
        bgColor: isDark ? "rgba(239,68,68,0.2)" : "rgba(239,68,68,0.15)",
        textColor: isDark ? "#f87171" : "#dc2626",
      };
    default:
      return {
        label: t.favorites.status.unknown,
        bgColor: isDark ? "rgba(156,163,175,0.2)" : "rgba(156,163,175,0.15)",
        textColor: isDark ? "#9ca3af" : "#6b7280",
      };
  }
};

// ── Data Mapping ──────────────────────────────────────

/** Map backend halalStatus to UI display status */
function mapHalalToStatus(halalStatus: string | null | undefined): StatusType {
  switch (halalStatus) {
    case "halal":
      return "excellent";
    case "doubtful":
      return "moyen";
    case "haram":
      return "mauvais";
    default:
      return "bon"; // unknown = needs analysis, neutral display
  }
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
  if (
    lower.includes("halal certifié") ||
    lower.includes("halal certified")
  )
    return "halal";
  return "food";
}

// ── Types ─────────────────────────────────────────────

interface MappedFavorite {
  id: string;
  productId: string;
  barcode: string;
  name: string;
  brand: string;
  image: string;
  status: StatusType;
  category: string;
  addedAt: string;
}

// ── Product Card ──────────────────────────────────────

interface ProductCardProps {
  product: MappedFavorite;
  index: number;
  onRemove: () => void;
  onView: () => void;
  onScan: () => void;
  isDark: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
  t: ReturnType<typeof useTranslation>["t"];
}

const favoriteKeyExtractor = (item: MappedFavorite) => item.id;

const ProductCard = React.memo(function ProductCard({ product, index, onRemove, onView, onScan, isDark, colors, t }: ProductCardProps) {
  const statusConfig = getStatusConfig(product.status, isDark, t);

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).duration(400)}
      style={{
        width: CARD_WIDTH,
        backgroundColor: colors.card,
        borderColor: colors.borderLight,
        borderWidth: 1,
        borderRadius: 16,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0 : 0.05,
        shadowRadius: 8,
        elevation: isDark ? 0 : 2,
      }}
    >
      {/* Favorite Button */}
      <TouchableOpacity
        onPress={onRemove}
        style={{
          position: "absolute",
          right: 8,
          top: 8,
          zIndex: 10,
          height: 44,
          width: 44,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 22,
          backgroundColor: isDark ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.9)",
        }}
        accessibilityRole="button"
        accessibilityLabel={`${t.favorites.removeConfirm} ${product.name}`}
      >
        <MaterialIcons name="favorite" size={18} color="#13ec6a" />
      </TouchableOpacity>

      {/* Product Image */}
      <View
        style={{ aspectRatio: 4/3, width: "100%", backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6" }}
        accessible={false}
        accessibilityElementsHidden={true}
      >
        {product.image ? (
          <Image
            source={{ uri: product.image }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            transition={200}
            accessible={false}
          />
        ) : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <MaterialIcons name="inventory-2" size={40} color={colors.textMuted} />
          </View>
        )}
      </View>

      {/* Product Info */}
      <View style={{ padding: 12 }}>
        {/* Status Badge */}
        <View style={{ marginBottom: 6, flexDirection: "row", alignItems: "center" }}>
          <View style={{
            backgroundColor: statusConfig.bgColor,
            borderRadius: 4,
            paddingHorizontal: 6,
            paddingVertical: 2
          }}>
            <Text style={{
              fontSize: 10,
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              color: statusConfig.textColor
            }}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Name & Brand */}
        <Text
          style={{ fontSize: 14, fontWeight: "700", color: colors.textPrimary, marginBottom: 2 }}
          numberOfLines={1}
        >
          {product.name}
        </Text>
        <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 12 }}>
          {product.brand}
        </Text>

        {/* Action Buttons */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            onPress={onView}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
              backgroundColor: colors.buttonSecondary,
              paddingVertical: 8
            }}
            accessibilityRole="button"
            accessibilityLabel={`Voir ${product.name}`}
            accessibilityHint="Afficher les détails du produit"
          >
            <MaterialIcons name="visibility" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onScan}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
              backgroundColor: colors.primaryLight,
              paddingVertical: 8
            }}
            accessibilityRole="button"
            accessibilityLabel={`Re-scanner ${product.name}`}
            accessibilityHint="Ouvrir le scanner"
          >
            <MaterialIcons name="qr-code-scanner" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
});

// ── Main Screen ───────────────────────────────────────

export default function FavoritesScreen() {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState("all");

  // tRPC: fetch favorites from backend
  const { data: rawFavorites, isLoading, isError, refetch } = useFavoritesList();
  const removeMutation = useRemoveFavorite();

  // Map backend data → UI-ready shape
  const favorites: MappedFavorite[] = useMemo(() => {
    if (!rawFavorites) return [];
    return rawFavorites
      .filter((fav) => fav.product !== null)
      .map((fav) => ({
        id: fav.id,
        productId: fav.productId,
        barcode: fav.product!.barcode,
        name: fav.product!.name,
        brand: fav.product!.brand ?? t.favorites.unknownBrand,
        image: fav.product!.imageUrl ?? "",
        status: mapHalalToStatus(fav.product!.halalStatus),
        category: mapToFilterCategory(fav.product!.category),
        addedAt: String(fav.createdAt),
      }));
  }, [rawFavorites, t]);

  const filteredFavorites = useMemo(() =>
    selectedCategory === "all"
      ? favorites
      : favorites.filter((p) => p.category === selectedCategory),
    [selectedCategory, favorites]
  );

  const handleRemove = useCallback(
    (productId: string) => {
      removeMutation.mutate({ productId });
    },
    [removeMutation]
  );

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 16, flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              marginRight: 12,
              height: 40,
              width: 40,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 20,
              backgroundColor: colors.card,
              borderColor: colors.borderLight,
              borderWidth: 1,
            }}
            accessibilityRole="button"
            accessibilityLabel={t.common.back}
          >
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={{ fontSize: 24, fontWeight: "700", color: colors.textPrimary }}>
            {t.favorites.title}
          </Text>
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.textSecondary, marginTop: 12 }}>
            {t.favorites.loadingFavorites}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (isError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 16, flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              marginRight: 12,
              height: 40,
              width: 40,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 20,
              backgroundColor: colors.card,
              borderColor: colors.borderLight,
              borderWidth: 1,
            }}
            accessibilityRole="button"
            accessibilityLabel={t.common.back}
          >
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={{ fontSize: 24, fontWeight: "700", color: colors.textPrimary }}>
            {t.favorites.title}
          </Text>
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <MaterialIcons name="cloud-off" size={64} color={colors.textMuted} />
          <Text style={{ color: colors.textSecondary, fontSize: 16, marginTop: 16, textAlign: "center" }}>
            {t.favorites.loadError}
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            style={{
              marginTop: 20,
              backgroundColor: colors.primary,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 12,
            }}
            accessibilityRole="button"
            accessibilityLabel={t.common.retry}
          >
            <Text style={{ color: isDark ? "#102217" : "#0d1b13", fontWeight: "700" }}>
              {t.common.retry}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                marginRight: 12,
                height: 40,
                width: 40,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 20,
                backgroundColor: colors.card,
                borderColor: colors.borderLight,
                borderWidth: 1,
              }}
              accessibilityRole="button"
              accessibilityLabel={t.common.back}
              accessibilityHint={t.common.back}
            >
              <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <View>
              <Text
                style={{ fontSize: 24, fontWeight: "700", letterSpacing: -0.5, color: colors.textPrimary }}
                accessibilityRole="header"
              >
                {t.favorites.title}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                {(favorites.length > 1 ? t.favorites.productCountPlural : t.favorites.productCount).replace("{{count}}", String(favorites.length))}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              style={{
                height: 40,
                width: 40,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 20,
                backgroundColor: colors.card,
                borderColor: colors.borderLight,
                borderWidth: 1,
              }}
              accessibilityRole="button"
              accessibilityLabel={t.common.search}
              accessibilityHint={t.common.search}
            >
              <MaterialIcons name="search" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                height: 40,
                width: 40,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 20,
                backgroundColor: colors.card,
                borderColor: colors.borderLight,
                borderWidth: 1,
              }}
              accessibilityRole="button"
              accessibilityLabel="Filtrer"
              accessibilityHint="Filtrer les favoris"
            >
              <MaterialIcons name="filter-list" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Category Filter */}
      <Animated.View entering={FadeIn.delay(100).duration(400)}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
          style={{ paddingBottom: 16, paddingTop: 4 }}
        >
          {getCategories(t).map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 6,
                  borderRadius: 20,
                  backgroundColor: isSelected ? colors.primary : colors.card,
                  borderColor: isSelected ? colors.primary : colors.borderLight,
                  borderWidth: 1,
                  shadowColor: isSelected ? colors.primary : "transparent",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: isSelected ? 0.3 : 0,
                  shadowRadius: 8,
                }}
                accessibilityRole="button"
                accessibilityLabel={`Filtre ${cat.label}`}
                accessibilityState={{ selected: isSelected }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: isSelected ? "700" : "500",
                    color: isSelected ? (isDark ? "#102217" : "#0d1b13") : colors.textSecondary,
                  }}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* Products Grid */}
      {filteredFavorites.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 80 }}>
          <MaterialIcons name="favorite-border" size={64} color={colors.textMuted} />
          <Text style={{ color: colors.textSecondary, fontSize: 18, marginTop: 16 }}>
            {t.favorites.empty}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 8, textAlign: "center", paddingHorizontal: 32 }}>
            {t.favorites.emptyHint}
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/scanner")}
            style={{
              marginTop: 24,
              backgroundColor: colors.primary,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
            accessibilityRole="button"
            accessibilityLabel={t.favorites.scanProduct}
            accessibilityHint={t.favorites.scanProduct}
          >
            <MaterialIcons name="qr-code-scanner" size={18} color={isDark ? "#102217" : "#0d1b13"} />
            <Text style={{ color: isDark ? "#102217" : "#0d1b13", fontWeight: "700" }}>
              {t.favorites.scanProduct}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlashList
          data={filteredFavorites}
          keyExtractor={favoriteKeyExtractor}
          numColumns={2}
          renderItem={({ item, index }) => (
            <View style={{ flex: 1, paddingHorizontal: 4, marginBottom: 16 }}>
              <ProductCard
                product={item}
                index={index}
                onRemove={() => handleRemove(item.productId)}
                onView={() => router.push(`/scan-result?barcode=${item.barcode}`)}
                onScan={() => router.push("/(tabs)/scanner")}
                isDark={isDark}
                colors={colors}
                t={t}
              />
            </View>
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <Animated.View
              entering={FadeInDown.delay(500).duration(400)}
              style={{
                marginTop: 24,
                borderRadius: 16,
                borderWidth: 1,
                borderStyle: "dashed",
                borderColor: colors.borderLight,
                backgroundColor: colors.card,
                padding: 24,
                alignItems: "center",
              }}
            >
              <View style={{
                marginBottom: 12,
                height: 48,
                width: 48,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 24,
                backgroundColor: colors.buttonSecondary,
                borderColor: colors.borderLight,
                borderWidth: 1,
              }}>
                <MaterialIcons name="add-a-photo" size={24} color={colors.textSecondary} />
              </View>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textPrimary, textAlign: "center" }}>
                {t.favorites.incompleteList}
              </Text>
              <Text style={{ marginTop: 4, fontSize: 12, color: colors.textSecondary, textAlign: "center" }}>
                {t.favorites.incompleteListHint}
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/scanner")}
                style={{
                  marginTop: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  borderRadius: 12,
                  backgroundColor: colors.primary,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                }}
                accessibilityRole="button"
                accessibilityLabel={t.favorites.scanProduct}
                accessibilityHint={t.favorites.scanProduct}
              >
                <MaterialIcons name="qr-code-scanner" size={18} color={isDark ? "#102217" : "#0d1b13"} />
                <Text style={{ fontSize: 12, fontWeight: "700", color: isDark ? "#102217" : "#0d1b13" }}>
                  {t.favorites.scanProduct}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          }
        />
      )}
    </SafeAreaView>
  );
}
