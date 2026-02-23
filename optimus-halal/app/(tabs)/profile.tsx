/**
 * User Profile Screen
 *
 * Wired to tRPC backend (Sprint 9):
 * - auth.me for profile + gamification data
 * - favorites.list for count
 * - loyalty.getBalance for points
 * - Gamification card: level, XP, streak, points
 */

import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useHaptics, useTheme, useMe, useLogout, useFavoritesList, useLoyaltyBalance, usePremium } from "@/hooks";
import { ImpactFeedbackStyle } from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";

import { Image } from "expo-image";
import { Card, Avatar, PremiumBackground } from "@/components/ui";
import { PressableScale } from "@/components/ui/PressableScale";
import { ProfileSkeleton } from "@/components/skeletons";
import { useThemeStore, usePreferencesStore } from "@/store";
import { useTranslation } from "@/hooks/useTranslation";

interface MenuItemProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  iconBgColor: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  isLast?: boolean;
}

const MenuItem = React.memo(function MenuItem({
  icon,
  iconBgColor,
  iconColor,
  title,
  subtitle,
  onPress,
  rightElement,
  isLast,
}: MenuItemProps) {
  const { colors } = useTheme();

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={subtitle ? subtitle : undefined}
    >
      <View
        className="flex-row items-center justify-between p-4"
        style={!isLast ? { borderBottomWidth: 1, borderBottomColor: colors.border } : undefined}
      >
        <View className="flex-row items-center gap-3">
          <View
            className="w-8 h-8 rounded-lg items-center justify-center"
            style={{ backgroundColor: iconBgColor }}
          >
            <MaterialIcons name={icon} size={18} color={iconColor} />
          </View>
          <Text className="font-medium text-sm" style={{ color: colors.textPrimary }}>
            {title}
          </Text>
        </View>
        {rightElement || (
          <View className="flex-row items-center gap-2">
            {subtitle && (
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
                {subtitle}
              </Text>
            )}
            <MaterialIcons
              name="chevron-right"
              size={20}
              color={colors.iconSecondary}
            />
          </View>
        )}
      </View>
    </PressableScale>
  );
});

interface StatsCardProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  iconBgColor: string;
  iconColor: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}

