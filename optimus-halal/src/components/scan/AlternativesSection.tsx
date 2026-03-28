/**
 * AlternativesSection — Premium Naqiy Card Layout
 *
 * Horizontal scroll of alternative product cards.
 * Clean contained-image design: product image in a dedicated area,
 * text hierarchy below, status pill, certifier in gold.
 *
 * States:
 *   A. Loading — Skeleton shimmer cards
 *   B. Empty  — MagnifyingGlass icon + copy
 *   C. Results — Horizontal ScrollView of premium cards
 *
 * @module components/scan/AlternativesSection
 */

import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import Animated, { FadeInUp, FadeInRight } from "react-native-reanimated";
import { Image } from "expo-image";
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
const CARD_WIDTH = 188;
const CARD_GAP = 12;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;
const IMAGE_AREA_HEIGHT = 108;

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

  const cardBg = isDark ? glass.dark.bg : "#FFFFFF";
  const cardBorder = isDark ? glass.dark.border : "rgba(0,0,0,0.07)";
  const imageBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)";
  const imageBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const brandColor = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)";
  const nameColor = isDark ? "#F5F5F7" : "#1D1D1F";
  const goldColor = isDark ? gold[400] : gold[600];
  const mutedColor = isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)";

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
              backgroundColor: cardBg,
              borderColor: cardBorder,
              ...Platform.select({
                ios: {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0.25 : 0.07,
                  shadowRadius: 10,
                },
                android: { elevation: 2 },
              }),
            },
          ]}
        >
          {/* ── Image area — contained, clean background ── */}
          <View style={[styles.imageArea, { backgroundColor: imageBg, borderBottomColor: imageBorder }]}>
            {alt.imageUrl ? (
              <Image
                source={{ uri: alt.imageUrl }}
                style={styles.productImage}
                contentFit="contain"
                transition={200}
              />
            ) : (
              <PackageIcon
                size={44}
                color={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}
              />
            )}

            {/* Status pill — bottom-left of image area */}
            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: `${statusColor}18`,
                  borderColor: `${statusColor}35`,
                },
              ]}
            >
              {isHalal && (
                <SealCheckIcon size={9} color={statusColor} weight="fill" />
              )}
              <Text style={[styles.statusPillText, { color: statusColor }]}>
                {getStatusLabel(alt.halalStatus)}
              </Text>
            </View>
          </View>

          {/* ── Text area ── */}
          <View style={styles.textArea}>
            {alt.brand ? (
              <Text
                style={[styles.cardBrand, { color: brandColor }]}
                numberOfLines={1}
              >
                {alt.brand.toUpperCase()}
              </Text>
            ) : null}

            <Text
              style={[styles.cardName, { color: nameColor }]}
              numberOfLines={2}
            >
              {alt.name}
            </Text>

            <View style={styles.cardFooter}>
              {alt.certifier ? (
                <Text
                  style={[styles.cardCertifier, { color: goldColor }]}
                  numberOfLines={1}
                >
                  {alt.certifier.shortName}
                </Text>
              ) : (
                <View style={styles.footerSpacer} />
              )}
              <CaretRightIcon
                size={11}
                color={mutedColor}
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
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
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

  // ── Card ──
  card: {
    width: CARD_WIDTH,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
  },

  // Image area — contained, neutral bg
  imageArea: {
    height: IMAGE_AREA_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  productImage: {
    width: CARD_WIDTH - 32,
    height: IMAGE_AREA_HEIGHT - 16,
  },
  statusPill: {
    position: "absolute",
    bottom: 8,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 9,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeightTokens.bold,
  },

  // Text area
  textArea: {
    padding: 12,
    paddingTop: 10,
    gap: 2,
  },
  cardBrand: {
    fontSize: 9,
    fontFamily: fontFamily.semiBold,
    fontWeight: fontWeightTokens.semiBold,
    letterSpacing: 0.6,
    marginBottom: 1,
  },
  cardName: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
    fontWeight: fontWeightTokens.bold,
    lineHeight: 17,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 5,
  },
  cardCertifier: {
    fontSize: 10,
    fontFamily: fontFamily.semiBold,
    fontWeight: fontWeightTokens.semiBold,
    flex: 1,
  },
  footerSpacer: {
    flex: 1,
  },
});
