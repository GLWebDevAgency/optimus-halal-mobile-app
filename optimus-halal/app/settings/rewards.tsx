/**
 * Rewards Catalog Screen
 *
 * Premium rewards shop where users exchange loyalty points
 * for exclusive rewards. Displays balance, available rewards,
 * and claimed rewards with redemption codes.
 */

import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Clipboard,
} from "react-native";
import { PressableScale } from "@/components/ui/PressableScale";
import { PremiumBackground } from "@/components/ui";
import { Skeleton } from "@/components/ui/Skeleton";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { useHaptics } from "@/hooks/useHaptics";
import {
  useLoyaltyBalance,
  useRewards,
  useClaimReward,
  useMyRewards,
} from "@/hooks/useLoyalty";

const GOLD = "#d4af37";

const LOCALE_MAP: Record<string, string> = { fr: "fr-FR", en: "en-US", ar: "ar-SA" };

// ── Types ─────────────────────────────────────────────

interface RewardItem {
  id: string;
  name: string;
  nameFr: string | null;
  nameAr: string | null;
  description: string | null;
  descriptionFr: string | null;
  imageUrl: string | null;
  pointsCost: number;
  category: string | null;
  partnerName: string | null;
  remainingQuantity: number | null;
  isActive: boolean;
  expiresAt: string | null;
}

interface ClaimedRewardItem {
  userReward: {
    id: string;
    redemptionCode: string | null;
    claimedAt: string;
    status: string;
  };
  reward: RewardItem;
}

// ── Reward Card ───────────────────────────────────────

interface RewardCardProps {
  reward: RewardItem;
  index: number;
  userPoints: number;
  onClaim: (reward: RewardItem) => void;
  isDark: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
  t: ReturnType<typeof useTranslation>["t"];
  isClaiming: boolean;
}

