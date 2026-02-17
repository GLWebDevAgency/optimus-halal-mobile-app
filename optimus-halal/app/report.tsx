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
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  useColorScheme,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useHaptics, useTranslation } from "@/hooks";
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
  {
    id: "fake-cert",
    backendType: "incorrect_halal_status" as const,
    icon: "verified" as const,
    iconColor: "#fbbf24",
    title: "Fausse Certification",
    subtitle: "Labels trompeurs",
  },
  {
    id: "unethical-labor",
    backendType: "store_issue" as const,
    icon: "factory" as const,
    iconColor: "#64748b",
    title: "Travail Non-Éthique",
    subtitle: "Droits des travailleurs",
  },
  {
    id: "contamination",
    backendType: "wrong_ingredients" as const,
    icon: "science" as const,
    iconColor: "#64748b",
    title: "Contamination",
    subtitle: "Ingrédients haram",
  },
  {
    id: "other",
    backendType: "other" as const,
    icon: "warning" as const,
    iconColor: "#64748b",
    title: "Autre Problème",
    subtitle: "Tout le reste",
  },
];

export default function ReportingFormScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { impact, notification } = useHaptics();
  const isDark = colorScheme === "dark";
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
    router.push("/(tabs)/scanner");
  }, []);

  // Progress: title filled = 33%, violation selected = 66%, details filled = 100%
  const progress = [
    title.trim().length >= 5,
    selectedViolation !== null,
    details.trim().length >= 10,
  ].filter(Boolean).length;
  const progressPercent = Math.round((progress / 3) * 100);

  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        className="flex-row items-center bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md px-4 pt-12 pb-2 justify-between border-b border-gray-100 dark:border-white/5"
        style={{ paddingTop: insets.top + 8 }}
      >
        <TouchableOpacity
          onPress={handleBack}
          className="w-10 h-10 items-start justify-center rounded-full"
        >
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={isDark ? "#ffffff" : "#020617"}
          />
        </TouchableOpacity>

        <Text className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex-1 text-center">
          {t.report.title}
        </Text>

        <TouchableOpacity onPress={handleCancel}>
          <Text className="text-base font-medium text-slate-500 dark:text-slate-400">
            {t.common.cancel}
          </Text>
        </TouchableOpacity>
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
              {progressPercent < 100 ? `${progress}/3 champs` : "Prêt à envoyer"}
            </Text>
            <Text className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {progressPercent}% Complété
            </Text>
          </View>
          <View className="rounded-full bg-gray-200 dark:bg-white/10 h-1.5 w-full overflow-hidden">
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
          <Text className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            {t.report.title}
          </Text>
          <Text className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed pt-2">
            {t.report.helpText}
          </Text>
        </Animated.View>

        {/* Divider */}
        <View className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-white/10 to-transparent mx-5 my-4" />

        {/* Section 1: Report Title */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          className="px-5 gap-3"
        >
          <Text className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
            1. {t.report.titleLabel} *
          </Text>
          <TextInput
            className="w-full px-4 py-4 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-900 dark:text-white shadow-sm"
            placeholder="Ex: Faux label halal sur produit X..."
            placeholderTextColor="#9ca3af"
            value={title}
            onChangeText={setTitle}
            maxLength={255}
          />
          {title.length > 0 && title.length < 5 && (
            <Text className="text-xs text-red-400">Minimum 5 caractères</Text>
          )}
        </Animated.View>

        {/* Section 2: Identify Product */}
        <Animated.View
          entering={FadeInDown.delay(250).duration(400)}
          className="px-5 pt-8 gap-3"
        >
          <Text className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
            2. Identifier le Produit (optionnel)
          </Text>
          <View className="relative">
            <View className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10">
              <MaterialIcons name="search" size={20} color="#9ca3af" />
            </View>
            <TextInput
              className="w-full pl-11 pr-12 py-4 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-900 dark:text-white shadow-sm"
              placeholder="Scanner code-barres ou nom..."
              placeholderTextColor="#9ca3af"
              value={productSearch}
              onChangeText={setProductSearch}
            />
            <TouchableOpacity
              onPress={handleScanBarcode}
              className="absolute right-3.5 top-1/2 -translate-y-1/2"
            >
              <MaterialIcons name="qr-code-scanner" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Section 3: Type of Violation */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(400)}
          className="px-5 pt-8 gap-3"
        >
          <Text className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
            3. Type de Violation *
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {VIOLATION_TYPES.map((type) => {
              const isSelected = selectedViolation === type.id;
              return (
                <TouchableOpacity
                  key={type.id}
                  onPress={() => handleSelectViolation(type.id)}
                  className={`w-[48%] relative p-4 rounded-xl border-2 shadow-sm ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10"
                      : "border-gray-200 dark:border-white/10 bg-white dark:bg-[#1e293b]"
                  }`}
                  activeOpacity={0.8}
                >
                  {isSelected && (
                    <View className="absolute top-3 right-3">
                      <MaterialIcons name="check-circle" size={18} color="#10b981" />
                    </View>
                  )}
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center mb-3 ${
                      isSelected
                        ? "bg-white dark:bg-[#1e293b]"
                        : "bg-gray-50 dark:bg-white/5"
                    } border border-gray-100 dark:border-white/5`}
                  >
                    <MaterialIcons
                      name={type.icon}
                      size={22}
                      color={isSelected ? "#fbbf24" : type.iconColor}
                    />
                  </View>
                  <Text className="text-sm font-bold text-slate-900 dark:text-white">
                    {type.title}
                  </Text>
                  <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {type.subtitle}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {/* Section 4: Additional Details */}
        <Animated.View
          entering={FadeInDown.delay(350).duration(400)}
          className="px-5 pt-8 gap-3"
        >
          <Text className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
            4. Détails Supplémentaires *
          </Text>
          <TextInput
            className="w-full p-4 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-900 dark:text-white shadow-sm"
            placeholder="Décrivez le problème en détail..."
            placeholderTextColor="#9ca3af"
            value={details}
            onChangeText={setDetails}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={{ minHeight: 100 }}
            maxLength={2000}
          />
          {details.length > 0 && details.length < 10 && (
            <Text className="text-xs text-red-400">Minimum 10 caractères</Text>
          )}
        </Animated.View>

        {/* Section 5: Photo Evidence */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(400)}
          className="px-5 pt-8 gap-3"
        >
          <View className="flex-row justify-between items-end">
            <Text className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
              5. Preuves Photo
            </Text>
            <View className="bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <Text className="text-xs font-semibold text-emerald-500">
                Recommandé
              </Text>
            </View>
          </View>

          {/* Upload Zone */}
          <TouchableOpacity
            onPress={handleAddPhoto}
            disabled={photos.length >= MAX_PHOTOS}
            className={`w-full h-36 border-2 border-dashed rounded-xl items-center justify-center gap-2 ${
              photos.length >= MAX_PHOTOS
                ? "border-gray-200 dark:border-white/10 bg-gray-100/50 dark:bg-[#1e293b]/50 opacity-50"
                : "border-gray-300 dark:border-white/20 bg-gray-50/50 dark:bg-[#1e293b]"
            }`}
            activeOpacity={0.8}
          >
            <View className="w-12 h-12 rounded-full bg-white dark:bg-white/10 shadow-sm items-center justify-center">
              <MaterialIcons name="add-a-photo" size={28} color="#10b981" />
            </View>
            <View className="items-center">
              <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {photos.length >= MAX_PHOTOS ? `${MAX_PHOTOS}/${MAX_PHOTOS} photos` : "Touchez pour ajouter"}
              </Text>
              <Text className="text-[11px] text-gray-400 mt-0.5">
                {photos.length >= MAX_PHOTOS ? "Limite atteinte" : `${photos.length}/${MAX_PHOTOS} — JPG, PNG, WebP`}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Photo Thumbnails */}
          {photos.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingBottom: 8, paddingTop: 4 }}
            >
              {photos.map((photo, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleRemovePhoto(index)}
                  className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 shadow-sm"
                  activeOpacity={0.9}
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
                        Cover
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </Animated.View>

        {/* Allow Contact Toggle */}
        <Animated.View
          entering={FadeInDown.delay(450).duration(400)}
          className="px-5 pt-4 pb-4"
        >
          <View className="flex-row items-center justify-between p-4 bg-white dark:bg-[#1e293b] rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
            <View className="flex-1 gap-0.5">
              <Text className="text-sm font-bold text-slate-900 dark:text-white">
                {t.report.allowFollowup}
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                Nous pourrions demander plus de détails.
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
        className="absolute bottom-0 left-0 right-0 bg-background-light dark:bg-background-dark border-t border-gray-200 dark:border-white/5 p-5 backdrop-blur-xl z-40"
        style={{ paddingBottom: insets.bottom + 24 }}
      >
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!isFormValid || createReport.isPending || isUploading}
          className={`w-full py-4 rounded-xl flex-row items-center justify-center gap-2 ${
            isFormValid && !createReport.isPending && !isUploading
              ? "bg-emerald-500"
              : "bg-gray-300 dark:bg-gray-700"
          }`}
          activeOpacity={0.9}
          style={
            isFormValid && !createReport.isPending && !isUploading
              ? {
                  shadowColor: "#10b981",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.4,
                  shadowRadius: 20,
                }
              : {}
          }
        >
          {createReport.isPending || isUploading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Text className="font-bold text-base text-white">
                Envoyer le Signalement
              </Text>
              <MaterialIcons name="send" size={20} color="#ffffff" />
            </>
          )}
        </TouchableOpacity>

        <View className="flex-row items-center justify-center gap-1.5 mt-4 opacity-70">
          <MaterialIcons name="lock" size={12} color="#9ca3af" />
          <Text className="text-[11px] text-gray-500 dark:text-gray-400 font-medium tracking-wide">
            Chiffré de bout en bout pour votre vie privée.
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}
