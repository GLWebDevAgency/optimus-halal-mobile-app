/**
 * RecallInfoSection — Structured recall data cards for alert detail screen.
 *
 * Renders product recall data as visually rich info cards with icons,
 * instead of raw markdown text. Used when an alert has recallData.
 *
 * @module components/content/RecallInfoSection
 */

import React, { useCallback } from "react";
import { View, Text, StyleSheet, Linking, Pressable } from "react-native";
import { Image } from "expo-image";
import {
  WarningIcon,
  FirstAidIcon,
  ShieldCheckIcon,
  InfoIcon,
  StorefrontIcon,
  MapPinIcon,
  BarcodeIcon,
  ThermometerIcon,
  CalendarIcon,
  FileArrowDownIcon,
  ArrowSquareOutIcon,
  PhoneIcon,
  ScalesIcon,
  SwapIcon,
} from "phosphor-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { PressableScale } from "@/components/ui/PressableScale";
import { useTheme } from "@/hooks/useTheme";
import { useHaptics } from "@/hooks";
import { brand, gold, glass } from "@/theme/colors";
import {
  headingFontFamily,
  bodyFontFamily,
  fontSize,
  fontWeight,
} from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";

// ── Types ──────────────────────────────────────────────

export interface RecallData {
  id: string;
  gtin: string | null;
  brandName: string | null;
  productName: string | null;
  subCategory: string | null;
  recallReason: string;
  healthRisks: string | null;
  consumerActions: string | null;
  healthPrecautions: string | null;
  distributors: string | null;
  geoScope: string | null;
  imageUrl: string | null;
  pdfUrl: string | null;
  sourceUrl: string | null;
  publishedAt: string | Date;
  recallEndDate: string | Date | null;
}

interface RecallInfoSectionProps {
  data: RecallData;
}

// ── Info Card ──────────────────────────────────────────

interface InfoCardProps {
  icon: React.ReactNode;
  title: string;
  content: string;
  delay: number;
  isDark: boolean;
  colors: { textPrimary: string; textSecondary: string };
  accent?: string;
}

const InfoCard = React.memo(function InfoCard({
  icon,
  title,
  content,
  delay,
  isDark,
  colors,
  accent,
}: InfoCardProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400)}
      style={[
        styles.infoCard,
        {
          backgroundColor: isDark ? glass.dark.bg : glass.light.bg,
          borderColor: isDark ? glass.dark.border : glass.light.border,
        },
      ]}
    >
      <View style={styles.infoHeader}>
        {icon}
        <Text style={[styles.infoTitle, { color: accent ?? colors.textPrimary }]}>
          {title}
        </Text>
      </View>
      <Text style={[styles.infoContent, { color: colors.textPrimary }]}>
        {content}
      </Text>
    </Animated.View>
  );
});

// ── Main Component ─────────────────────────────────────

