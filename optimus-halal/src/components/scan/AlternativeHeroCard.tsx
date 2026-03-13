/**
 * AlternativeHeroCard — Best-match alternative with full comparison.
 *
 * Displays the top alternative product with:
 *  - Image banner with "BEST MATCH" gold badge and ScoreRing
 *  - Product info row (name, brand, quantity, price)
 *  - CertifierBadge (extended)
 *  - Match reason pills (category, available-at)
 *  - Comparison bar: scanned vs. alternative (halal status + health score)
 *
 * @module components/scan/AlternativeHeroCard
 */

import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Star, Crosshair, Storefront } from "phosphor-react-native";

import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { gold } from "@/theme/colors";
import { ScoreRing } from "./ScoreRing";
import { CertifierBadge } from "./CertifierBadge";
import { STATUS_CONFIG, type HalalStatusKey } from "./scan-constants";
import type { AlternativeProductUI, CertifierInfo } from "./scan-types";

// ── Types ──

export interface AlternativeHeroCardProps {
  alternative: AlternativeProductUI;
  scannedProduct: {
    name: string;
    halalStatus: HalalStatusKey;
    healthScore: number | null;
  };
  onPress: (barcode: string) => void;
}

// ── Sub-component: Comparison side ──

interface ComparisonSideProps {
  halalStatus: HalalStatusKey;
  healthScore: number | null;
  label: string;
  colors: ReturnType<typeof useTheme>["colors"];
  align: "left" | "right";
}

function ComparisonSide({ halalStatus, healthScore, label, colors, align }: ComparisonSideProps) {
  const config = STATUS_CONFIG[halalStatus];
  const Icon = config.Icon;
  const isRight = align === "right";

  return (
    <View style={[styles.comparisonSide, isRight && styles.comparisonSideRight]}>
      <Text style={[styles.comparisonLabel, { color: colors.textMuted }]}>{label}</Text>
      <View style={[styles.comparisonStatusRow, isRight && styles.comparisonStatusRowRight]}>
        <Icon size={14} weight={config.iconWeight} color={config.color} />
        <Text style={[styles.comparisonStatusText, { color: config.color }]} numberOfLines={1}>
          {halalStatus.charAt(0).toUpperCase() + halalStatus.slice(1)}
        </Text>
      </View>
      <Text style={[styles.comparisonScore, { color: colors.textSecondary }]}>
        {healthScore !== null ? `Score ${healthScore}` : "—"}
      </Text>
    </View>
  );
}

// ── Component ──

