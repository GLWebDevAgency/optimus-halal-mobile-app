/**
 * Magic Link Login Screen
 * 
 * Passwordless authentication with email magic link
 * - Simple email input
 * - Elegant "check your email" state
 * - Deep link handling
 * - Enterprise-grade UX
 */

import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { NotificationFeedbackType } from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
} from "react-native-reanimated";

import { Input, IconButton, Button } from "@/components/ui";
import { PressableScale } from "@/components/ui/PressableScale";
import { useLocalAuthStore } from "@/store";
import { useTranslation, useHaptics, useTheme } from "@/hooks";
import {
  requestMagicLink,
  verifyMagicLinkToken,
  isValidEmail,
  isDisposableEmail,
  getPendingEmail,
} from "@/services/auth/magicLink.service";

type AuthState = "input" | "sent" | "verifying" | "success";

export default function MagicLinkLoginScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { impact, notification } = useHaptics();
  const { t } = useTranslation();
  const params = useLocalSearchParams();

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [authState, setAuthState] = useState<AuthState>("input");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [expiresIn, setExpiresIn] = useState(900); // 15 minutes
  const [isNewUser, setIsNewUser] = useState(false);

  const { setUser } = useLocalAuthStore();

  // Load pending email on mount (if returning to screen)
  useEffect(() => {
    const loadPendingEmail = async () => {
      const pending = await getPendingEmail();
      if (pending && authState === "input") {
        setEmail(pending);
        setAuthState("sent");
      }
    };
    loadPendingEmail();
  }, []);

  // Handle deep link with magic link token
  useEffect(() => {
    const handleDeepLink = async () => {
      const token = params.token as string;
      if (token && authState !== "verifying") {
        await handleVerifyToken(token);
      }
    };
    handleDeepLink();
  }, [params.token]);

  // Countdown timer for resend
  useEffect(() => {
    if (authState === "sent" && expiresIn > 0) {
      const timer = setTimeout(() => {
        setExpiresIn((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [authState, expiresIn]);

  const validateForm = useCallback((): boolean => {
    setError("");

    if (!email.trim()) {
      setError(t.auth.login.errors.emailRequired);
      return false;
    }

    if (!isValidEmail(email)) {
      setError(t.auth.login.errors.emailInvalid);
      return false;
    }

    if (isDisposableEmail(email)) {
      setError(t.auth.magicLink.disposableEmailError);
      return false;
    }

    if (isNewUser && !displayName.trim()) {
      setError(t.auth.magicLink.nameRequiredError);
      return false;
    }

    return true;
  }, [email, displayName, isNewUser]);

  const handleSendMagicLink = useCallback(async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setError("");
    impact();

    try {
      const response = await requestMagicLink(
        email,
        isNewUser ? displayName : undefined
      );

      if (response.success) {
        setAuthState("sent");
        setExpiresIn(response.expiresIn || 900);
        notification();
      } else {
        setError(response.message);
        notification(NotificationFeedbackType.Error);
      }
    } catch (err: any) {
      setError(err.message || t.errors.generic);
      notification(NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  }, [email, displayName, isNewUser, validateForm, t]);

  const handleVerifyToken = useCallback(
    async (token: string) => {
      setAuthState("verifying");
      setError("");

      try {
        const response = await verifyMagicLinkToken(token);

        if (response.success && response.user) {
          setAuthState("success");
          notification();

          // Set user in store
          setUser({
            id: response.user.id,
            email: response.user.email,
            fullName: response.user.displayName || email.split("@")[0],
            avatarUrl: response.user.avatarUrl,
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

          // Navigate to app after short delay
          setTimeout(() => {
            router.replace("/(tabs)");
          }, 1000);
        } else {
          setError(response.message || t.auth.magicLink.linkInvalidOrExpired);
          setAuthState("input");
          notification(NotificationFeedbackType.Error);
        }
      } catch (err: any) {
        setError(err.message || t.auth.magicLink.verificationFailed);
        setAuthState("input");
        notification(NotificationFeedbackType.Error);
      }
    },
    [email, setUser]
  );

  const handleResend = useCallback(async () => {
    setExpiresIn(900);
    await handleSendMagicLink();
  }, [handleSendMagicLink]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Render different states
  const renderInputState = () => (
    <>
      <Animated.View
        entering={FadeInDown.delay(200).duration(600)}
        className="mb-6"
      >
        <Text className="text-slate-900 dark:text-white tracking-tight text-[32px] font-bold leading-tight mb-2" accessibilityRole="header">
          {isNewUser ? t.auth.signup.title : t.auth.magicLink.quickLogin}
        </Text>
        <Text className="text-slate-500 dark:text-slate-400 text-base font-normal leading-normal">
          {isNewUser
            ? t.auth.magicLink.subtitleNew
            : t.auth.magicLink.subtitleExisting}
        </Text>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.delay(300).duration(600)}
        className="gap-5"
      >
        {isNewUser && (
          <Input
            label={t.auth.signup.fullName}
            placeholder={t.auth.signup.fullNamePlaceholder}
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
            leftIcon="person"
            accessibilityLabel={t.auth.signup.fullName}
            accessibilityHint={t.auth.signup.fullNamePlaceholder}
          />
        )}

        <Input
          label={t.auth.login.email}
          placeholder={t.auth.login.emailPlaceholder}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          error={error}
          leftIcon="mail"
          accessibilityLabel={t.auth.login.email}
          accessibilityHint={t.auth.magicLink.subtitleExisting}
        />

        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
          onPress={handleSendMagicLink}
          className="mt-4"
          accessibilityLabel={isNewUser ? t.auth.signup.submit : t.auth.magicLink.receiveLinkButton}
          accessibilityHint={t.auth.magicLink.receiveLinkButton}
        >
          {isNewUser ? t.auth.signup.submit : t.auth.magicLink.receiveLinkButton}
        </Button>

        <PressableScale
          onPress={() => setIsNewUser(!isNewUser)}
          accessibilityRole="button"
          accessibilityLabel={isNewUser ? t.auth.signup.loginLink : t.auth.signup.submit}
          accessibilityHint={isNewUser ? t.auth.signup.loginLink : t.auth.signup.submit}
        >
          <View className="items-center py-2">
            <Text className="text-sm text-slate-600 dark:text-slate-400">
              {isNewUser ? (
                <>
                  {t.auth.signup.hasAccount}{" "}
                  <Text className="font-bold text-primary-600">
                    {t.auth.signup.loginLink}
                  </Text>
                </>
              ) : (
                <>
                  {t.auth.login.noAccount}{" "}
                  <Text className="font-bold text-primary-600">{t.auth.signup.submit}</Text>
                </>
              )}
            </Text>
          </View>
        </PressableScale>
      </Animated.View>
    </>
  );

  const renderSentState = () => (
    <Animated.View
      entering={FadeIn.duration(400)}
      exiting={FadeOut.duration(200)}
      className="items-center"
    >
      {/* Email Icon */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(500)}
        className="w-24 h-24 rounded-full bg-primary-50 dark:bg-primary-900/30 items-center justify-center mb-6"
        accessible={false}
      >
        <MaterialIcons name="mail-outline" size={48} color={colors.primary} />
      </Animated.View>

      {/* Title */}
      <Animated.View
        entering={FadeInDown.delay(200).duration(500)}
        className="mb-4"
      >
        <Text className="text-slate-900 dark:text-white text-2xl font-bold text-center mb-2" accessibilityRole="header">
          {t.auth.magicLink.checkEmail}
        </Text>
        <Text className="text-slate-500 dark:text-slate-400 text-base text-center px-8">
          {t.auth.magicLink.linkSentTo}
        </Text>
        <Text className="text-primary-600 dark:text-primary-400 font-semibold text-center mt-1">
          {email}
        </Text>
      </Animated.View>

      {/* Instructions */}
      <Animated.View
        entering={FadeInUp.delay(300).duration(500)}
        className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 mb-6 w-full"
      >
        <View className="flex-row items-start mb-3">
          <View className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/50 items-center justify-center mr-3 mt-0.5">
            <Text className="text-primary-700 dark:text-primary-400 text-xs font-bold">
              1
            </Text>
          </View>
          <Text className="text-slate-700 dark:text-slate-300 flex-1">
            {t.auth.magicLink.instruction1}
          </Text>
        </View>
        <View className="flex-row items-start">
          <View className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/50 items-center justify-center mr-3 mt-0.5">
            <Text className="text-primary-700 dark:text-primary-400 text-xs font-bold">
              2
            </Text>
          </View>
          <Text className="text-slate-700 dark:text-slate-300 flex-1">
            {t.auth.magicLink.instruction2}
          </Text>
        </View>
      </Animated.View>

      {/* Expiration Timer */}
      <Text className="text-slate-500 dark:text-slate-400 text-sm mb-4">
        {t.auth.magicLink.linkExpiresIn.replace("{{time}}", formatTime(expiresIn))}
      </Text>

      {/* Resend Button */}
      <PressableScale
        onPress={handleResend}
        disabled={expiresIn > 840}
        accessibilityRole="button"
        accessibilityLabel={t.auth.magicLink.resendLink}
        accessibilityHint={t.auth.magicLink.resendLink}
      >
        <View
          className={`py-3 px-6 rounded-xl ${
            expiresIn > 840
              ? "bg-slate-100 dark:bg-slate-800"
              : "bg-primary-50 dark:bg-primary-900/30"
          }`}
        >
          <Text
            className={`font-semibold ${
              expiresIn > 840
                ? "text-slate-400 dark:text-slate-600"
                : "text-primary-600 dark:text-primary-400"
            }`}
          >
            {expiresIn > 840
              ? t.auth.magicLink.resendIn.replace("{{time}}", String(Math.floor((expiresIn - 840) / 60)))
              : t.auth.magicLink.resendLink}
          </Text>
        </View>
      </PressableScale>

      {/* Change Email */}
      <PressableScale
        onPress={() => setAuthState("input")}
        accessibilityRole="button"
        accessibilityLabel={t.auth.magicLink.changeEmail}
        accessibilityHint={t.auth.magicLink.changeEmail}
      >
        <View className="mt-6">
          <Text className="text-slate-600 dark:text-slate-400 text-sm">
            {t.auth.magicLink.wrongEmail}{" "}
            <Text className="font-semibold text-primary-600">{t.auth.magicLink.changeEmail}</Text>
          </Text>
        </View>
      </PressableScale>
    </Animated.View>
  );

  const renderVerifyingState = () => (
    <Animated.View
      entering={FadeIn.duration(400)}
      className="items-center py-12"
    >
      <ActivityIndicator size="large" color={colors.primary} />
      <Text className="text-slate-600 dark:text-slate-400 mt-4">
        {t.auth.magicLink.verifying}
      </Text>
    </Animated.View>
  );

  const renderSuccessState = () => (
    <Animated.View
      entering={FadeIn.duration(400)}
      className="items-center py-12"
    >
      <View className="w-24 h-24 rounded-full bg-primary-50 dark:bg-primary-900/30 items-center justify-center mb-4" accessible={false}>
        <MaterialIcons name="check-circle" size={48} color={colors.primary} />
      </View>
      <Text className="text-slate-900 dark:text-white text-2xl font-bold" accessibilityRole="header">
        {t.auth.magicLink.loginSuccess}
      </Text>
      <Text className="text-slate-500 dark:text-slate-400 mt-2">
        {t.auth.magicLink.redirecting}
      </Text>
    </Animated.View>
  );

  return (
    <View className="flex-1 bg-white dark:bg-background-dark">
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
          {authState === "input" && (
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
            </Animated.View>
          )}

          {/* Content based on state */}
          <View className="flex-1 justify-center">
            {authState === "input" && renderInputState()}
            {authState === "sent" && renderSentState()}
            {authState === "verifying" && renderVerifyingState()}
            {authState === "success" && renderSuccessState()}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
