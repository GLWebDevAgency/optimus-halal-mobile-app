/**
 * InlineScanSections — Standalone inline sections for the scan-result orchestrator.
 *
 * Two discrete, tree-shakeable components that slot into the continuous-scroll
 * scan-result layout without pulling in the full HalalAnalysisSection bundle:
 *
 *  - CommunityVoteCard   — thumbs up/down "is this result accurate?" card
 *  - NewProductBanner    — subtle gold banner for newly-added products
 *
 * @module components/scan/InlineScanSections
 */

import React, { useCallback } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import {
  ShieldCheckIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  MegaphoneIcon,
} from "phosphor-react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";

import { GlowCard } from "@/components/ui/GlowCard";
import { PressableScale } from "@/components/ui/PressableScale";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation, useHaptics } from "@/hooks";
import {
  halalStatus as halalStatusTokens,
  brand as brandTokens,
  glass,
} from "@/theme/colors";
import { fontSize, fontWeight } from "@/theme/typography";
import { spacing, radius } from "@/theme/spacing";

// ── Spring config ─────────────────────────────────────────────
/** Signature Naqiy spring: responsive yet velvet-soft landing. */
const springNaqiy = { damping: 14, stiffness: 170, mass: 0.9 } as const;

// ── Stagger helper ────────────────────────────────────────────
const STAGGER_DELAY_MS = 60;
function staggerDelay(index: number): number {
  return index * STAGGER_DELAY_MS;
}

// ─────────────────────────────────────────────────────────────
// Component 1: CommunityVoteCard
// ─────────────────────────────────────────────────────────────

export interface CommunityVoteCardProps {
  onVote: (vote: "up" | "down" | null) => void;
  userVote: "up" | "down" | null;
  staggerIndex?: number;
}

