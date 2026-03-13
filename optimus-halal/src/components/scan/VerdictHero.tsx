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

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { ChartBarIcon, ImageBrokenIcon, MagnifyingGlassIcon, QrCodeIcon, UsersThreeIcon } from "phosphor-react-native";
import Animated, {
  FadeIn,
  FadeInRight,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  useDerivedValue,
  runOnJS,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { CertifierLogo } from "@/components/scan/CertifierLogo";
import { ScoreRing } from "./ScoreRing";
import { PressableScale } from "@/components/ui/PressableScale";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation, useHaptics } from "@/hooks";
import {
  halalStatus as halalStatusTokens,
  glass,
  lightTheme,
} from "@/theme/colors";
import { fontSize as fontSizeTokens, fontWeight as fontWeightTokens } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";
import {
  SUSPENSE_DURATION,
  STATUS_CONFIG,
  type HalalStatusKey,
  type StatusVisualConfig,
} from "./scan-constants";

// ── Types ──

interface CertifierInfo {
  id: string;
  name: string;
  trustScore: number | null;
  lastVerifiedAt?: string | null;
  [key: string]: unknown;
}

interface HalalAnalysisInfo {
  tier: string;
  certifierName: string | null;
  reasons: Array<{ status: string; name: string; explanation: string; type?: string; scholarlyReference?: string | null; fatwaSourceName?: string | null; fatwaSourceUrl?: string | null }>;
}

export interface VerdictHeroProps {
  product: {
    id: string;
    name: string;
    barcode: string;
    imageUrl: string | null;
    brand: string | null;
    halalStatus: string;
  };
  halalAnalysis: HalalAnalysisInfo | null;
  certifierData: CertifierInfo | null;
  certifierTrustScore: number | null;
  effectiveHeroStatus: HalalStatusKey;
  heroLabel: string;
  userMadhab: string;
  isStaleData: boolean;
  communityVerifiedCount: number;
  onImagePress: () => void;
  onScoreDetailPress: () => void;
  /** Callback when trust score ring is pressed */
  onTrustScorePress?: () => void;
  /** Top safe-area inset so gradient extends behind status bar */
  topInset?: number;
}

// ── Component ──

