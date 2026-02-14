/**
 * Sign Up Screen
 * 
 * Écran d'inscription avec:
 * - Numéro de téléphone (identifiant principal)
 * - Nom complet
 * - Email (optionnel)
 * - Localisation (ville française avec géolocalisation)
 * - Mot de passe
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
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";

import { Button, Input, IconButton, PhoneInput, LocationPicker, validateFrenchPhone } from "@/components/ui";
import { useLocalAuthStore } from "@/store";
import { authService } from "@/services/api/auth.service";
import { City } from "@/constants/locations";
import { useTranslation, useHaptics } from "@/hooks";

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { impact, notification } = useHaptics();
  const isDark = colorScheme === "dark";
  const { t } = useTranslation();

  // Form state
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [fullPhoneNumber, setFullPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { setUser } = useLocalAuthStore();

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = t.auth.signup.errors.fullNameRequired;
    }

    if (!phoneNumber) {
      newErrors.phoneNumber = "Le numéro de téléphone est requis";
    } else if (!validateFrenchPhone(phoneNumber)) {
      newErrors.phoneNumber = "Numéro de téléphone invalide";
    }

    // Email optionnel mais validé si renseigné
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t.auth.signup.errors.emailInvalid;
    }

    if (!password) {
      newErrors.password = t.auth.signup.errors.passwordRequired;
    } else if (password.length < 8) {
      newErrors.password = t.auth.signup.errors.passwordTooShort;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [fullName, phoneNumber, email, password]);

  const handlePhoneChange = useCallback((formatted: string, full: string) => {
    setPhoneNumber(formatted);
    setFullPhoneNumber(full);
  }, []);

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
        email: email || undefined,
        password,
        displayName: fullName,
        phoneNumber: fullPhoneNumber,
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
        Alert.alert(t.common.error, response.message || "Échec de l'inscription");
      }
    } catch (error: any) {
      console.error("[Signup] Error:", error);
      Alert.alert(
        t.common.error,
        error.message || "Une erreur est survenue lors de l'inscription. Vérifiez votre connexion internet."
      );
    } finally {
      setIsLoading(false);
    }
  }, [fullName, phoneNumber, fullPhoneNumber, email, password, selectedCity, validateForm, setUser]);

  const handleSocialAuth = useCallback(async (provider: "google" | "apple") => {
    impact();
    Alert.alert(t.common.comingSoon, `L'inscription avec ${provider === "google" ? "Google" : "Apple"} sera bientôt disponible.`);
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
              accessibilityLabel="Retour"
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
            {/* Phone Number - Primary Identifier */}
            <PhoneInput
              label="Numéro de téléphone"
              value={phoneNumber}
              onChangeText={handlePhoneChange}
              error={errors.phoneNumber}
              hint="Nous vous enverrons un code de vérification"
              defaultCountryCode="FR"
            />

            {/* Full Name */}
            <Input
              label={t.auth.signup.fullName}
              placeholder={t.auth.signup.fullNamePlaceholder}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              error={errors.fullName}
              accessibilityLabel="Nom complet"
              accessibilityHint="Entrez votre nom complet"
            />

            {/* Email - Optional */}
            <Input
              label={t.auth.signup.email}
              placeholder="nom@exemple.com (optionnel)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
              hint="Pour recevoir les alertes et confirmations"
              accessibilityLabel="Adresse email, optionnel"
              accessibilityHint="Entrez votre adresse email pour recevoir les alertes"
            />

            {/* Location - City Picker */}
            <LocationPicker
              label="Votre ville"
              value={selectedCity?.name}
              onSelect={handleCitySelect}
              placeholder="Sélectionner une ville"
              hint="Pour trouver les commerces halal près de chez vous"
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
              hint="Minimum 8 caractères"
              accessibilityLabel="Mot de passe"
              accessibilityHint="Créez un mot de passe de minimum 8 caractères"
            />

            {/* Submit Button */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
              onPress={handleSignUp}
              className="mt-4"
              accessibilityRole="button"
              accessibilityLabel="Créer un compte"
              accessibilityHint="Double-tapez pour créer votre compte"
              accessibilityState={{ disabled: isLoading }}
            >
              {t.auth.signup.submit}
            </Button>

            {/* Terms */}
            <Text className="text-center text-xs text-slate-500 dark:text-slate-400 leading-relaxed px-4">
              En vous inscrivant, vous acceptez nos{" "}
              <Text className="text-slate-900 dark:text-white underline">
                {t.auth.signup.termsLink}
              </Text>{" "}
              {t.auth.signup.and}{" "}
              <Text className="text-slate-900 dark:text-white underline">
                {t.auth.signup.privacyLink}
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
              accessibilityRole="button"
              accessibilityLabel="S'inscrire avec Google"
              accessibilityHint="Double-tapez pour vous inscrire avec votre compte Google"
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
              accessibilityRole="button"
              accessibilityLabel="S'inscrire avec Apple"
              accessibilityHint="Double-tapez pour vous inscrire avec votre compte Apple"
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
              {t.auth.signup.hasAccount}{" "}
              <Link href="/(auth)/login" asChild>
                <Text
                  className="font-bold text-gold-600"
                  accessibilityRole="link"
                  accessibilityLabel="Se connecter"
                  accessibilityHint="Double-tapez pour aller à la page de connexion"
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
