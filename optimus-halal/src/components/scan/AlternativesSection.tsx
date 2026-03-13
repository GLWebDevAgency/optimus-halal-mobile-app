/**
 * AlternativesSection — Header + HeroCard + 2-column Grid + CTA + Empty state.
 *
 * Wrapped in SectionCard with ArrowsClockwise icon and alternativesTitle header.
 * Right element: "{count} trouvée(s)" muted text.
 *
 * States:
 *   A. Loading — ActivityIndicator + text
 *   B. Empty  — MagnifyingGlass icon + copy
 *   C. Results — AlternativeHeroCard + 2-col grid + optional CTA
 *
 * @module components/scan/AlternativesSection
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  type LayoutChangeEvent,
} from "react-native";
import { ArrowsClockwiseIcon, MagnifyingGlassIcon } from "phosphor-react-native";

import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { gold } from "@/theme/colors";
import { fontSize as fontSizeTokens, fontWeight as fontWeightTokens } from "@/theme/typography";
import { spacing } from "@/theme/spacing";
import { SectionCard } from "./SectionCard";
import { AlternativeHeroCard } from "./AlternativeHeroCard";
import { AlternativeGridCard } from "./AlternativeGridCard";
import type { AlternativeProductUI, CertifierInfo } from "./scan-types";
import type { HalalStatusKey } from "./scan-constants";

// ── Re-export types so callers can import from this module ──
export type { AlternativeProductUI };

// ── Types ──

export interface AlternativesSectionProps {
  alternatives: AlternativeProductUI[];
  scannedProduct: {
    name: string;
    halalStatus: HalalStatusKey;
    healthScore: number | null;
  };
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

// ── Component ──

export function AlternativesSection({
  alternatives,
  scannedProduct,
  isLoading,
  onAlternativePress,
  staggerIndex = 0,
}: AlternativesSectionProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();

  // Track grid container width for 2-col layout
  const [containerWidth, setContainerWidth] = useState(0);
  const GAP = 8;

  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  const cardWidth = containerWidth > 0
    ? (containerWidth - GAP) / 2
    : undefined;

  // Right element: count badge
  const rightElement = !isLoading && alternatives.length > 0 ? (
    <Text style={[styles.countText, { color: colors.textMuted }]}>
      {t.scanResult.alternativesCount.replace("{{count}}", String(alternatives.length))}
    </Text>
  ) : null;

  return (
    <SectionCard
      icon={
        <ArrowsClockwiseIcon
          size={16}
          color={isDark ? gold[400] : gold[700]}
          weight="bold"
        />
      }
      title={t.scanResult.alternativesTitle}
      rightElement={rightElement}
      staggerIndex={staggerIndex}
    >
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
          <MagnifyingGlassIcon size={48} color={colors.textMuted} weight="regular" />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            {t.scanResult.alternativesNoneFound}
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
            {t.scanResult.alternativesNoneDesc}
          </Text>
        </View>
      )}

      {/* ── C. Results ── */}
      {!isLoading && alternatives.length > 0 && (
        <View style={styles.resultsContainer} onLayout={handleLayout}>

          {/* 1. Hero card (first alternative) */}
          <AlternativeHeroCard
            alternative={alternatives[0]}
            scannedProduct={scannedProduct}
            onPress={onAlternativePress}
          />

          {/* 2. 2-column grid (remaining alternatives) */}
          {alternatives.length > 1 && containerWidth > 0 && (
            <View style={[styles.grid, { gap: GAP }]}>
              {alternatives.slice(1).map((alt) => (
                <View key={alt.barcode} style={cardWidth ? { width: cardWidth } : { flex: 1 }}>
                  <AlternativeGridCard
                    alternative={alt}
                    onPress={onAlternativePress}
                  />
                </View>
              ))}
            </View>
          )}

          {/* 3. CTA — only when > 3 alternatives */}
          {alternatives.length > 3 && (
            <Pressable
              onPress={() => {
                // noop — future: opens full alternatives list
              }}
              style={styles.ctaWrapper}
            >
              <Text style={[styles.ctaText, { color: gold[400] }]}>
                {t.scanResult.alternativesSeeAll} →
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </SectionCard>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
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

  // Results
  resultsContainer: {
    gap: spacing.lg,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  ctaWrapper: {
    alignItems: "center",
    marginTop: 12,
  },
  ctaText: {
    fontSize: fontSizeTokens.body,
    fontWeight: fontWeightTokens.semiBold,
  },
});
