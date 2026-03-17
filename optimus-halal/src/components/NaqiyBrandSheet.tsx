/**
 * NaqiyBrandSheet — Brand bottom sheet triggered from the Naqiy badge.
 *
 * 2 states only:
 *  - Guest: join Naqiy+ CTA (outcome-oriented), social proof, theme switcher
 *  - Naqiy+: account info, subscription status, quick actions, logout, theme switcher
 *
 * Uses Reanimated 3 for animations (no external bottom-sheet library).
 * Follows Al-Ihsan (springNaqiy), Al-Taqwa (zero dark patterns), Al-Niyyah (servir, pas juger).
 */

import React, { useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  useReducedMotion,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { router } from "expo-router";
import {
  BellSimpleIcon,
  GlobeHemisphereWestIcon,
  SignOutIcon,
  SignInIcon,
  UserPlusIcon,
  ScanIcon,
  ShieldCheckIcon,
  HeartIcon,
  CaretRightIcon,
  DeviceMobileIcon,
  SunIcon,
  MoonIcon,
  CircleHalfIcon,
  StarFourIcon,
} from "phosphor-react-native";

import { useTheme, type ThemeMode } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { useHaptics } from "@/hooks/useHaptics";
import { useLogout } from "@/hooks/useAuth";
import { usePremium } from "@/hooks/usePremium";
import { useLanguageStore } from "@/store";
import { brand, gold, glass } from "@/theme/colors";
import { springNaqiy } from "@/theme/animations";
import { APP_CONFIG } from "@/constants/config";
import { ImpactFeedbackStyle } from "expo-haptics";

const logoSource = require("@assets/images/logo_naqiy.webp");
const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
const SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.78;

// ── Types ──────────────────────────────────────────────────────────────────

interface NaqiyBrandSheetProps {
  visible: boolean;
  onClose: () => void;
  isGuest: boolean;
  user: { displayName: string | null; email: string } | null;
}

// ── Component ──────────────────────────────────────────────────────────────

export function NaqiyBrandSheet({ visible, onClose, isGuest, user }: NaqiyBrandSheetProps) {
  const insets = useSafeAreaInsets();
  const { isDark, colors, theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const { impact } = useHaptics();
  const { isPremium, expiresAt } = usePremium();
  const logoutMutation = useLogout();
  const language = useLanguageStore((s) => s.language);
  const reducedMotion = useReducedMotion();

  // Animation values
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  // Open/close animation
  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 200 });
      translateY.value = reducedMotion
        ? 0
        : withSpring(0, springNaqiy);
    } else {
      backdropOpacity.value = withTiming(0, { duration: 150 });
      translateY.value = reducedMotion
        ? SCREEN_HEIGHT
        : withSpring(SCREEN_HEIGHT, { damping: 20, stiffness: 200 });
    }
  }, [visible, reducedMotion]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
    pointerEvents: backdropOpacity.value > 0 ? "auto" as const : "none" as const,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleClose = useCallback(() => {
    backdropOpacity.value = withTiming(0, { duration: 150 });
    translateY.value = withSpring(SCREEN_HEIGHT, { damping: 20, stiffness: 200 }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
  }, [onClose]);

  const handleJoinNaqiyPlus = useCallback(() => {
    impact(ImpactFeedbackStyle.Medium);
    handleClose();
    setTimeout(() => router.push({ pathname: "/paywall" as any, params: { trigger: "generic" } }), 300);
  }, [impact, handleClose]);

  const handleLogin = useCallback(() => {
    impact();
    handleClose();
    setTimeout(() => router.push("/(auth)/login" as any), 300);
  }, [impact, handleClose]);

  const handleSignup = useCallback(() => {
    impact();
    handleClose();
    setTimeout(() => router.push("/(auth)/signup" as any), 300);
  }, [impact, handleClose]);

  const handleManageSubscription = useCallback(() => {
    impact();
    // Opens native subscription management on iOS/Android
    if (Platform.OS === "ios") {
      router.push("https://apps.apple.com/account/subscriptions" as any);
    } else {
      router.push("https://play.google.com/store/account/subscriptions" as any);
    }
  }, [impact]);

  const handleNotifications = useCallback(() => {
    impact();
    handleClose();
    setTimeout(() => router.push("/settings/notifications" as any), 300);
  }, [impact, handleClose]);

  const handleLanguage = useCallback(() => {
    impact();
    handleClose();
    setTimeout(() => router.push("/settings/language" as any), 300);
  }, [impact, handleClose]);

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
              onSuccess: () => {
                handleClose();
                setTimeout(() => router.replace("/(auth)/welcome"), 300);
              },
            });
          },
        },
      ],
    );
  }, [impact, t, logoutMutation, handleClose]);

  const handleThemeChange = useCallback((newTheme: ThemeMode) => {
    impact();
    setTheme(newTheme);
  }, [impact, setTheme]);

  // ── Derived values ──────────────────────────────────────────────────────

  const languageLabel = useMemo(() => {
    const labels: Record<string, string> = { fr: "Français", en: "English", ar: "العربية" };
    return labels[language] ?? "Français";
  }, [language]);

  const renewalDateLabel = useMemo(() => {
    if (!expiresAt) return null;
    return expiresAt.toLocaleDateString(language === "ar" ? "ar-SA" : language === "en" ? "en-US" : "fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [expiresAt, language]);

  // ── Styles ──────────────────────────────────────────────────────────────

  const cardBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.95)";
  const cardBorder = isDark ? "rgba(212,175,55,0.08)" : "rgba(0,0,0,0.06)";
  const textPrimary = colors.textPrimary;
  const textMuted = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)";
  const dividerColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const sheetBg = isDark ? "#0C0C0C" : "#F8F7F4";

  if (!visible && translateY.value === SCREEN_HEIGHT) return null;

  return (
    <>
      {/* Backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle, { zIndex: 100 }]}>
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.35)" }]}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel={t.common.close}
        />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          sheetStyle,
          {
            backgroundColor: isDark ? "#141414" : "#FFFFFF",
            borderTopColor: isDark ? "rgba(212,175,55,0.12)" : "rgba(0,0,0,0.06)",
            borderLeftColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
            borderRightColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
            maxHeight: SHEET_MAX_HEIGHT,
            paddingBottom: insets.bottom + 80,
            zIndex: 101,
          },
        ]}
      >
        {/* Drag handle */}
        <View style={styles.handleRow}>
          <View style={[styles.handle, { backgroundColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)" }]} />
        </View>

        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {isGuest ? (
            <GuestContent
              isDark={isDark}
              colors={{ cardBg, cardBorder, textPrimary, textMuted, dividerColor, sheetBg }}
              t={t}
              theme={theme}
              onThemeChange={handleThemeChange}
              onJoinPlus={handleJoinNaqiyPlus}
              onLogin={handleLogin}
            />
          ) : (
            <PremiumContent
              isDark={isDark}
              colors={{ cardBg, cardBorder, textPrimary, textMuted, dividerColor, sheetBg }}
              t={t}
              theme={theme}
              user={user}
              isPremium={isPremium}
              renewalDate={renewalDateLabel}
              languageLabel={languageLabel}
              onThemeChange={handleThemeChange}
              onManageSubscription={handleManageSubscription}
              onNotifications={handleNotifications}
              onLanguage={handleLanguage}
              onLogout={handleLogout}
            />
          )}
        </ScrollView>
      </Animated.View>
    </>
  );
}

// ── Guest Content ──────────────────────────────────────────────────────────

interface ContentColors {
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textMuted: string;
  dividerColor: string;
  sheetBg: string;
}

interface GuestContentProps {
  isDark: boolean;
  colors: ContentColors;
  t: any;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  onJoinPlus: () => void;
  onLogin: () => void;
}

function GuestContent({ isDark, colors, t, theme, onThemeChange, onJoinPlus, onLogin }: GuestContentProps) {
  return (
    <View>
      {/* Logo + Title */}
      <View style={styles.headerCenter}>
        <View style={[styles.logoRing, { borderColor: "rgba(212,175,55,0.3)" }]}>
          <Image
            source={logoSource}
            style={styles.logoImage}
            contentFit="contain"
            cachePolicy="memory-disk"
          />
        </View>
        <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
          {t.brandSheet.guestTitle}
        </Text>
        <Text style={[styles.sheetSubtitle, { color: colors.textMuted }]}>
          {APP_CONFIG.TAGLINE}
        </Text>
      </View>

      {/* Benefits — outcome-oriented */}
      <View style={styles.section}>
        <BenefitItem
          icon={<ScanIcon size={20} color={brand.gold} weight="duotone" />}
          title={t.brandSheet.benefitScanTitle}
          subtitle={t.brandSheet.benefitScanSubtitle}
          isDark={isDark}
          colors={colors}
        />
        <BenefitItem
          icon={<ShieldCheckIcon size={20} color={brand.gold} weight="duotone" />}
          title={t.brandSheet.benefitProtectTitle}
          subtitle={t.brandSheet.benefitProtectSubtitle}
          isDark={isDark}
          colors={colors}
        />
        <BenefitItem
          icon={<HeartIcon size={20} color={brand.gold} weight="duotone" />}
          title={t.brandSheet.benefitSaveTitle}
          subtitle={t.brandSheet.benefitSaveSubtitle}
          isDark={isDark}
          colors={colors}
        />
      </View>

      {/* Value proposition — honest, no fake metrics */}
      <View style={styles.socialProof}>
        <Text style={[styles.socialProofText, { color: colors.textMuted }]}>
          {t.brandSheet.valueProposition}
        </Text>
      </View>

      {/* CTA — Join Naqiy+ */}
      <Pressable
        onPress={onJoinPlus}
        accessibilityRole="button"
        accessibilityLabel={t.brandSheet.joinCta}
      >
        <View style={styles.ctaButton}>
          <StarFourIcon size={18} color="#0C0C0C" weight="fill" />
          <Text style={styles.ctaText}>{t.brandSheet.joinCta}</Text>
        </View>
      </Pressable>

      {/* Price + cancellation */}
      <Text style={[styles.priceText, { color: brand.gold }]}>
        {t.brandSheet.priceFrom}
      </Text>
      <Text style={[styles.cancelText, { color: colors.textMuted }]}>
        {t.brandSheet.cancelAnytime}
      </Text>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.dividerColor }]} />

      {/* Already a member */}
      <Pressable
        onPress={onLogin}
        accessibilityRole="button"
        accessibilityLabel={t.brandSheet.alreadyMember}
      >
        <View style={[styles.secondaryButton, {
          backgroundColor: colors.cardBg,
          borderColor: colors.cardBorder,
        }]}>
          <SignInIcon size={18} color={colors.textMuted} />
          <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>
            {t.brandSheet.alreadyMember}
          </Text>
        </View>
      </Pressable>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.dividerColor }]} />

      {/* Theme Switcher */}
      <ThemeSwitcher
        theme={theme}
        isDark={isDark}
        colors={colors}
        t={t}
        onThemeChange={onThemeChange}
      />
    </View>
  );
}

