/**
 * Referral Program Screen
 *
 * Displays the user's referral code, share button, and referral stats.
 * Accessible from profile settings. Premium-only (authenticated users).
 *
 * Follows the same layout pattern as certifications.tsx:
 *  - PremiumBackground + SafeAreaView
 *  - Centered header with back button
 *  - ScrollView content with Reanimated entrance animations
 */

import React from "react";
import {
  View,
  Text,
  Share,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  CopyIcon,
  ShareNetworkIcon,
  UsersIcon,
  GiftIcon,
  CloudSlashIcon,
} from "phosphor-react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import * as Clipboard from "expo-clipboard";

import { PressableScale } from "@/components/ui/PressableScale";
import { PremiumBackground } from "@/components/ui";
import { BackButton } from "@/components/ui/BackButton";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation, useHaptics } from "@/hooks";
import { trpc } from "@/lib/trpc";
import { trackEvent } from "@/lib/analytics";
import { gold } from "@/theme/colors";
import { spacing, radius } from "@/theme/spacing";
import { fontSize, fontWeight } from "@/theme/typography";

const GOLD = gold[500];

export default function ReferralScreen() {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const { impact, notification } = useHaptics();
  const [copied, setCopied] = React.useState(false);

  const { data, isLoading, isError, refetch } =
    trpc.referral.getMyReferrals.useQuery(undefined, {
      staleTime: 1000 * 60 * 10,
    });

  const handleCopy = async () => {
    if (!data?.code) return;
    await Clipboard.setStringAsync(data.code);
    notification();
    setCopied(true);
    trackEvent("referral_code_copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!data?.code) return;
    impact();
    trackEvent("referral_share_tapped");

    await Share.share({
      message: t.referral.shareMessage.replace("{code}", data.code),
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <PremiumBackground />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(300)}
          style={[
            styles.header,
            {
              backgroundColor: isDark
                ? "rgba(16, 34, 23, 0.95)"
                : "rgba(246, 248, 247, 0.95)",
            },
          ]}
        >
          <View style={styles.headerRow}>
            <BackButton />
            <Text
              style={[styles.headerTitle, { color: colors.textPrimary }]}
              accessibilityRole="header"
            >
              {t.referral.title}
            </Text>
            <View style={{ width: 44 }} />
          </View>
        </Animated.View>

        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : isError ? (
          <View style={styles.centerContainer}>
            <CloudSlashIcon size={64} color={colors.textMuted} />
            <Text
              style={[styles.errorText, { color: colors.textSecondary }]}
            >
              {t.common.loadingError}
            </Text>
            <PressableScale
              onPress={() => refetch()}
              accessibilityRole="button"
              accessibilityLabel={t.common.retry}
            >
              <View
                style={[
                  styles.retryBtn,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text
                  style={{
                    fontWeight: fontWeight.bold,
                    color: isDark ? "#102217" : "#0d1b13",
                  }}
                >
                  {t.common.retry}
                </Text>
              </View>
            </PressableScale>
          </View>
        ) : data ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Description */}
            <Animated.View
              entering={FadeInDown.delay(100).duration(400)}
              style={styles.introBlock}
            >
              <Text
                style={[styles.introText, { color: colors.textSecondary }]}
              >
                {t.referral.description}
              </Text>
            </Animated.View>

            {/* Referral Code Card */}
            <Animated.View
              entering={FadeInDown.delay(150).duration(400)}
              style={[
                styles.codeCard,
                {
                  backgroundColor: isDark
                    ? "rgba(212, 175, 55, 0.06)"
                    : "rgba(212, 175, 55, 0.04)",
                  borderColor: isDark
                    ? "rgba(212, 175, 55, 0.25)"
                    : "rgba(212, 175, 55, 0.2)",
                },
              ]}
            >
              <Text
                style={[styles.codeLabel, { color: colors.textSecondary }]}
              >
                {t.referral.yourCode}
              </Text>
              <Text style={[styles.codeValue, { color: colors.primary }]}>
                {data.code}
              </Text>
              <PressableScale
                onPress={handleCopy}
                accessibilityRole="button"
                accessibilityLabel={t.referral.copyCode}
              >
                <View style={styles.copyRow}>
                  <CopyIcon
                    size={14}
                    color={
                      copied
                        ? isDark
                          ? "#4ade80"
                          : "#16a34a"
                        : colors.textMuted
                    }
                  />
                  <Text
                    style={[
                      styles.copyText,
                      {
                        color: copied
                          ? isDark
                            ? "#4ade80"
                            : "#16a34a"
                          : colors.textMuted,
                      },
                    ]}
                  >
                    {copied ? t.referral.copied : t.referral.copyCode}
                  </Text>
                </View>
              </PressableScale>
            </Animated.View>

            {/* Share Button */}
            <Animated.View
              entering={FadeInDown.delay(200).duration(400)}
              style={styles.shareContainer}
            >
              <PressableScale
                onPress={handleShare}
                accessibilityRole="button"
                accessibilityLabel={t.referral.share}
              >
                <View
                  style={[
                    styles.shareBtn,
                    {
                      backgroundColor: isDark ? colors.primary : "#0f172a",
                    },
                  ]}
                >
                  <ShareNetworkIcon
                    size={20}
                    color={isDark ? "#0f172a" : "#fff"}
                  />
                  <Text
                    style={[
                      styles.shareBtnText,
                      { color: isDark ? "#0f172a" : "#fff" },
                    ]}
                  >
                    {t.referral.share}
                  </Text>
                </View>
              </PressableScale>
            </Animated.View>

            {/* Stats */}
            <Animated.View
              entering={FadeInDown.delay(250).duration(400)}
              style={styles.statsRow}
            >
              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.04)"
                      : colors.card,
                    borderColor: isDark
                      ? "rgba(212,175,55,0.08)"
                      : "rgba(212,175,55,0.1)",
                  },
                ]}
              >
                <UsersIcon size={24} color={colors.primary} />
                <Text
                  style={[styles.statValue, { color: colors.textPrimary }]}
                >
                  {data.totalReferrals}
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  {t.referral.friendsInvited}
                </Text>
              </View>
              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.04)"
                      : colors.card,
                    borderColor: isDark
                      ? "rgba(212,175,55,0.08)"
                      : "rgba(212,175,55,0.1)",
                  },
                ]}
              >
                <GiftIcon size={24} color={colors.primary} />
                <Text
                  style={[styles.statValue, { color: colors.textPrimary }]}
                >
                  {data.totalRewardDays}
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  {t.referral.daysEarned}
                </Text>
              </View>
            </Animated.View>

            {/* How it works */}
            <Animated.View
              entering={FadeInDown.delay(300).duration(400)}
              style={styles.howItWorksBlock}
            >
              <Text style={styles.howItWorksTitle}>
                {t.referral.howItWorks}
              </Text>
              {[t.referral.step1, t.referral.step2, t.referral.step3].map(
                (step, i) => (
                  <View key={i} style={styles.stepRow}>
                    <View
                      style={[
                        styles.stepBullet,
                        {
                          backgroundColor: isDark
                            ? "rgba(212, 175, 55, 0.1)"
                            : "rgba(212, 175, 55, 0.08)",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.stepNumber,
                          { color: colors.primary },
                        ]}
                      >
                        {i + 1}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.stepText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {step}
                    </Text>
                  </View>
                ),
              )}
            </Animated.View>
          </ScrollView>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────

const styles = StyleSheet.create({
  // Header
  header: {
    paddingHorizontal: spacing["2xl"],
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: fontWeight.bold,
    flex: 1,
    textAlign: "center",
  },

  // Intro
  introBlock: {
    paddingHorizontal: spacing["2xl"],
    marginTop: spacing.md,
    marginBottom: spacing["2xl"],
  },
  introText: {
    fontSize: fontSize.body,
    lineHeight: 20,
  },

  // Code Card
  codeCard: {
    marginHorizontal: spacing.xl,
    borderRadius: radius.lg,
    padding: spacing["2xl"],
    alignItems: "center",
    marginBottom: spacing["2xl"],
    borderWidth: 1.5,
  },
  codeLabel: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.md,
  },
  codeValue: {
    fontSize: 30,
    fontWeight: fontWeight.black,
    letterSpacing: Platform.OS === "android" ? 3 : 6,
    marginBottom: spacing.lg,
  },
  copyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  copyText: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
  },

  // Share
  shareContainer: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing["2xl"],
  },
  shareBtn: {
    height: 56,
    borderRadius: radius.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  shareBtnText: {
    fontWeight: fontWeight.bold,
    fontSize: fontSize.body,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: spacing.lg,
    marginHorizontal: spacing.xl,
    marginBottom: spacing["2xl"],
  },
  statCard: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: "center",
    borderWidth: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: fontWeight.bold,
    marginTop: spacing.sm,
  },
  statLabel: {
    fontSize: fontSize.caption,
    marginTop: spacing.xs,
  },

  // How it works
  howItWorksBlock: {
    marginHorizontal: spacing["2xl"],
    marginBottom: spacing["3xl"],
  },
  howItWorksTitle: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    textTransform: "uppercase",
    letterSpacing: Platform.OS === "android" ? 0.2 : 1,
    color: GOLD,
    marginBottom: spacing.lg,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  stepBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  stepNumber: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.bold,
  },
  stepText: {
    fontSize: fontSize.body,
    flex: 1,
    lineHeight: 20,
  },

  // States
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    marginTop: 16,
  },
  retryBtn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.md,
  },
});
