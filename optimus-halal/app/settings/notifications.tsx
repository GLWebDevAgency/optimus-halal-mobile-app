/**
 * Notification Preferences Screen
 * Faithful reproduction of the HTML template design
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  StatusBar,
} from "react-native";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { usePreferencesStore } from "@/store";
import { useTheme } from "@/hooks/useTheme";

// Frequency options
type FrequencyOption = "daily" | "weekly" | "realtime";

// Notification settings interface
interface NotificationCategory {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: {
    light: { bg: string; text: string };
    dark: { bg: string; text: string };
  };
  key: string;
}

const GENERAL_SETTINGS = [
  {
    id: "push",
    name: "Push Notifications",
    description: "Activer toutes les notifications",
    icon: "notifications-active" as keyof typeof MaterialIcons.glyphMap,
    iconColor: {
      light: { bg: "rgba(19, 236, 106, 0.1)", text: "#13ec6a" },
      dark: { bg: "rgba(19, 236, 106, 0.1)", text: "#13ec6a" },
    },
    key: "pushEnabled",
  },
  {
    id: "sound",
    name: "Sons & Vibreur",
    description: "Alertes sonores",
    icon: "volume-up" as keyof typeof MaterialIcons.glyphMap,
    iconColor: {
      light: { bg: "rgba(59, 130, 246, 0.1)", text: "#3b82f6" },
      dark: { bg: "rgba(96, 165, 250, 0.1)", text: "#60a5fa" },
    },
    key: "soundEnabled",
  },
];

const CATEGORY_SETTINGS: NotificationCategory[] = [
  {
    id: "ethical",
    name: "Alertes Éthiques",
    description: "Mises à jour sur les marques",
    icon: "eco",
    iconColor: {
      light: { bg: "rgba(34, 197, 94, 0.1)", text: "#22c55e" },
      dark: { bg: "rgba(74, 222, 128, 0.1)", text: "#4ade80" },
    },
    key: "ethicalAlerts",
  },
  {
    id: "products",
    name: "Nouveaux Produits",
    description: "Sorties et disponibilités",
    icon: "inventory-2",
    iconColor: {
      light: { bg: "rgba(249, 115, 22, 0.1)", text: "#f97316" },
      dark: { bg: "rgba(251, 146, 60, 0.1)", text: "#fb923c" },
    },
    key: "newProducts",
  },
  {
    id: "offers",
    name: "Offres & Promos",
    description: "Bons plans partenaires",
    icon: "local-offer",
    iconColor: {
      light: { bg: "rgba(168, 85, 247, 0.1)", text: "#a855f7" },
      dark: { bg: "rgba(192, 132, 252, 0.1)", text: "#c084fc" },
    },
    key: "offersPromos",
  },
];

const FREQUENCY_OPTIONS = [
  { id: "daily" as FrequencyOption, name: "Résumé quotidien" },
  { id: "weekly" as FrequencyOption, name: "Résumé hebdomadaire" },
  { id: "realtime" as FrequencyOption, name: "En temps réel" },
];

export default function NotificationsScreen() {
  const { notifications, setNotificationPref } = usePreferencesStore();
  const { colors, isDark } = useTheme();

  // Local state for notification preferences
  const [pushEnabled, setPushEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [ethicalAlerts, setEthicalAlerts] = useState(true);
  const [newProducts, setNewProducts] = useState(false);
  const [offersPromos, setOffersPromos] = useState(true);
  const [frequency, setFrequency] = useState<FrequencyOption>("daily");

  // Theme-aware colors
  const themeColors = {
    background: isDark ? "#102217" : "#f6f8f7",
    card: isDark ? "#1a2e22" : "#ffffff",
    cardBorder: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
    textPrimary: isDark ? "#e8f5e9" : "#0d1b13",
    textSecondary: isDark ? "#9ca3af" : "#4b5563",
    primary: "#13ec6a",
    toggleOff: isDark ? "#2d4436" : "#e0e0e0",
    headerBorder: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.1)",
  };

  // Get toggle value for a setting
  const getToggleValue = (key: string): boolean => {
    switch (key) {
      case "pushEnabled":
        return pushEnabled;
      case "soundEnabled":
        return soundEnabled;
      case "ethicalAlerts":
        return ethicalAlerts;
      case "newProducts":
        return newProducts;
      case "offersPromos":
        return offersPromos;
      default:
        return false;
    }
  };

  // Set toggle value for a setting
  const setToggleValue = (key: string, value: boolean) => {
    switch (key) {
      case "pushEnabled":
        setPushEnabled(value);
        break;
      case "soundEnabled":
        setSoundEnabled(value);
        break;
      case "ethicalAlerts":
        setEthicalAlerts(value);
        break;
      case "newProducts":
        setNewProducts(value);
        break;
      case "offersPromos":
        setOffersPromos(value);
        break;
    }
  };

  // Render setting item with toggle
  const renderSettingItem = (
    setting: typeof GENERAL_SETTINGS[0],
    isLast: boolean
  ) => {
    const iconColors = isDark ? setting.iconColor.dark : setting.iconColor.light;
    const isEnabled = getToggleValue(setting.key);

    return (
      <View
        key={setting.id}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 16,
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: themeColors.cardBorder,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: iconColors.bg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIcons name={setting.icon} size={22} color={iconColors.text} />
          </View>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: themeColors.textPrimary,
              }}
            >
              {setting.name}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: themeColors.textSecondary,
                marginTop: 2,
              }}
            >
              {setting.description}
            </Text>
          </View>
        </View>
        <Switch
          value={isEnabled}
          onValueChange={(value) => setToggleValue(setting.key, value)}
          trackColor={{ false: themeColors.toggleOff, true: themeColors.primary }}
          thumbColor="#ffffff"
          ios_backgroundColor={themeColors.toggleOff}
        />
      </View>
    );
  };

  // Render category setting item
  const renderCategoryItem = (
    category: NotificationCategory,
    isLast: boolean
  ) => {
    const iconColors = isDark ? category.iconColor.dark : category.iconColor.light;
    const isEnabled = getToggleValue(category.key);

    return (
      <View
        key={category.id}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 16,
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: themeColors.cardBorder,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: iconColors.bg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIcons name={category.icon} size={22} color={iconColors.text} />
          </View>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: themeColors.textPrimary,
              }}
            >
              {category.name}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: themeColors.textSecondary,
                marginTop: 2,
              }}
            >
              {category.description}
            </Text>
          </View>
        </View>
        <Switch
          value={isEnabled}
          onValueChange={(value) => setToggleValue(category.key, value)}
          trackColor={{ false: themeColors.toggleOff, true: themeColors.primary }}
          thumbColor="#ffffff"
          ios_backgroundColor={themeColors.toggleOff}
        />
      </View>
    );
  };

  // Render frequency option
  const renderFrequencyOption = (
    option: typeof FREQUENCY_OPTIONS[0],
    isLast: boolean
  ) => {
    const isSelected = frequency === option.id;

    return (
      <TouchableOpacity
        key={option.id}
        onPress={() => setFrequency(option.id)}
        activeOpacity={0.7}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 16,
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: themeColors.cardBorder,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: "500",
            color: isSelected ? themeColors.textPrimary : themeColors.textSecondary,
          }}
        >
          {option.name}
        </Text>
        {isSelected && (
          <MaterialIcons name="check" size={20} color={themeColors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingTop: 32,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: themeColors.headerBorder,
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
          }}
        >
          <MaterialIcons name="arrow-back" size={22} color={themeColors.textPrimary} />
        </TouchableOpacity>

        {/* Title Section */}
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: themeColors.textPrimary,
            }}
          >
            Notifications
          </Text>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "500",
              color: themeColors.textSecondary,
              marginTop: 2,
            }}
          >
            Gérez vos préférences
          </Text>
        </View>

        {/* More Options Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: themeColors.card,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialIcons name="more-vert" size={22} color={themeColors.textSecondary} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingVertical: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* General Section */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={{ paddingHorizontal: 20 }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              letterSpacing: 1,
              textTransform: "uppercase",
              color: themeColors.textSecondary,
              marginBottom: 16,
              paddingLeft: 4,
            }}
          >
            Général
          </Text>
          <View
            style={{
              backgroundColor: themeColors.card,
              borderRadius: 16,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: themeColors.cardBorder,
            }}
          >
            {GENERAL_SETTINGS.map((setting, index) =>
              renderSettingItem(setting, index === GENERAL_SETTINGS.length - 1)
            )}
          </View>
        </Animated.View>

        {/* Categories Section */}
        <Animated.View
          entering={FadeInDown.delay(150).duration(400)}
          style={{ paddingHorizontal: 20, marginTop: 32 }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              letterSpacing: 1,
              textTransform: "uppercase",
              color: themeColors.textSecondary,
              marginBottom: 16,
              paddingLeft: 4,
            }}
          >
            Catégories
          </Text>
          <View
            style={{
              backgroundColor: themeColors.card,
              borderRadius: 16,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: themeColors.cardBorder,
            }}
          >
            {CATEGORY_SETTINGS.map((category, index) =>
              renderCategoryItem(category, index === CATEGORY_SETTINGS.length - 1)
            )}
          </View>
        </Animated.View>

        {/* Frequency Section */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={{ paddingHorizontal: 20, marginTop: 32, marginBottom: 32 }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              letterSpacing: 1,
              textTransform: "uppercase",
              color: themeColors.textSecondary,
              marginBottom: 16,
              paddingLeft: 4,
            }}
          >
            Fréquence
          </Text>
          <View
            style={{
              backgroundColor: themeColors.card,
              borderRadius: 16,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: themeColors.cardBorder,
            }}
          >
            {FREQUENCY_OPTIONS.map((option, index) =>
              renderFrequencyOption(option, index === FREQUENCY_OPTIONS.length - 1)
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
