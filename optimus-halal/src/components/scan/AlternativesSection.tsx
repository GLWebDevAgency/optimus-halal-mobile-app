/**
 * AlternativesSection — Premium Naqiy Card Layout
 *
 * Beautiful horizontal scroll of alternative product cards inspired by
 * the DiscoverStoreCard pattern: image background, gradient overlay,
 * glass-morphism, staggered FadeInRight, snap-to-card scrolling.
 *
 * States:
 *   A. Loading — Skeleton shimmer cards
 *   B. Empty  — MagnifyingGlass icon + copy
 *   C. Results — Horizontal ScrollView of premium cards
 *
 * Design tokens: glass, gold, STATUS_CONFIG, springNaqiy
 * @module components/scan/AlternativesSection
 */

import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import Animated, { FadeInUp, FadeInRight } from "react-native-reanimated";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowsClockwiseIcon,
  MagnifyingGlassIcon,
  PackageIcon,
  SealCheckIcon,
  CaretRightIcon,
} from "phosphor-react-native";

import { PressableScale } from "@/components/ui/PressableScale";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { gold, glass } from "@/theme/colors";
import {
  fontSize as fontSizeTokens,
  fontWeight as fontWeightTokens,
  fontFamily,
} from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import { letterSpacing, STATUS_CONFIG } from "./scan-constants";
import type { AlternativeProductUI } from "./scan-types";
import type { HalalStatusKey } from "./scan-constants";

// ── Re-export types so callers can import from this module ──
export type { AlternativeProductUI };

// ── Types ──

export interface AlternativesSectionProps {
  alternatives: AlternativeProductUI[];
  isLoading: boolean;
  onAlternativePress: (barcode: string) => void;
  staggerIndex?: number;
}

// ── Adapter (legacy raw shape → AlternativeProductUI) ──

export function adaptLegacyAlternative(raw: {
  id: string;
  barcode: string | null;
  name: string | null;
  brand: string | null;
  imageUrl: string | null;
  halalStatus: string | null;
  confidenceScore: number | null;
  nutriscoreGrade: string | null;
  novaGroup: number | null;
}): AlternativeProductUI {
  return {
    barcode: raw.barcode ?? raw.id,
    name: raw.name ?? "Produit inconnu",
    brand: raw.brand ?? "",
    imageUrl: raw.imageUrl,
    quantity: undefined,
    healthScore: null,
    halalStatus: (raw.halalStatus as HalalStatusKey) ?? "unknown",
    certifier: null,
    matchReason: "",
    matchType: "category",
    price: undefined,
    availableAt: undefined,
  };
}

// ── Card dimensions ──
const CARD_WIDTH = 200;
const CARD_HEIGHT = 160;
const CARD_GAP = 12;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;

// ── Halal Status Label (short) ──
function getStatusLabel(status: HalalStatusKey): string {
  switch (status) {
    case "halal": return "Halal";
    case "haram": return "Haram";
    case "doubtful": return "Douteux";
    default: return "?";
  }
}

// ── Premium Alternative Card ──

const AlternativeCard = React.memo(function AlternativeCard({
  alt,
  isDark,
  index,
  onPress,
}: {
  alt: AlternativeProductUI;
  isDark: boolean;
  index: number;
  onPress: (barcode: string) => void;
}) {
  const statusConfig = STATUS_CONFIG[alt.halalStatus];
  const statusColor = statusConfig?.color ?? "#6b7280";
  const isHalal = alt.halalStatus === "halal";

  return (
    <Animated.View
      entering={FadeInRight.delay(200 + index * 80)
        .springify()
        .damping(14)
        .stiffness(170)
        .mass(0.9)}
    >
      <PressableScale
        onPress={() => onPress(alt.barcode)}
        accessibilityRole="button"
        accessibilityLabel={`${alt.name}${alt.brand ? `, ${alt.brand}` : ""}`}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? glass.dark.bg : glass.light.bg,
              borderColor: isDark ? glass.dark.border : glass.light.border,
            },
          ]}
        >
          {/* ── Background image ── */}
          {alt.imageUrl ? (
            <Image
              source={{ uri: alt.imageUrl }}
              style={[StyleSheet.absoluteFill, styles.cardBgImage]}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.cardPlaceholder]}>
              <PackageIcon
                size={48}
                color={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}
              />
            </View>
          )}

          {/* ── Gradient overlay for text readability ── */}
          <LinearGradient
            colors={[
              "transparent",
              isDark ? "rgba(12,12,12,0.85)" : "rgba(255,255,255,0.92)",
            ]}
            locations={[0.15, 0.75]}
            style={StyleSheet.absoluteFill}
          />

          {/* ── Top-left badges row ── */}
          <View style={styles.badgesRow}>
            {/* Halal status badge */}
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: isDark
                    ? `${statusColor}30`
                    : `${statusColor}20`,
                },
              ]}
            >
              {isHalal && (
                <SealCheckIcon size={10} color={statusColor} weight="fill" />
              )}
              <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                {getStatusLabel(alt.halalStatus)}
              </Text>
            </View>

            {/* Health score badge (if available) */}
            {alt.healthScore != null && (
              <View
                style={[
                  styles.scoreBadge,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.12)"
                      : "rgba(0,0,0,0.06)",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.scoreBadgeText,
                    { color: isDark ? "#fff" : "#1a1a1a" },
                  ]}
                >
                  {alt.healthScore}/100
                </Text>
              </View>
            )}
          </View>

          {/* ── Bottom content overlay ── */}
          <View style={styles.cardContent}>
            {/* Brand */}
            {alt.brand ? (
              <Text
                style={[
                  styles.cardBrand,
                  {
                    color: isDark
                      ? "rgba(255,255,255,0.55)"
                      : "rgba(0,0,0,0.45)",
                  },
                ]}
                numberOfLines={1}
              >
                {alt.brand}
              </Text>
            ) : null}

            {/* Product name */}
            <Text
              style={[
                styles.cardName,
                {
                  color: isDark ? "#fff" : "#0f172a",
                },
              ]}
              numberOfLines={2}
            >
              {alt.name}
            </Text>

            {/* Certifier or match reason — subtle footer row */}
            <View style={styles.cardFooter}>
              {alt.certifier ? (
                <Text
                  style={[
                    styles.cardCertifier,
                    { color: isDark ? gold[400] : gold[600] },
                  ]}
                  numberOfLines={1}
                >
                  {alt.certifier.shortName}
                </Text>
              ) : alt.matchReason ? (
                <Text
                  style={[
                    styles.cardMatchReason,
                    {
                      color: isDark
                        ? "rgba(255,255,255,0.4)"
                        : "rgba(0,0,0,0.35)",
                    },
                  ]}
                  numberOfLines={1}
                >
                  {alt.matchReason}
                </Text>
              ) : null}

              <CaretRightIcon
                size={12}
                color={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.25)"}
              />
            </View>
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
});

