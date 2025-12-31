/**
 * Appearance Settings Screen
 * 
 * Gestion du thème (Automatique, Clair, Sombre)
 */

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { useTheme, type ThemeMode } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";

const THEME_OPTIONS: { id: ThemeMode; labelKey: string; icon: keyof typeof MaterialIcons.glyphMap; description: string }[] = [
  {
    id: "system",
    labelKey: "Automatique",
    icon: "brightness-auto",
    description: "Suit les paramètres de votre appareil",
  },
  {
    id: "light",
    labelKey: "Mode Clair",
    icon: "light-mode",
    description: "Thème lumineux pour la journée",
  },
  {
    id: "dark",
    labelKey: "Mode Sombre",
    icon: "dark-mode",
    description: "Thème sombre pour économiser la batterie",
  },
];

export default function AppearanceScreen() {
  const { t } = useTranslation();
  const { theme, setTheme, effectiveTheme, colors, isDark } = useTheme();

  const handleSelectTheme = async (themeOption: ThemeMode) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTheme(themeOption);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        className="px-5 pt-4 pb-4"
      >
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }}
          >
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={{ color: colors.textPrimary }} className="text-xl font-bold tracking-tight">
            Apparence
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
          style={{ backgroundColor: colors.card, borderColor: colors.borderLight, borderWidth: 1 }}
        >
          <View 
            className="w-20 h-20 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: colors.primaryLight }}
          >
            <MaterialIcons 
              name={effectiveTheme === "dark" ? "dark-mode" : "light-mode"} 
              size={40} 
              color={colors.primary} 
            />
          </View>
          <Text style={{ color: colors.textPrimary }} className="text-lg font-bold mb-1">
            {effectiveTheme === "dark" ? "Mode Sombre" : "Mode Clair"}
          </Text>
          <Text style={{ color: colors.textSecondary }} className="text-sm text-center">
            {theme === "system" ? "Suit les paramètres système" : `Mode ${effectiveTheme === "dark" ? "sombre" : "clair"} activé`}
          </Text>
        </Animated.View>

        {/* Theme Options */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: colors.card, borderColor: colors.borderLight, borderWidth: 1 }}
        >
          {THEME_OPTIONS.map((option, index) => {
            const isSelected = theme === option.id;
            const isLast = index === THEME_OPTIONS.length - 1;

            return (
              <TouchableOpacity
                key={option.id}
                onPress={() => handleSelectTheme(option.id)}
                className={`flex-row items-center p-4 ${!isLast ? "border-b" : ""}`}
                style={{ borderColor: colors.borderLight }}
                activeOpacity={0.7}
              >
                {/* Icon */}
                <View 
                  className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                  style={{ 
                    backgroundColor: isSelected ? colors.primaryLight : colors.buttonSecondary,
                  }}
                >
                  <MaterialIcons 
                    name={option.icon} 
                    size={24} 
                    color={isSelected ? colors.primary : colors.textSecondary} 
                  />
                </View>

                {/* Text Content */}
                <View className="flex-1">
                  <Text 
                    className="font-semibold text-base mb-0.5"
                    style={{ color: isSelected ? colors.primary : colors.textPrimary }}
                  >
                    {option.labelKey}
                  </Text>
                  <Text 
                    className="text-xs"
                    style={{ color: colors.textSecondary }}
                  >
                    {option.description}
                  </Text>
                </View>

                {/* Selection Indicator */}
                <View 
                  className="w-6 h-6 rounded-full items-center justify-center border-2"
                  style={{ 
                    borderColor: isSelected ? colors.primary : colors.borderLight,
                    backgroundColor: isSelected ? colors.primary : "transparent",
                  }}
                >
                  {isSelected && (
                    <MaterialIcons name="check" size={16} color="#ffffff" />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {/* Info Card */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(400)}
          className="mt-6 rounded-2xl p-4"
          style={{ backgroundColor: colors.primaryLight }}
        >
          <View className="flex-row items-start gap-3">
            <MaterialIcons name="info-outline" size={20} color={colors.primary} />
            <View className="flex-1">
              <Text style={{ color: colors.primary }} className="text-sm font-medium mb-1">
                Mode Automatique
              </Text>
              <Text style={{ color: colors.textSecondary }} className="text-xs leading-5">
                Le mode automatique utilise les paramètres de votre appareil pour 
                basculer automatiquement entre le mode clair et sombre.
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
