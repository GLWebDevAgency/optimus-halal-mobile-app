/**
 * Madhab Selector Screen
 *
 * Allows user to choose their Islamic school of jurisprudence (madhab).
 * This affects halal analysis of contested additives like E441 (gelatin),
 * E471 (mono/diglycerides), and others where scholars differ.
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useHaptics, useTranslation } from "@/hooks";
import { useTheme } from "@/hooks/useTheme";
import { trpc } from "@/lib/trpc";

type MadhabValue = "hanafi" | "shafii" | "maliki" | "hanbali" | "general";

const MADHAB_OPTIONS: {
  value: MadhabValue;
  label: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}[] = [
  {
    value: "hanafi",
    label: "Hanafi",
    description:
      "La plus suivie dans le monde — Turquie, Asie du Sud, Asie Centrale, Balkans",
    icon: "mosque",
  },
  {
    value: "shafii",
    label: "Shafi'i",
    description:
      "Asie du Sud-Est, Afrique de l'Est, Yémen, Kurdist\u00E2n",
    icon: "mosque",
  },
  {
    value: "maliki",
    label: "Maliki",
    description: "Afrique du Nord et de l'Ouest, parties du Golfe",
    icon: "mosque",
  },
  {
    value: "hanbali",
    label: "Hanbali",
    description: "Arabie Saoudite, Qatar, parties du Golfe",
    icon: "mosque",
  },
  {
    value: "general",
    label: "G\u00E9n\u00E9ral (le plus prudent)",
    description:
      "Suit l\u2019avis majoritaire. Recommand\u00E9 si vous ne suivez pas une \u00E9cole sp\u00E9cifique.",
    icon: "shield",
  },
];

export default function MadhabScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const { impact } = useHaptics();
  const utils = trpc.useUtils();

  const { data: profile } = trpc.profile.getProfile.useQuery();
  const updateProfile = trpc.profile.updateProfile.useMutation({
    onSuccess: () => {
      utils.profile.getProfile.invalidate();
    },
  });

  const [selected, setSelected] = useState<MadhabValue>(
    (profile?.madhab as MadhabValue) ?? "general"
  );

  const handleSelect = useCallback(
    async (value: MadhabValue) => {
      setSelected(value);
      impact();
      await updateProfile.mutateAsync({ madhab: value });
    },
    [impact, updateProfile]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        className="flex-row items-center px-4 pb-4 pt-2"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t.common.back}
          className="w-10 h-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9" }}
        >
          <MaterialIcons
            name="arrow-back"
            size={22}
            color={isDark ? "#e2e8f0" : "#334155"}
          />
        </TouchableOpacity>
        <Text
          className="flex-1 text-center text-lg font-bold text-slate-900 dark:text-white"
          accessibilityRole="header"
        >
          \u00C9cole juridique
        </Text>
        <View className="w-10" />
      </Animated.View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Info */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          className="px-4 mb-6"
        >
          <View
            className="rounded-xl p-4"
            style={{
              backgroundColor: isDark
                ? "rgba(19,236,106,0.08)"
                : "rgba(19,236,106,0.05)",
              borderWidth: 1,
              borderColor: isDark
                ? "rgba(19,236,106,0.15)"
                : "rgba(19,236,106,0.1)",
            }}
          >
            <View className="flex-row items-center gap-2 mb-2">
              <MaterialIcons name="info" size={18} color={colors.primary} />
              <Text className="text-sm font-semibold text-slate-900 dark:text-white">
                Pourquoi c'est important ?
              </Text>
            </View>
            <Text className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              Votre \u00E9cole juridique (madhab) influence l\u2019analyse de certains
              additifs comme la g\u00E9latine (E441) et les mono/diglyc\u00E9rides (E471).
              Les savants ont des avis diff\u00E9rents selon les \u00E9coles.
            </Text>
          </View>
        </Animated.View>

        {/* Options */}
        {MADHAB_OPTIONS.map((option, index) => (
          <Animated.View
            key={option.value}
            entering={FadeInDown.delay(150 + index * 60).duration(400)}
            className="px-4 mb-3"
          >
            <TouchableOpacity
              onPress={() => handleSelect(option.value)}
              activeOpacity={0.7}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected === option.value }}
              accessibilityLabel={option.label}
              accessibilityHint={option.description}
              className="rounded-xl p-4 flex-row items-center gap-4"
              style={{
                backgroundColor: isDark
                  ? selected === option.value
                    ? "rgba(19,236,106,0.1)"
                    : "rgba(255,255,255,0.03)"
                  : selected === option.value
                    ? "rgba(19,236,106,0.06)"
                    : "#ffffff",
                borderWidth: selected === option.value ? 2 : 1,
                borderColor: selected === option.value
                  ? colors.primary
                  : isDark
                    ? "rgba(255,255,255,0.05)"
                    : "#e2e8f0",
              }}
            >
              {/* Radio indicator */}
              <View
                className="w-6 h-6 rounded-full items-center justify-center"
                style={{
                  borderWidth: 2,
                  borderColor: selected === option.value
                    ? colors.primary
                    : isDark
                      ? "#4b5563"
                      : "#cbd5e1",
                  backgroundColor: selected === option.value
                    ? colors.primary
                    : "transparent",
                }}
              >
                {selected === option.value && (
                  <MaterialIcons name="check" size={14} color="#fff" />
                )}
              </View>

              {/* Content */}
              <View className="flex-1">
                <Text className="text-base font-bold text-slate-900 dark:text-white">
                  {option.label}
                </Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {option.description}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}

        {/* Saving indicator */}
        {updateProfile.isPending && (
          <Animated.View entering={FadeIn.duration(200)} className="px-4 mt-2">
            <Text className="text-xs text-center text-slate-400 dark:text-slate-500">
              Enregistrement...
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
