/**
 * Leaderboard Screen
 *
 * Premium gamified leaderboard with animated podium (top 3)
 * and ranked list (4th place onward). Current user is highlighted.
 */

import React, { useMemo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { useTranslation, useMe, useLeaderboard, useHaptics } from "@/hooks";

// -- Types ------------------------------------------------------------------

interface LeaderboardEntry {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  level: number | null;
  experiencePoints: number | null;
  totalScans: number | null;
}

// -- Constants --------------------------------------------------------------

const PODIUM_COLORS = {
  gold: "#FFD700",
  goldBg: "rgba(255,215,0,0.15)",
  silver: "#C0C0C0",
  silverBg: "rgba(192,192,192,0.15)",
  bronze: "#CD7F32",
  bronzeBg: "rgba(205,127,50,0.15)",
} as const;

function getMedalColor(rank: number) {
  if (rank === 1) return { border: PODIUM_COLORS.gold, bg: PODIUM_COLORS.goldBg };
  if (rank === 2) return { border: PODIUM_COLORS.silver, bg: PODIUM_COLORS.silverBg };
  return { border: PODIUM_COLORS.bronze, bg: PODIUM_COLORS.bronzeBg };
}

function getMedalIcon(rank: number): keyof typeof MaterialIcons.glyphMap {
  if (rank === 1) return "emoji-events";
  if (rank === 2) return "military-tech";
  return "workspace-premium";
}

// -- Avatar Component -------------------------------------------------------

function Avatar({
  uri,
  size,
  borderColor,
  borderWidth: bw,
}: {
  uri: string | null;
  size: number;
  borderColor: string;
  borderWidth: number;
}) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor,
            borderWidth: bw,
          },
        ]}
        contentFit="cover"
        transition={200}
      />
    );
  }

  return (
    <View
      style={[
        styles.avatarPlaceholder,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor,
          borderWidth: bw,
        },
      ]}
    >
      <MaterialIcons name="person" size={size * 0.5} color={borderColor} />
    </View>
  );
}

// -- Podium Card Component --------------------------------------------------

