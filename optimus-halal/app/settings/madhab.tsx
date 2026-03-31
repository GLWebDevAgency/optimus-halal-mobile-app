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
  Pressable,
  ScrollView,
} from "react-native";
import { PressableScale } from "@/components/ui/PressableScale";
import { PremiumBackground, PadlockBottomSheet } from "@/components/ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeftIcon, CheckIcon, InfoIcon, LockSimple as LockSimpleIcon } from "phosphor-react-native";
import Animated, { FadeIn, FadeInDown, ZoomIn } from "react-native-reanimated";
import { useHaptics, useTranslation, useCanAccessPremiumData } from "@/hooks";
import { useTheme } from "@/hooks/useTheme";
import { trpc } from "@/lib/trpc";
import { isAuthenticated as hasStoredTokens } from "@/services/api";
import { usePreferencesStore } from "@/store";
import { type IconName } from "@/lib/icons";

const GOLD = "#d4af37";

type MadhabValue = "hanafi" | "shafii" | "maliki" | "hanbali" | "general";

const MADHAB_ICONS: Record<MadhabValue, IconName> = {
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
  const canSelectSchools = useCanAccessPremiumData();
  const utils = trpc.useUtils();
  const isAuthenticated = hasStoredTokens();

  const { data: profile } = trpc.profile.getProfile.useQuery(undefined, { enabled: isAuthenticated });
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

  const { selectedMadhab, setMadhab } = usePreferencesStore();
  const [selected, setSelected] = useState<MadhabValue>(
    (profile?.madhab as MadhabValue) ?? (selectedMadhab as MadhabValue) ?? "general"
  );
  const [showPadlock, setShowPadlock] = useState(false);

  const handleSelect = useCallback(
    async (value: MadhabValue) => {
      // Lock non-general schools for free post-trial users
      if (!canSelectSchools && value !== "general") {
        setShowPadlock(true);
        return;
      }
      setSelected(value);
      impact();
      // Save locally
      setMadhab(value);
      // Save to backend if authenticated
      if (isAuthenticated) {
        await updateProfile.mutateAsync({ madhab: value });
      }
    },
    [impact, updateProfile, canSelectSchools, setMadhab, isAuthenticated]
  );

  return (
    <View style={{ flex: 1 }}>
      <PremiumBackground />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        className="flex-row items-center px-4 pb-4 pt-2"
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t.common.back}
          hitSlop={8}
        >
          <View
            className="w-10 h-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9" }}
          >
            <ArrowLeftIcon size={22}
              color={isDark ? "#e2e8f0" : "#334155"} />
          </View>
        </Pressable>
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
        {/* InfoIcon */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          className="px-4 mb-6"
        >
          <View
            className="rounded-2xl p-4"
            style={{
              backgroundColor: isDark
                ? "rgba(19,236,106,0.08)"
                : "rgba(19,236,106,0.05)",
              borderWidth: 1,
              borderColor: isDark
                ? "rgba(212,175,55,0.12)"
                : "rgba(212,175,55,0.1)",
            }}
          >
            <View className="flex-row items-center gap-2 mb-2">
              <InfoIcon size={18} color={GOLD} />
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
        {options.map((option, index) => {
          const isLocked = !canSelectSchools && option.value !== "general";
          const isSelected = selected === option.value;
          return (
          <Animated.View
            key={option.value}
            entering={FadeInDown.delay(150 + index * 60).duration(400)}
            className="px-4 mb-3"
          >
            <PressableScale
              onPress={() => handleSelect(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={option.label}
              accessibilityHint={isLocked ? t.padlock.featureTitle : option.description}
            >
              <View
                className="rounded-2xl p-4 flex-row items-center gap-4"
                style={{
                  opacity: isLocked ? 0.5 : 1,
                  backgroundColor: isDark
                    ? isSelected
                      ? "rgba(212,175,55,0.08)"
                      : "rgba(255,255,255,0.03)"
                    : isSelected
                      ? "rgba(212,175,55,0.05)"
                      : "#ffffff",
                  borderWidth: isSelected ? 2 : 1,
                  borderColor: isSelected
                    ? GOLD
                    : isDark
                      ? "rgba(212,175,55,0.08)"
                      : "rgba(212,175,55,0.1)",
                  shadowColor: isSelected ? GOLD : "transparent",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: isSelected ? 0.2 : 0,
                  shadowRadius: isSelected ? 12 : 0,
                  elevation: isSelected ? 4 : 0,
                }}
              >
                {/* Radio indicator */}
                <View
                  className="w-6 h-6 rounded-full items-center justify-center"
                  style={{
                    borderWidth: 2,
                    borderColor: isSelected
                      ? GOLD
                      : isDark
                        ? "#4b5563"
                        : "#cbd5e1",
                    backgroundColor: isSelected
                      ? GOLD
                      : "transparent",
                  }}
                >
                  {isSelected && !isLocked && (
                    <Animated.View entering={ZoomIn.springify()}>
                      <CheckIcon size={14} color="#fff" />
                    </Animated.View>
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

                {/* Lock icon for locked schools */}
                {isLocked && (
                  <LockSimpleIcon size={18} color={colors.textMuted} weight="fill" />
                )}
              </View>
            </PressableScale>
          </Animated.View>
          );
        })}

        {/* Saving indicator */}
        {updateProfile.isPending && (
          <Animated.View entering={FadeIn.duration(200)} className="px-4 mt-2">
            <Text className="text-xs text-center text-slate-400 dark:text-slate-500">
              {t.editProfile.saving}
            </Text>
          </Animated.View>
        )}
        </ScrollView>

        <PadlockBottomSheet
          visible={showPadlock}
          onClose={() => setShowPadlock(false)}
          description={t.padlock.madhabDescription}
        />
      </SafeAreaView>
    </View>
  );
}
