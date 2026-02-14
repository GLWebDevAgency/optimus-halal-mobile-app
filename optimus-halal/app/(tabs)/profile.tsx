/**
 * User Profile Screen
 * 
 * Profil utilisateur avec:
 * - Avatar et informations
 * - Stats (scans, favoris)
 * - Préférences (certifications, exclusions, notifications)
 * - Compte (langue, aide, signalement)
 * - Déconnexion
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  useColorScheme,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useHaptics } from "@/hooks";
import { ImpactFeedbackStyle } from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";

import { Card, Avatar, Badge, IconButton } from "@/components/ui";
import { useLocalAuthStore, useScanHistoryStore, useThemeStore, useLocalAlertsStore, useLanguageStore, usePreferencesStore } from "@/store";
import { colors } from "@/constants/theme";
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={subtitle ? subtitle : undefined}
      className={`flex-row items-center justify-between p-4 ${
        !isLast ? "border-b border-slate-100 dark:border-white/5" : ""
      }`}
    >
      <View className="flex-row items-center gap-3">
        <View
          className="w-8 h-8 rounded-lg items-center justify-center"
          style={{ backgroundColor: iconBgColor }}
        >
          <MaterialIcons name={icon} size={18} color={iconColor} />
        </View>
        <Text className="text-slate-700 dark:text-slate-200 font-medium text-sm">
          {title}
        </Text>
      </View>
      {rightElement || (
        <View className="flex-row items-center gap-2">
          {subtitle && (
            <Text className="text-slate-400 dark:text-slate-500 text-xs">
              {subtitle}
            </Text>
          )}
          <MaterialIcons
            name="chevron-right"
            size={20}
            color={isDark ? "#475569" : "#94a3b8"}
          />
        </View>
      )}
    </TouchableOpacity>
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
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${subtitle}`}
      className="flex-1 p-4 rounded-2xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-white/5"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center mb-3"
        style={{ backgroundColor: iconBgColor }}
      >
        <MaterialIcons name={icon} size={20} color={iconColor} />
      </View>
      <Text className="text-slate-900 dark:text-white font-bold text-sm">
        {title}
      </Text>
      <Text className="text-slate-500 dark:text-slate-400 text-xs mt-1">
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
});

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { impact } = useHaptics();
  const isDark = colorScheme === "dark";
  const { t, language } = useTranslation();

  const { user, logout } = useLocalAuthStore();
  const { history, favorites } = useScanHistoryStore();
  const { theme, setTheme } = useThemeStore();
  const { certifications } = usePreferencesStore();

  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(true);

  const userName = useMemo(() => user?.fullName || "Utilisateur", [user]);
  const userEmail = useMemo(() => user?.email || "", [user]);

  const stats = useMemo(
    () => ({
      scanned: history.length || 128,
      favorites: favorites.length || 24,
    }),
    [history, favorites]
  );

  const handleSettings = useCallback(async () => {
    impact();
    Alert.alert("Paramètres", "Cette fonctionnalité sera disponible prochainement.");
  }, []);

  const handleEditProfile = useCallback(async () => {
    impact();
    router.push("/settings/edit-profile" as any);
  }, []);

  const handleScanHistory = useCallback(async () => {
    impact();
    router.push("/scan-result" as any);
  }, []);

  const handleFavorites = useCallback(async () => {
    impact();
    router.push("/settings/favorites" as any);
  }, []);

  const handleToggleNotifications = useCallback(async (value: boolean) => {
    impact();
    setPushNotificationsEnabled(value);
  }, []);

  const handleLogout = useCallback(async () => {
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
            logout();
            router.replace("/(auth)/welcome");
          },
        },
      ]
    );
  }, [logout, t]);

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        className="bg-background-light/95 dark:bg-background-dark/95 border-b border-transparent dark:border-white/5"
        style={{ paddingTop: insets.top }}
      >
        <View className="flex-row items-center justify-between p-4">
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/alerts" as any)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            accessibilityHint="Voir les alertes"
            className="w-10 h-10 items-center justify-center"
          >
            <MaterialIcons
              name="notifications"
              size={24}
              color={isDark ? "#94a3b8" : "#64748b"}
            />
          </TouchableOpacity>
          <Text accessibilityRole="header" className="text-slate-900 dark:text-white text-lg font-bold tracking-tight">
            {t.profile.title}
          </Text>
          <TouchableOpacity onPress={handleSettings} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Paramètres" accessibilityHint="Ouvrir les paramètres">
            <MaterialIcons
              name="settings"
              size={24}
              color={isDark ? "#94a3b8" : "#64748b"}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          className="items-center pt-4 pb-8 px-6"
        >
          {/* Avatar */}
          <TouchableOpacity
            onPress={handleEditProfile}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel="Photo de profil"
            accessibilityHint="Modifier le profil"
            className="relative mb-5"
          >
            <View
              className="w-28 h-28 rounded-full overflow-hidden border-4 border-white dark:border-surface-dark"
              style={{
                shadowColor: "#1de560",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: isDark ? 0.15 : 0,
                shadowRadius: 15,
              }}
            >
              <Avatar
                size="2xl"
                source={user?.avatarUrl}
                fallback={userName}
              />
            </View>
            <View className="absolute bottom-0 right-0 bg-primary rounded-full p-2 border-4 border-background-light dark:border-background-dark">
              <MaterialIcons name="edit" size={14} color="#ffffff" />
            </View>
          </TouchableOpacity>

          {/* Name */}
          <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {userName}
          </Text>

          {/* Badge */}
          <View className="flex-row items-center gap-1.5 mb-6 bg-primary/5 dark:bg-primary/10 px-3 py-1 rounded-full border border-primary/10 dark:border-primary/20">
            <MaterialIcons name="verified" size={16} color="#1de560" />
            <Text className="text-primary font-medium text-xs uppercase tracking-wide">
              {t.profile.consciousConsumer}
            </Text>
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity
            onPress={handleEditProfile}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel={t.profile.editProfile}
            className="h-11 px-8 rounded-full bg-slate-900 dark:bg-surface-dark dark:border dark:border-white/10 items-center justify-center w-full max-w-[200px]"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <Text className="font-semibold text-sm text-white">
              {t.profile.editProfile}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Stats Cards */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(500)}
          className="flex-row gap-3 px-4 mb-8"
        >
          <StatsCard
            icon="history"
            iconBgColor={isDark ? "rgba(59,130,246,0.1)" : "#eff6ff"}
            iconColor={isDark ? "#60a5fa" : "#2563eb"}
            title="Historique Scans"
            subtitle={`${stats.scanned} produits scannés`}
            onPress={handleScanHistory}
          />
          <StatsCard
            icon="favorite"
            iconBgColor={isDark ? "rgba(234,179,8,0.1)" : "#fef3c7"}
            iconColor="#eab308"
            title="Favoris"
            subtitle={`${stats.favorites} produits sauvegardés`}
            onPress={handleFavorites}
          />
        </Animated.View>

        {/* Preferences Section */}
        <Animated.View
          entering={FadeInUp.delay(300).duration(500)}
          className="px-4 mb-6"
        >
          <Text accessibilityRole="header" className="text-slate-900 dark:text-slate-200 text-base font-bold px-2 mb-3">
            {t.profile.preferences}
          </Text>
          <Card variant="elevated" className="overflow-hidden p-0">
            <MenuItem
              icon="shield-moon"
              iconBgColor={isDark ? "rgba(29,229,96,0.1)" : "#ecfdf5"}
              iconColor="#1de560"
              title={t.profile.preferredCertifications}
              subtitle={certifications.slice(0, 2).join(", ").toUpperCase() || "—"}
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
              isLast
              onPress={() => router.push("/settings/notifications" as any)}
            />
          </Card>
        </Animated.View>

        {/* Account Section */}
        <Animated.View
          entering={FadeInUp.delay(400).duration(500)}
          className="px-4 mb-8"
        >
          <Text accessibilityRole="header" className="text-slate-900 dark:text-slate-200 text-base font-bold px-2 mb-3">
            {t.profile.account}
          </Text>
          <Card variant="elevated" className="overflow-hidden p-0">
            <MenuItem
              icon="palette"
              iconBgColor={isDark ? "rgba(168,85,247,0.1)" : "#faf5ff"}
              iconColor={isDark ? "#c084fc" : "#a855f7"}
              title="Apparence"
              subtitle={theme === "system" ? "Auto" : theme === "light" ? "Clair" : "Sombre"}
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
          entering={FadeInUp.delay(500).duration(500)}
          className="px-4 mb-8"
        >
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel={t.profile.logout}
            className="w-full bg-white dark:bg-surface-dark border border-red-100 dark:border-red-900/30 rounded-xl p-3.5 flex-row items-center justify-center gap-2"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <MaterialIcons name="logout" size={18} color="#ef4444" />
            <Text className="font-bold text-sm text-red-600 dark:text-red-400">
              {t.profile.logout}
            </Text>
          </TouchableOpacity>

          <Text className="text-center text-slate-400 dark:text-slate-600 text-xs mt-6">
            Version 2.1.0
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