const StatsCard = React.memo(function StatsCard({
  icon,
  iconBgColor,
  iconColor,
  title,
  subtitle,
  onPress,
}: StatsCardProps) {
  const { colors } = useTheme();

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${subtitle}`}
      style={{ flex: 1 }}
    >
      <View
        className="p-4 rounded-2xl"
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.cardBorder,
        }}
      >
        <View
          className="w-10 h-10 rounded-full items-center justify-center mb-3"
          style={{ backgroundColor: iconBgColor }}
        >
          <MaterialIcons name={icon} size={20} color={iconColor} />
        </View>
        <Text className="font-bold text-sm" style={{ color: colors.textPrimary }}>
          {title}
        </Text>
        <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
          {subtitle}
        </Text>
      </View>
    </PressableScale>
  );
});

// ── XP Progress helpers ──────────────────────────

/** XP needed for a given level (100 * level) */
function xpForLevel(level: number): number {
  return level * 100;
}

/** Progress fraction [0,1] within current level */
function xpProgress(xp: number, level: number): number {
  const needed = xpForLevel(level);
  const prevTotal = Array.from({ length: level - 1 }, (_, i) => xpForLevel(i + 1)).reduce((a, b) => a + b, 0);
  const currentLevelXp = xp - prevTotal;
  return Math.min(1, Math.max(0, currentLevelXp / needed));
}

// ── Main Screen ──────────────────────────────────

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const { impact } = useHaptics();
  const { t, language } = useTranslation();

  // Premium status
  const { isPremium } = usePremium();

  // tRPC data
  const { data: profile, isLoading: profileLoading } = useMe();
  const { data: favoritesData } = useFavoritesList({ limit: 1 });
  const { data: loyalty } = useLoyaltyBalance();
  const logoutMutation = useLogout();

  const { theme } = useThemeStore();
  const { certifications } = usePreferencesStore();

  const userName = useMemo(() => profile?.displayName || t.common.user, [profile, t]);

  const favoritesCount = favoritesData?.length ?? 0;

  const gamification = useMemo(() => ({
    level: profile?.level ?? loyalty?.level ?? 1,
    xp: profile?.experiencePoints ?? loyalty?.experiencePoints ?? 0,
    points: loyalty?.points ?? 0,
    totalScans: profile?.totalScans ?? 0,
    streak: profile?.currentStreak ?? 0,
    longestStreak: profile?.longestStreak ?? 0,
  }), [profile, loyalty]);

  const progress = useMemo(
    () => xpProgress(gamification.xp, gamification.level),
    [gamification.xp, gamification.level]
  );

  const handleSettings = useCallback(() => {
    impact();
    router.push("/settings/appearance");
  }, [impact]);

  const handleEditProfile = useCallback(() => {
    impact();
    router.push("/settings/edit-profile" as any);
  }, [impact]);

  const handleScanHistory = useCallback(() => {
    impact();
    router.push("/settings/scan-history" as any);
  }, [impact]);

  const handleFavorites = useCallback(() => {
    impact();
    router.push("/settings/favorites" as any);
  }, [impact]);

  const handleLogout = useCallback(() => {
    impact(ImpactFeedbackStyle.Medium);
    Alert.alert(
      t.profile.logout,
      t.profile.logoutConfirm,
      [
        { text: t.common.cancel, style: "cancel" },
        {
          text: t.profile.logout,
          style: "destructive",
          onPress: () => {
            logoutMutation.mutate(undefined, {
              onSuccess: () => router.replace("/(auth)/welcome"),
            });
          },
        },
      ]
    );
  }, [logoutMutation, t, impact]);

  // Skeleton while profile data loads
  if (profileLoading || !profile) return <ProfileSkeleton />;

  return (
    <View className="flex-1">
      <PremiumBackground />

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={{ paddingTop: insets.top }}
      >
        <View className="flex-row items-center justify-between p-4">
          <Pressable
            onPress={() => router.navigate("/(tabs)/alerts" as any)}
            accessibilityRole="button"
            accessibilityLabel={t.common.notifications}
            accessibilityHint={t.common.viewAlerts}
            className="w-10 h-10 items-center justify-center"
          >
            <MaterialIcons
              name="notifications"
              size={24}
              color={colors.iconSecondary}
            />
          </Pressable>
          <Text accessibilityRole="header" className="text-lg font-bold tracking-tight" style={{ color: colors.textPrimary }}>
            {t.profile.title}
          </Text>
          <Pressable onPress={handleSettings} accessibilityRole="button" accessibilityLabel={t.common.settings} accessibilityHint={t.common.openSettings}>
            <MaterialIcons
              name="settings"
              size={24}
              color={colors.iconSecondary}
            />
          </Pressable>
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <Animated.View
          entering={FadeInDown.delay(50).duration(500)}
          className="items-center pt-4 pb-6 px-6"
        >
          {/* Avatar */}
          <PressableScale
            onPress={handleEditProfile}
            accessibilityRole="button"
            accessibilityLabel={t.common.profilePhoto}
            accessibilityHint={t.profile.editProfile}
          >
            <View className="relative mb-5">
              <View
                className="w-28 h-28 rounded-full overflow-hidden"
                style={{
                  borderWidth: 4,
                  borderColor: colors.card,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: isDark ? 0.15 : 0,
                  shadowRadius: 15,
                }}
              >
                <Avatar
                  size="2xl"
                  source={profile?.avatarUrl ?? undefined}
                  fallback={userName}
                />
              </View>
              <View className="absolute bottom-0 right-0 rounded-full p-2" style={{ backgroundColor: colors.primary, borderWidth: 4, borderColor: colors.background }}>
                <MaterialIcons name="edit" size={14} color="#ffffff" />
              </View>
            </View>
          </PressableScale>

          {/* Name */}
          <Text className="text-2xl font-bold mb-1" style={{ color: colors.textPrimary }}>
            {userName}
          </Text>

          {/* Level Badge */}
          <View
            className="flex-row items-center gap-1.5 mb-6 px-3 py-1 rounded-full"
            style={{ backgroundColor: isDark ? "rgba(212, 175, 55, 0.1)" : colors.primaryLight, borderWidth: 1, borderColor: isDark ? "rgba(212, 175, 55, 0.2)" : colors.primaryLight }}
          >
            <MaterialIcons name="verified" size={16} color={colors.primary} />
            <Text className="font-medium text-xs uppercase tracking-wide" style={{ color: colors.primary }}>
              {t.home.level} {gamification.level} — {t.profile.consciousConsumer}
            </Text>
          </View>

          {/* Edit Profile Button */}
          <PressableScale
            onPress={handleEditProfile}
            accessibilityRole="button"
            accessibilityLabel={t.profile.editProfile}
          >
            <View
              className="h-11 px-8 rounded-full items-center justify-center w-full max-w-[240px]"
              style={{
                backgroundColor: isDark ? "rgba(212, 175, 55, 0.12)" : "#0f172a",
                borderWidth: 1,
                borderColor: isDark ? "rgba(212, 175, 55, 0.25)" : "transparent",
              }}
            >
              <Text className="font-semibold text-sm" style={{ color: isDark ? colors.primary : "#ffffff" }}>
                {t.profile.editProfile}
              </Text>
            </View>
          </PressableScale>
        </Animated.View>

        {/* Gamification Card */}
        <Animated.View
          entering={FadeInUp.delay(100).duration(500)}
          className="mx-4 mb-6 p-4 rounded-2xl"
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.cardBorder,
          }}
        >
          {/* XP Progress */}
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>
              {t.profile.xpProgression}
            </Text>
            <Text className="text-xs font-bold" style={{ color: colors.textPrimary }}>
              {gamification.xp} XP
            </Text>
          </View>
          <View className="h-2 rounded-full mb-4 overflow-hidden" style={{ backgroundColor: colors.backgroundSecondary }}>
            <View
              className="h-full rounded-full"
              style={{ width: `${Math.round(progress * 100)}%`, backgroundColor: colors.primary }}
            />
          </View>

          {/* Quick Stats Row */}
          <View className="flex-row">
            <View className="flex-1 items-center">
              <View className="w-9 h-9 rounded-full items-center justify-center mb-1.5" style={{ backgroundColor: colors.primaryLight }}>
                <MaterialIcons name="local-fire-department" size={18} color={colors.primary} />
              </View>
              <Text className="font-bold text-sm" style={{ color: colors.textPrimary }}>
                {gamification.streak}
              </Text>
              <Text className="text-[10px]" style={{ color: colors.textSecondary }}>
                {t.profile.streak}
              </Text>
            </View>
            <View className="flex-1 items-center">
              <View className="w-9 h-9 rounded-full items-center justify-center mb-1.5"
                style={{ backgroundColor: isDark ? "rgba(59,130,246,0.1)" : "#eff6ff" }}>
                <MaterialIcons name="qr-code-scanner" size={18} color={isDark ? "#60a5fa" : "#2563eb"} />
              </View>
              <Text className="font-bold text-sm" style={{ color: colors.textPrimary }}>
                {gamification.totalScans}
              </Text>
              <Text className="text-[10px]" style={{ color: colors.textSecondary }}>
                {t.profile.stats.scans}
              </Text>
            </View>
            <View className="flex-1 items-center">
              <View className="w-9 h-9 rounded-full items-center justify-center mb-1.5"
                style={{ backgroundColor: isDark ? "rgba(234,179,8,0.1)" : "#fef3c7" }}>
                <MaterialIcons name="stars" size={18} color="#eab308" />
              </View>
              <Text className="font-bold text-sm" style={{ color: colors.textPrimary }}>
                {gamification.points}
              </Text>
              <Text className="text-[10px]" style={{ color: colors.textSecondary }}>
                {t.profile.points}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Stats Cards */}
        <Animated.View
          entering={FadeInUp.delay(150).duration(500)}
          className="flex-row gap-3 px-4 mb-6"
        >
          <StatsCard
            icon="history"
            iconBgColor={isDark ? "rgba(59,130,246,0.1)" : "#eff6ff"}
            iconColor={isDark ? "#60a5fa" : "#2563eb"}
            title={t.profile.stats.scanHistory}
            subtitle={`${gamification.totalScans} ${t.profile.stats.productsScanned}`}
            onPress={handleScanHistory}
          />
          <StatsCard
            icon="favorite"
            iconBgColor={isDark ? "rgba(234,179,8,0.1)" : "#fef3c7"}
            iconColor="#eab308"
            title={t.profile.stats.favorites}
            subtitle={`${favoritesCount} ${t.profile.stats.productsSaved}`}
            onPress={handleFavorites}
          />
        </Animated.View>

        {/* Naqiy+ Premium Entry */}
        <Animated.View entering={FadeInUp.delay(200).duration(500)} className="px-4 mb-6">
          <PressableScale
            onPress={() => {
              impact();
              router.push("/settings/premium" as any);
            }}
            accessibilityRole="button"
            accessibilityLabel="Naqiy+"
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
                borderRadius: 16,
                backgroundColor: isDark ? "rgba(212, 175, 55, 0.08)" : "rgba(212, 175, 55, 0.05)",
                borderWidth: 1,
                borderColor: isDark ? "rgba(212, 175, 55, 0.18)" : "rgba(212, 175, 55, 0.12)",
              }}
            >
              <Image
                source={require("@assets/images/logo_naqiy.webp")}
                style={{ width: 24, height: 24 }}
                contentFit="contain"
                cachePolicy="memory-disk"
              />
              <View style={{ flex: 1, marginStart: 12 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "700" }}>
                  Naqiy+
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }} numberOfLines={1}>
                  {isPremium ? t.premium.enjoyFeatures : t.premium.subtitle}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
            </View>
          </PressableScale>
        </Animated.View>

        {/* Preferences Section */}
        <Animated.View
          entering={FadeInUp.delay(250).duration(500)}
          className="px-4 mb-6"
        >
          <Text accessibilityRole="header" className="text-base font-bold px-2 mb-3" style={{ color: colors.textPrimary }}>
            {t.profile.preferences}
          </Text>
          <Card variant="elevated" className="overflow-hidden p-0">
            <MenuItem
              icon="shield-moon"
              iconBgColor={isDark ? "rgba(29,229,96,0.1)" : "#ecfdf5"}
              iconColor={colors.primary}
              title={t.profile.preferredCertifications}
              subtitle={certifications.slice(0, 2).join(", ").toUpperCase() || "\u2014"}
              onPress={() => router.push("/settings/certifications" as any)}
            />
            <MenuItem
              icon="no-food"
              iconBgColor={isDark ? "rgba(239,68,68,0.1)" : "#fef2f2"}
              iconColor={isDark ? "#f87171" : "#ef4444"}
              title={t.profile.dietaryExclusions}
              onPress={() => router.push("/settings/exclusions" as any)}
            />
            <MenuItem
              icon="notifications"
              iconBgColor={isDark ? "rgba(168,85,247,0.1)" : "#faf5ff"}
              iconColor={isDark ? "#c084fc" : "#a855f7"}
              title={t.profile.pushNotifications}
              onPress={() => router.push("/settings/notifications" as any)}
            />
            <MenuItem
              icon="auto-stories"
              iconBgColor={isDark ? "rgba(168,85,247,0.1)" : "#f5f3ff"}
              iconColor={isDark ? "#c084fc" : "#7c3aed"}
              title={t.profile.madhab}
              onPress={() => router.push("/settings/madhab" as any)}
            />
            <MenuItem
              icon="monitor-heart"
              iconBgColor={isDark ? "rgba(244,114,182,0.1)" : "#fdf2f8"}
              iconColor={isDark ? "#f472b6" : "#ec4899"}
              title={t.profile.healthProfile}
              onPress={() => router.push("/settings/health-profile" as any)}
            />
            <MenuItem
              icon="gavel"
              iconBgColor={isDark ? "rgba(239,68,68,0.1)" : "#fef2f2"}
              iconColor={isDark ? "#f87171" : "#dc2626"}
              title={t.profile.boycottEthics}
              onPress={() => router.push("/settings/boycott-list" as any)}
            />
            <MenuItem
              icon="workspace-premium"
              iconBgColor={isDark ? "rgba(234,179,8,0.1)" : "#fefce8"}
              iconColor={isDark ? "#fbbf24" : "#ca8a04"}
              title={t.profile.certifierRanking}
              onPress={() => router.push("/settings/certifier-ranking" as any)}
            />
            <MenuItem
              icon="leaderboard"
              iconBgColor={isDark ? "rgba(59,130,246,0.1)" : "#eff6ff"}
              iconColor={isDark ? "#60a5fa" : "#2563eb"}
              title={t.leaderboard.title}
              onPress={() => router.push("/settings/leaderboard" as any)}
            />
            <MenuItem
              icon="emoji-events"
              iconBgColor={isDark ? "rgba(234,179,8,0.1)" : "#fef3c7"}
              iconColor={isDark ? "#fbbf24" : "#eab308"}
              title={t.achievements.title}
              onPress={() => router.push("/settings/achievements" as any)}
            />
            <MenuItem
              icon="card-giftcard"
              iconBgColor={isDark ? "rgba(34,197,94,0.1)" : "#ecfdf5"}
              iconColor={isDark ? "#4ade80" : "#16a34a"}
              title={t.rewards.title}
              isLast
              onPress={() => router.push("/settings/rewards" as any)}
            />
          </Card>
        </Animated.View>

        {/* Account Section */}
        <Animated.View
          entering={FadeInUp.delay(300).duration(500)}
          className="px-4 mb-6"
        >
          <Text accessibilityRole="header" className="text-base font-bold px-2 mb-3" style={{ color: colors.textPrimary }}>
            {t.profile.account}
          </Text>
          <Card variant="elevated" className="overflow-hidden p-0">
            <MenuItem
              icon="palette"
              iconBgColor={isDark ? "rgba(168,85,247,0.1)" : "#faf5ff"}
              iconColor={isDark ? "#c084fc" : "#a855f7"}
              title={t.profile.appearance}
              subtitle={theme === "system" ? t.profile.appearanceAuto : theme === "light" ? t.profile.appearanceLight : t.profile.appearanceDark}
              onPress={() => router.push("/settings/appearance" as any)}
            />
            <MenuItem
              icon="language"
              iconBgColor={isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9"}
              iconColor={isDark ? "#94a3b8" : "#475569"}
              title={t.profile.language}
              subtitle={t.language.languages[language]}
              onPress={() => router.push("/settings/language" as any)}
            />
            <MenuItem
              icon="help"
              iconBgColor={isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9"}
              iconColor={isDark ? "#94a3b8" : "#475569"}
              title={t.profile.helpCenter}
              onPress={() => Alert.alert(t.common.comingSoon)}
            />
            <MenuItem
              icon="report-problem"
              iconBgColor={isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9"}
              iconColor={isDark ? "#94a3b8" : "#475569"}
              title={t.profile.reportProblem}
              isLast
              onPress={() => router.push("/report" as any)}
            />
          </Card>
        </Animated.View>

        {/* Logout Button */}
        <Animated.View
          entering={FadeInUp.delay(350).duration(500)}
          className="px-4 mb-8"
        >
          <PressableScale
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel={t.profile.logout}
          >
            <View
              className="w-full rounded-2xl p-3.5 flex-row items-center justify-center gap-2"
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: isDark ? "rgba(239,68,68,0.15)" : "#fee2e2",
              }}
            >
              <MaterialIcons name="logout" size={18} color="#ef4444" />
              <Text className="font-bold text-sm" style={{ color: isDark ? "#f87171" : "#dc2626" }}>
                {t.profile.logout}
              </Text>
            </View>
          </PressableScale>

          <Text className="text-center text-xs mt-6" style={{ color: colors.textMuted }}>
            {t.common.version} 2.1.0
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
