/**
 * Achievements Screen - Mes Trophees
 * Premium trophy case displaying user achievements from the loyalty system.
 */

import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  Dimensions,
} from "react-native";
import { PressableScale } from "@/components/ui/PressableScale";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeIn, ZoomIn } from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { useAchievements, useLoyaltyBalance } from "@/hooks/useLoyalty";
import { Skeleton } from "@/components/ui/Skeleton";

const LOCALE_MAP: Record<string, string> = { fr: "fr-FR", en: "en-US", ar: "ar-SA" };

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 40 - CARD_GAP) / 2;

// ── Types ─────────────────────────────────────────────

interface Achievement {
  id: string;
  name: string;
  nameFr: string | null;
  nameAr: string | null;
  description: string | null;
  descriptionFr: string | null;
  icon: string | null;
  pointsReward: number;
  requirement: unknown;
  sortOrder: number | null;
  unlocked: boolean;
  unlockedAt: Date | undefined;
}

// ── Valid MaterialIcons check ─────────────────────────

const VALID_ICONS = new Set([
  "emoji-events", "star", "verified", "local-fire-department",
  "favorite", "visibility", "search", "qr-code-scanner",
  "shopping-cart", "share", "flag", "eco", "shield",
  "military-tech", "workspace-premium", "diamond", "rocket-launch",
  "bolt", "whatshot", "auto-awesome", "celebration",
  "diversity-3", "handshake", "volunteer-activism",
  "restaurant", "storefront", "local-grocery-store",
  "health-and-safety", "psychology", "school",
]);

function getIconName(icon: string | null): keyof typeof MaterialIcons.glyphMap {
  if (icon && VALID_ICONS.has(icon)) {
    return icon as keyof typeof MaterialIcons.glyphMap;
  }
  return "emoji-events";
}

// ── Achievement Card ──────────────────────────────────

interface AchievementCardProps {
  achievement: Achievement;
  index: number;
  isDark: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
  t: ReturnType<typeof useTranslation>["t"];
  language: string;
}

const AchievementCard = React.memo(function AchievementCard({
  achievement,
  index,
  isDark,
  colors,
  t,
  language,
}: AchievementCardProps) {
  const iconName = getIconName(achievement.icon);

  const cardBg = achievement.unlocked
    ? isDark
      ? "rgba(34,197,94,0.06)"
      : "rgba(34,197,94,0.04)"
    : colors.card;

  const cardBorder = achievement.unlocked
    ? "rgba(34,197,94,0.2)"
    : colors.border;

  const iconColor = achievement.unlocked ? "#22c55e" : colors.textMuted;

  const locale = LOCALE_MAP[language] ?? "fr-FR";

  const formattedDate = useMemo(() => {
    if (!achievement.unlockedAt) return null;
    const date = new Date(achievement.unlockedAt);
    return date.toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [achievement.unlockedAt, locale]);

  return (
    <Animated.View
      entering={ZoomIn.delay(index * 80)
        .duration(400)
        .springify()
        .damping(15)}
      style={[
        styles.card,
        {
          width: CARD_WIDTH,
          backgroundColor: cardBg,
          borderColor: cardBorder,
        },
      ]}
    >
      {/* Icon area */}
      <View style={styles.iconContainer}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: achievement.unlocked
                ? isDark
                  ? "rgba(34,197,94,0.12)"
                  : "rgba(34,197,94,0.08)"
                : isDark
                  ? "rgba(255,255,255,0.04)"
                  : "rgba(0,0,0,0.03)",
              opacity: achievement.unlocked ? 1 : 0.4,
            },
          ]}
        >
          <MaterialIcons
            name={iconName}
            size={32}
            color={iconColor}
          />
        </View>

        {/* Lock overlay for locked achievements */}
        {!achievement.unlocked && (
          <View style={styles.lockOverlay}>
            <MaterialIcons name="lock" size={20} color={colors.textMuted} />
          </View>
        )}
      </View>

      {/* Content */}
      <View style={{ opacity: achievement.unlocked ? 1 : 0.4 }}>
        <Text
          style={[styles.cardTitle, { color: colors.textPrimary }]}
          numberOfLines={2}
        >
          {achievement.nameFr ?? achievement.name}
        </Text>
        <Text
          style={[styles.cardDescription, { color: colors.textMuted }]}
          numberOfLines={2}
        >
          {achievement.unlocked
            ? (achievement.descriptionFr ?? achievement.description ?? "")
            : "???"}
        </Text>
      </View>

      {/* Date badge for unlocked */}
      {achievement.unlocked && formattedDate && (
        <View
          style={[
            styles.dateBadge,
            {
              backgroundColor: isDark
                ? "rgba(34,197,94,0.1)"
                : "rgba(34,197,94,0.06)",
            },
          ]}
        >
          <MaterialIcons name="check-circle" size={10} color="#22c55e" />
          <Text style={styles.dateText}>
            {formattedDate}
          </Text>
        </View>
      )}
    </Animated.View>
  );
});

