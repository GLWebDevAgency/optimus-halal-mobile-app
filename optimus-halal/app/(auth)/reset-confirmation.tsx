/**
 * Reset Confirmation Screen
 * 
 * Ultra Premium design fidèle au template
 * Écran de confirmation d'envoi de l'email de réinitialisation
 * 
 * Supports: French, English, Arabic (RTL)
 */

import React, { useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  useColorScheme,
  StyleSheet,
  Linking,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { colors } from "@/constants/theme";
import { useTranslation } from "@/hooks/useTranslation";

export default function ResetConfirmationScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { email } = useLocalSearchParams<{ email: string }>();
  const { t, isRTL } = useTranslation();

  // Animation values
  const iconScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);
  const checkScale = useSharedValue(0);

  useEffect(() => {
    // Entrance animation for check mark
    checkScale.value = withSpring(1, { damping: 10, stiffness: 150 });

    // Continuous glow pulsing
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Subtle icon breathing
    iconScale.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: interpolate(glowOpacity.value, [0.3, 0.6], [1.1, 1.2]) }],
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const animatedCheckStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const handleGoBack = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, []);

  const handleBackToLogin = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace("/(auth)/login");
  }, []);

  const handleOpenEmailApp = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (Platform.OS === "ios") {
      Linking.openURL("message://");
    } else {
      Linking.openURL("mailto:");
    }
  }, []);

  const handleResendLink = useCallback(async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Simulate resend - in real app, call API
  }, []);

  const handleContactSupport = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL("mailto:support@optimushalal.com");
  }, []);

  return (
    <View 
      style={[
        styles.container, 
        { backgroundColor: isDark ? "#102217" : "#f6f8f7" }
      ]}
    >
      {/* Header */}
      <Animated.View 
        entering={FadeIn.delay(100).duration(400)}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <TouchableOpacity
          onPress={handleGoBack}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <MaterialIcons 
            name="arrow-back" 
            size={24} 
            color={isDark ? "#ffffff" : "#1f2937"} 
          />
        </TouchableOpacity>
        
        <Text 
          style={[
            styles.headerTitle,
            { 
              color: isDark ? "#ffffff" : "#1f2937",
              textAlign: isRTL ? "right" : "center",
            }
          ]}
        >
          {t.auth.resetConfirmation.title}
        </Text>
        
        <View style={styles.headerSpacer} />
      </Animated.View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Success Illustration */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(600)}
          style={styles.illustrationContainer}
        >
          {/* Outer glow effect */}
          <Animated.View style={[styles.glowEffect, animatedGlowStyle]}>
            <LinearGradient
              colors={[`${colors.light.primary}30`, "transparent"]}
              style={styles.glowGradient}
            />
          </Animated.View>

          {/* Icon container */}
          <Animated.View 
            style={[
              styles.iconContainer,
              animatedIconStyle,
              {
                backgroundColor: isDark ? "#1f2937" : "#ffffff",
                borderColor: isDark ? "#374151" : "#e5e7eb",
              }
            ]}
          >
            <MaterialIcons
              name="mark-email-read"
              size={48}
              color={colors.light.primary}
            />
          </Animated.View>

          {/* Decorative check badge */}
          <Animated.View 
            style={[
              styles.checkBadge,
              animatedCheckStyle,
              { borderColor: isDark ? "#102217" : "#ffffff" }
            ]}
          >
            <MaterialIcons name="check" size={12} color="#102217" />
          </Animated.View>
        </Animated.View>

        {/* Headline */}
        <Animated.Text
          entering={FadeInDown.delay(300).duration(500)}
          style={[
            styles.headline,
            { 
              color: isDark ? "#ffffff" : "#1f2937",
              textAlign: isRTL ? "right" : "center",
            }
          ]}
        >
          {t.auth.resetConfirmation.headline}
        </Animated.Text>

        {/* Body Text */}
        <Animated.Text
          entering={FadeInDown.delay(400).duration(500)}
          style={[
            styles.bodyText,
            { 
              color: isDark ? "#9ca3af" : "#6b7280",
              textAlign: isRTL ? "right" : "center",
            }
          ]}
        >
          {t.auth.resetConfirmation.message}{" "}
          <Text style={{ color: isDark ? "#ffffff" : "#1f2937", fontWeight: "500" }}>
            {email || "votre adresse email"}
          </Text>
          {t.auth.resetConfirmation.messageSuffix}
        </Animated.Text>

        {/* Spacing */}
        <View style={styles.spacer} />

        {/* Primary Actions */}
        <Animated.View
          entering={FadeInUp.delay(500).duration(500)}
          style={styles.actionsContainer}
        >
          {/* Back to Login Button */}
          <TouchableOpacity
            onPress={handleBackToLogin}
            activeOpacity={0.9}
            style={styles.primaryButton}
          >
            <LinearGradient
              colors={[colors.light.primary, "#10d65f"]}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.primaryButtonText}>
                {t.auth.resetConfirmation.backToLogin}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Open Email App Button */}
          <TouchableOpacity
            onPress={handleOpenEmailApp}
            activeOpacity={0.7}
            style={[
              styles.secondaryButton,
              {
                borderColor: isDark ? "#374151" : "#e5e7eb",
              }
            ]}
          >
            <Text 
              style={[
                styles.secondaryButtonText,
                { color: isDark ? "#ffffff" : "#1f2937" }
              ]}
            >
              {t.auth.resetConfirmation.openEmailApp}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Resend Link */}
        <Animated.View
          entering={FadeIn.delay(600).duration(500)}
          style={styles.resendContainer}
        >
          <Text 
            style={[
              styles.resendText,
              { color: isDark ? "#9ca3af" : "#6b7280" }
            ]}
          >
            {t.auth.resetConfirmation.noEmail}
          </Text>
          <TouchableOpacity onPress={handleResendLink}>
            <Text style={styles.resendLink}>
              {t.auth.resetConfirmation.resendLink}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Footer Help */}
      <Animated.View
        entering={FadeIn.delay(700).duration(400)}
        style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}
      >
        <TouchableOpacity
          onPress={handleContactSupport}
          style={[styles.supportButton, { flexDirection: isRTL ? "row-reverse" : "row" }]}
        >
          <MaterialIcons 
            name="help" 
            size={18} 
            color={isDark ? "#6b7280" : "#9ca3af"} 
          />
          <Text 
            style={[
              styles.supportText,
              { color: isDark ? "#6b7280" : "#9ca3af" }
            ]}
          >
            {t.auth.resetConfirmation.contactSupport}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.3,
    paddingRight: 48,
  },
  headerSpacer: {
    width: 48,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    marginTop: -40,
  },
  illustrationContainer: {
    position: "relative",
    marginBottom: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  glowEffect: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  glowGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 70,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  checkBadge: {
    position: "absolute",
    top: 0,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#13ec6a",
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  headline: {
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    maxWidth: 300,
  },
  spacer: {
    height: 48,
  },
  actionsContainer: {
    width: "100%",
    maxWidth: 340,
    gap: 16,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#13ec6a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonGradient: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#102217",
    letterSpacing: 0.3,
  },
  secondaryButton: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  resendContainer: {
    marginTop: 32,
    alignItems: "center",
    gap: 4,
  },
  resendText: {
    fontSize: 14,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: "700",
    color: "#13ec6a",
    marginTop: 4,
  },
  footer: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  supportButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
  },
  supportText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
