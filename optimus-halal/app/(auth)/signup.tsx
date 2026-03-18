/**
 * Sign Up Screen — Naqiy+ Account Creation
 *
 * Post-payment registration: user just subscribed to Naqiy+ via RevenueCat.
 * This screen creates their account (email + password + optional info).
 *
 * Psychology: Celebration → Simplicity → Activation
 *  - Gold badge + congratulatory tone ("Bienvenue dans Naqiy+")
 *  - Minimal fields: name, email, password (city optional)
 *  - Immediate redirect to app after creation
 *
 * Principles:
 *  - Al-Ihsan: Premium feel befitting a paying subscriber
 *  - Al-Amanah: Secure account creation, no data waste
 *  - Al-Taqwa: No pressure, respectful onboarding
 *
 * Supports: French, English, Arabic (RTL)
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Linking,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StarIcon, WarningCircleIcon } from "phosphor-react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { NotificationFeedbackType } from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";

import { Image } from "expo-image";
import { Button, Input, LocationPicker, PremiumBackground } from "@/components/ui";
import { PressableScale } from "@/components/ui/PressableScale";
import { useLocalAuthStore } from "@/store";
import { authService } from "@/services/api/auth.service";
import type { City } from "@/constants/locations";
import { useTranslation, useHaptics, useTheme } from "@/hooks";
import { APP_CONFIG } from "@/constants/config";
import { brand, gold } from "@/theme/colors";
import { identifyUser as identifyPurchasesUser } from "@/services/purchases";
import { trpc } from "@/lib/trpc";
import { logger } from "@/lib/logger";

const logoSource = require("@assets/images/logo_naqiy.webp");

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const { impact, notification } = useHaptics();
  const { t, language, isRTL } = useTranslation();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [referralCode, setReferralCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const { setUser } = useLocalAuthStore();
  const applyReferralCode = trpc.referral.applyCode.useMutation();

  // Shake animation for error banner
  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));
  const triggerShake = useCallback(() => {
    shakeX.value = withSequence(
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(-6, { duration: 50 }),
      withTiming(6, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  }, [shakeX]);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = t.auth.signup.errors.fullNameRequired;
    }
    if (!email.trim()) {
      newErrors.email = t.auth.signup.errors.emailRequired;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t.auth.signup.errors.emailInvalid;
    }
    if (!password) {
      newErrors.password = t.auth.signup.errors.passwordRequired;
    } else if (password.length < 8) {
      newErrors.password = t.auth.signup.errors.passwordTooShort;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [fullName, email, password, t]);

  const handleCitySelect = useCallback((city: City) => {
    setSelectedCity(city);
  }, []);

  const handleSignUp = useCallback(async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    impact();

    try {
      const response = await authService.register({
        email: email.trim().toLowerCase(),
        password,
        displayName: fullName,
        phoneNumber: "",
        preferredLanguage: (["fr", "en", "ar"].includes(language) ? language : "fr") as "fr" | "en" | "ar",
      });

      if (response.success && response.user) {
        setUser({
          id: response.user.id,
          email: response.user.email || email,
          fullName: response.user.displayName || fullName,
          location: selectedCity
            ? { city: selectedCity.name, country: "France" }
            : undefined,
          preferences: {
            preferredCertifications: [],
            dietaryExclusions: [],
            pushNotificationsEnabled: true,
            darkModeEnabled: "system",
            language,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Link RevenueCat anonymous purchase to this new account.
        // Critical: without this, the $RCAnonymousID purchase stays orphaned
        // and webhooks can't match the user. Fire-and-forget — don't block navigation.
        identifyPurchasesUser(response.user.id).catch((e) =>
          logger.warn("Signup", "RevenueCat identify failed (will retry on next launch)", String(e))
        );

        // Apply referral code if provided — fire-and-forget, don't block navigation
        const trimmedCode = referralCode.trim();
        if (trimmedCode.length >= 4) {
          applyReferralCode.mutate(
            { code: trimmedCode },
            {
              onError: (e) =>
                logger.warn("Signup", "Referral code failed (non-blocking)", String(e)),
            },
          );
        }

        notification(NotificationFeedbackType.Success);
        router.replace("/(tabs)");
      } else {
        setServerError(response.message || t.auth.magicLink.signupFailed);
        triggerShake();
        notification(NotificationFeedbackType.Error);
      }
    } catch (error: any) {
      console.error("[Signup] Error:", error);
      setServerError(error.message || t.auth.magicLink.signupError);
      triggerShake();
      notification(NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  }, [fullName, email, password, selectedCity, referralCode, validateForm, setUser, applyReferralCode, impact, notification, t, language, triggerShake]);

  return (
    <View style={styles.container}>
      <PremiumBackground />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + 16,
              paddingBottom: insets.bottom + 24,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header — Back button */}
          <Animated.View
            entering={FadeIn.delay(100).duration(400)}
            style={styles.header}
          >
            <PressableScale
              onPress={() => router.back()}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel={t.common.back}
            >
              <Text style={{ fontSize: 24, color: colors.textPrimary }}>←</Text>
            </PressableScale>
          </Animated.View>

          {/* Naqiy+ Welcome Badge */}
          <Animated.View
            entering={FadeInDown.delay(150).duration(600)}
            style={styles.badgeSection}
          >
            {/* Logo */}
            <View
              style={[
                styles.logoCard,
                {
                  backgroundColor: isDark ? "#1A1A1A" : "#ffffff",
                  borderColor: isDark
                    ? "rgba(207, 165, 51, 0.25)"
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

            {/* Naqiy+ pill */}
            <View style={styles.plusPill}>
              <LinearGradient
                colors={[gold[500], gold[600]]}
                style={styles.plusPillGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <StarIcon size={12} color="#102217" weight="fill" />
                <Text style={styles.plusPillText}>Naqiy+</Text>
              </LinearGradient>
            </View>
          </Animated.View>

          {/* Title — Celebration tone */}
          <Animated.View
            entering={FadeInDown.delay(250).duration(600)}
            style={styles.titleSection}
          >
            <Text
              style={[
                styles.title,
                {
                  color: colors.textPrimary,
                  textAlign: isRTL ? "right" : "left",
                },
              ]}
              accessibilityRole="header"
            >
              {t.auth.signup.title}
            </Text>
            <Text
              style={[
                styles.subtitle,
                {
                  color: colors.textSecondary,
                  textAlign: isRTL ? "right" : "left",
                },
              ]}
            >
              {t.auth.signup.subtitle}
            </Text>
          </Animated.View>

          {/* Server Error Banner */}
          {serverError && (
            <Animated.View
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
              style={shakeStyle}
              accessibilityRole="alert"
              accessibilityLiveRegion="assertive"
            >
              <View
                style={[
                  styles.errorBanner,
                  {
                    backgroundColor: isDark
                      ? "rgba(239,68,68,0.15)"
                      : "rgba(239,68,68,0.1)",
                    borderColor: "rgba(239,68,68,0.2)",
                  },
                ]}
              >
                <WarningCircleIcon size={20} color="#ef4444" />
                <Text
                  style={[
                    styles.errorText,
                    { color: isDark ? "#fca5a5" : "#dc2626" },
                  ]}
                >
                  {serverError}
                </Text>
                <PressableScale onPress={() => setServerError(null)}>
                  <Text
                    style={{ color: isDark ? "#fca5a5" : "#dc2626", fontSize: 18 }}
                  >
                    ✕
                  </Text>
                </PressableScale>
              </View>
            </Animated.View>
          )}

          {/* Form */}
          <Animated.View
            entering={FadeInUp.delay(350).duration(600)}
            style={styles.form}
          >
            <Input
              label={t.auth.signup.fullName}
              placeholder={t.auth.signup.fullNamePlaceholder}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              error={errors.fullName}
              accessibilityLabel={t.auth.signup.fullName}
            />

            <Input
              label={t.auth.signup.email}
              placeholder={t.auth.signup.emailPlaceholder}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
              leftIcon="mail"
              accessibilityLabel={t.auth.signup.email}
            />

            <LocationPicker
              label={t.editProfile.yourCity}
              value={selectedCity?.name}
              onSelect={handleCitySelect}
              placeholder={t.location.selectCity}
              hint={t.editProfile.cityHint}
              showGeolocation={true}
            />

            <Input
              label={t.auth.signup.password}
              placeholder={t.auth.signup.passwordPlaceholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={errors.password}
              hint={t.auth.signup.passwordHint}
              accessibilityLabel={t.auth.signup.password}
            />

            <Input
              label={t.referral.referralCodeLabel}
              placeholder={t.referral.referralCodePlaceholder}
              value={referralCode}
              onChangeText={setReferralCode}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={8}
              accessibilityLabel={t.referral.referralCodeLabel}
            />

            {/* Submit */}
            <View style={styles.submitContainer}>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={isLoading}
                onPress={handleSignUp}
                accessibilityLabel={t.auth.signup.submit}
                style={{
                  shadowColor: brand.primary,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 16,
                  elevation: 8,
                }}
              >
                {t.auth.signup.submit}
              </Button>
            </View>

            {/* Terms */}
            <Text style={[styles.termsText, { color: colors.textMuted }]}>
              {t.common.signUpWith}{" "}
              <Text
                style={styles.termsLink}
                onPress={() => Linking.openURL(APP_CONFIG.TERMS_URL)}
                accessibilityRole="link"
              >
                {t.auth.signup.termsLink}
              </Text>{" "}
              {t.auth.signup.and}{" "}
              <Text
                style={styles.termsLink}
                onPress={() => Linking.openURL(APP_CONFIG.PRIVACY_POLICY_URL)}
                accessibilityRole="link"
              >
                {t.auth.signup.privacyLink}
              </Text>
            </Text>
          </Animated.View>

          {/* Login Link — for users who already have an account */}
          <Animated.View
            entering={FadeIn.delay(500).duration(400)}
            style={styles.loginSection}
          >
            <Text style={[styles.loginText, { color: colors.textSecondary }]}>
              {t.auth.signup.hasAccount}{" "}
              <Text
                style={[styles.loginLink, { color: gold[500] }]}
                accessibilityRole="link"
                onPress={() => {
                  impact();
                  router.push("/(auth)/login");
                }}
              >
                {t.auth.signup.loginLink}
              </Text>
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  // Badge
  badgeSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoCard: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 12,
  },
  logoImage: { width: 40, height: 40 },
  plusPill: {
    borderRadius: 12,
    overflow: "hidden",
  },
  plusPillGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  plusPillText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#102217",
    letterSpacing: 0.3,
  },

  // Title
  titleSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },

  // Error
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },

  // Form
  form: {
    gap: 20,
  },
  submitContainer: {
    marginTop: 8,
  },
  termsText: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  termsLink: {
    textDecorationLine: "underline",
  },

  // Login
  loginSection: {
    alignItems: "center",
    marginTop: 24,
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontWeight: "700",
  },
});
