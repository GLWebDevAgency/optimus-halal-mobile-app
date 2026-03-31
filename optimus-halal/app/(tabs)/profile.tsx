/**
 * User Profile Screen
 *
 * Two states:
 * - Free / Guest: discovery mode or trial, with Naqiy+ upgrade CTA
 * - Naqiy+: full profile with avatar, preferences, and account management
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
import { BellSimpleIcon, CaretRightIcon, GearIcon, PencilIcon, WifiSlashIcon } from "phosphor-react-native";
import { useHaptics, useTheme, useLogout, useFavoritesList, usePremium, useDeleteAccount, useCanAccessPremiumData } from "@/hooks";
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
import { useThemeStore, usePreferencesStore, useQuotaStore, useOnboardingStore, useFeatureFlagsStore, DAILY_SCAN_LIMIT } from "@/store";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "../_layout";
import { AppIcon, type IconName } from "@/lib/icons";

// ── MenuItem ─────────────────────────────────────

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

// ── Main Screen ──────────────────────────────────

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const { impact } = useHaptics();
  const { t, language } = useTranslation();

  // Auth state from context (reactive, provided by AppInitializer)
  const { user: profile, isGuest, isAuthLoading: profileLoading, isAuthError: profileError } = useAuth();
  const { setOnboardingComplete } = useOnboardingStore();

  // Feature flags
  const { flags } = useFeatureFlagsStore();

  // Premium status
  const { isPremium, isTrialActive, trialDaysRemaining } = usePremium();

  // tRPC data — skip for anonymous users
  const { data: favoritesData } = useFavoritesList({ limit: 1, enabled: !!profile });
  const logoutMutation = useLogout();
  const deleteAccountMutation = useDeleteAccount();

  // Quota (anonymous) — use dailyScansUsed for display consistency with home screen
  const dailyScansUsed = useQuotaStore((s) => s.dailyScansUsed);
  const quotaExhausted = dailyScansUsed >= DAILY_SCAN_LIMIT;

  const { theme } = useThemeStore();

  const userName = useMemo(() => profile?.displayName || t.common.user, [profile, t]);

  // ── Callbacks ──────────────────────────────────

  const handleSettings = useCallback(() => {
    impact();
    router.push("/settings/appearance" as any);
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
              onSuccess: () => router.replace("/(auth)/login"),
            });
          },
        },
      ]
    );
  }, [logoutMutation, t, impact]);

  const handleDeleteAccount = useCallback(() => {
    impact(ImpactFeedbackStyle.Medium);
    Alert.alert(
      t.editProfile.deleteAccountTitle,
      t.editProfile.deleteAccountMessage,
      [
        { text: t.common.cancel, style: "cancel" },
        {
          text: t.editProfile.deleteAccount,
          style: "destructive",
          onPress: () => {
            deleteAccountMutation.mutate(undefined, {
              onSuccess: () => router.replace("/(auth)/login"),
            });
          },
        },
      ]
    );
  }, [deleteAccountMutation, t, impact]);

  const handleReplayOnboarding = useCallback(() => {
    impact();
    setOnboardingComplete(false);
    router.replace("/(onboarding)");
  }, [impact, setOnboardingComplete]);

  // ── Free / Guest Mode (Trial or Exploration) ────────────────────────────
  if (isGuest || !isPremium) {
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
                  <AppIcon name="workspace-premium" size={40} color={isDark ? "#4ade80" : "#16a34a"} />
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
                {/* Discovery Hero — Naqiy logo in gold circle */}
                <View
                  className="w-24 h-24 rounded-full items-center justify-center mb-5"
                  style={{
                    backgroundColor: isDark ? "rgba(212, 175, 55, 0.08)" : "rgba(212, 175, 55, 0.06)",
                    borderWidth: 2,
                    borderColor: isDark ? "rgba(212, 175, 55, 0.2)" : "rgba(212, 175, 55, 0.15)",
                  }}
                >
                  <Image
                    source={require("@assets/images/logo_naqiy.webp")}
                    style={{ width: 48, height: 48 }}
                    contentFit="contain"
                    cachePolicy="memory-disk"
                  />
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

          {/* ── Quota Card — only for free post-trial (not during trial) ────── */}
          {!isPremium && !isTrialActive && (
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

          {/* ── CTA Gold "Découvrir Naqiy+" ──── */}
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

          {/* ── Login link — actual guests only ── */}
          {isGuest && (
            <Animated.View entering={FadeInUp.delay(200).duration(500)} className="mb-6">
              <Pressable
                onPress={() => {
                  impact();
                  router.push("/(auth)/login" as any);
                }}
                accessibilityRole="button"
                accessibilityLabel={t.guest.loginExistingAccount}
              >
                <Text className="text-center text-sm underline" style={{ color: colors.primary }}>
                  {t.guest.loginExistingAccount}
                </Text>
              </Pressable>
            </Animated.View>
          )}

          {/* ── Section: Préférences ── */}
          <Animated.View entering={FadeInUp.delay(250).duration(500)} className="px-4 mb-6">
            <Text accessibilityRole="header" className="text-base font-bold px-2 mb-3" style={{ color: colors.textPrimary }}>
              {t.profile.preferences}
            </Text>
            <Card variant="elevated" className="overflow-hidden p-0">
              {flags.certificationsPreferencesEnabled && (
                <MenuItem
                  icon="shield-moon"
                  iconBgColor={isDark ? "rgba(29,229,96,0.1)" : "#ecfdf5"}
                  iconColor={colors.primary}
                  title={t.profile.preferredCertifications}
                  onPress={() => router.push("/settings/certifications" as any)}
                />
              )}
              <MenuItem
                icon="auto-stories"
                iconBgColor={isDark ? "rgba(168,85,247,0.1)" : "#f5f3ff"}
                iconColor={isDark ? "#c084fc" : "#7c3aed"}
                title={t.profile.madhab}
                onPress={() => router.push("/settings/madhab" as any)}
              />
              <MenuItem
                icon="no-food"
                iconBgColor={isDark ? "rgba(239,68,68,0.1)" : "#fef2f2"}
                iconColor={isDark ? "#f87171" : "#ef4444"}
                title={t.profile.dietaryExclusions}
                onPress={() => router.push("/settings/exclusions" as any)}
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
                isLast
                onPress={() => router.push("/settings/certifier-ranking" as any)}
              />
            </Card>
          </Animated.View>

          {/* ── Section: Général ── */}
          <Animated.View entering={FadeInUp.delay(300).duration(500)} className="px-4 mb-6">
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
                onPress={handleReplayOnboarding}
              />
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

          <Text className="text-center text-xs mb-8" style={{ color: colors.textMuted }}>
            {t.common.version} 2.1.0
          </Text>
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
            onPress={() => {
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

  // ── Naqiy+ Profile ──────────────────────────────────

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
              <BellSimpleIcon size={24} color={colors.iconSecondary} />
            </Pressable>
          ) : (
            <View className="w-10 h-10" />
          )}
          <Text accessibilityRole="header" className="text-lg font-bold tracking-tight" style={{ color: colors.textPrimary }}>
            {t.profile.title}
          </Text>
          <Pressable onPress={handleSettings} accessibilityRole="button" accessibilityLabel={t.common.settings} accessibilityHint={t.common.openSettings}>
            <GearIcon size={24} color={colors.iconSecondary} />
          </Pressable>
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header — Avatar with gold ring + name + edit */}
        <Animated.View
          entering={FadeInDown.delay(50).duration(500)}
          className="items-center pt-4 pb-6 px-6"
        >
          <PressableScale
            onPress={handleEditProfile}
            accessibilityRole="button"
            accessibilityLabel={t.common.profilePhoto}
            accessibilityHint={t.profile.editProfile}
          >
            <View className="relative mb-5">
              <View
                style={{
                  shadowColor: "#D4AF37",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.3,
                  shadowRadius: 20,
                }}
              >
                <Avatar
                  size="2xl"
                  source={profile?.avatarUrl ?? undefined}
                  fallback={userName}
                  premiumRing
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
        </Animated.View>

        {/* ── Section: Préférences — Naqiy+ Actif first ── */}
        <Animated.View entering={FadeInUp.delay(100).duration(500)} className="px-4 mb-6">
          <Text accessibilityRole="header" className="text-base font-bold px-2 mb-3" style={{ color: colors.textPrimary }}>
            {t.profile.preferences}
          </Text>
          <Card variant="elevated" className="overflow-hidden p-0">
            {/* Naqiy+ gold MenuItem — FIRST */}
            <MenuItem
              icon="workspace-premium"
              iconBgColor={isDark ? "rgba(212,175,55,0.12)" : "rgba(212,175,55,0.06)"}
              iconColor="#D4AF37"
              title="Naqiy+"
              subtitle={t.premium.active ?? "ACTIF"}
              onPress={() => router.push("/settings/premium" as any)}
            />
            <MenuItem
              icon="history"
              iconBgColor={isDark ? "rgba(59,130,246,0.1)" : "#eff6ff"}
              iconColor={isDark ? "#60a5fa" : "#2563eb"}
              title={t.profile.stats.scanHistory}
              onPress={handleScanHistory}
            />
            <MenuItem
              icon="favorite"
              iconBgColor={isDark ? "rgba(234,179,8,0.1)" : "#fef3c7"}
              iconColor="#eab308"
              title={t.profile.stats.favorites}
              onPress={handleFavorites}
            />
            {flags.certificationsPreferencesEnabled && (
              <MenuItem
                icon="shield-moon"
                iconBgColor={isDark ? "rgba(29,229,96,0.1)" : "#ecfdf5"}
                iconColor={colors.primary}
                title={t.profile.preferredCertifications}
                onPress={() => router.push("/settings/certifications" as any)}
              />
            )}
            <MenuItem
              icon="auto-stories"
              iconBgColor={isDark ? "rgba(168,85,247,0.1)" : "#f5f3ff"}
              iconColor={isDark ? "#c084fc" : "#7c3aed"}
              title={t.profile.madhab}
              onPress={() => router.push("/settings/madhab" as any)}
            />
            <MenuItem
              icon="no-food"
              iconBgColor={isDark ? "rgba(239,68,68,0.1)" : "#fef2f2"}
              iconColor={isDark ? "#f87171" : "#ef4444"}
              title={t.profile.dietaryExclusions}
              onPress={() => router.push("/settings/exclusions" as any)}
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
              icon="notifications"
              iconBgColor={isDark ? "rgba(168,85,247,0.1)" : "#faf5ff"}
              iconColor={isDark ? "#c084fc" : "#a855f7"}
              title={t.profile.pushNotifications}
              onPress={() => router.push("/settings/notifications" as any)}
            />
            <MenuItem
              icon="workspace-premium"
              iconBgColor={isDark ? "rgba(234,179,8,0.1)" : "#fefce8"}
              iconColor={isDark ? "#fbbf24" : "#ca8a04"}
              title={t.profile.certifierRanking}
              isLast
              onPress={() => router.push("/settings/certifier-ranking" as any)}
            />
          </Card>
        </Animated.View>

        {/* ── Section: Général ── */}
        <Animated.View entering={FadeInUp.delay(200).duration(500)} className="px-4 mb-6">
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
              onPress={handleReplayOnboarding}
            />
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
              onPress={() => Linking.openURL(APP_CONFIG.PRIVACY_POLICY_URL)}
            />
            <MenuItem
              icon="delete"
              iconBgColor={isDark ? "rgba(239,68,68,0.1)" : "#fee2e2"}
              iconColor={isDark ? "#f87171" : "#ef4444"}
              title={t.editProfile.deleteAccount}
              onPress={handleDeleteAccount}
            />
            <MenuItem
              icon="logout"
              iconBgColor={isDark ? "rgba(239,68,68,0.1)" : "#fee2e2"}
              iconColor={isDark ? "#f87171" : "#ef4444"}
              title={t.profile.logout}
              isLast
              onPress={handleLogout}
            />
          </Card>
        </Animated.View>

        <Text className="text-center text-xs mb-8" style={{ color: colors.textMuted }}>
          {t.common.version} 2.1.0
        </Text>
      </ScrollView>
    </View>
  );
}
