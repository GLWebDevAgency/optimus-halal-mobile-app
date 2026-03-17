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
import { defaultFeatureFlags, APP_CONFIG } from "@/constants/config";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Linking,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BellSimpleIcon, CaretRightIcon, FireIcon, GearIcon, GiftIcon, GlobeHemisphereWestIcon, PencilIcon, ScanIcon, SealCheckIcon, SignInIcon, SignOutIcon, StarFourIcon, WifiSlashIcon } from "phosphor-react-native";
import { useHaptics, useTheme, useLogout, useFavoritesList, useLoyaltyBalance, usePremium } from "@/hooks";
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
import { useThemeStore, usePreferencesStore, useQuotaStore, useOnboardingStore } from "@/store";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "../_layout";
import { AppIcon, type IconName } from "@/lib/icons";

interface MenuItemProps {
  icon: IconName;
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
            <AppIcon name={icon} size={18} color={iconColor} />
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
            <CaretRightIcon size={20}
              color={colors.iconSecondary} />
          </View>
        )}
      </View>
    </PressableScale>
  );
});

interface StatsCardProps {
  icon: IconName;
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
          <AppIcon name={icon} size={20} color={iconColor} />
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

  // Auth state from context (reactive, provided by AppInitializer)
  const { user: profile, isGuest, isAuthLoading: profileLoading, isAuthError: profileError } = useAuth();
  const { setOnboardingComplete } = useOnboardingStore();

  // Premium status
  const { isPremium, isTrialActive, trialDaysRemaining } = usePremium();

  // tRPC data — skip for anonymous users
  const { data: favoritesData } = useFavoritesList({ limit: 1, enabled: !!profile });
  const { data: loyalty } = useLoyaltyBalance({ enabled: !!profile });
  const logoutMutation = useLogout();

  // Quota (anonymous) — use dailyScansUsed for display consistency with home screen
  const dailyScansUsed = useQuotaStore((s) => s.dailyScansUsed);
  const DAILY_SCAN_LIMIT = 5;
  const quotaExhausted = dailyScansUsed >= DAILY_SCAN_LIMIT;

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

  const handleReplayOnboarding = useCallback(() => {
    impact();
    setOnboardingComplete(false);
    router.replace("/(onboarding)");
  }, [impact, setOnboardingComplete]);

