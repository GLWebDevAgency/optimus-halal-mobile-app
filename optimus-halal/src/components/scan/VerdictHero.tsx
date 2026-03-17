/**
 * VerdictHero — Compact Verdict-First Hero Section
 *
 * Displays the halal verdict within 0.5s above the fold.
 * Architecture: 4-layer gradient (L0-L3) + ambient orb (L4),
 * glass card product image with zoom badge + ImagePreviewModal,
 * certifier trust bar OR verdict fallback, personal alerts,
 * and community verified badge.
 *
 * Design principles (Al-Ihsan):
 *  - Color BEFORE text: gradient appears at T+0ms, text at T+100ms
 *  - springNaqiy (damping:14, stiffness:170, mass:0.9) on all animations
 *  - Informational verdicts: "Composition Conforme" not "Certifié Halal"
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
import { ImageBrokenIcon, MagnifyingGlassIcon, QrCodeIcon, UsersThreeIcon } from "phosphor-react-native";
import Animated, {
  FadeIn,
  FadeInRight,
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
import { NaqiyGradeBadge, getTrustGradeFromScore, type TrustGrade } from "./NaqiyGradeBadge";

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
  /** Naqiy Trust Grade from certifier (N١→N٥) */
  trustGrade?: TrustGrade | null;
  /** Callback when the NaqiyGradeBadge strip is pressed */
  onTrustGradePress?: () => void;
  /** Top safe-area inset so gradient extends behind status bar */
  topInset?: number;
}

// ── Component ──