const RewardCard = React.memo(function RewardCard({
  reward,
  index,
  userPoints,
  onClaim,
  isDark,
  colors,
  t,
  isClaiming,
}: RewardCardProps) {
  const isOutOfStock =
    reward.remainingQuantity !== null && reward.remainingQuantity <= 0;
  const canAfford = userPoints >= reward.pointsCost;
  const isDisabled = isOutOfStock || !canAfford || isClaiming;
  const pointsNeeded = reward.pointsCost - userPoints;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).duration(400)}
      style={[
        styles.rewardCard,
        {
          backgroundColor: isDark ? "rgba(255,255,255,0.03)" : colors.card,
          borderColor: isDark ? "rgba(212,175,55,0.08)" : "rgba(212,175,55,0.1)",
          opacity: isOutOfStock ? 0.5 : 1,
        },
      ]}
    >
      {/* Reward Icon / Image */}
      <View
        style={[
          styles.rewardIconContainer,
          {
            backgroundColor: isDark
              ? "rgba(34,197,94,0.08)"
              : "rgba(34,197,94,0.06)",
          },
        ]}
      >
        {reward.imageUrl ? (
          <Image
            source={{ uri: reward.imageUrl }}
            style={styles.rewardImage}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <MaterialIcons
            name="card-giftcard"
            size={28}
            color={isDark ? "#4ade80" : "#22c55e"}
          />
        )}
      </View>

      {/* Reward Info */}
      <View style={styles.rewardInfo}>
        <Text
          style={[styles.rewardName, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {reward.nameFr ?? reward.name}
        </Text>
        <Text
          style={[styles.rewardDescription, { color: colors.textMuted }]}
          numberOfLines={2}
        >
          {reward.descriptionFr ?? reward.description ?? ""}
        </Text>
        {reward.partnerName && (
          <Text style={[styles.rewardPartner, { color: colors.textSecondary }]}>
            {reward.partnerName}
          </Text>
        )}
      </View>

      {/* Points Cost + Action */}
      <View style={styles.rewardAction}>
        {/* Points badge */}
        <View
          style={[
            styles.pointsBadge,
            {
              backgroundColor: canAfford
                ? isDark
                  ? "rgba(34,197,94,0.15)"
                  : "rgba(34,197,94,0.10)"
                : isDark
                  ? "rgba(156,163,175,0.15)"
                  : "rgba(156,163,175,0.10)",
            },
          ]}
        >
          <MaterialIcons
            name="stars"
            size={14}
            color={canAfford ? (isDark ? "#4ade80" : "#22c55e") : colors.textMuted}
          />
          <Text
            style={[
              styles.pointsCostText,
              {
                color: canAfford
                  ? isDark
                    ? "#4ade80"
                    : "#15803d"
                  : colors.textMuted,
              },
            ]}
          >
            {reward.pointsCost}
          </Text>
        </View>

        {/* Action button */}
        {isOutOfStock ? (
          <View
            style={[
              styles.outOfStockBadge,
              {
                backgroundColor: isDark
                  ? "rgba(239,68,68,0.15)"
                  : "rgba(239,68,68,0.10)",
              },
            ]}
          >
            <Text
              style={[
                styles.outOfStockText,
                { color: isDark ? "#f87171" : "#dc2626" },
              ]}
            >
              {t.rewards.outOfStock}
            </Text>
          </View>
        ) : canAfford ? (
          <PressableScale
            onPress={() => onClaim(reward)}
            disabled={isClaiming}
            accessibilityRole="button"
            accessibilityLabel={`${t.rewards.claim} ${reward.nameFr ?? reward.name}`}
          >
            <View
              style={{
                borderRadius: 10,
                overflow: "hidden",
                shadowColor: "#10b981",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 20,
                elevation: 8,
              }}
            >
              <LinearGradient
                colors={["#10b981", "#059669"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.claimButton}
              >
                {isClaiming ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.claimButtonText}>{t.rewards.claim}</Text>
                )}
              </LinearGradient>
            </View>
          </PressableScale>
        ) : (
          <View style={styles.missingPointsContainer}>
            <Text
              style={[styles.missingPointsText, { color: colors.textMuted }]}
            >
              {pointsNeeded} {t.rewards.pointsMissing}
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
});

// ── Claimed Reward Card ───────────────────────────────

interface ClaimedCardProps {
  item: ClaimedRewardItem;
  index: number;
  isDark: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
  t: ReturnType<typeof useTranslation>["t"];
  language: string;
}

const ClaimedRewardCard = React.memo(function ClaimedRewardCard({
  item,
  index,
  isDark,
  colors,
  t,
  language,
}: ClaimedCardProps) {
  const locale = LOCALE_MAP[language] ?? "fr-FR";
  const claimedDate = new Date(item.userReward.claimedAt);
  const dateStr = claimedDate.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const handleCopyCode = useCallback(() => {
    if (item.userReward.redemptionCode) {
      Clipboard.setString(item.userReward.redemptionCode);
    }
  }, [item.userReward.redemptionCode]);

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).duration(400)}
      style={[
        styles.claimedCard,
        {
          backgroundColor: isDark ? "rgba(255,255,255,0.03)" : colors.card,
          borderColor: isDark ? "rgba(212,175,55,0.08)" : "rgba(212,175,55,0.1)",
        },
      ]}
    >
      <View style={styles.claimedCardHeader}>
        <View style={styles.claimedCardInfo}>
          <MaterialIcons
            name="verified"
            size={20}
            color={isDark ? "#4ade80" : "#22c55e"}
          />
          <View style={styles.claimedCardTextContainer}>
            <Text
              style={[styles.claimedRewardName, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {item.reward.nameFr ?? item.reward.name}
            </Text>
            <Text style={[styles.claimedDate, { color: colors.textMuted }]}>
              {dateStr}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.claimedBadge,
            {
              backgroundColor: "rgba(212,175,55,0.15)",
            },
          ]}
        >
          <Text
            style={[
              styles.claimedBadgeText,
              { color: GOLD },
            ]}
          >
            {t.rewards.claimed}
          </Text>
        </View>
      </View>

      {/* Redemption Code */}
      {item.userReward.redemptionCode && (
        <PressableScale
          onPress={handleCopyCode}
          accessibilityRole="button"
          accessibilityLabel={`${t.rewards.redemptionCode}: ${item.userReward.redemptionCode}`}
          accessibilityHint="Appuyez pour copier le code"
        >
          <View
            style={[
              styles.codeContainer,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.04)"
                  : "rgba(0,0,0,0.03)",
                borderColor: colors.borderLight,
              },
            ]}
          >
            <View style={styles.codeRow}>
              <Text style={[styles.codeLabel, { color: colors.textMuted }]}>
                {t.rewards.redemptionCode}
              </Text>
              <MaterialIcons name="content-copy" size={14} color={colors.textMuted} />
            </View>
            <Text
              style={[
                styles.codeValue,
                { color: isDark ? "#4ade80" : "#15803d" },
              ]}
            >
              {item.userReward.redemptionCode}
            </Text>
          </View>
        </PressableScale>
      )}
    </Animated.View>
  );
});

// ── Skeleton Loader ───────────────────────────────────

function SkeletonLoader() {
  return (
    <View style={styles.skeletonContainer}>
      <Skeleton width="100%" height={120} borderRadius={20} style={{ marginBottom: 24 }} />
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} width="100%" height={88} borderRadius={16} style={{ marginBottom: 12 }} />
      ))}
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────