export function VerdictHero({
  product,
  halalAnalysis,
  certifierData,
  certifierTrustScore,
  effectiveHeroStatus,
  heroLabel,
  userMadhab,
  isStaleData,
  communityVerifiedCount,
  onImagePress,
  onScoreDetailPress,
  onTrustScorePress,
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

  // ── Animated score counter (0 → N) ──
  const scoreDisplay = useSharedValue(0);
  const barScale = useSharedValue(0);
  const [displayedScore, setDisplayedScore] = useState(0);

  useEffect(() => {
    if (certifierTrustScore != null) {
      scoreDisplay.value = withTiming(certifierTrustScore, {
        duration: 1200,
        easing: Easing.out(Easing.cubic),
      });
      barScale.value = withTiming(certifierTrustScore / 100, {
        duration: 1400,
        easing: Easing.out(Easing.cubic),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [certifierTrustScore]);

  const roundedScore = useDerivedValue(() => Math.round(scoreDisplay.value));
  useAnimatedReaction(
    () => roundedScore.value,
    (val) => runOnJS(setDisplayedScore)(val),
  );

  const animatedBarStyle = useAnimatedStyle(() => ({
    width: `${barScale.value * 100}%`,
  }));

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
          { backgroundColor: isDark ? gradientColors[0] : gradientColors[0] },
        ]}
      />

      {/* ── ROW 1: HERO LAYOUT ── */}
      <Animated.View
        entering={FadeIn.delay(50).duration(400)}
        style={styles.heroSplit}
      >
        {/* LEFT: Product Image — glass card (preserved from existing design) */}
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
            >
              {product.imageUrl ? (
                <Image
                  source={{ uri: product.imageUrl }}
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

        {/* RIGHT COLUMN: Score label + Certifier / Verdict */}
        <View style={styles.heroInfoColumn}>
          {/* Naqiy Score label row */}
          <View style={styles.heroScoreLabelRow}>
            <Image
              source={require("@assets/images/logo_naqiy.webp")}
              style={{ width: 18, height: 18, opacity: isDark ? 0.5 : 0.35 }}
              contentFit="contain"
            />
            <Text style={[styles.heroScoreLabelText, { color: colors.textMuted }]}>
              {t.scanResult.naqiyScoreLabel}{userMadhab !== "general" && ` · ${t.madhab.options[userMadhab as "hanafi" | "shafii" | "maliki" | "hanbali"].label}`}
            </Text>
          </View>

          {/* Score Ring — Naqiy Signature */}
          <Animated.View
            entering={FadeIn.delay(SUSPENSE_DURATION + 50).duration(500)}
            style={styles.scoreRingContainer}
          >
            <Text style={[styles.scoreRingLabel, { color: colors.textMuted }]}>
              NAQIY SCORE
            </Text>
            <PressableScale
              onPress={onTrustScorePress ? () => { impact(); onTrustScorePress(); } : undefined}
              disabled={!onTrustScorePress}
              accessibilityLabel={t.scanResult.naqiyScoreLabel}
              accessibilityRole="button"
            >
              <ScoreRing
                score={certifierTrustScore ?? null}
                size={80}
                label={heroLabel}
                labelColor={statusConfig.color}
              />
            </PressableScale>
          </Animated.View>

          {/* Certifier trust score bar OR verdict fallback */}
          <Animated.View
            entering={FadeInRight.delay(SUSPENSE_DURATION + 100).duration(450)}
            style={styles.heroScoreRow}
          >
            {certifierData ? (
              <View style={styles.heroCertifierRow}>
                <View style={styles.heroCertifierBar}>
                  <View style={styles.heroCertifierHeader}>
                    <CertifierLogo certifierId={certifierData.id} size={20} fallbackColor={statusConfig.color} />
                    <Text
                      style={[styles.heroCertifierName, { color: colors.textPrimary }]}
                      numberOfLines={1}
                    >
                      {certifierData.name}
                    </Text>
                    <Text
                      style={[
                        styles.heroCertifierScore,
                        {
                          color: certifierTrustScore! >= 70
                            ? halalStatusTokens.halal.base
                            : certifierTrustScore! >= 40
                              ? halalStatusTokens.doubtful.base
                              : halalStatusTokens.haram.base,
                        },
                      ]}
                    >
                      {displayedScore}/100
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.heroCertifierBarBg,
                      { backgroundColor: isDark ? glass.dark.border : glass.light.borderStrong },
                    ]}
                  >
                    <Animated.View
                      style={[
                        styles.heroCertifierBarFill,
                        {
                          backgroundColor: certifierTrustScore! >= 70
                            ? halalStatusTokens.halal.base
                            : certifierTrustScore! >= 40
                              ? halalStatusTokens.doubtful.base
                              : halalStatusTokens.haram.base,
                        },
                        animatedBarStyle,
                      ]}
                    />
                  </View>
                  {halalAnalysis && (
                    <Text style={[styles.heroTierLabel, { color: colors.textMuted }]}>
                      {t.scanResult.tier}{" "}
                      {halalAnalysis.tier === "certified" ? "1" : halalAnalysis.tier === "analyzed_clean" ? "2" : halalAnalysis.tier === "doubtful" ? "3" : "4"}
                      {" · "}
                      {halalAnalysis.tier === "certified" ? t.scanResult.tierCertified : halalAnalysis.tier === "analyzed_clean" ? t.scanResult.tierAnalyzed : halalAnalysis.tier === "doubtful" ? t.scanResult.tierDoubtful : t.scanResult.tierUnknown}
                      {isStaleData && ` · ${t.scanResult.staleData}`}
                    </Text>
                  )}
                </View>
                {/* Score detail button */}
                <PressableScale
                  onPress={() => {
                    impact();
                    onScoreDetailPress();
                  }}
                  accessibilityLabel={t.scanResult.scoreDetailTitle}
                  accessibilityRole="button"
                >
                  <View
                    style={[
                      styles.heroHelpButton,
                      {
                        backgroundColor: isDark ? glass.dark.bg : glass.light.border,
                        borderColor: isDark ? glass.dark.border : glass.light.borderStrong,
                      },
                    ]}
                  >
                    <ChartBarIcon size={20}
                      color={isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.35)"} />
                  </View>
                </PressableScale>
              </View>
            ) : (
              <View style={styles.heroVerdictColumn}>
                <Text
                  style={[styles.heroVerdictText, { color: statusConfig.color }]}
                  numberOfLines={1}
                  accessibilityRole="header"
                >
                  {heroLabel}
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Brand */}
          {product.brand && (
            <Text
              style={[styles.heroBrandLabel, { color: colors.textMuted }]}
              numberOfLines={1}
            >
              {product.brand}
            </Text>
          )}
        </View>
      </Animated.View>

      {/* ── Product name + barcode (full-width below split) ── */}
      <View style={[
        styles.heroDivider,
        { backgroundColor: isDark ? glass.dark.border : glass.light.border },
      ]} />
      <View style={styles.heroProductRow}>
        <Text
          style={[styles.heroProductName, { color: colors.textPrimary }]}
          numberOfLines={2}
          accessibilityRole="header"
        >
          {product.name}
        </Text>
        <View style={styles.heroBarcodeChip}>
          <QrCodeIcon size={16} color={colors.textMuted} />
          <Text style={[styles.heroBarcode, { color: colors.textMuted }]}>
            {product.barcode}
          </Text>
        </View>
      </View>

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
    paddingBottom: spacing["2xl"],
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
    width: 116,
    height: 116,
    borderRadius: 22,
    borderWidth: 3,
    padding: 5,
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
  heroImage: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
  },
  heroZoomBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
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
  heroBrandLabel: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.medium,
    marginTop: spacing["2xs"],
  },
  heroInfoColumn: {
    flex: 1,
    paddingVertical: spacing.xs,
  },
  heroScoreLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  heroScoreLabelText: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.semiBold,
    letterSpacing: Platform.OS === "android" ? 0.3 : 1.5,
    textTransform: "uppercase",
  },
  heroScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    marginBottom: spacing.sm,
  },
  heroCertifierRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  heroCertifierBar: {
    flex: 1,
    gap: spacing.sm,
  },
  heroCertifierHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  heroCertifierName: {
    flex: 1,
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.semiBold,
  },
  heroCertifierScore: {
    fontSize: fontSizeTokens.caption,
    fontWeight: fontWeightTokens.bold,
  },
  heroCertifierBarBg: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  heroCertifierBarFill: {
    height: 4,
    borderRadius: 2,
  },
  heroTierLabel: {
    fontSize: 9,
    fontWeight: fontWeightTokens.medium,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  heroHelpButton: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  heroVerdictColumn: {
    flex: 1,
    gap: spacing["2xs"],
  },
  heroVerdictText: {
    fontSize: fontSizeTokens.h4,
    fontWeight: fontWeightTokens.bold,
    letterSpacing: 0.3,
  },
  heroDivider: {
    height: StyleSheet.hairlineWidth,
    width: "100%",
    marginVertical: spacing.sm,
    opacity: 0.2,
  },
  heroProductRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.lg,
  },
  heroProductName: {
    fontSize: fontSizeTokens.h4,
    fontWeight: fontWeightTokens.bold,
    lineHeight: 24,
    flex: 1,
  },
  heroBarcodeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingTop: spacing["2xs"],
  },
  heroBarcode: {
    fontSize: fontSizeTokens.micro,
    fontWeight: fontWeightTokens.medium,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  metadataBand: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.md,
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
  scoreRingContainer: {
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  scoreRingLabel: {
    fontSize: fontSizeTokens.micro ?? 10,
    fontWeight: fontWeightTokens.bold ?? "700",
    textTransform: "uppercase" as const,
    letterSpacing: 1.0,
    textAlign: "center" as const,
    marginBottom: 4,
  },
});
