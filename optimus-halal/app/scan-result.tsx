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
  RefreshControl,
  type LayoutChangeEvent,
} from "react-native";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { defaultFeatureFlags } from "@/constants/config";
import { BlurView } from "expo-blur";
import { CaretRightIcon, InfinityIcon, InfoIcon, XIcon } from "phosphor-react-native";
import { ImpactFeedbackStyle, NotificationFeedbackType } from "expo-haptics";
import Animated, {
  FadeInUp,
  FadeInLeft,
  FadeInRight,
  ZoomIn,
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  withSpring,
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
import { BottomBarV2 } from "@/components/scan/BottomBarV2";
import { StickyHeaderV2, STICKY_HEADER_V2_HEIGHT } from "@/components/scan/StickyHeaderV2";
import { ScanResultTabBar } from "@/components/scan/ScanResultTabBar";
import { ScanResultPager } from "@/components/scan/ScanResultPager";
import { HalalSchoolsCard } from "@/components/scan/HalalSchoolsCard";
import { FeedbackBar } from "@/components/scan/FeedbackBar";
import { ScholarlySourceSheet } from "@/components/scan/ScholarlySourceSheet";
import { NaqiyAdviceSheet } from "@/components/scan/NaqiyAdviceSheet";
import { ScanLoadingSkeleton } from "@/components/scan/ScanLoadingSkeleton";
import { ScanErrorState, ScanNotFoundState } from "@/components/scan/ScanStates";
import { AlertPillStrip } from "@/components/scan/AlertPillStrip";
// HalalVerdictCard replaced by HalalSchoolsCard inside pager
import { HealthNutritionCard } from "@/components/scan/HealthNutritionCard";
// AdditivesCard moved inside HalalSchoolsCard
// HalalDetailCard replaced by HalalSchoolsCard inside pager
import { HalalAnalysisBottomSheet } from "@/components/scan/HalalAnalysisBottomSheet";
import { CertifierPracticesSheet } from "@/components/scan/CertifierPracticesSheet";
import { InfoSheet } from "@/components/scan/InfoSheet";
import { NutriScoreDetailContent } from "@/components/scan/sheets/NutriScoreDetailContent";
import { AxisDetailContent } from "@/components/scan/sheets/AxisDetailContent";
import { NovaDetailContent } from "@/components/scan/sheets/NovaDetailContent";
import { AllergenDetailContent } from "@/components/scan/sheets/AllergenDetailContent";
import { LabelDetailContent } from "@/components/scan/sheets/LabelDetailContent";
import { IngredientDetailContent } from "@/components/scan/sheets/IngredientDetailContent";
import { AlertDetailContent } from "@/components/scan/sheets/AlertDetailContent";
import { AdditiveDetailContent } from "@/components/scan/sheets/AdditiveDetailContent";
import { BoycottDetailContent } from "@/components/scan/sheets/BoycottDetailContent";
// CommunityVoteCard/NewProductBanner replaced by FeedbackCard
// HalalActionCard removed — contextual actions folded into FeedbackCard
import type { NutrientItem, PersonalAlert } from "@/components/scan/scan-types";
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
import { useFeatureFlagsStore, useQuotaStore, useLocalFavoritesStore, useLocalScanHistoryStore, useLocalNutritionProfileStore, useTrialStore, DAILY_SCAN_LIMIT } from "@/store";
import { isAuthenticated as hasStoredTokens } from "@/services/api";
import { trackEvent } from "@/lib/analytics";
import { buildVerdictSummary } from "@/utils/verdict-summary";

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
  const [refreshing, setRefreshing] = useState(false);

  // Reset state when barcode changes (e.g. navigating to an alternative product)
  const prevBarcode = useRef(barcode);
  const scrollRef = useRef<any>(null);
  useEffect(() => {
    if (barcode !== prevBarcode.current) {
      prevBarcode.current = barcode;
      hasFired.current = false;
      // Reset scroll position + sticky header state
      scrollY.value = 0;
      scrollRef.current?.scrollTo?.({ y: 0, animated: false });
    }
  }, [barcode]);

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

  const handleRefresh = useCallback(() => {
    if (!barcode) return;
    setRefreshing(true);
    scanMutation.mutate(
      {
        barcode,
        viewOnly: isViewOnly || undefined,
        nutritionProfile: nutritionProfile !== "standard" ? nutritionProfile : undefined,
      },
      { onSettled: () => setRefreshing(false) },
    );
  }, [barcode, isViewOnly, nutritionProfile, scanMutation]);

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
  const nutrientBreakdown = scanMutation.data?.nutrientBreakdown ?? null;
  const additiveHealthEffects = scanMutation.data?.additiveHealthEffects ?? {};
  const detectedAdditives = scanMutation.data?.detectedAdditives ?? [];
  const meQuery = useMe({ enabled: hasStoredTokens() });
  const isGuest = !meQuery.data && (!hasStoredTokens() || meQuery.isError);
  const localRemaining = useQuotaStore((s) => s.getRemainingScans());
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
          certifierTrustScore: scanMutation.data?.certifierData?.trustScore ?? null,
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

  // ── Hero color rule ──
  const effectiveHeroStatus: HalalStatusKey =
    halalStatus === "halal" && certifierTrustScore !== null && certifierTrustScore < 70
      ? "doubtful"
      : halalStatus;
  const statusConfig = STATUS_CONFIG[effectiveHeroStatus] ?? STATUS_CONFIG.unknown;
  // Hero label: factual status only — trust badge handles reliability assessment
  // Uses halalStatus (actual product status) not effectiveHeroStatus (color override)
  // because effectiveHeroStatus can be "doubtful" for a halal product with weak certifier
  const heroLabel =
    halalStatus === "halal" && certifierData_
      ? t.scanResult.certifiedHalal          // "Certification Détectée"
      : halalStatus === "halal" && !certifierData_
        ? t.scanResult.compositionCompliant   // "Composition Conforme"
        : t.scanResult[statusConfig.labelKey]; // haram/doubtful/unknown standard labels
  const ingredients: string[] = (product?.ingredients as string[]) ?? [];
  const allergensTags: string[] = offExtras?.allergensTags ?? [];
  const personalAlerts: PersonalAlert[] = scanMutation.data?.personalAlerts ?? [];
  const communityVerifiedCount = scanMutation.data?.communityVerifiedCount ?? 0;
  const certifierData = scanMutation.data?.certifierData ?? null;
  const ingredientRulings = scanMutation.data?.ingredientRulings ?? [];
  const specialProduct = scanMutation.data?.specialProduct ?? null;

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

  // ── Certifier Practices Bottom Sheet ──────────────
  const [showCertifierPracticesSheet, setShowCertifierPracticesSheet] = useState(false);
  const handleCloseCertifierPractices = useCallback(() => setShowCertifierPracticesSheet(false), []);

  // ── Naqiy Advice Bottom Sheet (hadith on doubt) ──
  const [showNaqiyAdviceSheet, setShowNaqiyAdviceSheet] = useState(false);
  const handleCloseNaqiyAdvice = useCallback(() => setShowNaqiyAdviceSheet(false), []);

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

  // ── Pager + TabBar state ─────────────────────
  const [activeTab, setActiveTab] = useState(0);
  const scrollProgress = useSharedValue(0);
  // Two-part measurement: contentAreaY (padded container Y in scroll coords)
  // + tabBarLocalY (tab bar Y within padded container).
  const contentAreaY = useSharedValue(0);
  const tabBarLocalY = useSharedValue(9999);
  const [selectedScholarlyData, setSelectedScholarlyData] = useState<
    import("@/components/scan/ScholarlySourceSheet").ScholarlySourceData
    | import("@/components/scan/ScholarlySourceSheet").ScholarlySourceData[]
    | null
  >(null);

  // ── InfoSheet state (discriminated union for all detail sheets) ──
  const [infoSheet, setInfoSheet] = useState<{
    type: "nutriscore"; grade: string;
  } | {
    type: "axis"; name: string; score: number; max: number; color: string;
  } | {
    type: "nova"; group: number; label: string;
  } | {
    type: "allergen"; name: string; isTrace: boolean;
  } | {
    type: "label"; name: string;
  } | {
    type: "ingredient"; name: string; status: "halal" | "haram" | "doubtful" | "safe"; ruling?: { explanation: string; scholarlyReference: string | null };
  } | {
    type: "alert"; alert: PersonalAlert;
  } | {
    type: "boycott"; companyName: string; reason: string; sourceUrl?: string | null; sourceName?: string | null;
  } | {
    type: "additive"; code: string; name: string; category: string; origin: string; toxicityLevel: string; healthEffectsFr: string | null; halalRuling: string | null; riskPregnant: boolean; riskChildren: boolean;
  } | null>(null);
  const handleCloseInfoSheet = useCallback(() => setInfoSheet(null), []);

  const handleContentAreaLayout = useCallback((event: LayoutChangeEvent) => {
    contentAreaY.value = event.nativeEvent.layout.y;
  }, []);

  const handleTabBarLayout = useCallback((event: LayoutChangeEvent) => {
    tabBarLocalY.value = event.nativeEvent.layout.y;
  }, []);

  const stickyHeaderTotalHeight = STICKY_HEADER_V2_HEIGHT + insets.top;

  // Unified sticky block: header + tab bar share the SAME scroll thresholds
  // so they appear together as one cohesive unit.
  const STICKY_START = HERO_HEIGHT * 0.45;
  const STICKY_END = HERO_HEIGHT * 0.65;

  const stickyTabBarStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      scrollY.value,
      [STICKY_START, STICKY_END],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return {
      opacity: progress,
      transform: [{ translateY: interpolate(progress, [0, 1], [-8, 0], Extrapolation.CLAMP) }],
      pointerEvents: progress > 0.5 ? "auto" as const : "none" as const,
    };
  });

  // Inline tab bar fades out as sticky header fades in — avoids the duplicate
  const inlineTabBarStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      scrollY.value,
      [STICKY_START, STICKY_END],
      [1, 0],
      Extrapolation.CLAMP,
    );
    return {
      opacity: progress,
      pointerEvents: progress < 0.1 ? "none" as const : "auto" as const,
    };
  });

  // Background scale — pressed down when any bottom sheet opens (iOS card presentation style)
  const bgScale = useSharedValue(1);
  const bgScaleStyle = useAnimatedStyle(() => ({
    flex: 1,
    transform: [{ scale: bgScale.value }],
    borderRadius: interpolate(bgScale.value, [0.93, 1], [16, 0], Extrapolation.CLAMP),
    overflow: "hidden" as const,
  }));

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
      isBoycotted: !!boycott?.isBoycotted,
      barcode: product.barcode,
      imageUrl: product.imageUrl ?? null,
      madhabStatuses: madhabVerdicts.map((v) => ({
        madhab: v.madhab,
        status: v.status,
      })),
      trustGrade: certifierData?.trustGrade
        ? {
            grade: certifierData.trustGrade.grade,
            label: certifierData.trustGrade.label,
            color: certifierData.trustGrade.color,
          }
        : null,
      healthScore: healthScore?.score ?? null,
      healthLabel: healthScore?.label ?? null,
      certifierScore: certifierTrustScore ?? null,
    };
  }, [product, halalStatus, halalAnalysis, boycott, madhabVerdicts, certifierData, healthScore, certifierTrustScore]);

  const shareLabels = useMemo(() => {
    const statusLabelMap: Record<string, string> = {
      halal: certifierData
        ? t.scanResult.certifiedHalal
        : t.scanResult.compositionCompliant,
      haram: t.scanResult.haramDetected,
      doubtful: t.scanResult.doubtfulStatus,
      unknown: t.scanResult.unverified,
    };

    // Build intelligent verdict summary for share card
    const verdictResult = madhabVerdicts.length > 0
      ? buildVerdictSummary(
          {
            madhabVerdicts: madhabVerdicts.map((v) => ({ madhab: v.madhab, status: v.status })),
            certifierName: certifierData?.name ?? null,
            certifierGrade: certifierData?.trustGrade?.label ?? null,
            certifierScore: certifierTrustScore ?? null,
          },
          t.verdict,
        )
      : null;

    return {
      statusLabel: statusLabelMap[halalStatus] ?? statusLabelMap.unknown,
      certifiedBy: t.scanResult.certifiedBy,
      boycotted: t.scanResult.shareBoycotted,
      verifiedWith: t.scanResult.verifiedWith,
      tagline: t.scanResult.shareTagline,
      fiqhLine: verdictResult?.fiqhLine,
      shortFiqhLine: verdictResult?.shortFiqhLine,
      certifierLine: verdictResult?.certifierLine,
    };
  }, [halalStatus, certifierData, certifierTrustScore, madhabVerdicts, t]);

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
          router.push({ pathname: "/paywall" as any, params: { trigger: "favorites" } });
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

  // Animate background scale when any sheet opens (iOS card presentation style)
  const anySheetOpen =
    showTrustScoreSheet || showCertifierPracticesSheet || showScoreDetailSheet ||
    !!selectedMadhab || showHalalAnalysisSheet || !!selectedNutrient ||
    selectedScholarlyData !== null || showNaqiyAdviceSheet || infoSheet !== null;

  useEffect(() => {
    bgScale.value = withSpring(anySheetOpen ? 0.93 : 1, { damping: 22, stiffness: 200, mass: 0.8 });
  }, [anySheetOpen, bgScale]);

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
      {/* ── Scaled background content (scales down on sheet open, iOS card style) ── */}
      <Animated.View style={bgScaleStyle}>
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
        ref={scrollRef}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}
        showsVerticalScrollIndicator={false}
        bounces={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={isDark ? "#D4AF37" : "#8B6914"}
            progressBackgroundColor={isDark ? "#1a1a1a" : "#f3f1ed"}
          />
        }
      >
        {/* ── HERO SECTION ── */}
        <VerdictHero
          product={product}
          effectiveHeroStatus={effectiveHeroStatus}
          heroLabel={heroLabel}
          userMadhab={userMadhab}
          communityVerifiedCount={communityVerifiedCount}
          onImagePress={() => setShowImagePreview(true)}
          certifierName={certifierData?.name ?? null}
          certifierId={certifierData?.id ?? null}
          certifierScore={certifierTrustScore ?? null}
          trustGrade={certifierData?.trustGrade ?? null}
          onTrustGradePress={() => setShowCertifierPracticesSheet(true)}
          topInset={insets.top + 64}
        />

        {/* ── Horizon content — flat flowing sections ── */}
        <View onLayout={handleContentAreaLayout} style={styles.horizonContainer}>

          {/* ALERT PILL STRIP (boycott + allergens + health — unified) */}
          {allAlerts.length > 0 && (
            <AlertPillStrip
              alerts={allAlerts}
              staggerIndex={1}
              onPillPress={(alert) => {
                if (alert.type === "boycott") {
                  const target = boycott?.targets?.[0];
                  setInfoSheet({
                    type: "boycott",
                    companyName: target?.companyName ?? "",
                    reason: target?.reasonSummary ?? alert.description,
                    sourceUrl: target?.sourceUrl ?? null,
                    sourceName: target?.sourceName ?? null,
                  });
                } else {
                  setInfoSheet({ type: "alert", alert });
                }
              }}
            />
          )}

          {/* TAB BAR + PAGER — wrapped as one unit so horizonContainer gap doesn't split them */}
          <View>
            <Animated.View onLayout={handleTabBarLayout} style={inlineTabBarStyle}>
              <ScanResultTabBar activeTab={activeTab as 0 | 1} onTabPress={setActiveTab} scrollProgress={scrollProgress} />
            </Animated.View>

            {/* PAGER: Halal (page 0) + Health (page 1) */}
            <ScanResultPager
            activeTab={activeTab}
            onPageChange={setActiveTab}
            scrollProgress={scrollProgress}
            halalContent={
              <HalalSchoolsCard
                madhabVerdicts={madhabVerdicts}
                userMadhab={userMadhab}
                certifierData={certifierData ? {
                  id: certifierData.id,
                  name: certifierData.name,
                  shortName: certifierData.name?.slice(0, 3)?.toUpperCase() ?? "",
                  logoUrl: (certifierData as any).logoUrl ?? null,
                  trustScore: certifierData.trustScore ?? 0,
                } : null}
                halalTier={halalAnalysis?.tier ?? null}
                ingredients={ingredients}
                ingredientRulings={ingredientRulings.map((r: any) => ({
                  pattern: r.pattern,
                  ruling: r.ruling,
                  explanation: r.explanationFr ?? r.explanation ?? "",
                  scholarlyReference: r.scholarlyReference ?? null,
                }))}
                detectedAdditives={detectedAdditives}
                trustScore={certifierTrustScore ?? undefined}
                certifierGrade={certifierData?.trustGrade?.label ?? null}
                certifierScore={certifierTrustScore ?? null}
                onMadhabChange={() => {}}
                onMadhabPress={setSelectedMadhab}
                onNaqiyAdvicePress={() => setShowNaqiyAdviceSheet(true)}
                onScholarlySourcePress={setSelectedScholarlyData}
                onTrustScorePress={() => setShowCertifierPracticesSheet(true)}
                onAdditivePress={(additive, ruling) => {
                  setInfoSheet({
                    type: "additive",
                    code: additive.code,
                    name: additive.nameFr,
                    category: additive.category,
                    origin: additive.origin,
                    toxicityLevel: additive.toxicityLevel,
                    healthEffectsFr: additive.healthEffectsFr,
                    halalRuling: ruling ?? null,
                    riskPregnant: additive.riskPregnant,
                    riskChildren: additive.riskChildren,
                  });
                }}
                onIngredientPress={(ingredient) => {
                  const strip = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                  const stripped = strip(ingredient);
                  const ruling = ingredientRulings.find((r: any) => {
                    const p = strip(r.pattern ?? "");
                    return stripped.includes(p) || p.includes(stripped);
                  });
                  const status = ruling
                    ? (ruling.ruling === "haram" ? "haram" : ruling.ruling === "doubtful" ? "doubtful" : "safe")
                    : "safe";
                  setInfoSheet({
                    type: "ingredient",
                    name: ingredient,
                    status: status as any,
                    ruling: ruling ? { explanation: ruling.explanationFr ?? "", scholarlyReference: ruling.scholarlyReference ?? null } : undefined,
                  });
                }}
              />
            }
            healthContent={
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
                nutrientBreakdown={nutrientItems}
                allergens={allergensTags
                  .filter((t_: string) => {
                    const clean = t_.replace(/^(en|fr):/, "").toLowerCase();
                    return !NON_ALLERGEN_TAGS.has(clean);
                  })
                  .map((t_: string) => t_.replace(/^(en|fr):/, "").replace(/-/g, " "))}
                labels={(offExtras?.labelsTags ?? []).map((t_: string) =>
                  t_.replace(/^(en|fr):/, "").replace(/-/g, " ")
                )}
                onNutrientPress={(nb) => setSelectedNutrient({
                  nutrient: nb.key, value: nb.value, unit: nb.unit,
                  level: nb.level as any, dailyValuePercent: nb.percentage, isNegative: !nb.isPositive,
                })}
                onScorePress={() => setShowScoreDetailSheet(true)}
                onNutriScorePress={() => {
                  const grade = offExtras?.nutriscoreGrade;
                  if (grade) setInfoSheet({ type: "nutriscore", grade });
                }}
                onAxisPress={(axis) => {
                  const pct = axis.max > 0 ? axis.score / axis.max : 0;
                  const color = pct >= 0.7 ? "#22c55e" : pct >= 0.4 ? "#f59e0b" : "#ef4444";
                  setInfoSheet({ type: "axis", ...axis, color });
                }}
                onNovaPress={() => {
                  const nova = offExtras?.novaGroup;
                  if (nova != null) setInfoSheet({ type: "nova", group: nova, label: `NOVA ${nova}` });
                }}
                onAllergenPress={(allergen) => setInfoSheet({ type: "allergen", name: allergen, isTrace: false })}
                onLabelPress={(label) => setInfoSheet({ type: "label", name: label })}
                detectedAdditives={detectedAdditives}
                onAdditivePress={(additive) => {
                  setInfoSheet({
                    type: "additive",
                    code: additive.code,
                    name: additive.nameFr,
                    category: additive.category,
                    origin: additive.origin,
                    toxicityLevel: additive.toxicityLevel,
                    healthEffectsFr: additive.healthEffectsFr,
                    halalRuling: null, // Health tab — no halal context
                    riskPregnant: additive.riskPregnant,
                    riskChildren: additive.riskChildren,
                  });
                }}
                staggerIndex={4}
              />
            }
          />
          </View>

          {/* ── Horizon divider ── */}
          <View style={[styles.horizonDivider, { backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" }]} />

          {/* ALTERNATIVES */}
          <AlternativesSection
            alternatives={(alternativesQuery.data ?? []).map(adaptLegacyAlternative)}
            isLoading={alternativesQuery.isLoading}
            onAlternativePress={(bc: string) => {
              router.navigate({ pathname: "/scan-result", params: { barcode: bc } });
            }}
            staggerIndex={5}
          />

          {/* ── Horizon divider ── */}
          <View style={[styles.horizonDivider, { backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" }]} />

          {/* FEEDBACK */}
          <FeedbackBar productId={product.id} isGuest={isGuest} staggerIndex={6} />

          {/* ── Horizon divider ── */}
          <View style={[styles.horizonDivider, { backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" }]} />

          {/* DISCLAIMER — flat inline */}
          <View style={styles.disclaimerRow}>
            <InfoIcon size={14} color={colors.textMuted} style={{ marginTop: 1 }} />
            <Text style={[styles.disclaimerText, { color: colors.textMuted }]}>
              {t.scanResult.disclaimer}
            </Text>
          </View>
        </View>
      </Animated.ScrollView>

      {/* Quota banner — anonymous users only, hidden during trial */}
      {isGuest && !useTrialStore.getState().isTrialActive() && remainingScans !== null && remainingScans !== undefined && remainingScans <= Math.ceil(DAILY_SCAN_LIMIT * 0.1) && (
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
            onPress={() => router.push({ pathname: "/paywall" as any, params: { trigger: "scan_quota" } })}
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

      {/* ── Sticky Tab Bar clone (appears when inline bar scrolls out) ── */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: stickyHeaderTotalHeight,
            left: 0,
            right: 0,
            zIndex: 90,
            overflow: "hidden" as const,
          },
          stickyTabBarStyle,
        ]}
      >
        {/* Glass background — same as CompactStickyHeader */}
        {Platform.OS === "ios" ? (
          <BlurView
            intensity={isDark ? 50 : 70}
            tint={isDark ? "dark" : "light"}
            style={[StyleSheet.absoluteFill, {
              backgroundColor: isDark ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.5)",
            }]}
          />
        ) : (
          <View
            style={[StyleSheet.absoluteFill, {
              backgroundColor: isDark ? "rgba(12,12,12,0.95)" : "rgba(243,241,237,0.95)",
            }]}
          />
        )}
        <ScanResultTabBar activeTab={activeTab as 0 | 1} onTabPress={setActiveTab} scrollProgress={scrollProgress} />
      </Animated.View>

      {/* ── Compact Sticky Header (scroll-interpolated) ── */}
      <StickyHeaderV2
        scrollY={scrollY}
        heroHeight={HERO_HEIGHT}
        productName={product?.name ?? ""}
        effectiveHeroStatus={effectiveHeroStatus as HalalStatusKey}
        trustGrade={certifierData?.trustGrade ?? null}
        onBackPress={handleGoBack}
      />

      {/* ── Fixed Bottom Action Bar ── */}
      <BottomBarV2
        effectiveHeroStatus={effectiveHeroStatus as HalalStatusKey}
        productIsFavorite={productIsFavorite}
        isFavMutating={isFavMutating}
        marketplaceEnabled={marketplaceEnabled}
        onToggleFavorite={handleToggleFavorite}
        onShare={handleShare}
        onFindStores={handleFindStores}
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

      </Animated.View>
      {/* ── Level-Up Celebration Overlay — gamification gated ── */}
      {defaultFeatureFlags.gamificationEnabled && showLevelUp && levelUp && (
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

      <CertifierPracticesSheet
        visible={showCertifierPracticesSheet}
        certifierId={certifierData?.id ?? null}
        certifierName={certifierData?.name ?? null}
        trustScore={certifierTrustScore}
        practices={certifierData?.practices ?? null}
        detail={certifierData?.detail ?? null}
        onClose={handleCloseCertifierPractices}
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

      <ScholarlySourceSheet
        visible={selectedScholarlyData !== null}
        data={selectedScholarlyData}
        onClose={() => setSelectedScholarlyData(null)}
      />

      <NaqiyAdviceSheet
        visible={showNaqiyAdviceSheet}
        onClose={handleCloseNaqiyAdvice}
      />

      {/* ── Generic InfoSheet (progressive disclosure for all detail views) ── */}
      <InfoSheet
        visible={infoSheet !== null}
        onClose={handleCloseInfoSheet}
        title={
          infoSheet?.type === "nutriscore" ? "NutriScore"
          : infoSheet?.type === "axis" ? infoSheet.name
          : infoSheet?.type === "nova" ? `NOVA ${infoSheet.group}`
          : infoSheet?.type === "allergen" ? infoSheet.name
          : infoSheet?.type === "label" ? infoSheet.name
          : infoSheet?.type === "ingredient" ? infoSheet.name
          : infoSheet?.type === "alert" ? infoSheet.alert.title
          : infoSheet?.type === "additive" ? `${infoSheet.code} · ${infoSheet.name}`
          : infoSheet?.type === "boycott" ? `Boycott · ${infoSheet.companyName}`
          : undefined
        }
      >
        {infoSheet?.type === "nutriscore" && (
          <NutriScoreDetailContent grade={infoSheet.grade} />
        )}
        {infoSheet?.type === "axis" && (
          <AxisDetailContent name={infoSheet.name} score={infoSheet.score} max={infoSheet.max} color={infoSheet.color} />
        )}
        {infoSheet?.type === "nova" && (
          <NovaDetailContent group={infoSheet.group} label={infoSheet.label} />
        )}
        {infoSheet?.type === "allergen" && (
          <AllergenDetailContent name={infoSheet.name} isTrace={infoSheet.isTrace} />
        )}
        {infoSheet?.type === "label" && (
          <LabelDetailContent name={infoSheet.name} />
        )}
        {infoSheet?.type === "ingredient" && (
          <IngredientDetailContent name={infoSheet.name} status={infoSheet.status} ruling={infoSheet.ruling} />
        )}
        {infoSheet?.type === "alert" && (
          <AlertDetailContent alert={infoSheet.alert} />
        )}
        {infoSheet?.type === "additive" && (
          <AdditiveDetailContent
            code={infoSheet.code}
            name={infoSheet.name}
            category={infoSheet.category}
            origin={infoSheet.origin}
            toxicityLevel={infoSheet.toxicityLevel}
            healthEffectsFr={infoSheet.healthEffectsFr}
            halalRuling={infoSheet.halalRuling}
            riskPregnant={infoSheet.riskPregnant}
            riskChildren={infoSheet.riskChildren}
          />
        )}
        {infoSheet?.type === "boycott" && (
          <BoycottDetailContent
            companyName={infoSheet.companyName}
            reason={infoSheet.reason}
            sourceUrl={infoSheet.sourceUrl}
            sourceName={infoSheet.sourceName}
          />
        )}
      </InfoSheet>

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
  horizonContainer: {
    paddingHorizontal: spacing.xl,
    gap: spacing["5xl"],
    paddingTop: spacing.xl,
    paddingBottom: spacing["6xl"],
  },
  horizonDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: -spacing.xl,
  },
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
    paddingHorizontal: spacing.xs,
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
