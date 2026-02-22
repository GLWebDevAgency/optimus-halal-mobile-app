import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";
import { PressableScale } from "../ui/PressableScale";
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
        <PressableScale
          onPress={onMyLocation}
          accessibilityRole="button"
          accessibilityLabel={t.myLocation}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isDark ? "rgba(30,41,59,0.8)" : "rgba(255,255,255,0.9)",
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.12,
            shadowRadius: 6,
            elevation: 3,
          }}
        >
          <MaterialIcons
            name={userLocation ? "my-location" : "location-searching"}
            size={20}
            color={userLocation ? colors.primary : colors.textMuted}
          />
        </PressableScale>
      </View>

      {/* Results count badge */}
      {storeCount > 0 && !isSelectedStore && (
        <Animated.View
          entering={FadeIn.delay(400).duration(400)}
          className="absolute right-4"
          style={{ bottom: 260 + insetBottom, zIndex: 5 }}
        >
          <View
            className="flex-row items-center gap-1.5 h-8 px-3 rounded-full"
            style={{
              backgroundColor: isDark ? "rgba(30,41,59,0.8)" : "rgba(255,255,255,0.9)",
              borderWidth: 1,
              borderColor: colors.border,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <MaterialIcons name="place" size={14} color={colors.primary} />
            <Text className="font-semibold text-xs" style={{ color: colors.textPrimary }}>
              {storeCount} {storeCount > 1 ? t.stores : t.store}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Loading indicator */}
      {(isFetching || isLocationLoading) && (
        <Animated.View
          entering={FadeIn.duration(200)}
          className="absolute left-4"
          style={{ bottom: 260 + insetBottom, zIndex: 5 }}
        >
          <View
            className="h-8 px-3 rounded-full flex-row items-center gap-1.5"
            style={{
              backgroundColor: isDark ? "rgba(30,41,59,0.8)" : "rgba(255,255,255,0.9)",
              borderWidth: 1,
              borderColor: colors.border,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <ActivityIndicator size="small" color={colors.primary} />
            <Text className="text-xs" style={{ color: colors.textMuted }}>
              {isLocationLoading ? t.locating : t.searchResults}
            </Text>
          </View>
        </Animated.View>
      )}
    </>
  );
});
