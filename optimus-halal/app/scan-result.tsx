/**
 * Scan Result Screen
 * 
 * Affiche les résultats du scan avec:
 * - Image produit en header
 * - Badge de certification
 * - Score éthique
 * - Alertes allergènes
 * - Liste des ingrédients
 * - Actions (favoris, où acheter, signaler)
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Dimensions,
  Share,
} from "react-native";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInUp,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { Card, Badge, IconButton, Button } from "@/components/ui";
import { useScanHistoryStore } from "@/store";
import { colors } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Mock product data
const MOCK_PRODUCT = {
  id: "1",
  barcode: "3760020507350",
  name: "Poulet Rôti aux Herbes",
  brand: "Isla Délice",
  image:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuD-4dM8fo9TyTrJmd30soKHdEwPFLfvGXqxbeuObwLL66Em5f3bjHUlaXaBU9NX2NnsKCcxFI2Msne0StX-PT_vjojKETsr1M881nFzUTypDcG-H53j7YATGLdf2Y7qXplsuX0eC29J0Yi49JEWZ9EBDHB9sKqZQK9YnyJEf1d6Za6cFSY1JxnE33bFcD7gF0VAibllTV2Uuz8zeCLL11F3r3TqN9Epwz8SYXoiO00K-kWOWHMHhr81Ci0E4hMpIxtB2Y39ow-9Knhp",
  halalStatus: "halal",
  ethicalScore: {
    overall: 4.2,
    environmental: 4.0,
    social: 4.5,
    animalWelfare: 4.1,
  },
  certifications: [
    {
      id: "1",
      name: "AVS",
      authority: "Association de Vérification de la Conformité Halal",
      isReliable: true,
    },
  ],
  badges: [
    { label: "Bio", icon: "eco", color: "emerald" },
    { label: "Équitable", icon: "handshake", color: "blue" },
  ],
  allergenAlerts: [
    {
      type: "warning",
      message: "Traces possibles de gluten et de soja. Vérifiez l'emballage si vous êtes sensible.",
    },
  ],
  ingredients: [
    { name: "Filet de poulet (85%)", status: "good", origin: "France" },
    { name: "Eau", status: "good" },
    { name: "Dextrose", status: "moderate", note: "Sucre ajouté" },
    { name: "Sel", status: "good" },
    { name: "E451 (Triphosphates)", status: "warning", hasDetails: true },
    { name: "Arômes naturels", status: "good" },
  ],
};

interface IngredientItemProps {
  name: string;
  status: "good" | "moderate" | "warning";
  origin?: string;
  note?: string;
  hasDetails?: boolean;
  isLast?: boolean;
}

function IngredientItem({
  name,
  status,
  origin,
  note,
  hasDetails,
  isLast,
}: IngredientItemProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const statusColors = {
    good: "#1de560",
    moderate: "#facc15",
    warning: "#f97316",
  };

  return (
    <View
      className={`flex-row items-center justify-between py-3 ${
        !isLast ? "border-b border-slate-100 dark:border-slate-700/50" : ""
      }`}
    >
      <View className="flex-row items-center gap-3 flex-1">
        <View
          className="h-2.5 w-2.5 rounded-full"
          style={{
            backgroundColor: statusColors[status],
            shadowColor: statusColors[status],
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
          }}
        />
        <Text className="text-sm font-medium text-slate-900 dark:text-gray-200 flex-1">
          {name}
        </Text>
      </View>
      {origin && (
        <Text className="text-xs text-slate-400 dark:text-slate-500">
          Origine: {origin}
        </Text>
      )}
      {note && (
        <Text className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
          {note}
        </Text>
      )}
      {hasDetails && (
        <TouchableOpacity
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Détails de ${name}`}
          accessibilityHint="Afficher plus d'informations sur cet ingrédient"
        >
          <Text className="text-xs text-orange-600 dark:text-orange-400 font-bold">
            Détails
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function ScanResultScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { barcode } = useLocalSearchParams<{ barcode: string }>();

  const [showAllIngredients, setShowAllIngredients] = useState(false);

  const product = useMemo(() => MOCK_PRODUCT, [barcode]);

  const { toggleFavorite, isFavorite: checkIsFavorite, favorites } = useScanHistoryStore();
  
  const productIsFavorite = checkIsFavorite(product.barcode);

  const handleGoBack = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, []);

  const handleShare = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `${product.name} par ${product.brand} - Score éthique: ${product.ethicalScore.overall}/5. Vérifié avec Optimus Halal.`,
      });
    } catch (error) {
      console.error(error);
    }
  }, [product]);

  const handleToggleFavorite = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleFavorite(product.barcode);
  }, [product.barcode, toggleFavorite]);

  const handleFindStores = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(tabs)/map");
  }, []);

  const handleReport = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/report",
      params: { productId: product.id, productName: product.name },
    });
  }, [product]);

  const handleViewCertificate = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to certificate details
  }, []);

  const displayedIngredients = showAllIngredients
    ? product.ingredients
    : product.ingredients.slice(0, 6);

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        className="absolute top-0 left-0 right-0 z-40 flex-row items-center justify-between px-4 bg-white/80 dark:bg-background-dark/80 border-b border-slate-100 dark:border-slate-800"
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: 12,
        }}
      >
        <IconButton
          icon="arrow-back"
          variant="outline"
          onPress={handleGoBack}
          color={isDark ? "#ffffff" : "#1e293b"}
          accessibilityLabel="Retour"
        />
        <Text
          className="text-base font-bold text-slate-900 dark:text-white tracking-tight"
          accessibilityRole="header"
        >
          Résultat du Scan
        </Text>
        <IconButton
          icon="share"
          variant="outline"
          onPress={handleShare}
          color={isDark ? "#ffffff" : "#1e293b"}
          accessibilityLabel="Partager"
        />
      </Animated.View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Product Image */}
        <Animated.View
          entering={FadeIn.delay(100).duration(500)}
          className="relative w-full h-[360px] bg-slate-100 dark:bg-slate-800"
          style={{ marginTop: insets.top + 52 }}
        >
          <Image
            source={{ uri: product.image }}
            className="absolute inset-0 w-full h-full opacity-90 dark:opacity-75"
            contentFit="cover"
            transition={200}
            accessible={false}
          />
          <LinearGradient
            colors={["transparent", isDark ? "rgba(17,33,22,0.9)" : "rgba(0,0,0,0.6)"]}
            className="absolute inset-0"
          />
        </Animated.View>

        {/* Main Info Card */}
        <Animated.View
          entering={SlideInUp.delay(200).duration(600)}
          className="relative z-10 -mt-10 px-4"
        >
          <Card variant="elevated" className="p-5">
            {/* Certification Badge */}
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-4 py-1.5 border border-emerald-100 dark:border-emerald-800">
                <MaterialIcons name="verified" size={20} color="#1de560" />
                <Text className="text-primary text-sm font-bold tracking-wide uppercase">
                  Certifié Fiable
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleViewCertificate}
                className="flex-row items-center gap-1"
                activeOpacity={0.7}
                accessibilityRole="link"
                accessibilityLabel="Voir le certificat"
                accessibilityHint="Ouvrir les détails du certificat halal"
              >
                <Text className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Certificat
                </Text>
                <MaterialIcons
                  name="open-in-new"
                  size={14}
                  color={isDark ? "#94a3b8" : "#64748b"}
                />
              </TouchableOpacity>
            </View>

            {/* Product Name */}
            <View className="mb-6">
              <Text
                className="text-2xl font-bold text-slate-900 dark:text-white leading-tight mb-1"
                accessibilityRole="header"
              >
                {product.name}
              </Text>
              <View className="flex-row items-center gap-1">
                <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Marque:
                </Text>
                <Text className="text-sm font-semibold text-slate-900 dark:text-gray-200">
                  {product.brand}
                </Text>
              </View>
            </View>

            {/* Ethical Score */}
            <View className="bg-background-light dark:bg-background-dark rounded-xl p-4 border border-transparent dark:border-slate-700">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="relative h-14 w-14 items-center justify-center rounded-full border-4 border-primary bg-white dark:bg-surface-dark">
                    <Text className="text-lg font-bold text-slate-900 dark:text-white">
                      {product.ethicalScore.overall}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-sm font-bold text-slate-900 dark:text-gray-200 uppercase tracking-wider">
                      Score Éthique
                    </Text>
                    <View className="flex-row mt-0.5">
                      {[1, 2, 3, 4].map((star) => (
                        <MaterialIcons
                          key={star}
                          name="star"
                          size={14}
                          color="#fbbf24"
                        />
                      ))}
                      <MaterialIcons name="star-half" size={14} color="#fbbf24" />
                    </View>
                  </View>
                </View>

                <View className="flex-row flex-wrap gap-2">
                  {product.badges.map((badge, index) => (
                    <View
                      key={index}
                      className={`flex-row items-center gap-1 rounded-lg px-2.5 py-1 border ${
                        badge.color === "emerald"
                          ? "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800"
                          : "bg-blue-100 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800"
                      }`}
                    >
                      <MaterialIcons
                        name={badge.icon as any}
                        size={14}
                        color={badge.color === "emerald" ? "#059669" : "#2563eb"}
                      />
                      <Text
                        className={`text-xs font-medium ${
                          badge.color === "emerald"
                            ? "text-emerald-800 dark:text-emerald-300"
                            : "text-blue-800 dark:text-blue-300"
                        }`}
                      >
                        {badge.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Allergen Alert */}
        {product.allergenAlerts.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(300).duration(500)}
            className="px-4 mt-6"
          >
            <View className="rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/50 p-4 flex-row gap-3">
              <MaterialIcons name="warning" size={20} color="#ea580c" style={{ marginTop: 2 }} />
              <View className="flex-1">
                <Text className="text-sm font-bold text-orange-800 dark:text-orange-200">
                  Alertes Allergènes
                </Text>
                <Text className="text-sm text-orange-700 dark:text-orange-300/80 mt-0.5 leading-relaxed">
                  {product.allergenAlerts[0].message}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Ingredients */}
        <Animated.View
          entering={FadeInUp.delay(400).duration(500)}
          className="px-4 mt-8"
        >
          <View className="flex-row items-center justify-between mb-4">
            <Text
              className="text-lg font-bold text-slate-900 dark:text-white"
              accessibilityRole="header"
            >
              Composition
            </Text>
            <View className="bg-slate-100 dark:bg-surface-dark border border-slate-200 dark:border-slate-700 px-2 py-1 rounded">
              <Text className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {product.ingredients.length} Ingrédients
              </Text>
            </View>
          </View>

          <Card variant="outlined" className="p-4">
            {displayedIngredients.map((ingredient, index) => (
              <IngredientItem
                key={index}
                name={ingredient.name}
                status={ingredient.status as any}
                origin={ingredient.origin}
                note={ingredient.note}
                hasDetails={ingredient.hasDetails}
                isLast={index === displayedIngredients.length - 1}
              />
            ))}
          </Card>

          {product.ingredients.length > 6 && (
            <TouchableOpacity
              onPress={() => setShowAllIngredients(!showAllIngredients)}
              className="w-full mt-4 py-3 flex-row items-center justify-center gap-1 rounded-xl"
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={showAllIngredients ? "Voir moins d'ingrédients" : "Voir tous les ingrédients"}
              accessibilityState={{ expanded: showAllIngredients }}
            >
              <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                {showAllIngredients
                  ? "Voir moins"
                  : "Voir tous les ingrédients"}
              </Text>
              <MaterialIcons
                name={showAllIngredients ? "expand-less" : "expand-more"}
                size={18}
                color={isDark ? "#94a3b8" : "#64748b"}
              />
            </TouchableOpacity>
          )}
        </Animated.View>
      </ScrollView>

      {/* Bottom Actions */}
      <Animated.View
        entering={SlideInUp.delay(500).duration(400)}
        className="absolute bottom-0 left-0 right-0 bg-white dark:bg-surface-dark border-t border-slate-200 dark:border-slate-800 px-4"
        style={{
          paddingBottom: insets.bottom + 16,
          paddingTop: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 6,
          elevation: 8,
        }}
      >
        <View className="flex-row items-center justify-between gap-3 max-w-md mx-auto w-full">
          {/* Favorite */}
          <TouchableOpacity
            onPress={handleToggleFavorite}
            className="h-12 w-12 items-center justify-center rounded-xl bg-slate-50 dark:bg-background-dark border border-slate-100 dark:border-slate-700"
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={productIsFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            accessibilityState={{ selected: productIsFavorite }}
          >
            <MaterialIcons
              name={productIsFavorite ? "favorite" : "favorite-border"}
              size={24}
              color={productIsFavorite ? "#ef4444" : isDark ? "#94a3b8" : "#64748b"}
            />
          </TouchableOpacity>

          {/* Find Stores */}
          <TouchableOpacity
            onPress={handleFindStores}
            className="flex-1 h-12 flex-row items-center justify-center gap-2 bg-primary rounded-xl"
            activeOpacity={0.9}
            style={{
              shadowColor: "#1de560",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
            accessibilityRole="button"
            accessibilityLabel="Où acheter ce produit"
            accessibilityHint="Afficher les commerces à proximité"
          >
            <MaterialIcons name="location-on" size={22} color="#0d1b13" />
            <Text className="text-base font-bold text-slate-900">
              Où acheter ?
            </Text>
          </TouchableOpacity>

          {/* Report */}
          <TouchableOpacity
            onPress={handleReport}
            className="h-12 w-12 items-center justify-center rounded-xl bg-slate-50 dark:bg-background-dark border border-slate-100 dark:border-slate-700"
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Signaler un problème"
            accessibilityHint="Signaler une erreur sur ce produit"
          >
            <MaterialIcons
              name="flag"
              size={24}
              color={isDark ? "#94a3b8" : "#64748b"}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}
