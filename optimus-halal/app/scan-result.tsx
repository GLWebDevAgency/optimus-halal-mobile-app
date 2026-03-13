/**
 * Scan Result Screen — Orchestrator
 *
 * Continuous-scroll layout with direct inline section cards.
 * Hero → AlertStrip → HalalVerdictCard → (Alternatives if non-halal) →
 * HealthNutritionCard → AdditivesCard → (Alternatives if halal) → Disclaimer.
 * CompactStickyHeader (scroll-interpolated) + ScanBottomBar (glass action bar).
 *
 * Detail bottom sheets: madhab, trust score, score detail, nutrient detail.
 *
 * @module app/scan-result
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Alert,
  Modal,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CaretRightIcon, InfinityIcon, InfoIcon, XIcon } from "phosphor-react-native";
import { ImpactFeedbackStyle, NotificationFeedbackType } from "expo-haptics";
import Animated, {
  FadeInUp,
  FadeInLeft,
  FadeInRight,
  ZoomIn,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { IconButton, LevelUpCelebration, PremiumBackground } from "@/components/ui";
import { PressableScale } from "@/components/ui/PressableScale";
import { MadhabBottomSheet } from "@/components/scan/MadhabBottomSheet";
import { TrustScoreBottomSheet } from "@/components/scan/TrustScoreBottomSheet";
import { ScoreDetailBottomSheet, type HealthAxesUI } from "@/components/scan/ScoreDetailBottomSheet";
import { ShareCardView, captureAndShareCard } from "@/components/scan/ShareCard";
import { NutrientDetailSheet } from "@/components/scan/NutrientDetailSheet";
import { AlternativesSection, adaptLegacyAlternative } from "@/components/scan/AlternativesSection";
import { VerdictHero } from "@/components/scan/VerdictHero";
import { ScanBottomBar } from "@/components/scan/ScanBottomBar";
import { CompactStickyHeader } from "@/components/scan/CompactStickyHeader";
import { ScanLoadingSkeleton } from "@/components/scan/ScanLoadingSkeleton";
import { ScanErrorState, ScanNotFoundState } from "@/components/scan/ScanStates";
import { AlertPillStrip } from "@/components/scan/AlertPillStrip";
import { HalalVerdictCard } from "@/components/scan/HalalVerdictCard";
import { HealthNutritionCard } from "@/components/scan/HealthNutritionCard";
import { AdditivesCard } from "@/components/scan/AdditivesCard";
import { HalalDetailCard } from "@/components/scan/HalalDetailCard";
import { HalalAnalysisBottomSheet } from "@/components/scan/HalalAnalysisBottomSheet";
import { CommunityVoteCard, NewProductBanner } from "@/components/scan/InlineScanSections";
import { HalalActionCard } from "@/components/scan/HalalActionCard";
import type { NutrientItem, DietaryItem, AdditiveItem, PersonalAlert } from "@/components/scan/scan-types";
import {
  STATUS_CONFIG,
  MADHAB_LABEL_KEY,
  MADHAB_TRUST_KEY,
  HERO_HEIGHT,
  type HalalStatusKey,
} from "@/components/scan/scan-constants";
import { trpc } from "@/lib/trpc";
import { useScanBarcode } from "@/hooks/useScan";
import { useTranslation, useHaptics, useAddFavorite, useRemoveFavorite, useFavoritesList, useMe } from "@/hooks";
import { useTheme } from "@/hooks/useTheme";
import { brand as brandTokens, glass, lightTheme } from "@/theme/colors";
import { fontSize as fontSizeTokens, fontWeight as fontWeightTokens } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import type { NutrientLevel } from "@/services/api/types";
import { useFeatureFlagsStore, useQuotaStore, useLocalFavoritesStore, useLocalScanHistoryStore, useLocalNutritionProfileStore } from "@/store";
import { isAuthenticated as hasStoredTokens } from "@/services/api";
import { trackEvent } from "@/lib/analytics";

// ── Non-allergen tags incorrectly tagged by OpenFoodFacts ──
const NON_ALLERGEN_TAGS = new Set([
  "pork", "porc", "meat", "viande", "beef", "boeuf",
  "chicken", "poulet", "horse", "cheval", "rabbit", "lapin",
]);

// ══════════════════════════════════════════════════════════════
// MAIN SCREEN
// ══════════════════════════════════════════════════════════════

export default function ScanResultScreen() {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const { impact, notification } = useHaptics();
  const { t } = useTranslation();
  const { barcode, viewOnly } = useLocalSearchParams<{ barcode: string; viewOnly?: string }>();
  const isViewOnly = viewOnly === "1";

  // ── tRPC Mutation ──────────────────────────────
  const scanMutation = useScanBarcode();
  const { data: userProfile } = trpc.profile.getProfile.useQuery(undefined, { enabled: hasStoredTokens() });
  const hasFired = useRef(false);
  const shareCardRef = useRef<View>(null);
  const [scribeComplete, setScribeComplete] = useState(false);

  const nutritionProfile = useLocalNutritionProfileStore((s) => s.profile);

  useEffect(() => {
    if (barcode && !hasFired.current) {
      hasFired.current = true;
      scanMutation.mutate({
        barcode,
        viewOnly: isViewOnly || undefined,
        nutritionProfile: nutritionProfile !== "standard" ? nutritionProfile : undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hasFired ref guards re-fire
  }, [barcode, isViewOnly]);

  // ── Derived State ──────────────────────────────
  const product = scanMutation.data?.product ?? null;
  const halalAnalysis = scanMutation.data?.halalAnalysis ?? null;
  const boycott = scanMutation.data?.boycott ?? null;
  const offExtras = scanMutation.data?.offExtras ?? null;
  const healthScore = scanMutation.data?.healthScore ?? null;
  const madhabVerdicts = useMemo(
    () => scanMutation.data?.madhabVerdicts ?? [],
    [scanMutation.data?.madhabVerdicts]
  );
  const levelUp = scanMutation.data?.levelUp ?? null;
  const dietaryAnalysis = scanMutation.data?.dietaryAnalysis ?? null;
  const nutrientBreakdown = scanMutation.data?.nutrientBreakdown ?? null;
  const additiveHealthEffects = scanMutation.data?.additiveHealthEffects ?? {};
  const meQuery = useMe({ enabled: hasStoredTokens() });
  const isGuest = !meQuery.data && (!hasStoredTokens() || meQuery.isError);
  const localRemaining = useQuotaStore((s) => {
    if (s.lastScanDate !== new Date().toISOString().slice(0, 10)) return 5;
    return Math.max(0, 5 - s.dailyScansUsed);
  });
  const remainingScans = scanMutation.data?.remainingScans ?? (isGuest ? localRemaining : null);

  // Increment local quota counter + save to local history after a successful anonymous scan
  const quotaIncremented = useRef(false);
  useEffect(() => {
    if (!scanMutation.isSuccess || isViewOnly) return;

    const p = scanMutation.data?.product;

    if (!quotaIncremented.current) {
      trackEvent("scan_result_viewed", {
        barcode,
        halal_status: p?.halalStatus ?? "unknown",
        is_guest: isGuest,
        is_new_product: scanMutation.data?.isNewProduct ?? false,
      });
    }

    if (isGuest && !quotaIncremented.current) {
      quotaIncremented.current = true;
      useQuotaStore.getState().incrementScan();
      if (p) {
        useLocalScanHistoryStore.getState().addScan({
          barcode: p.barcode ?? barcode,
          productId: p.id,
          name: p.name,
          brand: p.brand ?? null,
          imageUrl: p.imageUrl ?? null,
          halalStatus: p.halalStatus ?? "unknown",
          confidenceScore: p.confidenceScore ?? null,
          certifierId: p.certifierId ?? null,
          certifierName: p.certifierName ?? null,
        });
      }
    }
  }, [scanMutation.isSuccess, isGuest, isViewOnly, scanMutation.data, barcode]);

  const halalStatus: HalalStatusKey =
    (product?.halalStatus as HalalStatusKey) ?? "unknown";

  // ── Per-madhab trust score selection ──
  const userMadhab = (userProfile?.madhab as "hanafi" | "shafii" | "maliki" | "hanbali" | "general" | null) ?? "general";
  const certifierData_ = scanMutation.data?.certifierData;
  const certifierTrustScore = useMemo(() => {
    if (!certifierData_) return null;
    const MADHAB_SCORE_KEY = {
      hanafi: "trustScoreHanafi",
      shafii: "trustScoreShafii",
      maliki: "trustScoreMaliki",
      hanbali: "trustScoreHanbali",
    } as const;
    if (userMadhab !== "general" && userMadhab in MADHAB_SCORE_KEY) {
      return certifierData_[MADHAB_SCORE_KEY[userMadhab as keyof typeof MADHAB_SCORE_KEY]] ?? certifierData_.trustScore;
    }
    return certifierData_.trustScore;
  }, [certifierData_, userMadhab]);

  const isStaleData = useMemo(() => {
    const verified = certifierData_?.lastVerifiedAt;
    if (!verified) return false;
    const verifiedDate = new Date(verified);
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
    return verifiedDate < twelveMonthsAgo;
  }, [certifierData_]);

  // ── Hero color rule ──
  const effectiveHeroStatus: HalalStatusKey =
    halalStatus === "halal" && certifierTrustScore !== null && certifierTrustScore < 70
      ? "doubtful"
      : halalStatus;
  const statusConfig = STATUS_CONFIG[effectiveHeroStatus] ?? STATUS_CONFIG.unknown;
  const isWeakCertifier = halalStatus === "halal" && certifierTrustScore !== null && certifierTrustScore < 20;
  const isCautionCertifier = halalStatus === "halal" && certifierTrustScore !== null && certifierTrustScore < 70 && certifierTrustScore >= 20;
  const heroLabel =
    effectiveHeroStatus === "halal" && !certifierData_
      ? t.scanResult.compositionCompliant
      : isWeakCertifier
        ? t.scanResult.weakCertification
        : isCautionCertifier
          ? t.scanResult.cautionCertification
          : t.scanResult[statusConfig.labelKey];
  const ingredients: string[] = (product?.ingredients as string[]) ?? [];
  const allergensTags: string[] = offExtras?.allergensTags ?? [];
  const personalAlerts: PersonalAlert[] = scanMutation.data?.personalAlerts ?? [];
  const communityVerifiedCount = scanMutation.data?.communityVerifiedCount ?? 0;
  const certifierData = scanMutation.data?.certifierData ?? null;
  const ingredientRulings = scanMutation.data?.ingredientRulings ?? [];
  const specialProduct = scanMutation.data?.specialProduct ?? null;
  const isNewProduct = scanMutation.data?.isNewProduct ?? false;

  // ── Community Vote (local state — no backend mutation yet) ──
  const [userVote, setUserVote] = useState<"up" | "down" | null>(null);
  const handleVote = useCallback((vote: "up" | "down" | null) => {
    impact();
    setUserVote(vote);
    if (vote && product) {
      trackEvent("community_vote", {
        barcode: product.barcode,
        product_id: product.id,
        vote,
        halal_status: halalStatus,
      });
    }
  }, [impact, product, halalStatus]);

  // ── Feature Flags ────────────────────────────
  const { isFeatureEnabled } = useFeatureFlagsStore();
  const marketplaceEnabled = isFeatureEnabled("marketplaceEnabled");
  const alternativesQuery = trpc.product.getAlternatives.useQuery(
    { productId: product?.id ?? "", limit: 10 },
    { enabled: !!product?.id }
  );

  // ── Level-Up Celebration ─────────────────────
  const [showLevelUp, setShowLevelUp] = useState(false);
  const handleDismissLevelUp = useCallback(() => setShowLevelUp(false), []);

  useEffect(() => {
    if (levelUp) setShowLevelUp(true);
  }, [levelUp]);

  // ── Madhab Bottom Sheet ─────────────────────
  const [selectedMadhab, setSelectedMadhab] = useState<{
    madhab: string;
    status: "halal" | "doubtful" | "haram" | "unknown";
    conflictingAdditives: {
      code: string;
      name: string;
      ruling: string;
      explanation: string;
      scholarlyReference: string | null;
    }[];
    conflictingIngredients: {
      pattern: string;
      ruling: string;
      explanation: string;
      scholarlyReference: string | null;
    }[];
  } | null>(null);

  const handleCloseMadhab = useCallback(() => setSelectedMadhab(null), []);

  // ── Trust Score Bottom Sheet ─────────────────
  const [showTrustScoreSheet, setShowTrustScoreSheet] = useState(false);
  const handleCloseTrustScore = useCallback(() => setShowTrustScoreSheet(false), []);

  // ── Score Detail Bottom Sheet ──────────────
  const [showScoreDetailSheet, setShowScoreDetailSheet] = useState(false);
  const handleCloseScoreDetail = useCallback(() => setShowScoreDetailSheet(false), []);

  // ── Halal Analysis Bottom Sheet ──────────────
  const [showHalalAnalysisSheet, setShowHalalAnalysisSheet] = useState(false);
  const handleCloseHalalAnalysis = useCallback(() => setShowHalalAnalysisSheet(false), []);

  // ── Nutrient Detail Bottom Sheet ─────────────
  const [selectedNutrient, setSelectedNutrient] = useState<{
    nutrient: string; value: number; unit: string; level: NutrientLevel;
    dailyValuePercent: number; isNegative: boolean;
  } | null>(null);
  const handleCloseNutrientDetail = useCallback(() => setSelectedNutrient(null), []);

  // ── Scroll-Interpolated Sticky Header ──────────────
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll(event) {
      scrollY.value = event.contentOffset.y;
    },
  });

  // ── Product Image Preview Modal ──────────────
  const [showImagePreview, setShowImagePreview] = useState(false);

  // ── Favorites (backend-synced OR local for guests) ─────────────────
  const favoritesQuery = useFavoritesList({ limit: 200 });
  const addFavoriteMutation = useAddFavorite();
  const removeFavoriteMutation = useRemoveFavorite();
  const localFavIsFavorite = useLocalFavoritesStore((s) =>
    product?.id ? s.isFavorite(product.id) : false
  );
  const [favOverride, setFavOverride] = useState<boolean | null>(null);
  const prevFavData = useRef(favoritesQuery.data);
  if (favoritesQuery.data !== prevFavData.current) {
    prevFavData.current = favoritesQuery.data;
    if (favOverride !== null) setFavOverride(null);
  }
  const productIsFavorite = useMemo(() => {
    if (favOverride !== null) return favOverride;
    if (isGuest) return localFavIsFavorite;
    return favoritesQuery.data?.some((f: any) => f.productId === product?.id) ?? false;
  }, [favOverride, isGuest, localFavIsFavorite, favoritesQuery.data, product?.id]);

  // ── Haptic orchestration on verdict ────────────
  const hasFiredHaptic = useRef(false);
  useEffect(() => {
    if (product && !hasFiredHaptic.current) {
      hasFiredHaptic.current = true;
      if (halalStatus === "halal") {
        notification(NotificationFeedbackType.Success);
        setTimeout(() => impact(ImpactFeedbackStyle.Light), 200);
      } else if (halalStatus === "haram") {
        notification(NotificationFeedbackType.Error);
        setTimeout(() => notification(NotificationFeedbackType.Error), 180);
      } else if (halalStatus === "doubtful") {
        notification(NotificationFeedbackType.Warning);
        setTimeout(() => impact(ImpactFeedbackStyle.Light), 250);
      } else {
        impact(ImpactFeedbackStyle.Light);
      }
    }
  }, [product, halalStatus, notification, impact]);

  // ── Callbacks ──────────────────────────────────
  const handleGoBack = useCallback(() => {
    impact();
    router.back();
  }, [impact]);

  const shareData = useMemo(() => {
    if (!product) return null;
    return {
      productName: product.name,
      brand: product.brand ?? null,
      halalStatus: halalStatus as "halal" | "haram" | "doubtful" | "unknown",
      certifier: halalAnalysis?.certifierName ?? null,
      isBoycotted: !!boycott,
      barcode: product.barcode,
    };
  }, [product, halalStatus, halalAnalysis, boycott]);

  const shareLabels = useMemo(() => {
    const statusLabelMap: Record<string, string> = {
      halal: certifierData
        ? t.scanResult.certifiedHalal
        : t.scanResult.compositionCompliant,
      haram: t.scanResult.haramDetected,
      doubtful: t.scanResult.doubtfulStatus,
      unknown: t.scanResult.unverified,
    };
    return {
      statusLabel: statusLabelMap[halalStatus] ?? statusLabelMap.unknown,
      certifiedBy: t.scanResult.certifiedBy,
      boycotted: t.scanResult.shareBoycotted,
      verifiedWith: t.scanResult.verifiedWith,
      tagline: t.scanResult.shareTagline,
    };
  }, [halalStatus, certifierData, t]);

  const handleShare = useCallback(async () => {
    impact();
    if (!shareData) return;
    await captureAndShareCard(shareCardRef, shareData, shareLabels);
  }, [shareData, shareLabels, impact]);

  const isFavMutating = addFavoriteMutation.isPending || removeFavoriteMutation.isPending;

  const handleToggleFavorite = useCallback(() => {
    if (!product?.id) return;
    impact(ImpactFeedbackStyle.Medium);
    if (isGuest) {
      const store = useLocalFavoritesStore.getState();
      if (store.isFavorite(product.id)) {
        store.removeFavorite(product.id);
      } else {
        const added = store.addFavorite({
          productId: product.id,
          name: product.name,
          imageUrl: product.imageUrl ?? null,
          halalStatus: product.halalStatus ?? "unknown",
        });
        if (!added) {
          router.push("/paywall" as any);
        }
      }
      return;
    }
    if (isFavMutating) return;
    setFavOverride(!productIsFavorite);
    if (productIsFavorite) {
      removeFavoriteMutation.mutate(
        { productId: product.id },
        {
          onError: () => {
            setFavOverride(null);
            Alert.alert(t.favorites.removeError);
          },
        }
      );
    } else {
      addFavoriteMutation.mutate(
        { productId: product.id },
        {
          onError: (err) => {
            setFavOverride(null);
            if (err.data?.code === "FORBIDDEN") {
              Alert.alert(
                t.favorites.premiumLimitTitle,
                t.favorites.premiumLimitMessage,
                [{ text: "OK" }]
              );
            } else if (err.data?.code === "CONFLICT") {
              // Already favorited — stale cache, will self-correct on refetch
            } else {
              Alert.alert(t.favorites.addError);
            }
          },
        }
      );
    }
  }, [isFavMutating, product, productIsFavorite, addFavoriteMutation, removeFavoriteMutation, impact, t, isGuest]);

  const handleFindStores = useCallback(() => {
    impact();
    router.navigate({
      pathname: "/(marketplace)/catalog",
      params: {
        ...(product?.name ? { search: product.name } : {}),
      },
    } as any);
  }, [impact, product?.name]);

  const handleReport = useCallback(() => {
    impact();
    router.push({
      pathname: "/report",
      params: { productId: product?.id, productName: product?.name },
    });
  }, [product, impact]);

  const handleRetry = useCallback(() => {
    hasFired.current = false;
    hasFiredHaptic.current = false;
    setScribeComplete(false);
    scanMutation.reset();
    if (barcode) {
      hasFired.current = true;
      scanMutation.mutate({
        barcode,
        viewOnly: isViewOnly || undefined,
        nutritionProfile: nutritionProfile !== "standard" ? nutritionProfile : undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barcode, isViewOnly]);

  // ── Derived data for inline section cards ──────────

  // Unified alert array for AlertPillStrip
  const allAlerts: PersonalAlert[] = useMemo(() => {
    const alerts: PersonalAlert[] = [];

    // Boycott pill (if active)
    if (boycott?.isBoycotted) {
      for (const target of boycott.targets) {
        alerts.push({
          type: "boycott",
          severity: "high",
          title: `Boycott · ${target.companyName}`,
          description: target.reasonSummary ?? "",
        });
      }
    }

    // Personal alerts (allergens, health)
    for (const a of personalAlerts ?? []) {
      alerts.push(a);
    }

    return alerts;
  }, [boycott, personalAlerts]);

  // Whether to show alternatives before health (haram/doubtful — Al-Taqwa)
  const isNonHalal = effectiveHeroStatus === "haram" || effectiveHeroStatus === "doubtful";

  // Nutrient breakdown for HealthNutritionCard
  const nutrientItems: NutrientItem[] = (nutrientBreakdown ?? []).map((nb: any) => ({
    key: nb.nutrient,
    name: nb.labelKey ? ((t.scanResult as Record<string, string>)[nb.labelKey] ?? nb.nutrient) : nb.nutrient,
    value: nb.value,
    unit: nb.unit ?? "g",
    percentage: nb.dailyValuePercent ?? 0,
    level: nb.level ?? "moderate",
    isPositive: !nb.isNegative,
    indented: false,
  }));

  // Dietary items — transform flat DietaryAnalysis object into DietaryItem[]
  const dietaryItems: DietaryItem[] = (() => {
    if (!dietaryAnalysis) return [];
    const da = dietaryAnalysis as any;
    const items: DietaryItem[] = [];
    const DIETARY_MAP: { key: string; field: string; label: string; icon: string; invert: boolean }[] = [
      { key: "gluten", field: "containsGluten", label: "Gluten", icon: "grain", invert: true },
      { key: "lactose", field: "containsLactose", label: "Lactose", icon: "local-drink", invert: true },
      { key: "palm_oil", field: "containsPalmOil", label: "Huile de palme", icon: "eco", invert: true },
      { key: "vegetarian", field: "isVegetarian", label: "Végétarien", icon: "spa", invert: false },
      { key: "vegan", field: "isVegan", label: "Végan", icon: "nature", invert: false },
    ];
    for (const { key, field, label, icon, invert } of DIETARY_MAP) {
      const val = da[field];
      if (val === null || val === undefined) {
        items.push({ key, label, status: "unknown", icon });
      } else if (invert) {
        items.push({ key, label, status: val ? "contains" : "safe", icon });
      } else {
        items.push({ key, label, status: val ? "safe" : "contains", icon });
      }
    }
    return items;
  })();

  // Additives for AdditivesCard — from halalAnalysis.reasons
  const additiveItems: AdditiveItem[] = (halalAnalysis?.reasons ?? [])
    .filter((r: any) => r.type === "additive")
    .map((r: any) => {
      const code = r.name?.split(" ")[0] ?? "";
      const healthEffect = (additiveHealthEffects as Record<string, any>)?.[code];
      const madhabRulings: Record<string, string> = {};
      for (const mv of madhabVerdicts ?? []) {
        const match = (mv.conflictingAdditives ?? []).find((ca: any) => ca.code === code);
        if (match) madhabRulings[mv.madhab] = match.ruling;
      }
      return {
        code,
        name: r.name?.replace(/^E\d+[a-z]?\s*/i, "") ?? "",
        category: r.category ?? "",
        dangerLevel: (r.status === "haram" ? 1 : r.status === "doubtful" ? 2 : r.status === "halal" ? 4 : 3) as 1 | 2 | 3 | 4,
        madhabRulings: Object.keys(madhabRulings).length > 0 ? (madhabRulings as any) : undefined,
        healthEffects: healthEffect ? [{
          type: healthEffect.type as any,
          label: healthEffect.type,
          potential: !healthEffect.confirmed,
        }] : undefined,
        scholarlyRefs: r.scholarlyReference ? [{ source: r.scholarlyReference }] : undefined,
      };
    });

  // ── RENDER: Loading ────────────────────────────
  if (scanMutation.isPending || !scribeComplete) {
    return (
      <ScanLoadingSkeleton
        barcode={barcode}
        onComplete={() => setScribeComplete(true)}
      />
    );
  }

  // ── RENDER: Error ──────────────────────────────
  if (scanMutation.error) {
    return <ScanErrorState onRetry={handleRetry} onGoBack={handleGoBack} />;
  }

  // ── RENDER: Not Found ──────────────────────────
  if (!product) {
    return <ScanNotFoundState onGoBack={handleGoBack} />;
  }

  // ── RENDER: Success ────────────────────────────

  return (
    <View style={{ flex: 1 }}>
      <PremiumBackground />
      {/* ── Floating Back Button ── */}
      <Animated.View
        entering={FadeInLeft.delay(200).duration(350)}
        style={[
          styles.floatingBackButton,
          { top: insets.top + 8 },
        ]}
      >
        <IconButton
          icon="arrow-back"
          variant="filled"
          onPress={handleGoBack}
          color={isDark ? brandTokens.white : lightTheme.textPrimary}
          accessibilityLabel={t.common.back}
        />
      </Animated.View>

      {/* ── Floating InfoIcon Button (certified products only) ── */}
      {certifierData && (
        <Animated.View
          entering={FadeInRight.delay(200).duration(350)}
          style={[
            styles.floatingInfoButton,
            { top: insets.top + 8 },
          ]}
        >
          <IconButton
            icon="info-outline"
            variant="filled"
            onPress={() => {
              impact();
              setShowTrustScoreSheet(true);
            }}
            color={isDark ? brandTokens.white : lightTheme.textPrimary}
            accessibilityLabel={t.scanResult.trustScoreExplainTitle}
          />
        </Animated.View>
      )}

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* ── HERO SECTION ── */}
        <VerdictHero
          product={product}
          halalAnalysis={halalAnalysis}
          certifierData={certifierData}
          certifierTrustScore={certifierTrustScore}
          effectiveHeroStatus={effectiveHeroStatus}
          heroLabel={heroLabel}
          userMadhab={userMadhab}
          isStaleData={isStaleData}
          communityVerifiedCount={communityVerifiedCount}
          onImagePress={() => setShowImagePreview(true)}
          onScoreDetailPress={() => setShowScoreDetailSheet(true)}
          topInset={insets.top + 64}
        />

        {/* ── Content cards — padded container ── */}
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing["6xl"] }}>

          {/* ALERT PILL STRIP (boycott + allergens + health — unified) */}
          {allAlerts.length > 0 && (
            <AlertPillStrip alerts={allAlerts} staggerIndex={1} />
          )}

          {/* HALAL VERDICT CARD */}
          <HalalVerdictCard
            madhabVerdicts={madhabVerdicts}
            userMadhab={userMadhab ?? ""}
            effectiveHeroStatus={effectiveHeroStatus as any}
            ingredientCount={ingredients.length}
            additiveCount={additiveItems.length}
            onPressMadhab={(verdict) => {
              setSelectedMadhab({
                madhab: verdict.madhab,
                status: verdict.status as "halal" | "doubtful" | "haram" | "unknown",
                conflictingAdditives: verdict.conflictingAdditives ?? [],
                conflictingIngredients: verdict.conflictingIngredients ?? [],
              });
            }}
            onPressCard={() => {
              impact();
              setShowHalalAnalysisSheet(true);
            }}
            staggerIndex={2}
          />

          {/* Haram/Doubtful: alternatives BEFORE health (Al-Taqwa) */}
          {isNonHalal && (
            <AlternativesSection
              alternatives={(alternativesQuery.data ?? []).map(adaptLegacyAlternative)}
              scannedProduct={{
                name: product?.name ?? "",
                halalStatus: halalStatus,
                healthScore: healthScore?.score ?? null,
              }}
              isLoading={alternativesQuery.isLoading}
              onAlternativePress={(bc: string) => {
                router.navigate({ pathname: "/scan-result", params: { barcode: bc } });
              }}
              staggerIndex={3}
            />
          )}

          {/* HEALTH & NUTRITION — V3 */}
          <HealthNutritionCard
            healthScore={healthScore ? {
              score: healthScore.score ?? 0,
              label: healthScore.label ?? "unknown",
              axes: {
                nutrition: healthScore.axes?.nutrition ?? null,
                additives: healthScore.axes?.additives ?? { score: 0, max: 20 },
                processing: healthScore.axes?.processing ?? null,
                beverageSugar: healthScore.axes?.beverageSugar,
              },
              bonuses: healthScore.bonuses ?? { bio: 0, aop: 0 },
              dataConfidence: healthScore.dataConfidence ?? "low",
              cappedByAdditive: healthScore.cappedByAdditive ?? false,
              category: healthScore.category ?? "general",
            } : null}
            nutriScoreGrade={offExtras?.nutriscoreGrade ?? undefined}
            novaGroup={offExtras?.novaGroup ?? undefined}
            ecoScoreGrade={offExtras?.ecoscoreGrade ?? undefined}
            nutrientBreakdown={nutrientItems}
            dietaryAnalysis={dietaryItems}
            allergens={allergensTags
              .filter((t_: string) => {
                const clean = t_.replace(/^(en|fr):/, "").toLowerCase();
                return !NON_ALLERGEN_TAGS.has(clean);
              })
              .map((t_: string) => t_.replace(/^(en|fr):/, "").replace(/-/g, " "))}
            traces={(offExtras?.tracesTags ?? []).map((t_: string) => t_.replace(/^(en|fr):/, "").replace(/-/g, " "))}
            onNutrientPress={(nb) => setSelectedNutrient({
              nutrient: nb.key, value: nb.value, unit: nb.unit,
              level: nb.level as any, dailyValuePercent: nb.percentage, isNegative: !nb.isPositive,
            })}
            onPress={() => setShowScoreDetailSheet(true)}
            staggerIndex={4}
          />

          {/* ADDITIVES */}
          {additiveItems.length > 0 && (
            <AdditivesCard
              additives={additiveItems}
              onPressCard={() => {}}
              staggerIndex={5}
            />
          )}

          {/* HALAL ANALYSIS DETAIL — why status, ingredients, scholarly refs, special product */}
          <HalalDetailCard
            halalAnalysis={halalAnalysis}
            ingredients={ingredients}
            ingredientRulings={ingredientRulings}
            specialProduct={specialProduct}
            halalStatus={halalStatus}
            additiveHealthEffects={additiveHealthEffects}
            staggerIndex={6}
          />

          {/* Halal/Unknown: alternatives AFTER analysis */}
          {!isNonHalal && (
            <AlternativesSection
              alternatives={(alternativesQuery.data ?? []).map(adaptLegacyAlternative)}
              scannedProduct={{
                name: product?.name ?? "",
                halalStatus: halalStatus,
                healthScore: healthScore?.score ?? null,
              }}
              isLoading={alternativesQuery.isLoading}
              onAlternativePress={(bc: string) => {
                router.navigate({ pathname: "/scan-result", params: { barcode: bc } });
              }}
              staggerIndex={7}
            />
          )}

          {/* COMMUNITY ACTIONS — contextual by halal status */}
          {product && halalStatus === "doubtful" && (
            <HalalActionCard
              type="report"
              productName={product.name}
              productBarcode={product.barcode}
              reportLabel={t.scanResult.reportProduct}
              reportDesc={t.scanResult.reportProductDesc}
              onReport={handleReport}
            />
          )}
          {product && halalStatus === "halal" && (
            <HalalActionCard
              type="share"
              productName={product.name}
              productBarcode={product.barcode}
              shareLabel={t.scanResult.shareAnalysis}
              shareDesc={t.scanResult.shareAnalysisDesc}
              shareTagline={t.scanResult.shareTagline}
            />
          )}
          {product && halalStatus === "unknown" && (
            <HalalActionCard
              type="request_certification"
              productName={product.name}
              productBarcode={product.barcode}
              certifyLabel={t.scanResult.unknownStatusReport}
              certifyDesc={t.scanResult.unknownStatusReportDesc}
            />
          )}

          {/* COMMUNITY VOTE */}
          {product && (
            <CommunityVoteCard
              onVote={handleVote}
              userVote={userVote}
              staggerIndex={8}
            />
          )}

          {/* NEW PRODUCT BANNER (conditional) */}
          {isNewProduct && (
            <NewProductBanner staggerIndex={9} />
          )}

          {/* DISCLAIMER — inline */}
          <View style={styles.disclaimerRow}>
            <InfoIcon size={14} color={colors.textMuted} style={{ marginTop: 1 }} />
            <Text style={[styles.disclaimerText, { color: colors.textMuted }]}>
              {t.scanResult.disclaimer}
            </Text>
          </View>
        </View>
      </Animated.ScrollView>

      {/* Quota banner — anonymous users only */}
      {isGuest && remainingScans !== null && remainingScans !== undefined && (
        <Animated.View
          entering={FadeInUp.delay(1000).duration(400)}
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: insets.bottom + 80,
            zIndex: 50,
          }}
        >
          <PressableScale
            onPress={() => router.push("/paywall" as any)}
            accessibilityRole="button"
            accessibilityLabel={t.guest.dailyScans}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 12,
                backgroundColor: isDark ? "rgba(212, 175, 55, 0.1)" : "rgba(212, 175, 55, 0.08)",
                borderWidth: 1,
                borderColor: isDark ? "rgba(212, 175, 55, 0.2)" : "rgba(212, 175, 55, 0.12)",
              }}
            >
              <InfinityIcon size={16} color={colors.primary} />
              <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: "600" }}>
                {remainingScans > 0
                  ? t.guest.scansRemaining.replace("{{count}}", String(remainingScans))
                  : t.guest.noScansLeft}
              </Text>
              <CaretRightIcon size={16} color={colors.textSecondary} />
            </View>
          </PressableScale>
        </Animated.View>
      )}

      {/* ── Compact Sticky Header (scroll-interpolated) ── */}
      <CompactStickyHeader
        scrollY={scrollY}
        heroHeight={HERO_HEIGHT}
        productName={product?.name ?? ""}
        brand={product?.brand ?? null}
        imageUrl={product?.imageUrl ?? null}
        effectiveHeroStatus={effectiveHeroStatus as HalalStatusKey}
        heroLabel={heroLabel}
        certifierData={certifierData ? { name: certifierData.name } : null}
        onTrustScorePress={certifierData ? () => {
          impact();
          setShowTrustScoreSheet(true);
        } : undefined}
      />

      {/* ── Fixed Bottom Action Bar ── */}
      <ScanBottomBar
        effectiveHeroStatus={effectiveHeroStatus as HalalStatusKey}
        productIsFavorite={productIsFavorite}
        isFavMutating={isFavMutating}
        marketplaceEnabled={marketplaceEnabled}
        onToggleFavorite={handleToggleFavorite}
        onShare={handleShare}
        onFindStores={handleFindStores}
        onGoBack={handleGoBack}
        onReport={handleReport}
      />

      {/* ── Product Image Preview Modal ── */}
      <Modal
        visible={showImagePreview}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowImagePreview(false)}
      >
        <Pressable
          style={styles.imageModalBackdrop}
          onPress={() => setShowImagePreview(false)}
        >
          <Animated.View
            entering={ZoomIn.duration(300).springify().damping(26).stiffness(120)}
            style={[
              styles.imageModalCard,
              {
                backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
                borderColor: isDark ? glass.dark.borderStrong : glass.light.borderStrong,
              },
            ]}
          >
            {product.imageUrl ? (
              <Image
                source={{ uri: product.imageUrl }}
                style={styles.imageModalPhoto}
                contentFit="contain"
                transition={200}
                accessibilityLabel={product.name}
              />
            ) : null}
            <View style={styles.imageModalFooter}>
              <Text
                style={[styles.imageModalName, { color: isDark ? "#ffffffee" : "#000000dd" }]}
                numberOfLines={2}
              >
                {product.name}
              </Text>
              {product.brand && (
                <Text
                  style={[styles.imageModalBrand, { color: isDark ? "#ffffff88" : "#00000066" }]}
                  numberOfLines={1}
                >
                  {product.brand}
                </Text>
              )}
            </View>
            <Pressable
              onPress={() => setShowImagePreview(false)}
              style={[
                styles.imageModalClose,
                { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t.common.close}
            >
              <XIcon size={18} color={isDark ? "#ffffff99" : "#00000077"} />
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* ── Level-Up Celebration Overlay ── */}
      {showLevelUp && levelUp && (
        <LevelUpCelebration
          newLevel={levelUp.newLevel}
          title={t.scanResult.levelUp}
          subtitle={t.scanResult.reachedLevel.replace("{{level}}", String(levelUp.newLevel))}
          onDismiss={handleDismissLevelUp}
        />
      )}

      {/* ── Bottom Sheets ── */}
      <TrustScoreBottomSheet
        visible={showTrustScoreSheet}
        certifierName={certifierData?.name ?? null}
        trustScore={certifierTrustScore}
        madhab={userMadhab !== "general" ? userMadhab : null}
        onClose={handleCloseTrustScore}
      />

      <ScoreDetailBottomSheet
        visible={showScoreDetailSheet}
        certifierId={certifierData?.id ?? null}
        certifierName={certifierData?.name ?? null}
        trustScore={certifierTrustScore}
        practices={certifierData?.practices ?? null}
        detail={certifierData?.detail ?? null}
        onClose={handleCloseScoreDetail}
        healthAxes={healthScore ? (() => {
          const hs = healthScore as unknown as { axes?: { nutrition?: any; additives?: any; processing?: any; beverageSugar?: any }; bonuses?: { bio: number; aop: number }; category?: string };
          return {
            nutrition: hs.axes?.nutrition ?? null,
            additives: hs.axes?.additives ?? { score: 0, max: 20, hasHighConcern: false },
            processing: hs.axes?.processing ?? null,
            beverageSugar: hs.axes?.beverageSugar,
            bonuses: hs.bonuses ?? { bio: 0, aop: 0 },
            category: hs.category ?? "general",
          } satisfies HealthAxesUI;
        })() : undefined}
      />

      <MadhabBottomSheet
        visible={!!selectedMadhab}
        madhab={selectedMadhab?.madhab ?? ""}
        madhabLabel={
          selectedMadhab
            ? (MADHAB_LABEL_KEY[selectedMadhab.madhab as keyof typeof MADHAB_LABEL_KEY]
                ? t.scanResult[MADHAB_LABEL_KEY[selectedMadhab.madhab as keyof typeof MADHAB_LABEL_KEY]]
                : selectedMadhab.madhab)
            : ""
        }
        status={selectedMadhab?.status ?? "halal"}
        conflictingAdditives={selectedMadhab?.conflictingAdditives ?? []}
        conflictingIngredients={selectedMadhab?.conflictingIngredients ?? []}
        certifierName={certifierData_?.name ?? null}
        certifierTrustScore={
          selectedMadhab && certifierData_
            ? ((certifierData_ as Record<string, unknown>)[MADHAB_TRUST_KEY[selectedMadhab.madhab as keyof typeof MADHAB_TRUST_KEY]] as number | null) ?? null
            : null
        }
        certifierTrustScoreEditorial={certifierData_?.trustScore ?? null}
        onClose={handleCloseMadhab}
      />

      <HalalAnalysisBottomSheet
        visible={showHalalAnalysisSheet}
        onClose={handleCloseHalalAnalysis}
        halalAnalysis={halalAnalysis}
        ingredients={ingredients}
        ingredientRulings={ingredientRulings}
        specialProduct={specialProduct}
        halalStatus={halalStatus}
        additiveHealthEffects={additiveHealthEffects}
      />

      <NutrientDetailSheet
        visible={!!selectedNutrient}
        nutrient={selectedNutrient?.nutrient ?? null}
        value={selectedNutrient?.value ?? null}
        unit={selectedNutrient?.unit ?? "g"}
        level={selectedNutrient?.level ?? null}
        dailyValuePercent={selectedNutrient?.dailyValuePercent ?? null}
        isNegative={selectedNutrient?.isNegative}
        onClose={handleCloseNutrientDetail}
      />

      {/* ── Off-screen Share Card (captured as image) ── */}
      {shareData && (
        <View style={styles.offScreen} pointerEvents="none">
          <ShareCardView ref={shareCardRef} data={shareData} labels={shareLabels} />
        </View>
      )}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// STYLES — Only styles used by this orchestrator
// ══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  floatingBackButton: {
    position: "absolute",
    left: spacing.xl,
    zIndex: 50,
  },
  floatingInfoButton: {
    position: "absolute",
    right: spacing.xl,
    zIndex: 50,
  },
  disclaimerRow: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  disclaimerText: {
    flex: 1,
    fontSize: fontSizeTokens.micro,
    lineHeight: 16,
    opacity: 0.5,
    fontStyle: "italic" as const,
  },
  offScreen: {
    position: "absolute",
    left: -9999,
    top: 0,
    opacity: 1,
  },
  imageModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  imageModalCard: {
    width: 280,
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: "hidden" as const,
    ...(Platform.OS === "ios" ? {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.35,
      shadowRadius: 24,
    } : {
      elevation: 16,
    }),
  },
  imageModalPhoto: {
    width: 280,
    height: 280,
  },
  imageModalFooter: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: 2,
  },
  imageModalName: {
    fontSize: fontSizeTokens.body,
    fontWeight: fontWeightTokens.semiBold,
  },
  imageModalBrand: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.medium,
  },
  imageModalClose: {
    position: "absolute" as const,
    top: spacing.sm,
    right: spacing.sm,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
});
