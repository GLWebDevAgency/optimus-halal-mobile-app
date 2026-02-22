/**
 * Login Screen
 *
 * Écran de connexion avec email/password et biométrie.
 * Enterprise-grade error handling:
 * - Inline animated error banner (no Alert.alert)
 * - Structured tRPC error code parsing → i18n messages
 * - Haptic error feedback (NotificationFeedbackType.Error)
 * - Auto-clear error on input change
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from "react-native";
import { PressableScale } from "@/components/ui/PressableScale";
import { router, Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import * as Haptics from "expo-haptics";
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

import { Image } from "expo-image";
import { Button, Input, PremiumBackground } from "@/components/ui";
import { useLogin } from "@/hooks/useAuth";
import { useTranslation, useHaptics, useTheme } from "@/hooks";
import type { TranslationKeys } from "@/i18n";

const logoSource = require("@assets/images/logo_naqiy.webp");

// ── Error Classification ────────────────────────────────────

type AuthErrorType =
  | "invalidCredentials"
  | "accountDisabled"
  | "networkError"
  | "rateLimited"
  | "serverError";

/**
 * Parse a tRPC mutation error into a structured auth error type.
 * tRPC v11 client errors expose `.data.code` (tRPC code) and
 * `.data.httpStatus` for classification.
 */
function classifyAuthError(error: unknown): AuthErrorType {
  if (!error || typeof error !== "object") return "serverError";

  const trpcData = (error as any).data;
  const httpStatus: number | undefined = trpcData?.httpStatus;
  const trpcCode: string | undefined = trpcData?.code;

  // Network / fetch failure — no response from server
  if (error instanceof TypeError && (error as Error).message?.includes("Network")) {
    return "networkError";
  }
  if ((error as any)?.code === "NETWORK_ERROR" || (error as any)?.name === "OptimusApiError") {
    return "networkError";
  }

  // Rate limited (429)
  if (httpStatus === 429 || trpcCode === "TOO_MANY_REQUESTS") {
    return "rateLimited";
  }

  // Unauthorized (401) — invalid credentials or disabled account
  if (httpStatus === 401 || trpcCode === "UNAUTHORIZED") {
    const message = (error as any)?.message ?? "";
    if (typeof message === "string" && message.toLowerCase().includes("désactivé")) {
      return "accountDisabled";
    }
    return "invalidCredentials";
  }

  // Server error (500+)
  if (httpStatus && httpStatus >= 500) {
    return "serverError";
  }

  return "serverError";
}

/** Map auth error type → i18n key from `t.auth.login.errors`. */
function getAuthErrorMessage(
  errorType: AuthErrorType,
  t: TranslationKeys
): string {
  return t.auth.login.errors[errorType] ?? t.errors.generic;
}

