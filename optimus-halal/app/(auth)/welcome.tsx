/**
 * Welcome Screen — Naqiy
 *
 * First impression. The most critical screen in the entire app.
 * 2-tier model: Guest (free, limited scans) / Naqiy+ (paid, unlimited).
 *
 * Psychology: Value → Trust → Action
 *  1. Show what the app does (scan halal products) — emotional hook
 *  2. Build trust (social proof, scholarly backing)
 *  3. Offer clear paths (start free / discover Naqiy+ / login)
 *
 * Principles:
 *  - Al-Niyyah: Truth is always free. Guest CTA is primary.
 *  - Al-Taqwa: Zero dark patterns. No pressure, no FOMO.
 *  - Al-Ihsan: springNaqiy signature, choreographed animations.
 *
 * Supports: French, English, Arabic (RTL)
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Linking,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ScanIcon,
  MapPinIcon,
  ShieldCheckIcon,
  StarIcon,
  CaretRightIcon,
} from "phosphor-react-native";
import { Image } from "expo-image";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { PremiumBackground } from "@/components/ui";
import { PressableScale } from "@/components/ui/PressableScale";
import { useTranslation, useHaptics, useTheme } from "@/hooks";
import { APP_CONFIG } from "@/constants/config";
import { brand, gold } from "@/theme/colors";
import { getCustomerInfo, isPremiumCustomer } from "@/services/purchases";

const logoSource = require("@assets/images/logo_naqiy.webp");

export default function AuthWelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { impact } = useHaptics();
  const { t, isRTL } = useTranslation();
  const { height } = useWindowDimensions();

  // Detect orphaned premium: user paid but hasn't created account
  const [hasOrphanedPremium, setHasOrphanedPremium] = useState(false);
  useEffect(() => {
    getCustomerInfo()
      .then((info) => {
        if (info && isPremiumCustomer(info)) {
          setHasOrphanedPremium(true);
        }
      })
      .catch(() => {});
  }, []);

  // Subtle glow animation on the logo
  const glowOpacity = useSharedValue(0.4);
  React.useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: interpolate(glowOpacity.value, [0.4, 0.7], [1, 1.15]) }],
  }));

  // ── Navigation ──────────────────────────────────────────────
  const handleStartFree = useCallback(() => {
    impact();
    if (hasOrphanedPremium) {
      // Premium user who quit before signup — go create their account
      router.push("/(auth)/signup");
    } else {
      router.replace("/(tabs)");
    }
  }, [impact, hasOrphanedPremium]);

  const handleDiscoverPlus = useCallback(() => {
    impact();
    // TODO: Navigate to RevenueCat paywall
    router.push("/(auth)/login");
  }, [impact]);

  const handleLogin = useCallback(() => {
    impact();
    router.push("/(auth)/login");
  }, [impact]);

  // Compact layout for smaller screens (iPhone SE, etc.)
  const isCompact = height < 700;

  return (
    <View style={styles.container}>
      <PremiumBackground />

      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + (isCompact ? 24 : 48),
            paddingBottom: insets.bottom + 16,
          },
        ]}
      >
        {/* ── HERO SECTION ─────────────────────────────────── */}
        {/* Logo + Brand + Tagline — Emotional hook */}
        <Animated.View
          entering={FadeIn.delay(100).duration(800)}
          style={styles.heroSection}
        >
          {/* Logo with glow ring */}
          <View style={styles.logoContainer}>
            <Animated.View
              style={[
                styles.logoGlow,
                glowStyle,
                {
                  backgroundColor: isDark
                    ? "rgba(212, 175, 55, 0.15)"
                    : "rgba(19, 236, 106, 0.12)",
                },
              ]}
            />
            <View
              style={[
                styles.logoCard,
                {
                  backgroundColor: isDark ? "#1A1A1A" : "#ffffff",
                  borderColor: isDark
                    ? "rgba(207, 165, 51, 0.2)"
                    : "rgba(0, 0, 0, 0.06)",
                },
              ]}
              accessible={false}
            >
              <Image
                source={logoSource}
                style={styles.logoImage}
                contentFit="contain"
                cachePolicy="memory-disk"
              />
            </View>
          </View>

          {/* Brand Name */}
          <Text
            style={[
              styles.brandName,
              { color: colors.textPrimary },
            ]}
            accessibilityRole="header"
          >
            {t.auth.welcome.appName}
          </Text>

          {/* Tagline — the mission in one line */}
          <Text
            style={[
              styles.tagline,
              {
                color: isDark ? gold[400] : gold[600],
                textAlign: isRTL ? "right" : "center",
              },
            ]}
          >
            {t.auth.welcome.tagline}
          </Text>
        </Animated.View>

        {/* ── VALUE PROPOSITION ────────────────────────────── */}
        {/* What you get for FREE — builds desire before any ask */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(600)}
          style={styles.valueSection}
        >
          <Text
            style={[
              styles.valueTitle,
              {
                color: colors.textPrimary,
                textAlign: isRTL ? "right" : "center",
              },
            ]}
          >
            {t.auth.welcome.valueTitle}
          </Text>

          <View style={styles.valueGrid}>
            {[
              {
                icon: ScanIcon,
                text: t.auth.welcome.valueScan,
                color: brand.primary,
              },
              {
                icon: MapPinIcon,
                text: t.auth.welcome.valueMap,
                color: "#3b82f6",
              },
              {
                icon: ShieldCheckIcon,
                text: t.auth.welcome.valueMadhab,
                color: gold[500],
              },
            ].map((item, index) => (
              <Animated.View
                key={index}
                entering={FadeInDown.delay(400 + index * 80).duration(500)}
                style={[
                  styles.valueItem,
                  {
                    flexDirection: isRTL ? "row-reverse" : "row",
                  },
                ]}
              >
                <View
                  style={[
                    styles.valueIconCircle,
                    {
                      backgroundColor: isDark
                        ? `${item.color}15`
                        : `${item.color}10`,
                    },
                  ]}
                >
                  <item.icon
                    size={18}
                    color={item.color}
                    weight="duotone"
                  />
                </View>
                <Text
                  style={[
                    styles.valueText,
                    {
                      color: colors.textSecondary,
                      textAlign: isRTL ? "right" : "left",
                    },
                  ]}
                >
                  {item.text}
                </Text>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* ── ACTION SECTION ───────────────────────────────── */}
        {/* Primary: Start Free (Al-Niyyah — truth is free) */}
        <Animated.View
          entering={FadeInUp.delay(600).duration(600)}
          style={styles.actionsSection}
        >
          {/* CTA 1: Commencer gratuitement — PRIMARY */}
          <PressableScale
            onPress={handleStartFree}
            accessibilityRole="button"
            accessibilityLabel={t.auth.welcome.startFree}
            style={[
              styles.primaryButtonShadow,
              { shadowColor: brand.primary },
            ]}
          >
            <LinearGradient
              colors={hasOrphanedPremium
                ? [gold[500], gold[600]]
                : [brand.primary, "#10d65f"]
              }
              style={styles.primaryButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.primaryButtonText}>
                {hasOrphanedPremium
                  ? t.auth.welcome.finishAccount
                  : t.auth.welcome.startFree}
              </Text>
            </LinearGradient>
          </PressableScale>

          {/* CTA 2: Découvrir Naqiy+ — PREMIUM, gold accent */}
          <PressableScale
            onPress={handleDiscoverPlus}
            accessibilityRole="button"
            accessibilityLabel={t.auth.welcome.discoverPlus}
            style={[
              styles.premiumButton,
              {
                backgroundColor: isDark
                  ? "rgba(212, 175, 55, 0.08)"
                  : "rgba(212, 175, 55, 0.06)",
                borderColor: isDark
                  ? "rgba(212, 175, 55, 0.25)"
                  : "rgba(212, 175, 55, 0.2)",
              },
            ]}
          >
            <StarIcon size={18} color={gold[500]} weight="fill" />
            <Text
              style={[
                styles.premiumButtonText,
                { color: isDark ? gold[400] : gold[700] },
              ]}
            >
              {t.auth.welcome.discoverPlus}
            </Text>
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>
                {t.auth.welcome.premiumPrice}
              </Text>
            </View>
          </PressableScale>
        </Animated.View>

        {/* ── FOOTER ───────────────────────────────────────── */}
        <Animated.View
          entering={FadeIn.delay(800).duration(400)}
          style={styles.footer}
        >
          {/* Existing account link — discrete, not competing */}
          <PressableScale
            onPress={handleLogin}
            accessibilityRole="button"
            accessibilityLabel={t.auth.welcome.hasAccount}
            style={styles.loginLink}
          >
            <Text
              style={[
                styles.loginLinkText,
                { color: colors.textMuted },
              ]}
            >
              {t.auth.welcome.hasAccount}
            </Text>
            <CaretRightIcon
              size={14}
              color={colors.textMuted}
            />
          </PressableScale>

          {/* Legal */}
          <Text
            style={[
              styles.legalText,
              { color: colors.textMuted },
            ]}
          >
            {t.common.signUpWith}{"\n"}
            <Text
              style={styles.legalLink}
              onPress={() => Linking.openURL(APP_CONFIG.TERMS_URL)}
              accessibilityRole="link"
            >
              {t.auth.signup.termsLink}
            </Text>
            {" "}{t.common.and}{" "}
            <Text
              style={styles.legalLink}
              onPress={() => Linking.openURL(APP_CONFIG.PRIVACY_POLICY_URL)}
              accessibilityRole="link"
            >
              {t.auth.signup.privacyLink}
            </Text>
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },

  // ── Hero ──────────────────────────────
  heroSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoGlow: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  logoCard: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  logoImage: {
    width: 46,
    height: 46,
  },
  brandName: {
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.8,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  // ── Value Proposition ─────────────────
  valueSection: {
    marginBottom: 24,
  },
  valueTitle: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginBottom: 20,
  },
  valueGrid: {
    gap: 14,
  },
  valueItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  valueIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  valueText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
    fontWeight: "500",
  },

  // ── Actions ───────────────────────────
  actionsSection: {
    gap: 12,
    marginBottom: 20,
  },
  primaryButtonShadow: {
    borderRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryButton: {
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#102217",
    letterSpacing: 0.2,
  },
  premiumButton: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  premiumButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  premiumBadge: {
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 4,
  },
  premiumBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: gold[500],
  },

  // ── Footer ────────────────────────────
  footer: {
    alignItems: "center",
    gap: 16,
  },
  loginLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
  },
  loginLinkText: {
    fontSize: 14,
    fontWeight: "500",
  },
  legalText: {
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },
  legalLink: {
    textDecorationLine: "underline",
  },
});