export function AlternativeHeroCard({
  alternative,
  scannedProduct,
  onPress,
}: AlternativeHeroCardProps) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  const goldColor = gold[400];
  const goldBorder = `${gold[400]}40`; // 25% opacity

  return (
    <Pressable
      onPress={() => onPress(alternative.barcode)}
      style={({ pressed }) => [
        styles.card,
        { borderColor: goldBorder, opacity: pressed ? 0.92 : 1 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${t.scanResult.alternativesBestMatch}: ${alternative.name}`}
    >
      <LinearGradient
        colors={[`${gold[400]}1F`, `${gold[400]}0A`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientWrapper}
      >
        {/* ── 1. Image Banner ── */}
        <View style={styles.imageBanner}>
          {alternative.imageUrl ? (
            <Image
              source={{ uri: alternative.imageUrl }}
              style={styles.bannerImage}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <LinearGradient
              colors={[`${gold[400]}33`, `${gold[400]}11`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bannerImage}
            />
          )}

          {/* Gradient overlay for readability */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.55)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Top-left: Best match badge */}
          <View style={styles.bestMatchBadge}>
            <Star size={10} weight="fill" color={isDark ? "#0C0C0C" : "#ffffff"} />
            <Text
              style={[
                styles.bestMatchText,
                { color: isDark ? "#0C0C0C" : "#ffffff" },
              ]}
            >
              {t.scanResult.alternativesBestMatch.toUpperCase()}
            </Text>
          </View>

          {/* Top-right: ScoreRing */}
          <View style={styles.scoreRingWrapper}>
            <ScoreRing score={alternative.healthScore} size={36} strokeWidth={3} animated />
          </View>
        </View>

        {/* ── 2. Info Section ── */}
        <View style={styles.infoSection}>

          {/* a. Name + brand + price row */}
          <View style={styles.nameRow}>
            <View style={styles.nameStack}>
              <Text
                style={[styles.productName, { color: colors.textPrimary }]}
                numberOfLines={2}
              >
                {alternative.name}
              </Text>
              <Text
                style={[styles.brandQuantity, { color: colors.textMuted }]}
                numberOfLines={1}
              >
                {[alternative.brand, alternative.quantity]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            </View>
            {alternative.price !== undefined && (
              <Text style={[styles.price, { color: goldColor }]}>
                {alternative.price.toFixed(2)} €
              </Text>
            )}
          </View>

          {/* b. CertifierBadge */}
          {alternative.certifier && (
            <View style={styles.certifierWrapper}>
              <CertifierBadge certifier={alternative.certifier as CertifierInfo} size="extended" />
            </View>
          )}

          {/* c. Match reason pills */}
          <View style={styles.pillsRow}>
            <View
              style={[
                styles.pill,
                { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" },
              ]}
            >
              <Crosshair size={10} weight="bold" color={colors.textMuted} />
              <Text style={[styles.pillText, { color: colors.textMuted }]} numberOfLines={1}>
                {alternative.matchReason}
              </Text>
            </View>
            {alternative.availableAt && alternative.availableAt.length > 0 && (
              <View
                style={[
                  styles.pill,
                  { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" },
                ]}
              >
                <Storefront size={10} weight="bold" color={colors.textMuted} />
                <Text style={[styles.pillText, { color: colors.textMuted }]} numberOfLines={1}>
                  {alternative.availableAt.join(", ")}
                </Text>
              </View>
            )}
          </View>

          {/* d. Comparison bar */}
          <View
            style={[
              styles.comparisonBar,
              { backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" },
            ]}
          >
            <ComparisonSide
              halalStatus={scannedProduct.halalStatus}
              healthScore={scannedProduct.healthScore}
              label={t.scanResult.alternativesScanned}
              colors={colors}
              align="left"
            />

            {/* Divider */}
            <View
              style={[
                styles.comparisonDivider,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.10)"
                    : "rgba(0,0,0,0.08)",
                },
              ]}
            />

            <ComparisonSide
              halalStatus={alternative.halalStatus}
              healthScore={alternative.healthScore}
              label={t.scanResult.alternativesAlternative}
              colors={colors}
              align="right"
            />
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  gradientWrapper: {
    borderRadius: 20,
    overflow: "hidden",
  },

  // Image banner
  imageBanner: {
    height: 100,
    overflow: "hidden",
    position: "relative",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  bestMatchBadge: {
    position: "absolute",
    top: 8,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: gold[400],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  bestMatchText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  scoreRingWrapper: {
    position: "absolute",
    top: 8,
    right: 10,
  },

  // Info section
  infoSection: {
    padding: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  nameStack: {
    flex: 1,
    gap: 2,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 19,
  },
  brandQuantity: {
    fontSize: 12,
    fontWeight: "400",
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    flexShrink: 0,
  },

  // Certifier
  certifierWrapper: {
    // Natural flow
  },

  // Pills
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  pillText: {
    fontSize: 10,
    fontWeight: "400",
  },

  // Comparison bar
  comparisonBar: {
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: 12,
    padding: 8,
    paddingHorizontal: 10,
  },
  comparisonSide: {
    flex: 1,
    gap: 3,
    alignItems: "flex-start",
  },
  comparisonSideRight: {
    alignItems: "flex-end",
  },
  comparisonLabel: {
    fontSize: 10,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  comparisonStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  comparisonStatusRowRight: {
    flexDirection: "row-reverse",
  },
  comparisonStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  comparisonScore: {
    fontSize: 11,
    fontWeight: "400",
  },
  comparisonDivider: {
    width: 1,
    marginHorizontal: 10,
    alignSelf: "stretch",
  },
});