  // ── Guest Mode (Trial or Exploration) ──────────────────────────────────
  if (isGuest) {
    return (
      <View className="flex-1">
        <PremiumBackground />

        {/* Header */}
        <Animated.View entering={FadeIn.duration(400)} style={{ paddingTop: insets.top }}>
          <View className="flex-row items-center justify-between p-4">
            <View className="w-10" />
            <Text accessibilityRole="header" className="text-lg font-bold tracking-tight" style={{ color: colors.textPrimary }}>
              {t.profile.title}
            </Text>
            <Pressable onPress={handleSettings} accessibilityRole="button" accessibilityLabel={t.common.settings}>
              <GearIcon size={24} color={colors.iconSecondary} />
            </Pressable>
          </View>
        </Animated.View>

        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

          {/* ── Hero: Trial vs Exploration ────────────────── */}
          <Animated.View entering={FadeInDown.delay(50).duration(500)} className="items-center pt-8 pb-6 px-6">
            {isTrialActive ? (
              <>
                {/* Trial Hero — green badge with countdown */}
                <View
                  className="w-24 h-24 rounded-full items-center justify-center mb-5"
                  style={{
                    backgroundColor: isDark ? "rgba(34, 197, 94, 0.1)" : "rgba(34, 197, 94, 0.08)",
                    borderWidth: 2,
                    borderColor: isDark ? "rgba(34, 197, 94, 0.25)" : "rgba(34, 197, 94, 0.2)",
                  }}
                >
                  <StarFourIcon size={40} color={isDark ? "#4ade80" : "#16a34a"} weight="fill" />
                </View>
                <Text className="text-2xl font-bold mb-1" style={{ color: colors.textPrimary }}>
                  {t.guest.trialMode}
                </Text>
                <View
                  className="px-3 py-1 rounded-full mb-3"
                  style={{
                    backgroundColor: isDark ? "rgba(34, 197, 94, 0.1)" : "rgba(34, 197, 94, 0.08)",
                    borderWidth: 1,
                    borderColor: isDark ? "rgba(34, 197, 94, 0.2)" : "rgba(34, 197, 94, 0.15)",
                  }}
                >
                  <Text className="text-xs font-bold" style={{ color: isDark ? "#4ade80" : "#16a34a" }}>
                    {t.paywall.trialBanner.replace("{n}", String(trialDaysRemaining))}
                  </Text>
                </View>
                <Text className="text-sm text-center px-4" style={{ color: colors.textSecondary }}>
                  {t.guest.trialDescription}
                </Text>
              </>
            ) : (
              <>
                {/* Exploration Hero — original globe design */}
                <View
                  className="w-24 h-24 rounded-full items-center justify-center mb-5"
                  style={{
                    backgroundColor: isDark ? "rgba(212, 175, 55, 0.08)" : "rgba(212, 175, 55, 0.06)",
                    borderWidth: 2,
                    borderColor: isDark ? "rgba(212, 175, 55, 0.2)" : "rgba(212, 175, 55, 0.15)",
                  }}
                >
                  <GlobeHemisphereWestIcon size={40} color={colors.primary} />
                </View>
                <Text className="text-2xl font-bold mb-1" style={{ color: colors.textPrimary }}>
                  {t.guest.discoveryMode}
                </Text>
                <Text className="text-sm text-center px-4" style={{ color: colors.textSecondary }}>
                  {t.guest.discoveryDescription}
                </Text>
              </>
            )}
          </Animated.View>

          {/* ── Quota Card — only in exploration mode ────── */}
          {!isTrialActive && (
            <Animated.View entering={FadeInUp.delay(100).duration(500)} className="mx-4 mb-6">
              <View
                className="p-4 rounded-2xl"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                }}
              >
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                    {t.guest.dailyScans}
                  </Text>
                  <Text className="text-sm font-bold" style={{ color: quotaExhausted ? "#ef4444" : colors.primary }}>
                    {dailyScansUsed}/{DAILY_SCAN_LIMIT}
                  </Text>
                </View>
                <View className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: colors.backgroundSecondary }}>
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round((dailyScansUsed / DAILY_SCAN_LIMIT) * 100)}%`,
                      backgroundColor: quotaExhausted ? "#ef4444" : colors.primary,
                    }}
                  />
                </View>
                <Text className="text-xs mt-2" style={{ color: colors.textMuted }}>
                  {t.guest.scansResetAtMidnight}
                </Text>
              </View>
            </Animated.View>
          )}

          {/* ── Naqiy+ CTA — only in exploration mode ──── */}
          {!isTrialActive && (
            <Animated.View entering={FadeInUp.delay(150).duration(500)} className="mx-4 mb-6">
              <PressableScale
                onPress={() => {
                  impact();
                  router.push({ pathname: "/paywall" as any, params: { trigger: "generic" } });
                }}
                accessibilityRole="button"
                accessibilityLabel="Naqiy+"
              >
                <View
                  className="p-5 rounded-2xl items-center"
                  style={{
                    backgroundColor: isDark ? "rgba(212, 175, 55, 0.08)" : "rgba(212, 175, 55, 0.05)",
                    borderWidth: 1,
                    borderColor: isDark ? "rgba(212, 175, 55, 0.2)" : "rgba(212, 175, 55, 0.12)",
                  }}
                >
                  <Image
                    source={require("@assets/images/logo_naqiy.webp")}
                    style={{ width: 40, height: 40, marginBottom: 12 }}
                    contentFit="contain"
                    cachePolicy="memory-disk"
                  />
                  <Text className="text-lg font-bold mb-1" style={{ color: colors.textPrimary }}>
                    {t.guest.upgradeTitle}
                  </Text>
                  <Text className="text-sm text-center mb-4" style={{ color: colors.textSecondary }}>
                    {t.guest.upgradeDescription}
                  </Text>
                  <View
                    className="h-11 px-8 rounded-full items-center justify-center"
                    style={{ backgroundColor: isDark ? colors.primary : "#0f172a" }}
                  >
                    <Text className="font-bold text-sm" style={{ color: isDark ? "#0f172a" : "#fff" }}>
                      {t.paywall.subscribe}
                    </Text>
                  </View>
                </View>
              </PressableScale>
            </Animated.View>
          )}

          {/* ── Premium Settings — visible in trial + exploration ── */}
          <Animated.View entering={FadeInUp.delay(isTrialActive ? 100 : 200).duration(500)} className="px-4 mb-6">
            <Text accessibilityRole="header" className="text-base font-bold px-2 mb-3" style={{ color: colors.textPrimary }}>
              {t.profile.preferences}
            </Text>
            <Card variant="elevated" className="overflow-hidden p-0">
              {/* Certifications — local MMKV, works without backend */}
              <MenuItem
                icon="verified"
                iconBgColor={isDark ? "rgba(34,197,94,0.1)" : "#ecfdf5"}
                iconColor={isDark ? "#4ade80" : "#16a34a"}
                title={t.profile.preferredCertifications}
                subtitle={certifications.length > 0 ? `${certifications.length}` : undefined}
                onPress={() => router.push("/settings/certifications" as any)}
              />
              {/* Exclusions — local MMKV, works without backend */}
              <MenuItem
                icon="block"
                iconBgColor={isDark ? "rgba(239,68,68,0.1)" : "#fef2f2"}
                iconColor={isDark ? "#f87171" : "#ef4444"}
                title={t.profile.dietaryExclusions}
                onPress={() => router.push("/settings/exclusions" as any)}
              />
              {/* Madhab — local MMKV, works without backend */}
              <MenuItem
                icon="menu-book"
                iconBgColor={isDark ? "rgba(212, 175, 55, 0.1)" : "rgba(212, 175, 55, 0.08)"}
                iconColor={colors.primary}
                title={t.profile.madhab}
                onPress={() => router.push("/settings/certifier-ranking" as any)}
              />
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
                onPress={() => router.push("/report" as any)}
              />
              <MenuItem
                icon="play-circle-outline"
                iconBgColor={isDark ? "rgba(59,130,246,0.1)" : "#eff6ff"}
                iconColor={isDark ? "#60a5fa" : "#2563eb"}
                title={t.profile.replayOnboarding}
                isLast
                onPress={handleReplayOnboarding}
              />
            </Card>
          </Animated.View>

          {/* Legal Section */}
          <Animated.View entering={FadeInUp.delay(isTrialActive ? 150 : 250).duration(500)} className="px-4 mb-6">
            <Text accessibilityRole="header" className="text-base font-bold px-2 mb-3" style={{ color: colors.textPrimary }}>
              {t.profile.legalSection}
            </Text>
            <Card variant="elevated" className="overflow-hidden p-0">
              <MenuItem
                icon="description"
                iconBgColor={isDark ? "rgba(59,130,246,0.1)" : "#eff6ff"}
                iconColor={isDark ? "#60a5fa" : "#2563eb"}
                title={t.profile.termsOfService}
                onPress={() => Linking.openURL(APP_CONFIG.TERMS_URL)}
              />
              <MenuItem
                icon="privacy-tip"
                iconBgColor={isDark ? "rgba(34,197,94,0.1)" : "#ecfdf5"}
                iconColor={isDark ? "#4ade80" : "#16a34a"}
                title={t.profile.privacyPolicy}
                isLast
                onPress={() => Linking.openURL(APP_CONFIG.PRIVACY_POLICY_URL)}
              />
            </Card>
          </Animated.View>

          {/* Login / Account CTA */}
          <Animated.View entering={FadeInUp.delay(isTrialActive ? 200 : 300).duration(500)} className="px-4 mb-8">
            <PressableScale
              onPress={() => {
                impact();
                router.push("/(auth)/welcome" as any);
              }}
              accessibilityRole="button"
              accessibilityLabel={t.guest.loginExistingAccount}
            >
              <View
                className="w-full rounded-2xl p-3.5 flex-row items-center justify-center gap-2"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                }}
              >
                <SignInIcon size={18} color={colors.primary} />
                <Text className="font-bold text-sm" style={{ color: colors.primary }}>
                  {t.guest.loginExistingAccount}
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

  // ── Authenticated Profile ──────────────────────────────────

  // Skeleton only during the initial fetch — never block on error or stale cache
  if (profileLoading && !profile) return <ProfileSkeleton />;

  // Error fallback — query failed and no cached data
  if (profileError && !profile) {
    return (
      <View style={{ flex: 1 }}>
        <PremiumBackground />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingTop: insets.top }}>
          <WifiSlashIcon size={48} color={colors.textMuted} />
          <Text style={{ marginTop: 16, fontSize: 16, fontWeight: "600", color: colors.textPrimary }}>
            {t.errors.network}
          </Text>
          <PressableScale
            onPress={() => {/* useMe auto-refetches on mount */
              router.replace("/(tabs)/profile" as any);
            }}
            style={{ marginTop: 20, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: 12 }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>{t.common.retry}</Text>
          </PressableScale>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <PremiumBackground />

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={{ paddingTop: insets.top }}
      >
        <View className="flex-row items-center justify-between p-4">
          {defaultFeatureFlags.alertsEnabled ? (
            <Pressable
              onPress={() => router.navigate("/(tabs)/alerts" as any)}
              accessibilityRole="button"
              accessibilityLabel={t.common.notifications}
              accessibilityHint={t.common.viewAlerts}
              className="w-10 h-10 items-center justify-center"
            >
              <BellSimpleIcon size={24}
                color={colors.iconSecondary} />
            </Pressable>
          ) : (
            <View className="w-10 h-10" />
          )}
          <Text accessibilityRole="header" className="text-lg font-bold tracking-tight" style={{ color: colors.textPrimary }}>
            {t.profile.title}
          </Text>
          <Pressable onPress={handleSettings} accessibilityRole="button" accessibilityLabel={t.common.settings} accessibilityHint={t.common.openSettings}>
            <GearIcon size={24}
              color={colors.iconSecondary} />
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
                style={{
                  shadowColor: isPremium ? "#D4AF37" : colors.primary,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: isPremium ? 0.3 : (isDark ? 0.15 : 0),
                  shadowRadius: isPremium ? 20 : 15,
                }}
              >
                <Avatar
                  size="2xl"
                  source={profile?.avatarUrl ?? undefined}
                  fallback={userName}
                  premiumRing={isPremium}
                />
              </View>
              <View className="absolute bottom-0 right-0 rounded-full p-2" style={{ backgroundColor: colors.primary, borderWidth: 4, borderColor: colors.background }}>
                <PencilIcon size={14} color="#ffffff" />
              </View>
            </View>
          </PressableScale>

          {/* Name */}
          <Text className="text-2xl font-bold mb-1" style={{ color: colors.textPrimary }}>
            {userName}
          </Text>

          {/* Level Badge — gamification gated */}
          {defaultFeatureFlags.gamificationEnabled && (
            <View
              className="flex-row items-center gap-1.5 mb-6 px-3 py-1 rounded-full"
              style={{ backgroundColor: isDark ? "rgba(212, 175, 55, 0.1)" : colors.primaryLight, borderWidth: 1, borderColor: isDark ? "rgba(212, 175, 55, 0.2)" : colors.primaryLight }}
            >
              <SealCheckIcon size={16} color={colors.primary} />
              <Text className="font-medium text-xs uppercase tracking-wide" style={{ color: colors.primary }}>
                {t.home.level} {gamification.level} — {t.profile.consciousConsumer}
              </Text>
            </View>
          )}

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

        {/* Gamification Card — gated */}
        {defaultFeatureFlags.gamificationEnabled && (
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
                <FireIcon size={18} color={colors.primary} />
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
                <ScanIcon size={18} color={isDark ? "#60a5fa" : "#2563eb"} />
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
                <StarFourIcon size={18} color="#eab308" />
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
        )}

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
                backgroundColor: isPremium
                  ? isDark ? "rgba(212, 175, 55, 0.12)" : "rgba(212, 175, 55, 0.08)"
                  : isDark ? "rgba(212, 175, 55, 0.08)" : "rgba(212, 175, 55, 0.05)",
                borderWidth: 1,
                borderColor: isPremium
                  ? isDark ? "rgba(212, 175, 55, 0.3)" : "rgba(212, 175, 55, 0.2)"
                  : isDark ? "rgba(212, 175, 55, 0.18)" : "rgba(212, 175, 55, 0.12)",
              }}
            >
              <View style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                backgroundColor: isDark ? "rgba(212, 175, 55, 0.08)" : "rgba(212, 175, 55, 0.05)",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <Image
                  source={require("@assets/images/logo_naqiy.webp")}
                  style={{ width: 30, height: 30 }}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                />
              </View>
              <View style={{ flex: 1, marginStart: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "700" }}>
                    Naqiy+
                  </Text>
                  {isPremium && (
                    <View style={{
                      backgroundColor: "rgba(212, 175, 55, 0.15)",
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 6,
                    }}>
                      <Text style={{ color: "#D4AF37", fontSize: 10, fontWeight: "800" }}>
                        {t.premium.active ?? "ACTIF"}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }} numberOfLines={1}>
                  {isPremium ? t.premium.enjoyFeatures : t.premium.subtitle}
                </Text>
              </View>
              {isPremium ? (
                <SealCheckIcon size={22} color="#D4AF37" />
              ) : (
                <CaretRightIcon size={20} color={colors.textSecondary} />
              )}
            </View>
          </PressableScale>
        </Animated.View>

        {/* Referral Program */}
        <Animated.View entering={FadeInUp.delay(250).duration(500)} className="px-4 mb-6">
          <PressableScale
            onPress={() => {
              impact();
              router.push("/settings/referral" as any);
            }}
            accessibilityRole="button"
            accessibilityLabel={t.referral.title}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
                borderRadius: 16,
                backgroundColor: isDark ? "rgba(212, 175, 55, 0.06)" : "rgba(212, 175, 55, 0.04)",
                borderWidth: 1,
                borderColor: isDark ? "rgba(212, 175, 55, 0.18)" : "rgba(212, 175, 55, 0.12)",
              }}
            >
              <View style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                backgroundColor: isDark ? "rgba(212, 175, 55, 0.1)" : "rgba(212, 175, 55, 0.08)",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <GiftIcon size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginStart: 12 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "700" }}>
                  {t.referral.title}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }} numberOfLines={1}>
                  {t.referral.share}
                </Text>
              </View>
              <CaretRightIcon size={20} color={colors.textSecondary} />
            </View>
          </PressableScale>
        </Animated.View>

        {/* Preferences Section */}
        <Animated.View
          entering={FadeInUp.delay(300).duration(500)}
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
              isLast={!defaultFeatureFlags.gamificationEnabled}
              onPress={() => router.push("/settings/certifier-ranking" as any)}
            />
            {defaultFeatureFlags.gamificationEnabled && (
              <>
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
              </>
            )}
          </Card>
        </Animated.View>

        {/* Account Section */}
        <Animated.View
          entering={FadeInUp.delay(350).duration(500)}
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
              onPress={() => router.push("/report" as any)}
            />
            <MenuItem
              icon="play-circle-outline"
              iconBgColor={isDark ? "rgba(59,130,246,0.1)" : "#eff6ff"}
              iconColor={isDark ? "#60a5fa" : "#2563eb"}
              title={t.profile.replayOnboarding}
              isLast
              onPress={handleReplayOnboarding}
            />
          </Card>
        </Animated.View>

        {/* Legal Section */}
        <Animated.View
          entering={FadeInUp.delay(400).duration(500)}
          className="px-4 mb-6"
        >
          <Text accessibilityRole="header" className="text-base font-bold px-2 mb-3" style={{ color: colors.textPrimary }}>
            {t.profile.legalSection}
          </Text>
          <Card variant="elevated" className="overflow-hidden p-0">
            <MenuItem
              icon="description"
              iconBgColor={isDark ? "rgba(59,130,246,0.1)" : "#eff6ff"}
              iconColor={isDark ? "#60a5fa" : "#2563eb"}
              title={t.profile.termsOfService}
              onPress={() => Linking.openURL(APP_CONFIG.TERMS_URL)}
            />
            <MenuItem
              icon="privacy-tip"
              iconBgColor={isDark ? "rgba(34,197,94,0.1)" : "#ecfdf5"}
              iconColor={isDark ? "#4ade80" : "#16a34a"}
              title={t.profile.privacyPolicy}
              isLast
              onPress={() => Linking.openURL(APP_CONFIG.PRIVACY_POLICY_URL)}
            />
          </Card>
        </Animated.View>

        {/* Logout Button */}
        <Animated.View
          entering={FadeInUp.delay(450).duration(500)}
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
              <SignOutIcon size={18} color="#ef4444" />
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
