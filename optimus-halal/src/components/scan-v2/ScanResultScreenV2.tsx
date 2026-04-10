/**
 * ScanResultScreenV2 — V2 orchestrator screen with Stitch-inspired layout.
 *
 * Reuses the existing ScanResultPager + ScanResultTabBar architecture
 * from V1, replacing inner tab content with V2 components:
 *
 * Tab 0 (Halal): HalalVerdictCard -> CertifierTrustCard -> BoycottAlertCard
 *   -> PersonalAlertsCard -> AlgorithmicTraceCard -> AlternativesRail
 * Tab 1 (Health): HealthSummaryCard -> (existing nutrient/additive sections)
 *
 * Feature-flag gated: rendered only when `halal_engine_v2` is "on".
 *
 * @module components/scan-v2/ScanResultScreenV2
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  type LayoutChangeEvent,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ImpactFeedbackStyle, NotificationFeedbackType } from "expo-haptics";
import Animated, {
  FadeInUp,
  FadeInLeft,
  FadeInRight,
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  withSpring,
} from "react-native-reanimated";
import { BackButton } from "@/components/ui";
import { ScanResultTabBar } from "@/components/scan/ScanResultTabBar";
import { ScanResultPager } from "@/components/scan/ScanResultPager";
import { ScanLoadingSkeleton } from "@/components/scan/ScanLoadingSkeleton";
import { ScanErrorState, ScanNotFoundState } from "@/components/scan/ScanStates";
import { StickyHeaderV2, STICKY_HEADER_V2_HEIGHT } from "@/components/scan/StickyHeaderV2";
import { VerdictHero } from "@/components/scan/VerdictHero";
import { BottomBarV2 } from "@/components/scan/BottomBarV2";
import { FeedbackBar } from "@/components/scan/FeedbackBar";
import { HERO_HEIGHT, STATUS_CONFIG, type HalalStatusKey } from "@/components/scan/scan-constants";

import { HalalVerdictCard } from "./HalalVerdictCard";
import { CertifierTrustCard } from "./CertifierTrustCard";
import { BoycottAlertCard } from "./BoycottAlertCard";
import { PersonalAlertsCard } from "./PersonalAlertsCard";
import { AlgorithmicTraceCard } from "./AlgorithmicTraceCard";
import { AlternativesRail } from "./AlternativesRail";
import { HealthSummaryCard } from "./HealthSummaryCard";
import { SubstanceDetailSheet } from "./SubstanceDetailSheet";
import { CertifierDetailSheet } from "./CertifierDetailSheet";
import type {
  ModuleVerdictV2,
  SubstanceDetail,
  HalalVerdict,
} from "./scan-v2-types";
import { staggerDelay, verdictToLevel } from "./scan-v2-utils";

import { useTheme } from "@/hooks/useTheme";
import { useTranslation, useHaptics, usePremium, useMe } from "@/hooks";
import { useScanV2 } from "@/hooks/useScanV2";
import { isAuthenticated as hasStoredTokens } from "@/services/api";
import { useQuotaStore, useLocalScanHistoryStore } from "@/store";
import { spacing } from "@/theme/spacing";
import { trackEvent } from "@/lib/analytics";
import { PremiumBackground } from "@/components/ui";

// ── Props ──

interface ScanResultScreenV2Props {
  barcode: string;
  viewOnly?: string;
}

// ── Component ──

export function ScanResultScreenV2({ barcode, viewOnly }: ScanResultScreenV2Props) {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const { impact, notification } = useHaptics();
  const { t } = useTranslation();
  const { isPremium, showPaywall } = usePremium();
  const isViewOnly = viewOnly === "1";

  // ── V2 Scan Hook ──
  const { data, isLoading, isSuccess, error, refetch } = useScanV2(barcode);
  const [scribeComplete, setScribeComplete] = useState(false);

  // ── Auth / Quota ──
  const meQuery = useMe({ enabled: hasStoredTokens() });
  const isGuest = !meQuery.data && (!hasStoredTokens() || meQuery.isError);

  // ── Refresh ──
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(() => {
    if (!barcode) return;
    setRefreshing(true);
    refetch();
    // Clear refreshing after a brief delay since mutation doesn't have onSettled we can hook into
    setTimeout(() => setRefreshing(false), 1500);
  }, [barcode, refetch]);

  // ── Scroll State ──
  const scrollY = useSharedValue(0);
  const scrollRef = useRef<any>(null);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll(event) {
      scrollY.value = event.contentOffset.y;
    },
  });

  // ── Pager + TabBar ──
  const [activeTab, setActiveTab] = useState(0);
  const scrollProgress = useSharedValue(0);
  const contentAreaY = useSharedValue(0);
  const tabBarLocalY = useSharedValue(9999);

  const handleContentAreaLayout = useCallback((event: LayoutChangeEvent) => {
    contentAreaY.value = event.nativeEvent.layout.y;
  }, [contentAreaY]);

  const handleTabBarLayout = useCallback((event: LayoutChangeEvent) => {
    tabBarLocalY.value = event.nativeEvent.layout.y;
  }, [tabBarLocalY]);

  // ── Sticky Header animation ──
  const stickyHeaderTotalHeight = STICKY_HEADER_V2_HEIGHT + insets.top;
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

  // ── Background scale for sheet open (iOS card presentation) ──
  const bgScale = useSharedValue(1);
  const bgScaleStyle = useAnimatedStyle(() => ({
    flex: 1,
    transform: [{ scale: bgScale.value }],
    borderRadius: interpolate(bgScale.value, [0.93, 1], [16, 0], Extrapolation.CLAMP),
    overflow: "hidden" as const,
  }));

  // ── Bottom Sheet State ──
  const [selectedSubstance, setSelectedSubstance] = useState<SubstanceDetail | null>(null);
  const [showCertifierSheet, setShowCertifierSheet] = useState(false);

  const anySheetOpen = selectedSubstance !== null || showCertifierSheet;

  useEffect(() => {
    bgScale.value = withSpring(anySheetOpen ? 0.93 : 1, { damping: 22, stiffness: 200, mass: 0.8 });
  }, [anySheetOpen, bgScale]);

  // ── Haptic feedback on verdict ──
  const hasFiredHaptic = useRef(false);
  useEffect(() => {
    if (data?.halalReport && !hasFiredHaptic.current) {
      hasFiredHaptic.current = true;
      const verdict = data.halalReport.verdict;
      if (verdict === "halal") {
        notification(NotificationFeedbackType.Success);
        setTimeout(() => impact(ImpactFeedbackStyle.Light), 200);
      } else if (verdict === "haram") {
        notification(NotificationFeedbackType.Error);
        setTimeout(() => notification(NotificationFeedbackType.Error), 180);
      } else if (verdict === "mashbooh" || verdict === "halal_with_caution") {
        notification(NotificationFeedbackType.Warning);
        setTimeout(() => impact(ImpactFeedbackStyle.Light), 250);
      } else {
        impact(ImpactFeedbackStyle.Light);
      }
    }
  }, [data?.halalReport, notification, impact]);

  // ── Guest quota tracking ──
  const quotaIncremented = useRef(false);
  useEffect(() => {
    if (!isSuccess || isViewOnly || !data?.product) return;
    if (!quotaIncremented.current) {
      quotaIncremented.current = true;
      trackEvent("scan_result_v2_viewed", {
        barcode,
        verdict: data.halalReport.verdict,
        is_guest: isGuest,
        engine_version: data.context.engineVersion,
      });
      if (isGuest) {
        useQuotaStore.getState().incrementScan();
        useLocalScanHistoryStore.getState().addScan(
          {
            barcode,
            productId: (data.product as any).id ?? "",
            name: (data.product as any).name ?? "",
            brand: (data.product as any).brand ?? null,
            imageUrl: (data.product as any).imageUrl ?? null,
            halalStatus: data.halalReport.verdict,
            confidenceScore: data.halalReport.confidence,
            certifierId: data.halalReport.certifier?.id ?? null,
            certifierName: data.halalReport.certifier?.name ?? null,
            certifierTrustScore: null,
          },
          isPremium,
        );
      }
    }
  }, [isSuccess, isViewOnly, data, barcode, isGuest, isPremium]);

  // ── Callbacks ──
  const handleGoBack = useCallback(() => {
    impact();
    router.back();
  }, [impact]);

  const handleRetry = useCallback(() => {
    hasFiredHaptic.current = false;
    quotaIncremented.current = false;
    setScribeComplete(false);
    refetch();
  }, [refetch]);

  const handleSignalPress = useCallback((signal: ModuleVerdictV2) => {
    if (!isPremium) {
      showPaywall("madhab_detail");
      return;
    }
    // Map signal to SubstanceDetail for the sheet
    const detail: SubstanceDetail = {
      substanceId: signal.substanceId,
      displayName: signal.displayName,
      score: signal.score,
      verdict: signal.verdict,
      scenarioKey: signal.scenarioKey,
      rationaleFr: signal.rationaleFr,
      rationaleAr: signal.rationaleAr,
      icon: signal.icon,
      fatwaCount: signal.fatwaCount,
      dossierId: signal.dossierId,
      madhabRulings: [], // Full data fetched in sheet or via separate query
      fatwas: [],
      sources: [],
    };
    setSelectedSubstance(detail);
  }, [isPremium, showPaywall]);

  const handleMadhabPress = useCallback(() => {
    // For now, no action — madhab selection lives in profile
  }, []);

  const handleAlternativePress = useCallback((altBarcode: string) => {
    router.navigate({ pathname: "/scan-result", params: { barcode: altBarcode } });
  }, []);

  // ── Derived state ──
  const product = data?.product ?? null;
  const halalReport = data?.halalReport;

  const halalStatusKey: HalalStatusKey = useMemo(() => {
    if (!halalReport) return "unknown";
    switch (halalReport.verdict) {
      case "halal":
      case "halal_with_caution":
        return "halal";
      case "haram":
        return "haram";
      case "mashbooh":
      case "avoid":
        return "doubtful";
      default:
        return "unknown";
    }
  }, [halalReport]);

  const statusConfig = STATUS_CONFIG[halalStatusKey] ?? STATUS_CONFIG.unknown;
  const heroLabel = useMemo(() => {
    if (!halalReport) return "";
    if (halalReport.certifier) {
      return t.scanResult.certifiedHalal;
    }
    if (halalReport.verdict === "halal") {
      return t.scanResult.compositionCompliant;
    }
    return t.scanResult[statusConfig.labelKey as keyof typeof t.scanResult] as string ?? "";
  }, [halalReport, statusConfig, t]);

  // ── RENDER: Loading ──
  if (isLoading || !scribeComplete) {
    return (
      <ScanLoadingSkeleton
        barcode={barcode}
        onComplete={() => setScribeComplete(true)}
      />
    );
  }

  // ── RENDER: Error ──
  if (error) {
    return <ScanErrorState onRetry={handleRetry} onGoBack={handleGoBack} />;
  }

  // ── RENDER: Not Found ──
  if (!product || !halalReport) {
    return <ScanNotFoundState onGoBack={handleGoBack} />;
  }

  // ── RENDER: Success ──
  return (
    <View style={{ flex: 1 }}>
      <PremiumBackground />
      <Animated.View style={bgScaleStyle}>
        {/* Floating Back Button */}
        <Animated.View
          entering={FadeInLeft.delay(200).duration(350)}
          style={[styles.floatingBackButton, { top: insets.top + 8 }]}
        >
          <BackButton variant="overlay" onPress={handleGoBack} label={t.common.back} />
        </Animated.View>

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
          {/* HERO SECTION */}
          <VerdictHero
            product={{
              id: (product as any).id ?? "",
              name: (product as any).name ?? "",
              barcode: (product as any).barcode ?? barcode,
              imageUrl: (product as any).imageUrl ?? null,
              brand: (product as any).brand ?? null,
              halalStatus: halalStatusKey,
            }}
            effectiveHeroStatus={halalStatusKey}
            heroLabel={heroLabel}
            userMadhab={data?.context.madhab ?? "general"}
            communityVerifiedCount={0}
            onImagePress={() => {}}
            certifierName={halalReport.certifier?.name ?? null}
            certifierId={halalReport.certifier?.id ?? null}
            certifierScore={null}
            trustGrade={null}
            onTrustGradePress={() => setShowCertifierSheet(true)}
            topInset={insets.top + 64}
          />

          {/* Horizon content */}
          <View onLayout={handleContentAreaLayout} style={styles.horizonContainer}>

            {/* TAB BAR + PAGER */}
            <View>
              <Animated.View onLayout={handleTabBarLayout} style={inlineTabBarStyle}>
                <ScanResultTabBar
                  activeTab={activeTab as 0 | 1}
                  onTabPress={setActiveTab}
                  scrollProgress={scrollProgress}
                />
              </Animated.View>

              <ScanResultPager
                activeTab={activeTab}
                onPageChange={setActiveTab}
                scrollProgress={scrollProgress}
                halalContent={
                  <View style={styles.tabContent}>
                    {/* 1. Halal Verdict Card */}
                    <HalalVerdictCard
                      report={halalReport}
                      onSignalPress={handleSignalPress}
                      onMadhabPress={handleMadhabPress}
                    />

                    {/* 2. Certifier Trust Card (certified track only) */}
                    {halalReport.certifier && data?.certifierTrustScores && (
                      <CertifierTrustCard
                        certifier={halalReport.certifier}
                        trustScores={data.certifierTrustScores}
                        practices={data.certifierPractices}
                        madhab={(data.context.madhab ?? "general") as any}
                        onCertifierPress={() => setShowCertifierSheet(true)}
                      />
                    )}

                    {/* 3. Boycott Alert Card */}
                    {data?.boycott && (
                      <Animated.View entering={FadeInUp.delay(staggerDelay(2)).springify().damping(14).stiffness(170).mass(0.9)}>
                        <BoycottAlertCard data={data.boycott} />
                      </Animated.View>
                    )}

                    {/* 4. Personal Alerts Card */}
                    {(data?.personalAlerts.length > 0 || data?.personalUpsellHint) && (
                      <Animated.View entering={FadeInUp.delay(staggerDelay(3)).springify().damping(14).stiffness(170).mass(0.9)}>
                        <PersonalAlertsCard
                          alerts={data.personalAlerts}
                          onConfigureProfile={() => router.push("/profile" as any)}
                        />
                      </Animated.View>
                    )}

                    {/* 5. Algorithmic Trace Card (premium) */}
                    {data?.traceSteps.length > 0 && (
                      <Animated.View entering={FadeInUp.delay(staggerDelay(4)).springify().damping(14).stiffness(170).mass(0.9)}>
                        <AlgorithmicTraceCard
                          steps={data.traceSteps}
                          engineVersion={data.context.engineVersion}
                        />
                      </Animated.View>
                    )}

                    {/* 6. Alternatives Rail */}
                    {data?.alternatives.length > 0 && (
                      <Animated.View entering={FadeInUp.delay(staggerDelay(5)).springify().damping(14).stiffness(170).mass(0.9)}>
                        <AlternativesRail
                          alternatives={data.alternatives}
                          onProductPress={handleAlternativePress}
                        />
                      </Animated.View>
                    )}
                  </View>
                }
                healthContent={
                  <View style={styles.tabContent}>
                    {/* Health Summary Card */}
                    {data?.healthSummary && (
                      <HealthSummaryCard data={data.healthSummary} />
                    )}

                    {/* Additional health sections can be added here */}
                    {!data?.healthSummary && (
                      <View style={styles.emptyState}>
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                          {"Aucune donnee nutritionnelle disponible"}
                        </Text>
                      </View>
                    )}
                  </View>
                }
              />
            </View>

            {/* Horizon divider */}
            <View
              style={[
                styles.horizonDivider,
                { backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" },
              ]}
            />

            {/* FEEDBACK */}
            <FeedbackBar
              productId={(product as any).id ?? ""}
              isGuest={isGuest}
              staggerIndex={6}
            />
          </View>
        </Animated.ScrollView>

        {/* Sticky Header (appears on scroll) */}
        <StickyHeaderV2
          scrollY={scrollY}
          heroHeight={HERO_HEIGHT}
          productName={(product as any).name ?? ""}
          effectiveHeroStatus={halalStatusKey}
          onBackPress={handleGoBack}
          activeTab={activeTab as 0 | 1}
          onTabPress={setActiveTab}
          scrollProgress={scrollProgress}
        />

        {/* Bottom Bar */}
        <BottomBarV2
          effectiveHeroStatus={halalStatusKey}
          productIsFavorite={false}
          isFavMutating={false}
          onToggleFavorite={() => {}}
          onShare={() => {}}
          onFindStores={() => {}}
          onReport={() => {
            router.push({
              pathname: "/report",
              params: {
                productId: (product as any).id,
                productName: (product as any).name,
              },
            });
          }}
        />
      </Animated.View>

      {/* ── Bottom Sheets ── */}
      <SubstanceDetailSheet
        substance={selectedSubstance}
        isOpen={selectedSubstance !== null}
        onClose={() => setSelectedSubstance(null)}
      />

      <CertifierDetailSheet
        certifier={halalReport.certifier ?? null}
        trustScores={data?.certifierTrustScores ?? null}
        practices={data?.certifierPractices ?? []}
        isOpen={showCertifierSheet}
        onClose={() => setShowCertifierSheet(false)}
      />
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  floatingBackButton: {
    position: "absolute",
    left: 16,
    zIndex: 10,
  },
  horizonContainer: {
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  tabContent: {
    gap: spacing.md,
  },
  horizonDivider: {
    height: 1,
    marginVertical: spacing.sm,
  },
  emptyState: {
    paddingVertical: spacing["4xl"],
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
});
