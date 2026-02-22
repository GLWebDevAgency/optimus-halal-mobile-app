/**
 * Reporting Form Screen
 *
 * Formulaire de signalement avec:
 * - Header avec titre et cancel
 * - Title input (required by API)
 * - Section recherche produit avec barcode scanner
 * - Grid types de violation (4 options → backend enum)
 * - Textarea détails supplémentaires
 * - Upload photo evidence
 * - Toggle contact follow-up
 * - Bouton submit → trpc.report.createReport
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useHaptics, useTranslation, useTheme } from "@/hooks";
import { PremiumBackground } from "@/components/ui";
import { PressableScale } from "@/components/ui/PressableScale";
import { useImageUpload } from "@/hooks/useImageUpload";
import { ImpactFeedbackStyle } from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { trpc } from "@/lib/trpc";

// Map UI violation types → backend report type enum
const VIOLATION_TYPES = [
  { id: "fake-cert", backendType: "incorrect_halal_status" as const, icon: "verified" as const, iconColor: "#fbbf24", titleKey: "violationFakeCert" as const, subtitleKey: "violationFakeCertSub" as const },
  { id: "unethical-labor", backendType: "store_issue" as const, icon: "factory" as const, iconColor: "#64748b", titleKey: "violationUnethical" as const, subtitleKey: "violationUnethicalSub" as const },
  { id: "contamination", backendType: "wrong_ingredients" as const, icon: "science" as const, iconColor: "#64748b", titleKey: "violationContamination" as const, subtitleKey: "violationContaminationSub" as const },
  { id: "other", backendType: "other" as const, icon: "warning" as const, iconColor: "#64748b", titleKey: "violationOther" as const, subtitleKey: "violationOtherSub" as const },
];

export default function ReportingFormScreen() {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const { impact, notification } = useHaptics();
  const { t } = useTranslation();

  const [title, setTitle] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [selectedViolation, setSelectedViolation] = useState<string>("fake-cert");
  const [details, setDetails] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [allowContact, setAllowContact] = useState(true);
  const { upload: uploadImage, isUploading } = useImageUpload();

  const createReport = trpc.report.createReport.useMutation({
    onSuccess: () => {
      notification();
      Alert.alert(
        t.report.title,
        t.report.successMessage,
        [{ text: "OK", onPress: () => router.canGoBack() ? router.back() : router.replace("/(tabs)") }],
      );
    },
    onError: (error) => {
      Alert.alert(
        t.common.error,
        error.message || t.report.errorMessage,
      );
    },
  });

  const isFormValid =
    title.trim().length >= 5 &&
    details.trim().length >= 10 &&
    selectedViolation !== null;

  const safeGoBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  }, []);

  const handleBack = useCallback(() => {
    impact();
    safeGoBack();
  }, [safeGoBack]);

  const handleCancel = useCallback(() => {
    impact();
    safeGoBack();
  }, [safeGoBack]);

  const handleSelectViolation = useCallback((id: string) => {
    impact();
    setSelectedViolation(id);
  }, []);

  const MAX_PHOTOS = 5;

  const handleAddPhoto = useCallback(async () => {
    if (photos.length >= MAX_PHOTOS) return;
    impact();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos((prev) => [...prev, result.assets[0].uri]);
    }
  }, [photos.length, impact]);

  const handleRemovePhoto = useCallback((index: number) => {
    impact(ImpactFeedbackStyle.Medium);
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!isFormValid || createReport.isPending || isUploading) return;

    const violationType = VIOLATION_TYPES.find((v) => v.id === selectedViolation);
    if (!violationType) return;

    try {
      // Upload all local photos to R2, keep already-uploaded URLs as-is
      const photoUrls = await Promise.all(
        photos.map((p) =>
          p.startsWith("http") ? p : uploadImage({ uri: p, type: "report" }),
        ),
      );

      createReport.mutate({
        type: violationType.backendType,
        title: title.trim(),
        description: details.trim(),
        photoUrls,
      });
    } catch {
      Alert.alert(t.common.error, t.report.errorMessage);
    }
  }, [isFormValid, selectedViolation, title, details, photos, createReport, isUploading, uploadImage, t]);

  const handleScanBarcode = useCallback(() => {
    impact();
    router.navigate("/(tabs)/scanner");
  }, []);

  // Progress: title filled = 33%, violation selected = 66%, details filled = 100%
  const progress = [
    title.trim().length >= 5,
    selectedViolation !== null,
    details.trim().length >= 10,
  ].filter(Boolean).length;
  const progressPercent = Math.round((progress / 3) * 100);

  return (
    <View className="flex-1">
      <PremiumBackground />
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        className="flex-row items-center backdrop-blur-md px-4 pt-12 pb-2 justify-between border-b"
        style={{ paddingTop: insets.top + 8, backgroundColor: isDark ? "rgba(10,26,16,0.9)" : "rgba(248,250,249,0.9)", borderBottomColor: colors.borderLight }}
      >
        <Pressable
          onPress={handleBack}
          style={{ width: 40, height: 40, alignItems: "flex-start", justifyContent: "center", borderRadius: 9999 }}
          accessibilityRole="button"
          accessibilityLabel={t.common.back}
        >
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={colors.textPrimary}
          />
        </Pressable>

        <Text className="text-lg font-bold tracking-tight flex-1 text-center" style={{ color: colors.textPrimary }}>
          {t.report.title}
        </Text>

        <Pressable
          onPress={handleCancel}
          accessibilityRole="button"
          accessibilityLabel={t.common.cancel}
        >
          <Text className="text-base font-medium" style={{ color: colors.textSecondary }}>
            {t.common.cancel}
          </Text>
        </Pressable>
      </Animated.View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 180 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Indicator */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          className="px-5 pt-4 gap-2"
        >
          <View className="flex-row justify-between items-end">
            <Text className="text-sm font-semibold tracking-wide uppercase text-emerald-500">
              {progressPercent < 100 ? t.report.progressFields.replace("{{progress}}", String(progress)) : t.report.readyToSend}
            </Text>
            <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>
              {t.report.completed.replace("{{percent}}", String(progressPercent))}
            </Text>
          </View>
          <View className="rounded-full h-1.5 w-full overflow-hidden" style={{ backgroundColor: colors.buttonSecondary }}>
            <Animated.View
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${progressPercent}%` }}
            />
          </View>
        </Animated.View>

        {/* Title & Description */}
        <Animated.View
          entering={FadeInDown.delay(150).duration(400)}
          className="px-5 pt-6 pb-2"
        >
          <Text className="text-3xl font-extrabold tracking-tight leading-tight" style={{ color: colors.textPrimary }}>
            {t.report.title}
          </Text>
          <Text className="text-sm leading-relaxed pt-2" style={{ color: colors.textSecondary }}>
            {t.report.helpText}
          </Text>
        </Animated.View>

        {/* Divider */}
        <View className="h-px mx-5 my-4" style={{ backgroundColor: colors.borderLight }} />

        {/* Section 1: Report Title */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          className="px-5 gap-3"
        >
          <Text className="text-sm font-bold tracking-tight" style={{ color: colors.textPrimary }}>
            1. {t.report.titleLabel} *
          </Text>
          <TextInput
            className="w-full px-4 py-4 border rounded-xl text-sm font-medium shadow-sm"
            placeholder={t.report.titlePlaceholder}
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
            maxLength={255}
            style={{ backgroundColor: colors.card, borderColor: colors.borderLight, color: colors.textPrimary }}
          />
          {title.length > 0 && title.length < 5 && (
            <Text className="text-xs text-red-400">{t.report.minChars5}</Text>
          )}
        </Animated.View>

        {/* Section 2: Identify Product */}
        <Animated.View
          entering={FadeInDown.delay(250).duration(400)}
          className="px-5 pt-8 gap-3"
        >
          <Text className="text-sm font-bold tracking-tight" style={{ color: colors.textPrimary }}>
            2. {t.report.identifyProduct}
          </Text>
          <View className="relative">
            <View className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10">
              <MaterialIcons name="search" size={20} color={colors.textMuted} />
            </View>
            <TextInput
              className="w-full pl-11 pr-12 py-4 border rounded-xl text-sm font-medium shadow-sm"
              placeholder={t.report.searchPlaceholder}
              placeholderTextColor={colors.textMuted}
              value={productSearch}
              onChangeText={setProductSearch}
              style={{ backgroundColor: colors.card, borderColor: colors.borderLight, color: colors.textPrimary }}
            />
            <Pressable
              onPress={handleScanBarcode}
              accessibilityRole="button"
              accessibilityLabel={t.report.identifyProduct}
              style={{ position: "absolute", right: 14, top: "50%", transform: [{ translateY: -12 }] }}
            >
              <MaterialIcons name="qr-code-scanner" size={24} color={colors.textMuted} />
            </Pressable>
          </View>
        </Animated.View>

        {/* Section 3: Type of Violation */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(400)}
          className="px-5 pt-8 gap-3"
        >
          <Text className="text-sm font-bold tracking-tight" style={{ color: colors.textPrimary }}>
            3. {t.report.violationType} *
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {VIOLATION_TYPES.map((type) => {
              const isSelected = selectedViolation === type.id;
              return (
                <PressableScale
                  key={type.id}
                  onPress={() => handleSelectViolation(type.id)}
                  style={{
                    width: "48%",
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={t.report[type.titleKey]}
                >
                  <View
                    className="relative p-4 rounded-xl border-2 shadow-sm"
                    style={{
                      borderColor: isSelected ? "#10b981" : colors.borderLight,
                      backgroundColor: isSelected
                        ? (isDark ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.05)")
                        : colors.card,
                    }}
                  >
                    {isSelected && (
                      <View className="absolute top-3 right-3">
                        <MaterialIcons name="check-circle" size={18} color="#10b981" />
                      </View>
                    )}
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center mb-3 border"
                      style={{
                        backgroundColor: isSelected ? colors.card : colors.backgroundSecondary,
                        borderColor: colors.borderLight,
                      }}
                    >
                      <MaterialIcons
                        name={type.icon}
                        size={22}
                        color={isSelected ? "#fbbf24" : type.iconColor}
                      />
                    </View>
                    <Text className="text-sm font-bold" style={{ color: colors.textPrimary }}>
                      {t.report[type.titleKey]}
                    </Text>
                    <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
                      {t.report[type.subtitleKey]}
                    </Text>
                  </View>
                </PressableScale>
              );
            })}
          </View>
        </Animated.View>

        {/* Section 4: Additional Details */}
        <Animated.View
          entering={FadeInDown.delay(350).duration(400)}
          className="px-5 pt-8 gap-3"
        >
          <Text className="text-sm font-bold tracking-tight" style={{ color: colors.textPrimary }}>
            4. {t.report.additionalDetails} *
          </Text>
          <TextInput
            className="w-full p-4 border rounded-xl text-sm font-medium shadow-sm"
            placeholder={t.report.detailsPlaceholder}
            placeholderTextColor={colors.textMuted}
            value={details}
            onChangeText={setDetails}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={{ minHeight: 100, backgroundColor: colors.card, borderColor: colors.borderLight, color: colors.textPrimary }}
            maxLength={2000}
          />
          {details.length > 0 && details.length < 10 && (
            <Text className="text-xs text-red-400">{t.report.minChars10}</Text>
          )}
        </Animated.View>

        {/* Section 5: Photo Evidence */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(400)}
          className="px-5 pt-8 gap-3"
        >
          <View className="flex-row justify-between items-end">
            <Text className="text-sm font-bold tracking-tight" style={{ color: colors.textPrimary }}>
              5. {t.report.photoEvidence}
            </Text>
            <View className="bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <Text className="text-xs font-semibold text-emerald-500">
                {t.report.recommended}
              </Text>
            </View>
          </View>

          {/* Upload Zone */}
          <PressableScale
            onPress={handleAddPhoto}
            disabled={photos.length >= MAX_PHOTOS}
            accessibilityRole="button"
            accessibilityLabel={t.report.tapToAdd}
          >
            <View
              className="w-full h-36 border-2 border-dashed rounded-xl items-center justify-center gap-2"
              style={{
                borderColor: photos.length >= MAX_PHOTOS ? colors.borderLight : colors.border,
                backgroundColor: photos.length >= MAX_PHOTOS
                  ? (isDark ? "rgba(30,41,59,0.5)" : "rgba(243,244,246,0.5)")
                  : colors.backgroundSecondary,
                opacity: photos.length >= MAX_PHOTOS ? 0.5 : 1,
              }}
            >
              <View className="w-12 h-12 rounded-full shadow-sm items-center justify-center" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#ffffff" }}>
                <MaterialIcons name="add-a-photo" size={28} color="#10b981" />
              </View>
              <View className="items-center">
                <Text className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                  {photos.length >= MAX_PHOTOS ? `${MAX_PHOTOS}/${MAX_PHOTOS} photos` : t.report.tapToAdd}
                </Text>
                <Text className="text-[11px] mt-0.5" style={{ color: colors.textMuted }}>
                  {photos.length >= MAX_PHOTOS ? t.report.limitReached : `${photos.length}/${MAX_PHOTOS} — ${t.report.photoFormat}`}
                </Text>
              </View>
            </View>
          </PressableScale>

          {/* Photo Thumbnails */}
          {photos.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingBottom: 8, paddingTop: 4 }}
            >
              {photos.map((photo, index) => (
                <PressableScale
                  key={index}
                  onPress={() => handleRemovePhoto(index)}
                  accessibilityRole="button"
                  accessibilityLabel={`${t.report.photoEvidence} ${index + 1}`}
                >
                  <View
                    className="relative w-20 h-20 rounded-lg overflow-hidden border shadow-sm"
                    style={{ borderColor: colors.borderLight }}
                  >
                    <Image
                      source={{ uri: photo }}
                      className="w-full h-full"
                      contentFit="cover"
                      transition={200}
                    />
                    <View className="absolute inset-0 bg-black/30 items-center justify-center">
                      <MaterialIcons name="delete" size={20} color="#ffffff" />
                    </View>
                    {index === 0 && (
                      <View className="absolute bottom-1 right-1 bg-black/60 rounded px-1 py-0.5">
                        <Text className="text-[8px] text-white font-medium uppercase tracking-wider">
                          {t.report.cover}
                        </Text>
                      </View>
                    )}
                  </View>
                </PressableScale>
              ))}
            </ScrollView>
          )}
        </Animated.View>

        {/* Allow Contact Toggle */}
        <Animated.View
          entering={FadeInDown.delay(450).duration(400)}
          className="px-5 pt-4 pb-4"
        >
          <View className="flex-row items-center justify-between p-4 rounded-xl border shadow-sm" style={{ backgroundColor: colors.card, borderColor: colors.borderLight }}>
            <View className="flex-1 gap-0.5">
              <Text className="text-sm font-bold" style={{ color: colors.textPrimary }}>
                {t.report.allowFollowup}
              </Text>
              <Text className="text-xs" style={{ color: colors.textMuted }}>
                {t.report.followupDetail}
              </Text>
            </View>
            <Switch
              value={allowContact}
              onValueChange={setAllowContact}
              trackColor={{ false: "#d1d5db", true: "#10b981" }}
              thumbColor="#ffffff"
            />
          </View>
        </Animated.View>
      </ScrollView>

      {/* Fixed Bottom CTA */}
      <Animated.View
        entering={FadeInUp.delay(500).duration(400)}
        className="absolute bottom-0 left-0 right-0 border-t p-5 backdrop-blur-xl z-40"
        style={{ paddingBottom: insets.bottom + 24, backgroundColor: colors.background, borderTopColor: colors.borderLight }}
      >
        <PressableScale
          onPress={handleSubmit}
          disabled={!isFormValid || createReport.isPending || isUploading}
          accessibilityRole="button"
          accessibilityLabel={t.report.submitReport}
        >
          <View
            className="w-full py-4 rounded-xl flex-row items-center justify-center gap-2"
            style={{
              backgroundColor: isFormValid && !createReport.isPending && !isUploading
                ? "#10b981"
                : colors.buttonSecondary,
              ...(isFormValid && !createReport.isPending && !isUploading
                ? {
                    shadowColor: "#10b981",
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.4,
                    shadowRadius: 20,
                  }
                : {}),
            }}
          >
            {createReport.isPending || isUploading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Text className="font-bold text-base text-white">
                  {t.report.submitReport}
                </Text>
                <MaterialIcons name="send" size={20} color="#ffffff" />
              </>
            )}
          </View>
        </PressableScale>

        <View className="flex-row items-center justify-center gap-1.5 mt-4 opacity-70">
          <MaterialIcons name="lock" size={12} color={colors.textMuted} />
          <Text className="text-[11px] font-medium tracking-wide" style={{ color: colors.textMuted }}>
            {t.report.encryptionNotice}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}