// ── Component ──

export function AlternativesSection({
  alternatives,
  isLoading,
  onAlternativePress,
  staggerIndex = 0,
}: AlternativesSectionProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();

  const goldColor = isDark ? gold[400] : gold[700];

  const countElement =
    !isLoading && alternatives.length > 0 ? (
      <Text style={[styles.countText, { color: colors.textMuted }]}>
        {t.scanResult.alternativesCount.replace(
          "{{count}}",
          String(alternatives.length),
        )}
      </Text>
    ) : null;

  return (
    <Animated.View
      entering={FadeInUp.delay(staggerIndex * 100)
        .springify()
        .damping(14)
        .stiffness(170)
        .mass(0.9)}
    >
      {/* ── Gold section header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ArrowsClockwiseIcon size={15} color={goldColor} weight="bold" />
          <Text style={[styles.headerTitle, { color: goldColor }]}>
            {t.scanResult.alternativesTitle}
          </Text>
        </View>
        {countElement}
      </View>

      {/* ── A. Loading ── */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={gold[400]} />
          <Text
            style={[styles.loadingText, { color: colors.textSecondary }]}
          >
            {t.scanResult.alternativesLoading}
          </Text>
        </View>
      )}

      {/* ── B. Empty state ── */}
      {!isLoading && alternatives.length === 0 && (
        <View style={styles.emptyContainer}>
          <MagnifyingGlassIcon
            size={48}
            color={colors.textMuted}
            weight="regular"
          />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            {t.scanResult.alternativesNoneFound}
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
            {t.scanResult.alternativesNoneDesc}
          </Text>
        </View>
      )}

      {/* ── C. Premium horizontal scroll cards ── */}
      {!isLoading && alternatives.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          decelerationRate="fast"
          snapToInterval={SNAP_INTERVAL}
          snapToAlignment="start"
        >
          {alternatives.map((alt, index) => (
            <AlternativeCard
              key={alt.barcode}
              alt={alt}
              isDark={isDark}
              index={index}
              onPress={onAlternativePress}
            />
          ))}
        </ScrollView>
      )}
    </Animated.View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSizeTokens.micro,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeightTokens.bold,
    textTransform: "uppercase",
    letterSpacing: letterSpacing.wider,
  },
  countText: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.medium,
  },

  // Loading
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingVertical: spacing["3xl"],
  },
  loadingText: {
    fontSize: fontSizeTokens.bodySmall,
  },

  // Empty
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  emptyTitle: {
    fontSize: fontSizeTokens.body,
    fontWeight: fontWeightTokens.bold,
    marginTop: spacing.md,
    textAlign: "center",
  },
  emptyDesc: {
    fontSize: fontSizeTokens.caption,
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 18,
  },

  // Horizontal scroll
  scrollContent: {
    gap: CARD_GAP,
    paddingRight: spacing.lg,
  },

  // ── Premium Card (DiscoverStoreCard-inspired) ──
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
  },
  cardBgImage: {
    opacity: 0.65,
  },
  cardPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },

  // Top-left badges
  badgesRow: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    flexDirection: "row",
    gap: 4,
    zIndex: 10,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: fontFamily.bold,
  },
  scoreBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  scoreBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: fontFamily.bold,
  },

  // Bottom content overlay
  cardContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  cardBrand: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: fontFamily.semiBold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  cardName: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: fontFamily.bold,
    lineHeight: 17,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  cardCertifier: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: fontFamily.semiBold,
    flex: 1,
  },
  cardMatchReason: {
    fontSize: 10,
    fontWeight: "500",
    fontFamily: fontFamily.medium,
    flex: 1,
  },
});
