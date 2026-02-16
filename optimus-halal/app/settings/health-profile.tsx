/**
 * Health Profile Screen
 *
 * Toggles for pregnancy and children status.
 * These flags trigger personalized health warnings during scans
 * (e.g., E171 TiO2 banned for pregnant, Southampton Six for children).
 */

import React, { useCallback } from "react";
import {
  View,
  Text,
  Switch,
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

export default function HealthProfileScreen() {
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

  const handleToggle = useCallback(
    async (field: "isPregnant" | "hasChildren", value: boolean) => {
      impact();
      await updateProfile.mutateAsync({ [field]: value });
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
          {t.healthProfile.title}
        </Text>
        <View className="w-10" />
      </Animated.View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Privacy notice */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          className="px-4 mb-6"
        >
          <View
            className="rounded-xl p-4"
            style={{
              backgroundColor: isDark
                ? "rgba(59,130,246,0.08)"
                : "rgba(59,130,246,0.05)",
              borderWidth: 1,
              borderColor: isDark
                ? "rgba(59,130,246,0.15)"
                : "rgba(59,130,246,0.1)",
            }}
          >
            <View className="flex-row items-center gap-2 mb-2">
              <MaterialIcons
                name="privacy-tip"
                size={18}
                color={isDark ? "#60a5fa" : "#3b82f6"}
              />
              <Text className="text-sm font-semibold text-slate-900 dark:text-white">
                {t.healthProfile.privacyTitle}
              </Text>
            </View>
            <Text className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              {t.healthProfile.privacyBody}
            </Text>
          </View>
        </Animated.View>

        {/* Health toggles */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          className="px-4 mb-4"
        >
          <View
            className="rounded-xl overflow-hidden"
            style={{
              backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
              borderWidth: 1,
              borderColor: isDark ? "rgba(255,255,255,0.05)" : "#e2e8f0",
            }}
          >
            {/* Pregnant toggle */}
            <View className="p-4 flex-row items-center justify-between">
              <View className="flex-row items-center gap-3 flex-1 mr-4">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: isDark
                      ? "rgba(244,114,182,0.15)"
                      : "rgba(244,114,182,0.1)",
                  }}
                >
                  <MaterialIcons
                    name="pregnant-woman"
                    size={22}
                    color={isDark ? "#f472b6" : "#ec4899"}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-slate-900 dark:text-white">
                    {t.healthProfile.pregnant.label}
                  </Text>
                  <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {t.healthProfile.pregnant.description}
                  </Text>
                </View>
              </View>
              <Switch
                value={profile?.isPregnant ?? false}
                onValueChange={(v) => handleToggle("isPregnant", v)}
                trackColor={{
                  false: isDark ? "#374151" : "#e2e8f0",
                  true: colors.primary,
                }}
                thumbColor="#ffffff"
                accessibilityLabel={t.healthProfile.pregnant.label}
              />
            </View>

            {/* Divider */}
            <View
              className="mx-4 h-px"
              style={{
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.05)"
                  : "#f1f5f9",
              }}
            />

            {/* Children toggle */}
            <View className="p-4 flex-row items-center justify-between">
              <View className="flex-row items-center gap-3 flex-1 mr-4">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: isDark
                      ? "rgba(96,165,250,0.15)"
                      : "rgba(96,165,250,0.1)",
                  }}
                >
                  <MaterialIcons
                    name="child-care"
                    size={22}
                    color={isDark ? "#60a5fa" : "#3b82f6"}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-slate-900 dark:text-white">
                    {t.healthProfile.children.label}
                  </Text>
                  <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {t.healthProfile.children.description}
                  </Text>
                </View>
              </View>
              <Switch
                value={profile?.hasChildren ?? false}
                onValueChange={(v) => handleToggle("hasChildren", v)}
                trackColor={{
                  false: isDark ? "#374151" : "#e2e8f0",
                  true: colors.primary,
                }}
                thumbColor="#ffffff"
                accessibilityLabel={t.healthProfile.children.label}
              />
            </View>
          </View>
        </Animated.View>

        {/* Allergens link */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(400)}
          className="px-4 mb-4"
        >
          <TouchableOpacity
            onPress={() => router.push("/settings/exclusions" as any)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t.healthProfile.allergens.description}
            className="rounded-xl p-4 flex-row items-center justify-between"
            style={{
              backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
              borderWidth: 1,
              borderColor: isDark ? "rgba(255,255,255,0.05)" : "#e2e8f0",
            }}
          >
            <View className="flex-row items-center gap-3">
              <View
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{
                  backgroundColor: isDark
                    ? "rgba(251,191,36,0.15)"
                    : "rgba(251,191,36,0.1)",
                }}
              >
                <MaterialIcons
                  name="no-food"
                  size={20}
                  color={isDark ? "#fbbf24" : "#d97706"}
                />
              </View>
              <View>
                <Text className="text-sm font-semibold text-slate-900 dark:text-white">
                  {t.healthProfile.allergens.title}
                </Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t.healthProfile.allergens.description}
                </Text>
              </View>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={22}
              color={isDark ? "#475569" : "#94a3b8"}
            />
          </TouchableOpacity>
        </Animated.View>

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
