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
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  useColorScheme,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
} from "react-native-reanimated";

import { Input, IconButton, Button } from "@/components/ui";
import { useLocalAuthStore } from "@/store";
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
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
      setError("L'email est requis");
      return false;
    }

    if (!isValidEmail(email)) {
      setError("Email invalide");
      return false;
    }

    if (isDisposableEmail(email)) {
      setError("Les emails temporaires ne sont pas autorisés");
      return false;
    }

    if (isNewUser && !displayName.trim()) {
      setError("Le nom est requis pour un nouveau compte");
      return false;
    }

    return true;
  }, [email, displayName, isNewUser]);

  const handleSendMagicLink = useCallback(async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setError("");
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const response = await requestMagicLink(
        email,
        isNewUser ? displayName : undefined
      );

      if (response.success) {
        setAuthState("sent");
        setExpiresIn(response.expiresIn || 900);
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
      } else {
        setError(response.message);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  }, [email, displayName, isNewUser, validateForm]);

  const handleVerifyToken = useCallback(
    async (token: string) => {
      setAuthState("verifying");
      setError("");

      try {
        const response = await verifyMagicLinkToken(token);

        if (response.success && response.user) {
          setAuthState("success");
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          );

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
          setError(response.message || "Lien invalide ou expiré");
          setAuthState("input");
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error
          );
        }
      } catch (err: any) {
        setError(err.message || "Échec de la vérification");
        setAuthState("input");
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
        <Text className="text-slate-900 dark:text-white tracking-tight text-[32px] font-bold leading-tight mb-2">
          {isNewUser ? "Créer votre compte" : "Connexion rapide"}
        </Text>
        <Text className="text-slate-500 dark:text-slate-400 text-base font-normal leading-normal">
          {isNewUser
            ? "Recevez un lien de connexion instantané par email"
            : "Connectez-vous sans mot de passe via email"}
        </Text>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.delay(300).duration(600)}
        className="gap-5"
      >
        {isNewUser && (
          <Input
            label="Nom complet"
            placeholder="Votre nom"
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
            leftIcon="person"
          />
        )}

        <Input
          label="Adresse email"
          placeholder="nom@exemple.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          error={error}
          leftIcon="mail"
        />

        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
          onPress={handleSendMagicLink}
          className="mt-4"
        >
          {isNewUser ? "Créer un compte" : "Recevoir le lien"}
        </Button>

        <TouchableOpacity
          onPress={() => setIsNewUser(!isNewUser)}
          className="items-center py-2"
        >
          <Text className="text-sm text-slate-600 dark:text-slate-400">
            {isNewUser ? (
              <>
                Vous avez déjà un compte ?{" "}
                <Text className="font-bold text-primary-600">
                  Se connecter
                </Text>
              </>
            ) : (
              <>
                Pas encore de compte ?{" "}
                <Text className="font-bold text-primary-600">S'inscrire</Text>
              </>
            )}
          </Text>
        </TouchableOpacity>
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
      >
        <MaterialIcons name="mail-outline" size={48} color="#13ec6a" />
      </Animated.View>

      {/* Title */}
      <Animated.View
        entering={FadeInDown.delay(200).duration(500)}
        className="mb-4"
      >
        <Text className="text-slate-900 dark:text-white text-2xl font-bold text-center mb-2">
          Vérifiez vos emails
        </Text>
        <Text className="text-slate-500 dark:text-slate-400 text-base text-center px-8">
          Nous avons envoyé un lien de connexion à
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
            Ouvrez l'email que nous venons de vous envoyer
          </Text>
        </View>
        <View className="flex-row items-start">
          <View className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/50 items-center justify-center mr-3 mt-0.5">
            <Text className="text-primary-700 dark:text-primary-400 text-xs font-bold">
              2
            </Text>
          </View>
          <Text className="text-slate-700 dark:text-slate-300 flex-1">
            Cliquez sur le lien pour vous connecter instantanément
          </Text>
        </View>
      </Animated.View>

      {/* Expiration Timer */}
      <Text className="text-slate-500 dark:text-slate-400 text-sm mb-4">
        Le lien expire dans {formatTime(expiresIn)}
      </Text>

      {/* Resend Button */}
      <TouchableOpacity
        onPress={handleResend}
        disabled={expiresIn > 840} // Can resend after 1 minute
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
            ? `Renvoyer dans ${Math.floor((expiresIn - 840) / 60)}min`
            : "Renvoyer le lien"}
        </Text>
      </TouchableOpacity>

      {/* Change Email */}
      <TouchableOpacity
        onPress={() => setAuthState("input")}
        className="mt-6"
      >
        <Text className="text-slate-600 dark:text-slate-400 text-sm">
          Mauvais email ?{" "}
          <Text className="font-semibold text-primary-600">Modifier</Text>
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderVerifyingState = () => (
    <Animated.View
      entering={FadeIn.duration(400)}
      className="items-center py-12"
    >
      <ActivityIndicator size="large" color="#13ec6a" />
      <Text className="text-slate-600 dark:text-slate-400 mt-4">
        Vérification en cours...
      </Text>
    </Animated.View>
  );

  const renderSuccessState = () => (
    <Animated.View
      entering={FadeIn.duration(400)}
      className="items-center py-12"
    >
      <View className="w-24 h-24 rounded-full bg-primary-50 dark:bg-primary-900/30 items-center justify-center mb-4">
        <MaterialIcons name="check-circle" size={48} color="#13ec6a" />
      </View>
      <Text className="text-slate-900 dark:text-white text-2xl font-bold">
        Connexion réussie !
      </Text>
      <Text className="text-slate-500 dark:text-slate-400 mt-2">
        Redirection...
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
