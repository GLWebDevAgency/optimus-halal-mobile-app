/**
 * Reporting Form Screen — Ultra-Premium Edition
 *
 * Formulaire de signalement avec:
 * - Gold-accent section numbering with premium badges
 * - Spring-animated progress bar with gold→emerald gradient
 * - Animated input focus glow (gold border + shadow)
 * - Violation cards with gold glow ring + ZoomIn checkmark
 * - LinearGradient CTA with emerald glow shadow
 * - Gold-tinted dividers, borders, photo zone
 * - Staggered cascading enter animations
 */

import React, { useState, useCallback, useEffect } from "react";
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
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { trpc } from "@/lib/trpc";

// Map UI violation types → backend report type enum
const VIOLATION_TYPES = [
  { id: "fake-cert", backendType: "incorrect_halal_status" as const, icon: "verified" as const, iconColor: "#fbbf24", titleKey: "violationFakeCert" as const, subtitleKey: "violationFakeCertSub" as const },
  { id: "unethical-labor", backendType: "store_issue" as const, icon: "factory" as const, iconColor: "#64748b", titleKey: "violationUnethical" as const, subtitleKey: "violationUnethicalSub" as const },
  { id: "contamination", backendType: "wrong_ingredients" as const, icon: "science" as const, iconColor: "#64748b", titleKey: "violationContamination" as const, subtitleKey: "violationContaminationSub" as const },
  { id: "other", backendType: "other" as const, icon: "warning" as const, iconColor: "#64748b", titleKey: "violationOther" as const, subtitleKey: "violationOtherSub" as const },
];

// ── Gold accent system (matches PremiumBackground dust particles) ──
const GOLD = "#d4af37";
const GOLD_LIGHT = "rgba(212, 175, 55, 0.15)";