export const CommunityVoteCard = React.memo(function CommunityVoteCard({
  onVote,
  userVote,
  staggerIndex = 0,
}: CommunityVoteCardProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const { impact } = useHaptics();

  const handleUpPress = useCallback(() => {
    impact();
    onVote(userVote === "up" ? null : "up");
  }, [impact, onVote, userVote]);

  const handleDownPress = useCallback(() => {
    impact();
    onVote(userVote === "down" ? null : "down");
  }, [impact, onVote, userVote]);

  // Derived styles for vote buttons
  const upSelected = userVote === "up";
  const downSelected = userVote === "down";

  const upBg = upSelected
    ? isDark
      ? halalStatusTokens.halal.bgDark
      : halalStatusTokens.halal.bg
    : isDark
    ? glass.dark.bg
    : glass.light.bg;

  const upBorder = upSelected
    ? colors.primary
    : isDark
    ? glass.dark.borderStrong
    : glass.light.borderStrong;

  const downBg = downSelected
    ? isDark
      ? halalStatusTokens.haram.bgDark
      : halalStatusTokens.haram.bg
    : isDark
    ? glass.dark.bg
    : glass.light.bg;

  const downBorder = downSelected
    ? halalStatusTokens.haram.base
    : isDark
    ? glass.dark.borderStrong
    : glass.light.borderStrong;

  return (
    <Animated.View
      entering={FadeInUp.duration(300)
        .delay(staggerDelay(staggerIndex))
        .springify()
        .damping(springNaqiy.damping)
        .stiffness(springNaqiy.stiffness)
        .mass(springNaqiy.mass)}
    >
      <GlowCard
        glowColor={brandTokens.gold}
        glowIntensity="subtle"
        style={styles.voteCard}
      >
        {/* Shield icon */}
        <View
          style={[
            styles.voteShieldIcon,
            {
              backgroundColor: isDark
                ? glass.dark.border
                : glass.dark.highlight,
            },
          ]}
        >
          <ShieldCheckIcon size={18} color={brandTokens.gold} weight="fill" />
        </View>

        {/* Titles */}
        <Text
          style={[styles.voteTitle, { color: colors.textPrimary }]}
          accessibilityRole="header"
        >
          {t.scanResult.yourOpinionMatters}
        </Text>
        <Text style={[styles.voteSubtitle, { color: colors.textSecondary }]}>
          {t.scanResult.isThisResultAccurate}
        </Text>

        {/* Vote buttons */}
        <View style={styles.voteButtonRow}>
          {/* Thumbs Up */}
          <PressableScale
            onPress={handleUpPress}
            style={[
              styles.voteButton,
              {
                backgroundColor: upBg,
                borderWidth: upSelected ? 2 : 1,
                borderColor: upBorder,
                ...(upSelected
                  ? {
                      shadowColor: colors.primary,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.3,
                      shadowRadius: 10,
                      elevation: 4,
                    }
                  : Platform.OS === "android"
                  ? {}
                  : {}),
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t.scanResult.accurateResult}
            accessibilityState={{ selected: upSelected }}
            activeScale={0.93}
          >
            <ThumbsUpIcon
              size={24}
              color={upSelected ? colors.primary : colors.textSecondary}
              weight={upSelected ? "fill" : "regular"}
            />
          </PressableScale>

          {/* Thumbs Down */}
          <PressableScale
            onPress={handleDownPress}
            style={[
              styles.voteButton,
              {
                backgroundColor: downBg,
                borderWidth: downSelected ? 2 : 1,
                borderColor: downBorder,
                ...(downSelected
                  ? {
                      shadowColor: halalStatusTokens.haram.base,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.3,
                      shadowRadius: 10,
                      elevation: 4,
                    }
                  : Platform.OS === "android"
                  ? {}
                  : {}),
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t.scanResult.inaccurateResult}
            accessibilityState={{ selected: downSelected }}
            activeScale={0.93}
          >
            <ThumbsDownIcon
              size={24}
              color={
                downSelected
                  ? halalStatusTokens.haram.base
                  : colors.textSecondary
              }
              weight={downSelected ? "fill" : "regular"}
            />
          </PressableScale>
        </View>

        {/* Thank-you confirmation */}
        {userVote !== null && (
          <Animated.View entering={FadeIn.duration(300)}>
            <Text
              style={[styles.voteThanks, { color: colors.textMuted }]}
              accessibilityLiveRegion="polite"
            >
              {t.scanResult.thankYouForFeedback}
            </Text>
          </Animated.View>
        )}
      </GlowCard>
    </Animated.View>
  );
});

// ─────────────────────────────────────────────────────────────
// Component 3: NewProductBanner
// ─────────────────────────────────────────────────────────────

export interface NewProductBannerProps {
  staggerIndex?: number;
}

export const NewProductBanner = React.memo(function NewProductBanner({
  staggerIndex = 0,
}: NewProductBannerProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  // gold[500] = brandTokens.gold = "#D4AF37"
  const goldBase = brandTokens.gold;
  const borderColor = isDark ? `${goldBase}25` : `${goldBase}18`;
  const bgColor = isDark ? `${goldBase}0A` : `${goldBase}08`;
  const titleColor = isDark ? "#f6e18a" : "#7f501b"; // gold[200] / gold[800]
  const descColor = isDark ? "#f0cc47cc" : "#9a6518cc"; // gold[300] / gold[700] with alpha

  return (
    <Animated.View
      entering={FadeInUp.duration(300)
        .delay(staggerDelay(staggerIndex))
        .springify()
        .damping(springNaqiy.damping)
        .stiffness(springNaqiy.stiffness)
        .mass(springNaqiy.mass)}
    >
      <View
        style={[
          styles.newProductBanner,
          {
            backgroundColor: bgColor,
            borderColor: borderColor,
          },
        ]}
        accessibilityRole="none"
        accessibilityLabel={t.scanResult.newProductAdded}
      >
        <View style={styles.newProductContent}>
          {/* Icon */}
          <View
            style={[
              styles.newProductIconCircle,
              {
                backgroundColor: `${goldBase}18`,
              },
            ]}
          >
            <MegaphoneIcon size={16} color={goldBase} weight="fill" />
          </View>

          {/* Text block */}
          <View style={styles.newProductTextBlock}>
            <Text
              style={[styles.newProductTitle, { color: titleColor }]}
              numberOfLines={1}
            >
              {t.scanResult.newProductAdded}
            </Text>
            <Text
              style={[styles.newProductDesc, { color: descColor }]}
              numberOfLines={2}
            >
              {t.scanResult.newProductAddedDesc}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
});

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── CommunityVoteCard ─────────────────────────────────────
  voteCard: {
    gap: spacing.sm,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
  },
  voteShieldIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  voteTitle: {
    fontSize: fontSize.h4,
    fontWeight: fontWeight.bold,
  },
  voteSubtitle: {
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.regular,
  },
  voteButtonRow: {
    flexDirection: "row",
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  voteButton: {
    // WCAG AA: minimum 56x56 touch target
    width: 56,
    height: 56,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  voteThanks: {
    fontSize: fontSize.caption,
    fontStyle: "italic",
    marginTop: spacing.xs,
    textAlign: "center",
  },

  // ── NewProductBanner ──────────────────────────────────────
  newProductBanner: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.xl,
  },
  newProductContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.lg,
  },
  newProductIconCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  newProductTextBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  newProductTitle: {
    fontSize: fontSize.bodySmall,
    fontWeight: fontWeight.semiBold,
  },
  newProductDesc: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.regular,
    lineHeight: 17,
  },
});
