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
export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

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
      newErrors.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email invalide";
    }

    if (!password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (password.length < 8) {
      newErrors.password = "Minimum 8 caractères";
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
        Alert.alert("Erreur", authError || "Identifiants incorrects");
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de la connexion.";
      Alert.alert("Erreur", message);
    } finally {
      setIsSubmitting(false);
    }
  }, [email, password, validateForm, login, authError]);

  const handleBiometricLogin = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      Alert.alert("Non disponible", "L'authentification biométrique n'est pas disponible sur cet appareil.");
      return;
    }

    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) {
      Alert.alert("Non configuré", "Veuillez configurer l'authentification biométrique dans les paramètres de votre appareil.");
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Connectez-vous avec Face ID",
      fallbackLabel: "Utiliser le mot de passe",
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
      <View className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-500/10 rounded-full blur-[100px]" />
      <View className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-gold-500/5 rounded-full blur-[100px]" />

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
            <View className="relative w-24 h-24 rounded-2xl shadow-2xl overflow-hidden mb-6 bg-primary-500/10">
              <View className="w-full h-full items-center justify-center">
                <MaterialIcons name="verified-user" size={48} color="#1de560" />
              </View>
            </View>

            <Text className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
              Bon retour !
            </Text>
            <Text className="text-slate-500 dark:text-slate-400 text-base font-normal leading-relaxed text-center max-w-[280px]">
              Connectez-vous pour accéder à vos choix halal transparents et éthiques.
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View
            entering={FadeInUp.delay(200).duration(600)}
            className="gap-5"
          >
            <Input
              label="Adresse email"
              placeholder="nom@exemple.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
              leftIcon="mail"
            />

            <Input
              label="Mot de passe"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={errors.password}
            />

            {/* Forgot Password */}
            <View className="items-end -mt-2">
              <Link href="/(auth)/forgot-password" asChild>
                <TouchableOpacity>
                  <Text className="text-sm font-medium text-gold-500">
                    Mot de passe oublié ?
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
                icon={
                  <MaterialIcons
                    name="arrow-forward"
                    size={20}
                    color="#0d1b13"
                  />
                }
              >
                Se connecter
              </Button>

              <TouchableOpacity
                onPress={handleBiometricLogin}
                className="flex-row items-center justify-center gap-2 h-14 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent"
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name="face"
                  size={24}
                  color="#1de560"
                />
                <Text className="text-base font-medium text-slate-700 dark:text-slate-300">
                  Connexion avec Face ID
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
              Pas encore de compte ?{" "}
              <Link href="/(auth)/signup" asChild>
                <Text className="font-bold text-primary-500">
                  Créer un compte
                </Text>
              </Link>
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
