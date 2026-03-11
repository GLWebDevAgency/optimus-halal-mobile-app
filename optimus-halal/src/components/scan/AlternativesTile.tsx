/**
 * AlternativesTile — Alternatives summary tile (2/3 width).
 *
 * Shows image deck (3 stacked), first product preview,
 * count, and contextual header.
 * Haram/doubtful: "Des alternatives existent" + green accent border.
 *
 * @module components/scan/AlternativesTile
 */

import React from "react";
import { View, Text, StyleSheet, I18nManager } from "react-native";
import { Image } from "expo-image";
import { BentoTile } from "./BentoTile";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { halalStatus as halalStatusTokens, gold, glass } from "@/theme/colors";
import {
  fontSize as fontSizeTokens,
  fontWeight as fontWeightTokens,
} from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";

interface AlternativeItem {
  id: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  halalStatus: string;
}

export interface AlternativesTileProps {
  alternatives: AlternativeItem[];
  loading: boolean;
  /** True when product is haram/doubtful — priority header + green accent */
  isHaram: boolean;
  staggerIndex: number;
  onPress: () => void;
}

const IMAGE_OVERLAP_STEP = 8;
const MAX_DECK_IMAGES = 3;

export function AlternativesTile({
  alternatives,
  loading,
  isHaram,
  staggerIndex,
  onPress,
}: AlternativesTileProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();

  const hasAlternatives = alternatives.length > 0;
  const first = alternatives[0] ?? null;
  const images = alternatives.slice(0, MAX_DECK_IMAGES);
  const direction = I18nManager.isRTL ? 1 : -1; // Fix 7: RTL-aware overlap

  // Contextual header — hardcoded for now, i18n in Task 6.5
  const header = isHaram
    ? "Des alternatives existent"
    : "Decouvrir aussi";

  return (
    <BentoTile
      onPress={onPress}
      glowColor={isHaram ? halalStatusTokens.halal.base : undefined}
      staggerIndex={staggerIndex}
      accessibilityLabel={`${header}: ${alternatives.length} produits`}
      style={styles.tileOuter}
      borderOverride={
        isHaram
          ? { borderColor: `${halalStatusTokens.halal.base}30`, borderWidth: 1 }
          : undefined
      }
    >
      <View style={styles.content}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <Text
            style={[
              styles.header,
              { color: isDark ? gold[400] : gold[700] },
            ]}
          >
            {header.toUpperCase()}
          </Text>
          {hasAlternatives && (
            <Text style={[styles.count, { color: colors.textMuted }]}>
              {alternatives.length}
            </Text>
          )}
        </View>

        {hasAlternatives ? (
          <>
            {/* Image deck (up to 3 overlapping) */}
            <View style={styles.imageDeck}>
              {images.map((alt, i) => (
                <Image
                  key={alt.id}
                  source={alt.imageUrl ?? undefined}
                  style={[
                    styles.deckImage,
                    {
                      transform: [
                        { translateX: i * IMAGE_OVERLAP_STEP * direction },
                      ],
                      zIndex: MAX_DECK_IMAGES - i,
                      borderColor: isDark
                        ? glass.dark.border
                        : glass.light.borderStrong,
                    },
                  ]}
                  contentFit="cover"
                  transition={200}
                />
              ))}
            </View>

            {/* First alternative name + halal badge */}
            {first && (
              <View style={styles.previewRow}>
                <Text
                  style={[
                    styles.productName,
                    { color: colors.textPrimary },
                  ]}
                  numberOfLines={1}
                >
                  {first.name}
                  {first.brand ? ` \u00b7 ${first.brand}` : ""}
                </Text>
                {first.halalStatus === "halal" && (
                  <View
                    style={[
                      styles.halalBadge,
                      {
                        backgroundColor: `${halalStatusTokens.halal.base}${isDark ? "18" : "0E"}`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.halalBadgeText,
                        { color: halalStatusTokens.halal.base },
                      ]}
                    >
                      {t.scanResult.alternativeHalal}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* CTA */}
            <Text
              style={[
                styles.ctaText,
                { color: isDark ? gold[400] : gold[700] },
              ]}
            >
              {t.scanResult.viewAlternatives} {"\u2192"}
            </Text>
          </>
        ) : (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            {loading
              ? t.scanResult.alternativesLoading
              : t.scanResult.alternativesEmpty}
          </Text>
        )}
      </View>
    </BentoTile>
  );
}

const styles = StyleSheet.create({
  tileOuter: { flex: 1 },
  content: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  header: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.bold,
    letterSpacing: 0.8,
  },
  count: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.medium,
  },
  imageDeck: {
    flexDirection: "row",
    paddingLeft: 16,
  },
  deckImage: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  productName: {
    flex: 1,
    fontSize: fontSizeTokens.bodySmall,
    fontWeight: fontWeightTokens.semiBold,
  },
  halalBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  halalBadgeText: {
    fontSize: 9,
    fontWeight: fontWeightTokens.bold,
  },
  ctaText: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.semiBold,
    textAlign: "right",
  },
  emptyText: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.medium,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
});
