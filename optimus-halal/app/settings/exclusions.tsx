/**
 * Dietary Exclusions Screen
 * Faithful reproduction of the HTML template design
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  StatusBar,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown, SlideInDown } from "react-native-reanimated";
import { PressableScale } from "@/components/ui/PressableScale";
import { usePreferencesStore } from "@/store";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks";

const { width } = Dimensions.get("window");

// Common allergens for quick selection grid
interface Allergen {
  id: string;
  name: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  description: string;
  iconColor: {
    light: { bg: string; text: string };
    dark: { bg: string; text: string };
  };
}

const COMMON_ALLERGENS: Allergen[] = [
  {
    id: "gluten",
    name: "Gluten",
    icon: "bakery-dining",
    description: "Blé, Orge, Seigle",
    iconColor: {
      light: { bg: "rgba(249, 115, 22, 0.1)", text: "#ea580c" },
      dark: { bg: "rgba(251, 146, 60, 0.1)", text: "#fb923c" },
    },
  },
  {
    id: "lactose",
    name: "Lactose",
    icon: "water-drop",
    description: "Produits laitiers",
    iconColor: {
      light: { bg: "rgba(59, 130, 246, 0.1)", text: "#2563eb" },
      dark: { bg: "rgba(96, 165, 250, 0.1)", text: "#60a5fa" },
    },
  },
  {
    id: "eggs",
    name: "Œufs",
    icon: "egg",
    description: "Œufs et dérivés",
    iconColor: {
      light: { bg: "rgba(245, 158, 11, 0.1)", text: "#d97706" },
      dark: { bg: "rgba(251, 191, 36, 0.1)", text: "#fbbf24" },
    },
  },
  {
    id: "peanuts",
    name: "Arachides",
    icon: "spa",
    description: "Famille des légumineuses",
    iconColor: {
      light: { bg: "rgba(239, 68, 68, 0.1)", text: "#dc2626" },
      dark: { bg: "rgba(248, 113, 113, 0.1)", text: "#f87171" },
    },
  },
  {
    id: "shellfish",
    name: "Crustacés",
    icon: "set-meal",
    description: "Fruits de mer",
    iconColor: {
      light: { bg: "rgba(236, 72, 153, 0.1)", text: "#db2777" },
      dark: { bg: "rgba(244, 114, 182, 0.1)", text: "#f472b6" },
    },
  },
  {
    id: "soy",
    name: "Soja",
    icon: "grass",
    description: "Soja et dérivés",
    iconColor: {
      light: { bg: "rgba(34, 197, 94, 0.1)", text: "#16a34a" },
      dark: { bg: "rgba(74, 222, 128, 0.1)", text: "#4ade80" },
    },
  },
];

// Additional exclusions that can be added
interface ExclusionItem {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: {
    light: { bg: string; text: string };
    dark: { bg: string; text: string };
  };
}

const ADDITIONAL_EXCLUSIONS: ExclusionItem[] = [
  {
    id: "e120",
    name: "E120 (Cochenille)",
    description: "Additif colorant",
    icon: "science",
    iconColor: {
      light: { bg: "rgba(168, 85, 247, 0.1)", text: "#9333ea" },
      dark: { bg: "rgba(192, 132, 252, 0.1)", text: "#c084fc" },
    },
  },
  {
    id: "palm",
    name: "Huile de Palme",
    description: "Préférence éthique",
    icon: "local-fire-department",
    iconColor: {
      light: { bg: "rgba(234, 179, 8, 0.1)", text: "#ca8a04" },
      dark: { bg: "rgba(250, 204, 21, 0.1)", text: "#facc15" },
    },
  },
  {
    id: "e621",
    name: "E621 (Glutamate)",
    description: "Exhausteur de goût",
    icon: "science",
    iconColor: {
      light: { bg: "rgba(6, 182, 212, 0.1)", text: "#0891b2" },
      dark: { bg: "rgba(34, 211, 238, 0.1)", text: "#22d3ee" },
    },
  },
  {
    id: "e951",
    name: "E951 (Aspartame)",
    description: "Édulcorant artificiel",
    icon: "science",
    iconColor: {
      light: { bg: "rgba(139, 92, 246, 0.1)", text: "#7c3aed" },
      dark: { bg: "rgba(167, 139, 250, 0.1)", text: "#a78bfa" },
    },
  },
  {
    id: "nuts",
    name: "Fruits à coque",
    description: "Noix, amandes, noisettes",
    icon: "eco",
    iconColor: {
      light: { bg: "rgba(180, 83, 9, 0.1)", text: "#b45309" },
      dark: { bg: "rgba(217, 119, 6, 0.1)", text: "#d97706" },
    },
  },
  {
    id: "fish",
    name: "Poisson",
    description: "Tous types de poissons",
    icon: "phishing",
    iconColor: {
      light: { bg: "rgba(14, 165, 233, 0.1)", text: "#0284c7" },
      dark: { bg: "rgba(56, 189, 248, 0.1)", text: "#38bdf8" },
    },
  },
];

// Search suggestions
const SEARCH_SUGGESTIONS = [
  { id: "sesame", name: "Sésame", description: "Graines et huile" },
  { id: "mustard", name: "Moutarde", description: "Graines et condiment" },
  { id: "celery", name: "Céleri", description: "Légume et graines" },
  { id: "lupin", name: "Lupin", description: "Légumineuse" },
  { id: "sulfites", name: "Sulfites", description: "Conservateurs E220-E228" },
  { id: "molluscs", name: "Mollusques", description: "Fruits de mer" },
];

export default function ExclusionsScreen() {
  const { exclusions, toggleExclusion } = usePreferencesStore();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Theme-aware colors
  const themeColors = {
    background: isDark ? "#102217" : "#f6f8f7",
    card: isDark ? "#1a2e22" : "#ffffff",
    cardBorder: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
    textPrimary: isDark ? "#e8f5e9" : "#0d1b13",
    textSecondary: isDark ? "#9ca3af" : "#4b5563",
    primary: colors.primary,
    primaryDark: "#0ea64b",
    inputBg: isDark ? "#1a2e22" : "#ffffff",
    inputBorder: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
    gradientCard: isDark 
      ? ["#1a2e22", "#15261d"] 
      : ["#ffffff", "rgba(239, 246, 255, 0.5)"],
  };

  // Check if an exclusion is selected
  const isSelected = useCallback((id: string) => {
    return exclusions.includes(id);
  }, [exclusions]);

  // Get active exclusions count
  const activeCount = exclusions.length;

  // Get active exclusions details
  const getActiveExclusions = useCallback(() => {
    const allItems = [...COMMON_ALLERGENS, ...ADDITIONAL_EXCLUSIONS];
    return exclusions.map(id => {
      const item = allItems.find(i => i.id === id);
      if (item) {
        return item;
      }
      // For custom/search added items
      const suggestion = SEARCH_SUGGESTIONS.find(s => s.id === id);
      if (suggestion) {
        return {
          id: suggestion.id,
          name: suggestion.name,
          description: suggestion.description,
          icon: "block" as keyof typeof MaterialIcons.glyphMap,
          iconColor: {
            light: { bg: "rgba(107, 114, 128, 0.1)", text: "#4b5563" },
            dark: { bg: "rgba(156, 163, 175, 0.1)", text: "#9ca3af" },
          },
        };
      }
      return null;
    }).filter(Boolean) as ExclusionItem[];
  }, [exclusions]);

  // Filter search suggestions
  const filteredSuggestions = SEARCH_SUGGESTIONS.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase())
  ).filter(s => !exclusions.includes(s.id));

  // Handle search input
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setShowSuggestions(text.length > 0);
  };

  // Add from search
  const addFromSearch = (id: string) => {
    if (!exclusions.includes(id)) {
      toggleExclusion(id);
    }
    setSearchQuery("");
    setShowSuggestions(false);
  };

  // Save and go back
  const handleSave = () => {
    router.back();
  };

  // Render allergen grid item
  const renderAllergenGridItem = (allergen: Allergen) => {
    const selected = isSelected(allergen.id);
    
    return (
      <PressableScale
        onPress={() => toggleExclusion(allergen.id)}
        style={{
          width: "100%",
          aspectRatio: 1,
          borderRadius: 12,
          padding: 12,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: selected ? themeColors.primary : themeColors.card,
          borderWidth: 1,
          borderColor: selected ? themeColors.primary : themeColors.cardBorder,
          shadowColor: selected ? themeColors.primary : "#000",
          shadowOffset: { width: 0, height: selected ? 4 : 1 },
          shadowOpacity: selected ? 0.3 : 0.05,
          shadowRadius: selected ? 8 : 2,
          elevation: selected ? 4 : 1,
          position: "relative",
        }}
        accessibilityRole="button"
        accessibilityLabel={`${allergen.name} - ${allergen.description}`}
      >
        {/* Selection indicator dot */}
        {selected && (
          <View
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: "#ffffff",
            }}
          />
        )}

        <MaterialIcons
          name={allergen.icon}
          size={28}
          color={selected ? "#102217" : themeColors.textSecondary}
        />
        <Text
          style={{
            marginTop: 8,
            fontSize: 12,
            fontWeight: selected ? "700" : "500",
            color: selected ? "#102217" : themeColors.textSecondary,
            textAlign: "center",
          }}
        >
          {allergen.name}
        </Text>
      </PressableScale>
    );
  };

  // Render exclusion list item
  const renderExclusionItem = (item: ExclusionItem, index: number) => {
    const iconColors = isDark ? item.iconColor.dark : item.iconColor.light;
    
    return (
      <Animated.View
        key={item.id}
        entering={FadeInDown.delay(index * 50).duration(300)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 16,
          borderRadius: 12,
          backgroundColor: themeColors.card,
          borderWidth: 1,
          borderColor: themeColors.cardBorder,
          marginBottom: 12,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              backgroundColor: iconColors.bg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIcons name={item.icon} size={22} color={iconColors.text} />
          </View>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: themeColors.textPrimary,
              }}
            >
              {item.name}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: themeColors.textSecondary,
                marginTop: 2,
              }}
            >
              {item.description}
            </Text>
          </View>
        </View>
        
        <Pressable
          onPress={() => toggleExclusion(item.id)}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
          }}
          accessibilityRole="button"
          accessibilityLabel={`Retirer ${item.name}`}
        >
          <MaterialIcons
            name="close"
            size={20}
            color={themeColors.textSecondary}
          />
        </Pressable>
      </Animated.View>
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
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 16,
        }}
      >
        {/* Back Button */}
        <PressableScale
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: themeColors.card,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: themeColors.cardBorder,
          }}
          accessibilityRole="button"
          accessibilityLabel={t.common.back}
        >
          <MaterialIcons name="arrow-back" size={22} color={themeColors.textPrimary} />
        </PressableScale>

        {/* Title */}
        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: themeColors.textPrimary,
          }}
          accessibilityRole="header"
        >
          {t.exclusions.title}
        </Text>

        {/* Finish Button */}
        <PressableScale
          onPress={handleSave}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
          }}
          accessibilityRole="button"
          accessibilityLabel="Terminer"
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: themeColors.primary,
            }}
          >
            {t.exclusions.done}
          </Text>
        </PressableScale>
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Info Card - Halal Certification Active */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={{
            marginHorizontal: 20,
            marginTop: 8,
            borderRadius: 12,
            padding: 16,
            backgroundColor: themeColors.card,
            borderWidth: 1,
            borderColor: themeColors.cardBorder,
            flexDirection: "row",
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(19, 236, 106, 0.1)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIcons name="verified-user" size={22} color={themeColors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: themeColors.textPrimary,
              }}
            >
              {t.exclusions.halalCertActive}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: themeColors.textSecondary,
                marginTop: 4,
                lineHeight: 18,
              }}
            >
              {t.exclusions.halalCertActiveDesc}
            </Text>
          </View>
        </Animated.View>

        {/* Search Input */}
        <Animated.View
          entering={FadeInDown.delay(150).duration(400)}
          style={{
            marginHorizontal: 20,
            marginTop: 24,
            position: "relative",
            zIndex: 10,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: themeColors.inputBg,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: searchQuery ? themeColors.primary : themeColors.inputBorder,
              paddingHorizontal: 16,
            }}
          >
            <MaterialIcons
              name="search"
              size={22}
              color={searchQuery ? themeColors.primary : themeColors.textSecondary}
            />
            <TextInput
              value={searchQuery}
              onChangeText={handleSearchChange}
              placeholder={t.exclusions.searchPlaceholder}
              placeholderTextColor={themeColors.textSecondary}
              style={{
                flex: 1,
                paddingVertical: 16,
                paddingLeft: 12,
                fontSize: 14,
                color: themeColors.textPrimary,
              }}
              accessibilityLabel="Rechercher un ingrédient ou additif"
              accessibilityHint="Saisissez le nom d'un ingrédient ou additif à exclure"
            />
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => {
                  setSearchQuery("");
                  setShowSuggestions(false);
                }}
                accessibilityRole="button"
                accessibilityLabel="Effacer la recherche"
              >
                <MaterialIcons name="close" size={20} color={themeColors.textSecondary} />
              </Pressable>
            )}
          </View>

          {/* Search Suggestions Dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <Animated.View
              entering={FadeInDown.duration(200)}
              style={{
                position: "absolute",
                top: 60,
                left: 0,
                right: 0,
                borderRadius: 12,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 5,
                zIndex: 100,
              }}
            >
              <View style={{
                backgroundColor: themeColors.card,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: themeColors.cardBorder,
                overflow: "hidden",
              }}>
              {filteredSuggestions.slice(0, 4).map((suggestion, index) => (
                <PressableScale
                  key={suggestion.id}
                  onPress={() => addFromSearch(suggestion.id)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 14,
                    borderBottomWidth: index < filteredSuggestions.length - 1 ? 1 : 0,
                    borderBottomColor: themeColors.cardBorder,
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Ajouter ${suggestion.name}`}
                >
                  <MaterialIcons name="add" size={20} color={themeColors.primary} />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: "500", color: themeColors.textPrimary }}>
                      {suggestion.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: themeColors.textSecondary }}>
                      {suggestion.description}
                    </Text>
                  </View>
                </PressableScale>
              ))}
              </View>
            </Animated.View>
          )}
        </Animated.View>

        {/* Common Allergens Grid */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={{ marginTop: 32, paddingHorizontal: 20 }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: themeColors.textPrimary,
              }}
              accessibilityRole="header"
            >
              {t.exclusions.commonAllergens}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: themeColors.textSecondary,
              }}
            >
              {t.exclusions.quickSelect}
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
            }}
          >
            {COMMON_ALLERGENS.map((allergen, index) => (
              <View 
                key={allergen.id}
                style={{ 
                  width: (width - 64) / 3,
                  marginBottom: 12,
                }}
              >
                {renderAllergenGridItem(allergen)}
              </View>
            ))}
          </View>
        </Animated.View>

        {/* My Exclusions List */}
        <Animated.View
          entering={FadeInDown.delay(250).duration(400)}
          style={{ marginTop: 32, paddingHorizontal: 20 }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: themeColors.textPrimary,
              }}
              accessibilityRole="header"
            >
              {t.exclusions.myExclusions}
            </Text>
            {activeCount > 0 && (
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 12,
                  backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "500",
                    color: isDark ? "#ffffff" : themeColors.textSecondary,
                  }}
                >
                  {(activeCount > 1 ? t.exclusions.activeCountPlural : t.exclusions.activeCount).replace("{{count}}", String(activeCount))}
                </Text>
              </View>
            )}
          </View>

          {/* Active exclusions list */}
          {getActiveExclusions().map((item, index) => renderExclusionItem(item, index))}

          {/* Empty state */}
          {activeCount === 0 && (
            <View
              style={{
                padding: 24,
                borderRadius: 12,
                backgroundColor: themeColors.card,
                borderWidth: 1,
                borderColor: themeColors.cardBorder,
                alignItems: "center",
              }}
            >
              <MaterialIcons name="block" size={40} color={themeColors.textSecondary} />
              <Text
                style={{
                  fontSize: 14,
                  color: themeColors.textSecondary,
                  marginTop: 12,
                  textAlign: "center",
                }}
              >
                {t.exclusions.emptyExclusions}
              </Text>
            </View>
          )}

          {/* Add another exclusion button */}
          <PressableScale
            onPress={() => {
              // Focus search input or show modal for adding
              setShowSuggestions(true);
            }}
            style={{
              marginTop: 16,
              padding: 14,
              borderRadius: 12,
              borderWidth: 1,
              borderStyle: "dashed",
              borderColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
            accessibilityRole="button"
            accessibilityLabel={t.exclusions.addAnother}
          >
            <MaterialIcons name="add" size={18} color={themeColors.textSecondary} />
            <Text
              style={{
                marginLeft: 8,
                fontSize: 14,
                fontWeight: "500",
                color: themeColors.textSecondary,
              }}
            >
              {t.exclusions.addAnother}
            </Text>
          </PressableScale>
        </Animated.View>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Fixed Bottom Save Button */}
      <Animated.View
        entering={SlideInDown.delay(300).duration(400)}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 32,
          backgroundColor: isDark ? "rgba(16, 34, 23, 0.9)" : "rgba(246, 248, 247, 0.9)",
          borderTopWidth: 1,
          borderTopColor: themeColors.cardBorder,
        }}
      >
        <PressableScale
          onPress={handleSave}
          style={{
            backgroundColor: themeColors.primary,
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: themeColors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}
          accessibilityRole="button"
          accessibilityLabel={t.exclusions.savePreferences}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: "#102217",
            }}
          >
            {t.exclusions.savePreferences}
          </Text>
        </PressableScale>
      </Animated.View>
    </SafeAreaView>
  );
}
