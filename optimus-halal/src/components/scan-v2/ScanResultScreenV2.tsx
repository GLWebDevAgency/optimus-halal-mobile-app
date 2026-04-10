/**
 * ScanResultScreenV2 — "The Scholarly Sanctuary" (Stitch Design)
 *
 * Complete rewrite: single vertical scroll, NO horizontal tabs/pager.
 * Two layout tracks:
 *   1. Certified — TrustRing + certifier practices + blocking points
 *   2. Analyzed  — Signal cards + madhab selector + drill-down tabs
 *
 * Design tokens: Nunito headings, Nunito Sans body, rounded-3xl cards,
 * surface-on-surface hierarchy (no 1px borders), editorial shadows.
 *
 * @module components/scan-v2/ScanResultScreenV2
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  Pressable,
  Platform,
  Dimensions,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { ImpactFeedbackStyle, NotificationFeedbackType } from "expo-haptics";
import Animated, {
  FadeInUp,
  FadeIn,
  ZoomIn,
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import {
  CaretLeftIcon,
  ShareNetworkIcon,
  ShieldCheckIcon,
  WarningIcon,
  CheckCircleIcon,
  ScalesIcon,
  BugIcon,
  FlaskIcon,
  LockIcon,
  HeartIcon,
  CaretDownIcon,
  CaretRightIcon,
  LinkIcon,
  ImageBrokenIcon,
  LeafIcon,
  PawPrintIcon,
} from "phosphor-react-native";
import { LinearGradient } from "expo-linear-gradient";

import { BackButton, IconButton, PremiumBackground } from "@/components/ui";
import { TrustRing } from "@/components/ui/TrustRing";
import { ScanLoadingSkeleton } from "@/components/scan/ScanLoadingSkeleton";
import { ScanErrorState, ScanNotFoundState } from "@/components/scan/ScanStates";

import { BoycottAlertCard } from "./BoycottAlertCard";
import { AlternativesRail } from "./AlternativesRail";
import { SubstanceDetailSheet } from "./SubstanceDetailSheet";
import { CertifierDetailSheet } from "./CertifierDetailSheet";
import type {
  ModuleVerdictV2,
  SubstanceDetail,
  HalalVerdict,
  CertifierPractice,
  SubstanceIcon,
} from "./scan-v2-types";
import {
  staggerDelay,
  verdictToLevel,
  getVerdictColor,
  getVerdictBgColor,
  getVerdictLabel,
  getTrustGrade,
  formatTrustGrade,
  scoreToVerdictLevel,
  formatScore,
  getNutriScoreColor,
  getNovaColor,
  getSubstanceIconName,
} from "./scan-v2-utils";

import { useTheme } from "@/hooks/useTheme";
import { useTranslation, useHaptics, usePremium, useMe } from "@/hooks";
import { useScanV2 } from "@/hooks/useScanV2";
import { isAuthenticated as hasStoredTokens } from "@/services/api";
import { useQuotaStore, useLocalScanHistoryStore } from "@/store";
import { spacing, radius } from "@/theme/spacing";
import { textStyles, headingFontFamily, bodyFontFamily, fontSize, fontWeight } from "@/theme/typography";
import { gold } from "@/theme/colors";
import { trackEvent } from "@/lib/analytics";

// ── Constants ──

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const HERO_IMAGE_SIZE = 140;
const CARD_RADIUS = 24;
const INNER_CARD_RADIUS = 16;

const EDITORIAL_SHADOW = Platform.select({
  ios: {
    shadowColor: "#181c1b",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
  },
  android: { elevation: 6 },
}) as object;

const springNaqiy = { damping: 14, stiffness: 170, mass: 0.9 };

// ── Drill-down tab keys ──

const DRILL_DOWN_TABS = [
  "Resume",
  "4 Madhabs",
  "Fatwas",
  "Technique",
  "Sources",
] as const;

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
    setTimeout(() => setRefreshing(false), 1500);
  }, [barcode, refetch]);

  // ── Scroll State ──
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll(event) {
      scrollY.value = event.contentOffset.y;
    },
  });

  // ── Glass AppBar animation ──
  const appBarStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 100],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return { opacity };
  });

  // ── Bottom Sheet State ──
  const [selectedSubstance, setSelectedSubstance] = useState<SubstanceDetail | null>(null);
  const [showCertifierSheet, setShowCertifierSheet] = useState(false);

  // ── Drill-down tab state ──
  const [activeDrillTab, setActiveDrillTab] = useState(0);

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

  const handleShare = useCallback(() => {
    impact();
    // Share logic TBD
  }, [impact]);

  const handleSignalPress = useCallback((signal: ModuleVerdictV2) => {
    if (!isPremium) {
      showPaywall("madhab_detail");
      return;
    }
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
      madhabRulings: [],
      fatwas: [],
      sources: [],
    };
    setSelectedSubstance(detail);
  }, [isPremium, showPaywall]);

  const handleAlternativePress = useCallback((altBarcode: string) => {
    router.navigate({ pathname: "/scan-result", params: { barcode: altBarcode } });
  }, []);

  // ── Derived state ──
  const product = data?.product ?? null;
  const halalReport = data?.halalReport;
  const isCertifiedTrack = data?.context.track === "certified" && halalReport?.certifier !== null;
  const verdictLevel = halalReport ? verdictToLevel(halalReport.verdict) : null;
  const verdictColor = verdictLevel ? getVerdictColor(verdictLevel) : colors.textMuted;

  const trustGrade = useMemo(() => {
    if (!data?.certifierTrustScores) return null;
    return getTrustGrade(data.certifierTrustScores.trustScore);
  }, [data?.certifierTrustScores]);

  // Surface colors from Stitch design
  const surfaceBase = isDark ? "#1a202c" : "#f7faf8";
  const cardBg = isDark ? "#2d3748" : "#ffffff";
  const innerCardBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)";

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
    <View style={[styles.root, { backgroundColor: surfaceBase }]}>
      {/* ── Glass AppBar ── */}
      <View style={[styles.appBar, { paddingTop: insets.top }]} pointerEvents="box-none">
        <Animated.View style={[StyleSheet.absoluteFill, appBarStyle]}>
          <BlurView
            intensity={80}
            tint={isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <View style={styles.appBarContent}>
          <Pressable
            onPress={handleGoBack}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            style={styles.appBarButton}
          >
            <CaretLeftIcon size={24} color={colors.textPrimary} weight="bold" />
          </Pressable>
          <Text style={[styles.appBarTitle, { color: colors.textPrimary }]}>
            {"Analyse Produit"}
          </Text>
          <Pressable
            onPress={handleShare}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Partager"
            style={styles.appBarButton}
          >
            <ShareNetworkIcon size={22} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        bounces
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={isDark ? "#D4AF37" : "#8B6914"}
            progressBackgroundColor={isDark ? "#1a1a1a" : "#f3f1ed"}
          />
        }
      >
        {/* ════════════════════════════════════════════════════
            HERO SECTION — Product image + gradient overlay
           ════════════════════════════════════════════════════ */}
        <Animated.View
          entering={FadeIn.duration(400)}
          style={styles.heroSection}
        >
          <LinearGradient
            colors={
              isDark
                ? ["#0f1210", "#1a202c"]
                : ["#e8f5ec", surfaceBase]
            }
            style={StyleSheet.absoluteFill}
          />

          {/* Safe area spacer for app bar */}
          <View style={{ height: insets.top + 56 }} />

          {/* Product image */}
          <Animated.View
            entering={ZoomIn.delay(100).duration(350).springify().damping(26).stiffness(120)}
            style={styles.heroImageContainer}
          >
            <View
              style={[
                styles.heroImageWrapper,
                {
                  backgroundColor: cardBg,
                  borderColor: verdictColor,
                },
                EDITORIAL_SHADOW,
              ]}
            >
              {(product as any).imageUrl ? (
                <Image
                  source={{ uri: (product as any).imageUrl }}
                  style={styles.heroImage}
                  contentFit="contain"
                  transition={200}
                />
              ) : (
                <View style={styles.heroImagePlaceholder}>
                  <ImageBrokenIcon size={40} color={colors.textMuted} />
                </View>
              )}
            </View>
          </Animated.View>

          {/* Product name */}
          <Animated.View entering={FadeInUp.delay(150).duration(350)}>
            <Text style={[styles.heroProductName, { color: colors.textPrimary }]} numberOfLines={2}>
              {(product as any).name ?? "Produit"}
            </Text>
            {(product as any).brand && (
              <Text style={[styles.heroBrand, { color: colors.textSecondary }]} numberOfLines={1}>
                {(product as any).brand}
              </Text>
            )}
          </Animated.View>

          {/* Community scans count */}
          <Animated.View
            entering={FadeInUp.delay(200).duration(300)}
            style={styles.communityRow}
          >
            <Text style={[styles.communityText, { color: colors.textMuted }]}>
              {"Scanne par la communaute"}
            </Text>
          </Animated.View>
        </Animated.View>

        {/* ════════════════════════════════════════════════════
            HALAL CARD — Main verdict section
           ════════════════════════════════════════════════════ */}
        <Animated.View
          entering={FadeInUp.delay(staggerDelay(1)).springify().damping(springNaqiy.damping).stiffness(springNaqiy.stiffness).mass(springNaqiy.mass)}
          style={[styles.card, { backgroundColor: cardBg }, EDITORIAL_SHADOW]}
        >
          {/* ── Status Row ── */}
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: verdictColor }]} />
            <Text style={[styles.statusLabel, { color: verdictColor }]}>
              {getVerdictLabel(verdictLevel!, "fr")}
            </Text>
            <View style={{ flex: 1 }} />
            {/* Score badge */}
            {halalReport.score > 0 && (
              <View style={[styles.scoreBadge, { backgroundColor: getVerdictBgColor(verdictLevel!, isDark) }]}>
                <Text style={[styles.scoreBadgeText, { color: verdictColor }]}>
                  {`${formatScore(halalReport.score)}/100`}
                </Text>
              </View>
            )}
          </View>

          {/* ── Headline ── */}
          <Text style={[styles.headlineFr, { color: colors.textPrimary }]}>
            {halalReport.headlineFr}
          </Text>

          {/* ════════════════════════════════════════════
              CERTIFIED TRACK
             ════════════════════════════════════════════ */}
          {isCertifiedTrack && (
            <>
              {/* Certifier Info with TrustRing */}
              <View style={[styles.certifierSection, { backgroundColor: innerCardBg }]}>
                <View style={styles.certifierRow}>
                  {/* TrustRing */}
                  {data?.certifierTrustScores && trustGrade && (
                    <TrustRing
                      score={data.certifierTrustScores.trustScore}
                      size={60}
                      strokeWidth={4}
                      color={trustGrade.color}
                    >
                      <Text style={[styles.trustGradeText, { color: trustGrade.color }]}>
                        {formatTrustGrade(trustGrade)}
                      </Text>
                    </TrustRing>
                  )}
                  <View style={styles.certifierInfo}>
                    <View style={styles.certifierNameRow}>
                      <Text style={[styles.certifierName, { color: colors.textPrimary }]} numberOfLines={1}>
                        {halalReport.certifier!.name}
                      </Text>
                      <ShieldCheckIcon size={16} color={colors.statusExcellent} weight="fill" />
                    </View>
                    <Text style={[styles.certifierMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                      {`Madhab: ${halalReport.madhabApplied}`}
                    </Text>
                    {data?.certifierTrustScores && (
                      <Text style={[styles.certifierTrustLabel, { color: colors.textMuted }]}>
                        {`Trust ${data.certifierTrustScores.trustScore}`}
                      </Text>
                    )}
                  </View>
                </View>
              </View>

              {/* Blocking practices (red left border) */}
              {data?.certifierPractices?.filter((p: CertifierPractice) => p.isBlocker).map((practice: CertifierPractice) => (
                <View
                  key={practice.id}
                  style={[styles.blockerCard, { backgroundColor: isDark ? "rgba(239,68,68,0.08)" : "rgba(239,68,68,0.05)" }]}
                >
                  <View style={[styles.blockerBorder, { backgroundColor: colors.statusMauvais }]} />
                  <View style={styles.blockerContent}>
                    <View style={styles.blockerTitleRow}>
                      <WarningIcon size={18} color={colors.statusMauvais} weight="fill" />
                      <Text style={[styles.blockerTitle, { color: colors.statusMauvais }]}>
                        {"Point bloquant"}
                      </Text>
                    </View>
                    <Text style={[styles.blockerDescription, { color: colors.textPrimary }]}>
                      {practice.descriptionFr ?? practice.label}
                    </Text>
                    {practice.dossierId && (
                      <Pressable
                        style={styles.dossierLink}
                        accessibilityRole="link"
                        accessibilityLabel={`Voir dossier ${practice.dossierId}`}
                      >
                        <LinkIcon size={14} color={colors.primary} />
                        <Text style={[styles.dossierLinkText, { color: colors.primary }]}>
                          {`Voir dossier ${practice.dossierId}`}
                        </Text>
                      </Pressable>
                    )}
                    {/* Score chip */}
                    <View style={[styles.practiceScoreChip, { backgroundColor: getVerdictBgColor(scoreToVerdictLevel(practice.score), isDark) }]}>
                      <Text style={[styles.practiceScoreText, { color: getVerdictColor(scoreToVerdictLevel(practice.score)) }]}>
                        {`Votre ecole (${halalReport.madhabApplied}): score ${practice.score}`}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}

              {/* Positive points */}
              {data?.certifierPractices?.filter((p: CertifierPractice) => !p.isBlocker && p.verdict === "halal").length > 0 && (
                <View style={[styles.positiveSection, { backgroundColor: isDark ? "rgba(34,197,94,0.06)" : "rgba(34,197,94,0.04)" }]}>
                  {data.certifierPractices.filter((p: CertifierPractice) => !p.isBlocker && p.verdict === "halal").map((practice: CertifierPractice) => (
                    <View key={practice.id} style={styles.positiveRow}>
                      <CheckCircleIcon size={18} color={colors.statusExcellent} weight="fill" />
                      <Text style={[styles.positiveText, { color: colors.textPrimary }]} numberOfLines={2}>
                        {practice.label}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Context: other madhab scores */}
              {halalReport.madhabDivergence && data?.certifierTrustScores && (
                <View style={styles.contextRow}>
                  <Text style={[styles.contextText, { color: colors.textSecondary }]}>
                    {`Pour un Shafi'i: Trust ${data.certifierTrustScores.trustScoreShafii}`}
                  </Text>
                </View>
              )}

              {/* CTAs */}
              <View style={styles.ctaRow}>
                <Pressable
                  style={[styles.ctaPrimary, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)" }]}
                  onPress={() => setShowCertifierSheet(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Voir le profil certifieur"
                >
                  <Text style={[styles.ctaText, { color: colors.textPrimary }]}>
                    {"Voir le profil certifieur"}
                  </Text>
                  <CaretRightIcon size={16} color={colors.textSecondary} />
                </Pressable>

                <Pressable
                  style={[styles.ctaSecondary, { backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)" }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Analyse ingredients: ${halalReport.signals.length} alerte${halalReport.signals.length !== 1 ? "s" : ""}`}
                >
                  <Text style={[styles.ctaText, { color: colors.textSecondary }]}>
                    {`Analyse ingredients: ${halalReport.signals.length} alerte${halalReport.signals.length !== 1 ? "s" : ""}`}
                  </Text>
                </Pressable>
              </View>
            </>
          )}

          {/* ════════════════════════════════════════════
              ANALYZED TRACK
             ════════════════════════════════════════════ */}
          {!isCertifiedTrack && (
            <>
              {/* Madhab selector */}
              <View style={styles.madhabSelectorRow}>
                <Text style={[styles.madhabSelectorLabel, { color: colors.textSecondary }]}>
                  {"Ecole:"}
                </Text>
                <Pressable style={[styles.madhabChip, { borderBottomColor: verdictColor }]}>
                  <Text style={[styles.madhabChipText, { color: colors.textPrimary }]}>
                    {halalReport.madhabApplied === "general" ? "General" : halalReport.madhabApplied.charAt(0).toUpperCase() + halalReport.madhabApplied.slice(1)}
                  </Text>
                  <CaretDownIcon size={14} color={colors.textSecondary} />
                </Pressable>
              </View>

              {/* Signal Cards */}
              {halalReport.signals.map((signal, idx) => (
                <Pressable
                  key={signal.substanceId}
                  onPress={() => handleSignalPress(signal)}
                  accessibilityRole="button"
                  accessibilityLabel={signal.displayName}
                >
                  <Animated.View
                    entering={FadeInUp.delay(staggerDelay(idx + 2)).springify().damping(springNaqiy.damping).stiffness(springNaqiy.stiffness).mass(springNaqiy.mass)}
                    style={[styles.signalCard, { backgroundColor: innerCardBg }]}
                  >
                    <View style={styles.signalIconContainer}>
                      <SignalIcon icon={signal.icon} size={24} color={getVerdictColor(verdictToLevel(signal.verdict))} />
                    </View>
                    <View style={styles.signalContent}>
                      <Text style={[styles.signalName, { color: colors.textPrimary }]} numberOfLines={1}>
                        {signal.displayName}
                      </Text>
                      <Text style={[styles.signalRationale, { color: colors.textSecondary }]} numberOfLines={1}>
                        {signal.rationaleFr}
                      </Text>
                      {signal.fatwaCount > 0 && (
                        <Text style={[styles.signalFatwaCount, { color: colors.textMuted }]}>
                          {`${signal.fatwaCount} fatwas`}
                        </Text>
                      )}
                    </View>
                    <View style={[styles.signalScoreBadge, { backgroundColor: getVerdictBgColor(verdictToLevel(signal.verdict), isDark) }]}>
                      <Text style={[styles.signalScoreText, { color: getVerdictColor(verdictToLevel(signal.verdict)) }]}>
                        {formatScore(signal.score)}
                      </Text>
                    </View>
                  </Animated.View>
                </Pressable>
              ))}

              {/* CTAs for analyzed track */}
              <View style={styles.ctaRow}>
                <Pressable
                  style={[styles.ctaPrimary, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)" }]}
                  accessibilityRole="button"
                  accessibilityLabel="Voir l'analyse complete"
                >
                  <Text style={[styles.ctaText, { color: colors.textPrimary }]}>
                    {"Voir l'analyse complete"}
                  </Text>
                  <CaretRightIcon size={16} color={colors.textSecondary} />
                </Pressable>
              </View>
            </>
          )}
        </Animated.View>

        {/* ════════════════════════════════════════════════════
            BOYCOTT ALERT (if applicable)
           ════════════════════════════════════════════════════ */}
        {data?.boycott && (
          <Animated.View
            entering={FadeInUp.delay(staggerDelay(4)).springify().damping(springNaqiy.damping).stiffness(springNaqiy.stiffness).mass(springNaqiy.mass)}
            style={styles.sectionContainer}
          >
            <BoycottAlertCard data={data.boycott} />
          </Animated.View>
        )}

        {/* ════════════════════════════════════════════════════
            HEALTH CARD
           ════════════════════════════════════════════════════ */}
        {data?.healthSummary && (
          <Animated.View
            entering={FadeInUp.delay(staggerDelay(5)).springify().damping(springNaqiy.damping).stiffness(springNaqiy.stiffness).mass(springNaqiy.mass)}
            style={[styles.card, { backgroundColor: cardBg }, EDITORIAL_SHADOW]}
          >
            <View style={styles.cardHeader}>
              <HeartIcon size={22} color={colors.primary} weight="fill" />
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                {isCertifiedTrack ? "Health Assessment" : "Profil Nutritionnel"}
              </Text>
            </View>

            {/* Nutri-Score + NOVA row */}
            <View style={styles.healthBadgesRow}>
              {data.healthSummary.nutriScore && (
                <View style={[styles.healthBadge, { backgroundColor: getNutriScoreColor(data.healthSummary.nutriScore) }]}>
                  <Text style={styles.healthBadgeLabel}>{"Nutri-Score"}</Text>
                  <Text style={styles.healthBadgeValue}>{data.healthSummary.nutriScore.toUpperCase()}</Text>
                </View>
              )}
              {data.healthSummary.novaGroup && (
                <View style={[styles.healthBadge, { backgroundColor: getNovaColor(data.healthSummary.novaGroup) }]}>
                  <Text style={styles.healthBadgeLabel}>{"NOVA"}</Text>
                  <Text style={styles.healthBadgeValue}>{`${data.healthSummary.novaGroup}`}</Text>
                </View>
              )}
            </View>

            {/* Health grid (for analyzed track) */}
            {!isCertifiedTrack && (
              <View style={styles.healthGrid}>
                <View style={[styles.healthGridItem, { backgroundColor: innerCardBg }]}>
                  <Text style={[styles.healthGridValue, { color: colors.textPrimary }]}>
                    {`${data.healthSummary.additivesCount}`}
                  </Text>
                  <Text style={[styles.healthGridLabel, { color: colors.textSecondary }]}>
                    {"Additifs"}
                  </Text>
                </View>
                {data.healthSummary.additivesHalalRelevant.length > 0 && (
                  <View style={[styles.healthGridItem, { backgroundColor: isDark ? "rgba(239,68,68,0.08)" : "rgba(239,68,68,0.05)" }]}>
                    <Text style={[styles.healthGridValue, { color: colors.statusMauvais }]}>
                      {`${data.healthSummary.additivesHalalRelevant.length}`}
                    </Text>
                    <Text style={[styles.healthGridLabel, { color: colors.textSecondary }]}>
                      {"Pertinence halal"}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Cross-reference note for certified track */}
            {isCertifiedTrack && data.healthSummary.additivesHalalRelevant.length > 0 && (
              <Text style={[styles.healthCrossRef, { color: colors.textSecondary }]}>
                {`${data.healthSummary.additivesHalalRelevant.length} additif(s) a pertinence halal: ${data.healthSummary.additivesHalalRelevant.join(", ")}`}
              </Text>
            )}
          </Animated.View>
        )}

        {/* ════════════════════════════════════════════════════
            PERSONAL ALERTS — Emerald dark card
           ════════════════════════════════════════════════════ */}
        <Animated.View
          entering={FadeInUp.delay(staggerDelay(6)).springify().damping(springNaqiy.damping).stiffness(springNaqiy.stiffness).mass(springNaqiy.mass)}
          style={[styles.card, { backgroundColor: isDark ? "#0d2818" : "#064e3b" }, EDITORIAL_SHADOW]}
        >
          <View style={styles.personalAlertHeader}>
            <LockIcon size={22} color="#34d399" weight="fill" />
            <Text style={[styles.personalAlertTitle, { color: "#ecfdf5" }]}>
              {"Alertes Personnalisees"}
            </Text>
          </View>

          {data?.personalAlerts && data.personalAlerts.length > 0 ? (
            data.personalAlerts.map((alert, idx) => (
              <View key={idx} style={styles.personalAlertItem}>
                <WarningIcon
                  size={16}
                  color={alert.severity === "high" ? "#fca5a5" : alert.severity === "medium" ? "#fcd34d" : "#6ee7b7"}
                  weight="fill"
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.personalAlertItemTitle, { color: "#ecfdf5" }]}>
                    {alert.title}
                  </Text>
                  <Text style={[styles.personalAlertItemDesc, { color: "#a7f3d0" }]} numberOfLines={2}>
                    {alert.description}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={[styles.personalAlertEmpty, { color: "#a7f3d0" }]}>
              {"Configurez votre profil pour recevoir des alertes personnalisees (allergenes, grossesse, regime)."}
            </Text>
          )}

          <Pressable
            style={styles.personalAlertCta}
            onPress={() => router.push("/profile" as any)}
            accessibilityRole="button"
            accessibilityLabel="Configurer le profil"
          >
            <Text style={styles.personalAlertCtaText}>
              {"Configurer le profil"}
            </Text>
            <CaretRightIcon size={16} color="#064e3b" />
          </Pressable>
        </Animated.View>

        {/* ════════════════════════════════════════════════════
            DRILL-DOWN TABS (Analyzed track only) — inline
           ════════════════════════════════════════════════════ */}
        {!isCertifiedTrack && halalReport.hasFullDossier && (
          <Animated.View
            entering={FadeInUp.delay(staggerDelay(7)).springify().damping(springNaqiy.damping).stiffness(springNaqiy.stiffness).mass(springNaqiy.mass)}
            style={[styles.card, { backgroundColor: cardBg }, EDITORIAL_SHADOW]}
          >
            {/* Tab bar */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.drillTabBar}
              bounces={false}
            >
              {DRILL_DOWN_TABS.map((tab, idx) => (
                <Pressable
                  key={tab}
                  onPress={() => setActiveDrillTab(idx)}
                  style={[
                    styles.drillTab,
                    activeDrillTab === idx && { borderBottomColor: verdictColor, borderBottomWidth: 2 },
                  ]}
                  accessibilityRole="tab"
                  accessibilityLabel={tab}
                  accessibilityState={{ selected: activeDrillTab === idx }}
                >
                  <Text
                    style={[
                      styles.drillTabText,
                      { color: activeDrillTab === idx ? colors.textPrimary : colors.textMuted },
                      activeDrillTab === idx && { fontWeight: fontWeight.bold },
                    ]}
                  >
                    {tab}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Tab content placeholder */}
            <View style={styles.drillTabContent}>
              {activeDrillTab === 0 && (
                <View style={styles.drillTabPane}>
                  {/* Arabic verdict */}
                  {halalReport.headlineAr && (
                    <Text style={[styles.drillArabicText, { color: colors.textPrimary }]}>
                      {halalReport.headlineAr}
                    </Text>
                  )}
                  {/* English headline */}
                  {halalReport.headlineEn && (
                    <Text style={[styles.drillEnglishText, { color: colors.textSecondary }]}>
                      {halalReport.headlineEn}
                    </Text>
                  )}
                  {/* French technical */}
                  <Text style={[styles.drillFrenchText, { color: colors.textPrimary }]}>
                    {halalReport.headlineFr}
                  </Text>
                </View>
              )}
              {activeDrillTab === 1 && (
                <View style={styles.drillTabPane}>
                  <Text style={[styles.drillPlaceholder, { color: colors.textMuted }]}>
                    {"Comparaison des 4 madhabs — bientot disponible"}
                  </Text>
                </View>
              )}
              {activeDrillTab === 2 && (
                <View style={styles.drillTabPane}>
                  <Text style={[styles.drillPlaceholder, { color: colors.textMuted }]}>
                    {`${halalReport.signals.reduce((sum, s) => sum + s.fatwaCount, 0)} fatwas referencies — detail bientot disponible`}
                  </Text>
                </View>
              )}
              {activeDrillTab === 3 && (
                <View style={styles.drillTabPane}>
                  <Text style={[styles.drillPlaceholder, { color: colors.textMuted }]}>
                    {"Analyse technique detaillee — bientot disponible"}
                  </Text>
                </View>
              )}
              {activeDrillTab === 4 && (
                <View style={styles.drillTabPane}>
                  <Text style={[styles.drillPlaceholder, { color: colors.textMuted }]}>
                    {`Source: ${halalReport.analysisSourceLabel} · Engine ${halalReport.engineVersion}`}
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* ════════════════════════════════════════════════════
            ALTERNATIVES RAIL
           ════════════════════════════════════════════════════ */}
        {data?.alternatives && data.alternatives.length > 0 && (
          <Animated.View
            entering={FadeInUp.delay(staggerDelay(8)).springify().damping(springNaqiy.damping).stiffness(springNaqiy.stiffness).mass(springNaqiy.mass)}
            style={styles.sectionContainer}
          >
            <AlternativesRail
              alternatives={data.alternatives}
              onProductPress={handleAlternativePress}
            />
          </Animated.View>
        )}
      </Animated.ScrollView>

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

// ── Signal Icon Helper ──

function SignalIcon({ icon, size, color }: { icon: SubstanceIcon; size: number; color: string }) {
  switch (icon) {
    case "insect":
      return <BugIcon size={size} color={color} weight="fill" />;
    case "enzyme":
      return <FlaskIcon size={size} color={color} weight="fill" />;
    case "animal":
      return <PawPrintIcon size={size} color={color} weight="fill" />;
    case "alcohol":
      return <FlaskIcon size={size} color={color} weight="fill" />;
    default:
      return <ScalesIcon size={size} color={color} weight="fill" />;
  }
}

// ── Styles ──

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  // ── Glass AppBar ──
  appBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  appBarContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 56,
    paddingHorizontal: spacing.xl,
  },
  appBarButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  appBarTitle: {
    ...textStyles.h4,
    textAlign: "center",
  },

  // ── Hero Section ──
  heroSection: {
    alignItems: "center",
    paddingHorizontal: spacing["3xl"],
    paddingBottom: spacing["3xl"],
    gap: spacing.lg,
  },
  heroImageContainer: {
    alignItems: "center",
  },
  heroImageWrapper: {
    width: HERO_IMAGE_SIZE,
    height: HERO_IMAGE_SIZE,
    borderRadius: CARD_RADIUS,
    borderWidth: 3,
    padding: 8,
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
  },
  heroImagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  heroProductName: {
    ...textStyles.h2,
    textAlign: "center",
  },
  heroBrand: {
    ...textStyles.bodySmall,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  communityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  communityText: {
    ...textStyles.caption,
  },

  // ── Cards (shared) ──
  card: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    borderRadius: CARD_RADIUS,
    padding: spacing["2xl"],
    gap: spacing.xl,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  cardTitle: {
    ...textStyles.h3,
  },
  sectionContainer: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
  },

  // ── Status Row ──
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  statusLabel: {
    ...textStyles.h3,
    fontFamily: headingFontFamily.extraBold,
    fontWeight: fontWeight.extraBold,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  scoreBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  scoreBadgeText: {
    ...textStyles.bodySmall,
    fontFamily: headingFontFamily.bold,
    fontWeight: fontWeight.bold,
  },

  // ── Headline ──
  headlineFr: {
    ...textStyles.body,
  },

  // ── Certifier Section (Certified Track) ──
  certifierSection: {
    borderRadius: INNER_CARD_RADIUS,
    padding: spacing.xl,
  },
  certifierRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xl,
  },
  certifierInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  certifierNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  certifierName: {
    ...textStyles.h4,
    flex: 1,
  },
  certifierMeta: {
    ...textStyles.bodySmall,
  },
  certifierTrustLabel: {
    ...textStyles.caption,
  },
  trustGradeText: {
    fontFamily: headingFontFamily.bold,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.bodySmall,
  },

  // ── Blocker Card ──
  blockerCard: {
    borderRadius: INNER_CARD_RADIUS,
    flexDirection: "row",
    overflow: "hidden",
  },
  blockerBorder: {
    width: 4,
  },
  blockerContent: {
    flex: 1,
    padding: spacing.xl,
    gap: spacing.md,
  },
  blockerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  blockerTitle: {
    ...textStyles.h4,
  },
  blockerDescription: {
    ...textStyles.bodySmall,
  },
  dossierLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  dossierLinkText: {
    ...textStyles.bodySmall,
    fontWeight: fontWeight.semiBold,
  },
  practiceScoreChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    alignSelf: "flex-start",
    marginTop: spacing.xs,
  },
  practiceScoreText: {
    ...textStyles.caption,
    fontWeight: fontWeight.bold,
  },

  // ── Positive Section ──
  positiveSection: {
    borderRadius: INNER_CARD_RADIUS,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  positiveRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.lg,
  },
  positiveText: {
    ...textStyles.bodySmall,
    flex: 1,
  },

  // ── Context Row ──
  contextRow: {
    paddingHorizontal: spacing.xs,
  },
  contextText: {
    ...textStyles.caption,
    fontStyle: "italic",
  },

  // ── CTAs ──
  ctaRow: {
    gap: spacing.md,
  },
  ctaPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: INNER_CARD_RADIUS,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg + 2,
  },
  ctaSecondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: INNER_CARD_RADIUS,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  ctaText: {
    ...textStyles.bodySmall,
    fontWeight: fontWeight.semiBold,
  },

  // ── Madhab Selector (Analyzed Track) ──
  madhabSelectorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  madhabSelectorLabel: {
    ...textStyles.bodySmall,
  },
  madhabChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingBottom: spacing.xs,
    borderBottomWidth: 2,
  },
  madhabChipText: {
    ...textStyles.body,
    fontWeight: fontWeight.semiBold,
  },

  // ── Signal Cards (Analyzed Track) ──
  signalCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: INNER_CARD_RADIUS,
    padding: spacing.xl,
    gap: spacing.xl,
  },
  signalIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  signalContent: {
    flex: 1,
    gap: spacing["2xs"],
  },
  signalName: {
    ...textStyles.h4,
  },
  signalRationale: {
    ...textStyles.caption,
  },
  signalFatwaCount: {
    ...textStyles.caption,
  },
  signalScoreBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    minWidth: 40,
    alignItems: "center",
  },
  signalScoreText: {
    ...textStyles.bodySmall,
    fontFamily: headingFontFamily.bold,
    fontWeight: fontWeight.bold,
  },

  // ── Health Card ──
  healthBadgesRow: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  healthBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
  },
  healthBadgeLabel: {
    ...textStyles.caption,
    color: "#ffffff",
    fontWeight: fontWeight.semiBold,
  },
  healthBadgeValue: {
    ...textStyles.h3,
    color: "#ffffff",
    fontWeight: fontWeight.bold,
  },
  healthGrid: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  healthGridItem: {
    flex: 1,
    borderRadius: INNER_CARD_RADIUS,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.xs,
  },
  healthGridValue: {
    ...textStyles.h2,
  },
  healthGridLabel: {
    ...textStyles.caption,
  },
  healthCrossRef: {
    ...textStyles.caption,
    fontStyle: "italic",
  },

  // ── Personal Alerts ──
  personalAlertHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  personalAlertTitle: {
    ...textStyles.h3,
  },
  personalAlertItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.lg,
  },
  personalAlertItemTitle: {
    ...textStyles.bodySmall,
    fontWeight: fontWeight.semiBold,
  },
  personalAlertItemDesc: {
    ...textStyles.caption,
    marginTop: spacing["2xs"],
  },
  personalAlertEmpty: {
    ...textStyles.bodySmall,
    lineHeight: 22,
  },
  personalAlertCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    backgroundColor: "#34d399",
    borderRadius: INNER_CARD_RADIUS,
    paddingVertical: spacing.lg + 2,
  },
  personalAlertCtaText: {
    ...textStyles.body,
    fontWeight: fontWeight.bold,
    color: "#064e3b",
  },

  // ── Drill-down Tabs ──
  drillTabBar: {
    flexDirection: "row",
    gap: spacing.xl,
    paddingBottom: spacing.md,
  },
  drillTab: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  drillTabText: {
    ...textStyles.bodySmall,
    fontWeight: fontWeight.medium,
  },
  drillTabContent: {
    minHeight: 120,
  },
  drillTabPane: {
    gap: spacing.lg,
  },
  drillArabicText: {
    ...textStyles.h3,
    fontWeight: fontWeight.bold,
    textAlign: "right",
    writingDirection: "rtl",
  },
  drillEnglishText: {
    ...textStyles.bodySmall,
    fontStyle: "italic",
  },
  drillFrenchText: {
    ...textStyles.body,
  },
  drillPlaceholder: {
    ...textStyles.bodySmall,
    textAlign: "center",
    paddingVertical: spacing["4xl"],
  },
});
