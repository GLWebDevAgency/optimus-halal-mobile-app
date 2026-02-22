import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useTranslation } from "@/hooks/useTranslation";
import { useTheme } from "@/hooks/useTheme";
import { storeTypeColors } from "@/theme/colors";
import {
  StoreFeatureProperties,
  ThemeColors,
  STORE_TYPE_ICON,
  formatDistance,
  openStatusColor,
  openStatusBg,
} from "./types";

interface Props {
  store: StoreFeatureProperties;
  onDirections: () => void;
  onCall: () => void;
  onShare: () => void;
  onClose: () => void;
  colors: ThemeColors;
}

export const StoreDetailCard = React.memo(function StoreDetailCard({
  store,
  onDirections,
  onCall,
  onShare,
  onClose,
  colors,
}: Props) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const certLabel = store.certifier !== "none" ? store.certifier.toUpperCase() : null;
  const typeIcon = STORE_TYPE_ICON[store.storeType] ?? "store";
  const typeColor = storeTypeColors[store.storeType as keyof typeof storeTypeColors]?.base ?? colors.primary;

  return (
    <Animated.View entering={FadeInUp.duration(300)} className="px-5 pb-4">
      {/* Store image hero */}
      {store.imageUrl && (
        <View className="mb-3 rounded-xl overflow-hidden" style={{ height: 120 }}>
          <Image
            source={{ uri: store.imageUrl }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            transition={200}
          />
          <LinearGradient
            colors={["transparent", isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.3)"]}
            style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 40 }}
          />
        </View>
      )}

      {/* Header row */}
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-row items-start flex-1 pr-3">
          <View
            className="w-10 h-10 rounded-xl items-center justify-center mr-3"
            style={{ backgroundColor: `${typeColor}18` }}
          >
            <MaterialIcons name={typeIcon} size={20} color={typeColor} />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold" style={{ color: colors.textPrimary }} numberOfLines={1}>
              {store.name}
            </Text>
            <Text className="text-sm mt-0.5" style={{ color: colors.textSecondary }} numberOfLines={1}>
              {store.address}, {store.city}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center gap-1.5">
          <TouchableOpacity
            onPress={onShare}
            className="w-8 h-8 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.buttonSecondary }}
            accessibilityRole="button"
            accessibilityLabel="Partager"
          >
            <MaterialIcons name="share" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onClose}
            className="w-8 h-8 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.buttonSecondary }}
            accessibilityRole="button"
            accessibilityLabel="Fermer"
          >
            <MaterialIcons name="close" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Badges row */}
      <View className="flex-row items-center gap-2 mb-3 flex-wrap">
        {store.openStatus && store.openStatus !== "unknown" && (
          <View
            className="px-2.5 py-1 rounded-lg flex-row items-center gap-1"
            style={{ backgroundColor: openStatusBg(store.openStatus) }}
          >
            <View style={{
              width: 6, height: 6, borderRadius: 3,
              backgroundColor: openStatusColor(store.openStatus),
            }} />
            <Text className="text-[11px] font-bold" style={{ color: openStatusColor(store.openStatus) }}>
              {store.openStatus === "open" ? t.map.open
                : store.openStatus === "closing_soon" ? t.map.closingSoon.replace("{{minutes}}", "30")
                : store.openStatus === "opening_soon" ? t.map.openingSoon.replace("{{minutes}}", "30")
                : t.map.closed}
            </Text>
          </View>
        )}
        {certLabel && (
          <View className="px-2.5 py-1 rounded-lg" style={{ backgroundColor: colors.primaryLight }}>
            <Text className="text-[11px] font-bold" style={{ color: colors.primary }}>{certLabel}</Text>
          </View>
        )}
        {store.halalCertified && (
          <View className="px-2.5 py-1 rounded-lg flex-row items-center gap-1" style={{ backgroundColor: `${colors.primary}15` }}>
            <MaterialIcons name="verified" size={12} color={colors.primary} />
            <Text className="text-[11px] font-bold" style={{ color: colors.primary }}>HALAL</Text>
          </View>
        )}
        {store.averageRating > 0 && (
          <View className="flex-row items-center gap-1">
            <MaterialIcons name="star" size={14} color="#fbbf24" />
            <Text className="text-xs font-bold" style={{ color: colors.textPrimary }}>{store.averageRating.toFixed(1)}</Text>
            <Text className="text-xs" style={{ color: colors.textMuted }}>({store.reviewCount})</Text>
          </View>
        )}
        <View className="flex-row items-center gap-1">
          <MaterialIcons name="near-me" size={12} color={colors.textMuted} />
          <Text className="text-xs" style={{ color: colors.textMuted }}>{formatDistance(store.distance)}</Text>
        </View>
      </View>

      {/* Hours row */}
      {store.openTime && store.closeTime && (
        <View
          className="flex-row items-center gap-2 mb-3 px-3 py-2.5 rounded-xl"
          style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }}
        >
          <MaterialIcons name="schedule" size={16} color={colors.textMuted} />
          <Text className="text-sm" style={{ color: colors.textSecondary }}>
            {t.map.hours} : {store.openTime} – {store.closeTime}
          </Text>
        </View>
      )}

      {/* Action buttons */}
      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={onDirections}
          className="flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-2xl"
          style={{
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`${t.map.getDirections} ${store.name}`}
        >
          <MaterialIcons name="directions" size={20} color="#fff" />
          <Text className="text-sm font-bold text-white">{t.map.getDirections}</Text>
        </TouchableOpacity>

        {store.phone && (
          <TouchableOpacity
            onPress={onCall}
            className="flex-row items-center justify-center gap-2 py-3.5 px-5 rounded-2xl"
            style={{
              backgroundColor: colors.buttonSecondary,
              borderWidth: 1,
              borderColor: colors.border,
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`${t.map.callStore} ${store.name}`}
          >
            <MaterialIcons name="phone" size={20} color={colors.primary} />
            <Text className="text-sm font-bold" style={{ color: colors.textPrimary }}>{t.map.callStore}</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
});