export default function RewardsScreen() {
  const { isDark, colors } = useTheme();
  const { t, language } = useTranslation();
  const { impact, notification } = useHaptics();

  // Data hooks
  const {
    data: balance,
    isLoading: balanceLoading,
  } = useLoyaltyBalance();
  const { data: rewardsList, isLoading: rewardsLoading } = useRewards();
  const { data: myRewards, isLoading: myRewardsLoading } = useMyRewards();
  const claimReward = useClaimReward();

  const isLoading = balanceLoading || rewardsLoading || myRewardsLoading;

  const userPoints = balance?.points ?? 0;
  const userLevel = balance?.level ?? 1;

  // Handle claim
  const handleClaim = useCallback(
    (reward: RewardItem) => {
      impact();
      Alert.alert(
        t.rewards.confirmTitle,
        t.rewards.confirmBody
          .replace("{{cost}}", String(reward.pointsCost))
          .replace("{{name}}", reward.nameFr ?? reward.name),
        [
          { text: t.common.cancel, style: "cancel" },
          {
            text: t.common.confirm,
            style: "default",
            onPress: () => {
              claimReward.mutate(
                { rewardId: reward.id },
                {
                  onSuccess: () => {
                    notification();
                    Alert.alert(t.common.success, t.rewards.claimSuccess);
                  },
                  onError: () => {
                    Alert.alert(t.common.error, t.errors.generic);
                  },
                },
              );
            },
          },
        ],
      );
    },
    [t, impact, notification, claimReward],
  );

  // Reward key extractor
  const rewardKeyExtractor = useCallback(
    (item: RewardItem) => item.id,
    [],
  );

  // Render reward card
  const renderRewardCard = useCallback(
    ({ item, index }: { item: RewardItem; index: number }) => (
      <RewardCard
        reward={item}
        index={index}
        userPoints={userPoints}
        onClaim={handleClaim}
        isDark={isDark}
        colors={colors}
        t={t}
        isClaiming={claimReward.isPending}
      />
    ),
    [userPoints, handleClaim, isDark, colors, t, claimReward.isPending],
  );

  // Memoized rewards list as typed array
  const typedRewardsList = useMemo(
    () => (rewardsList as RewardItem[] | undefined) ?? [],
    [rewardsList],
  );

  const typedMyRewards = useMemo(
    () => (myRewards as ClaimedRewardItem[] | undefined) ?? [],
    [myRewards],
  );

  // ── Loading ─────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={{ flex: 1 }}>
        <PremiumBackground />
        <SafeAreaView style={[styles.container]}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              style={[
                styles.backButton,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.borderLight,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t.common.back}
            >
              <MaterialIcons
                name="arrow-back"
                size={20}
                color={colors.textPrimary}
              />
            </Pressable>
            <Text
              style={[styles.headerTitle, { color: colors.textPrimary }]}
              accessibilityRole="header"
            >
              {t.rewards.title}
            </Text>
            <View style={styles.headerSpacer} />
          </View>
          <SkeletonLoader />
        </SafeAreaView>
      </View>
    );
  }

  // ── Header Component for FlatList ───────────────────
  const ListHeader = (
    <>
      {/* Points Balance Banner */}
      <Animated.View
        entering={FadeIn.duration(500)}
        style={[
          styles.balanceBanner,
          {
            backgroundColor: isDark
              ? "rgba(212,175,55,0.06)"
              : "rgba(212,175,55,0.04)",
            borderColor: isDark
              ? "rgba(212,175,55,0.15)"
              : "rgba(212,175,55,0.12)",
          },
        ]}
      >
        <View style={styles.balanceRow}>
          <View style={styles.balanceLeft}>
            <View style={styles.pointsRow}>
              <MaterialIcons
                name="stars"
                size={32}
                color={GOLD}
              />
              <Text
                style={[
                  styles.pointsNumber,
                  { color: GOLD },
                ]}
              >
                {userPoints.toLocaleString()}
              </Text>
            </View>
            <Text style={[styles.pointsLabel, { color: colors.textSecondary }]}>
              {t.rewards.yourPoints}
            </Text>
          </View>
          <View
            style={[
              styles.levelBadge,
              {
                backgroundColor: isDark
                  ? "rgba(212,175,55,0.15)"
                  : "rgba(212,175,55,0.1)",
                borderColor: isDark
                  ? "rgba(212,175,55,0.25)"
                  : "rgba(212,175,55,0.18)",
              },
            ]}
          >
            <MaterialIcons
              name="shield"
              size={16}
              color={GOLD}
            />
            <Text
              style={[
                styles.levelText,
                { color: GOLD },
              ]}
            >
              {t.rewards.level.replace("{{level}}", String(userLevel))}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Section Title: Available Rewards */}
      <Animated.View
        entering={FadeIn.delay(200).duration(400)}
        style={styles.sectionHeader}
      >
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          {t.rewards.availableRewards}
        </Text>
        <Text style={[styles.sectionCount, { color: colors.textMuted }]}>
          {typedRewardsList.length}
        </Text>
      </Animated.View>
    </>
  );

  // ── Footer: My Rewards ──────────────────────────────
  const ListFooter = (
    <View style={styles.footerContainer}>
      {/* Section Title: My Rewards */}
      <Animated.View
        entering={FadeIn.delay(300).duration(400)}
        style={styles.sectionHeader}
      >
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          {t.rewards.myRewards}
        </Text>
        <Text style={[styles.sectionCount, { color: colors.textMuted }]}>
          {typedMyRewards.length}
        </Text>
      </Animated.View>

      {typedMyRewards.length === 0 ? (
        <Animated.View
          entering={FadeInDown.delay(400).duration(400)}
          style={[
            styles.emptyClaimedCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.borderLight,
            },
          ]}
        >
          <MaterialIcons
            name="redeem"
            size={40}
            color={colors.textMuted}
          />
          <Text
            style={[
              styles.emptyClaimedText,
              { color: colors.textSecondary },
            ]}
          >
            {t.rewards.noClaimedRewards}
          </Text>
        </Animated.View>
      ) : (
        typedMyRewards.map((item, index) => (
          <ClaimedRewardCard
            key={item.userReward.id}
            item={item}
            index={index}
            isDark={isDark}
            colors={colors}
            t={t}
            language={language}
          />
        ))
      )}
    </View>
  );

  // ── Empty State ─────────────────────────────────────
  const EmptyRewards = (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="card-giftcard" size={64} color={colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
        {t.rewards.empty}
      </Text>
      <Text style={[styles.emptyDescription, { color: colors.textMuted }]}>
        {t.rewards.emptyDesc}
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <PremiumBackground />
      <SafeAreaView style={[styles.container]}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={[
            styles.backButton,
            {
              backgroundColor: colors.card,
              borderColor: colors.borderLight,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t.common.back}
          accessibilityHint={t.editProfile.backHint}
        >
          <MaterialIcons
            name="arrow-back"
            size={20}
            color={colors.textPrimary}
          />
        </Pressable>
        <Text
          style={[styles.headerTitle, { color: colors.textPrimary }]}
          accessibilityRole="header"
        >
          {t.rewards.title}
        </Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

        {/* Main Content */}
        <FlatList
          data={typedRewardsList}
          keyExtractor={rewardKeyExtractor}
          renderItem={renderRewardCard}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          ListEmptyComponent={EmptyRewards}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: {
    height: 44,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    borderWidth: 1,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  headerSpacer: {
    width: 44,
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  // Balance Banner
  balanceBanner: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    marginBottom: 24,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  balanceLeft: {
    flex: 1,
  },
  pointsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pointsNumber: {
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -1,
  },
  pointsLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 4,
    marginLeft: 42,
  },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  levelText: {
    fontSize: 13,
    fontWeight: "700",
  },

  // Section Header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Reward Card
  rewardCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  rewardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  rewardImage: {
    width: 56,
    height: 56,
    borderRadius: 14,
  },
  rewardInfo: {
    flex: 1,
    marginLeft: 14,
    marginRight: 10,
  },
  rewardName: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  rewardDescription: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 3,
  },
  rewardPartner: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: "500",
  },
  rewardAction: {
    alignItems: "flex-end",
    gap: 8,
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  pointsCostText: {
    fontSize: 14,
    fontWeight: "800",
  },

  // Claim button
  claimButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 80,
    alignItems: "center",
  },
  claimButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },

  // Out of stock
  outOfStockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  outOfStockText: {
    fontSize: 11,
    fontWeight: "700",
  },

  // Missing points
  missingPointsContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  missingPointsText: {
    fontSize: 11,
    fontWeight: "600",
  },

  // Claimed Card
  claimedCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  claimedCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  claimedCardInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  claimedCardTextContainer: {
    flex: 1,
  },
  claimedRewardName: {
    fontSize: 14,
    fontWeight: "700",
  },
  claimedDate: {
    fontSize: 11,
    marginTop: 2,
  },
  claimedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  claimedBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },

  // Code Container
  codeContainer: {
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  codeValue: {
    fontSize: 18,
    fontWeight: "800",
    fontFamily: "monospace",
    letterSpacing: 2,
  },

  // Empty state
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 32,
  },

  // Empty Claimed
  emptyClaimedCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    padding: 32,
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  emptyClaimedText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },

  // Footer
  footerContainer: {
    marginTop: 24,
  },

  // Skeleton
  skeletonContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
});
