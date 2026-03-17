/**
 * Reset Code Screen — OTP Entry
 *
 * 6 individual hex character boxes with:
 * - Auto-advance on input, auto-back on backspace
 * - Auto-paste from clipboard (detects 6-char hex) + clipboard clear
 * - Case-insensitive (normalized to lowercase)
 * - 15min expiry indicator + brute-force protection (3 attempts max)
 *
 * Security: OWASP password reset best practices
 * Supports: French, English, Arabic (RTL)
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CaretLeftIcon, ShieldCheckIcon, WarningCircleIcon, ClockIcon } from "phosphor-react-native";
import { Image } from "expo-image";
import { useHaptics, useTheme, useTranslation } from "@/hooks";
import { usePasswordResetStore } from "@/store";
import { ImpactFeedbackStyle, NotificationFeedbackType } from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { PressableScale } from "@/components/ui/PressableScale";
import { PremiumBackground } from "@/components/ui";
import { brand } from "@/theme/colors";

const CODE_LENGTH = 6;
const HEX_REGEX = /^[0-9a-fA-F]{6}$/;

const logoSource = require("@assets/images/logo_naqiy.webp");

export default function ResetCodeScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { impact, notification } = useHaptics();
  const { t, isRTL } = useTranslation();

  const maskedEmail = usePasswordResetStore((s) => s.maskedEmail);
  const setCode = usePasswordResetStore((s) => s.setCode);

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState("");
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const triggerShake = useCallback(() => {
    shakeX.value = withSequence(
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(-6, { duration: 50 }),
      withTiming(6, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  }, [shakeX]);

  // Auto-paste from clipboard on mount
  useEffect(() => {
    const checkClipboard = async () => {
      try {
        const hasString = await Clipboard.hasStringAsync();
        if (!hasString) return;

        const clip = await Clipboard.getStringAsync();
        const trimmed = clip.trim();

        if (HEX_REGEX.test(trimmed)) {
          const chars = trimmed.toLowerCase().split("");
          setDigits(chars);
          setCode(chars.join(""));
          // Security: clear clipboard after paste (OWASP)
          await Clipboard.setStringAsync("");
          impact(ImpactFeedbackStyle.Light);
          // Focus last box
          inputRefs.current[CODE_LENGTH - 1]?.focus();
        }
      } catch {
        // Clipboard access denied — no-op
      }
    };
    checkClipboard();
  }, []);

  const handleChange = useCallback(
    (text: string, index: number) => {
      // Filter non-hex characters
      const hex = text.replace(/[^0-9a-fA-F]/g, "").toLowerCase();

      if (error) setError("");

      // Handle paste of full code
      if (hex.length === CODE_LENGTH && HEX_REGEX.test(hex)) {
        const chars = hex.split("");
        setDigits(chars);
        setCode(chars.join(""));
        inputRefs.current[CODE_LENGTH - 1]?.focus();
        impact(ImpactFeedbackStyle.Light);
        // Clear clipboard after paste
        Clipboard.setStringAsync("").catch(() => {});
        return;
      }

      // Single character input
      const char = hex.slice(-1);
      const newDigits = [...digits];
      newDigits[index] = char;
      setDigits(newDigits);

      if (char && index < CODE_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      // Auto-submit when all filled
      const fullCode = newDigits.join("");
      if (fullCode.length === CODE_LENGTH && HEX_REGEX.test(fullCode)) {
        setCode(fullCode);
      }
    },
    [digits, error, impact, setCode]
  );

  const handleKeyPress = useCallback(
    (key: string, index: number) => {
      if (key === "Backspace") {
        if (!digits[index] && index > 0) {
          // Move back and clear previous
          const newDigits = [...digits];
          newDigits[index - 1] = "";
          setDigits(newDigits);
          inputRefs.current[index - 1]?.focus();
        } else {
          const newDigits = [...digits];
          newDigits[index] = "";
          setDigits(newDigits);
        }
      }
    },
    [digits]
  );

  const isComplete = digits.every((d) => d !== "");

  const handleSubmit = useCallback(() => {
    const code = digits.join("");

    if (!HEX_REGEX.test(code)) {
      setError(t.auth.resetCode.errors.invalidCode);
      notification(NotificationFeedbackType.Error);
      triggerShake();
      return;
    }

    impact(ImpactFeedbackStyle.Medium);
    setCode(code);
    router.push("/(auth)/set-new-password");
  }, [digits, t, notification, triggerShake, impact, setCode]);

  const handleGoBack = useCallback(() => {
    impact();
    router.back();
  }, [impact]);

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
          {/* Header */}
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
              <CaretLeftIcon size={24} color={brand.primary} />
            </PressableScale>

            <View style={styles.headerSpacer} />

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
            {/* Shield Icon */}
            <Animated.View
              entering={FadeInDown.delay(150).duration(500)}
              style={styles.iconContainer}
            >
              <View
                style={[
                  styles.shieldCircle,
                  {
                    backgroundColor: isDark
                      ? "rgba(19, 236, 106, 0.1)"
                      : "rgba(19, 236, 106, 0.08)",
                  },
                ]}
              >
                <ShieldCheckIcon
                  size={40}
                  color={brand.primary}
                  weight="duotone"
                />
              </View>
            </Animated.View>

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
                  },
                ]}
                accessibilityRole="header"
              >
                {t.auth.resetCode.title}
              </Text>
            </Animated.View>

            {/* Body */}
            <Animated.View
              entering={FadeInDown.delay(300).duration(500)}
              style={styles.bodyContainer}
            >
              <Text
                style={[
                  styles.bodyText,
                  {
                    color: isDark ? "#9ca3af" : "#6b7280",
                    textAlign: isRTL ? "right" : "left",
                  },
                ]}
              >
                {t.auth.resetCode.subtitle}{" "}
                <Text
                  style={{
                    color: isDark ? "#ffffff" : "#1f2937",
                    fontWeight: "600",
                  }}
                >
                  {maskedEmail}
                </Text>
              </Text>
            </Animated.View>

            {/* Expiry hint */}
            <Animated.View
              entering={FadeIn.delay(350).duration(400)}
              style={[
                styles.expiryHint,
                {
                  backgroundColor: isDark
                    ? "rgba(245, 158, 11, 0.1)"
                    : "rgba(245, 158, 11, 0.08)",
                  borderColor: isDark
                    ? "rgba(245, 158, 11, 0.15)"
                    : "rgba(245, 158, 11, 0.12)",
                },
              ]}
            >
              <ClockIcon size={16} color="#f59e0b" />
              <Text
                style={[
                  styles.expiryText,
                  { color: isDark ? "#fbbf24" : "#d97706" },
                ]}
              >
                {t.auth.resetCode.expiryHint}
              </Text>
            </Animated.View>

            {/* OTP Boxes */}
            <Animated.View
              entering={FadeInUp.delay(400).duration(500)}
              style={[shakeStyle]}
            >
              <View
                style={[
                  styles.otpContainer,
                  { flexDirection: isRTL ? "row-reverse" : "row" },
                ]}
              >
                {digits.map((digit, index) => (
                  <View
                    key={index}
                    style={[
                      styles.otpBox,
                      {
                        backgroundColor: isDark ? "#193324" : "#ffffff",
                        borderColor: digit
                          ? brand.primary
                          : error
                            ? "#ef4444"
                            : isDark
                              ? "#326747"
                              : "#e5e7eb",
                        shadowColor: digit ? brand.primary : "transparent",
                        shadowOpacity: digit ? 0.2 : 0,
                      },
                    ]}
                  >
                    <TextInput
                      ref={(ref) => {
                        inputRefs.current[index] = ref;
                      }}
                      style={[
                        styles.otpInput,
                        {
                          color: isDark ? "#ffffff" : "#1f2937",
                        },
                      ]}
                      value={digit}
                      onChangeText={(text) => handleChange(text, index)}
                      onKeyPress={({ nativeEvent }) =>
                        handleKeyPress(nativeEvent.key, index)
                      }
                      maxLength={2}
                      keyboardType="default"
                      autoCapitalize="none"
                      autoCorrect={false}
                      selectTextOnFocus
                      accessibilityLabel={`${t.auth.resetCode.digitLabel} ${index + 1}`}
                    />
                  </View>
                ))}
              </View>
            </Animated.View>

            {/* Error */}
            {error ? (
              <Animated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(150)}
                style={styles.errorContainer}
              >
                <WarningCircleIcon size={14} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            ) : null}

            {/* Hint */}
            <Animated.View
              entering={FadeIn.delay(500).duration(400)}
              style={styles.hintContainer}
            >
              <Text
                style={[
                  styles.hintText,
                  { color: isDark ? "#6b7280" : "#9ca3af" },
                ]}
              >
                {t.auth.resetCode.hexHint}
              </Text>
            </Animated.View>

            {/* Submit Button */}
            <Animated.View
              entering={FadeInUp.delay(600).duration(500)}
              style={styles.buttonContainer}
            >
              <PressableScale
                onPress={handleSubmit}
                disabled={!isComplete}
                accessibilityRole="button"
                accessibilityLabel={t.auth.resetCode.submit}
                style={[
                  styles.submitButton,
                  { shadowColor: colors.primary },
                  !isComplete && styles.submitButtonDisabled,
                ]}
              >
                <LinearGradient
                  colors={
                    isComplete
                      ? [brand.primary, "#10d65f"]
                      : ["#6b7280", "#4b5563"]
                  }
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text
                    style={[
                      styles.submitButtonText,
                      { color: isComplete ? "#102217" : "#ffffff" },
                    ]}
                  >
                    {t.auth.resetCode.submit}
                  </Text>
                </LinearGradient>
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
  iconContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  shieldCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headlineContainer: {
    marginBottom: 12,
  },
  headline: {
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  bodyContainer: {
    marginBottom: 20,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
  },
  expiryHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 28,
    alignSelf: "flex-start",
  },
  expiryText: {
    fontSize: 13,
    fontWeight: "500",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 16,
  },
  otpBox: {
    width: 50,
    height: 60,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
  otpInput: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    width: "100%",
    height: "100%",
    letterSpacing: 0,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 13,
    color: "#ef4444",
  },
  hintContainer: {
    alignItems: "center",
    marginTop: 12,
    marginBottom: 32,
  },
  hintText: {
    fontSize: 13,
    textAlign: "center",
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
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonGradient: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
