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

      {/* ── Certifier row — single line, compact ── */}
      {certifierName && certifierId && (
        <Animated.View
          entering={FadeIn.delay(SUSPENSE_DURATION + 180).duration(380)}
          style={styles.certifierRowWrapper}
        >
          <Pressable
            onPress={onTrustGradePress}
            accessibilityRole="button"
            accessibilityLabel={certifierName}
          >
            {({ pressed }) => (
              <View
                style={[
                  styles.certifierRow,
                  {
                    backgroundColor: certifierChipBg,
                    borderColor: certifierChipBorder,
                    opacity: pressed ? 0.72 : 1,
                  },
                ]}
              >
                {/* Left: certifier logo — vertically centered */}
                <CertifierLogo certifierId={certifierId} size={36} fallbackColor={scoreColor} />

                {/* Center: 2-line content */}
                <View style={styles.certifierContent}>
                  {/* Line 1: status icon + name */}
                  <View style={styles.certifierLine1}>
                    {isLowTrust ? (
                      <WarningCircleIcon size={13} color={scoreColor} weight="fill" />
                    ) : (
                      <CheckCircleIcon size={13} color={scoreColor} weight="fill" />
                    )}
                    <Text
                      style={[styles.certifierName, { color: colors.textPrimary }]}
                      numberOfLines={1}
                    >
                      {certifierName}
                    </Text>
                  </View>

                  {/* Line 2: grade centered */}
                  {trustGrade && (
                    <Text
                      style={[styles.certifierGrade, { color: scoreColor }]}
                      numberOfLines={1}
                    >
                      {trustGrade.label}
                    </Text>
                  )}
                </View>

                {/* Right: caret — vertically centered by parent alignItems: "center" */}
                <CaretRightIcon size={14} color={colors.textMuted} />
              </View>
            )}
          </Pressable>
        </Animated.View>
      )}

      {/* ── Brand · Barcode — minimal, bottom ── */}
      <Animated.View entering={FadeIn.delay(200).duration(300)} style={styles.barcodeRow}>
        {product.brand && (
          <>
            <Text style={[styles.brandText, { color: colors.textMuted }]} numberOfLines={1}>
              {product.brand}
            </Text>
            <Text style={[styles.barcodeSep, { color: colors.textMuted }]}>·</Text>
          </>
        )}
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
    paddingHorizontal: spacing.md,
  },
  productName: {
    fontSize: fontSizeTokens.h4,
    fontWeight: fontWeightTokens.bold,
    textAlign: "center",
    lineHeight: 24,
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

  // Certifier card (logo left + 2-line content right)
  certifierRowWrapper: {
    alignSelf: "stretch",
  },
  certifierRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  certifierContent: {
    flex: 1,
    gap: 3,
  },
  certifierLine1: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  certifierName: {
    flex: 1,
    fontSize: fontSizeTokens.bodySmall,
    fontWeight: fontWeightTokens.semiBold,
  },
  certifierGrade: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.bold,
    textAlign: "center",
  },

  // Brand · Barcode row
  barcodeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  brandText: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.medium,
  },
  barcodeSep: {
    fontSize: fontSizeTokens.caption,
  },
  barcodeText: {
    fontSize: 10,
    fontWeight: fontWeightTokens.medium,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    letterSpacing: 0.5,
  },
});
