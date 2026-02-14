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
  useColorScheme,
} from "react-native";
import { router, Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { MaterialIcons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";

import { Button, Input } from "@/components/ui";
import { useAuthStore } from "@/store/apiStores";
import { useTranslation } from "@/hooks";
export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Use the API-connected Auth Store instead of the local one
  const { login, isLoading: isAuthLoading, error: authError } = useAuthStore();
  
  // Local loading state for UI feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLoading = isSubmitting || isAuthLoading;

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

    setIsSubmitting(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      // Use the store action which handles API call, tokens, profile fetch, and state update
      const success = await login(email, password);

      if (success) {
        router.replace("/(tabs)");
      } else {
        // Error is handled by store but we can show alert if needed, 
        // though the UI might display authError
        Alert.alert(t.common.error, authError || t.auth.login.errors.invalidCredentials);
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de la connexion.";
      Alert.alert(t.common.error, message);
    } finally {
      setIsSubmitting(false);
    }
  }, [email, password, validateForm, login, authError]);

  const handleBiometricLogin = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

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
      Alert.alert("Info", "L'authentification biométrique sera bientôt disponible avec le nouveau système de sécurité.");
      
      /* 
      // Previous Mock Implementation - Disabled because setUser doesn't exist on API store
      setUser({ ... });
      router.replace("/(tabs)");
      */
    }
  }, []);

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
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
                <MaterialIcons name="verified-user" size={48} color="#1de560" />
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
              accessibilityLabel="Adresse email"
              accessibilityHint="Entrez votre adresse email"
            />

            <Input
              label={t.auth.login.password}
              placeholder={t.auth.login.passwordPlaceholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={errors.password}
              accessibilityLabel="Mot de passe"
              accessibilityHint="Entrez votre mot de passe"
            />

            {/* Forgot Password */}
            <View className="items-end -mt-2">
              <Link href="/(auth)/forgot-password" asChild>
                <TouchableOpacity
                  accessibilityRole="link"
                  accessibilityLabel="Mot de passe oublié"
                  accessibilityHint="Double-tapez pour réinitialiser votre mot de passe"
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
                accessibilityLabel="Se connecter"
                accessibilityHint="Double-tapez pour vous connecter"
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
                accessibilityLabel="Connexion avec Face ID"
                accessibilityHint="Double-tapez pour vous connecter avec la biométrie"
              >
                <MaterialIcons
                  name="face"
                  size={24}
                  color="#1de560"
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
                  accessibilityLabel="Créer un compte"
                  accessibilityHint="Double-tapez pour créer un nouveau compte"
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
