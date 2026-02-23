/**
 * Marketplace Coming Soon Screen — Premium Naqiy Edition
 *
 * Page d'attente pour le Naqiy Marketplace avec:
 * - Brand header: Logo + "Naqiy Marketplace"
 * - Hero card gold-tinted avec marketplace icon
 * - Waitlist CTA avec gold gradient
 * - Social proof avatars
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { PremiumBackground } from "@/components/ui";
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
import { brand, glass } from "@/theme/colors";

const logoSource = require("@assets/images/logo_naqiy.webp");
const GOLD = "#d4af37";

const WAITLIST_AVATARS = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA4ovN9jYOXt22g2xyrUQerj1gvBMDUkGo-XFHAnonmyn_aDXxmVJoVnINp0eOLrzYsyJiOFxFHAm5DB3xxovgGbJ4r51BrbKest7aA5RSAWaf34JSbNPU2UD3HrKX0b2sscTejq3gY2z0A1xMikHMXEr389sXO6DD9_XQnRCgt7lEG0mYipI2pwdXjqhcIf8TO4JQQOj0w_c0GxyO8ezWjWcwZaKY84RCg0Q6NzSUfkdU4KmS_N4JMlFR8c-tri67J4nQwAizW_vix",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAG_GH3aBzJIXZIeNILJBWRe7Lt49NTDpcgByFLg-VDkn-PYPuAxGZjrs50m3P6NTywUw9YrGYOcvWo8PqxfFbCVLiasvNHvy-76HZ1KhL4rYl0oVf4qGVjbo2c4UhXs45DtuaPP5o78fugeErOopjPG8St_tcJhho4wzwBbPZ1rNA4iOkQExdauGvbB43G9i1UO9VU10-qFGpXXqMb5YU5H6QmmfVgBPeK7IiJJXLjZRi2fZz4uYaEwSOhwQdvKJXuf2Etil_VuEB-",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAH7W-dqDcpi1VNtdWJGWzeeWTWM7wNFjZOUzQ-GMLk8UfsQoTKHdVI-GaCN6hRySyyj51nepTbVvG25zdJGeozqktCEcIktpdH1kNgw8_uFyxUc-6krxI5QGNwbi5OoHe21ybS94zQFfGg5Kx-lJk8W5F2EuhkumOpXLjmcFCIYzbTww2BnDuc1Qmh8Dn-dXep9pr2A-0mfchS9WJ3riREpt_2roMLw6m7GdvoXTm0C35Pnk5h9cSTM0yPEGzGOZuPZ4XPP-I-3WMR",
];

export default function MarketplaceComingSoonScreen() {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const { notification } = useHaptics();

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!email.trim()) {
      Alert.alert("Erreur", "Veuillez entrer votre adresse email");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Erreur", "Veuillez entrer une adresse email valide");
      return;
    }

    notification();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        "Inscription réussie!",
        "Vous serez notifié dès le lancement du marketplace.",
        [{ text: "Super!", onPress: () => router.back() }]
      );
    }, 1500);
  }, [email, notification]);

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <PremiumBackground />

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={styles.header}
      >
        <View style={styles.headerBrand}>
          <PressableScale
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <View
              style={[
                styles.backButton,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(255,255,255,0.7)",
                  borderColor: isDark
                    ? "rgba(207,165,51,0.15)"
                    : "rgba(212,175,55,0.12)",
                },
              ]}
            >
              <MaterialIcons
                name="arrow-back-ios-new"
                size={16}
                color={isDark ? GOLD : colors.textPrimary}
              />
            </View>
          </PressableScale>
          <Image
            source={logoSource}
            style={{ width: 26, height: 26 }}
            contentFit="contain"
            cachePolicy="memory-disk"
          />
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Naqiy{" "}
            <Text style={{ fontWeight: "400", color: colors.textSecondary }}>
              Marketplace
            </Text>
          </Text>
        </View>

        {/* Notification bell */}
        <PressableScale
          onPress={() => router.navigate("/(tabs)/alerts")}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <View
            style={[
              styles.bellButton,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(255,255,255,0.7)",
                borderColor: isDark
                  ? "rgba(207,165,51,0.15)"
                  : "rgba(212,175,55,0.12)",
              },
            ]}
          >
            <MaterialIcons
              name="notifications-none"
              size={20}
              color={isDark ? GOLD : colors.textPrimary}
            />
          </View>
        </PressableScale>
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingBottom: insets.bottom + 24,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero Card */}
          <Animated.View
            entering={FadeInDown.delay(150).duration(600)}
            style={{ marginTop: 16 }}
          >
            <View
              style={[
                styles.heroCard,
                {
                  backgroundColor: isDark ? glass.dark.bg : glass.light.bg,
                  borderColor: isDark
                    ? "rgba(207,165,51,0.18)"
                    : "rgba(212,175,55,0.12)",
                },
              ]}
            >
              {/* Directional gold halo */}
              <LinearGradient
                colors={
                  isDark
                    ? ["rgba(207,165,51,0.15)", "transparent"]
                    : ["rgba(19,236,106,0.08)", "transparent"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
                pointerEvents="none"
              />

              {/* Marketplace icon */}
              <View
                style={[
                  styles.heroIconWrap,
                  {
                    backgroundColor: isDark
                      ? "rgba(212,175,55,0.12)"
                      : "rgba(212,175,55,0.08)",
                  },
                ]}
              >
                <MaterialIcons name="storefront" size={40} color={GOLD} />
              </View>

              {/* Content */}
              <Text
                style={[
                  styles.heroTitle,
                  { color: colors.textPrimary },
                ]}
              >
                Le Marketplace arrive bientôt !
              </Text>
              <Text
                style={[
                  styles.heroSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                Découvrez bientôt des produits halal certifiés, éthiques et de qualité premium.
              </Text>

              {/* Features preview */}
              <View style={styles.featuresRow}>
                {[
                  { icon: "verified" as const, label: "Certifié Halal" },
                  { icon: "local-shipping" as const, label: "Livraison" },
                  { icon: "shield" as const, label: "Traçabilité" },
                ].map((item, i) => (
                  <View key={i} style={styles.featureChip}>
                    <MaterialIcons
                      name={item.icon}
                      size={14}
                      color={isDark ? GOLD : brand.primary}
                    />
                    <Text
                      style={[
                        styles.featureChipText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>

          {/* Waitlist Section */}
          <Animated.View
            entering={FadeInDown.delay(350).duration(600)}
            style={{ marginTop: 28 }}
          >
            <Text
              style={[styles.waitlistTitle, { color: colors.textPrimary }]}
            >

              {"Rejoindre la liste d'attente"}
            </Text>
            <Text
              style={[
                styles.waitlistSubtitle,
                { color: colors.textSecondary },
              ]}
            >
              {"Soyez parmi les premiers à accéder au marketplace."}
            </Text>

            {/* Email Input */}
            <View style={{ marginTop: 16 }}>
              <View
                style={[
                  styles.inputWrap,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.03)"
                      : "#ffffff",
                    borderColor: isDark
                      ? "rgba(212,175,55,0.15)"
                      : "rgba(212,175,55,0.2)",
                  },
                ]}
              >
                <MaterialIcons
                  name="mail-outline"
                  size={20}
                  color={isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)"}
                  style={{ marginRight: 12 }}
                />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Votre adresse email"
                  placeholderTextColor={
                    isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.35)"
                  }
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  style={[
                    styles.input,
                    { color: colors.textPrimary },
                  ]}
                />
              </View>
            </View>

            {/* CTA Button */}
            <PressableScale
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={{ marginTop: 14 }}
              accessibilityRole="button"
              accessibilityLabel="Rejoindre la liste d'attente"
            >
              <View
                style={[
                  styles.ctaButton,
                  isSubmitting && { opacity: 0.6 },
                ]}
              >
                <LinearGradient
                  colors={isDark ? ["#FDE08B", "#CFA533"] : [brand.primary, "#0ea64b"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
                />
                <MaterialIcons
                  name="notifications-active"
                  size={18}
                  color={isDark ? "#1A1A1A" : "#ffffff"}
                />
                <Text
                  style={[
                    styles.ctaText,
                    { color: isDark ? "#1A1A1A" : "#ffffff" },
                  ]}
                >
                  {isSubmitting
                    ? "Inscription..."
                    : "Rejoindre la liste d'attente"}
                </Text>
              </View>
            </PressableScale>
          </Animated.View>

          {/* Social Proof */}
          <Animated.View
            entering={FadeInUp.delay(550).duration(600)}
            style={styles.socialProof}
          >
            <View style={styles.avatarStack}>
              {WAITLIST_AVATARS.map((uri, index) => (
                <View
                  key={index}
                  style={[
                    styles.avatarCircle,
                    {
                      marginLeft: index > 0 ? -10 : 0,
                      borderColor: isDark ? "#0C0C0C" : "#f3f1ed",
                    },
                  ]}
                >
                  <Image
                    source={{ uri }}
                    style={{ width: "100%", height: "100%", borderRadius: 14 }}
                    contentFit="cover"
                    transition={200}
                  />
                </View>
              ))}
              <View
                style={[
                  styles.avatarCircle,
                  styles.avatarCount,
                  {
                    marginLeft: -10,
                    borderColor: isDark ? "#0C0C0C" : "#f3f1ed",
                    backgroundColor: isDark
                      ? "rgba(212,175,55,0.12)"
                      : "rgba(212,175,55,0.08)",
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: "800",
                    color: GOLD,
                  }}
                >
                  +2k
                </Text>
              </View>
            </View>

            <Text
              style={[styles.socialText, { color: colors.textMuted }]}
            >
              Rejoignez 2 000+ personnes en attente
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  // Hero card
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
    overflow: "hidden",
  },
  heroIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 300,
    marginBottom: 20,
  },
  featuresRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  featureChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(212,175,55,0.06)",
  },
  featureChipText: {
    fontSize: 11,
    fontWeight: "600",
  },

  // Waitlist
  waitlistTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  waitlistSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: "100%",
  },
  ctaButton: {
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    overflow: "hidden",
  },
  ctaText: {
    fontSize: 15,
    fontWeight: "700",
  },

  // Social proof
  socialProof: {
    alignItems: "center",
    marginTop: 28,
    gap: 10,
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    overflow: "hidden",
  },
  avatarCount: {
    alignItems: "center",
    justifyContent: "center",
  },
  socialText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
