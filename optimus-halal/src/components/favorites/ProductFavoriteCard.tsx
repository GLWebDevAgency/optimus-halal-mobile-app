/**
 * ProductFavoriteCard — Premium full-width card for product favorites.
 *
 * Mirrors the scan-history ScanRow design: status-tinted gradient background,
 * accent line, product image, certifier row, analysis verdict, and
 * MadhabScoreRing. Includes an unfavorite heart button.
 */

import React, { useMemo } from "react";
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
import { useTheme, useTranslation, useHaptics } from "@/hooks";
import { halalStatus as statusColors, gold } from "@/theme/colors";
import { AppIcon } from "@/lib/icons";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const NAQIY_LOGO = require("../../../assets/images/logo_naqiy.webp");

export const CARD_WIDTH = "100%";

// ── Status gradient config (same as scan-history) ───────────
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

const ANALYSIS_CONFIG: Record<string, { icon: "check-circle" | "cancel" | "warning" | "help-outline"; color: string; key: string }> = {
  halal: { icon: "check-circle", color: statusColors.halal.base, key: "conforme" },
  haram: { icon: "cancel", color: statusColors.haram.base, key: "non conforme" },
  doubtful: { icon: "warning", color: statusColors.doubtful.base, key: "incertain" },
  unknown: { icon: "help-outline", color: statusColors.unknown.base, key: "indéterminé" },
};

// ── Props ────────────────────────────────────────────────
interface ProductFavoriteCardProps {
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
    trustScore?: number | null;
  };
  index: number;
  onRemove: (productId: string) => void;
}

export const ProductFavoriteCard = React.memo(function ProductFavoriteCard({
  product,
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
  const analysis = ANALYSIS_CONFIG[status] ?? ANALYSIS_CONFIG.unknown;

  const certifierId = product.certifierId ?? null;
  const certifierName = product.certifierName ?? null;
  const trustScore = product.trustScore ?? null;

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
                ? `${config.color}20`
                : `${config.color}15`,
            },
          ]}
        >
          {/* L0: Status gradient background */}
          <LinearGradient
            colors={[...gradient]}
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
              { backgroundColor: `${config.color}${isDark ? "60" : "40"}` },
            ]}
          />

          {/* Product image */}
          <View
            style={[
              styles.imageBox,
              {
                backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.8)",
                borderColor: isDark ? `${config.color}20` : `${config.color}12`,
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

            {/* Brand */}
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
                  Certification :
                </Text>
                <CertifierTrustRow
                  variant="inline"
                  certifierId={certifierId}
                  certifierName={certifierName}
                  trustScore={trustScore}
                  showScore={false}
                />
              </View>
            ) : certifierId && certifierName ? (
              <View style={styles.certifierRow}>
                <CertifierLogo certifierId={certifierId} size={14} fallbackColor={config.color} />
                <Text style={[styles.certifierShort, { color: colors.textSecondary }]} numberOfLines={1}>
                  {certifierName}
                </Text>
              </View>
            ) : (
              <View style={styles.tierRow}>
                <FlaskIcon size={10} color={`${config.color}${isDark ? "90" : "70"}`} />
                <Text style={[styles.tierText, { color: `${config.color}${isDark ? "CC" : "99"}` }]} numberOfLines={1}>
                  Analysé par Naqiy
                </Text>
              </View>
            )}

            {/* Analysis composition row */}
            <View style={styles.analysisRow}>
              <Image source={NAQIY_LOGO} style={styles.naqiyLogo} contentFit="contain" />
              <Text style={[styles.analysisLabel, { color: colors.textMuted }]}>
                Composition :
              </Text>
              <AppIcon name={analysis.icon} size={10} color={analysis.color} />
              <Text style={[styles.analysisText, { color: analysis.color }]} numberOfLines={1}>
                {analysis.key}
              </Text>
            </View>
          </View>

          {/* Heart unfavorite — top-right */}
          <PressableScale
            onPress={handleRemove}
            style={styles.heartBtn}
            accessibilityLabel={t.favorites.removeConfirm}
          >
            <View style={[styles.heartCircle, { backgroundColor: isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)" }]}>
              <HeartIcon size={16} color="#ef4444" weight="fill" />
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
  certifierRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  certifierShort: { fontSize: 10, fontWeight: "700", flexShrink: 1 },
  tierRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  tierText: { fontSize: 10, fontWeight: "600", flexShrink: 1 },
  analysisRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 3 },
  naqiyLogo: { width: 12, height: 12 },
  analysisLabel: { fontSize: 9, fontWeight: "500" },
  analysisText: { fontSize: 9, fontWeight: "700", flexShrink: 1 },
  heartBtn: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  heartCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
