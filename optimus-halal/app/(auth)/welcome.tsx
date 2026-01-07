/**
 * Authentication Welcome Screen
 * 
 * Entry point for authentication with configurable mode:
 * - V1: Classic login only (email/password)
 * - V2: Magic Link only (passwordless) - DEFAULT
 * - Hybrid: Both options available
 */

import React, { useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";

import { AUTH_CONFIG } from "@/constants/config";

export default function AuthWelcomeScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  
  const authMode = AUTH_CONFIG.mode;

  // Si mode V1 uniquement, rediriger directement vers login
  useEffect(() => {
    if (authMode === "v1") {
      router.replace("/(auth)/login");
    }
  }, [authMode]);

  const handleMagicLink = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(auth)/magic-link");
  }, []);

  const handleTraditionalLogin = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(auth)/login");
  }, []);

  // Si mode V1, ne rien afficher (redirection en cours)
  if (authMode === "v1") {
    return null;
  }

  return (
    <View className="flex-1 bg-white dark:bg-background-dark">
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 40,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <Animated.View
          entering={FadeIn.delay(100).duration(600)}
          className="items-center mb-8"
        >
          <View className="w-24 h-24 rounded-3xl bg-primary-500 items-center justify-center mb-4">
            <MaterialIcons name="verified" size={48} color="white" />
          </View>
          <Text className="text-slate-900 dark:text-white text-3xl font-bold">
            Optimus Halal
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 mt-2 text-center">
            Consommation halal transparente
          </Text>
        </Animated.View>

        {/* Welcome Text */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(600)}
          className="mb-8"
        >
          <Text className="text-slate-900 dark:text-white text-2xl font-bold mb-2">
            Bienvenue !
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-base">
            {authMode === "v2" 
              ? "Connectez-vous en un clic avec votre email"
              : "Connectez-vous pour accéder à toutes les fonctionnalités"
            }
          </Text>
        </Animated.View>

        {/* Magic Link - Primary (V2 et Hybrid) */}
        <Animated.View
          entering={FadeInUp.delay(300).duration(600)}
          className="mb-6"
        >
          <TouchableOpacity
            onPress={handleMagicLink}
            activeOpacity={0.9}
            className="bg-primary-500 rounded-2xl p-6 border-2 border-primary-600"
            style={{
              shadowColor: "#13ec6a",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center mr-3">
                  <MaterialIcons name="mail-outline" size={24} color="white" />
                </View>
                <Text className="text-white text-lg font-bold">
                  Connexion par email
                </Text>
              </View>
              {authMode === "hybrid" && (
                <View className="bg-white/20 px-2 py-1 rounded-full">
                  <Text className="text-white text-xs font-semibold">
                    Recommandé
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-white/90 text-sm leading-relaxed">
              Recevez un lien de connexion instantané. Simple, rapide et sécurisé.
            </Text>
            <View className="flex-row items-center mt-3">
              <MaterialIcons name="check-circle" size={16} color="white" />
              <Text className="text-white/90 text-xs ml-2">
                Pas de mot de passe à retenir
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Divider + Traditional Login - Only in Hybrid mode */}
        {authMode === "hybrid" && (
          <>
            <Animated.View
              entering={FadeIn.delay(400).duration(400)}
              className="relative py-4"
            >
              <View className="absolute inset-x-0 top-1/2 h-px bg-slate-200 dark:bg-slate-800" />
              <View className="items-center">
                <Text className="bg-white dark:bg-background-dark px-4 text-sm text-slate-500">
                  ou
                </Text>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(500).duration(600)}>
              <TouchableOpacity
                onPress={handleTraditionalLogin}
                activeOpacity={0.7}
                className="bg-white dark:bg-surface-dark rounded-2xl p-5 border border-slate-200 dark:border-slate-700"
              >
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mr-3">
                    <MaterialIcons
                      name="lock-outline"
                      size={24}
                      color={isDark ? "#94a3b8" : "#64748b"}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-900 dark:text-white font-semibold">
                      Connexion classique
                    </Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-sm">
                      Email et mot de passe
                    </Text>
                  </View>
                  <MaterialIcons
                    name="chevron-right"
                    size={24}
                    color={isDark ? "#64748b" : "#94a3b8"}
                  />
                </View>
              </TouchableOpacity>
            </Animated.View>
          </>
        )}

        {/* Benefits */}
        <Animated.View
          entering={FadeIn.delay(authMode === "hybrid" ? 600 : 400).duration(400)}
          className="mt-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6"
        >
          <Text className="text-slate-900 dark:text-white font-semibold mb-4">
            Pourquoi s'inscrire ?
          </Text>
          
          <View className="space-y-3">
            <View className="flex-row items-start">
              <MaterialIcons name="qr-code-scanner" size={20} color="#13ec6a" />
              <Text className="text-slate-600 dark:text-slate-400 text-sm ml-3 flex-1">
                Scanner et vérifier instantanément les produits halal
              </Text>
            </View>
            
            <View className="flex-row items-start">
              <MaterialIcons name="location-on" size={20} color="#13ec6a" />
              <Text className="text-slate-600 dark:text-slate-400 text-sm ml-3 flex-1">
                Trouver des commerces halal certifiés près de chez vous
              </Text>
            </View>
            
            <View className="flex-row items-start">
              <MaterialIcons name="notifications-active" size={20} color="#13ec6a" />
              <Text className="text-slate-600 dark:text-slate-400 text-sm ml-3 flex-1">
                Recevoir des alertes sur vos produits favoris
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Footer */}
        <Animated.View
          entering={FadeIn.delay(authMode === "hybrid" ? 700 : 500).duration(400)}
          className="items-center mt-8"
        >
          <Text className="text-xs text-slate-500 dark:text-slate-400 text-center">
            En continuant, vous acceptez nos{"\n"}
            <Text className="underline">Conditions d'utilisation</Text> et notre{" "}
            <Text className="underline">Politique de confidentialité</Text>
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
