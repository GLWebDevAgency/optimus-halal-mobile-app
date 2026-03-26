/**
 * VerdictHero — Centered Verdict-First Hero Section
 *
 * Layout: product image centered → name → verdict pill (dominant) → certifier chip.
 * One clear answer above the fold. No information duplication.
 *
 * Design: Apple-style centered card feel.
 *   - Image centered at top (120×120, contain, status border)
 *   - Verdict pill: full-width, status color, bold — #1 visual hierarchy
 *   - Certifier: single chip, shows trust warning only when score < 60
 *   - Grade strip removed from hero (lives in CertifierInfoRow section)
 *   - Barcode: minimal, muted, last
 *
 * @module components/scan/VerdictHero
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import {
  ImageBrokenIcon,
  MagnifyingGlassIcon,
  QrCodeIcon,
  WarningCircleIcon,
  CheckCircleIcon,
  CaretRightIcon,
} from "phosphor-react-native";
import Animated, {
  FadeIn,
  ZoomIn,
} from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { useTranslation, useHaptics } from "@/hooks";
import { glass } from "@/theme/colors";
import { fontSize as fontSizeTokens, fontWeight as fontWeightTokens } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import {
  SUSPENSE_DURATION,
  STATUS_CONFIG,
  type HalalStatusKey,
  type StatusVisualConfig,
} from "./scan-constants";
import { getTrustGradeFromScore, type TrustGrade } from "./NaqiyGradeBadge";
import { CertifierLogo } from "./CertifierLogo";

// ── Types ──

export interface VerdictHeroProps {
  product: {
    id: string;
    name: string;
    barcode: string;
    imageUrl: string | null;
    brand: string | null;
    halalStatus: string;
  };
  effectiveHeroStatus: HalalStatusKey;
  heroLabel: string;
  userMadhab: string;
  communityVerifiedCount: number;
  onImagePress: () => void;
  certifierName?: string | null;
  certifierId?: string | null;
  certifierScore?: number | null;
  trustGrade?: TrustGrade | null;
  onTrustGradePress?: () => void;
  topInset?: number;
}

// ── Component ──

export function VerdictHero({
  product,
  effectiveHeroStatus,
  heroLabel,
  userMadhab,
  onImagePress,
  certifierName,
  certifierId,
  certifierScore,
  trustGrade,
  onTrustGradePress,
  topInset = 0,
}: VerdictHeroProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const { impact } = useHaptics();
  const statusConfig: StatusVisualConfig =
    STATUS_CONFIG[effectiveHeroStatus] ?? STATUS_CONFIG.unknown;

  const gradientColors = isDark
    ? statusConfig.gradientDark
    : statusConfig.gradientLight;

  const madhabLabel =
    userMadhab !== "general"
      ? t.madhab.options[userMadhab as "hanafi" | "shafii" | "maliki" | "hanbali"]?.label
      : null;

  // Certifier trust state
  const isLowTrust = certifierScore !== null && certifierScore !== undefined && certifierScore < 60;
  const scoreColor = certifierScore !== null && certifierScore !== undefined
    ? certifierScore >= 70
      ? (isDark ? "#4ade80" : "#16a34a")
      : certifierScore >= 40
        ? (isDark ? "#fbbf24" : "#ca8a04")
        : (isDark ? "#f87171" : "#dc2626")
    : colors.textMuted;

  const certifierChipBg = isLowTrust
    ? isDark ? "rgba(239,68,68,0.10)" : "rgba(239,68,68,0.07)"
    : isDark ? glass.dark.bg : glass.light.bg;
  const certifierChipBorder = isLowTrust
    ? isDark ? "rgba(239,68,68,0.25)" : "rgba(239,68,68,0.18)"
    : isDark ? glass.dark.border : glass.light.border;

  return (
    <View
      style={[styles.hero, topInset > 0 && { paddingTop: topInset + spacing.md }]}
      accessibilityRole="summary"
      accessibilityLabel={heroLabel}
    >
      {/* Solid status-tinted background */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: gradientColors[0] }]} />

      {/* ── Micro header: NAQIY SCAN · Madhab ── */}
      <View style={styles.microRow}>
        <Image
          source={require("@assets/images/logo_naqiy.webp")}
          style={styles.microLogo}
          contentFit="contain"
        />
        <Text style={[styles.microText, { color: colors.textMuted }]}>
          NAQIY SCAN{madhabLabel ? ` · ${madhabLabel}` : ""}
        </Text>
      </View>

      {/* ── Product image — centered, prominent ── */}
      <Animated.View
        entering={ZoomIn.delay(SUSPENSE_DURATION).duration(380).springify().damping(26).stiffness(120)}
        style={styles.imageContainer}
      >
        <View
          style={[
            styles.imageWrapper,
            {
              backgroundColor: isDark ? glass.dark.highlight : "#ffffff",
              borderColor: statusConfig.color,
            },
          ]}
        >
          <Pressable
            onPress={product.imageUrl ? () => { impact(); onImagePress(); } : undefined}
            accessibilityRole="button"
            accessibilityLabel={product.name}
            accessibilityHint={product.imageUrl ? t.scanResult.tapToZoom : undefined}
            style={product.imageUrl ? styles.imagePress : styles.imagePlaceholder}
          >
            {product.imageUrl ? (
              <Image
                source={{ uri: product.imageUrl }}
                placeholder={{ blurhash: "LGF5]+Yk^6#M@-5c,1J5@[or[Q6." }}
                style={styles.productImage}
                contentFit="contain"
                transition={200}
              />
            ) : (
              <ImageBrokenIcon size={36} color={colors.textMuted} />
            )}
          </Pressable>

          {/* Zoom badge */}
          {product.imageUrl && (
            <View style={[
              styles.zoomBadge,
              { backgroundColor: isDark ? glass.dark.bg : "#ffffff" },
            ]}>
              <MagnifyingGlassIcon size={13} color={colors.textSecondary} />
            </View>
          )}
        </View>
      </Animated.View>

      {/* ── Product name — centered ── */}
      <Animated.View entering={FadeIn.delay(80).duration(350)} style={styles.nameBlock}>
        <Text
          style={[styles.productName, { color: colors.textPrimary }]}
          numberOfLines={2}
          accessibilityRole="header"
        >
          {product.name}
        </Text>
        {product.brand && (
          <Text style={[styles.brandText, { color: colors.textMuted }]} numberOfLines={1}>
            {product.brand}
          </Text>
        )}
      </Animated.View>

      {/* ── VERDICT PILL — dominant visual ── */}
      <Animated.View
        entering={FadeIn.delay(SUSPENSE_DURATION + 80).duration(420)}
        style={styles.verdictPillWrapper}
      >
        <View
          style={[
            styles.verdictPill,
            {
              backgroundColor: statusConfig.color,
              ...Platform.select({
                ios: {
                  shadowColor: statusConfig.color,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.35,
                  shadowRadius: 14,
                },
                android: { elevation: 8 },
              }),
            },
          ]}
        >
          <Text style={styles.verdictPillText} numberOfLines={1}>
            {heroLabel}
          </Text>
        </View>
      </Animated.View>

      {/* ── Certifier chip — single, concise ── */}
      {certifierName && certifierId && (
        <Animated.View
          entering={FadeIn.delay(SUSPENSE_DURATION + 180).duration(380)}
          style={styles.certifierChipWrapper}
        >
          <Pressable
            onPress={onTrustGradePress}
            accessibilityRole="button"
            accessibilityLabel={certifierName}
            style={({ pressed }) => [
              styles.certifierChip,
              {
                backgroundColor: certifierChipBg,
                borderColor: certifierChipBorder,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <CertifierLogo certifierId={certifierId} size={14} />
            {isLowTrust ? (
              <WarningCircleIcon size={13} color={scoreColor} weight="fill" />
            ) : (
              <CheckCircleIcon size={13} color={scoreColor} weight="fill" />
            )}
            <Text
              style={[styles.certifierChipText, { color: isLowTrust ? scoreColor : colors.textSecondary }]}
              numberOfLines={1}
            >
              {certifierName}
              {trustGrade ? `  ·  ${trustGrade.label}` : ""}
            </Text>
            <CaretRightIcon size={11} color={colors.textMuted} />
          </Pressable>
        </Animated.View>
      )}

      {/* ── Barcode — minimal, bottom ── */}
      <Animated.View entering={FadeIn.delay(200).duration(300)} style={styles.barcodeRow}>
        <QrCodeIcon size={10} color={colors.textMuted} />
        <Text style={[styles.barcodeText, { color: colors.textMuted }]}>
          {product.barcode}
        </Text>
      </Animated.View>
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    paddingHorizontal: spacing["3xl"],
    paddingTop: spacing["2xl"],
    paddingBottom: spacing.xl,
    overflow: "hidden",
    gap: spacing.md,
  },

  // Micro header
  microRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: spacing.xs,
  },
  microLogo: {
    width: 12,
    height: 12,
    opacity: 0.35,
  },
  microText: {
    fontSize: 9,
    fontWeight: fontWeightTokens.bold,
    letterSpacing: Platform.OS === "android" ? 0.3 : 1.2,
    textTransform: "uppercase",
  },

  // Product image
  imageContainer: {
    alignItems: "center",
  },
  imageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 24,
    borderWidth: 2.5,
    padding: 6,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.14,
        shadowRadius: 20,
      },
      android: { elevation: 8 },
    }),
  },
  imagePress: {
    flex: 1,
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  productImage: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
  },
  zoomBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },

  // Name block
  nameBlock: {
    alignItems: "center",
    gap: spacing["2xs"],
    paddingHorizontal: spacing.md,
  },
  productName: {
    fontSize: fontSizeTokens.h4,
    fontWeight: fontWeightTokens.bold,
    textAlign: "center",
    lineHeight: 24,
  },
  brandText: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.medium,
    textAlign: "center",
  },

  // Verdict pill
  verdictPillWrapper: {
    alignSelf: "stretch",
    marginTop: spacing.xs,
  },
  verdictPill: {
    borderRadius: radius.xl,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  verdictPillText: {
    fontSize: fontSizeTokens.h4,
    fontWeight: fontWeightTokens.black,
    color: "#FFFFFF",
    letterSpacing: 0.3,
    textAlign: "center",
  },

  // Certifier chip
  certifierChipWrapper: {
    alignSelf: "center",
    maxWidth: "90%",
  },
  certifierChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  certifierChipText: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.semiBold,
    flexShrink: 1,
  },

  // Barcode
  barcodeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: spacing.xs,
  },
  barcodeText: {
    fontSize: 10,
    fontWeight: fontWeightTokens.medium,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    letterSpacing: 0.5,
  },
});
