/**
 * Marketplace Product Detail Screen
 * 
 * Page de détail produit avec:
 * - Image carousel avec pagination dots
 * - Infos produit (nom, marque, prix)
 * - Ethical Score card
 * - Badges certifications
 * - Description et accordéons
 * - Sélecteur de quantité
 * - Produits similaires
 * - Bouton ajouter au panier
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Dimensions,
} from "react-native";
import { PressableScale } from "@/components/ui/PressableScale";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useHaptics, useTheme } from "@/hooks";
import { brand } from "@/theme/colors";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

import { useLocalCartStore } from "@/store";

// Mock product data
const PRODUCT_DATA = {
  id: "1",
  name: "Miel Bio Free-Range",
  brand: "Nature's Gold",
  price: 12.99,
  weight: "500g",
  images: [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAFtTnyzAGtNaS8T5GarLWHx0QA4SBfpxz9ZA09l67lDiDBMYU5HR58-_qZgsrRIaKKmPKQX_vu2z93pd1nn0f8a3RTpv0t3A2UVBabXYV9QZOZkeV7XCrZKwZVL2kBxyuVzXuc-YL-SiEYDSjGEiLybg3dhryTNTvQ46cWcrAvJL8lh2f6zpjkOF5C6XGrY0Vc4s3CCZ9HvnXMc8Cty0dEDQGRpKgbKCh34GEuTK2y7I66TRMbE4l7HcwixTDfFCn9NU-Z07Pe0M8J",
  ],
  ethicalScore: 98,
  ethicalGrade: "A+",
  description:
    "Notre Miel Bio Nature's Gold est cru, non filtré et récolté avec le plus grand soin pour les abeilles et l'environnement. Il présente un arôme floral riche et une texture lisse qui cristallise naturellement avec le temps. Parfait pour sucrer le thé, napper le yaourt ou déguster à la cuillère.",
  certifications: [
    { id: "halal", label: "Certifié Halal", icon: "workspace-premium", color: "green" },
    { id: "bio", label: "Biologique", icon: "eco", color: "orange" },
    { id: "fairtrade", label: "Commerce Équitable", icon: "handshake", color: "blue" },
  ],
  inStock: true,
  shipsIn: "demain",
};

const RELATED_PRODUCTS = [
  {
    id: "r1",
    name: "Flocons d'Avoine Bio",
    brand: "Grain Masters",
    price: 4.99,
    grade: "A+",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA3NEB9XwxYqOF9dmPA43aItsxAjGv5NuFLXDnchqleK9zmSKL3atP34x8GVzIrePFXTHdqu47xFygf82pDDgVEEja5i13Rl34xLqeQMJpBiLj4eGQqOkCmfMpq1j_mXJJP8FULjq1VRztL_ZYqI6tdQkIsevnxfFdsN9iQjf1LwTydb7dTNr0Ln6ssjHg6UY3uqBGWDyQoBrodOPn64uhbOyGkugEj1LEPjDI8_lCysSw7dDgXfeYllUfUFlI1IYijuIufnOqJoxB7",
  },
  {
    id: "r2",
    name: "Huile d'Olive Extra Vierge",
    brand: "Pure Press",
    price: 18.50,
    grade: "A",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuANqkIXSLfL5zsGM8nxUo8ADFCKXU4qNAkLEI9WkRHAFZKoFtvtBwaFNo4by1yQ3YD2Ey5ovfeyz92AmzoEc4Euky7Ak6DRwtT3SjcPcz7LhpxqYhBBblTMBx668TfnclgvFvD3S2TaDC2YL0tk16CZXJ1wiM2KpksSFckKBo_7Z5lIIsxTC_UiQWhG142gBeQi8ZlJB7NbYWPip1hRDNtO1AUrkYGBTNjhuEKKVaL1ezJFuIS9hncNIG5OAgNbY1a-voH1W1g8nBSN",
  },
];

// Circular Progress Component
function CircularProgress({ score, grade }: { score: number; grade: string }) {
  const radius = 24;
  const strokeWidth = 3;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${(score / 100) * circumference}, ${circumference}`;

  return (
    <View className="relative h-14 w-14 items-center justify-center">
      <Svg width={56} height={56} className="-rotate-90">
        <Path
          d={`M28 4 a 24 24 0 0 1 0 48 a 24 24 0 0 1 0 -48`}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        <Path
          d={`M28 4 a 24 24 0 0 1 0 48 a 24 24 0 0 1 0 -48`}
          fill="none"
          stroke={brand.primary}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
        />
      </Svg>
      <Text className="absolute text-xs font-bold text-slate-800 dark:text-white">
        {grade}
      </Text>
    </View>
  );
}

export default function ProductDetailScreen() {
  useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const { impact, notification } = useHaptics();

  const { addItem, itemCount } = useLocalCartStore();

  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex] = useState(0);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const product = PRODUCT_DATA; // In real app, fetch based on id

  const handleBack = useCallback(async () => {
    impact();
    router.back();
  }, []);

  const handleCartPress = useCallback(async () => {
    impact();
    router.navigate("/(marketplace)/cart" as any);
  }, []);

  const handleQuantityChange = useCallback(async (delta: number) => {
    impact();
    setQuantity((prev) => Math.max(1, prev + delta));
  }, []);

  const handleAddToCart = useCallback(async () => {
    notification();
    for (let i = 0; i < quantity; i++) {
      addItem({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.images[0],
      });
    }
    router.navigate("/(marketplace)/cart" as any);
  }, [quantity, product, addItem]);

  const toggleSection = useCallback((section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  }, []);

  const getCertificationColors = (color: string) => {
    switch (color) {
      case "green":
        return {
          bg: "bg-green-50 dark:bg-green-900/20",
          border: "border-green-100 dark:border-green-800/30",
          text: "text-green-800 dark:text-green-300",
          icon: "#15803d",
        };
      case "orange":
        return {
          bg: "bg-orange-50 dark:bg-orange-900/20",
          border: "border-orange-100 dark:border-orange-800/30",
          text: "text-orange-800 dark:text-orange-300",
          icon: "#c2410c",
        };
      case "blue":
        return {
          bg: "bg-blue-50 dark:bg-blue-900/20",
          border: "border-blue-100 dark:border-blue-800/30",
          text: "text-blue-800 dark:text-blue-300",
          icon: "#1d4ed8",
        };
      default:
        return {
          bg: "bg-slate-50 dark:bg-slate-800",
          border: "border-slate-100 dark:border-slate-700",
          text: "text-slate-800 dark:text-slate-300",
          icon: "#475569",
        };
    }
  };

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        className="absolute top-0 left-0 right-0 z-50 flex-row items-center justify-between bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md p-4"
        style={{ paddingTop: insets.top + 8 }}
      >
        <Pressable
          onPress={handleBack}
          hitSlop={8}
        >
          <View className="h-10 w-10 items-center justify-center rounded-full">
            <MaterialIcons
              name="arrow-back"
              size={24}
              color={isDark ? "#ffffff" : "#0d1b12"}
            />
          </View>
        </Pressable>

        <Text className="text-base font-semibold text-slate-800 dark:text-white opacity-0">
          Détail Produit
        </Text>

        <Pressable
          onPress={handleCartPress}
          hitSlop={8}
        >
          <View className="relative h-10 w-10 items-center justify-center rounded-full">
            <MaterialIcons
              name="shopping-cart"
              size={24}
              color={isDark ? "#ffffff" : "#0d1b12"}
            />
            {itemCount > 0 && (
              <View className="absolute top-2 right-2 h-2 w-2 bg-primary rounded-full" />
            )}
          </View>
        </Pressable>
      </Animated.View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: insets.top + 60,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Product Image */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          className="w-full px-4 pt-2 pb-6"
        >
          <View className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm">
            <Image
              source={{ uri: product.images[currentImageIndex] }}
              className="w-full h-full"
              contentFit="cover"
              transition={200}
            />
            {/* Pagination Dots */}
            <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-2">
              {product.images.map((_, index) => (
                <View
                  key={index}
                  className={`h-2 w-2 rounded-full ${
                    index === currentImageIndex
                      ? "bg-primary"
                      : "bg-white/60"
                  }`}
                />
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Product Info */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(500)}
          className="px-4 gap-1"
        >
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text className="text-sm font-medium text-primary mb-1">
                {product.brand}
              </Text>
              <Text className="text-2xl font-bold text-slate-800 dark:text-white leading-tight tracking-tight">
                {product.name}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-2xl font-bold text-slate-800 dark:text-white">
                €{product.price.toFixed(2)}
              </Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400">
                {product.weight}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Ethical Scorecard */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(500)}
          className="px-4 py-6"
        >
          <View className="flex-row items-center gap-4 p-4 rounded-xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 shadow-sm">
            <CircularProgress score={product.ethicalScore} grade={product.ethicalGrade} />
            <View className="flex-1">
              <View className="flex-row items-center gap-2 mb-1">
                <Text className="text-base font-bold text-slate-800 dark:text-white">
                  Score Éthique: {product.ethicalScore}/100
                </Text>
                <MaterialIcons name="verified" size={14} color={colors.primary} />
              </View>
              <Text className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                Excellente transparence. Provenance durable, sans cruauté avec traçabilité complète.
              </Text>
            </View>
            <Pressable hitSlop={8}>
              <MaterialIcons
                name="chevron-right"
                size={24}
                color={isDark ? "#6b7280" : "#9ca3af"}
              />
            </Pressable>
          </View>
        </Animated.View>

        {/* Certifications */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(500)}
          className="px-4 pb-6"
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12 }}
          >
            {product.certifications.map((cert) => {
              const colors = getCertificationColors(cert.color);
              return (
                <View
                  key={cert.id}
                  className={`flex-row items-center gap-2 px-3 py-1.5 rounded-lg ${colors.bg} border ${colors.border}`}
                >
                  <MaterialIcons name={cert.icon as any} size={18} color={colors.icon} />
                  <Text className={`text-xs font-semibold ${colors.text}`}>
                    {cert.label}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Description */}
        <Animated.View
          entering={FadeInDown.delay(500).duration(500)}
          className="px-4 pb-8"
        >
          <Text className="text-lg font-bold text-slate-800 dark:text-white mb-2">
            Description
          </Text>
          <Text className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {product.description}
          </Text>

          {/* Accordion Items */}
          <View className="mt-4 border-t border-slate-100 dark:border-slate-800">
            <PressableScale onPress={() => toggleSection("ingredients")}>
              <View className="flex-row items-center justify-between py-3">
                <Text className="text-sm font-semibold text-slate-800 dark:text-white">
                  Ingrédients & Nutrition
                </Text>
                <MaterialIcons
                  name={expandedSection === "ingredients" ? "expand-less" : "expand-more"}
                  size={24}
                  color={isDark ? "#9ca3af" : "#6b7280"}
                />
              </View>
            </PressableScale>
            
            <PressableScale onPress={() => toggleSection("traceability")}>
              <View className="flex-row items-center justify-between py-3 border-t border-slate-100 dark:border-slate-800">
                <Text className="text-sm font-semibold text-slate-800 dark:text-white">
                  Rapport de Traçabilité
                </Text>
                <MaterialIcons
                  name={expandedSection === "traceability" ? "expand-less" : "expand-more"}
                  size={24}
                  color={isDark ? "#9ca3af" : "#6b7280"}
                />
              </View>
            </PressableScale>
          </View>
        </Animated.View>

        {/* Quantity Selector */}
        <Animated.View
          entering={FadeInDown.delay(600).duration(500)}
          className="px-4 pb-8"
        >
          <Text className="text-sm font-semibold text-slate-800 dark:text-white mb-3">
            Quantité
          </Text>
          <View className="flex-row items-center gap-4">
            <View className="flex-row items-center rounded-lg border border-slate-200 dark:border-slate-700 p-1 bg-white dark:bg-slate-800">
              <Pressable onPress={() => handleQuantityChange(-1)}>
                <View className="h-10 w-10 items-center justify-center rounded-md">
                  <MaterialIcons
                    name="remove"
                    size={24}
                    color={isDark ? "#ffffff" : "#0d1b12"}
                  />
                </View>
              </Pressable>
              <View className="w-12 items-center">
                <Text className="text-lg font-bold text-slate-800 dark:text-white">
                  {quantity}
                </Text>
              </View>
              <Pressable onPress={() => handleQuantityChange(1)}>
                <View className="h-10 w-10 items-center justify-center rounded-md bg-primary">
                  <MaterialIcons name="add" size={24} color="#0d1b12" />
                </View>
              </Pressable>
            </View>
            <View>
              <Text className="text-sm text-green-600 dark:text-green-400 font-medium">
                En Stock
              </Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400">
                Expédition {product.shipsIn}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Related Products */}
        <Animated.View
          entering={FadeInUp.delay(700).duration(500)}
          className="border-t border-slate-100 dark:border-slate-800 pt-8 bg-white dark:bg-background-dark"
        >
          <View className="flex-row items-center justify-between px-4 mb-4">
            <Text className="text-lg font-bold text-slate-800 dark:text-white">
              Vous aimerez aussi
            </Text>
            <PressableScale>
              <Text className="text-sm font-semibold text-primary">
                Voir tout
              </Text>
            </PressableScale>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
          >
            {RELATED_PRODUCTS.map((relatedProduct) => (
              <PressableScale
                key={relatedProduct.id}
                style={{ width: 160 }}
              >
                <View>
                  <View className="relative w-full aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-2">
                    <Image
                      source={{ uri: relatedProduct.image }}
                      className="w-full h-full"
                      contentFit="cover"
                      transition={200}
                    />
                    <View className="absolute top-2 right-2 bg-white/90 dark:bg-black/60 rounded-full p-1">
                      <MaterialIcons name="eco" size={16} color={colors.primary} />
                    </View>
                  </View>
                  <Text
                    className="text-sm font-semibold text-slate-800 dark:text-white"
                    numberOfLines={1}
                  >
                    {relatedProduct.name}
                  </Text>
                  <Text className="text-xs text-slate-500 dark:text-slate-400">
                    {relatedProduct.brand}
                  </Text>
                  <View className="flex-row items-center justify-between mt-1">
                    <Text className="text-sm font-bold text-slate-800 dark:text-white">
                      €{relatedProduct.price.toFixed(2)}
                    </Text>
                    <View className="bg-green-100 dark:bg-green-900 px-1.5 py-0.5 rounded">
                      <Text className="text-[10px] font-bold text-green-800 dark:text-green-200">
                        {relatedProduct.grade}
                      </Text>
                    </View>
                  </View>
                </View>
              </PressableScale>
            ))}
          </ScrollView>
        </Animated.View>
      </ScrollView>

      {/* Fixed Bottom CTA */}
      <Animated.View
        entering={FadeInUp.delay(800).duration(400)}
        className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4"
        style={{ paddingBottom: insets.bottom + 8, paddingTop: 12 }}
      >
        <View className="flex-row items-center gap-4">
          <View className="flex-1">
            <Text className="text-xs text-slate-500 dark:text-slate-400">Total</Text>
            <Text className="text-xl font-bold text-slate-800 dark:text-white">
              €{(product.price * quantity).toFixed(2)}
            </Text>
          </View>
          <PressableScale
            onPress={handleAddToCart}
            style={{
              flex: 1,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
          >
            <View className="bg-primary py-4 rounded-xl flex-row items-center justify-center gap-2">
              <MaterialIcons name="add-shopping-cart" size={20} color="#0d1b12" />
              <Text className="text-base font-bold text-slate-900">
                Ajouter
              </Text>
            </View>
          </PressableScale>
        </View>
      </Animated.View>
    </View>
  );
}
