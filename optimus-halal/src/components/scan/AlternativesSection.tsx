/**
 * AlternativesSection — Découvrir Aussi / Des Alternatives Existent
 *
 * Inline alternatives section for continuous scroll.
 * Two variants:
 *   - "priority": shown before health for haram/doubtful products
 *     Header: "Des alternatives existent" (encouraging, not guilt-tripping)
 *   - "discover": shown after health for halal products
 *     Header: "Découvrir aussi"
 *
 * Design: Al-Taqwa — no false urgency, encouraging language.
 *
 * @module components/scan/AlternativesSection
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { MagnifyingGlassIcon, SparkleIcon } from "phosphor-react-native";

import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { brand as brandTokens, gold } from "@/theme/colors";
import { fontSize as fontSizeTokens, fontWeight as fontWeightTokens } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import { AlternativeProductCard } from "@/components/scan/AlternativeProductCard";
import { SectionCard } from "@/components/scan/SectionCard";

export interface AlternativesSectionProps {
  /** "priority" for haram/doubtful (promoted before health), "discover" for halal (after health) */
  variant: "priority" | "discover";
  /** Pass the tRPC query result directly — only isLoading and data are used */
  alternativesQuery: {
    isLoading: boolean;
    data: Array<{
      id: string;
      barcode: string | null;
      name: string | null;
      brand: string | null;
      imageUrl: string | null;
      halalStatus: string | null;
      confidenceScore: number | null;
      nutriscoreGrade: string | null;
      novaGroup: number | null;
    }> | null | undefined;
  };
  onAlternativePress: (id: string, barcode: string | null) => void;
  /** Stagger index for SectionCard entry animation delay */
  staggerIndex?: number;
}

export function AlternativesSection({
  variant,
  alternativesQuery,
  onAlternativePress,
  staggerIndex = 0,
}: AlternativesSectionProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();

  const title = variant === "priority"
    ? t.scanResult.alternativesPriority
    : t.scanResult.alternativesDiscover;

  return (
    <SectionCard
      icon={<SparkleIcon size={16} color={isDark ? gold[400] : gold[700]} weight="bold" />}
      title={title}
      staggerIndex={staggerIndex}
    >
      {/* Loading */}
      {alternativesQuery.isLoading && (
        <View style={styles.altLoadingContainer}>
          <ActivityIndicator size="small" color={brandTokens.gold} />
          <Text style={[styles.altLoadingText, { color: colors.textSecondary }]}>
            {t.scanResult.alternativesLoading}
          </Text>
        </View>
      )}

      {/* Results */}
      {alternativesQuery.data && alternativesQuery.data.length > 0 && (
        <View style={{ marginTop: spacing.md }}>
          {alternativesQuery.data.map((alt, idx) => (
            <AlternativeProductCard
              key={alt.id}
              id={alt.id}
              barcode={alt.barcode}
              name={alt.name}
              brand={alt.brand}
              imageUrl={alt.imageUrl}
              halalStatus={alt.halalStatus}
              confidenceScore={alt.confidenceScore}
              nutriscoreGrade={alt.nutriscoreGrade}
              novaGroup={alt.novaGroup}
              isBetterChoice={idx === 0}
              betterChoiceLabel={t.scanResult.alternativesBetterChoice}
              index={idx}
              onPress={(_id, barcode) => onAlternativePress(_id, barcode)}
            />
          ))}
        </View>
      )}

      {/* Empty */}
      {alternativesQuery.data && alternativesQuery.data.length === 0 && (
        <View style={[styles.altEmptyContainer, {
          backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
        }]}>
          <MagnifyingGlassIcon size={40} color={colors.textMuted} />
          <Text style={[styles.altEmptyTitle, { color: colors.textPrimary }]}>
            {t.scanResult.alternativesEmpty}
          </Text>
          <Text style={[styles.altEmptyDesc, { color: colors.textSecondary }]}>
            {t.scanResult.alternativesEmptyDesc}
          </Text>
        </View>
      )}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  altLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingVertical: spacing["3xl"],
  },
  altLoadingText: {
    fontSize: fontSizeTokens.bodySmall,
  },
  altEmptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing["3xl"],
    paddingHorizontal: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
    marginTop: spacing.lg,
  },
  altEmptyTitle: {
    fontSize: fontSizeTokens.body,
    fontWeight: fontWeightTokens.bold,
    marginTop: spacing.lg,
    textAlign: "center",
  },
  altEmptyDesc: {
    fontSize: fontSizeTokens.caption,
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 18,
  },
});
