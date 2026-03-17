/**
 * Password Changed Success Screen
 *
 * Premium celebration screen after successful password reset.
 * Auto-redirects to login after 5 seconds.
 * Uses springNaqiy animation signature.
 *
 * Supports: French, English, Arabic (RTL)
 */

import React, { useEffect, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CheckCircleIcon, ShieldCheckIcon } from "phosphor-react-native";
import { useHaptics, useTheme, useTranslation } from "@/hooks";
import { NotificationFeedbackType } from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { PressableScale } from "@/components/ui/PressableScale";
import { brand } from "@/theme/colors";

// springNaqiy signature
const SPRING_NAQIY = { damping: 14, stiffness: 170, mass: 0.9 };

export default function PasswordChangedScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { notification } = useHaptics();
  const { t, isRTL } = useTranslation();

  // Animations
  const checkScale = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const ringProgress = useSharedValue(0);

  useEffect(() => {
    // Success haptic
    notification(NotificationFeedbackType.Success);

    // Check icon entrance with springNaqiy
    checkScale.value = withDelay(200, withSpring(1, SPRING_NAQIY));

    // Ring fill animation
    ringProgress.value = withDelay(
      400,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) })
    );

    // Glow pulse
    glowOpacity.value = withDelay(
      600,
      withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.2, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );

    // Auto-redirect to login after 5 seconds
    const timer = setTimeout(() => {
      router.replace("/(auth)/login");
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const animatedCheckStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [
      { scale: interpolate(glowOpacity.value, [0.2, 0.6], [1.0, 1.15]) },
    ],
  }));

  const handleGoToLogin = useCallback(() => {
    router.replace("/(auth)/login");
  }, []);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#102217" : "#f6f8f7" },
      ]}
    >
      {/* Background */}
      <View style={styles.backgroundDecoration} pointerEvents="none">
        <LinearGradient
          colors={
            isDark
              ? ["rgba(19, 236, 106, 0.12)", "rgba(19, 236, 106, 0.02)", "transparent"]
              : ["rgba(19, 236, 106, 0.08)", "rgba(19, 236, 106, 0.02)", "transparent"]
          }
          style={styles.backgroundGradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.5 }}
        />
      </View>

      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + 80,
            paddingBottom: insets.bottom + 40,
          },
        ]}
      >
        {/* Success Illustration */}
        <Animated.View style={[styles.illustrationContainer, animatedCheckStyle]}>
          {/* Glow ring */}
          <Animated.View style={[styles.glowRing, animatedGlowStyle]}>
            <LinearGradient
              colors={[`${brand.primary}40`, "transparent"]}
              style={styles.glowGradient}
            />
          </Animated.View>

          {/* Icon circle */}
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: isDark ? "#193324" : "#ffffff",
                borderColor: brand.primary,
                shadowColor: brand.primary,
              },
            ]}
          >
            <CheckCircleIcon
              size={56}
              color={brand.primary}
              weight="fill"
            />
          </View>
        </Animated.View>

        {/* Headline */}
        <Animated.Text
          entering={FadeInDown.delay(500).duration(500).springify().damping(14).stiffness(170).mass(0.9)}
          style={[
            styles.headline,
            {
              color: isDark ? "#ffffff" : "#1f2937",
              textAlign: "center",
            },
          ]}
          accessibilityRole="header"
        >
          {t.auth.passwordChanged.title}
        </Animated.Text>

        {/* Body */}
        <Animated.Text
          entering={FadeInDown.delay(650).duration(500)}
          style={[
            styles.bodyText,
            {
              color: isDark ? "#9ca3af" : "#6b7280",
              textAlign: "center",
            },
          ]}
        >
          {t.auth.passwordChanged.message}
        </Animated.Text>

        {/* Security badge */}
        <Animated.View
          entering={FadeIn.delay(800).duration(400)}
          style={[
            styles.securityBadge,
            {
              backgroundColor: isDark
                ? "rgba(19, 236, 106, 0.08)"
                : "rgba(19, 236, 106, 0.06)",
              borderColor: isDark
                ? "rgba(19, 236, 106, 0.12)"
                : "rgba(19, 236, 106, 0.1)",
            },
          ]}
        >
          <ShieldCheckIcon size={18} color={brand.primary} />
          <Text
            style={[
              styles.securityText,
              { color: isDark ? "#92c9a8" : "#6b7280" },
            ]}
          >
            {t.auth.passwordChanged.securityNote}
          </Text>
        </Animated.View>

        <View style={styles.spacer} />

        {/* CTA Button */}
        <Animated.View
          entering={FadeInUp.delay(900).duration(500)}
          style={styles.buttonContainer}
        >
          <View
            style={[styles.buttonShadow, { shadowColor: colors.primary }]}
          >
            <PressableScale
              onPress={handleGoToLogin}
              style={styles.primaryButton}
              accessibilityRole="button"
              accessibilityLabel={t.auth.passwordChanged.loginButton}
            >
              <LinearGradient
                colors={[brand.primary, "#10d65f"]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.primaryButtonText}>
                  {t.auth.passwordChanged.loginButton}
                </Text>
              </LinearGradient>
            </PressableScale>
          </View>
        </Animated.View>

        {/* Auto-redirect hint */}
        <Animated.Text
          entering={FadeIn.delay(1100).duration(400)}
          style={[
            styles.redirectHint,
            { color: isDark ? "#6b7280" : "#9ca3af" },
          ]}
        >
          {t.auth.passwordChanged.autoRedirect}
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backgroundDecoration: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
  backgroundGradient: { width: "100%", height: "100%" },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 32,
  },
  illustrationContainer: {
    position: "relative",
    marginBottom: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  glowRing: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  glowGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 80,
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  headline: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 280,
    marginBottom: 24,
  },
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  securityText: {
    fontSize: 13,
    fontWeight: "500",
  },
  spacer: { flex: 1 },
  buttonContainer: {
    width: "100%",
    maxWidth: 340,
  },
  buttonShadow: {
    borderRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: "hidden" as const,
  },
  buttonGradient: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#102217",
    letterSpacing: 0.3,
  },
  redirectHint: {
    fontSize: 12,
    marginTop: 16,
    textAlign: "center",
  },
});
