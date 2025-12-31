/**
 * Favorites Screen - Mes Favoris
 * Design basé sur le template HTML fourni (Light Mode par défaut)
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { useFavoritesStore, type FavoriteProduct } from "@/store";
import { useTheme } from "@/hooks/useTheme";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

// Categories pour le filtre
const CATEGORIES = [
  { id: "all", label: "Tout" },
  { id: "food", label: "Alimentaire" },
  { id: "cosmetic", label: "Cosmétique" },
  { id: "halal", label: "Halal Certifié" },
];

type StatusType = "excellent" | "bon" | "moyen" | "mauvais";

interface StatusConfig {
  label: string;
  bgColor: string;
  textColor: string;
}

const getStatusConfig = (status: StatusType, isDark: boolean): StatusConfig => {
  switch (status) {
    case "excellent":
      return {
        label: "Excellent",
        bgColor: isDark ? "rgba(34,197,94,0.2)" : "rgba(34,197,94,0.15)",
        textColor: isDark ? "#4ade80" : "#15803d",
      };
    case "bon":
      return {
        label: "Bon",
        bgColor: isDark ? "rgba(19,236,106,0.2)" : "rgba(19,236,106,0.15)",
        textColor: isDark ? "#13ec6a" : "#0ea64b",
      };
    case "moyen":
      return {
        label: "Moyen",
        bgColor: isDark ? "rgba(249,115,22,0.2)" : "rgba(249,115,22,0.15)",
        textColor: isDark ? "#fb923c" : "#c2410c",
      };
    case "mauvais":
      return {
        label: "Mauvais",
        bgColor: isDark ? "rgba(239,68,68,0.2)" : "rgba(239,68,68,0.15)",
        textColor: isDark ? "#f87171" : "#dc2626",
      };
    default:
      return {
        label: "Inconnu",
        bgColor: isDark ? "rgba(156,163,175,0.2)" : "rgba(156,163,175,0.15)",
        textColor: isDark ? "#9ca3af" : "#6b7280",
      };
  }
};

interface ProductCardProps {
  product: FavoriteProduct;
  index: number;
  onRemove: () => void;
  onView: () => void;
  onScan: () => void;
  isDark: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
}

function ProductCard({ product, index, onRemove, onView, onScan, isDark, colors }: ProductCardProps) {
  const statusConfig = getStatusConfig(product.status, isDark);

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
          height: 32,
          width: 32,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 16,
          backgroundColor: isDark ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.9)",
        }}
      >
        <MaterialIcons name="favorite" size={18} color="#13ec6a" />
      </TouchableOpacity>

      {/* Product Image */}
      <View style={{ aspectRatio: 4/3, width: "100%", backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6" }}>
        {product.image ? (
          <Image
            source={{ uri: product.image }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
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
          >
            <MaterialIcons name="qr-code-scanner" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

export default function FavoritesScreen() {
  const { isDark, colors } = useTheme();
  const { favorites, removeFavorite } = useFavoritesStore();
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredFavorites =
    selectedCategory === "all"
      ? favorites
      : favorites.filter((p) => p.category === selectedCategory);

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
            >
              <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <View>
              <Text style={{ fontSize: 24, fontWeight: "700", letterSpacing: -0.5, color: colors.textPrimary }}>
                Mes Favoris
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                {favorites.length} produit{favorites.length > 1 ? "s" : ""} enregistré{favorites.length > 1 ? "s" : ""}
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
          {CATEGORIES.map((cat) => {
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
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 20 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {filteredFavorites.length === 0 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 80 }}>
            <MaterialIcons name="favorite-border" size={64} color={colors.textMuted} />
            <Text style={{ color: colors.textSecondary, fontSize: 18, marginTop: 16 }}>
              Aucun favori
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 8, textAlign: "center", paddingHorizontal: 32 }}>
              Ajoutez des produits à vos favoris pour les retrouver facilement.
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
            >
              <MaterialIcons name="qr-code-scanner" size={18} color={isDark ? "#102217" : "#0d1b13"} />
              <Text style={{ color: isDark ? "#102217" : "#0d1b13", fontWeight: "700" }}>
                Scanner un produit
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Grid 2 columns */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
              {filteredFavorites.map((product, index) => (
                <View key={product.id} style={{ marginBottom: 16 }}>
                  <ProductCard
                    product={product}
                    index={index}
                    onRemove={() => removeFavorite(product.id)}
                    onView={() => router.push(`/scan-result?barcode=${product.id}`)}
                    onScan={() => router.push("/(tabs)/scanner")}
                    isDark={isDark}
                    colors={colors}
                  />
                </View>
              ))}
            </View>

            {/* CTA Section */}
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
                Liste incomplète ?
              </Text>
              <Text style={{ marginTop: 4, fontSize: 12, color: colors.textSecondary, textAlign: "center" }}>
                Scannez de nouveaux produits pour les ajouter à vos favoris.
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
              >
                <MaterialIcons name="qr-code-scanner" size={18} color={isDark ? "#102217" : "#0d1b13"} />
                <Text style={{ fontSize: 12, fontWeight: "700", color: isDark ? "#102217" : "#0d1b13" }}>
                  Scanner un produit
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

