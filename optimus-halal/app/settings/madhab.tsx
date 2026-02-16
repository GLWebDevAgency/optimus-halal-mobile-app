/**
 * Madhab Selector Screen
 *
 * Allows user to choose their Islamic school of jurisprudence (madhab).
 * This affects halal analysis of contested additives like E441 (gelatin),
 * E471 (mono/diglycerides), and others where scholars differ.
 */

import React, { useState, useCallback, useMemo } from "react";
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

const MADHAB_ICONS: Record<MadhabValue, keyof typeof MaterialIcons.glyphMap> = {
  hanafi: "mosque",
  shafii: "mosque",
  maliki: "mosque",
  hanbali: "mosque",
  general: "shield",
};

const MADHAB_KEYS: MadhabValue[] = ["hanafi", "shafii", "maliki", "hanbali", "general"];

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

  const options = useMemo(
    () =>
      MADHAB_KEYS.map((value) => ({
        value,
        label: t.madhab.options[value].label,
        description: t.madhab.options[value].description,
        icon: MADHAB_ICONS[value],
      })),
    [t]
  );

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
          {t.madhab.title}
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
                {t.madhab.infoTitle}
              </Text>
            </View>
            <Text className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              {t.madhab.infoBody}
            </Text>
          </View>
        </Animated.View>

        {/* Options */}
        {options.map((option, index) => (
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
              {t.editProfile.saving}
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
