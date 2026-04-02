/**
 * ProductFavoriteCard — Premium full-width card mirroring ScanRow design.
 *
 * Layout: [accent | image | info column | MadhabScoreRing]
 * Info: name, brand · StatusPill, certifier trust row (or tier label),
 *       Naqiy composition verdict. Heart unfavorite top-right.
 *
 * Same visual DNA as scan-history ScanRow: status-tinted gradient,
 * accent line, CertifierTrustRow with N١→N٥ grade strip.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { HeartIcon, FlaskIcon, PackageIcon } from "phosphor-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { PressableScale } from "@/components/ui/PressableScale";
import { StatusPill } from "@/components/ui/StatusPill";
import { CertifierTrustRow } from "@/components/scan/CertifierTrustRow";
import { CertifierLogo } from "@/components/scan/CertifierLogo";
import { getTrustGradeFromScore } from "@/components/scan/NaqiyGradeBadge";
import { useTheme, useTranslation, useHaptics } from "@/hooks";
import { halalStatus as statusColors } from "@/theme/colors";
import { AppIcon } from "@/lib/icons";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const NAQIY_LOGO = require("../../../assets/images/logo_naqiy.webp");

export const CARD_WIDTH = "100%";

// ── Status visuals (identical to scan-history) ──────────
type HalalStatus = "halal" | "haram" | "doubtful" | "unknown";

interface StatusVisual {
  color: string;
  gradientDark: readonly [string, string, string];
  gradientLight: readonly [string, string, string];
}

const STATUS_CONFIG: Record<HalalStatus, StatusVisual> = {
  halal: {
    color: statusColors.halal.base,
    gradientDark: ["#0a1a10", "#0f2418", "#132a1a"],
    gradientLight: ["#ecfdf5", "#d1fae5", "#a7f3d0"],
  },
  haram: {
    color: statusColors.haram.base,
    gradientDark: ["#1a0a0a", "#221111", "#2a1313"],
    gradientLight: ["#fef2f2", "#fecaca", "#fca5a5"],
  },
  doubtful: {
    color: statusColors.doubtful.base,
    gradientDark: ["#1a140a", "#221b11", "#2a1f13"],
    gradientLight: ["#fff7ed", "#fed7aa", "#fdba74"],
  },
  unknown: {
    color: statusColors.unknown.base,
    gradientDark: ["#0f0f0f", "#151515", "#1a1a1a"],
    gradientLight: ["#f8fafc", "#e2e8f0", "#cbd5e1"],
  },
};

const ANALYSIS_KEY: Record<string, string> = {
  halal: "analysisHalal",
  haram: "analysisHaram",
  doubtful: "analysisDoubtful",
  unknown: "analysisUnknown",
};

// ── Props ────────────────────────────────────────────────

export interface ProductFavoriteCardProps {
  product: {
    id: string;
    barcode: string;
    name: string;
    brand: string | null;
    imageUrl: string | null;
    halalStatus: string | null;
    category: string | null;
    confidenceScore: number | null;
    certifierName: string | null;
    certifierLogo: string | null;
    certifierId?: string | null;
  };
  /** Certifier trust scores (from certifier.ranking query) */
  certifierScores?: {
    trustScore: number;
    trustScoreHanafi: number | null;
    trustScoreShafii: number | null;
    trustScoreMaliki: number | null;
    trustScoreHanbali: number | null;
  } | null;
  /** User's madhab preference */
  userMadhab?: string;
  index: number;
  onRemove: (productId: string) => void;
}

const MADHAB_SCORE_KEY = {
  hanafi: "trustScoreHanafi",
  shafii: "trustScoreShafii",
  maliki: "trustScoreMaliki",
  hanbali: "trustScoreHanbali",
} as const;


