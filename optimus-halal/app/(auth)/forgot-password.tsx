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
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  StyleSheet,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useHaptics, useTheme, useTranslation } from "@/hooks";
import { ImpactFeedbackStyle, NotificationFeedbackType } from "expo-haptics";
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
import { PremiumBackground } from "@/components/ui";
import { PressableScale } from "@/components/ui/PressableScale";
import { brand } from "@/theme/colors";

const logoSource = require("@assets/images/logo_naqiy.webp");

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { impact, notification } = useHaptics();
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
      notification(NotificationFeedbackType.Error);
      return;
    }

    if (!validateEmail(email)) {
      setError(t.auth.forgotPassword.errors.emailInvalid);
      notification(NotificationFeedbackType.Error);
      return;
    }

    setError("");
    setIsLoading(true);
    
    buttonScale.value = withSequence(
      withSpring(0.95, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
    
    impact(ImpactFeedbackStyle.Medium);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Navigate to confirmation screen with masked email
      router.push({
        pathname: "/(auth)/reset-confirmation",
        params: { email: maskEmail(email) },
      });
    } catch (_error) {
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
    impact();
    router.back();
  }, []);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <View style={styles.container}>
      <PremiumBackground />

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
            <PressableScale
              onPress={handleGoBack}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel={t.common.back}
            >
              <MaterialIcons
                name="arrow-back-ios-new"
                size={24}
                color={brand.primary}
              />
            </PressableScale>
            
            <View style={styles.headerSpacer} />
            
            {/* Brand logo */}
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: colors.card,
                alignItems: "center",
                justifyContent: "center",
              }}
              accessible={false}
            >
              <Image
                source={logoSource}
                style={{ width: 26, height: 26 }}
                contentFit="contain"
                cachePolicy="memory-disk"
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
                          ? brand.primary 
                          : isDark ? "#326747" : "#e5e7eb",
                      shadowColor: isFocused ? brand.primary : "transparent",
                      shadowOpacity: isFocused ? 0.2 : 0,
                    }
                  ]}
                >
                  <MaterialIcons
                    name="mail"
                    size={22}
                    color={isFocused ? brand.primary : isDark ? "#6b7280" : "#9ca3af"}
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
                    accessibilityLabel={t.auth.forgotPassword.email}
                    accessibilityHint={t.auth.forgotPassword.subtitle}
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
                <PressableScale
                  onPress={handleSubmit}
                  disabled={isLoading}
                  accessibilityRole="button"
                  accessibilityLabel={t.auth.forgotPassword.submit}
                  style={[
                    styles.submitButton,
                    { shadowColor: colors.primary },
                    isLoading && styles.submitButtonDisabled
                  ]}
                >
                  <LinearGradient
                    colors={[brand.primary, "#10d65f"]}
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
                </PressableScale>
              </Animated.View>
            </Animated.View>

            {/* Footer Links */}
            <Animated.View
              entering={FadeIn.delay(500).duration(500)}
              style={styles.footerLinks}
            >
              <PressableScale
                onPress={() => router.push("/(auth)/login")}
                style={[styles.footerLinkContainer, { flexDirection: isRTL ? "row-reverse" : "row" }]}
                accessibilityRole="link"
                accessibilityLabel={t.auth.resetConfirmation.backToLogin}
              >
                <Text
                  style={[
                    styles.footerText,
                    { color: isDark ? "#9ca3af" : "#6b7280" }
                  ]}
                >
                  {t.auth.forgotPassword.rememberPassword}
                </Text>
                <Text style={[styles.footerLink, { color: colors.primary }]}>
                  {t.auth.forgotPassword.loginLink}
                </Text>
              </PressableScale>
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
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  headerSpacer: {
    flex: 1,
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
  },
});