function PodiumCard({
  entry,
  rank,
  isDark,
  colors,
  isCurrentUser,
  t,
}: {
  entry: LeaderboardEntry;
  rank: number;
  isDark: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
  isCurrentUser: boolean;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const medal = getMedalColor(rank);
  const isFirst = rank === 1;
  const avatarSize = isFirst ? 64 : 48;

  return (
    <Animated.View
      entering={FadeInDown.delay(rank === 1 ? 100 : rank === 2 ? 0 : 200).duration(400)}
      style={[
        styles.podiumCard,
        {
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#ffffff",
          borderColor: isCurrentUser
            ? colors.primary
            : isDark
              ? "rgba(255,255,255,0.08)"
              : "rgba(0,0,0,0.06)",
          borderWidth: isCurrentUser ? 1.5 : 1,
          marginTop: isFirst ? 0 : 24,
        },
      ]}
    >
      {/* Crown / medal icon */}
      <View style={styles.podiumMedalRow}>
        <MaterialIcons
          name={getMedalIcon(rank)}
          size={isFirst ? 28 : 22}
          color={medal.border}
        />
      </View>

      {/* Avatar */}
      <View
        style={[
          styles.podiumAvatarWrap,
          isFirst && {
            shadowColor: PODIUM_COLORS.gold,
            shadowOpacity: 0.4,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 8,
          },
        ]}
      >
        <Avatar
          uri={entry.avatarUrl}
          size={avatarSize}
          borderColor={medal.border}
          borderWidth={isFirst ? 3 : 2}
        />
      </View>

      {/* Name */}
      <Text
        style={[styles.podiumName, { color: colors.textPrimary }]}
        numberOfLines={1}
      >
        {entry.displayName ?? "---"}
      </Text>

      {/* "You" badge */}
      {isCurrentUser && (
        <View style={[styles.youBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.youBadgeText}>{t.leaderboard.you}</Text>
        </View>
      )}

      {/* Level badge */}
      <View style={[styles.podiumLevelBadge, { backgroundColor: medal.bg }]}>
        <Text style={[styles.podiumLevelText, { color: medal.border }]}>
          {t.leaderboard.level} {entry.level ?? 1}
        </Text>
      </View>

      {/* XP */}
      <Text style={[styles.podiumXp, { color: colors.textSecondary }]}>
        {formatXp(entry.experiencePoints)} {t.leaderboard.xp}
      </Text>
    </Animated.View>
  );
}

// -- Ranked Row Component ---------------------------------------------------

const RankedRow = React.memo(function RankedRow({
  entry,
  rank,
  isDark,
  colors,
  isCurrentUser,
  isOdd,
  t,
}: {
  entry: LeaderboardEntry;
  rank: number;
  isDark: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
  isCurrentUser: boolean;
  isOdd: boolean;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const rowBg = isCurrentUser
    ? isDark
      ? "rgba(19,236,106,0.08)"
      : "rgba(19,236,106,0.06)"
    : isOdd
      ? isDark
        ? "rgba(255,255,255,0.02)"
        : "rgba(0,0,0,0.015)"
      : "transparent";

  return (
    <Animated.View entering={FadeInDown.delay((rank - 4) * 40).duration(300)}>
      <View
        style={[
          styles.rankedRow,
          {
            backgroundColor: rowBg,
            borderColor: isCurrentUser
              ? colors.primary
              : isDark
                ? "rgba(255,255,255,0.04)"
                : "rgba(0,0,0,0.03)",
            borderWidth: isCurrentUser ? 1 : 0.5,
          },
        ]}
      >
        {/* Rank number */}
        <View style={styles.rankNumberWrap}>
          <Text style={[styles.rankNumber, { color: colors.textMuted }]}>
            {rank}
          </Text>
        </View>

        {/* Avatar */}
        <Avatar
          uri={entry.avatarUrl}
          size={32}
          borderColor={isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"}
          borderWidth={1}
        />

        {/* Name + "You" badge */}
        <View style={styles.rankedNameWrap}>
          <Text
            style={[styles.rankedName, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {entry.displayName ?? "---"}
          </Text>
          {isCurrentUser && (
            <View style={[styles.youBadgeSmall, { backgroundColor: colors.primary }]}>
              <Text style={styles.youBadgeSmallText}>{t.leaderboard.you}</Text>
            </View>
          )}
        </View>

        {/* Level */}
        <View
          style={[
            styles.rankedLevelBadge,
            {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.06)"
                : "rgba(0,0,0,0.04)",
            },
          ]}
        >
          <Text style={[styles.rankedLevelText, { color: colors.textSecondary }]}>
            {t.leaderboard.level} {entry.level ?? 1}
          </Text>
        </View>

        {/* XP */}
        <Text style={[styles.rankedXp, { color: colors.textSecondary }]}>
          {formatXp(entry.experiencePoints)}
        </Text>

        {/* Scans */}
        <View style={styles.rankedScansWrap}>
          <Text style={[styles.rankedScans, { color: colors.textMuted }]}>
            {entry.totalScans ?? 0}
          </Text>
          <MaterialIcons name="qr-code-scanner" size={10} color={colors.textMuted} />
        </View>
      </View>
    </Animated.View>
  );
});

// -- Skeleton Components ----------------------------------------------------

function SkeletonPodium({ isDark }: { isDark: boolean }) {
  const bg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  return (
    <View style={styles.podiumSection}>
      {[48, 64, 48].map((size, i) => (
        <View key={i} style={[styles.podiumCard, { backgroundColor: bg, marginTop: i === 1 ? 0 : 24 }]}>
          <View style={[styles.skeletonCircle, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]} />
          <View style={[styles.skeletonBar, { width: 60, backgroundColor: bg }]} />
          <View style={[styles.skeletonBar, { width: 40, backgroundColor: bg }]} />
        </View>
      ))}
    </View>
  );
}

function SkeletonRow({ isDark }: { isDark: boolean }) {
  const bg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  return (
    <View style={[styles.rankedRow, { borderWidth: 0 }]}>
      <View style={[styles.skeletonCircle, { width: 24, height: 24, borderRadius: 12, backgroundColor: bg }]} />
      <View style={[styles.skeletonCircle, { width: 32, height: 32, borderRadius: 16, backgroundColor: bg }]} />
      <View style={[styles.skeletonBar, { flex: 1, backgroundColor: bg }]} />
      <View style={[styles.skeletonBar, { width: 40, backgroundColor: bg }]} />
    </View>
  );
}

// -- Helpers ----------------------------------------------------------------

function formatXp(xp: number | null | undefined): string {
  if (xp == null) return "0";
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}k`;
  return xp.toString();
}

// -- Main Screen Component --------------------------------------------------

export default function LeaderboardScreen() {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const { impact } = useHaptics();
  const meQuery = useMe();
  const leaderboardQuery = useLeaderboard(50);

  const currentUserId = meQuery.data?.id;

  const allEntries = useMemo(
    () => (leaderboardQuery.data ?? []) as LeaderboardEntry[],
    [leaderboardQuery.data],
  );

  const podiumEntries = useMemo(() => allEntries.slice(0, 3), [allEntries]);
  const rankedEntries = useMemo(() => allEntries.slice(3), [allEntries]);

  const handleBack = useCallback(() => {
    impact();
    router.back();
  }, [impact]);

  const handleRetry = useCallback(() => {
    impact();
    leaderboardQuery.refetch();
  }, [impact, leaderboardQuery]);

  const keyExtractor = useCallback(
    (item: LeaderboardEntry) => item.id,
    [],
  );

  const renderRankedItem = useCallback(
    ({ item, index }: { item: LeaderboardEntry; index: number }) => (
      <RankedRow
        entry={item}
        rank={index + 4}
        isDark={isDark}
        colors={colors}
        isCurrentUser={item.id === currentUserId}
        isOdd={index % 2 === 1}
        t={t}
      />
    ),
    [isDark, colors, currentUserId, t],
  );

  // -- Loading state --
  if (leaderboardQuery.isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: isDark ? "#0a0f0c" : "#f8faf9" }]}
      >
        <Header
          onBack={handleBack}
          colors={colors}
          isDark={isDark}
          t={t}
          totalCount={0}
        />
        <SkeletonPodium isDark={isDark} />
        <View style={styles.skeletonListWrap}>
          {Array.from({ length: 10 }).map((_, i) => (
            <SkeletonRow key={i} isDark={isDark} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  // -- Error state --
  if (leaderboardQuery.isError) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: isDark ? "#0a0f0c" : "#f8faf9" }]}
      >
        <Header
          onBack={handleBack}
          colors={colors}
          isDark={isDark}
          t={t}
          totalCount={0}
        />
        <View style={styles.centerWrap}>
          <MaterialIcons name="cloud-off" size={64} color={colors.textMuted} />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {t.common.loadingError}
          </Text>
          <TouchableOpacity
            onPress={handleRetry}
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            accessibilityRole="button"
            accessibilityLabel={t.common.retry}
          >
            <Text style={styles.retryButtonText}>{t.common.retry}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // -- Empty state --
  if (allEntries.length === 0) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: isDark ? "#0a0f0c" : "#f8faf9" }]}
      >
        <Header
          onBack={handleBack}
          colors={colors}
          isDark={isDark}
          t={t}
          totalCount={0}
        />
        <View style={styles.centerWrap}>
          <MaterialIcons name="emoji-events" size={64} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
            {t.leaderboard.empty}
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
            {t.leaderboard.emptyDesc}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // -- Podium Header for FlatList --
  const ListHeader = (
    <>
      {/* Podium section */}
      {podiumEntries.length > 0 && (
        <View style={styles.podiumSection}>
          {/* #2 - Left */}
          {podiumEntries[1] ? (
            <PodiumCard
              entry={podiumEntries[1]}
              rank={2}
              isDark={isDark}
              colors={colors}
              isCurrentUser={podiumEntries[1].id === currentUserId}
              t={t}
            />
          ) : (
            <View style={styles.podiumPlaceholder} />
          )}

          {/* #1 - Center (taller) */}
          {podiumEntries[0] && (
            <PodiumCard
              entry={podiumEntries[0]}
              rank={1}
              isDark={isDark}
              colors={colors}
              isCurrentUser={podiumEntries[0].id === currentUserId}
              t={t}
            />
          )}

          {/* #3 - Right */}
          {podiumEntries[2] ? (
            <PodiumCard
              entry={podiumEntries[2]}
              rank={3}
              isDark={isDark}
              colors={colors}
              isCurrentUser={podiumEntries[2].id === currentUserId}
              t={t}
            />
          ) : (
            <View style={styles.podiumPlaceholder} />
          )}
        </View>
      )}

      {/* Divider */}
      {rankedEntries.length > 0 && (
        <View style={[styles.divider, { borderBottomColor: colors.border }]} />
      )}
    </>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? "#0a0f0c" : "#f8faf9" }]}
    >
      <Header
        onBack={handleBack}
        colors={colors}
        isDark={isDark}
        t={t}
        totalCount={allEntries.length}
      />

      <FlatList
        data={rankedEntries}
        keyExtractor={keyExtractor}
        renderItem={renderRankedItem}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

// -- Header Component -------------------------------------------------------

function Header({
  onBack,
  colors,
  isDark,
  t,
  totalCount,
}: {
  onBack: () => void;
  colors: ReturnType<typeof useTheme>["colors"];
  isDark: boolean;
  t: ReturnType<typeof useTranslation>["t"];
  totalCount: number;
}) {
  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
      <TouchableOpacity
        onPress={onBack}
        style={[
          styles.backButton,
          {
            backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#ffffff",
            borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={t.common.back}
      >
        <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
      </TouchableOpacity>

      <View style={styles.headerTitleWrap}>
        <Text
          style={[styles.headerTitle, { color: colors.textPrimary }]}
          accessibilityRole="header"
        >
          {t.leaderboard.title}
        </Text>
      </View>

      {totalCount > 0 && (
        <View
          style={[
            styles.countBadge,
            {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.06)"
                : "rgba(0,0,0,0.04)",
            },
          ]}
        >
          <MaterialIcons name="people" size={14} color={colors.textSecondary} />
          <Text style={[styles.countBadgeText, { color: colors.textSecondary }]}>
            {totalCount}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

// -- Styles -----------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginEnd: 12,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  countBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  listContent: {
    paddingBottom: 100,
  },

  // Podium
  podiumSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 8,
  },
  podiumCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: 120,
  },
  podiumPlaceholder: {
    flex: 1,
    maxWidth: 120,
  },
  podiumMedalRow: {
    marginBottom: 8,
  },
  podiumAvatarWrap: {
    marginBottom: 8,
  },
  podiumName: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
  },
  podiumLevelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
  },
  podiumLevelText: {
    fontSize: 10,
    fontWeight: "700",
  },
  podiumXp: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },

  // "You" badge
  youBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  youBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#0d1b13",
  },
  youBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 6,
  },
  youBadgeSmallText: {
    fontSize: 8,
    fontWeight: "800",
    color: "#0d1b13",
  },

  // Ranked list
  rankedRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 12,
    marginBottom: 4,
    borderRadius: 12,
    gap: 10,
  },
  rankNumberWrap: {
    width: 28,
    alignItems: "center",
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: "700",
  },
  rankedNameWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  rankedName: {
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
  },
  rankedLevelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rankedLevelText: {
    fontSize: 10,
    fontWeight: "600",
  },
  rankedXp: {
    fontSize: 12,
    fontWeight: "700",
    minWidth: 36,
    textAlign: "right",
  },
  rankedScansWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    minWidth: 32,
    justifyContent: "flex-end",
  },
  rankedScans: {
    fontSize: 10,
    fontWeight: "600",
  },

  // Divider
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginHorizontal: 20,
    marginVertical: 8,
  },

  // Center states (error, empty)
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    marginTop: 16,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#0d1b13",
    fontWeight: "700",
    fontSize: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptyDesc: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },

  // Avatar
  avatar: {
    overflow: "hidden",
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(128,128,128,0.1)",
  },

  // Skeleton
  skeletonCircle: {
    marginBottom: 8,
  },
  skeletonBar: {
    height: 12,
    borderRadius: 6,
    marginBottom: 6,
  },
  skeletonListWrap: {
    paddingHorizontal: 12,
    gap: 4,
  },
});
