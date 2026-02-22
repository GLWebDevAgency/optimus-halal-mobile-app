/**
 * Location Picker Component
 * 
 * Composant de sélection de localisation avec:
 * - Liste déroulante des villes françaises
 * - Recherche en temps réel
 * - Géolocalisation automatique
 */

import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useHaptics, useTheme, useTranslation } from "@/hooks";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { PressableScale } from "./PressableScale";

import { City, FRENCH_CITIES, searchCities, findNearestCity } from "@/constants/locations";

export interface LocationPickerProps {
  label?: string;
  value?: string;
  onSelect?: (city: City) => void;
  error?: string;
  hint?: string;
  placeholder?: string;
  containerClassName?: string;
  showGeolocation?: boolean;
  ref?: React.Ref<View>;
}

export function LocationPicker({
  label,
  value,
  onSelect,
  error,
  hint,
  placeholder,
  containerClassName = "",
  showGeolocation = true,
  ref,
}: LocationPickerProps) {
  const { impact, notification } = useHaptics();
    const { colors, isDark } = useTheme();
    const { t } = useTranslation();
    const resolvedPlaceholder = placeholder || t.location.selectCity;

    const [isPickerVisible, setIsPickerVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLocating, setIsLocating] = useState(false);
    const [filteredCities, setFilteredCities] = useState<City[]>([]);

    // Filtrer les villes lors de la recherche
    useEffect(() => {
      if (searchQuery.length >= 2) {
        setFilteredCities(searchCities(searchQuery));
      } else {
        // Afficher les 20 premières villes par défaut
        setFilteredCities(FRENCH_CITIES.slice(0, 20));
      }
    }, [searchQuery]);

    // Géolocalisation
    const handleGeolocation = useCallback(async () => {
      setIsLocating(true);
      impact();

      try {
        // Demander la permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== "granted") {
          Alert.alert(
            t.location.permissionRequired,
            t.location.permissionRequiredDesc,
            [{ text: "OK" }]
          );
          setIsLocating(false);
          return;
        }

        // Obtenir la position
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        // Trouver la ville la plus proche
        const nearestCity = findNearestCity(
          location.coords.latitude,
          location.coords.longitude
        );

        if (nearestCity) {
          notification();
          onSelect?.(nearestCity);
          setIsPickerVisible(false);
        } else {
          Alert.alert(
            t.location.cityNotFound,
            t.location.cityNotFoundDesc
          );
        }
      } catch (err) {
        console.error("[LocationPicker] Geolocation error:", err);
        Alert.alert(
          t.location.geolocationError,
          t.location.geolocationErrorDesc
        );
      } finally {
        setIsLocating(false);
      }
    }, [onSelect]);

    // Sélection d'une ville
    const handleCitySelect = useCallback(
      async (city: City) => {
        impact();
        onSelect?.(city);
        setIsPickerVisible(false);
        setSearchQuery("");
      },
      [onSelect]
    );

    // Ouvrir le picker
    const handleOpen = useCallback(async () => {
      impact();
      setFilteredCities(FRENCH_CITIES.slice(0, 20));
      setIsPickerVisible(true);
    }, []);

    return (
      <View ref={ref} className={`flex flex-col gap-2 ${containerClassName}`}>
        {label && (
          <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
            {label}
          </Text>
        )}

        <View className="flex-row gap-2">
          {/* Location Button */}
          <PressableScale
            onPress={handleOpen}
            style={{ flex: 1 }}
          >
            <View
              className={`
                h-14 px-4 flex-row items-center justify-between
                bg-white dark:bg-surface-dark
                border rounded-xl
                ${error
                  ? "border-danger"
                  : "border-slate-200 dark:border-slate-700"
                }
              `}
            >
              <View className="flex-row items-center flex-1">
                <MaterialIcons
                  name="location-on"
                  size={20}
                  color={value ? colors.primary : "#94a3b8"}
                />
                <Text
                  className={`ml-2 text-base ${
                    value
                      ? "text-slate-900 dark:text-white"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                  numberOfLines={1}
                >
                  {value || resolvedPlaceholder}
                </Text>
              </View>
              <MaterialIcons
                name="arrow-drop-down"
                size={24}
                color="#94a3b8"
              />
            </View>
          </PressableScale>

          {/* Geolocation Button */}
          {showGeolocation && (
            <PressableScale
              onPress={handleGeolocation}
              disabled={isLocating}
            >
              <View
                className={`
                  h-14 w-14 items-center justify-center
                  bg-primary-50 dark:bg-primary-900/30
                  border border-primary-200 dark:border-primary-800
                  rounded-xl
                `}
              >
                {isLocating ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <MaterialIcons name="my-location" size={22} color={colors.primary} />
                )}
              </View>
            </PressableScale>
          )}
        </View>

        {error && (
          <Text className="text-sm text-danger ml-1">{error}</Text>
        )}

        {hint && !error && (
          <View className="flex-row items-center ml-1">
            <MaterialIcons name="info-outline" size={14} color="#94a3b8" />
            <Text className="text-xs text-slate-500 dark:text-slate-400 ml-1">
              {hint}
            </Text>
          </View>
        )}

        {/* City Picker Modal */}
        <Modal
          visible={isPickerVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setIsPickerVisible(false)}
        >
          <View className={`flex-1 ${isDark ? "bg-background-dark" : "bg-slate-50"}`}>
            {/* Header */}
            <View
              className={`
                flex-row items-center justify-between p-4 pt-6
                border-b border-slate-200 dark:border-slate-700
                ${isDark ? "bg-surface-dark" : "bg-white"}
              `}
            >
              <View className="flex-1">
                <Text className="text-lg font-bold text-slate-900 dark:text-white">
                  {t.location.selectCity}
                </Text>
                <Text className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {t.location.searchOrGeolocate}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  setIsPickerVisible(false);
                  setSearchQuery("");
                }}
                className="p-2 -mr-2"
              >
                <MaterialIcons
                  name="close"
                  size={24}
                  color={isDark ? "#ffffff" : "#0f172a"}
                />
              </Pressable>
            </View>

            {/* Search & Geolocation */}
            <View className={`p-4 ${isDark ? "bg-surface-dark" : "bg-white"}`}>
              {/* Geolocation Banner */}
              <Animated.View entering={FadeIn.duration(300)}>
                <PressableScale
                  onPress={handleGeolocation}
                  disabled={isLocating}
                >
                  <View
                    className={`
                      flex-row items-center p-4 mb-4 rounded-xl
                      ${isDark
                        ? "bg-primary-900/30 border border-primary-800"
                        : "bg-primary-50 border border-primary-200"
                      }
                    `}
                  >
                    {isLocating ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <MaterialIcons name="my-location" size={24} color={colors.primary} />
                    )}
                    <View className="flex-1 ml-3">
                      <Text className="text-primary-700 dark:text-primary-400 font-semibold">
                        {t.location.useMyLocation}
                      </Text>
                      <Text className="text-primary-600/70 dark:text-primary-400/70 text-xs mt-0.5">
                        {t.location.autoDetectCity}
                      </Text>
                    </View>
                    <MaterialIcons
                      name="chevron-right"
                      size={24}
                      color={colors.primary}
                    />
                  </View>
                </PressableScale>
              </Animated.View>

              {/* Search Input */}
              <View className="relative">
                <MaterialIcons
                  name="search"
                  size={20}
                  color="#94a3b8"
                  style={{
                    position: "absolute",
                    left: 14,
                    top: 14,
                    zIndex: 1,
                  }}
                />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={t.location.searchCity}
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="words"
                  autoCorrect={false}
                  className={`
                    w-full h-12 pl-11 pr-4 rounded-xl text-base
                    ${isDark
                      ? "bg-background-dark border-slate-700 text-white"
                      : "bg-slate-100 border-slate-200 text-slate-900"
                    }
                    border
                  `}
                />
              </View>
            </View>

            {/* City List */}
            <FlatList
              data={filteredCities}
              keyExtractor={(item) => `${item.name}-${item.postalCode}`}
              renderItem={({ item, index }) => (
                <Animated.View entering={FadeInDown.delay(index * 30).duration(200)}>
                  <PressableScale
                    onPress={() => handleCitySelect(item)}
                  >
                    <View
                      className={`
                        flex-row items-center px-4 py-3.5 mx-4 mb-2 rounded-xl
                        ${isDark ? "bg-surface-dark" : "bg-white"}
                        border border-slate-100 dark:border-slate-800
                      `}
                    >
                      <View
                        className={`
                          w-10 h-10 rounded-full items-center justify-center mr-3
                          ${isDark ? "bg-primary-900/30" : "bg-primary-50"}
                        `}
                      >
                        <MaterialIcons name="location-city" size={20} color={colors.primary} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-slate-900 dark:text-white font-medium">
                          {item.name}
                        </Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                          {item.postalCode} • {item.region}
                        </Text>
                      </View>
                      <MaterialIcons
                        name="chevron-right"
                        size={20}
                        color="#94a3b8"
                      />
                    </View>
                  </PressableScale>
                </Animated.View>
              )}
              contentContainerStyle={{ paddingTop: 8, paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View className="items-center justify-center py-12">
                  <MaterialIcons name="search-off" size={48} color="#94a3b8" />
                  <Text className="text-slate-500 dark:text-slate-400 mt-4 text-center">
                    {t.location.noCityFound}
                  </Text>
                  <Text className="text-slate-400 dark:text-slate-500 text-sm mt-1 text-center">
                    {t.location.tryAnotherSearch}
                  </Text>
                </View>
              }
            />
          </View>
        </Modal>
      </View>
    );
}

export default LocationPicker;