export const ProductFavoriteCard = React.memo(function ProductFavoriteCard({
  product,
  certifierScores,
  userMadhab = "general",
  index,
  onRemove,
}: ProductFavoriteCardProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const { impact, selection } = useHaptics();
  const router = useRouter();

  const status = (product.halalStatus ?? "unknown") as HalalStatus;
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.unknown;
  const gradient = isDark ? config.gradientDark : config.gradientLight;

  const certifierId = product.certifierId ?? null;
  const certifierName = product.certifierName ?? null;

  // Resolve per-madhab trust score (same logic as scan-history)
  const trustScore = (() => {
    if (!certifierScores) return null;
    if (userMadhab !== "general" && userMadhab in MADHAB_SCORE_KEY) {
      const key = MADHAB_SCORE_KEY[userMadhab as keyof typeof MADHAB_SCORE_KEY];
      return certifierScores[key] ?? certifierScores.trustScore;
    }
    return certifierScores.trustScore;
  })();

  // Effective status: downgrade halal → doubtful if trust < 70
  const effectiveStatus: HalalStatus =
    status === "halal" && trustScore !== null && trustScore < 70
      ? "doubtful"
      : status;
  const effectiveConfig = STATUS_CONFIG[effectiveStatus] ?? STATUS_CONFIG.unknown;
  const effectiveGradient = isDark ? effectiveConfig.gradientDark : effectiveConfig.gradientLight;

  // Grade adjective
  const gradeLabel = trustScore != null ? getTrustGradeFromScore(trustScore).label : null;

  const analysisKey = ANALYSIS_KEY[status] ?? ANALYSIS_KEY.unknown;
  const analysisText = (t.scanHistory as Record<string, string>)[analysisKey] ?? "";
  const analysisConfig = {
    halal: { icon: "check-circle" as const, color: statusColors.halal.base },
    haram: { icon: "cancel" as const, color: statusColors.haram.base },
    doubtful: { icon: "warning" as const, color: statusColors.doubtful.base },
    unknown: { icon: "help-outline" as const, color: statusColors.unknown.base },
  }[status] ?? { icon: "help-outline" as const, color: statusColors.unknown.base };

  const handleView = () => {
    impact();
    router.push(`/scan-result?barcode=${product.barcode}&viewOnly=1`);
  };

  const handleRemove = () => {
    selection();
    onRemove(product.id);
  };

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index * 60, 360)).duration(400)}>
      <PressableScale
        onPress={handleView}
        accessibilityRole="button"
        accessibilityLabel={product.name}
        style={styles.outer}
      >
        <View
          style={[
            styles.card,
            {
              borderColor: isDark
                ? `${effectiveConfig.color}20`
                : `${effectiveConfig.color}15`,
            },
          ]}
        >
          {/* L0: Status gradient background */}
          <LinearGradient
            colors={[...effectiveGradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* L1: Glass overlay */}
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

          {/* Accent line */}
          <View
            style={[
              styles.accentLine,
              { backgroundColor: `${effectiveConfig.color}${isDark ? "60" : "40"}` },
            ]}
          />

          {/* Product image */}
          <View
            style={[
              styles.imageBox,
              {
                backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.8)",
                borderColor: isDark ? `${effectiveConfig.color}20` : `${effectiveConfig.color}12`,
              },
            ]}
          >
            {product.imageUrl ? (
              <Image
                source={{ uri: product.imageUrl }}
                style={styles.imageFill}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <PackageIcon size={20} color={isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"} />
            )}
          </View>

          {/* Info column */}
          <View style={styles.infoColumn}>
            {/* Name */}
            <Text
              style={[styles.productName, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {product.name}
            </Text>

            {/* Brand · StatusPill */}
            <View style={styles.metaRow}>
              {product.brand && (
                <>
                  <Text style={[styles.brandText, { color: colors.textSecondary }]} numberOfLines={1}>
                    {product.brand}
                  </Text>
                  <View style={[styles.dot, { backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)" }]} />
                </>
              )}
              <StatusPill status={status} size="sm" animated={false} />
            </View>

            {/* Certifier trust row or tier label */}
            {certifierId && certifierName && trustScore != null ? (
              <View style={styles.certifierBlock}>
                <Text style={[styles.certifiedByLabel, { color: colors.textMuted }]}>
                  {(t.scanHistory as Record<string, string>).certifiedBy ?? "Certification :"}
                </Text>
                <View style={styles.certifierGradeRow}>
                  <CertifierTrustRow
                    variant="inline"
                    certifierId={certifierId}
                    certifierName={certifierName}
                    trustScore={trustScore}
                    showScore={false}
                  />
                  {gradeLabel && (
                    <Text style={[styles.gradeAdjectif, { color: getTrustGradeFromScore(trustScore).color }]}>
                      {gradeLabel}
                    </Text>
                  )}
                </View>
              </View>
            ) : certifierId && certifierName ? (
              <View style={styles.certifierSimpleRow}>
                <CertifierLogo certifierId={certifierId} size={14} fallbackColor={effectiveConfig.color} />
                <Text style={[styles.certifierShort, { color: colors.textSecondary }]} numberOfLines={1}>
                  {certifierName}
                </Text>
              </View>
            ) : (
              <View style={styles.tierRow}>
                <FlaskIcon size={10} color={`${effectiveConfig.color}${isDark ? "90" : "70"}`} />
                <Text style={[styles.tierText, { color: `${effectiveConfig.color}${isDark ? "CC" : "99"}` }]} numberOfLines={1}>
                  {(t.scanHistory as Record<string, string>).tierAnalyzed ?? "Analysé par Naqiy"}
                </Text>
              </View>
            )}

            {/* Naqiy analysis composition row */}
            <View style={styles.analysisRow}>
              <Image source={NAQIY_LOGO} style={styles.naqiyLogo} contentFit="contain" />
              <Text style={[styles.analysisLabel, { color: colors.textMuted }]}>
                {(t.scanHistory as Record<string, string>).analysisLabel ?? "Composition :"}
              </Text>
              <AppIcon name={analysisConfig.icon} size={10} color={analysisConfig.color} />
              <Text style={[styles.analysisText, { color: analysisConfig.color }]} numberOfLines={1}>
                {analysisText}
              </Text>
            </View>
          </View>

          {/* Heart unfavorite — top-right overlay */}
          <PressableScale
            onPress={handleRemove}
            style={styles.heartBtn}
            accessibilityLabel={t.favorites.removeConfirm}
          >
            <View style={[styles.heartCircle, { backgroundColor: isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)" }]}>
              <HeartIcon size={14} color="#ef4444" weight="fill" />
            </View>
          </PressableScale>
        </View>
      </PressableScale>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  outer: { marginHorizontal: 16, marginBottom: 10 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    paddingLeft: 0,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  accentLine: {
    width: 3,
    borderRadius: 1.5,
    alignSelf: "stretch",
    marginRight: 10,
  },
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
  infoColumn: { flex: 1, marginLeft: 10, marginRight: 8 },
  productName: { fontSize: 14, fontWeight: "700", letterSpacing: -0.2 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  brandText: { fontSize: 11, flexShrink: 1 },
  dot: { width: 2.5, height: 2.5, borderRadius: 1.25 },
  certifierBlock: { marginTop: 3, gap: 2 },
  certifiedByLabel: { fontSize: 9, fontWeight: "500", fontStyle: "italic" },
  certifierGradeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  gradeAdjectif: { fontSize: 9, fontWeight: "700" },
  certifierSimpleRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  certifierShort: { fontSize: 10, fontWeight: "700", flexShrink: 1 },
  tierRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  tierText: { fontSize: 10, fontWeight: "600", flexShrink: 1 },
  analysisRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 3 },
  naqiyLogo: { width: 12, height: 12 },
  analysisLabel: { fontSize: 9, fontWeight: "500" },
  analysisText: { fontSize: 9, fontWeight: "700", flexShrink: 1 },
  heartBtn: { position: "absolute", top: 6, right: 6 },
  heartCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
