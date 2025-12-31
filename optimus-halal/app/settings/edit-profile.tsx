/**
 * Edit Profile Screen
 * Faithful reproduction of the HTML template design
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Image,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown, SlideInDown } from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";
import { useAuthStore } from "@/store";
import { useTheme } from "@/hooks/useTheme";

export default function EditProfileScreen() {
  const { user, setUser } = useAuthStore();
  const { colors, isDark } = useTheme();

  // Form state
  const [fullName, setFullName] = useState(user?.fullName || "Yassine Benali");
  const [username, setUsername] = useState("@yassine_b");
  const [email, setEmail] = useState(user?.email || "yassine.b@email.com");
  const [location, setLocation] = useState("Paris, France");
  const [bio, setBio] = useState("Consommateur conscient à la recherche de produits sains et éthiques.");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");

  // Theme-aware colors
  const themeColors = {
    background: isDark ? "#102217" : "#f6f8f7",
    card: isDark ? "#1a2e22" : "#ffffff",
    cardBorder: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
    textPrimary: isDark ? "#e8f5e9" : "#0d1b13",
    textSecondary: isDark ? "#9ca3af" : "#4b5563",
    primary: "#13ec6a",
    primaryDark: "#0ea64b",
    inputRing: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
    placeholderText: isDark ? "#6b7280" : "#9ca3af",
    bottomBorder: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
  };

  // Handle image picker
  const handleChangePhoto = useCallback(async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert("Permission requise", "Veuillez autoriser l'accès à la galerie pour changer votre photo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUrl(result.assets[0].uri);
    }
  }, []);

  // Handle save
  const handleSave = useCallback(() => {
    if (user) {
      setUser({
        ...user,
        fullName,
        email,
        avatarUrl,
      });
    }
    Alert.alert("Succès", "Vos modifications ont été enregistrées.", [
      { text: "OK", onPress: () => router.back() }
    ]);
  }, [user, fullName, email, avatarUrl, setUser]);

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
    }
  ) => {
    return (
      <View style={{ marginBottom: 20 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: themeColors.textPrimary,
            }}
          >
            {label}
          </Text>
          {options?.optional && (
            <Text
              style={{
                fontSize: 12,
                color: themeColors.textSecondary,
              }}
            >
              Optionnel
            </Text>
          )}
        </View>
        <View style={{ position: "relative" }}>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={themeColors.placeholderText}
            keyboardType={options?.keyboardType || "default"}
            autoCapitalize={options?.autoCapitalize || "sentences"}
            style={{
              width: "100%",
              borderRadius: 12,
              backgroundColor: themeColors.card,
              paddingVertical: 14,
              paddingLeft: 44,
              paddingRight: 16,
              fontSize: 15,
              color: themeColors.textPrimary,
              borderWidth: 1,
              borderColor: themeColors.inputRing,
            }}
          />
          <MaterialIcons
            name={icon}
            size={20}
            color={themeColors.textSecondary}
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.background }}>
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
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: themeColors.card,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: themeColors.cardBorder,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            <MaterialIcons name="arrow-back" size={22} color={themeColors.textPrimary} />
          </TouchableOpacity>

          {/* Title */}
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: themeColors.textPrimary,
            }}
          >
            Modifier le profil
          </Text>

          {/* Spacer for alignment */}
          <View style={{ width: 40 }} />
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
                  borderWidth: 4,
                  borderColor: themeColors.card,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                {avatarUrl ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
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
                        color: themeColors.primary,
                      }}
                    >
                      {fullName.charAt(0).toUpperCase() || "U"}
                    </Text>
                  </View>
                )}
              </View>

              {/* Camera Button */}
              <TouchableOpacity
                onPress={handleChangePhoto}
                activeOpacity={0.8}
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: themeColors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderColor: isDark ? themeColors.background : "#ffffff",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <MaterialIcons name="photo-camera" size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Change Photo Text */}
            <TouchableOpacity onPress={handleChangePhoto} style={{ marginTop: 12 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: themeColors.textSecondary,
                }}
              >
                Changer la photo
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Form Fields */}
          <Animated.View entering={FadeInDown.delay(150).duration(400)}>
            {renderInputField(
              "Nom complet",
              fullName,
              setFullName,
              "person",
              "Votre nom"
            )}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            {renderInputField(
              "Nom d'utilisateur",
              username,
              setUsername,
              "alternate-email",
              "@username",
              { autoCapitalize: "none" }
            )}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(250).duration(400)}>
            {renderInputField(
              "Adresse email",
              email,
              setEmail,
              "mail",
              "email@exemple.com",
              { keyboardType: "email-address", autoCapitalize: "none" }
            )}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            {renderInputField(
              "Localisation",
              location,
              setLocation,
              "location-on",
              "Ville, Pays",
              { optional: true }
            )}
          </Animated.View>

          {/* Bio Field */}
          <Animated.View entering={FadeInDown.delay(350).duration(400)} style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: themeColors.textPrimary,
                marginBottom: 6,
              }}
            >
              Bio
            </Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Dites quelque chose sur vous..."
              placeholderTextColor={themeColors.placeholderText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{
                width: "100%",
                borderRadius: 12,
                backgroundColor: themeColors.card,
                paddingVertical: 12,
                paddingHorizontal: 16,
                fontSize: 15,
                color: themeColors.textPrimary,
                borderWidth: 1,
                borderColor: themeColors.inputRing,
                minHeight: 100,
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
            borderTopColor: themeColors.bottomBorder,
          }}
        >
          <TouchableOpacity
            onPress={handleSave}
            activeOpacity={0.9}
            style={{
              backgroundColor: themeColors.primary,
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 4,
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.05)",
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: "#0d1b13",
              }}
            >
              Enregistrer les modifications
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