// ── Premium Content ────────────────────────────────────────────────────────

interface PremiumContentProps {
  isDark: boolean;
  colors: ContentColors;
  t: any;
  theme: ThemeMode;
  user: any;
  isPremium: boolean;
  renewalDate: string | null;
  languageLabel: string;
  onThemeChange: (theme: ThemeMode) => void;
  onManageSubscription: () => void;
  onNotifications: () => void;
  onLanguage: () => void;
  onLogout: () => void;
}

function PremiumContent({
  isDark,
  colors,
  t,
  theme,
  user,
  isPremium,
  renewalDate,
  languageLabel,
  onThemeChange,
  onManageSubscription,
  onNotifications,
  onLanguage,
  onLogout,
}: PremiumContentProps) {
  const displayName = user?.displayName ?? user?.email?.split("@")[0] ?? "Membre";

  return (
    <View>
      {/* Avatar + User Info — horizontal layout like mockup */}
      <View style={styles.userHeader}>
        {/* Avatar with gold gradient ring */}
        <View style={[
          styles.avatarRing,
          isPremium && styles.avatarRingGold,
          isPremium && { shadowColor: brand.gold, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
        ]}>
          <View style={[styles.avatarCircle, { backgroundColor: isDark ? "rgba(212,175,55,0.15)" : "rgba(212,175,55,0.1)" }]}>
            <Text style={[styles.avatarInitial, { color: brand.gold }]}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Name + Email + Badge */}
        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <Text style={[styles.userName, { color: colors.textPrimary }]} numberOfLines={1}>
              {displayName}
            </Text>
            <View style={[styles.tierBadge, isPremium ? styles.tierBadgePremium : { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }]}>
              <Text style={[
                styles.tierBadgeText,
                isPremium
                  ? { color: "#0C0C0C", fontWeight: "700" }
                  : { color: colors.textMuted },
              ]}>
                {isPremium ? "Naqiy+" : t.brandSheet.tierFree}
              </Text>
            </View>
          </View>
          {user?.email && (
            <Text style={[styles.userEmail, { color: colors.textMuted }]} numberOfLines={1}>
              {user.email}
            </Text>
          )}
          {isPremium && (
            <Text style={styles.memberSince}>
              {t.brandSheet.memberSince}
            </Text>
          )}
        </View>
      </View>

      {/* Subscription card (premium only) */}
      {isPremium && (
        <View style={[styles.subscriptionCard, {
          backgroundColor: isDark ? "rgba(212,175,55,0.04)" : "rgba(212,175,55,0.03)",
          borderColor: isDark ? "rgba(212,175,55,0.15)" : "rgba(212,175,55,0.12)",
          borderTopColor: brand.gold,
          borderTopWidth: 2,
          shadowColor: brand.gold,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.15 : 0.08,
          shadowRadius: 12,
          elevation: 4,
        }]}>
          <View style={styles.subscriptionRow}>
            <View style={[styles.statusDot, { backgroundColor: "#22c55e", shadowColor: "#22c55e", shadowOpacity: 0.4, shadowRadius: 6, elevation: 2 }]} />
            <Text style={[styles.subscriptionActiveText, { color: colors.textPrimary }]}>
              {t.brandSheet.subscriptionActive}
            </Text>
          </View>
          {renewalDate && (
            <Text style={[styles.renewalText, { color: colors.textMuted }]}>
              {t.brandSheet.renewalDate.replace("{{date}}", renewalDate)}
            </Text>
          )}
          <Pressable onPress={onManageSubscription} accessibilityRole="link">
            <Text style={[styles.manageLink, { color: brand.gold }]}>
              {t.brandSheet.manageSubscription}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Upgrade CTA for non-premium authenticated users */}
      {!isPremium && (
        <>
          <Pressable
            onPress={() => {
              router.push({ pathname: "/paywall" as any, params: { trigger: "generic" } });
            }}
            accessibilityRole="button"
            accessibilityLabel={t.brandSheet.upgradeCta}
          >
            <View style={[styles.upgradeCard, {
              backgroundColor: colors.cardBg,
              borderColor: brand.gold,
            }]}>
              <StarFourIcon size={22} color={brand.gold} weight="fill" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.upgradeTitle, { color: brand.gold }]}>
                  {t.brandSheet.upgradeCta}
                </Text>
                <Text style={[styles.upgradeSubtitle, { color: colors.textMuted }]}>
                  {t.brandSheet.upgradeSubtitle}
                </Text>
              </View>
              <CaretRightIcon size={18} color={brand.gold} />
            </View>
          </Pressable>
        </>
      )}

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.dividerColor }]} />

      {/* Theme Switcher */}
      <ThemeSwitcher
        theme={theme}
        isDark={isDark}
        colors={colors}
        t={t}
        onThemeChange={onThemeChange}
      />

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.dividerColor }]} />

      {/* Quick Actions */}
      <QuickAction
        icon={<BellSimpleIcon size={20} color={isDark ? "#fff" : "#0d1b13"} />}
        label={t.brandSheet.notifications}
        onPress={onNotifications}
        isDark={isDark}
        colors={colors}
      />
      <QuickAction
        icon={<GlobeHemisphereWestIcon size={20} color={isDark ? "#fff" : "#0d1b13"} />}
        label={t.brandSheet.language}
        value={languageLabel}
        onPress={onLanguage}
        isDark={isDark}
        colors={colors}
      />
      <QuickAction
        icon={<DeviceMobileIcon size={20} color={isDark ? "#fff" : "#0d1b13"} />}
        label={t.brandSheet.version}
        value={`${APP_CONFIG.VERSION} (MVP)`}
        isDark={isDark}
        colors={colors}
        disabled
      />

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.dividerColor }]} />

      {/* Logout */}
      <Pressable
        onPress={onLogout}
        accessibilityRole="button"
        accessibilityLabel={t.profile.logout}
      >
        <View style={styles.logoutRow}>
          <View style={[styles.logoutIconBg, { backgroundColor: "rgba(239,68,68,0.1)" }]}>
            <SignOutIcon size={18} color="#ef4444" />
          </View>
          <Text style={styles.logoutText}>{t.profile.logout}</Text>
        </View>
      </Pressable>
    </View>
  );
}

