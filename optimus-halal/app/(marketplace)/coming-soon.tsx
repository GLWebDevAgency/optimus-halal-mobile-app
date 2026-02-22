/**
 * Marketplace Coming Soon Screen
 * 
 * Page d'attente pour le marketplace avec:
 * - Hero visual avec badge certification
 * - Formulaire d'inscription waitlist
 * - Social proof avec avatars
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { PressableScale } from "@/components/ui/PressableScale";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useHaptics, useTheme } from "@/hooks";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

const WAITLIST_AVATARS = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA4ovN9jYOXt22g2xyrUQerj1gvBMDUkGo-XFHAnonmyn_aDXxmVJoVnINp0eOLrzYsyJiOFxFHAm5DB3xxovgGbJ4r51BrbKest7aA5RSAWaf34JSbNPU2UD3HrKX0b2sscTejq3gY2z0A1xMikHMXEr389sXO6DD9_XQnRCgt7lEG0mYipI2pwdXjqhcIf8TO4JQQOj0w_c0GxyO8ezWjWcwZaKY84RCg0Q6NzSUfkdU4KmS_N4JMlFR8c-tri67J4nQwAizW_vix",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAG_GH3aBzJIXZIeNILJBWRe7Lt49NTDpcgByFLg-VDkn-PYPuAxGZjrs50m3P6NTywUw9YrGYOcvWo8PqxfFbCVLiasvNHvy-76HZ1KhL4rYl0oVf4qGVjbo2c4UhXs45DtuaPP5o78fugeErOopjPG8St_tcJhho4wzwBbPZ1rNA4iOkQExdauGvbB43G9i1UO9VU10-qFGpXXqMb5YU5H6QmmfVgBPeK7IiJJXLjZRi2fZz4uYaEwSOhwQdvKJXuf2Etil_VuEB-",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAH7W-dqDcpi1VNtdWJGWzeeWTWM7wNFjZOUzQ-GMLk8UfsQoTKHdVI-GaCN6hRySyyj51nepTbVvG25zdJGeozqktCEcIktpdH1kNgw8_uFyxUc-6krxI5QGNwbi5OoHe21ybS94zQFfGg5Kx-lJk8W5F2EuhkumOpXLjmcFCIYzbTww2BnDuc1Qmh8Dn-dXep9pr2A-0mfchS9WJ3riREpt_2roMLw6m7GdvoXTm0C35Pnk5h9cSTM0yPEGzGOZuPZ4XPP-I-3WMR",
];

export default function MarketplaceComingSoonScreen() {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const { impact, notification } = useHaptics();

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBack = useCallback(async () => {
    impact();
    router.back();
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!email.trim()) {
      Alert.alert("Erreur", "Veuillez entrer votre adresse email");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Erreur", "Veuillez entrer une adresse email valide");
      return;
    }

    notification();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        "Inscription réussie! 🎉",
        "Vous serez notifié dès le lancement du marketplace.",
        [{ text: "Super!", onPress: () => router.back() }]
      );
    }, 1500);
  }, [email]);

  return (
    <View
      className="flex-1 bg-background-light dark:bg-background-dark"
      style={{ paddingTop: insets.top }}
    >
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        className="flex-row items-center justify-between px-4 py-4"
      >
        <Pressable
          onPress={handleBack}
          hitSlop={8}
        >
          <View className="h-10 w-10 items-center justify-center rounded-full">
            <MaterialIcons
              name="arrow-back-ios"
              size={22}
              color={isDark ? "#ffffff" : "#1e293b"}
            />
          </View>
        </Pressable>

        {/* Logo */}
        <View className="flex-row items-center gap-2">
          <View className="h-6 w-6 rounded bg-primary items-center justify-center">
            <MaterialIcons name="verified" size={16} color="#102216" />
          </View>
          <Text className="font-bold text-lg text-slate-800 dark:text-white">
            Halalify
          </Text>
        </View>

        <View className="w-10" />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 24,
            paddingBottom: insets.bottom + 16,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero Visual */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(600)}
            className="relative w-full aspect-square max-w-[320px] self-center mb-8"
          >
            {/* Decorative blur */}
            <View className="absolute inset-0 bg-primary/20 rounded-full blur-3xl opacity-60" />

            {/* Main Image Card */}
            <View className="relative w-full h-full bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-white/50 dark:border-white/5">
              <Image
                source={{
                  uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuB-zk3K5A99Er3WNEbx4SxaPom-9DdbJj0G-kV6nyGVVBRr_0rxOr5JrFEPqnElHJlQgEFbgcEthfz0AEZNpU7rfVE_naDRaiwqsq3kl_0hlNkm9T1KsgJ0Df0-E3YU7c3bpBiWj5AYVCfug5KI9QHdAqChHavZ-dVjMwOs9sT36_Yr4Zo1Fisw0B02JdXSXFMIy2n7A0X2RCr6r2ETHvu1LBvOw9dm882-gQ6wf2-tLzpwozz-yMHb1v-e3f_hR8DrJyhQUl_kwf-k",
                }}
                className="w-full h-full"
                contentFit="cover"
                transition={200}
              />

              {/* Overlay gradient */}
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.6)"]}
                className="absolute inset-0"
              />

              {/* Floating Badge */}
              <View className="absolute bottom-6 left-6 right-6 p-4 bg-white/95 dark:bg-slate-900/95 rounded-xl border border-amber-500/30 flex-row items-center gap-3">
                <View className="h-10 w-10 rounded-full bg-primary/10 items-center justify-center">
                  <MaterialIcons name="workspace-premium" size={24} color="#059669" />
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-0.5">
                    Certifié
                  </Text>
                  <Text className="text-sm font-medium text-slate-800 dark:text-white leading-tight">
                    Traçabilité 100% Transparente
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Typography Block */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(600)}
            className="items-center w-full mb-8"
          >
            {/* Coming Soon Badge */}
            <View className="flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
              <View className="w-2 h-2 rounded-full bg-amber-500" />
              <Text className="text-xs font-semibold text-amber-600 dark:text-amber-500 uppercase tracking-wide">
                Bientôt Disponible
              </Text>
            </View>

            <Text className="text-3xl font-bold text-slate-800 dark:text-white text-center leading-tight tracking-tight mb-3">
              Shopping Éthique,{"\n"}Simplifié.
            </Text>

            <Text className="text-base text-slate-600 dark:text-slate-300 text-center leading-relaxed max-w-xs">
              Nous créons un marketplace pour des produits halal certifiés et transparents. 
              Inscrivez-vous pour un accès anticipé.
            </Text>
          </Animated.View>

          {/* Email Form */}
          <Animated.View
            entering={FadeInUp.delay(600).duration(600)}
            className="w-full gap-4"
          >
            {/* Email Input */}
            <View className="relative">
              <View className="absolute inset-y-0 left-0 pl-3.5 justify-center">
                <MaterialIcons
                  name="mail-outline"
                  size={20}
                  color={isDark ? "#9ca3af" : "#9ca3af"}
                />
              </View>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Entrez votre adresse email"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                className="w-full pl-11 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                style={{ fontSize: 16 }}
              />
            </View>

            {/* Submit Button */}
            <PressableScale
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={{
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}
            >
              <View
                className={`w-full bg-primary py-4 rounded-xl flex-row items-center justify-center gap-2 shadow-lg ${
                  isSubmitting ? "opacity-70" : ""
                }`}
              >
                <Text className="text-background-dark font-bold text-lg">
                  {isSubmitting ? "Inscription..." : "Me Notifier"}
                </Text>
                {!isSubmitting && (
                  <MaterialIcons name="arrow-forward" size={20} color="#102216" />
                )}
              </View>
            </PressableScale>
          </Animated.View>

          {/* Social Proof */}
          <Animated.View
            entering={FadeInUp.delay(800).duration(600)}
            className="mt-6 items-center gap-3"
          >
            {/* Avatar Stack */}
            <View className="flex-row items-center">
              {WAITLIST_AVATARS.map((uri, index) => (
                <View
                  key={index}
                  className="h-6 w-6 rounded-full border-2 border-white dark:border-background-dark overflow-hidden"
                  style={{ marginLeft: index > 0 ? -8 : 0 }}
                >
                  <Image
                    source={{ uri }}
                    className="w-full h-full"
                    contentFit="cover"
                    transition={200}
                  />
                </View>
              ))}
              <View
                className="h-6 w-6 rounded-full border-2 border-white dark:border-background-dark bg-slate-100 dark:bg-slate-800 items-center justify-center"
                style={{ marginLeft: -8 }}
              >
                <Text className="text-[8px] font-bold text-slate-500 dark:text-slate-300">
                  +2k
                </Text>
              </View>
            </View>

            <Text className="text-xs text-slate-400 dark:text-slate-500 font-medium text-center">
              Rejoignez 2 000+ personnes en attente.{"\n"}Pas de spam, promis.
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
