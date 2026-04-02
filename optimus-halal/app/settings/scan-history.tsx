/**
 * Scan History Screen — "Journal de Transparence"
 *
 * Each card mirrors the scan-result hero:
 * - MadhabScoreRing (same component) with per-madhab trust score
 * - CertifierLogo badge with name
 * - Status-tinted gradient background (same palette as hero)
 *
 * Philosophy (Ch00 Al-Niyyah, Principe 5):
 *   "Naqiy est un outil d'information, pas un tribunal religieux."
 *   No "Halal"/"Haram" text labels. Color + icon INFORM.
 */

import React, { useMemo, useCallback } from "react";
import { View, Text, StyleSheet, Platform, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { CloudSlashIcon, PackageIcon } from "phosphor-react-native";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { useScanHistory, useMe, usePremium } from "@/hooks";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { trpc } from "@/lib/trpc";
import { EmptyState, PremiumBackground } from "@/components/ui";
import { BackButton } from "@/components/ui/BackButton";
import { PremiumGate } from "@/components/ui/PremiumGate";
import { PressableScale } from "@/components/ui/PressableScale";
import { useLocalScanHistoryStore, useFeatureFlagsStore } from "@/store";
import { isAuthenticated as hasStoredTokens } from "@/services/api";
import { MadhabScoreRing } from "@/components/scan/MadhabScoreRing";
import { CertifierLogo } from "@/components/scan/CertifierLogo";
import { NaqiyGradeBadge, getTrustGradeFromScore } from "@/components/scan/NaqiyGradeBadge";
import { halalStatus as halalStatusTokens, gold } from "@/theme/colors";
import { AppIcon, type IconName } from "@/lib/icons";


const LOCALE_MAP: Record<string, string> = { fr: "fr-FR", en: "en-US", ar: "ar-SA" };

// eslint-disable-next-line @typescript-eslint/no-var-requires
const NAQIY_LOGO = require("../../assets/images/logo_naqiy.webp");

function formatDate(date: string | Date, t: ReturnType<typeof useTranslation>["t"], locale: string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffH = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return t.alerts.timeAgoJustNow;
  if (diffMin < 60) return t.alerts.timeAgoMinutes.replace("{{count}}", String(diffMin));
  if (diffH < 24) return t.alerts.timeAgoHours.replace("{{count}}", String(diffH));
  if (diffDays < 7) return t.alerts.timeAgoDays.replace("{{count}}", String(diffDays));
  return d.toLocaleDateString(locale, { day: "numeric", month: "short" });
}

// ── Analysis verdict config per status ──
const ANALYSIS_CONFIG: Record<string, { icon: IconName; color: string; key: "analysisHalal" | "analysisHaram" | "analysisDoubtful" | "analysisUnknown" }> = {
  halal: { icon: "check-circle", color: halalStatusTokens.halal.base, key: "analysisHalal" },
  haram: { icon: "cancel", color: halalStatusTokens.haram.base, key: "analysisHaram" },
  doubtful: { icon: "warning", color: halalStatusTokens.doubtful.base, key: "analysisDoubtful" },
  unknown: { icon: "help-outline", color: halalStatusTokens.unknown.base, key: "analysisUnknown" },
};

// ── Status config — same gradients as scan-result hero ──
type HalalStatus = "halal" | "haram" | "doubtful" | "unknown";

interface StatusVisualConfig {
  icon: IconName;
  color: string;
  gradientDark: readonly [string, string, string];
  gradientLight: readonly [string, string, string];
}

const STATUS_CONFIG: Record<HalalStatus, StatusVisualConfig> = {
  halal: {
    icon: "check",
    color: halalStatusTokens.halal.base,
    gradientDark: ["#0a1a10", "#0f2418", "#132a1a"],
    gradientLight: ["#ecfdf5", "#d1fae5", "#a7f3d0"],
  },
  haram: {
    icon: "close",
    color: halalStatusTokens.haram.base,
    gradientDark: ["#1a0a0a", "#221111", "#2a1313"],
    gradientLight: ["#fef2f2", "#fecaca", "#fca5a5"],
  },
  doubtful: {
    icon: "help",
    color: halalStatusTokens.doubtful.base,
    gradientDark: ["#1a140a", "#221b11", "#2a1f13"],
    gradientLight: ["#fff7ed", "#fed7aa", "#fdba74"],
  },
  unknown: {
    icon: "help-outline",
    color: halalStatusTokens.unknown.base,
    gradientDark: ["#0f0f0f", "#151515", "#1a1a1a"],
    gradientLight: ["#f8fafc", "#e2e8f0", "#cbd5e1"],
  },
};

// ── Madhab trust score key mapping ──
const MADHAB_SCORE_KEY = {
  hanafi: "trustScoreHanafi",
  shafii: "trustScoreShafii",
  maliki: "trustScoreMaliki",
  hanbali: "trustScoreHanbali",
} as const;

const MADHAB_LABEL = {
  hanafi: "Hanafi",
  shafii: "Shafi'i",
  maliki: "Maliki",
  hanbali: "Hanbali",
} as const;

// Display names — same mapping as ProductFavoriteCard
const CERTIFIER_SHORT: Record<string, string> = {
  achahada: "Achahada",
  "acmif-mosquee-d-evry": "ACMIF - Mosquée d'Évry-Courcouronnes",
  afcai: "AFCAI",
  alamane: "Alamane",
  altakwa: "Al-Takwa",
  "argml-mosquee-de-lyon": "ARGML - Mosquée de Lyon",
  arrissala: "Arrissala",
  "avs-a-votre-service": "AVS - À Votre Service",
  "european-halal-trust": "European Halal Trust",
  "halal-correct": "Halal Correct",
  "halal-monitoring-committee": "HMC",
  "halal-polska": "Halal Polska",
  "halal-services": "Halal Services",
  "islamic-centre-aachen": "ICA - Aachen",
  "khalis-halal": "Khalis Halal",
  "muslim-conseil-international-mci": "MCI",
  "sfcvh-mosquee-de-paris": "SFCVH - Mosquée de Paris",
  sidq: "SIDQ",
};

function getCertifierDisplayName(certifierId: string): string {
  return CERTIFIER_SHORT[certifierId] ?? certifierId.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}



// ── Types ─────────────────────────────────────────

interface CertifierScores {
  trustScore: number | null;
  trustScoreHanafi: number | null;
  trustScoreShafii: number | null;
  trustScoreMaliki: number | null;
  trustScoreHanbali: number | null;
}

interface ScanItem {
  id: string;
  barcode: string;
  halalStatus: string | null;
  confidenceScore: number | null;
  scannedAt: Date;
  product: {
    id: string;
    name: string;
    brand: string | null;
    imageUrl: string | null;
    category: string | null;
    halalStatus: string | null;
    confidenceScore: number | null;
    certifierId: string | null;
    certifierName: string | null;
  } | null;
  certifier: CertifierScores | null;
}

// ── Scan Row Component ────────────────────────────

interface ScanRowProps {
  item: ScanItem;
  index: number;
  isDark: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
  t: ReturnType<typeof useTranslation>["t"];
  language: string;
  userMadhab: string;
}

const ScanRow = React.memo(function ScanRow({ item, index, isDark, colors, t, language, userMadhab }: ScanRowProps) {
  const locale = LOCALE_MAP[language] ?? "fr-FR";
  // Use product.halalStatus (always up-to-date) over scan.halalStatus (frozen at scan time)
  const status = ((item.product?.halalStatus ?? item.halalStatus) ?? "unknown") as HalalStatus;
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.unknown;
  const gradientColors = isDark ? config.gradientDark : config.gradientLight;
  const certifierId = item.product?.certifierId ?? null;
  const certifierName = item.product?.certifierName ?? null;

  // Resolve per-madhab trust score (same logic as scan-result.tsx)
  const trustScore = useMemo(() => {
    if (!item.certifier) return null;
    if (userMadhab !== "general" && userMadhab in MADHAB_SCORE_KEY) {
      return item.certifier[MADHAB_SCORE_KEY[userMadhab as keyof typeof MADHAB_SCORE_KEY]] ?? item.certifier.trustScore;
    }
    return item.certifier.trustScore;
  }, [item.certifier, userMadhab]);

  // Effective hero status: downgrade halal → doubtful if trust < 70
  const effectiveStatus: HalalStatus =
    status === "halal" && trustScore !== null && trustScore < 70
      ? "doubtful"
      : status;
  const effectiveConfig = STATUS_CONFIG[effectiveStatus] ?? STATUS_CONFIG.unknown;
  const analysisConfig = ANALYSIS_CONFIG[status] ?? ANALYSIS_CONFIG.unknown;
  const effectiveGradient = isDark ? effectiveConfig.gradientDark : effectiveConfig.gradientLight;

  const gradeLabel = trustScore != null ? getTrustGradeFromScore(trustScore).label : null;
  const madhabLabel = userMadhab !== "general" && userMadhab in MADHAB_LABEL
    ? MADHAB_LABEL[userMadhab as keyof typeof MADHAB_LABEL]
    : "";

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index * 60, 400)).duration(400)}>
      <PressableScale
        onPress={() => router.push(`/scan-result?barcode=${item.barcode}&viewOnly=1`)}
        accessibilityRole="button"
        accessibilityLabel={`${item.product?.name ?? item.barcode}`}
        style={styles.rowOuter}
      >
        <View
          style={[
            styles.rowCard,
            {
              borderColor: isDark
                ? `${effectiveConfig.color}20`
                : `${effectiveConfig.color}15`,
            },
          ]}
        >
          {/* L0: Status gradient background — same as scan-result hero */}
          <LinearGradient
            colors={[...effectiveGradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* L1: Glass overlay for depth */}
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: isDark
                  ? "rgba(12,12,12,0.55)"
                  : "rgba(255,255,255,0.45)",
              },
            ]}
          />

          {/* ── Left accent line (status color) ── */}
          <View
            style={[
              styles.accentLine,
              { backgroundColor: `${effectiveConfig.color}${isDark ? "60" : "40"}` },
            ]}
          />

          {/* ── Product Image ── */}
          <View
            style={[
              styles.imageBox,
              {
                backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.8)",
                borderColor: isDark
                  ? `${effectiveConfig.color}20`
                  : `${effectiveConfig.color}12`,
              },
            ]}
          >
            {item.product?.imageUrl ? (
              <Image
                source={{ uri: item.product.imageUrl }}
                style={styles.imageFill}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <PackageIcon size={20}
                color={isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"} />
            )}
          </View>

          {/* ── Product Info ── */}
          <View style={styles.infoColumn}>
            <Text
              style={[styles.productName, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {item.product?.name ?? t.scanHistory.unknownProduct}
            </Text>
            {/* 2. Marque · Date */}
            <View style={styles.metaRow}>
              {item.product?.brand && (
                <>
                  <Text style={[styles.brandText, { color: colors.textSecondary }]} numberOfLines={1}>
                    {item.product.brand}
                  </Text>
                  <View style={[styles.dot, { backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)" }]} />
                </>
              )}
              <Text style={[styles.dateText, { color: colors.textMuted }]}>
                {formatDate(item.scannedAt, t, locale)}
              </Text>
            </View>

            {/* 3. 🌿 Analyse Naqiy : */}
            <View style={styles.analyseNaqiyRow}>
              <Image source={NAQIY_LOGO} style={styles.naqiyLogo} contentFit="contain" />
              <Text style={[styles.analyseNaqiyText, { color: gold[500] }]}>
                Analyse Naqiy :
              </Text>
            </View>

            {/* 4. Certifieur : 🏷 Nom (only if certified) */}
            {certifierId && (
              <View style={styles.certifierNameRow}>
                <Text style={[styles.italicLabel, { color: colors.textMuted }]}>
                  Certifieur :
                </Text>
                <CertifierLogo certifierId={certifierId} size={14} fallbackColor={effectiveConfig.color} />
                <Text style={[styles.certifierShort, { color: colors.textPrimary }]} numberOfLines={1}>
                  {getCertifierDisplayName(certifierId)}
                </Text>
              </View>
            )}

            {/* 5. ①②③④⑤ Vigilance + Adjectif (only if trustScore) */}
            {trustScore != null && (
              <View style={styles.gradeRow}>
                <NaqiyGradeBadge variant="strip" grade={getTrustGradeFromScore(trustScore)} showLabel={false} showLogo={false} />
                {gradeLabel && (
                  <Text style={[styles.gradeAdjectif, { color: getTrustGradeFromScore(trustScore).color }]}>
                    {gradeLabel}
                  </Text>
                )}
              </View>
            )}

            {/* 6. Composition : ✓ conforme */}
            <View style={styles.compositionRow}>
              <Text style={[styles.italicLabel, { color: colors.textMuted }]}>
                Composition :
              </Text>
              <AppIcon name={analysisConfig.icon} size={10} color={analysisConfig.color} />
              <Text style={[styles.compositionText, { color: analysisConfig.color }]} numberOfLines={1}>
                {t.scanHistory[analysisConfig.key]}
              </Text>
            </View>
          </View>

          {/* ── MadhabScoreRing — score number in center ── */}
          <MadhabScoreRing
            label={madhabLabel}
            verdict={effectiveStatus}
            trustScore={trustScore}
            staggerIndex={index}
            showScore
          />
        </View>
      </PressableScale>
    </Animated.View>
  );
});

const scanKeyExtractor = (item: ScanItem) => item.id;

// ── Main Screen ───────────────────────────────────

export default function ScanHistoryScreen() {
  const { isDark, colors } = useTheme();
  const { t, language } = useTranslation();

  // ── Guest detection ──
  const hasTokens = hasStoredTokens();
  const meQuery = useMe({ enabled: hasTokens });
  const me = meQuery.data;
  const isGuest = !me && (!hasTokens || meQuery.isError);

  // ── Cloud history (Naqiy+ only) ──
  const { data, isLoading, isError, refetch } = useScanHistory({ limit: 50, enabled: !!me });
  const { data: userProfile } = trpc.profile.getProfile.useQuery(undefined, { enabled: !!me });

  // ── Local history (guests) ──
  const localScans = useLocalScanHistoryStore((s) => s.scans);

  // ── Certifier trust scores for guest enrichment (public, no auth needed) ──
  const certifierRanking = trpc.certifier.ranking.useQuery(undefined, {
    enabled: isGuest && localScans.some((s) => s.certifierId != null),
    staleTime: 1000 * 60 * 60, // 1h cache
  });
  const certifierScoreMap = useMemo(() => {
    const map = new Map<string, number>();
    if (certifierRanking.data) {
      for (const c of certifierRanking.data) {
        map.set(c.id, c.trustScore);
      }
    }
    return map;
  }, [certifierRanking.data]);

  const userMadhab = (userProfile?.madhab as string) ?? "general";

  // Premium gate — free users see only last 3 scans when flag enabled
  const { isPremium } = usePremium();
  const { flags } = useFeatureFlagsStore();
  const FREE_HISTORY_LIMIT = 3;

  // Merge: guests use local, auth users use cloud
  const scans = useMemo(() => {
    let items: ScanItem[];
    if (isGuest) {
      items = localScans.map((s) => ({
        id: s.barcode,
        barcode: s.barcode,
        halalStatus: s.halalStatus,
        confidenceScore: s.confidenceScore,
        scannedAt: new Date(s.scannedAt),
        product: {
          id: s.productId,
          name: s.name,
          brand: s.brand,
          imageUrl: s.imageUrl,
          category: null,
          halalStatus: s.halalStatus,
          confidenceScore: s.confidenceScore,
          certifierId: s.certifierId,
          certifierName: s.certifierName,
        },
        certifier: (() => {
          const score = s.certifierTrustScore ?? (s.certifierId ? certifierScoreMap.get(s.certifierId) ?? null : null);
          return score != null
            ? { trustScore: score, trustScoreHanafi: null, trustScoreShafii: null, trustScoreMaliki: null, trustScoreHanbali: null }
            : null;
        })(),
      })) as ScanItem[];
    } else {
      items = (data?.items ?? []) as ScanItem[];
    }

    // Limit history for free-tier users
    if (flags.scanHistoryLimitEnabled && !isPremium) {
      return items.slice(0, FREE_HISTORY_LIMIT);
    }
    return items;
  }, [isGuest, localScans, data, flags.scanHistoryLimitEnabled, isPremium, certifierScoreMap]);

  const renderItem = useCallback(
    ({ item, index }: { item: ScanItem; index: number }) => (
      <ScanRow
        item={item}
        index={index}
        isDark={isDark}
        colors={colors}
        t={t}
        language={language}
        userMadhab={userMadhab}
      />
    ),
    [isDark, colors, t, language, userMadhab],
  );

  // Loading (only for authenticated users)
  if (!isGuest && isLoading) {
    return (
      <View style={styles.screen}>
        <PremiumBackground />
        <SafeAreaView style={styles.flex}>
          <Header isDark={isDark} colors={colors} t={t} />
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={gold[500]} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t.common.loading}</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Error (only for authenticated users)
  if (!isGuest && isError) {
    return (
      <View style={styles.screen}>
        <PremiumBackground />
        <SafeAreaView style={styles.flex}>
          <Header isDark={isDark} colors={colors} t={t} />
          <View style={[styles.centered, { paddingHorizontal: 32 }]}>
            <View
              style={[
                styles.errorIcon,
                { backgroundColor: isDark ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.06)" },
              ]}
            >
              <CloudSlashIcon size={32} color={isDark ? "#f87171" : "#ef4444"} />
            </View>
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>
              {t.scanHistory.loadError}
            </Text>
            <PressableScale
              onPress={() => refetch()}
              style={styles.retryButton}
              accessibilityRole="button"
              accessibilityLabel={t.common.retry}
            >
              <Text style={styles.retryText}>{t.common.retry}</Text>
            </PressableScale>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <PremiumBackground />
      <SafeAreaView style={styles.flex}>
        <Header isDark={isDark} colors={colors} t={t} count={scans.length} />
        {scans.length === 0 ? (
          <EmptyState
            icon="history"
            title={t.scanHistory.noScans}
            message={isGuest ? t.scanHistory.guestDesc : t.scanHistory.noScansDesc}
            actionLabel={t.scanHistory.scanProduct}
            onAction={() => router.navigate("/(tabs)/scanner")}
          />
        ) : (
          <>
            {isGuest && (
              <Animated.View entering={FadeIn.duration(300)} style={styles.guestBanner}>
                <Text style={[styles.guestBannerText, { color: colors.textSecondary }]}>
                  {t.scanHistory.guestLimit}
                </Text>
              </Animated.View>
            )}
            <FlashList
              data={scans}
              keyExtractor={scanKeyExtractor}
              renderItem={renderItem}
              contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={
                flags.scanHistoryLimitEnabled && !isPremium ? (
                  <PremiumGate feature="scanHistory" trigger="history">
                    <>{/* children never rendered — gate shows upgrade prompt */}</>
                  </PremiumGate>
                ) : null
              }
            />
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

// ── Header Component ──────────────────────────────

function Header({ isDark, colors, t, count }: { isDark: boolean; colors: any; t: any; count?: number }) {
  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
      <View style={styles.headerRow}>
        <BackButton />
        <View style={styles.flex}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]} accessibilityRole="header">
            {t.scanHistory.title}
          </Text>
          {count !== undefined && (
            <View style={styles.headerSubRow}>
              <View style={styles.goldDot} />
              <Text style={[styles.headerCount, { color: `${gold[500]}B3` }]}>
                {(count > 1 ? t.scanHistory.scanCountPlural : t.scanHistory.scanCount).replace(
                  "{{count}}",
                  String(count),
                )}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

// ── Styles ────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },

  // Header
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },
  headerRow: { flexDirection: "row", alignItems: "center" },
  backButton: {
    marginEnd: 14,
  },
  headerTitle: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  headerSubRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 },
  goldDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: gold[500] },
  headerCount: { fontSize: 12, fontWeight: "600" },

  // Guest banner
  guestBanner: { paddingHorizontal: 20, paddingVertical: 8 },
  guestBannerText: { fontSize: 12, textAlign: "center", fontStyle: "italic" },

  // Loading / Error
  loadingText: { marginTop: 12, fontSize: 13 },
  errorIcon: { width: 64, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  errorText: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  retryButton: { marginTop: 20, backgroundColor: gold[500], paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 },
  retryText: { color: "#0C0C0C", fontWeight: "800", fontSize: 14 },

  // Row card
  rowOuter: { marginHorizontal: 16, marginBottom: 10 },
  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    paddingLeft: 0,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },

  // Left accent line
  accentLine: { width: 3, borderRadius: 1.5, alignSelf: "stretch", marginRight: 10 },

  // Image
  imageBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  imageFill: { width: "100%", height: "100%" },

  // Info
  infoColumn: { flex: 1, marginLeft: 10, marginRight: 8 },
  productName: { fontSize: 14, fontWeight: "700", letterSpacing: -0.2 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  brandText: { fontSize: 11, flexShrink: 1 },
  dot: { width: 2.5, height: 2.5, borderRadius: 1.25 },
  dateText: { fontSize: 10 },
  analyseNaqiyRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  analyseNaqiyText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.2 },
  naqiyLogo: { width: 14, height: 14 },
  italicLabel: { fontSize: 10, fontWeight: "500", fontStyle: "italic" },
  certifierNameRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  certifierShort: { fontSize: 10, fontWeight: "700", flexShrink: 1 },
  gradeRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  gradeAdjectif: { fontSize: 10, fontWeight: "700" },
  compositionRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  compositionText: { fontSize: 10, fontWeight: "700", flexShrink: 1 },
});