// ── Section Number Badge ──
const SectionBadge = React.memo(function SectionBadge({ num, isDark }: { num: number; isDark: boolean }) {
  return (
    <View
      style={{
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: isDark ? "rgba(212,175,55,0.15)" : "rgba(212,175,55,0.12)",
        borderWidth: 1,
        borderColor: isDark ? "rgba(212,175,55,0.3)" : "rgba(212,175,55,0.25)",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: "700", color: GOLD }}>{num}</Text>
    </View>
  );
});

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
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { upload: uploadImage, isUploading } = useImageUpload();

  // ── Progress animation (spring-driven scaleX) ──
  const progressAnim = useSharedValue(0);

  const progress = [
    title.trim().length >= 5,
    selectedViolation !== null,
    details.trim().length >= 10,
  ].filter(Boolean).length;
  const progressPercent = Math.round((progress / 3) * 100);

  useEffect(() => {
    progressAnim.value = withSpring(progressPercent / 100, {
      damping: 18,
      stiffness: 120,
    });
  }, [progressPercent, progressAnim]);

  const progressBarStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progressAnim.value }],
  }));

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
  }, [safeGoBack, impact]);

  const handleCancel = useCallback(() => {
    impact();
    safeGoBack();
  }, [safeGoBack, impact]);

  const handleSelectViolation = useCallback((id: string) => {
    impact();
    setSelectedViolation(id);
  }, [impact]);

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
  }, [impact]);

  // ── Input focus glow helpers ──
  const getInputBorderColor = (fieldName: string) =>
    focusedField === fieldName
      ? isDark ? "rgba(212,175,55,0.5)" : "rgba(212,175,55,0.4)"
      : colors.borderLight;

  const getInputShadow = (fieldName: string) =>
    focusedField === fieldName
      ? {
          shadowColor: GOLD,
          shadowOffset: { width: 0, height: 0 } as const,
          shadowOpacity: isDark ? 0.25 : 0.15,
          shadowRadius: 12,
          elevation: 4,
        }
      : {};

  return (
    <View className="flex-1">
      <PremiumBackground />

      {/* ── Header — Gold-accent bottom border ── */}
      <Animated.View
        entering={FadeIn.duration(300)}
        className="flex-row items-center px-4 pb-3 justify-between"
        style={{
          paddingTop: insets.top + 8,
          backgroundColor: isDark ? "rgba(10,26,16,0.88)" : "rgba(248,250,249,0.9)",
          borderBottomWidth: 1,
          borderBottomColor: isDark ? "rgba(212,175,55,0.08)" : "rgba(212,175,55,0.12)",
        }}
      >
        <Pressable
          onPress={handleBack}
          style={{ width: 40, height: 40, alignItems: "flex-start", justifyContent: "center", borderRadius: 9999 }}
          accessibilityRole="button"
          accessibilityLabel={t.common.back}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>

        <View className="flex-1 items-center">
          <Text className="text-lg font-bold tracking-tight" style={{ color: colors.textPrimary }}>
            {t.report.title}
          </Text>
        </View>

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
        {/* ── Progress Indicator — Spring-animated bar ── */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          className="px-5 pt-4 gap-2"
        >
          <View className="flex-row justify-between items-end">
            <Text
              className="text-sm font-semibold tracking-wide uppercase"
              style={{ color: progressPercent === 100 ? "#10b981" : GOLD }}
            >
              {progressPercent < 100 ? t.report.progressFields.replace("{{progress}}", String(progress)) : t.report.readyToSend}
            </Text>
            <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>
              {t.report.completed.replace("{{percent}}", String(progressPercent))}
            </Text>
          </View>
          <View
            className="rounded-full h-2 w-full overflow-hidden"
            style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}
          >
            <Animated.View
              className="h-full w-full rounded-full"
              style={[progressBarStyle, { transformOrigin: "left center" }]}
            >
              <LinearGradient
                colors={progressPercent === 100 ? ["#10b981", "#059669"] : [GOLD, "#c5952d"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flex: 1, borderRadius: 999 }}
              />
            </Animated.View>
          </View>
        </Animated.View>

        {/* ── Title & Description ── */}
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

        {/* Gold-tinted divider */}
        <View
          className="mx-5 my-4"
          style={{ height: 1, backgroundColor: isDark ? "rgba(212,175,55,0.06)" : "rgba(212,175,55,0.1)" }}
        />

        {/* ── Section 1: Report Title ── */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          className="px-5 gap-3"
        >
          <View className="flex-row items-center gap-2">
            <SectionBadge num={1} isDark={isDark} />
            <Text className="text-sm font-bold tracking-tight" style={{ color: colors.textPrimary }}>
              {t.report.titleLabel} <Text style={{ color: "#ef4444" }}>*</Text>
            </Text>
          </View>
          <View style={getInputShadow("title")}>
            <TextInput
              className="w-full px-4 py-4 rounded-2xl text-sm font-medium"
              placeholder={t.report.titlePlaceholder}
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
              maxLength={255}
              onFocus={() => setFocusedField("title")}
              onBlur={() => setFocusedField(null)}
              style={{
                backgroundColor: isDark ? "rgba(255,255,255,0.04)" : colors.card,
                borderWidth: 1.5,
                borderColor: getInputBorderColor("title"),
                color: colors.textPrimary,
              }}
            />
          </View>
          {title.length > 0 && title.length < 5 && (
            <Animated.Text entering={FadeIn.duration(200)} className="text-xs text-red-400">
              {t.report.minChars5}
            </Animated.Text>
          )}
        </Animated.View>

        {/* ── Section 2: Identify Product ── */}
        <Animated.View
          entering={FadeInDown.delay(250).duration(400)}
          className="px-5 pt-8 gap-3"
        >
          <View className="flex-row items-center gap-2">
            <SectionBadge num={2} isDark={isDark} />
            <Text className="text-sm font-bold tracking-tight" style={{ color: colors.textPrimary }}>
              {t.report.identifyProduct}
            </Text>
          </View>
          <View className="relative" style={getInputShadow("product")}>
            <View className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10">
              <MaterialIcons name="search" size={20} color={focusedField === "product" ? GOLD : colors.textMuted} />
            </View>
            <TextInput
              className="w-full pl-11 pr-12 py-4 rounded-2xl text-sm font-medium"
              placeholder={t.report.searchPlaceholder}
              placeholderTextColor={colors.textMuted}
              value={productSearch}
              onChangeText={setProductSearch}
              onFocus={() => setFocusedField("product")}
              onBlur={() => setFocusedField(null)}
              style={{
                backgroundColor: isDark ? "rgba(255,255,255,0.04)" : colors.card,
                borderWidth: 1.5,
                borderColor: getInputBorderColor("product"),
                color: colors.textPrimary,
              }}
            />
            <PressableScale
              onPress={handleScanBarcode}
              accessibilityRole="button"
              accessibilityLabel={t.report.identifyProduct}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: [{ translateY: -16 }],
                width: 32,
                height: 32,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                backgroundColor: isDark ? "rgba(212,175,55,0.1)" : "rgba(212,175,55,0.08)",
              }}
            >
              <MaterialIcons name="qr-code-scanner" size={20} color={GOLD} />
            </PressableScale>
          </View>
        </Animated.View>

        {/* ── Section 3: Type of Violation ── */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(400)}
          className="px-5 pt-8 gap-3"
        >
          <View className="flex-row items-center gap-2">
            <SectionBadge num={3} isDark={isDark} />
            <Text className="text-sm font-bold tracking-tight" style={{ color: colors.textPrimary }}>
              {t.report.violationType} <Text style={{ color: "#ef4444" }}>*</Text>
            </Text>
          </View>
          <View className="flex-row flex-wrap gap-3">
            {VIOLATION_TYPES.map((type) => {
              const isSelected = selectedViolation === type.id;
              return (
                <PressableScale
                  key={type.id}
                  onPress={() => handleSelectViolation(type.id)}
                  style={{ width: "48%" }}
                  accessibilityRole="button"
                  accessibilityLabel={t.report[type.titleKey]}
                >
                  <View
                    className="relative p-4 rounded-2xl overflow-hidden"
                    style={{
                      borderWidth: isSelected ? 2 : 1.5,
                      borderColor: isSelected ? GOLD : colors.borderLight,
                      backgroundColor: isSelected
                        ? (isDark ? "rgba(212,175,55,0.06)" : "rgba(212,175,55,0.04)")
                        : (isDark ? "rgba(255,255,255,0.03)" : colors.card),
                      ...(isSelected ? {
                        shadowColor: GOLD,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: isDark ? 0.3 : 0.2,
                        shadowRadius: 16,
                        elevation: 6,
                      } : {}),
                    }}
                  >
                    {isSelected && (
                      <Animated.View
                        entering={ZoomIn.springify()}
                        className="absolute top-3 right-3"
                      >
                        <View
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 11,
                            backgroundColor: GOLD,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <MaterialIcons name="check" size={14} color="#ffffff" />
                        </View>
                      </Animated.View>
                    )}
                    <View
                      className="w-11 h-11 rounded-full items-center justify-center mb-3"
                      style={{
                        backgroundColor: isSelected
                          ? (isDark ? "rgba(212,175,55,0.15)" : "rgba(212,175,55,0.1)")
                          : (isDark ? "rgba(255,255,255,0.06)" : colors.backgroundSecondary),
                        borderWidth: 1,
                        borderColor: isSelected ? "rgba(212,175,55,0.3)" : colors.borderLight,
                      }}
                    >
                      <MaterialIcons
                        name={type.icon}
                        size={22}
                        color={isSelected ? GOLD : type.iconColor}
                      />
                    </View>
                    <Text className="text-sm font-bold" style={{ color: isSelected ? GOLD : colors.textPrimary }}>
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

        {/* ── Section 4: Additional Details ── */}
        <Animated.View
          entering={FadeInDown.delay(350).duration(400)}
          className="px-5 pt-8 gap-3"
        >
          <View className="flex-row items-center gap-2">
            <SectionBadge num={4} isDark={isDark} />
            <Text className="text-sm font-bold tracking-tight" style={{ color: colors.textPrimary }}>
              {t.report.additionalDetails} <Text style={{ color: "#ef4444" }}>*</Text>
            </Text>
          </View>
          <View style={getInputShadow("details")}>
            <TextInput
              className="w-full p-4 rounded-2xl text-sm font-medium"
              placeholder={t.report.detailsPlaceholder}
              placeholderTextColor={colors.textMuted}
              value={details}
              onChangeText={setDetails}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              onFocus={() => setFocusedField("details")}
              onBlur={() => setFocusedField(null)}
              style={{
                minHeight: 100,
                backgroundColor: isDark ? "rgba(255,255,255,0.04)" : colors.card,
                borderWidth: 1.5,
                borderColor: getInputBorderColor("details"),
                color: colors.textPrimary,
              }}
              maxLength={2000}
            />
          </View>
          {details.length > 0 && details.length < 10 && (
            <Animated.Text entering={FadeIn.duration(200)} className="text-xs text-red-400">
              {t.report.minChars10}
            </Animated.Text>
          )}
        </Animated.View>

        {/* ── Section 5: Photo Evidence ── */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(400)}
          className="px-5 pt-8 gap-3"
        >
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center gap-2">
              <SectionBadge num={5} isDark={isDark} />
              <Text className="text-sm font-bold tracking-tight" style={{ color: colors.textPrimary }}>
                {t.report.photoEvidence}
              </Text>
            </View>
            <View style={{ backgroundColor: GOLD_LIGHT, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: GOLD }}>
                {t.report.recommended}
              </Text>
            </View>
          </View>

          {/* Upload Zone — Gold-tinted dashed border */}
          <PressableScale
            onPress={handleAddPhoto}
            disabled={photos.length >= MAX_PHOTOS}
            accessibilityRole="button"
            accessibilityLabel={t.report.tapToAdd}
          >
            <View
              className="w-full h-36 border-2 border-dashed rounded-2xl items-center justify-center gap-2"
              style={{
                borderColor: photos.length >= MAX_PHOTOS
                  ? colors.borderLight
                  : (isDark ? "rgba(212,175,55,0.25)" : "rgba(212,175,55,0.3)"),
                backgroundColor: photos.length >= MAX_PHOTOS
                  ? (isDark ? "rgba(30,41,59,0.5)" : "rgba(243,244,246,0.5)")
                  : (isDark ? "rgba(212,175,55,0.03)" : "rgba(212,175,55,0.04)"),
                opacity: photos.length >= MAX_PHOTOS ? 0.5 : 1,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isDark ? "rgba(212,175,55,0.12)" : "rgba(212,175,55,0.08)",
                  borderWidth: 1,
                  borderColor: isDark ? "rgba(212,175,55,0.2)" : "rgba(212,175,55,0.15)",
                }}
              >
                <MaterialIcons name="add-a-photo" size={24} color={GOLD} />
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

          {/* Photo Thumbnails — ZoomIn staggered */}
          {photos.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingBottom: 8, paddingTop: 4 }}
            >
              {photos.map((photo, index) => (
                <Animated.View key={index} entering={ZoomIn.delay(index * 80).duration(250)}>
                  <PressableScale
                    onPress={() => handleRemovePhoto(index)}
                    accessibilityRole="button"
                    accessibilityLabel={`${t.report.photoEvidence} ${index + 1}`}
                  >
                    <View
                      className="relative w-20 h-20 rounded-xl overflow-hidden"
                      style={{
                        borderWidth: 1.5,
                        borderColor: isDark ? "rgba(212,175,55,0.2)" : "rgba(212,175,55,0.15)",
                      }}
                    >
                      <Image
                        source={{ uri: photo }}
                        className="w-full h-full"
                        contentFit="cover"
                        transition={200}
                      />
                      <View className="absolute inset-0 items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.35)" }}>
                        <MaterialIcons name="delete" size={20} color="#ffffff" />
                      </View>
                      {index === 0 && (
                        <View className="absolute bottom-1 right-1 rounded px-1 py-0.5" style={{ backgroundColor: "rgba(212,175,55,0.85)" }}>
                          <Text className="text-[8px] text-white font-bold uppercase tracking-wider">
                            {t.report.cover}
                          </Text>
                        </View>
                      )}
                    </View>
                  </PressableScale>
                </Animated.View>
              ))}
            </ScrollView>
          )}
        </Animated.View>

        {/* ── Allow Contact Toggle — Glass card ── */}
        <Animated.View
          entering={FadeInDown.delay(450).duration(400)}
          className="px-5 pt-4 pb-4"
        >
          <View
            className="flex-row items-center justify-between p-4 rounded-2xl"
            style={{
              backgroundColor: isDark ? "rgba(255,255,255,0.03)" : colors.card,
              borderWidth: 1,
              borderColor: isDark ? "rgba(212,175,55,0.08)" : "rgba(212,175,55,0.1)",
            }}
          >
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

      {/* ── Fixed Bottom CTA — LinearGradient + glow ── */}
      <Animated.View
        entering={FadeInUp.delay(500).duration(400)}
        className="absolute bottom-0 left-0 right-0 z-40"
        style={{
          paddingBottom: insets.bottom + 24,
          paddingTop: 16,
          paddingHorizontal: 20,
          backgroundColor: isDark ? "rgba(12,12,12,0.92)" : "rgba(243,241,237,0.92)",
          borderTopWidth: 1,
          borderTopColor: isDark ? "rgba(212,175,55,0.06)" : "rgba(212,175,55,0.1)",
        }}
      >
        <PressableScale
          onPress={handleSubmit}
          disabled={!isFormValid || createReport.isPending || isUploading}
          accessibilityRole="button"
          accessibilityLabel={t.report.submitReport}
        >
          <View
            className="w-full rounded-2xl overflow-hidden"
            style={{
              ...(isFormValid && !createReport.isPending && !isUploading
                ? {
                    shadowColor: "#10b981",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 20,
                    elevation: 8,
                  }
                : {}),
            }}
          >
            <LinearGradient
              colors={
                isFormValid && !createReport.isPending && !isUploading
                  ? ["#10b981", "#059669"]
                  : [isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ paddingVertical: 16, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }}
            >
              {createReport.isPending || isUploading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Text
                    className="font-bold text-base"
                    style={{ color: isFormValid ? "#ffffff" : colors.textMuted }}
                  >
                    {t.report.submitReport}
                  </Text>
                  <MaterialIcons
                    name="send"
                    size={20}
                    color={isFormValid ? "#ffffff" : colors.textMuted}
                  />
                </>
              )}
            </LinearGradient>
          </View>
        </PressableScale>

        <View className="flex-row items-center justify-center gap-1.5 mt-4 opacity-70">
          <MaterialIcons name="lock" size={12} color={GOLD} />
          <Text className="text-[11px] font-medium tracking-wide" style={{ color: colors.textMuted }}>
            {t.report.encryptionNotice}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}
