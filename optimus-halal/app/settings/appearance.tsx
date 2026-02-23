/**
 * Appearance Settings Screen
 * 
 * Gestion du thème (Automatique, Clair, Sombre)
 */

import React from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
} from "react-native";
import { PressableScale } from "@/components/ui/PressableScale";
import { PremiumBackground } from "@/components/ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown, ZoomIn } from "react-native-reanimated";
import { useHaptics, useTranslation } from "@/hooks";

import { useTheme, type ThemeMode } from "@/hooks/useTheme";

const GOLD = "#d4af37";

const THEME_OPTIONS: { id: ThemeMode; labelKey: "automatic" | "light" | "dark"; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  {
    id: "system",
    labelKey: "automatic",
    icon: "brightness-auto",
  },
  {
    id: "light",
    labelKey: "light",
    icon: "light-mode",
  },
  {
    id: "dark",
    labelKey: "dark",
    icon: "dark-mode",
  },
];

export default function AppearanceScreen() {
  const { isDark, theme, setTheme, effectiveTheme, colors } = useTheme();
  const { t } = useTranslation();

  const { impact } = useHaptics();

  const themeLabels: Record<string, { label: string; desc: string }> = {
    automatic: { label: t.appearance.automatic, desc: t.appearance.automaticDesc },
    light: { label: t.appearance.light, desc: t.appearance.lightDesc },
    dark: { label: t.appearance.dark, desc: t.appearance.darkDesc },
  };
  const handleSelectTheme = async (themeOption: ThemeMode) => {
    impact();
    setTheme(themeOption);
  };

  return (
    <View style={{ flex: 1 }}>
      <PremiumBackground />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        className="px-5 pt-4 pb-4"
      >
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t.common.back}
            accessibilityHint={t.common.back}
            hitSlop={8}
          >
            <View
              className="h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }}
            >
              <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
            </View>
          </Pressable>
          <Text
            style={{ color: colors.textPrimary }}
            className="text-xl font-bold tracking-tight"
            accessibilityRole="header"
          >
            {t.appearance.title}
          </Text>
        </View>
      </Animated.View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Preview Card */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          className="rounded-2xl p-6 mb-6 items-center"
          style={{ backgroundColor: isDark ? "rgba(255,255,255,0.03)" : colors.card, borderColor: isDark ? "rgba(212,175,55,0.08)" : "rgba(212,175,55,0.1)", borderWidth: 1 }}
        >
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: colors.primaryLight }}
            accessible={false}
          >
            <MaterialIcons
              name={effectiveTheme === "dark" ? "dark-mode" : "light-mode"}
              size={40}
              color={colors.primary}
            />
          </View>
          <Text
            style={{ color: colors.textPrimary }}
            className="text-lg font-bold mb-1"
            accessibilityRole="header"
          >
            {effectiveTheme === "dark" ? t.appearance.darkMode : t.appearance.lightMode}
          </Text>
          <Text style={{ color: colors.textSecondary }} className="text-sm text-center">
            {theme === "system" ? t.appearance.automaticDesc : themeLabels[effectiveTheme === "dark" ? "dark" : "light"].desc}
          </Text>
        </Animated.View>

        {/* Theme Options */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: isDark ? "rgba(255,255,255,0.03)" : colors.card, borderColor: isDark ? "rgba(212,175,55,0.08)" : "rgba(212,175,55,0.1)", borderWidth: 1 }}
          accessibilityRole="radiogroup"
          accessibilityLabel={t.appearance.themeOptions}
        >
          {THEME_OPTIONS.map((option, index) => {
            const isSelected = theme === option.id;
            const isLast = index === THEME_OPTIONS.length - 1;

            return (
              <PressableScale
                key={option.id}
                onPress={() => handleSelectTheme(option.id)}
                accessibilityRole="radio"
                accessibilityLabel={themeLabels[option.labelKey].label}
                accessibilityHint={themeLabels[option.labelKey].desc}
                accessibilityState={{ selected: isSelected }}
              >
                <View
                  className={`flex-row items-center p-4 ${!isLast ? "border-b" : ""}`}
                  style={{ borderColor: isDark ? "rgba(212,175,55,0.06)" : "rgba(212,175,55,0.1)" }}
                >
                  {/* Icon */}
                  <View
                    className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                    style={{
                      backgroundColor: isSelected ? (isDark ? "rgba(212,175,55,0.15)" : "rgba(212,175,55,0.1)") : colors.buttonSecondary,
                    }}
                  >
                    <MaterialIcons
                      name={option.icon}
                      size={24}
                      color={isSelected ? GOLD : colors.textSecondary}
                    />
                  </View>

                  {/* Text Content */}
                  <View className="flex-1">
                    <Text
                      className="font-semibold text-base mb-0.5"
                      style={{ color: isSelected ? GOLD : colors.textPrimary }}
                    >
                      {themeLabels[option.labelKey].label}
                    </Text>
                    <Text
                      className="text-xs"
                      style={{ color: colors.textSecondary }}
                    >
                      {themeLabels[option.labelKey].desc}
                    </Text>
                  </View>

                  {/* Selection Indicator */}
                  <View
                    className="w-6 h-6 rounded-full items-center justify-center border-2"
                    style={{
                      borderColor: isSelected ? GOLD : colors.borderLight,
                      backgroundColor: isSelected ? GOLD : "transparent",
                      ...(isSelected ? { shadowColor: GOLD, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 4 } : {}),
                    }}
                  >
                    {isSelected && (
                      <Animated.View entering={ZoomIn.springify()}>
                        <MaterialIcons name="check" size={16} color="#ffffff" />
                      </Animated.View>
                    )}
                  </View>
                </View>
              </PressableScale>
            );
          })}
        </Animated.View>

        {/* Info Card */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(400)}
          className="mt-6 rounded-2xl p-4"
          style={{ backgroundColor: "rgba(212,175,55,0.08)", borderWidth: 1, borderColor: isDark ? "rgba(212,175,55,0.12)" : "rgba(212,175,55,0.15)" }}
        >
          <View className="flex-row items-start gap-3">
            <MaterialIcons name="info-outline" size={20} color={GOLD} />
            <View className="flex-1">
              <Text style={{ color: GOLD }} className="text-sm font-medium mb-1">
                {t.appearance.autoMode}
              </Text>
              <Text style={{ color: colors.textSecondary }} className="text-xs leading-5">
                {t.appearance.autoModeDesc}
              </Text>
            </View>
          </View>
        </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
