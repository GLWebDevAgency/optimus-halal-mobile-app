/**
 * Login Screen
 * 
 * Écran de connexion avec email/password et biométrie
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { router, Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";

import { Button, Input, IslamicPattern } from "@/components/ui";
import { useLogin } from "@/hooks/useAuth";
import { useTranslation, useHaptics, useTheme } from "@/hooks";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const { impact } = useHaptics();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const loginMutation = useLogin();
  const isLoading = loginMutation.isPending;

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, password]);

  const handleLogin = useCallback(async () => {
    if (!validateForm()) return;

    impact();

    try {
      // mutateAsync sets tokens + awaits useMe() cache invalidation (see useLogin hook)
      await loginMutation.mutateAsync({ email, password });
      router.replace("/(tabs)");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t.errors.generic;
      Alert.alert(t.common.error, message);
    }
  }, [email, password, validateForm, loginMutation, impact]);

  const handleBiometricLogin = useCallback(async () => {
    impact();

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      Alert.alert(t.common.error, t.auth.biometric.notAvailable);
      return;
    }

    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) {
      Alert.alert(t.common.error, t.auth.biometric.notConfigured);
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: t.auth.biometric.prompt,
      fallbackLabel: t.auth.biometric.fallback,
    });

    if (result.success) {
      // TODO: Implement proper biometric login with secure storage of tokens
      Alert.alert("Info", t.auth.magicLink.biometricComingSoon);
      
      /* 
      // Previous Mock Implementation - Disabled because setUser doesn't exist on API store
      setUser({ ... });
      router.replace("/(tabs)");
      */
    }
  }, []);

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
      {/* Islamic Pattern Background */}
      <IslamicPattern variant="tessellation" opacity={0.04} />

      {/* Background Decorative Elements */}
      <View className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-500/10 rounded-full blur-[100px]" accessible={false} />
      <View className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-gold-500/5 rounded-full blur-[100px]" accessible={false} />

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
            <View className="relative w-24 h-24 rounded-2xl shadow-2xl overflow-hidden mb-6 bg-primary-500/10" accessible={false}>
              <View className="w-full h-full items-center justify-center">
                <MaterialIcons name="verified-user" size={48} color={colors.primary} />
              </View>
            </View>

            <Text className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2" accessibilityRole="header">
              {t.auth.login.title}
            </Text>
            <Text className="text-slate-500 dark:text-slate-400 text-base font-normal leading-relaxed text-center max-w-[280px]">
              {t.auth.login.subtitle}
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View
            entering={FadeInUp.delay(200).duration(600)}
            className="gap-5"
          >
            <Input
              label={t.auth.login.email}
              placeholder={t.auth.login.emailPlaceholder}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
              leftIcon="mail"
              accessibilityLabel={t.auth.login.email}
              accessibilityHint={t.auth.login.emailPlaceholder}
            />

            <Input
              label={t.auth.login.password}
              placeholder={t.auth.login.passwordPlaceholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={errors.password}
              accessibilityLabel={t.auth.login.password}
              accessibilityHint={t.auth.login.passwordPlaceholder}
            />

            {/* Forgot Password */}
            <View className="items-end -mt-2">
              <Link href="/(auth)/forgot-password" asChild>
                <TouchableOpacity
                  accessibilityRole="link"
                  accessibilityLabel={t.auth.login.forgotPassword}
                  accessibilityHint={t.auth.login.forgotPassword}
                >
                  <Text className="text-sm font-medium text-gold-500">
                    {t.auth.login.forgotPassword}
                  </Text>
                </TouchableOpacity>
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
                accessibilityRole="button"
                accessibilityLabel={t.auth.login.submit}
                accessibilityHint={t.auth.login.submit}
                accessibilityState={{ disabled: isLoading }}
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

              <TouchableOpacity
                onPress={handleBiometricLogin}
                className="flex-row items-center justify-center gap-2 h-14 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent"
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t.auth.login.biometric}
                accessibilityHint={t.auth.login.biometric}
              >
                <MaterialIcons
                  name="face"
                  size={24}
                  color={colors.primary}
                />
                <Text className="text-base font-medium text-slate-700 dark:text-slate-300">
                  {t.auth.login.biometric}
                </Text>
              </TouchableOpacity>
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