export function VerdictHero({
  product,
  effectiveHeroStatus,
  heroLabel,
  userMadhab,
  communityVerifiedCount,
  onImagePress,
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

  // ── Madhab label (displayed in micro header) ──
  const madhabLabel =
    userMadhab !== "general"
      ? t.madhab.options[userMadhab as "hanafi" | "shafii" | "maliki" | "hanbali"]?.label
      : null;

  // ── Render ──

  return (
    <View
      style={[styles.heroGradient, topInset > 0 && { paddingTop: topInset }]}
      accessibilityRole="summary"
      accessibilityLabel={heroLabel}
    >
      {/* Solid status-tinted background */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: gradientColors[0] },
        ]}
      />

      {/* ── ROW 1: HERO LAYOUT ── */}
      <Animated.View
        entering={FadeIn.delay(50).duration(400)}
        style={styles.heroSplit}
      >
        {/* LEFT: Product Image — glass card */}
        <Animated.View
          entering={ZoomIn.delay(SUSPENSE_DURATION).duration(400).springify().damping(26).stiffness(120)}
          style={styles.heroImageColumn}
        >
          <View
            style={[
              styles.heroImageWrapper,
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
              style={product.imageUrl ? styles.heroImagePress : styles.heroImagePlaceholder}
            >
              {product.imageUrl ? (
                <Image
                  source={{ uri: product.imageUrl }}
                  placeholder={{ blurhash: "LGF5]+Yk^6#M@-5c,1J5@[or[Q6." }}
                  style={styles.heroImage}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <ImageBrokenIcon size={32} color={colors.textMuted} />
              )}
            </Pressable>
            {/* Zoom badge — bottom-right */}
            {product.imageUrl && (
              <View style={[
                styles.heroZoomBadge,
                { backgroundColor: isDark ? glass.dark.bg : "#ffffff" },
              ]}>
                <MagnifyingGlassIcon size={14} color={colors.textSecondary} />
              </View>
            )}
          </View>
        </Animated.View>

        {/* RIGHT COLUMN: Info stack */}
        <View style={styles.heroInfoColumn}>
          {/* Micro header: Naqiy logo + "NAQIY SCAN · Maliki" */}
          <View style={styles.heroMicroRow}>
            <Image
              source={require("@assets/images/logo_naqiy.webp")}
              style={{ width: 14, height: 14, opacity: isDark ? 0.5 : 0.35 }}
              contentFit="contain"
            />
            <Text style={[styles.heroMicroText, { color: colors.textMuted }]}>
              NAQIY SCAN{madhabLabel ? ` · ${madhabLabel}` : ""}
            </Text>
          </View>

          {/* Product name */}
          <Text
            style={[styles.heroProductName, { color: colors.textPrimary }]}
            numberOfLines={2}
            accessibilityRole="header"
          >
            {product.name}
          </Text>

          {/* Brand · Barcode */}
          <View style={styles.heroBrandRow}>
            {product.brand && (
              <Text style={[styles.heroBrandText, { color: colors.textMuted }]} numberOfLines={1}>
                {product.brand}
              </Text>
            )}
            <View style={styles.heroBarcodeChip}>
              <QrCodeIcon size={12} color={colors.textMuted} />
              <Text style={[styles.heroBarcode, { color: colors.textMuted }]}>
                {product.barcode}
              </Text>
            </View>
          </View>

          {/* Verdict — single, prominent */}
          <Animated.View
            entering={FadeInRight.delay(SUSPENSE_DURATION + 100).duration(450)}
          >
            <Text
              style={[styles.heroVerdictText, { color: statusConfig.color }]}
              numberOfLines={1}
            >
              {heroLabel}
            </Text>
          </Animated.View>

          {/* Naqiy Trust Grade strip (certifier only) — tappable → certifier detail */}
          {trustGrade && (
            <Animated.View
              entering={FadeIn.delay(SUSPENSE_DURATION + 250).duration(400)}
              style={styles.gradeStripRow}
            >
              <Pressable
                onPress={onTrustGradePress}
                accessibilityRole="button"
                accessibilityLabel="Détail certifieur"
                style={({ pressed }) => pressed ? { opacity: 0.7 } : undefined}
              >
                <NaqiyGradeBadge variant="strip" grade={trustGrade} showLabel />
              </Pressable>
            </Animated.View>
          )}

        </View>
      </Animated.View>

      {/* ── Community badge ── */}
      {communityVerifiedCount > 0 && (
        <Animated.View
          entering={FadeIn.delay(SUSPENSE_DURATION + 350).duration(500)}
          style={styles.metadataBand}
        >
          <View
            style={[
              styles.certifierHeroBadge,
              {
                backgroundColor: isDark
                  ? glass.dark.bg
                  : glass.light.border,
                borderColor: isDark
                  ? glass.dark.borderStrong
                  : glass.light.borderStrong,
              },
            ]}
          >
            <UsersThreeIcon size={13} color={colors.textMuted} />
            <Text style={[styles.certifierHeroBadgeText, { color: colors.textSecondary }]}>
              {(communityVerifiedCount > 1
                ? t.scanResult.verifiedByCountPlural
                : t.scanResult.verifiedByCount
              ).replace("{{count}}", String(communityVerifiedCount))}
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  heroGradient: {
    paddingHorizontal: spacing["3xl"],
    paddingBottom: spacing.xl,
    overflow: "hidden",
  },
  heroSplit: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xl,
  },
  heroImageColumn: {
    alignItems: "center",
  },
  heroImageWrapper: {
    width: 100,
    height: 100,
    borderRadius: 20,
    borderWidth: 2.5,
    padding: 4,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  heroImagePress: {
    flex: 1,
  },
  heroImagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
  },
  heroZoomBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  heroInfoColumn: {
    flex: 1,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  heroMicroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroMicroText: {
    fontSize: 10,
    fontWeight: fontWeightTokens.bold,
    letterSpacing: Platform.OS === "android" ? 0.3 : 1.2,
    textTransform: "uppercase",
  },
  heroProductName: {
    fontSize: fontSizeTokens.body,
    fontWeight: fontWeightTokens.bold,
    lineHeight: 20,
  },
  heroBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  heroBrandText: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.medium,
  },
  heroBarcodeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  heroBarcode: {
    fontSize: 10,
    fontWeight: fontWeightTokens.medium,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  heroVerdictText: {
    fontSize: fontSizeTokens.h4,
    fontWeight: fontWeightTokens.bold,
    letterSpacing: 0.3,
    marginTop: spacing.xs,
  },
  gradeStripRow: {
    marginTop: spacing.xs,
  },
  metadataBand: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  certifierHeroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  certifierHeroBadgeText: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.semiBold,
  },
});
