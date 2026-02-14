/**
 * Forgot Password Screen (Request Reset)
 * 
 * Ultra Premium design fidèle au template
 * Écran pour demander la réinitialisation du mot de passe
 * 
 * Supports: French, English, Arabic (RTL)
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useColorScheme,
  TextInput,
  StyleSheet,
  Dimensions,
  I18nManager,
} from "react-native";
import { router, Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

import { colors } from "@/constants/theme";
import { useTranslation } from "@/hooks/useTranslation";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { t, isRTL } = useTranslation();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState("");

  const buttonScale = useSharedValue(1);

  const validateEmail = useCallback((email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!email) {
      setError(t.auth.forgotPassword.errors.emailRequired);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!validateEmail(email)) {
      setError(t.auth.forgotPassword.errors.emailInvalid);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setError("");
    setIsLoading(true);
    
    buttonScale.value = withSequence(
      withSpring(0.95, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Navigate to confirmation screen with masked email
      router.push({
        pathname: "/(auth)/reset-confirmation",
        params: { email: maskEmail(email) },
      });
    } catch (error) {
      setError(t.auth.forgotPassword.errors.sendFailed);
    } finally {
      setIsLoading(false);
    }
  }, [email, validateEmail, t]);

  const maskEmail = (email: string) => {
    const [localPart, domain] = email.split("@");
    if (localPart.length <= 3) {
      return `${localPart[0]}***@${domain}`;
    }
    return `${localPart.slice(0, 3)}***@${domain}`;
  };

  const handleGoBack = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, []);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <View 
      style={[
        styles.container, 
        { backgroundColor: isDark ? "#102217" : "#f6f8f7" }
      ]}
    >
      {/* Background Gradient */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={isDark 
            ? ["rgba(19, 236, 106, 0.05)", "transparent", "transparent"]
            : ["rgba(19, 236, 106, 0.08)", "transparent", "transparent"]
          }
          style={styles.backgroundGradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.5 }}
        />
        {/* Bottom gradient fade */}
        <LinearGradient
          colors={isDark 
            ? ["transparent", "rgba(16, 34, 23, 0.9)"]
            : ["transparent", "rgba(246, 248, 247, 0.9)"]
          }
          style={styles.bottomGradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top,
              paddingBottom: insets.bottom + 24,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top App Bar */}
          <Animated.View 
            entering={FadeIn.delay(100).duration(400)}
            style={styles.header}
          >
            <TouchableOpacity
              onPress={handleGoBack}
              style={styles.backButton}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Retour"
              accessibilityHint="Double-tapez pour revenir à l'écran précédent"
            >
              <MaterialIcons
                name="arrow-back-ios-new"
                size={24}
                color={colors.light.primary}
              />
            </TouchableOpacity>
            
            <View style={styles.headerSpacer} />
            
            {/* Subtle brand icon */}
            <View style={styles.headerIcon} accessible={false}>
              <MaterialIcons
                name="lock-reset"
                size={28}
                color={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"}
              />
            </View>
          </Animated.View>

          {/* Content */}
          <View style={styles.content}>
            {/* Headline */}
            <Animated.View
              entering={FadeInDown.delay(200).duration(500)}
              style={styles.headlineContainer}
            >
              <Text
                style={[
                  styles.headline,
                  {
                    color: isDark ? "#ffffff" : "#1f2937",
                    textAlign: isRTL ? "right" : "left",
                  }
                ]}
                accessibilityRole="header"
              >
                {t.auth.forgotPassword.title}
              </Text>
            </Animated.View>

            {/* Body Text */}
            <Animated.View
              entering={FadeInDown.delay(300).duration(500)}
              style={styles.bodyTextContainer}
            >
              <Text 
                style={[
                  styles.bodyText,
                  { 
                    color: isDark ? "#9ca3af" : "#6b7280",
                    textAlign: isRTL ? "right" : "left",
                  }
                ]}
              >
                {t.auth.forgotPassword.subtitle}
              </Text>
            </Animated.View>

            {/* Form */}
            <Animated.View
              entering={FadeInUp.delay(400).duration(500)}
              style={styles.formContainer}
            >
              {/* Email Field */}
              <View style={styles.fieldContainer}>
                <Text 
                  style={[
                    styles.fieldLabel,
                    { 
                      color: isDark ? "#ffffff" : "#1f2937",
                      textAlign: isRTL ? "right" : "left",
                    }
                  ]}
                >
                  {t.auth.forgotPassword.email}
                </Text>
                
                <View 
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: isDark ? "#193324" : "#ffffff",
                      borderColor: error 
                        ? "#ef4444" 
                        : isFocused 
                          ? colors.light.primary 
                          : isDark ? "#326747" : "#e5e7eb",
                      shadowColor: isFocused ? colors.light.primary : "transparent",
                      shadowOpacity: isFocused ? 0.2 : 0,
                    }
                  ]}
                >
                  <MaterialIcons
                    name="mail"
                    size={22}
                    color={isFocused ? colors.light.primary : isDark ? "#6b7280" : "#9ca3af"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: isDark ? "#ffffff" : "#1f2937",
                        textAlign: isRTL ? "right" : "left",
                      }
                    ]}
                    placeholder={t.auth.forgotPassword.emailPlaceholder}
                    placeholderTextColor={isDark ? "#92c9a8" : "#9ca3af"}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (error) setError("");
                    }}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    accessibilityLabel="Adresse email"
                    accessibilityHint="Entrez l'adresse email associée à votre compte"
                  />
                </View>

                {error ? (
                  <Animated.View entering={FadeIn.duration(200)} style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={14} color="#ef4444" />
                    <Text style={styles.errorText}>{error}</Text>
                  </Animated.View>
                ) : null}
              </View>

              {/* Submit Button */}
              <Animated.View style={[styles.buttonContainer, animatedButtonStyle]}>
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={isLoading}
                  activeOpacity={0.9}
                  accessibilityRole="button"
                  accessibilityLabel="Envoyer le lien de réinitialisation"
                  accessibilityHint="Double-tapez pour envoyer un email de réinitialisation"
                  accessibilityState={{ disabled: isLoading }}
                  style={[
                    styles.submitButton,
                    isLoading && styles.submitButtonDisabled
                  ]}
                >
                  <LinearGradient
                    colors={[colors.light.primary, "#10d65f"]}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {isLoading ? (
                      <View style={styles.loadingDots}>
                        <View style={[styles.dot, styles.dot1]} />
                        <View style={[styles.dot, styles.dot2]} />
                        <View style={[styles.dot, styles.dot3]} />
                      </View>
                    ) : (
                      <Text style={styles.submitButtonText}>
                        {t.auth.forgotPassword.submit}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>

            {/* Footer Links */}
            <Animated.View
              entering={FadeIn.delay(500).duration(500)}
              style={styles.footerLinks}
            >
              <TouchableOpacity
                onPress={() => router.push("/(auth)/login")}
                style={[styles.footerLinkContainer, { flexDirection: isRTL ? "row-reverse" : "row" }]}
                accessibilityRole="link"
                accessibilityLabel="Retour à la connexion"
                accessibilityHint="Double-tapez pour revenir à la page de connexion"
              >
                <Text 
                  style={[
                    styles.footerText,
                    { color: isDark ? "#9ca3af" : "#6b7280" }
                  ]}
                >
                  {t.auth.forgotPassword.rememberPassword}
                </Text>
                <Text style={styles.footerLink}>
                  {t.auth.forgotPassword.loginLink}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 256,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingTop: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerSpacer: {
    flex: 1,
  },
  headerIcon: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  headlineContainer: {
    marginBottom: 16,
    paddingTop: 16,
  },
  headline: {
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  bodyTextContainer: {
    marginBottom: 32,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
  },
  formContainer: {
    gap: 24,
  },
  fieldContainer: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  errorText: {
    fontSize: 13,
    color: "#ef4444",
  },
  buttonContainer: {
    marginTop: 8,
  },
  submitButton: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#13ec6a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  submitButtonDisabled: {
    opacity: 0.8,
  },
  buttonGradient: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#102217",
    letterSpacing: 0.5,
  },
  loadingDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#102217",
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.7,
  },
  dot3: {
    opacity: 1,
  },
  footerLinks: {
    alignItems: "center",
    marginTop: 32,
  },
  footerLinkContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: "600",
    color: "#13ec6a",
  },
});
