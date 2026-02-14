/**
 * Set New Password Screen
 * 
 * Ultra Premium design fidèle au template
 * Écran pour définir un nouveau mot de passe
 * 
 * Supports: French, English, Arabic (RTL)
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  useColorScheme,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useHaptics } from "@/hooks";
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

import { colors } from "@/constants/theme";
import { useTranslation } from "@/hooks/useTranslation";

type PasswordStrength = "weak" | "medium" | "strong" | "very-strong";

interface PasswordStrengthResult {
  strength: PasswordStrength;
  score: number;
  label: string;
  color: string;
}

export default function SetNewPasswordScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { impact, notification } = useHaptics();
  const isDark = colorScheme === "dark";
  const { token } = useLocalSearchParams<{ token: string }>();
  const { t, isRTL } = useTranslation();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<"new" | "confirm" | null>(null);

  const buttonScale = useSharedValue(1);

  const getPasswordStrength = useCallback((password: string): PasswordStrengthResult => {
    let score = 0;
    
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 2) {
      return { strength: "weak", score: 1, label: t.auth.setNewPassword.strength.weak, color: "#ef4444" };
    } else if (score <= 3) {
      return { strength: "medium", score: 2, label: t.auth.setNewPassword.strength.medium, color: "#f59e0b" };
    } else if (score <= 5) {
      return { strength: "strong", score: 3, label: t.auth.setNewPassword.strength.strong, color: "#22c55e" };
    } else {
      return { strength: "very-strong", score: 4, label: t.auth.setNewPassword.strength.veryStrong, color: "#13ec6a" };
    }
  }, [t]);

  const passwordStrength = useMemo(() => {
    return getPasswordStrength(newPassword);
  }, [newPassword, getPasswordStrength]);

  const passwordsMatch = useMemo(() => {
    return newPassword && confirmPassword && newPassword === confirmPassword;
  }, [newPassword, confirmPassword]);

  const isFormValid = useMemo(() => {
    return (
      newPassword.length >= 8 &&
      confirmPassword.length >= 8 &&
      newPassword === confirmPassword
    );
  }, [newPassword, confirmPassword]);

  const handleGoBack = useCallback(async () => {
    impact();
    router.back();
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!isFormValid) {
      notification(NotificationFeedbackType.Error);
      return;
    }

    setIsLoading(true);
    buttonScale.value = withSequence(
      withSpring(0.95, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
    impact(ImpactFeedbackStyle.Medium);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      notification();
      
      // Show success and navigate to login
      Alert.alert(
        t.auth.setNewPassword.success.title,
        t.auth.setNewPassword.success.message,
        [
          {
            text: t.auth.setNewPassword.success.loginButton,
            onPress: () => router.replace("/(auth)/login"),
          },
        ]
      );
    } catch (error) {
      Alert.alert(t.errors.generic, t.auth.forgotPassword.errors.sendFailed);
    } finally {
      setIsLoading(false);
    }
  }, [isFormValid]);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const renderStrengthBars = () => {
    const bars = [];
    for (let i = 0; i < 4; i++) {
      const isActive = i < passwordStrength.score;
      bars.push(
        <View
          key={i}
          style={[
            styles.strengthBar,
            {
              backgroundColor: isActive
                ? passwordStrength.color
                : isDark
                  ? "rgba(255,255,255,0.1)"
                  : "#e5e7eb",
            },
          ]}
        />
      );
    }
    return bars;
  };

  return (
    <View 
      style={[
        styles.container, 
        { backgroundColor: isDark ? "#102217" : "#f6f8f7" }
      ]}
    >
      {/* Background decoration */}
      <View style={styles.backgroundDecoration} pointerEvents="none">
        <LinearGradient
          colors={isDark 
            ? ["rgba(19, 236, 106, 0.08)", "transparent"]
            : ["rgba(19, 236, 106, 0.05)", "transparent"]
          }
          style={styles.backgroundGradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.4 }}
        />
      </View>

      {/* Header */}
      <Animated.View 
        entering={FadeIn.delay(100).duration(400)}
        style={[
          styles.header, 
          { 
            paddingTop: insets.top + 16,
            backgroundColor: isDark 
              ? "rgba(16, 34, 23, 0.95)" 
              : "rgba(246, 248, 247, 0.95)",
          }
        ]}
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
          accessibilityRole="header"
        >
          {t.auth.setNewPassword.title}
        </Text>
        
        <View style={styles.headerSpacer} />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 24 }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Instructional Text */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(500)}
            style={styles.instructionContainer}
          >
            <Text 
              style={[
                styles.instructionText,
                { 
                  color: isDark ? "#d1d5db" : "#6b7280",
                  textAlign: isRTL ? "right" : "left",
                }
              ]}
            >
              {t.auth.setNewPassword.subtitle}
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View
            entering={FadeInUp.delay(300).duration(500)}
            style={styles.formContainer}
          >
            {/* New Password Field */}
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
                {t.auth.setNewPassword.newPassword}
              </Text>
              
              <View 
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: isDark ? "#193324" : "#ffffff",
                    borderColor: focusedField === "new" 
                      ? colors.light.primary 
                      : isDark ? "#326747" : "#e5e7eb",
                  }
                ]}
              >
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: isDark ? "#ffffff" : "#1f2937",
                      textAlign: isRTL ? "right" : "left",
                    }
                  ]}
                  placeholder={t.auth.setNewPassword.newPasswordPlaceholder}
                  placeholderTextColor={isDark ? "rgba(146, 201, 168, 0.6)" : "#9ca3af"}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  onFocus={() => setFocusedField("new")}
                  onBlur={() => setFocusedField(null)}
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="Nouveau mot de passe"
                  accessibilityHint="Entrez votre nouveau mot de passe"
                />
                <TouchableOpacity
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  style={styles.toggleButton}
                  accessibilityRole="button"
                  accessibilityLabel={showNewPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  <MaterialIcons
                    name={showNewPassword ? "visibility" : "visibility-off"}
                    size={24}
                    color={isDark ? "#92c9a8" : "#9ca3af"}
                  />
                </TouchableOpacity>
              </View>

              {/* Password Strength Indicator */}
              {newPassword.length > 0 && (
                <Animated.View 
                  entering={FadeIn.duration(200)}
                  style={styles.strengthContainer}
                >
                  <View style={styles.strengthBars}>
                    {renderStrengthBars()}
                  </View>
                  <View style={styles.strengthLabelContainer}>
                    <Text 
                      style={[
                        styles.strengthLabel,
                        { color: passwordStrength.color }
                      ]}
                    >
                      {passwordStrength.label}
                    </Text>
                  </View>
                </Animated.View>
              )}
            </View>

            {/* Confirm Password Field */}
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
                {t.auth.setNewPassword.confirmPassword}
              </Text>
              
              <View 
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: isDark ? "#193324" : "#ffffff",
                    borderColor: confirmPassword && !passwordsMatch 
                      ? "#ef4444"
                      : focusedField === "confirm" 
                        ? colors.light.primary 
                        : isDark ? "#326747" : "#e5e7eb",
                  }
                ]}
              >
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: isDark ? "#ffffff" : "#1f2937",
                      textAlign: isRTL ? "right" : "left",
                    }
                  ]}
                  placeholder={t.auth.setNewPassword.confirmPasswordPlaceholder}
                  placeholderTextColor={isDark ? "rgba(146, 201, 168, 0.6)" : "#9ca3af"}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => setFocusedField("confirm")}
                  onBlur={() => setFocusedField(null)}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="Confirmer le mot de passe"
                  accessibilityHint="Entrez à nouveau votre nouveau mot de passe"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.toggleButton}
                  accessibilityRole="button"
                  accessibilityLabel={showConfirmPassword ? "Masquer la confirmation" : "Afficher la confirmation"}
                >
                  <MaterialIcons
                    name={showConfirmPassword ? "visibility" : "visibility-off"}
                    size={24}
                    color={isDark ? "#92c9a8" : "#9ca3af"}
                  />
                </TouchableOpacity>
              </View>

              {/* Passwords match indicator */}
              {confirmPassword.length > 0 && (
                <Animated.View entering={FadeIn.duration(200)} style={styles.matchIndicator}>
                  <MaterialIcons
                    name={passwordsMatch ? "check-circle" : "error-outline"}
                    size={16}
                    color={passwordsMatch ? "#22c55e" : "#ef4444"}
                  />
                  <Text 
                    style={[
                      styles.matchText,
                      { color: passwordsMatch ? "#22c55e" : "#ef4444" }
                    ]}
                  >
                    {passwordsMatch ? t.auth.setNewPassword.passwordsMatch : t.auth.setNewPassword.passwordsNotMatch}
                  </Text>
                </Animated.View>
              )}
            </View>

            {/* Helper Info Box */}
            <Animated.View
              entering={FadeIn.delay(400).duration(400)}
              style={[
                styles.infoBox,
                {
                  backgroundColor: isDark 
                    ? "rgba(19, 236, 106, 0.1)" 
                    : "rgba(19, 236, 106, 0.05)",
                  borderColor: isDark 
                    ? "rgba(19, 236, 106, 0.05)" 
                    : "rgba(19, 236, 106, 0.1)",
                }
              ]}
            >
              <MaterialIcons
                name="info"
                size={20}
                color={colors.light.primary}
                style={styles.infoIcon}
              />
              <Text 
                style={[
                  styles.infoText,
                  { 
                    color: isDark ? "#92c9a8" : "#6b7280",
                    textAlign: isRTL ? "right" : "left",
                  }
                ]}
              >
                {t.auth.setNewPassword.passwordHint}
              </Text>
            </Animated.View>

            {/* Spacer */}
            <View style={styles.spacer} />

            {/* Submit Button */}
            <Animated.View style={[styles.buttonContainer, animatedButtonStyle]}>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={!isFormValid || isLoading}
                activeOpacity={0.9}
                accessibilityRole="button"
                accessibilityLabel="Réinitialiser le mot de passe"
                accessibilityHint="Double-tapez pour enregistrer votre nouveau mot de passe"
                accessibilityState={{ disabled: !isFormValid || isLoading }}
                style={[
                  styles.submitButton,
                  (!isFormValid || isLoading) && styles.submitButtonDisabled
                ]}
              >
                <LinearGradient
                  colors={isFormValid 
                    ? [colors.light.primary, "#0fd660"]
                    : ["#6b7280", "#4b5563"]
                  }
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {isLoading ? (
                    <View style={styles.loadingDots}>
                      <View style={[styles.dot, { backgroundColor: "#102217" }]} />
                      <View style={[styles.dot, { backgroundColor: "#102217", opacity: 0.7 }]} />
                      <View style={[styles.dot, { backgroundColor: "#102217", opacity: 0.4 }]} />
                    </View>
                  ) : (
                    <Text 
                      style={[
                        styles.submitButtonText,
                        { color: isFormValid ? "#102217" : "#ffffff" }
                      ]}
                    >
                      {t.auth.setNewPassword.submit}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundDecoration: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  backgroundGradient: {
    width: "100%",
    height: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  instructionContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  instructionText: {
    fontSize: 16,
    lineHeight: 24,
  },
  formContainer: {
    gap: 20,
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
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  toggleButton: {
    padding: 8,
    marginRight: -8,
  },
  strengthContainer: {
    marginTop: 12,
  },
  strengthBars: {
    flexDirection: "row",
    gap: 6,
    height: 6,
  },
  strengthBar: {
    flex: 1,
    borderRadius: 3,
  },
  strengthLabelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  matchIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  matchText: {
    fontSize: 13,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  infoIcon: {
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  spacer: {
    flex: 1,
    minHeight: 32,
  },
  buttonContainer: {
    marginBottom: 24,
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
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonGradient: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
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
  },
});
