/**
 * Edit Profile Screen
 */

import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown, SlideInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { PressableScale } from "@/components/ui/PressableScale";
import { useMe } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";
import { useImageUpload } from "@/hooks/useImageUpload";
import { PhoneInput, LocationPicker, parseInternationalPhone, PremiumBackground } from "@/components/ui";
import { City, FRENCH_CITIES } from "@/constants/locations";

const GOLD = "#d4af37";

export default function EditProfileScreen() {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const utils = trpc.useUtils();
  const meQuery = useMe();
  const profile = meQuery.data ?? null;
  const updateMutation = trpc.profile.updateProfile.useMutation({
    onSuccess: () => utils.auth.me.invalidate(),
  });
  const { upload: uploadImage, isUploading: isUploadingAvatar } = useImageUpload();

  // Form state - initialized from profile
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [fullPhoneNumber, setFullPhoneNumber] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  
  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Initialize form with profile data
  useEffect(() => {
    if (profile && !isInitialized) {
      setDisplayName(profile.displayName || "");
      setEmail(profile.email || "");
      // Parse le numéro international (+33612345678) en format local (06 12 34 56 78)
      const parsed = parseInternationalPhone(profile.phoneNumber || "");
      setPhoneNumber(parsed.localFormatted);
      setFullPhoneNumber(parsed.fullNumber);
      setBio(profile.bio || "");
      setAvatarUrl(profile.avatarUrl || "");
      // Trouver la ville si elle existe dans le profil
      if (profile.city) {
        const city = FRENCH_CITIES.find(c => c.name === profile.city);
        if (city) setSelectedCity(city);
      }
      setIsInitialized(true);
    }
  }, [profile, isInitialized]);

  // useMe() auto-fetches on mount — no manual fetch needed

  // Check if form has changes
  const hasChanges = useMemo(() => {
    if (!profile) return false;
    return (
      displayName !== (profile.displayName || "") ||
      fullPhoneNumber !== (profile.phoneNumber || "") ||
      bio !== (profile.bio || "") ||
      avatarUrl !== (profile.avatarUrl || "") ||
      (selectedCity?.name || "") !== (profile.city || "")
    );
  }, [profile, displayName, fullPhoneNumber, bio, avatarUrl, selectedCity]);

  // Handlers for phone and city
  const handlePhoneChange = useCallback((formatted: string, full: string) => {
    setPhoneNumber(formatted);
    setFullPhoneNumber(full);
  }, []);

  const handleCitySelect = useCallback((city: City) => {
    setSelectedCity(city);
  }, []);

  // Theme colors — canonical tokens from useTheme()

  // Handle image picker → upload to R2 → set CDN URL
  const handleChangePhoto = useCallback(async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(t.editProfile.permissionRequired, t.editProfile.galleryPermission);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      try {
        const cdnUrl = await uploadImage({
          uri: result.assets[0].uri,
          type: "avatar",
        });
        setAvatarUrl(cdnUrl);
      } catch (err) {
        console.error("[EditProfile] Photo upload failed:", err);
        Alert.alert(t.common.error, t.editProfile.saveError);
      }
    }
  }, [uploadImage, t]);

  // Safe back navigation — prevents GO_BACK crash when no screen to return to
  const safeGoBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/profile" as any);
    }
  }, []);

  // Handle save - calls tRPC mutation
  const handleSave = useCallback(async () => {
    if (!hasChanges) {
      safeGoBack();
      return;
    }

    setIsSaving(true);

    try {
      await updateMutation.mutateAsync({
        displayName: displayName || undefined,
        phoneNumber: fullPhoneNumber || undefined,
        bio: bio || undefined,
        avatarUrl: avatarUrl || undefined,
        city: selectedCity?.name || undefined,
      });

      Alert.alert(t.common.success, t.editProfile.saved, [
        { text: "OK", onPress: safeGoBack }
      ]);
    } catch {
      Alert.alert(t.common.error, t.editProfile.saveError);
    } finally {
      setIsSaving(false);
    }
  }, [hasChanges, displayName, fullPhoneNumber, bio, avatarUrl, selectedCity, updateMutation, t, safeGoBack]);

  // Render input field
  const renderInputField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    icon: keyof typeof MaterialIcons.glyphMap,
    placeholder: string,
    options?: {
      optional?: boolean;
      keyboardType?: "default" | "email-address" | "phone-pad";
      autoCapitalize?: "none" | "sentences" | "words" | "characters";
      editable?: boolean;
      fieldName?: string;
    }
  ) => {
    const isEditable = options?.editable !== false;
    const fieldId = options?.fieldName ?? label;
    const isFocused = focusedField === fieldId;
    return (
      <View style={{ marginBottom: 20 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: colors.textPrimary,
            }}
          >
            {label}
          </Text>
          {options?.optional && (
            <Text
              style={{
                fontSize: 12,
                color: colors.textSecondary,
              }}
            >
              {t.editProfile.optional}
            </Text>
          )}
        </View>
        <View style={{ position: "relative" }}>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            keyboardType={options?.keyboardType || "default"}
            autoCapitalize={options?.autoCapitalize || "sentences"}
            editable={isEditable}
            onFocus={() => setFocusedField(fieldId)}
            onBlur={() => setFocusedField(null)}
            accessibilityLabel={label}
            accessibilityState={{ disabled: !isEditable }}
            style={{
              width: "100%",
              borderRadius: 12,
              backgroundColor: isEditable ? (isDark ? "rgba(255,255,255,0.03)" : colors.card) : (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)"),
              paddingVertical: 14,
              paddingLeft: 44,
              paddingRight: 16,
              fontSize: 15,
              color: isEditable ? colors.textPrimary : colors.textSecondary,
              borderWidth: 1,
              borderColor: isFocused ? (isDark ? "rgba(212,175,55,0.5)" : "rgba(212,175,55,0.4)") : (isDark ? "rgba(212,175,55,0.08)" : "rgba(212,175,55,0.1)"),
              ...(isFocused ? { shadowColor: GOLD, shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 4 } : {}),
            }}
          />
          <MaterialIcons
            name={icon}
            size={20}
            color={isFocused ? GOLD : colors.textSecondary}
            style={{
              position: "absolute",
              left: 14,
              top: 14,
            }}
          />
        </View>
      </View>
    );
  };

  // Show loading skeleton while fetching profile
  if (meQuery.isLoading) {
    return (
      <View style={{ flex: 1 }}>
        <PremiumBackground />
        <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 16, color: colors.textSecondary }}>{t.editProfile.loadingProfile}</Text>
        </SafeAreaView>
      </View>
    );
  }

  // Show error state if profile failed to load
  if (meQuery.isError && !profile) {
    return (
      <View style={{ flex: 1 }}>
        <PremiumBackground />
        <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 20 }}>
          <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <MaterialIcons name="error-outline" size={48} color="#ef4444" style={{ marginBottom: 16 }} />
        <Text style={{
          fontSize: 18,
          fontWeight: "700",
          color: colors.textPrimary,
          textAlign: "center",
          marginBottom: 8
        }}>
          {t.errors.generic}
        </Text>
        <Text style={{
          fontSize: 14,
          color: colors.textSecondary,
          textAlign: "center",
          marginBottom: 24
        }}>
          {meQuery.error?.message ?? t.editProfile.saveFailed}
        </Text>
        <PressableScale
          onPress={() => meQuery.refetch()}
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
          }}
          accessibilityRole="button"
          accessibilityLabel={t.common.retry}
        >
          <Text style={{ color: "#0d1b13", fontWeight: "600" }}>{t.common.retry}</Text>
        </PressableScale>
        <PressableScale
          onPress={safeGoBack}
          style={{
            marginTop: 16,
            padding: 12,
          }}
          accessibilityRole="button"
          accessibilityLabel={t.common.back}
        >
          <Text style={{ color: colors.textSecondary }}>{t.common.back}</Text>
        </PressableScale>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <PremiumBackground />
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(400)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingTop: 32,
            paddingBottom: 16,
          }}
        >
          {/* Back Button */}
          <PressableScale
            onPress={safeGoBack}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: isDark ? "rgba(255,255,255,0.03)" : colors.card,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: isDark ? "rgba(212,175,55,0.08)" : "rgba(212,175,55,0.1)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
            accessibilityRole="button"
            accessibilityLabel={t.common.back}
          >
            <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
          </PressableScale>

          {/* Title */}
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: colors.textPrimary,
            }}
            accessibilityRole="header"
          >
            {t.editProfile.title}
          </Text>

          {/* Spacer for alignment */}
          <View style={{ width: 44 }} />
        </Animated.View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar Section */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            style={{
              alignItems: "center",
              marginBottom: 32,
              marginTop: 8,
            }}
          >
            <View style={{ position: "relative" }}>
              {/* Avatar Image */}
              <View
                style={{
                  width: 112,
                  height: 112,
                  borderRadius: 56,
                  overflow: "hidden",
                  borderWidth: 3,
                  borderColor: GOLD,
                  shadowColor: GOLD,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  elevation: 6,
                }}
              >
                {avatarUrl ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <View
                    style={{
                      width: "100%",
                      height: "100%",
                      backgroundColor: "rgba(19, 236, 106, 0.2)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 40,
                        fontWeight: "700",
                        color: colors.primary,
                      }}
                    >
                      {displayName.charAt(0).toUpperCase() || "U"}
                    </Text>
                  </View>
                )}
              </View>

              {/* Camera Button */}
              <PressableScale
                onPress={handleChangePhoto}
                style={{
                  position: "absolute",
                  bottom: -4,
                  right: -4,
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderColor: isDark ? colors.background : "#ffffff",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 3,
                }}
                accessibilityRole="button"
                accessibilityLabel={t.editProfile.changePhotoLabel}
              >
                <MaterialIcons name="photo-camera" size={18} color="#ffffff" />
              </PressableScale>
            </View>

            {/* Change Photo Text */}
            <PressableScale
              onPress={handleChangePhoto}
              style={{ marginTop: 12 }}
              accessibilityRole="button"
              accessibilityLabel={t.editProfile.changePhoto}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: colors.textSecondary,
                }}
              >
                {t.editProfile.changePhoto}
              </Text>
            </PressableScale>
          </Animated.View>

          {/* Form Fields */}
          <Animated.View entering={FadeInDown.delay(150).duration(400)}>
            {renderInputField(
              t.editProfile.fullName,
              displayName,
              setDisplayName,
              "person",
              t.editProfile.yourName
            )}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            {renderInputField(
              t.editProfile.email,
              email,
              () => {}, // Email is read-only
              "mail",
              "email@exemple.com",
              { keyboardType: "email-address", autoCapitalize: "none", editable: false }
            )}
          </Animated.View>

          {/* Phone Number with PhoneInput */}
          <Animated.View entering={FadeInDown.delay(250).duration(400)} style={{ marginBottom: 20 }}>
            <PhoneInput
              label={t.editProfile.phone}
              value={phoneNumber}
              onChangeText={handlePhoneChange}
              hint={t.editProfile.phoneHint}
              defaultCountryCode="FR"
            />
          </Animated.View>

          {/* Location with LocationPicker */}
          <Animated.View entering={FadeInDown.delay(275).duration(400)} style={{ marginBottom: 20 }}>
            <LocationPicker
              label={t.editProfile.yourCity}
              value={selectedCity?.name}
              onSelect={handleCitySelect}
              placeholder={t.editProfile.selectCity}
              hint={t.editProfile.cityHint}
              showGeolocation={true}
            />
          </Animated.View>

          {/* Bio Field */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: colors.textPrimary,
                }}
              >
                {t.editProfile.bio}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                }}
              >
                {t.editProfile.optional}
              </Text>
            </View>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder={t.editProfile.bioHint}
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              onFocus={() => setFocusedField("bio")}
              onBlur={() => setFocusedField(null)}
              accessibilityLabel="Bio"
              accessibilityHint="Décrivez-vous en quelques mots"
              style={{
                width: "100%",
                borderRadius: 12,
                backgroundColor: isDark ? "rgba(255,255,255,0.03)" : colors.card,
                paddingVertical: 12,
                paddingHorizontal: 16,
                fontSize: 15,
                color: colors.textPrimary,
                borderWidth: 1,
                borderColor: focusedField === "bio" ? (isDark ? "rgba(212,175,55,0.5)" : "rgba(212,175,55,0.4)") : (isDark ? "rgba(212,175,55,0.08)" : "rgba(212,175,55,0.1)"),
                minHeight: 100,
                ...(focusedField === "bio" ? { shadowColor: GOLD, shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 4 } : {}),
              }}
            />
          </Animated.View>
        </ScrollView>

        {/* Fixed Bottom Save Button */}
        <Animated.View
          entering={SlideInDown.delay(400).duration(400)}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 32,
            backgroundColor: isDark ? "rgba(16, 34, 23, 0.95)" : "rgba(246, 248, 247, 0.95)",
            borderTopWidth: 1,
            borderTopColor: isDark ? "rgba(212,175,55,0.08)" : "rgba(212,175,55,0.12)",
          }}
        >
          <PressableScale
            onPress={handleSave}
            disabled={isSaving || isUploadingAvatar || !hasChanges}
            style={{
              borderRadius: 16,
              overflow: "hidden",
              ...(hasChanges ? {
                shadowColor: "#10b981",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 20,
                elevation: 8,
              } : {}),
            }}
            accessibilityRole="button"
            accessibilityLabel={isSaving ? t.editProfile.saving : hasChanges ? t.common.saveChanges : t.common.noChanges}
          >
            {hasChanges ? (
              <LinearGradient
                colors={["#10b981", "#059669"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingVertical: 16, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, borderRadius: 16 }}
              >
                {isSaving ? (
                  <>
                    <ActivityIndicator size="small" color="#0d1b13" style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 16, fontWeight: "700", color: "#0d1b13" }}>
                      {t.editProfile.saving}
                    </Text>
                  </>
                ) : (
                  <Text style={{ fontSize: 16, fontWeight: "700", color: "#0d1b13" }}>
                    {t.common.saveChanges}
                  </Text>
                )}
              </LinearGradient>
            ) : (
              <View style={{ paddingVertical: 16, alignItems: "center", justifyContent: "center", backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)", borderRadius: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textSecondary }}>
                  {t.common.noChanges}
                </Text>
              </View>
            )}
          </PressableScale>
        </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