// ── Component ───────────────────────────────────────────────

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const { impact, notification } = useHaptics();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const loginMutation = useLogin();
  const isLoading = loginMutation.isPending;

  // Shake animation for the error banner
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

  // Clear server error when user modifies inputs
  const handleEmailChange = useCallback((text: string) => {
    setEmail(text);
    if (serverError) setServerError(null);
  }, [serverError]);

  const handlePasswordChange = useCallback((text: string) => {
    setPassword(text);
    if (serverError) setServerError(null);
  }, [serverError]);

  const validateForm = useCallback(() => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = t.auth.login.errors.emailRequired;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t.auth.login.errors.emailInvalid;
    }

    if (!password) {
      newErrors.password = t.auth.login.errors.passwordRequired;
    } else if (password.length < 8) {
      newErrors.password = t.auth.login.errors.passwordTooShort;
    }

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, password, t]);

  const handleLogin = useCallback(async () => {
    setServerError(null);
    if (!validateForm()) return;

    impact();

    try {
      await loginMutation.mutateAsync({ email: email.trim().toLowerCase(), password });
      router.replace("/(tabs)");
    } catch (error: unknown) {
      const errorType = classifyAuthError(error);
      const message = getAuthErrorMessage(errorType, t);

      setServerError(message);
      triggerShake();
      notification(Haptics.NotificationFeedbackType.Error);
    }
  }, [email, password, validateForm, loginMutation, impact, notification, triggerShake, t]);

  const handleBiometricLogin = useCallback(async () => {
    impact();

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      setServerError(t.auth.biometric.notAvailable);
      return;
    }

    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) {
      setServerError(t.auth.biometric.notConfigured);
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: t.auth.biometric.prompt,
      fallbackLabel: t.auth.biometric.fallback,
    });

    if (result.success) {
      setServerError(t.auth.magicLink.biometricComingSoon);
    }
  }, [impact, t]);

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
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 24,
            paddingHorizontal: 24,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo & Header */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(600)}
            className="items-center mb-10 mt-8"
          >
            {/* Logo */}
            <View
              className="w-20 h-20 rounded-2xl items-center justify-center mb-6"
              style={{ backgroundColor: colors.card }}
              accessible={false}
            >
              <Image
                source={logoSource}
                style={{ width: 52, height: 52 }}
                contentFit="contain"
                cachePolicy="memory-disk"
              />
            </View>

            <Text className="text-3xl font-bold tracking-tight mb-2" style={{ color: colors.textPrimary }} accessibilityRole="header">
              {t.auth.login.title}
            </Text>
            <Text className="text-base font-normal leading-relaxed text-center max-w-[280px]" style={{ color: colors.textSecondary }}>
              {t.auth.login.subtitle}
            </Text>
          </Animated.View>

          {/* Server Error Banner */}
          {serverError && (
            <Animated.View
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
              style={shakeStyle}
              className="mb-4"
              accessibilityRole="alert"
              accessibilityLiveRegion="assertive"
            >
              <View className="flex-row items-center gap-3 p-4 rounded-xl bg-red-500/10 dark:bg-red-500/15 border border-red-500/20">
                <MaterialIcons name="error-outline" size={20} color="#ef4444" />
                <Text className="flex-1 text-sm font-medium text-red-600 dark:text-red-400">
                  {serverError}
                </Text>
                <Pressable
                  onPress={() => setServerError(null)}
                  hitSlop={8}
                  accessibilityLabel={t.common.close}
                  accessibilityRole="button"
                >
                  <MaterialIcons name="close" size={18} color={isDark ? "#f87171" : "#dc2626"} />
                </Pressable>
              </View>
            </Animated.View>
          )}

          {/* Form */}
          <Animated.View
            entering={FadeInUp.delay(200).duration(600)}
            className="gap-5"
          >
            <Input
              label={t.auth.login.email}
              placeholder={t.auth.login.emailPlaceholder}
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={fieldErrors.email}
              leftIcon="mail"
              accessibilityLabel={t.auth.login.email}
              accessibilityHint={t.auth.login.emailPlaceholder}
            />

            <Input
              label={t.auth.login.password}
              placeholder={t.auth.login.passwordPlaceholder}
              value={password}
              onChangeText={handlePasswordChange}
              secureTextEntry
              error={fieldErrors.password}
              accessibilityLabel={t.auth.login.password}
              accessibilityHint={t.auth.login.passwordPlaceholder}
            />

            {/* Forgot Password */}
            <View className="items-end -mt-2">
              <Link href="/(auth)/forgot-password" asChild>
                <PressableScale
                  accessibilityRole="link"
                  accessibilityLabel={t.auth.login.forgotPassword}
                  accessibilityHint={t.auth.login.forgotPassword}
                >
                  <Text className="text-sm font-medium text-gold-500">
                    {t.auth.login.forgotPassword}
                  </Text>
                </PressableScale>
              </Link>
            </View>

            {/* Buttons */}
            <View className="gap-4 mt-6">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={isLoading}
                onPress={handleLogin}
                accessibilityLabel={t.auth.login.submit}
                accessibilityHint={t.auth.login.submit}
                icon={
                  <MaterialIcons
                    name="arrow-forward"
                    size={20}
                    color="#0d1b13"
                  />
                }
              >
                {t.auth.login.submit}
              </Button>

              <PressableScale
                onPress={handleBiometricLogin}
                accessibilityRole="button"
                accessibilityLabel={t.auth.login.biometric}
                accessibilityHint={t.auth.login.biometric}
              >
                <View className="flex-row items-center justify-center gap-2 h-14 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent">
                  <MaterialIcons
                    name="face"
                    size={24}
                    color={colors.primary}
                  />
                  <Text className="text-base font-medium text-slate-700 dark:text-slate-300">
                    {t.auth.login.biometric}
                  </Text>
                </View>
              </PressableScale>
            </View>
          </Animated.View>

          {/* Sign Up Link */}
          <Animated.View
            entering={FadeIn.delay(400).duration(600)}
            className="items-center mt-10"
          >
            <Text className="text-sm text-slate-500 dark:text-slate-400">
              {t.auth.login.noAccount}{" "}
              <Link href="/(auth)/signup" asChild>
                <Text
                  className="font-bold text-primary-500"
                  accessibilityRole="link"
                  accessibilityLabel={t.auth.login.createAccount}
                  accessibilityHint={t.auth.login.createAccount}
                >
                  {t.auth.login.createAccount}
                </Text>
              </Link>
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