// ── Skeleton Card ─────────────────────────────────────

function SkeletonCard({ index }: { index: number }) {
  return (
    <View style={[styles.card, styles.skeletonCard, { width: CARD_WIDTH }]}>
      <View style={styles.iconContainer}>
        <Skeleton width={60} height={60} borderRadius={30} />
      </View>
      <Skeleton width="80%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
      <Skeleton width="60%" height={12} borderRadius={4} style={{ marginTop: 6 }} />
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────

export default function AchievementsScreen() {
  const { isDark, colors } = useTheme();
  const { t, language } = useTranslation();
  const router = useRouter();

  const {
    data: achievements,
    isLoading: achievementsLoading,
    isError: achievementsError,
    refetch,
  } = useAchievements();

  const { data: loyaltyData } = useLoyaltyBalance();

  const unlockedCount = useMemo(
    () => achievements?.filter((a) => a.unlocked).length ?? 0,
    [achievements],
  );

  const totalCount = achievements?.length ?? 0;
  const progressPercent = totalCount > 0 ? unlockedCount / totalCount : 0;

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const keyExtractor = useCallback((item: Achievement) => item.id, []);

  const renderItem = useCallback(
    ({ item, index }: { item: Achievement; index: number }) => (
      <View style={index % 2 === 0 ? styles.cardLeft : styles.cardRight}>
        <AchievementCard
          achievement={item}
          index={index}
          isDark={isDark}
          colors={colors}
          t={t}
          language={language}
        />
      </View>
    ),
    [isDark, colors, t, language],
  );

  // ── Loading state ────────────────────────────────────

  if (achievementsLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={handleBack}
            style={[
              styles.backButton,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t.common.back}
          >
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <Text
            style={[styles.headerTitle, { color: colors.textPrimary }]}
            accessibilityRole="header"
          >
            {t.achievements.title}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Skeleton grid */}
        <View style={styles.skeletonGrid}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={i % 2 === 0 ? styles.cardLeft : styles.cardRight}>
              <SkeletonCard index={i} />
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  // ── Error state ──────────────────────────────────────

  if (achievementsError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable
            onPress={handleBack}
            style={[
              styles.backButton,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t.common.back}
          >
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <Text
            style={[styles.headerTitle, { color: colors.textPrimary }]}
            accessibilityRole="header"
          >
            {t.achievements.title}
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centerContent}>
          <MaterialIcons name="cloud-off" size={64} color={colors.textMuted} />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {t.common.loadingError}
          </Text>
          <PressableScale
            onPress={() => refetch()}
            accessibilityRole="button"
            accessibilityLabel={t.common.retry}
          >
            <View style={[styles.retryButton, { backgroundColor: colors.primary }]}>
              <Text style={[styles.retryText, { color: isDark ? "#102217" : "#0d1b13" }]}>
                {t.common.retry}
              </Text>
            </View>
          </PressableScale>
        </View>
      </SafeAreaView>
    );
  }

  // ── Empty state ──────────────────────────────────────

  if (!achievements || achievements.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable
            onPress={handleBack}
            style={[
              styles.backButton,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t.common.back}
          >
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <Text
            style={[styles.headerTitle, { color: colors.textPrimary }]}
            accessibilityRole="header"
          >
            {t.achievements.title}
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centerContent}>
          <MaterialIcons name="emoji-events" size={72} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
            {t.achievements.empty}
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
            {t.achievements.emptyDesc}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main content ─────────────────────────────────────

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={achievements as Achievement[]}
        keyExtractor={keyExtractor}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Header */}
            <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
              <Pressable
                onPress={handleBack}
                style={[
                  styles.backButton,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={t.common.back}
              >
                <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
              </Pressable>
              <Text
                style={[styles.headerTitle, { color: colors.textPrimary }]}
                accessibilityRole="header"
              >
                {t.achievements.title}
              </Text>
              <View
                style={[
                  styles.countBadge,
                  {
                    backgroundColor: isDark
                      ? "rgba(34,197,94,0.12)"
                      : "rgba(34,197,94,0.08)",
                  },
                ]}
              >
                <Text style={styles.countText}>
                  {unlockedCount}/{totalCount}
                </Text>
              </View>
            </Animated.View>

            {/* Progress Banner */}
            <Animated.View
              entering={FadeInDown.delay(100).duration(500)}
              style={[
                styles.progressBanner,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.progressHeader}>
                <View style={styles.progressLeft}>
                  <View
                    style={[
                      styles.levelBadge,
                      {
                        backgroundColor: isDark
                          ? "rgba(34,197,94,0.15)"
                          : "rgba(34,197,94,0.1)",
                      },
                    ]}
                  >
                    <MaterialIcons name="military-tech" size={20} color="#22c55e" />
                    <Text style={styles.levelText}>
                      {t.home.level} {loyaltyData?.level ?? 1}
                    </Text>
                  </View>
                </View>
                <View style={styles.progressRight}>
                  <Text style={[styles.progressCount, { color: colors.textPrimary }]}>
                    {unlockedCount}
                  </Text>
                  <Text style={[styles.progressLabel, { color: colors.textMuted }]}>
                    /{totalCount} {t.achievements.count}
                  </Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBarBg,
                    {
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.06)"
                        : "rgba(0,0,0,0.04)",
                    },
                  ]}
                >
                  <Animated.View
                    entering={FadeIn.delay(300).duration(600)}
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.round(progressPercent * 100)}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.progressPercentText, { color: colors.textMuted }]}>
                  {Math.round(progressPercent * 100)}%
                </Text>
              </View>
            </Animated.View>
          </>
        }
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────

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
    height: 44,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    borderWidth: 1,
    marginEnd: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  headerSpacer: {
    width: 44,
  },
  countBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#22c55e",
  },

  // Progress banner
  progressBanner: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  progressLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  levelText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#22c55e",
  },
  progressRight: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  progressCount: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -1,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginLeft: 2,
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22c55e",
  },
  progressPercentText: {
    fontSize: 12,
    fontWeight: "600",
    width: 32,
    textAlign: "right",
  },

  // List
  listContent: {
    paddingBottom: 100,
  },
  columnWrapper: {
    paddingHorizontal: 20,
    gap: CARD_GAP,
  },

  // Cards
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: CARD_GAP,
  },
  cardLeft: {
    flex: 1,
  },
  cardRight: {
    flex: 1,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 60,
    marginBottom: 10,
    position: "relative",
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  lockOverlay: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
  },
  cardDescription: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
  },
  dateBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: 10,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  dateText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#22c55e",
  },

  // Skeleton
  skeletonCard: {
    borderColor: "rgba(0,0,0,0.06)",
    backgroundColor: "rgba(0,0,0,0.02)",
    alignItems: "center",
  },
  skeletonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: CARD_GAP,
  },

  // States
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    fontWeight: "700",
    fontSize: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  emptyDesc: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
});
