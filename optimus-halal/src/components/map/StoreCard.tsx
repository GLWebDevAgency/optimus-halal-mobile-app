import React, { useCallback } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "@/hooks/useTranslation";
import {
  StoreFeatureProperties,
  ThemeColors,
  STORE_TYPE_ICON,
  CARD_WIDTH,
  formatDistance,
  openStatusColor,
  openStatusLabel,
} from "./types";

interface Props {
  store: StoreFeatureProperties;
  isSelected: boolean;
  isDark?: boolean;
  onPressId: (storeId: string) => void;
  colors: ThemeColors;
}

export const StoreCard = React.memo(function StoreCard({
  store,
  isSelected,
  isDark = false,
  onPressId,
  colors,
}: Props) {
  const { t } = useTranslation();
  const certLabel = store.certifier !== "none" ? store.certifier.toUpperCase() : null;
  const handlePress = useCallback(() => onPressId(store.id), [onPressId, store.id]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={`${store.name}, ${store.city}, ${formatDistance(store.distance)}`}
      style={{
        width: CARD_WIDTH,
        shadowColor: isSelected ? colors.primary : "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isSelected ? 0.3 : 0.15,
        shadowRadius: 8,
        elevation: 4,
      }}
    >
      <View
        className="rounded-xl p-3"
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: isSelected ? colors.primary : colors.cardBorder,
          overflow: "hidden",
        }}
      >
        <View className="flex-row gap-3">
          {/* Image */}
          <View
            className="w-16 h-16 rounded-lg overflow-hidden items-center justify-center"
            style={{ backgroundColor: colors.buttonSecondary }}
          >
            {store.imageUrl ? (
              <Image
                source={{ uri: store.imageUrl }}
                className="w-full h-full"
                contentFit="cover"
                transition={200}
              />
            ) : (
              <MaterialIcons
                name={STORE_TYPE_ICON[store.storeType] ?? "store"}
                size={24}
                color={colors.textMuted}
              />
            )}
          </View>

          {/* Info */}
          <View className="flex-1 justify-center">
            <View className="flex-row items-start justify-between">
              <Text
                className="font-bold flex-1 pr-2"
                style={{ color: colors.textPrimary }}
                numberOfLines={1}
              >
                {store.name}
              </Text>
              {certLabel && (
                <View className="px-1.5 py-0.5 rounded" style={{ backgroundColor: colors.primaryLight }}>
                  <Text className="text-[10px] font-bold" style={{ color: colors.primary }}>
                    {certLabel}
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-xs mb-1" style={{ color: colors.textSecondary }} numberOfLines={1}>
              {store.city} · {formatDistance(store.distance)}
            </Text>
            <View className="flex-row items-center gap-2">
              {store.openStatus && store.openStatus !== "unknown" && (
                <View className="flex-row items-center gap-1">
                  <View style={{
                    width: 6, height: 6, borderRadius: 3,
                    backgroundColor: openStatusColor(store.openStatus, isDark),
                  }} />
                  <Text className="text-[11px] font-semibold" style={{
                    color: openStatusColor(store.openStatus, isDark),
                  }}>
                    {openStatusLabel(store.openStatus, t)}
                  </Text>
                </View>
              )}
              {store.averageRating > 0 && (
                <View className="flex-row items-center gap-1">
                  <MaterialIcons name="star" size={12} color="#fbbf24" />
                  <Text className="text-xs font-bold" style={{ color: colors.textPrimary }}>
                    {store.averageRating.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});
