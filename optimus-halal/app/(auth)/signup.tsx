/**
 * Sign Up Screen
 *
 * Écran d'inscription avec:
 * - Nom complet
 * - Email (identifiant principal)
 * - Localisation (ville française avec géolocalisation)
 * - Mot de passe
 * - Option "Explorer sans compte" pour le mode guest
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Linking,
} from "react-native";
import { router, Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppleLogoIcon, ArrowRightIcon, GlobeHemisphereWestIcon, GoogleLogoIcon } from "phosphor-react-native";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";

import { Image } from "expo-image";
import { Button, Input, IconButton, LocationPicker, PremiumBackground } from "@/components/ui";
import { PressableScale } from "@/components/ui/PressableScale";
import { useLocalAuthStore } from "@/store";
import { authService } from "@/services/api/auth.service";
import { clearTokens } from "@/services/api";
import { useQueryClient } from "@tanstack/react-query";
import { City } from "@/constants/locations";
import { useTranslation, useHaptics, useTheme } from "@/hooks";
import { APP_CONFIG, defaultFeatureFlags } from "@/constants/config";

const logoSource = require("@assets/images/logo_naqiy.webp");

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const { impact, notification } = useHaptics();
  const { t } = useTranslation();

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { setUser } = useLocalAuthStore();
  const queryClient = useQueryClient();

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
      // Real API call to Railway backend
      const response = await authService.register({
        email: email.trim().toLowerCase(),
        password,
        displayName: fullName,
        phoneNumber: "",
        preferredLanguage: "fr",
      });

      if (response.success && response.user) {
        // Set authenticated user
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
            language: "fr",
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        notification();
        router.replace("/(tabs)");
      } else {
        Alert.alert(t.common.error, response.message || t.auth.magicLink.signupFailed);
      }
    } catch (error: any) {
      console.error("[Signup] Error:", error);
      Alert.alert(
        t.common.error,
        error.message || t.auth.magicLink.signupError
      );
    } finally {
      setIsLoading(false);
    }
  }, [fullName, email, password, selectedCity, validateForm, setUser, impact, notification, t]);

  const handleSocialAuth = useCallback(async (provider: "google" | "apple") => {
    impact();
    Alert.alert(t.common.comingSoon, t.auth.magicLink.socialComingSoon.replace("{{provider}}", provider === "google" ? "Google" : "Apple"));
  }, []);

  return (
    <View className="flex-1">
      <PremiumBackground />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 24,
            paddingHorizontal: 24,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View
            entering={FadeIn.delay(100).duration(400)}
            className="flex-row items-center justify-between mb-4"
          >
            <IconButton
              icon="arrow-back"
              variant="default"
              onPress={() => router.back()}
              color={isDark ? "#ffffff" : "#1e293b"}
              accessibilityLabel={t.common.back}
            />
            <Text className="text-sm font-medium text-slate-400 dark:text-slate-500">
              {t.common.stepOf.replace("{{current}}", "1").replace("{{total}}", "3")}
            </Text>
          </Animated.View>

          {/* Brand Logo */}
          <Animated.View
            entering={FadeInDown.delay(150).duration(500)}
            className="items-center mb-6"
          >
            <View
              className="w-16 h-16 rounded-2xl items-center justify-center"
              style={{ backgroundColor: colors.card }}
              accessible={false}
            >
              <Image
                source={logoSource}
                style={{ width: 42, height: 42 }}
                contentFit="contain"
                cachePolicy="memory-disk"
              />
            </View>
          </Animated.View>

          {/* Title */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(600)}
            className="mb-6"
          >
            <Text className="text-slate-900 dark:text-white tracking-tight text-[32px] font-bold leading-tight mb-2" accessibilityRole="header">
              {t.auth.signup.title}
            </Text>
            <Text className="text-slate-500 dark:text-slate-400 text-base font-normal leading-normal">
              {t.auth.signup.subtitle}
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View
            entering={FadeInUp.delay(300).duration(600)}
            className="gap-5"
          >
            {/* Full Name */}
            <Input
              label={t.auth.signup.fullName}
              placeholder={t.auth.signup.fullNamePlaceholder}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              error={errors.fullName}
              accessibilityLabel={t.auth.signup.fullName}
              accessibilityHint={t.auth.signup.fullNamePlaceholder}
            />

            {/* Email - Required */}
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
              accessibilityHint={t.auth.signup.emailPlaceholder}
            />

            {/* Location - City Picker */}
            <LocationPicker
              label={t.editProfile.yourCity}
              value={selectedCity?.name}
              onSelect={handleCitySelect}
              placeholder={t.location.selectCity}
              hint={t.editProfile.cityHint}
              showGeolocation={true}
            />

            {/* Password */}
            <Input
              label={t.auth.signup.password}
              placeholder={t.auth.signup.passwordPlaceholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={errors.password}
              hint={t.auth.signup.passwordHint}
              accessibilityLabel={t.auth.signup.password}
              accessibilityHint={t.auth.signup.passwordHint}
            />

            {/* Submit Button */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
              onPress={handleSignUp}
              className="mt-4"
              accessibilityLabel={t.auth.signup.submit}
              accessibilityHint={t.auth.signup.submit}
            >
              {t.auth.signup.submit}
            </Button>

            {/* Terms */}
            <Text className="text-center text-xs text-slate-500 dark:text-slate-400 leading-relaxed px-4">
              {t.common.signUpWith}{" "}
              <Text
                className="text-slate-900 dark:text-white underline"
                onPress={() => Linking.openURL(APP_CONFIG.TERMS_URL)}
                accessibilityRole="link"
              >
                {t.auth.signup.termsLink}
              </Text>{" "}
              {t.auth.signup.and}{" "}
              <Text
                className="text-slate-900 dark:text-white underline"
                onPress={() => Linking.openURL(APP_CONFIG.PRIVACY_POLICY_URL)}
                accessibilityRole="link"
              >
                {t.auth.signup.privacyLink}
              </Text>
              .
            </Text>
          </Animated.View>

          {/* Social Auth — gated behind socialAuthEnabled feature flag */}
          {defaultFeatureFlags.socialAuthEnabled && (
            <>
              {/* Divider */}
              <Animated.View
                entering={FadeIn.delay(400).duration(400)}
                className="relative py-6"
              >
                <View className="absolute inset-x-0 top-1/2 h-px bg-slate-200 dark:bg-slate-800" />
                <View className="items-center">
                  <Text className="bg-white dark:bg-background-dark px-4 text-sm font-medium text-slate-500">
                    {t.common.continueWith}
                  </Text>
                </View>
              </Animated.View>

              <Animated.View
                entering={FadeInUp.delay(500).duration(600)}
                className="flex-row gap-4"
              >
                <PressableScale
                  onPress={() => handleSocialAuth("google")}
                  accessibilityRole="button"
                  accessibilityLabel={`${t.auth.signup.submit} Google`}
                  accessibilityHint={`${t.auth.signup.submit} Google`}
                  style={{ flex: 1 }}
                >
                  <View className="flex-row items-center justify-center gap-2 h-14 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark">
                    <GoogleLogoIcon size={24} color="#4285F4" />
                    <Text className="text-sm font-semibold text-slate-700 dark:text-white">
                      Google
                    </Text>
                  </View>
                </PressableScale>

                <PressableScale
                  onPress={() => handleSocialAuth("apple")}
                  accessibilityRole="button"
                  accessibilityLabel={`${t.auth.signup.submit} Apple`}
                  accessibilityHint={`${t.auth.signup.submit} Apple`}
                  style={{ flex: 1 }}
                >
                  <View className="flex-row items-center justify-center gap-2 h-14 rounded-xl bg-slate-900 dark:bg-white">
                    <AppleLogoIcon size={24}
                      color={isDark ? "#0f172a" : "#ffffff"} />
                    <Text className="text-sm font-semibold text-white dark:text-slate-900">
                      Apple
                    </Text>
                  </View>
                </PressableScale>
              </Animated.View>
            </>
          )}

          {/* Explore Mode */}
          <Animated.View
            entering={FadeIn.delay(600).duration(400)}
            className="items-center mt-6"
          >
            <PressableScale
              onPress={async () => {
                await clearTokens();
                queryClient.clear();
                router.replace("/(tabs)");
              }}
              accessibilityRole="button"
              accessibilityLabel={t.auth.signup.exploreMode}
            >
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                paddingVertical: 14,
                paddingHorizontal: 28,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: isDark ? "rgba(148,163,184,0.25)" : "rgba(100,116,139,0.2)",
                borderStyle: "dashed",
                backgroundColor: isDark ? "rgba(148,163,184,0.06)" : "rgba(100,116,139,0.04)",
              }}>
                <GlobeHemisphereWestIcon size={20} color={isDark ? "#94a3b8" : "#64748b"} />
                <Text style={{ fontSize: 15, fontWeight: "600", color: isDark ? "#94a3b8" : "#64748b" }}>
                  {t.auth.signup.exploreMode}
                </Text>
                <ArrowRightIcon size={16} color={isDark ? "#94a3b8" : "#64748b"} />
              </View>
            </PressableScale>
            <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: "center", marginTop: 8 }}>
              {t.auth.signup.exploreModeHint}
            </Text>
          </Animated.View>

          {/* Login Link */}
          <Animated.View
            entering={FadeIn.delay(700).duration(400)}
            className="items-center mt-4"
          >
            <Text className="text-sm text-slate-500 dark:text-slate-400">
              {t.auth.signup.hasAccount}{" "}
              <Link href="/(auth)/login" asChild>
                <Text
                  className="font-bold text-gold-600"
                  accessibilityRole="link"
                  accessibilityLabel={t.auth.signup.loginLink}
                  accessibilityHint={t.auth.signup.loginLink}
                >
                  {t.auth.signup.loginLink}
                </Text>
              </Link>
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
