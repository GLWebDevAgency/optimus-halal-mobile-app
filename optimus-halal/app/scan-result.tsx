/**
 * Scan Result Screen — Orchestrator
 *
 * BentoGrid dashboard layout with tile-triggered @gorhom bottom sheets.
 * Hero → BentoGrid tiles → detail sheets for halal, health, alerts, alternatives.
 * CompactStickyHeader (scroll-interpolated) + ScanBottomBar (glass action bar).
 *
 * Section components (HalalAnalysisSection, HealthNutritionSection, AlternativesSection,
 * AlertStrip, MadhabVerdictCard) are rendered inside bottom sheets as detail views.
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
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { IconButton, LevelUpCelebration, PremiumBackground } from "@/components/ui";
import { PressableScale } from "@/components/ui/PressableScale";
import { type PersonalAlert } from "@/components/scan/PersonalAlerts";
import { MadhabBottomSheet } from "@/components/scan/MadhabBottomSheet";
import { MadhabVerdictCard } from "@/components/scan/MadhabVerdictCard";
import { AlertStrip } from "@/components/scan/AlertStrip";
import { TrustScoreBottomSheet } from "@/components/scan/TrustScoreBottomSheet";
import { ScoreDetailBottomSheet } from "@/components/scan/ScoreDetailBottomSheet";
import { ShareCardView, captureAndShareCard } from "@/components/scan/ShareCard";
import { NutrientDetailSheet } from "@/components/scan/NutrientDetailSheet";
import { HalalAnalysisSection } from "@/components/scan/HalalAnalysisSection";
import { HealthNutritionSection } from "@/components/scan/HealthNutritionSection";
import { AlternativesSection } from "@/components/scan/AlternativesSection";
import { VerdictHero } from "@/components/scan/VerdictHero";
import { BentoGrid } from "@/components/scan/BentoGrid";
import { ScanBottomBar } from "@/components/scan/ScanBottomBar";
import { CompactStickyHeader } from "@/components/scan/CompactStickyHeader";
import { ScanLoadingSkeleton } from "@/components/scan/ScanLoadingSkeleton";
import { ScanErrorState, ScanNotFoundState } from "@/components/scan/ScanStates";
import {
  STATUS_CONFIG,
  MADHAB_LABEL_KEY,
  MADHAB_TRUST_KEY,
  HERO_HEIGHT,
  type HalalStatusKey,
} from "@/components/scan/scan-constants";
import { trpc } from "@/lib/trpc";
import { useScanBarcode } from "@/hooks/useScan";
import { useTranslation, useHaptics, useAddFavorite, useRemoveFavorite, useCreateReview, useFavoritesList, useMe } from "@/hooks";
import { useTheme } from "@/hooks/useTheme";
import { brand as brandTokens, glass, gold, lightTheme } from "@/theme/colors";
import { fontSize as fontSizeTokens, fontWeight as fontWeightTokens } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import type { NutrientLevel } from "@/services/api/types";
import { useFeatureFlagsStore, useQuotaStore, useLocalFavoritesStore, useLocalScanHistoryStore, useLocalNutritionProfileStore } from "@/store";
import { isAuthenticated as hasStoredTokens } from "@/services/api";
import { trackEvent } from "@/lib/analytics";

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
  const madhabVerdicts = scanMutation.data?.madhabVerdicts ?? [];
  const ingredientRulings = useMemo(
    () => scanMutation.data?.ingredientRulings ?? [],
    [scanMutation.data?.ingredientRulings]
  );
  const levelUp = scanMutation.data?.levelUp ?? null;
  const dietaryAnalysis = scanMutation.data?.dietaryAnalysis ?? null;
  const nutrientBreakdown = scanMutation.data?.nutrientBreakdown ?? null;
  const specialProduct = scanMutation.data?.specialProduct ?? null;
  const scoreExclusion = scanMutation.data?.scoreExclusion ?? null;
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
    conflictingAdditives: Array<{
      code: string;
      name: string;
      ruling: string;
      explanation: string;
      scholarlyReference: string | null;
    }>;
    conflictingIngredients: Array<{
      pattern: string;
      ruling: string;
      explanation: string;
      scholarlyReference: string | null;
    }>;
  } | null>(null);

  const handleCloseMadhab = useCallback(() => setSelectedMadhab(null), []);

  // ── Trust Score Bottom Sheet ─────────────────
  const [showTrustScoreSheet, setShowTrustScoreSheet] = useState(false);
  const handleCloseTrustScore = useCallback(() => setShowTrustScoreSheet(false), []);

  // ── Score Detail Bottom Sheet ──────────────
  const [showScoreDetailSheet, setShowScoreDetailSheet] = useState(false);
  const handleCloseScoreDetail = useCallback(() => setShowScoreDetailSheet(false), []);

  // ── Nutrient Detail Bottom Sheet ─────────────
  const [selectedNutrient, setSelectedNutrient] = useState<{
    nutrient: string; value: number; unit: string; level: NutrientLevel;
    dailyValuePercent: number; isNegative: boolean;
  } | null>(null);
  const handleCloseNutrientDetail = useCallback(() => setSelectedNutrient(null), []);

  // ── Sheet Refs (BentoGrid tile → detail sheets) ──
  const halalSheetRef = useRef<BottomSheet>(null);
  const healthSheetRef = useRef<BottomSheet>(null);
  const alertsSheetRef = useRef<BottomSheet>(null);
  const alternativesSheetRef = useRef<BottomSheet>(null);

  // ── Scroll-Interpolated Sticky Header ──────────────
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll(event) {
      scrollY.value = event.contentOffset.y;
    },
  });

  // ── Product Image Preview Modal ──────────────
  const [showImagePreview, setShowImagePreview] = useState(false);

  // ── User Vote (backend-synced) ────────────────
  const [userVote, setUserVote] = useState<"up" | "down" | null>(null);
  const reviewMutation = useCreateReview();

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
    if (marketplaceEnabled) {
      router.navigate({
        pathname: "/(marketplace)/catalog",
        params: {
          ...(product?.name ? { search: product.name } : {}),
        },
      } as any);
    } else {
      router.navigate("/(tabs)/map");
    }
  }, [impact, marketplaceEnabled, product?.name]);

  const handleReport = useCallback(() => {
    impact();
    router.push({
      pathname: "/report",
      params: { productId: product?.id, productName: product?.name },
    });
  }, [product, impact]);

  // ── BentoGrid → Sheet Callbacks ─────────────────
  const handleOpenHalalSheet = useCallback(() => {
    impact();
    halalSheetRef.current?.snapToIndex(0);
  }, [impact]);

  const handleOpenHealthSheet = useCallback(() => {
    impact();
    healthSheetRef.current?.snapToIndex(0);
  }, [impact]);

  const handleOpenAlertsSheet = useCallback(() => {
    impact();
    alertsSheetRef.current?.snapToIndex(0);
  }, [impact]);

  const handleOpenAlternativesSheet = useCallback(() => {
    impact();
    alternativesSheetRef.current?.snapToIndex(0);
  }, [impact]);

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
        <View style={{ paddingTop: insets.top + 64 }}>
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
          />
        </View>

        {/* ── BentoGrid Dashboard (replaces inline sections) ── */}
        <BentoGrid
          prioritizeAlternatives={effectiveHeroStatus === "haram" || effectiveHeroStatus === "doubtful"}
          halalAnalysis={halalAnalysis ? {
            status: halalAnalysis.status ?? "unknown",
            trustScore: certifierTrustScore,
            analysisSource: halalAnalysis.analysisSource ?? null,
          } : null}
          madhabVerdicts={madhabVerdicts}
          certifierData={certifierData ? { name: certifierData.name, id: certifierData.id } : null}
          product={{
            ingredients: Array.isArray(product.ingredients) ? (product.ingredients as string[]).join(", ") : (product.ingredients as string | null),
            additives: (product as any).additives ?? null,
          }}
          userMadhab={userMadhab}
          effectiveHeroStatus={effectiveHeroStatus}
          healthScore={healthScore?.score != null ? { score: healthScore.score, label: healthScore.label ?? "unknown" } : null}
          offExtras={offExtras}
          personalAlerts={personalAlerts.map((a) => ({
            type: a.type,
            severity: a.severity === "high" ? "danger" as const : a.severity === "medium" ? "warning" as const : "info" as const,
            title: a.title,
            message: a.description,
          }))}
          alternativesData={(alternativesQuery.data ?? []).map((a: any) => ({
            id: a.id,
            name: a.name,
            brand: a.brand ?? null,
            imageUrl: a.imageUrl ?? null,
            halalStatus: a.halalStatus ?? "unknown",
          }))}
          alternativesLoading={alternativesQuery.isLoading}
          onOpenHalalSheet={handleOpenHalalSheet}
          onOpenHealthSheet={handleOpenHealthSheet}
          onOpenAlertsSheet={handleOpenAlertsSheet}
          onOpenAlternativesSheet={handleOpenAlternativesSheet}
        />

        {/* ── Community Vote (preserved) ── */}
        <View style={styles.contentContainer}>
          {/* ── Legal Disclaimer ── */}
          <View style={styles.disclaimerRow}>
            <InfoIcon size={14}
              color={colors.textMuted}
              style={{ marginTop: 1 }} />
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

      {/* ── BentoGrid Detail Sheets ── */}
      <BottomSheet
        ref={halalSheetRef}
        index={-1}
        snapPoints={["70%", "95%"]}
        enableDynamicSizing={false}
        enablePanDownToClose
        backgroundStyle={{
          backgroundColor: isDark ? "rgba(18,18,18,1)" : "#ffffff",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}
        handleIndicatorStyle={{ backgroundColor: isDark ? gold[500] : gold[700] }}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
        )}
      >
        <BottomSheetScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
          <HalalAnalysisSection
            boycott={boycott}
            halalAnalysis={halalAnalysis}
            specialProduct={specialProduct}
            dietaryAnalysis={dietaryAnalysis}
            offExtras={offExtras}
            ingredientRulings={ingredientRulings}
            ingredients={ingredients}
            additiveHealthEffects={additiveHealthEffects}
            product={product}
            halalStatus={halalStatus}
            isNewProduct={!!scanMutation.data?.isNewProduct}
            onVote={(vote) => {
              impact();
              setUserVote(vote);
              if (vote && product?.id) {
                reviewMutation.mutate({ productId: product.id, rating: vote === "up" ? 5 : 1 });
              }
            }}
            userVote={userVote}
          />
          <MadhabVerdictCard
            madhabVerdicts={madhabVerdicts}
            certifierData={certifierData_}
            userMadhab={userMadhab}
            effectiveHeroStatus={effectiveHeroStatus}
            onSelectMadhab={(v) => {
              impact();
              setSelectedMadhab(v);
            }}
          />
        </BottomSheetScrollView>
      </BottomSheet>

      <BottomSheet
        ref={healthSheetRef}
        index={-1}
        snapPoints={["60%", "90%"]}
        enableDynamicSizing={false}
        enablePanDownToClose
        backgroundStyle={{
          backgroundColor: isDark ? "rgba(18,18,18,1)" : "#ffffff",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}
        handleIndicatorStyle={{ backgroundColor: isDark ? gold[500] : gold[700] }}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
        )}
      >
        <BottomSheetScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
          <HealthNutritionSection
            healthScore={healthScore}
            offExtras={offExtras}
            scoreExclusion={scoreExclusion}
            dietaryAnalysis={dietaryAnalysis}
            allergensTags={allergensTags}
            nutrientBreakdown={nutrientBreakdown}
            onNutrientPress={(nb) => setSelectedNutrient({
              nutrient: nb.nutrient, value: nb.value, unit: nb.unit,
              level: nb.level, dailyValuePercent: nb.dailyValuePercent, isNegative: nb.isNegative,
            })}
          />
        </BottomSheetScrollView>
      </BottomSheet>

      <BottomSheet
        ref={alertsSheetRef}
        index={-1}
        snapPoints={["45%"]}
        enableDynamicSizing={false}
        enablePanDownToClose
        backgroundStyle={{
          backgroundColor: isDark ? "rgba(18,18,18,1)" : "#ffffff",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}
        handleIndicatorStyle={{ backgroundColor: isDark ? gold[500] : gold[700] }}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
        )}
      >
        <BottomSheetScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
          {personalAlerts.length > 0 && (
            <View style={{ paddingHorizontal: spacing["3xl"] }}>
              <AlertStrip alerts={personalAlerts} />
            </View>
          )}
        </BottomSheetScrollView>
      </BottomSheet>

      <BottomSheet
        ref={alternativesSheetRef}
        index={-1}
        snapPoints={["55%", "85%"]}
        enableDynamicSizing={false}
        enablePanDownToClose
        backgroundStyle={{
          backgroundColor: isDark ? "rgba(18,18,18,1)" : "#ffffff",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}
        handleIndicatorStyle={{ backgroundColor: isDark ? gold[500] : gold[700] }}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
        )}
      >
        <BottomSheetScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
          <AlternativesSection
            variant={effectiveHeroStatus === "haram" || effectiveHeroStatus === "doubtful" ? "priority" : "discover"}
            alternativesQuery={alternativesQuery}
            onAlternativePress={(_id, bc) => {
              if (bc) {
                alternativesSheetRef.current?.close();
                router.navigate({ pathname: "/scan-result", params: { barcode: bc } });
              }
            }}
          />
        </BottomSheetScrollView>
      </BottomSheet>

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
  contentContainer: {
    paddingHorizontal: spacing["3xl"],
    paddingTop: spacing["3xl"],
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
