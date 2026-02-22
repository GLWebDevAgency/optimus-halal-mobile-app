import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";
import type { ThemeColors } from "./types";

interface Props {
  colors: ThemeColors;
  isDark: boolean;
  userLocation: { latitude: number; longitude: number } | null;
  storeCount: number;
  isSelectedStore: boolean;
  isFetching: boolean;
  isLocationLoading: boolean;
  insetTop: number;
  insetBottom: number;
  onMyLocation: () => void;
  t: {
    myLocation: string;
    stores: string;
    store: string;
    locating: string;
    searchResults: string;
  };
}

export const MapControls = React.memo(function MapControls({
  colors,
  isDark,
  userLocation,
  storeCount,
  isSelectedStore,
  isFetching,
  isLocationLoading,
  insetTop,
  insetBottom,
  onMyLocation,
  t,
}: Props) {
  return (
    <>
      {/* My Location FAB */}
      <View
        className="absolute right-4 gap-2"
        style={{ top: insetTop + 140, zIndex: 5 }}
      >
        <TouchableOpacity
          onPress={onMyLocation}
          className="w-12 h-12 rounded-2xl items-center justify-center"
          style={{
            backgroundColor: isDark ? "rgba(30,41,59,0.92)" : "rgba(255,255,255,0.97)",
            borderWidth: 1,
            borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.2,
            shadowRadius: 6,
            elevation: 4,
          }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t.myLocation}
        >
          <MaterialIcons
            name={userLocation ? "my-location" : "location-searching"}
            size={22}
            color={userLocation ? colors.primary : colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      {/* Results count badge */}
      {storeCount > 0 && !isSelectedStore && (
        <Animated.View
          entering={FadeIn.delay(400).duration(400)}
          className="absolute right-4"
          style={{ bottom: 260 + insetBottom, zIndex: 5 }}
        >
          <View
            className="flex-row items-center gap-2 h-10 px-4 rounded-full"
            style={{
              backgroundColor: isDark ? "rgba(30,41,59,0.9)" : "rgba(255,255,255,0.95)",
              borderWidth: 1,
              borderColor: colors.border,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <MaterialIcons name="place" size={16} color={colors.primary} />
            <Text className="font-semibold text-sm" style={{ color: colors.textPrimary }}>
              {storeCount} {storeCount > 1 ? t.stores : t.store}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Loading indicator */}
      {(isFetching || isLocationLoading) && (
        <View
          className="absolute left-4"
          style={{ bottom: 260 + insetBottom, zIndex: 5 }}
        >
          <View
            className="h-10 px-4 rounded-full flex-row items-center gap-2"
            style={{
              backgroundColor: isDark ? "rgba(30,41,59,0.9)" : "rgba(255,255,255,0.95)",
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <ActivityIndicator size="small" color={colors.primary} />
            <Text className="text-xs" style={{ color: colors.textMuted }}>
              {isLocationLoading ? t.locating : t.searchResults}
            </Text>
          </View>
        </View>
      )}
    </>
  );
});