export const RecallInfoSection = React.memo(function RecallInfoSection({
  data,
}: RecallInfoSectionProps) {
  const { isDark, colors } = useTheme();
  const { impact } = useHaptics();
  const accent = isDark ? gold[500] : brand.primary;
  const warningColor = "#f59e0b";
  const dangerColor = "#ef4444";

  const handleOpenPdf = useCallback(() => {
    if (data.pdfUrl) {
      impact();
      Linking.openURL(data.pdfUrl);
    }
  }, [data.pdfUrl, impact]);

  const handleOpenSource = useCallback(() => {
    if (data.sourceUrl) {
      impact();
      Linking.openURL(data.sourceUrl);
    }
  }, [data.sourceUrl, impact]);

  const handleCall = useCallback(() => {
    // Extract phone from content if available (numero_contact stored in recall)
    impact();
  }, [impact]);

  let delay = 0;
  const nextDelay = () => { delay += 50; return delay; };

  return (
    <View style={styles.container}>
      {/* ── Product Card ── */}
      {(data.brandName || data.productName) && (
        <Animated.View
          entering={FadeInDown.delay(nextDelay()).duration(400)}
          style={[
            styles.productCard,
            {
              backgroundColor: isDark ? "rgba(245,158,11,0.06)" : "rgba(245,158,11,0.04)",
              borderColor: isDark ? "rgba(245,158,11,0.15)" : "rgba(245,158,11,0.10)",
            },
          ]}
        >
          {data.imageUrl && (
            <Image
              source={{ uri: data.imageUrl }}
              style={styles.productImage}
              contentFit="cover"
              transition={200}
            />
          )}
          <View style={styles.productInfo}>
            {data.brandName && (
              <Text style={[styles.productBrand, { color: warningColor }]}>
                {data.brandName.toUpperCase()}
              </Text>
            )}
            {data.productName && (
              <Text style={[styles.productName, { color: colors.textPrimary }]} numberOfLines={2}>
                {data.productName}
              </Text>
            )}
            {data.subCategory && (
              <Text style={[styles.productCategory, { color: colors.textMuted }]}>
                {data.subCategory}
              </Text>
            )}
            {data.gtin && (
              <View style={styles.gtinRow}>
                <BarcodeIcon size={12} color={colors.textMuted} />
                <Text style={[styles.gtinText, { color: colors.textMuted }]}>
                  {data.gtin}
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      )}

      {/* ── Recall Reason ── */}
      <InfoCard
        icon={<WarningIcon size={16} color={warningColor} weight="bold" />}
        title="Motif du rappel"
        content={data.recallReason}
        delay={nextDelay()}
        isDark={isDark}
        colors={colors}
        accent={warningColor}
      />

      {/* ── Health Risks ── */}
      {data.healthRisks && (
        <InfoCard
          icon={<FirstAidIcon size={16} color={dangerColor} weight="bold" />}
          title="Risques pour la sante"
          content={data.healthRisks}
          delay={nextDelay()}
          isDark={isDark}
          colors={colors}
          accent={dangerColor}
        />
      )}

      {/* ── Consumer Actions ── */}
      {data.consumerActions && (
        <InfoCard
          icon={<ShieldCheckIcon size={16} color="#22c55e" weight="bold" />}
          title="Que faire"
          content={data.consumerActions.replace(/\|/g, ", ")}
          delay={nextDelay()}
          isDark={isDark}
          colors={colors}
          accent="#22c55e"
        />
      )}

      {/* ── Health Precautions ── */}
      {data.healthPrecautions && (
        <InfoCard
          icon={<InfoIcon size={16} color="#3b82f6" weight="bold" />}
          title="Precautions sanitaires"
          content={data.healthPrecautions}
          delay={nextDelay()}
          isDark={isDark}
          colors={colors}
          accent="#3b82f6"
        />
      )}

      {/* ── Distributors ── */}
      {data.distributors && (
        <InfoCard
          icon={<StorefrontIcon size={16} color={colors.textSecondary} weight="bold" />}
          title="Distributeurs concernes"
          content={data.distributors}
          delay={nextDelay()}
          isDark={isDark}
          colors={colors}
        />
      )}

      {/* ── Geographic Scope ── */}
      {data.geoScope && (
        <InfoCard
          icon={<MapPinIcon size={16} color={colors.textSecondary} weight="bold" />}
          title="Zone geographique"
          content={data.geoScope}
          delay={nextDelay()}
          isDark={isDark}
          colors={colors}
        />
      )}

      {/* ── Action Buttons (PDF + Source) ── */}
      <Animated.View
        entering={FadeInDown.delay(nextDelay()).duration(400)}
        style={styles.actionsRow}
      >
        {data.pdfUrl && (
          <PressableScale
            onPress={handleOpenPdf}
            style={[
              styles.actionButton,
              {
                backgroundColor: isDark ? "rgba(239,68,68,0.08)" : "rgba(239,68,68,0.05)",
                borderColor: isDark ? "rgba(239,68,68,0.20)" : "rgba(239,68,68,0.12)",
              },
            ]}
            accessibilityRole="link"
            accessibilityLabel="Telecharger l'affichette PDF"
          >
            <FileArrowDownIcon size={18} color={dangerColor} weight="bold" />
            <Text style={[styles.actionText, { color: dangerColor }]}>
              Affichette PDF
            </Text>
          </PressableScale>
        )}

        {data.sourceUrl && (
          <PressableScale
            onPress={handleOpenSource}
            style={[
              styles.actionButton,
              {
                backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
                borderColor: isDark ? glass.dark.border : glass.light.border,
              },
            ]}
            accessibilityRole="link"
            accessibilityLabel="Voir la fiche rappel officielle"
          >
            <ArrowSquareOutIcon size={18} color={accent} weight="bold" />
            <Text style={[styles.actionText, { color: accent }]}>
              Fiche officielle
            </Text>
          </PressableScale>
        )}
      </Animated.View>
    </View>
  );
});

// ── Styles ──────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },

  // ── Product Card ──
  productCard: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  productImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },
  productInfo: {
    flex: 1,
    gap: 3,
    justifyContent: "center",
  },
  productBrand: {
    fontSize: 10,
    fontFamily: bodyFontFamily.bold,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.8,
  },
  productName: {
    fontSize: fontSize.body,
    fontFamily: bodyFontFamily.semiBold,
    fontWeight: fontWeight.semiBold,
    lineHeight: 20,
  },
  productCategory: {
    fontSize: 11,
    fontFamily: bodyFontFamily.regular,
    textTransform: "capitalize",
  },
  gtinRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  gtinText: {
    fontSize: 10,
    fontFamily: "Menlo",
  },

  // ── Info Cards ──
  infoCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoTitle: {
    fontSize: fontSize.bodySmall,
    fontFamily: headingFontFamily.semiBold,
    fontWeight: fontWeight.semiBold,
  },
  infoContent: {
    fontSize: fontSize.bodySmall,
    fontFamily: bodyFontFamily.regular,
    lineHeight: 22,
  },

  // ── Action Buttons ──
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionText: {
    fontSize: fontSize.bodySmall,
    fontFamily: bodyFontFamily.semiBold,
    fontWeight: fontWeight.semiBold,
  },
});

export default RecallInfoSection;
