/**
 * Sign Up Screen
 * 
 * Écran d'inscription avec formulaire complet
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
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";

import { Button, Input, IconButton } from "@/components/ui";
import { useAuthStore } from "@/store";

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { setUser } = useAuthStore();

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Le nom est requis";
    }

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
  }, [fullName, email, password]);

  const handleSignUp = useCallback(async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Create user
      setUser({
        id: "1",
        email,
        fullName,
        location: location ? { city: location, country: "France" } : undefined,
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

      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Erreur", "Une erreur est survenue lors de l'inscription");
    } finally {
      setIsLoading(false);
    }
  }, [fullName, email, password, location, validateForm, setUser]);

  const handleSocialAuth = useCallback(async (provider: "google" | "apple") => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Bientôt disponible", `L'inscription avec ${provider === "google" ? "Google" : "Apple"} sera bientôt disponible.`);
  }, []);

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
          <Animated.View
            entering={FadeIn.delay(100).duration(400)}
            className="flex-row items-center justify-between mb-4"
          >
            <IconButton
              icon="arrow-back"
              variant="default"
              onPress={() => router.back()}
              color={isDark ? "#ffffff" : "#1e293b"}
            />
            <Text className="text-sm font-medium text-slate-400 dark:text-slate-500">
              Étape 1 sur 3
            </Text>
          </Animated.View>

          {/* Title */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(600)}
            className="mb-6"
          >
            <Text className="text-slate-900 dark:text-white tracking-tight text-[32px] font-bold leading-tight mb-2">
              Créer votre compte
            </Text>
            <Text className="text-slate-500 dark:text-slate-400 text-base font-normal leading-normal">
              Commencez votre parcours vers une consommation transparente et éthique.
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View
            entering={FadeInUp.delay(300).duration(600)}
            className="gap-5"
          >
            <Input
              label="Nom complet"
              placeholder="Entrez votre nom complet"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              error={errors.fullName}
            />

            <Input
              label="Adresse email"
              placeholder="nom@exemple.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
            />

            <Input
              label="Mot de passe"
              placeholder="Créer un mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={errors.password}
              hint="Minimum 8 caractères"
            />

            <Input
              label="Localisation"
              placeholder="Ville, Pays"
              value={location}
              onChangeText={setLocation}
              leftIcon="location-on"
            />

            {/* Submit Button */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
              onPress={handleSignUp}
              className="mt-4"
            >
              Créer un compte
            </Button>

            {/* Terms */}
            <Text className="text-center text-xs text-slate-500 dark:text-slate-400 leading-relaxed px-4">
              En vous inscrivant, vous acceptez nos{" "}
              <Text className="text-slate-900 dark:text-white underline">
                Conditions d'utilisation
              </Text>{" "}
              et notre{" "}
              <Text className="text-slate-900 dark:text-white underline">
                Politique de confidentialité
              </Text>
              .
            </Text>
          </Animated.View>

          {/* Divider */}
          <Animated.View
            entering={FadeIn.delay(400).duration(400)}
            className="relative py-6"
          >
            <View className="absolute inset-x-0 top-1/2 h-px bg-slate-200 dark:bg-slate-800" />
            <View className="items-center">
              <Text className="bg-white dark:bg-background-dark px-4 text-sm font-medium text-slate-500">
                Ou continuer avec
              </Text>
            </View>
          </Animated.View>

          {/* Social Auth */}
          <Animated.View
            entering={FadeInUp.delay(500).duration(600)}
            className="flex-row gap-4"
          >
            <TouchableOpacity
              onPress={() => handleSocialAuth("google")}
              className="flex-1 flex-row items-center justify-center gap-2 h-14 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark"
              activeOpacity={0.7}
            >
              <MaterialIcons name="g-mobiledata" size={24} color="#4285F4" />
              <Text className="text-sm font-semibold text-slate-700 dark:text-white">
                Google
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleSocialAuth("apple")}
              className="flex-1 flex-row items-center justify-center gap-2 h-14 rounded-xl bg-slate-900 dark:bg-white"
              activeOpacity={0.7}
            >
              <MaterialIcons
                name="apple"
                size={24}
                color={isDark ? "#0f172a" : "#ffffff"}
              />
              <Text className="text-sm font-semibold text-white dark:text-slate-900">
                Apple
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Login Link */}
          <Animated.View
            entering={FadeIn.delay(600).duration(400)}
            className="items-center mt-8"
          >
            <Text className="text-sm text-slate-500 dark:text-slate-400">
              Vous avez déjà un compte ?{" "}
              <Link href="/(auth)/login" asChild>
                <Text className="font-bold text-gold-600">
                  Se connecter
                </Text>
              </Link>
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
