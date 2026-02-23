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
  ScrollView,
} from "react-native";
import { PressableScale } from "@/components/ui/PressableScale";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";

import { AUTH_CONFIG } from "@/constants/config";
import { PremiumBackground } from "@/components/ui";
import { useTranslation, useHaptics, useTheme } from "@/hooks";

const logoSource = require("@assets/images/logo_naqiy.webp");

export default function AuthWelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { impact } = useHaptics();
  const { t } = useTranslation();

  const authMode = AUTH_CONFIG.mode;

  // Si mode V1 uniquement, rediriger directement vers login
  useEffect(() => {
    if (authMode === "v1") {
      router.replace("/(auth)/login");
    }
  }, [authMode]);

  const handleMagicLink = useCallback(async () => {
    impact();
    router.push("/(auth)/magic-link");
  }, []);

  const handleTraditionalLogin = useCallback(async () => {
    impact();
    router.push("/(auth)/login");
  }, []);

  // Si mode V1, ne rien afficher (redirection en cours)
  if (authMode === "v1") {
    return null;
  }

  return (
    <View className="flex-1">
      <PremiumBackground />

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
          <View
            className="w-20 h-20 rounded-2xl items-center justify-center mb-4"
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
          <Text style={{ color: colors.textPrimary }} className="text-3xl font-bold" accessibilityRole="header">
            {t.auth.welcome.appName}
          </Text>
          <Text style={{ color: colors.textSecondary }} className="mt-2 text-center">
            {t.auth.welcome.tagline}
          </Text>
        </Animated.View>

        {/* Welcome Text */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(600)}
          style={{ marginBottom: 32 }}
        >
          <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: "800", letterSpacing: -0.5, marginBottom: 6 }} accessibilityRole="header">
            {t.auth.welcome.greeting}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 22 }}>
            {authMode === "v2"
              ? t.auth.welcome.subtitleV2
              : t.auth.welcome.subtitleHybrid
            }
          </Text>
        </Animated.View>

        {/* Magic Link - Primary (V2 et Hybrid) */}
        <Animated.View
          entering={FadeInUp.delay(300).duration(600)}
          className="mb-6"
        >
          <PressableScale
            onPress={handleMagicLink}
            accessibilityRole="button"
            accessibilityLabel={t.auth.welcome.emailLogin}
            accessibilityHint={t.auth.welcome.emailLoginDesc}
          >
            <View
              style={{
                borderRadius: 16,
                padding: 24,
                borderWidth: 2,
                backgroundColor: isDark ? "rgba(212,175,55,0.1)" : "rgba(212,175,55,0.06)",
                borderColor: isDark ? "rgba(212,175,55,0.3)" : "rgba(212,175,55,0.25)",
                shadowColor: "#d4af37",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.25,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{
                    width: 40, height: 40, borderRadius: 20,
                    backgroundColor: "rgba(212,175,55,0.2)",
                    alignItems: "center", justifyContent: "center", marginRight: 12,
                  }}>
                    <MaterialIcons name="mail-outline" size={24} color="#d4af37" />
                  </View>
                  <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "700" }}>
                    {t.auth.welcome.emailLogin}
                  </Text>
                </View>
                {authMode === "hybrid" && (
                  <View style={{
                    backgroundColor: "rgba(212,175,55,0.2)",
                    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12,
                  }}>
                    <Text style={{ color: "#d4af37", fontSize: 12, fontWeight: "600" }}>
                      {t.auth.welcome.recommended}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={{ color: isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.6)", fontSize: 14, lineHeight: 20 }}>
                {t.auth.welcome.emailLoginDesc}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12 }}>
                <MaterialIcons name="check-circle" size={16} color="#d4af37" />
                <Text style={{ color: isDark ? "rgba(212,175,55,0.8)" : "rgba(146,112,12,0.9)", fontSize: 12, marginLeft: 8 }}>
                  {t.auth.welcome.noPasswordNeeded}
                </Text>
              </View>
            </View>
          </PressableScale>
        </Animated.View>

        {/* Divider + Traditional Login - Only in Hybrid mode */}
        {authMode === "hybrid" && (
          <>
            <Animated.View
              entering={FadeIn.delay(400).duration(400)}
              style={{ paddingVertical: 16, position: "relative" }}
            >
              <View style={{
                position: "absolute", left: 0, right: 0, top: "50%",
                height: 1, backgroundColor: isDark ? "rgba(212,175,55,0.12)" : "rgba(212,175,55,0.15)",
              }} />
              <View style={{ alignItems: "center" }}>
                <Text style={{
                  backgroundColor: colors.background,
                  paddingHorizontal: 16, fontSize: 13, fontWeight: "600",
                  color: isDark ? "rgba(212,175,55,0.5)" : "rgba(146,112,12,0.5)",
                }}>
                  {t.common.or}
                </Text>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(500).duration(600)}>
              <PressableScale
                onPress={handleTraditionalLogin}
                accessibilityRole="button"
                accessibilityLabel={t.auth.welcome.classicLogin}
                accessibilityHint={t.auth.welcome.classicLoginDesc}
              >
                <View style={{
                  borderRadius: 16, padding: 20,
                  backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
                  borderWidth: 1,
                  borderColor: isDark ? "rgba(212,175,55,0.12)" : "rgba(212,175,55,0.1)",
                }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={{
                      width: 40, height: 40, borderRadius: 20,
                      backgroundColor: isDark ? "rgba(212,175,55,0.08)" : "rgba(212,175,55,0.06)",
                      alignItems: "center", justifyContent: "center", marginRight: 12,
                    }}>
                      <MaterialIcons name="lock-outline" size={24} color="#d4af37" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.textPrimary, fontWeight: "600", fontSize: 15 }}>
                        {t.auth.welcome.classicLogin}
                      </Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                        {t.auth.welcome.classicLoginDesc}
                      </Text>
                    </View>
                    <MaterialIcons
                      name="chevron-right"
                      size={24}
                      color={isDark ? "rgba(212,175,55,0.4)" : "rgba(212,175,55,0.5)"}
                    />
                  </View>
                </View>
              </PressableScale>
            </Animated.View>
          </>
        )}

        {/* Benefits */}
        <Animated.View
          entering={FadeIn.delay(authMode === "hybrid" ? 600 : 400).duration(400)}
          style={{
            marginTop: 48,
            borderRadius: 16, padding: 24,
            backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(212,175,55,0.03)",
            borderWidth: 1,
            borderColor: isDark ? "rgba(212,175,55,0.1)" : "rgba(212,175,55,0.08)",
          }}
        >
          <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: 15, marginBottom: 16 }} accessibilityRole="header">
            {t.auth.welcome.whySignUp}
          </Text>

          <View style={{ gap: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
              <MaterialIcons name="qr-code-scanner" size={20} color="#d4af37" />
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginLeft: 12, flex: 1, lineHeight: 19 }}>
                {t.auth.welcome.benefit1}
              </Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
              <MaterialIcons name="location-on" size={20} color="#d4af37" />
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginLeft: 12, flex: 1, lineHeight: 19 }}>
                {t.auth.welcome.benefit2}
              </Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
              <MaterialIcons name="notifications-active" size={20} color="#d4af37" />
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginLeft: 12, flex: 1, lineHeight: 19 }}>
                {t.auth.welcome.benefit3}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Footer */}
        <Animated.View
          entering={FadeIn.delay(authMode === "hybrid" ? 700 : 500).duration(400)}
          style={{ alignItems: "center", marginTop: 32 }}
        >
          <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: "center", lineHeight: 18 }}>
            {t.common.signUpWith}{"\n"}
            <Text style={{ textDecorationLine: "underline" }}>{t.auth.signup.termsLink}</Text> {t.common.and}{" "}
            <Text style={{ textDecorationLine: "underline" }}>{t.auth.signup.privacyLink}</Text>
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
