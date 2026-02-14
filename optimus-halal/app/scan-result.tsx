/**
 * Scan Result Screen
 *
 * Affiche les résultats du scan avec:
 * - Image produit en header
 * - Badge statut halal (halal/haram/douteux/inconnu)
 * - Score de confiance
 * - Liste des ingrédients
 * - Actions (favoris, où acheter, signaler)
 *
 * Connecté au backend via tRPC scan.scanBarcode mutation.
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Dimensions,
  Share,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { ImpactFeedbackStyle } from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInUp,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { Card, IconButton } from "@/components/ui";
import { useScanBarcode } from "@/hooks/useScan";
import { useScanHistoryStore } from "@/store";
import { useTranslation, useHaptics } from "@/hooks";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ── Halal Status → UI Config ──────────────────────────────

const HALAL_STATUS_CONFIG = {
  halal: {
    label: "Certifié Halal",
    icon: "verified" as keyof typeof MaterialIcons.glyphMap,
    color: "#1de560",
    bg: { light: "rgba(29,229,96,0.08)", dark: "rgba(29,229,96,0.15)" },
    border: { light: "#d1fae5", dark: "#065f46" },
  },
  haram: {
    label: "Haram Détecté",
    icon: "dangerous" as keyof typeof MaterialIcons.glyphMap,
    color: "#ef4444",
    bg: { light: "rgba(239,68,68,0.08)", dark: "rgba(239,68,68,0.15)" },
    border: { light: "#fecaca", dark: "#7f1d1d" },
  },
  doubtful: {
    label: "Statut Douteux",
    icon: "help" as keyof typeof MaterialIcons.glyphMap,
    color: "#f97316",
    bg: { light: "rgba(249,115,22,0.08)", dark: "rgba(249,115,22,0.15)" },
    border: { light: "#fed7aa", dark: "#7c2d12" },
  },
  unknown: {
    label: "Non Vérifié",
    icon: "help-outline" as keyof typeof MaterialIcons.glyphMap,
    color: "#94a3b8",
    bg: { light: "rgba(148,163,184,0.08)", dark: "rgba(148,163,184,0.15)" },
    border: { light: "#e2e8f0", dark: "#334155" },
  },
} as const;

type HalalStatusKey = keyof typeof HALAL_STATUS_CONFIG;

// ── Ingredient Item ───────────────────────────────────────

function IngredientItem({ name, isLast }: { name: string; isLast: boolean }) {
  return (
    <View
      className={`flex-row items-center py-3 ${
        !isLast ? "border-b border-slate-100 dark:border-slate-700/50" : ""
      }`}
    >
      <View className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600 mr-3" />
      <Text className="text-sm font-medium text-slate-900 dark:text-gray-200 flex-1">
        {name}
      </Text>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────

export default function ScanResultScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { impact } = useHaptics();
  const isDark = colorScheme === "dark";
  const { t } = useTranslation();
  const { barcode } = useLocalSearchParams<{ barcode: string }>();

  const [showAllIngredients, setShowAllIngredients] = useState(false);

  // ── tRPC Mutation ───────────────────────────
  const scanMutation = useScanBarcode();
  const hasFired = useRef(false);

  useEffect(() => {
    if (barcode && !hasFired.current) {
      hasFired.current = true;
      scanMutation.mutate({ barcode });
    }
  }, [barcode]);

  // ── Derived State (always computed, regardless of loading) ──
  const product = scanMutation.data?.product ?? null;
  const halalAnalysis = scanMutation.data?.halalAnalysis ?? null;
  const boycott = scanMutation.data?.boycott ?? null;
  const offExtras = scanMutation.data?.offExtras ?? null;

  const halalStatus: HalalStatusKey =
    (product?.halalStatus as HalalStatusKey) ?? "unknown";
  const statusConfig = HALAL_STATUS_CONFIG[halalStatus];
  const confidencePercent = Math.round(
    (product?.confidenceScore ?? 0) * 100
  );
  const ingredients: string[] = (product?.ingredients as string[]) ?? [];
  const displayedIngredients = showAllIngredients
    ? ingredients
    : ingredients.slice(0, 6);

  // Extract reasons by type for sections
  const haramReasons = halalAnalysis?.reasons.filter((r) => r.status === "haram") ?? [];
  const doubtfulReasons = halalAnalysis?.reasons.filter((r) => r.status === "doubtful") ?? [];
  const additiveReasons = halalAnalysis?.reasons.filter((r) => r.type === "additive") ?? [];
  const allergensTags: string[] = offExtras?.allergensTags ?? [];

  // ── Local Favorites (instant UX, synced later) ──
  const { toggleFavorite, isFavorite: checkIsFavorite } =
    useScanHistoryStore();
  const productIsFavorite = product
    ? checkIsFavorite(product.barcode)
    : false;

  // ── Callbacks ───────────────────────────────
  const handleGoBack = useCallback(() => {
    impact();
    router.back();
  }, []);

  const handleShare = useCallback(async () => {
    impact();
    if (!product) return;
    try {
      await Share.share({
        message: `${product.name} par ${product.brand ?? "?"} — ${statusConfig.label}. Vérifié avec Optimus Halal.`,
      });
    } catch (error) {
      console.error(error);
    }
  }, [product, statusConfig]);

  const handleToggleFavorite = useCallback(() => {
    impact(ImpactFeedbackStyle.Medium);
    const code = product?.barcode ?? barcode;
    if (code) toggleFavorite(code);
  }, [product, barcode, toggleFavorite]);

  const handleFindStores = useCallback(() => {
    impact();
    router.push("/(tabs)/map");
  }, []);

  const handleReport = useCallback(() => {
    impact();
    router.push({
      pathname: "/report",
      params: { productId: product?.id, productName: product?.name },
    });
  }, [product]);

  const handleRetry = useCallback(() => {
    hasFired.current = false;
    scanMutation.reset();
    if (barcode) {
      hasFired.current = true;
      scanMutation.mutate({ barcode });
    }
  }, [barcode]);

  // ── Loading State ──────────────────────────────
  if (scanMutation.isPending) {
    return (
      <View className="flex-1 bg-background-light dark:bg-background-dark items-center justify-center">
        <Animated.View
          entering={FadeIn.duration(300)}
          className="items-center gap-4"
        >
          <ActivityIndicator size="large" color="#1de560" />
          <Text className="text-base font-medium text-slate-500 dark:text-slate-400">
            Analyse en cours...
          </Text>
          <Text className="text-sm text-slate-400 dark:text-slate-500">
            {barcode}
          </Text>
        </Animated.View>
      </View>
    );
  }

  // ── Error State ────────────────────────────────
  if (scanMutation.error) {
    return (
      <View className="flex-1 bg-background-light dark:bg-background-dark items-center justify-center px-8">
        <Animated.View
          entering={FadeIn.duration(300)}
          className="items-center gap-4"
        >
          <View
            className="w-20 h-20 rounded-full items-center justify-center"
            style={{
              backgroundColor: isDark
                ? "rgba(239,68,68,0.1)"
                : "rgba(239,68,68,0.08)",
            }}
          >
            <MaterialIcons
              name="error-outline"
              size={36}
              color={isDark ? "#f87171" : "#ef4444"}
            />
          </View>
          <Text className="text-lg font-bold text-slate-900 dark:text-white text-center">
            Erreur d'analyse
          </Text>
          <Text className="text-sm text-slate-500 dark:text-slate-400 text-center leading-relaxed">
            Impossible d'analyser le code-barres. Vérifiez votre connexion
            internet et réessayez.
          </Text>
          <View className="flex-row gap-3 mt-4">
            <TouchableOpacity
              onPress={handleGoBack}
              className="px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800"
              accessibilityRole="button"
              accessibilityLabel="Retour"
            >
              <Text className="font-bold text-sm text-slate-700 dark:text-slate-300">
                Retour
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleRetry}
              className="px-6 py-3 rounded-xl bg-primary"
              accessibilityRole="button"
              accessibilityLabel="Réessayer"
            >
              <Text className="font-bold text-sm text-white">Réessayer</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    );
  }

  // ── Product Not Found ──────────────────────────
  if (!product) {
    return (
      <View className="flex-1 bg-background-light dark:bg-background-dark items-center justify-center px-8">
        <Animated.View
          entering={FadeIn.duration(300)}
          className="items-center gap-4"
        >
          <View
            className="w-20 h-20 rounded-full items-center justify-center"
            style={{
              backgroundColor: isDark
                ? "rgba(234,179,8,0.1)"
                : "rgba(234,179,8,0.08)",
            }}
          >
            <MaterialIcons
              name="search-off"
              size={36}
              color={isDark ? "#fbbf24" : "#d97706"}
            />
          </View>
          <Text className="text-lg font-bold text-slate-900 dark:text-white text-center">
            Produit non trouvé
          </Text>
          <Text className="text-sm text-slate-500 dark:text-slate-400 text-center leading-relaxed">
            Le code-barres {barcode} n'a pas été reconnu dans notre base de
            données ni sur OpenFoodFacts.
          </Text>
          <TouchableOpacity
            onPress={handleGoBack}
            className="px-8 py-3 rounded-xl bg-primary mt-4"
            accessibilityRole="button"
            accessibilityLabel="Scanner un autre produit"
          >
            <Text className="font-bold text-sm text-white">
              Scanner un autre produit
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // ── Product Found — Full Display ───────────────

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
          {t.scanResult.title}
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
          {product.imageUrl ? (
            <Image
              source={{ uri: product.imageUrl }}
              className="absolute inset-0 w-full h-full opacity-90 dark:opacity-75"
              contentFit="cover"
              transition={200}
              accessible={false}
            />
          ) : (
            <View className="absolute inset-0 items-center justify-center">
              <MaterialIcons
                name="image-not-supported"
                size={64}
                color={isDark ? "#334155" : "#cbd5e1"}
              />
            </View>
          )}
          <LinearGradient
            colors={[
              "transparent",
              isDark ? "rgba(17,33,22,0.9)" : "rgba(0,0,0,0.6)",
            ]}
            className="absolute inset-0"
          />
        </Animated.View>

        {/* Main Info Card */}
        <Animated.View
          entering={SlideInUp.delay(200).duration(600)}
          className="relative z-10 -mt-10 px-4"
        >
          <Card variant="elevated" className="p-5">
            {/* Halal Status Badge */}
            <View className="flex-row items-center justify-between mb-4">
              <View
                className="flex-row items-center gap-2 rounded-full px-4 py-1.5 border"
                style={{
                  backgroundColor: isDark
                    ? statusConfig.bg.dark
                    : statusConfig.bg.light,
                  borderColor: isDark
                    ? statusConfig.border.dark
                    : statusConfig.border.light,
                }}
              >
                <MaterialIcons
                  name={statusConfig.icon}
                  size={20}
                  color={statusConfig.color}
                />
                <Text
                  className="text-sm font-bold tracking-wide uppercase"
                  style={{ color: statusConfig.color }}
                >
                  {statusConfig.label}
                </Text>
              </View>
              <View className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                <Text className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {confidencePercent}% confiance
                </Text>
              </View>
            </View>

            {/* Product Name */}
            <View className="mb-4">
              <Text
                className="text-2xl font-bold text-slate-900 dark:text-white leading-tight mb-1"
                accessibilityRole="header"
              >
                {product.name}
              </Text>
              {product.brand && (
                <View className="flex-row items-center gap-1">
                  <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Marque:
                  </Text>
                  <Text className="text-sm font-semibold text-slate-900 dark:text-gray-200">
                    {product.brand}
                  </Text>
                </View>
              )}
              {product.category && (
                <Text className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  {product.category}
                </Text>
              )}
            </View>

            {/* Confidence Score Visual */}
            <View className="bg-background-light dark:bg-background-dark rounded-xl p-4 border border-transparent dark:border-slate-700">
              <View className="flex-row items-center gap-3">
                <View
                  className="relative h-14 w-14 items-center justify-center rounded-full border-4 bg-white dark:bg-surface-dark"
                  style={{ borderColor: statusConfig.color }}
                >
                  <Text className="text-lg font-bold text-slate-900 dark:text-white">
                    {confidencePercent}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-slate-900 dark:text-gray-200 uppercase tracking-wider">
                    Score de Confiance
                  </Text>
                  <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Basé sur l'analyse des ingrédients et la base de données
                  </Text>
                </View>
              </View>

              {/* Confidence Bar */}
              <View className="mt-3 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${confidencePercent}%`,
                    backgroundColor: statusConfig.color,
                  }}
                />
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Boycott Alert */}
        {boycott?.isBoycotted && (
          <Animated.View
            entering={FadeInDown.delay(250).duration(500)}
            className="px-4 mt-6"
          >
            <View className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 p-4">
              <View className="flex-row items-center gap-2 mb-2">
                <MaterialIcons name="block" size={22} color="#ef4444" />
                <Text className="text-base font-bold text-red-800 dark:text-red-200">
                  Boycott Actif
                </Text>
              </View>
              {boycott.targets.map((target: any, idx: number) => (
                <View
                  key={target.id ?? idx}
                  className={`py-2 ${idx > 0 ? "border-t border-red-100 dark:border-red-800/40" : ""}`}
                >
                  <Text className="text-sm font-semibold text-red-700 dark:text-red-300">
                    {target.companyName}
                    {target.boycottLevel === "official_bds" ? " — BDS Officiel" : ""}
                  </Text>
                  <Text className="text-xs text-red-600 dark:text-red-400 mt-0.5 leading-relaxed">
                    {target.reasonSummary ?? target.companyName}
                  </Text>
                  {target.sourceUrl && (
                    <Text className="text-xs text-red-500/70 dark:text-red-500/60 mt-1">
                      Source: {target.sourceName ?? "BDS"}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Halal Analysis — Pourquoi ce statut */}
        {halalAnalysis && (haramReasons.length > 0 || doubtfulReasons.length > 0) && (
          <Animated.View
            entering={FadeInUp.delay(300).duration(500)}
            className="px-4 mt-6"
          >
            <Text
              className="text-lg font-bold text-slate-900 dark:text-white mb-3"
              accessibilityRole="header"
            >
              Pourquoi ce statut ?
            </Text>
            <Card variant="outlined" className="p-4">
              {haramReasons.map((reason, idx) => (
                <View
                  key={`haram-${idx}`}
                  className={`flex-row items-start gap-3 py-2.5 ${
                    idx > 0 ? "border-t border-slate-100 dark:border-slate-700/50" : ""
                  }`}
                >
                  <MaterialIcons name="dangerous" size={18} color="#ef4444" style={{ marginTop: 1 }} />
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-red-600 dark:text-red-400">
                      {reason.name}
                    </Text>
                    <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {reason.explanation}
                    </Text>
                  </View>
                </View>
              ))}
              {doubtfulReasons.map((reason, idx) => (
                <View
                  key={`doubtful-${idx}`}
                  className={`flex-row items-start gap-3 py-2.5 ${
                    haramReasons.length > 0 || idx > 0 ? "border-t border-slate-100 dark:border-slate-700/50" : ""
                  }`}
                >
                  <MaterialIcons name="help" size={18} color="#f97316" style={{ marginTop: 1 }} />
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                      {reason.name}
                    </Text>
                    <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {reason.explanation}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          </Animated.View>
        )}

        {/* Halal Analysis — Par qui / Source */}
        {halalAnalysis && (
          <Animated.View
            entering={FadeInUp.delay(350).duration(500)}
            className="px-4 mt-6"
          >
            <Text
              className="text-lg font-bold text-slate-900 dark:text-white mb-3"
              accessibilityRole="header"
            >
              Source de l'analyse
            </Text>
            <Card variant="outlined" className="p-4">
              <View className="flex-row items-center gap-3">
                <View
                  className="h-10 w-10 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: isDark ? "rgba(29,229,96,0.15)" : "rgba(29,229,96,0.08)",
                  }}
                >
                  <MaterialIcons
                    name={halalAnalysis.certifierName ? "verified" : "analytics"}
                    size={20}
                    color="#1de560"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-slate-900 dark:text-gray-200">
                    {halalAnalysis.certifierName ?? "Analyse algorithmique"}
                  </Text>
                  <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {halalAnalysis.analysisSource}
                  </Text>
                </View>
                <View
                  className="px-2 py-1 rounded-md"
                  style={{
                    backgroundColor: isDark ? "rgba(148,163,184,0.15)" : "rgba(148,163,184,0.1)",
                  }}
                >
                  <Text className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                    Tier {halalAnalysis.tier === "certified" ? "1" : halalAnalysis.tier === "analyzed_clean" ? "2" : halalAnalysis.tier === "doubtful" ? "3" : "4"}
                  </Text>
                </View>
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Additifs */}
        {additiveReasons.length > 0 && (
          <Animated.View
            entering={FadeInUp.delay(400).duration(500)}
            className="px-4 mt-6"
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text
                className="text-lg font-bold text-slate-900 dark:text-white"
                accessibilityRole="header"
              >
                Additifs détectés
              </Text>
              <View className="bg-slate-100 dark:bg-surface-dark border border-slate-200 dark:border-slate-700 px-2 py-1 rounded">
                <Text className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {additiveReasons.length} additif{additiveReasons.length > 1 ? "s" : ""}
                </Text>
              </View>
            </View>
            <Card variant="outlined" className="p-4">
              {additiveReasons.map((additive, idx) => (
                <View
                  key={`add-${idx}`}
                  className={`flex-row items-center gap-3 py-2.5 ${
                    idx > 0 ? "border-t border-slate-100 dark:border-slate-700/50" : ""
                  }`}
                >
                  <View
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor:
                        additive.status === "haram"
                          ? "#ef4444"
                          : additive.status === "doubtful"
                            ? "#f97316"
                            : "#1de560",
                    }}
                  />
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-slate-900 dark:text-gray-200">
                      {additive.name}
                    </Text>
                    <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {additive.explanation}
                    </Text>
                  </View>
                  <Text
                    className="text-xs font-bold uppercase"
                    style={{
                      color:
                        additive.status === "haram"
                          ? "#ef4444"
                          : additive.status === "doubtful"
                            ? "#f97316"
                            : "#1de560",
                    }}
                  >
                    {additive.status === "haram" ? "Haram" : additive.status === "doubtful" ? "Douteux" : "Halal"}
                  </Text>
                </View>
              ))}
            </Card>
          </Animated.View>
        )}

        {/* Allergènes */}
        {allergensTags.length > 0 && (
          <Animated.View
            entering={FadeInUp.delay(420).duration(500)}
            className="px-4 mt-6"
          >
            <Text
              className="text-lg font-bold text-slate-900 dark:text-white mb-3"
              accessibilityRole="header"
            >
              Allergènes
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {allergensTags.map((tag) => {
                const label = tag.replace(/^(en|fr):/, "").replace(/-/g, " ");
                return (
                  <View
                    key={tag}
                    className="px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50"
                  >
                    <Text className="text-xs font-semibold text-amber-700 dark:text-amber-300 capitalize">
                      {label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Nutrition Badges */}
        {offExtras && (offExtras.nutriscoreGrade || offExtras.novaGroup) && (
          <Animated.View
            entering={FadeInUp.delay(440).duration(500)}
            className="px-4 mt-6"
          >
            <Text
              className="text-lg font-bold text-slate-900 dark:text-white mb-3"
              accessibilityRole="header"
            >
              Nutrition
            </Text>
            <View className="flex-row gap-3">
              {offExtras.nutriscoreGrade && (
                <Card variant="outlined" className="flex-1 p-4 items-center">
                  <Text className="text-2xl font-black uppercase" style={{
                    color: offExtras.nutriscoreGrade === "a" ? "#1de560"
                      : offExtras.nutriscoreGrade === "b" ? "#85d037"
                      : offExtras.nutriscoreGrade === "c" ? "#f9a825"
                      : offExtras.nutriscoreGrade === "d" ? "#f97316"
                      : "#ef4444",
                  }}>
                    {offExtras.nutriscoreGrade}
                  </Text>
                  <Text className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                    Nutri-Score
                  </Text>
                </Card>
              )}
              {offExtras.novaGroup && (
                <Card variant="outlined" className="flex-1 p-4 items-center">
                  <Text className="text-2xl font-black" style={{
                    color: offExtras.novaGroup === 1 ? "#1de560"
                      : offExtras.novaGroup === 2 ? "#f9a825"
                      : offExtras.novaGroup === 3 ? "#f97316"
                      : "#ef4444",
                  }}>
                    {offExtras.novaGroup}
                  </Text>
                  <Text className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                    NOVA
                  </Text>
                </Card>
              )}
              {offExtras.ecoscoreGrade && (
                <Card variant="outlined" className="flex-1 p-4 items-center">
                  <Text className="text-2xl font-black uppercase" style={{
                    color: offExtras.ecoscoreGrade === "a" ? "#1de560"
                      : offExtras.ecoscoreGrade === "b" ? "#85d037"
                      : offExtras.ecoscoreGrade === "c" ? "#f9a825"
                      : "#f97316",
                  }}>
                    {offExtras.ecoscoreGrade}
                  </Text>
                  <Text className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                    Éco-Score
                  </Text>
                </Card>
              )}
            </View>
          </Animated.View>
        )}

        {/* Ingredients */}
        {ingredients.length > 0 && (
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
                  {ingredients.length} {t.scanResult.ingredients}
                </Text>
              </View>
            </View>

            <Card variant="outlined" className="p-4">
              {displayedIngredients.map((ingredient, index) => (
                <IngredientItem
                  key={index}
                  name={ingredient}
                  isLast={index === displayedIngredients.length - 1}
                />
              ))}
            </Card>

            {ingredients.length > 6 && (
              <TouchableOpacity
                onPress={() => setShowAllIngredients(!showAllIngredients)}
                className="w-full mt-4 py-3 flex-row items-center justify-center gap-1 rounded-xl"
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={
                  showAllIngredients
                    ? "Voir moins d'ingrédients"
                    : "Voir tous les ingrédients"
                }
                accessibilityState={{ expanded: showAllIngredients }}
              >
                <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  {showAllIngredients
                    ? "Voir moins"
                    : `Voir les ${ingredients.length} ingrédients`}
                </Text>
                <MaterialIcons
                  name={showAllIngredients ? "expand-less" : "expand-more"}
                  size={18}
                  color={isDark ? "#94a3b8" : "#64748b"}
                />
              </TouchableOpacity>
            )}
          </Animated.View>
        )}

        {/* New Product Banner */}
        {scanMutation.data?.isNewProduct && (
          <Animated.View
            entering={FadeInDown.delay(500).duration(500)}
            className="px-4 mt-6"
          >
            <View className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 p-4 flex-row gap-3">
              <MaterialIcons
                name="new-releases"
                size={20}
                color="#3b82f6"
                style={{ marginTop: 2 }}
              />
              <View className="flex-1">
                <Text className="text-sm font-bold text-blue-800 dark:text-blue-200">
                  Nouveau produit ajouté
                </Text>
                <Text className="text-sm text-blue-700 dark:text-blue-300/80 mt-0.5 leading-relaxed">
                  Ce produit vient d'être ajouté à notre base de données grâce
                  à votre scan.
                </Text>
              </View>
            </View>
          </Animated.View>
        )}
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
            accessibilityLabel={
              productIsFavorite
                ? "Retirer des favoris"
                : "Ajouter aux favoris"
            }
            accessibilityState={{ selected: productIsFavorite }}
          >
            <MaterialIcons
              name={productIsFavorite ? "favorite" : "favorite-border"}
              size={24}
              color={
                productIsFavorite
                  ? "#ef4444"
                  : isDark
                    ? "#94a3b8"
                    : "#64748b"
              }
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
