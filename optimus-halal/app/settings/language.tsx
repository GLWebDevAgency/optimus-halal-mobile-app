/**
 * Language Selection Screen
 */

import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { PressableScale } from "@/components/ui/PressableScale";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useTranslation, type Language } from "@/hooks/useTranslation";
import { useTheme } from "@/hooks/useTheme";

const LANGUAGES: { code: Language; native: string; flag: string }[] = [
  { code: "fr", native: "Français", flag: "🇫🇷" },
  { code: "en", native: "English", flag: "🇬🇧" },
  { code: "ar", native: "العربية", flag: "🇸🇦" },
  { code: "tr", native: "Türkçe", flag: "🇹🇷" },
  { code: "it", native: "Italiano", flag: "🇮🇹" },
  { code: "de", native: "Deutsch", flag: "🇩🇪" },
  { code: "es", native: "Español", flag: "🇪🇸" },
  { code: "pt", native: "Português", flag: "🇵🇹" },
  { code: "nl", native: "Nederlands", flag: "🇳🇱" },
  { code: "pl", native: "Polski", flag: "🇵🇱" },
  { code: "ru", native: "Русский", flag: "🇷🇺" },
];

export default function LanguageScreen() {
  const { t, language, setLanguage } = useTranslation();
  const { colors } = useTheme();

  const handleSelect = (lang: Language) => {
    setLanguage(lang);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{ padding: 8, marginLeft: -8 }}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          accessibilityHint="Revenir à l'écran précédent"
          hitSlop={8}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text
          style={{ fontSize: 20, fontWeight: "700", color: colors.textPrimary, marginLeft: 8 }}
          accessibilityRole="header"
        >
          {t.language.title}
        </Text>
      </Animated.View>

      <ScrollView 
        style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.Text 
          entering={FadeInDown.delay(100).duration(400)}
          style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 16 }}
        >
          {t.language.subtitle}
        </Animated.Text>

        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: colors.borderLight,
          }}
          accessibilityRole="radiogroup"
          accessibilityLabel="Sélection de la langue"
        >
          {LANGUAGES.map((lang, index) => (
            <PressableScale
              key={lang.code}
              onPress={() => handleSelect(lang.code)}
              accessibilityRole="radio"
              accessibilityLabel={lang.native}
              accessibilityState={{ selected: language === lang.code }}
              accessibilityHint={`Sélectionner ${lang.native} comme langue`}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                  borderBottomWidth: index !== LANGUAGES.length - 1 ? 1 : 0,
                  borderBottomColor: colors.borderLight,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ fontSize: 24, marginRight: 12 }} accessible={false}>{lang.flag}</Text>
                  <Text style={{ color: colors.textPrimary, fontSize: 16 }}>{lang.native}</Text>
                </View>
                {language === lang.code && (
                  <MaterialIcons name="check-circle" size={24} color={colors.primary} />
                )}
              </View>
            </PressableScale>
          ))}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