// ── Reusable Sub-Components ────────────────────────────────────────────────

function BenefitItem({
  icon,
  title,
  subtitle,
  isDark,
  colors,
}: {
  icon: React.ReactElement;
  title: string;
  subtitle: string;
  isDark: boolean;
  colors: ContentColors;
}) {
  return (
    <View style={[styles.benefitCard, {
      backgroundColor: colors.cardBg,
      borderColor: colors.cardBorder,
    }]}>
      <View style={[styles.benefitIconBg, { backgroundColor: isDark ? "rgba(212,175,55,0.1)" : "rgba(212,175,55,0.08)" }]}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.benefitTitle, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.benefitSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
      </View>
    </View>
  );
}

function ThemeSwitcher({
  theme,
  isDark,
  colors,
  t,
  onThemeChange,
}: {
  theme: ThemeMode;
  isDark: boolean;
  colors: ContentColors;
  t: any;
  onThemeChange: (theme: ThemeMode) => void;
}) {
  const themes: { key: ThemeMode; icon: React.ReactElement; label: string }[] = [
    { key: "light", icon: <SunIcon size={15} color={theme === "light" ? "#0C0C0C" : (isDark ? "#fff" : "#0d1b13")} weight={theme === "light" ? "fill" : "regular"} />, label: t.brandSheet.themeLight },
    { key: "system", icon: <CircleHalfIcon size={15} color={theme === "system" ? "#0C0C0C" : (isDark ? "#fff" : "#0d1b13")} weight={theme === "system" ? "fill" : "regular"} />, label: t.brandSheet.themeSystem },
    { key: "dark", icon: <MoonIcon size={15} color={theme === "dark" ? "#0C0C0C" : (isDark ? "#fff" : "#0d1b13")} weight={theme === "dark" ? "fill" : "regular"} />, label: t.brandSheet.themeDark },
  ];

  return (
    <View style={styles.themeSection}>
      <Text style={[styles.themeSectionLabel, { color: colors.textMuted }]}>
        {t.brandSheet.appearance}
      </Text>
      <View style={[styles.themePillRow, { backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }]}>
        {themes.map(({ key, icon, label }) => (
          <Pressable
            key={key}
            onPress={() => onThemeChange(key)}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected: theme === key }}
            style={[
              styles.themePill,
              theme === key && styles.themePillActive,
            ]}
          >
            {icon}
            <Text style={[
              styles.themePillText,
              { color: theme === key ? "#0C0C0C" : (isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)") },
              theme === key && { fontWeight: "600" },
            ]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function QuickAction({
  icon,
  label,
  value,
  onPress,
  isDark,
  colors,
  disabled,
}: {
  icon: React.ReactElement;
  label: string;
  value?: string;
  onPress?: () => void;
  isDark: boolean;
  colors: ContentColors;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole={disabled ? "text" : "button"}
      accessibilityLabel={label}
      style={{ opacity: disabled ? 0.6 : 1 }}
    >
      <View style={styles.quickAction}>
        {icon}
        <Text style={[styles.quickActionLabel, { color: colors.textPrimary }]}>{label}</Text>
        <View style={{ flex: 1 }} />
        {value != null && (
          <Text style={[styles.quickActionValue, { color: colors.textMuted }]}>{value}</Text>
        )}
        {!disabled && <CaretRightIcon size={16} color={colors.textMuted} />}
      </View>
    </Pressable>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    zIndex: 101,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 32,
    borderTopWidth: 1,
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
  },
  handleRow: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 6,
  },
  handle: {
    width: 48,
    height: 4,
    borderRadius: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  // Header
  headerCenter: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 16,
  },
  logoRing: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  logoImage: {
    width: 36,
    height: 36,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Benefits
  section: {
    gap: 8,
    marginBottom: 16,
  },
  benefitCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  benefitIconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  benefitSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },

  // Social proof
  socialProof: {
    alignItems: "center",
    marginBottom: 16,
  },
  socialProofText: {
    fontSize: 12,
    fontStyle: "italic",
  },

  // CTA — premium gold with glow
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: brand.gold,
    paddingVertical: 15,
    borderRadius: 14,
    marginBottom: 8,
    shadowColor: brand.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0C0C0C",
    letterSpacing: -0.2,
  },
  priceText: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 2,
  },
  cancelText: {
    fontSize: 11,
    textAlign: "center",
    marginBottom: 16,
  },

  // Secondary button
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 4,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },

  // Divider
  divider: {
    height: 1,
    marginVertical: 14,
  },

  // User header — horizontal layout (avatar left, info right)
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingTop: 8,
    paddingBottom: 20,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  memberSince: {
    fontSize: 11,
    marginTop: 3,
    color: brand.gold,
    fontWeight: "500",
  },
  avatarRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2.5,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarRingGold: {
    borderColor: brand.gold,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: "700",
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
  },
  userEmail: {
    fontSize: 13,
    marginTop: 1,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tierBadgePremium: {
    backgroundColor: brand.gold,
    shadowColor: brand.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  tierBadgeText: {
    fontSize: 11,
  },

  // Subscription card
  subscriptionCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 4,
    gap: 6,
  },
  subscriptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  subscriptionActiveText: {
    fontSize: 14,
    fontWeight: "600",
  },
  renewalText: {
    fontSize: 12,
  },
  manageLink: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },

  // Upgrade card
  upgradeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginTop: 8,
  },
  upgradeTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  upgradeSubtitle: {
    fontSize: 12,
  },

  // Theme
  themeSection: {
    alignItems: "center",
    gap: 8,
  },
  themeSectionLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "500",
  },
  themePillRow: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 3,
    gap: 2,
  },
  themePill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 8,
    borderRadius: 10,
  },
  themePillActive: {
    backgroundColor: brand.gold,
  },
  themePillText: {
    fontSize: 12,
  },

  // Quick actions
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 13,
    paddingHorizontal: 4,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  quickActionValue: {
    fontSize: 13,
    marginRight: 4,
  },

  // Logout
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  logoutIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ef4444",
  },
});
