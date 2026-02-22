import React, { useMemo, useRef, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import Animated, { FadeIn, FadeInDown, FadeInRight } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { storeTypeColors, glass } from "@/theme/colors";
import type { SearchResult } from "@/hooks";
import { STORE_TYPE_ICON, type ThemeColors } from "./types";

interface FilterConfig {
  id: string;
  filterKey: string;
  storeType?: string;
  halalOnly?: boolean;
  openNow?: boolean;
  minRating?: number;
}

interface Props {
  colors: ThemeColors;
  isDark: boolean;
  insetTop: number;
  searchText: string;
  isSearchActive: boolean;
  showSuggestions: boolean;
  searchResults: SearchResult[];
  activeFilters: string[];
  filters: FilterConfig[];
  onSearchTextChange: (text: string) => void;
  onClearSearch: () => void;
  onShowSuggestions: (show: boolean) => void;
  onSearchResultPress: (result: SearchResult) => void;
  onToggleFilter: (filterId: string) => void;
  t: {
    searchStores: string;
    storeResults: string;
    addresses: string;
    filters: Record<string, string>;
    selected: string;
  };
}

export const MapSearchOverlay = React.memo(function MapSearchOverlay({
  colors,
  isDark,
  insetTop,
  searchText,
  isSearchActive,
  showSuggestions,
  searchResults,
  activeFilters,
  filters,
  onSearchTextChange,
  onClearSearch,
  onShowSuggestions,
  onSearchResultPress,
  onToggleFilter,
  t,
}: Props) {
  // Guard: if user is pressing a result, don't hide suggestions on blur
  const isPressInProgressRef = useRef(false);

  const handleBlur = useCallback(() => {
    // Delay hide so onPress on a result fires first
    setTimeout(() => {
      if (!isPressInProgressRef.current) {
        onShowSuggestions(false);
      }
      isPressInProgressRef.current = false;
    }, 150);
  }, [onShowSuggestions]);

  const handleResultPress = useCallback((result: SearchResult) => {
    isPressInProgressRef.current = true;
    onSearchResultPress(result);
  }, [onSearchResultPress]);

  // Pre-group results once instead of calling .filter() 4x in render
  const { storeResults: groupedStores, addressResults: groupedAddresses } = useMemo(() => {
    const storeResults: (SearchResult & { type: "store" })[] = [];
    const addressResults: (SearchResult & { type: "address" })[] = [];
    for (const r of searchResults) {
      if (r.type === "store") storeResults.push(r);
      else addressResults.push(r);
    }
    return { storeResults, addressResults };
  }, [searchResults]);

  return (
    <View className="absolute top-0 left-0 right-0" style={{ zIndex: 10 }}>
      <LinearGradient
        colors={
          isDark
            ? ["rgba(16,34,23,0.95)", "rgba(16,34,23,0.6)", "transparent"]
            : ["rgba(246,248,247,0.95)", "rgba(246,248,247,0.6)", "transparent"]
        }
        style={{ paddingTop: insetTop + 8, paddingHorizontal: 16, paddingBottom: 32 }}
      >
        {/* Search Bar */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          className="flex-row gap-3 mb-3"
        >
          <BlurView
            intensity={isDark ? 40 : 80}
            tint={isDark ? "dark" : "light"}
            className="flex-1 h-12 flex-row items-center px-4 rounded-xl overflow-hidden"
            style={{
              borderWidth: 1,
              borderColor: isDark ? glass.dark.border : glass.light.border,
            }}
          >
            <MaterialIcons name="search" size={20} color={colors.textMuted} />
            <TextInput
              value={searchText}
              onChangeText={onSearchTextChange}
              placeholder={t.searchStores}
              placeholderTextColor={colors.textMuted}
              className="flex-1 ml-3 text-base"
              style={{ color: colors.textPrimary }}
              returnKeyType="search"
              onFocus={() => onShowSuggestions(true)}
              onBlur={handleBlur}
            />
            {searchText.length > 0 && (
              isSearchActive ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <TouchableOpacity onPress={onClearSearch} hitSlop={8}>
                  <MaterialIcons name="close" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )
            )}
          </BlurView>
        </Animated.View>

        {/* Hybrid Search Results (Stores + Addresses) */}
        {showSuggestions && searchResults.length > 0 && (
          <Animated.View
            entering={FadeIn.duration(200)}
            className="rounded-xl mb-3 overflow-hidden"
            style={{
              backgroundColor: isDark ? "rgba(30,41,59,0.95)" : "rgba(255,255,255,0.98)",
              borderWidth: 1,
              borderColor: colors.border,
              maxHeight: 320,
            }}
          >
            {/* Store results section */}
            {groupedStores.length > 0 && (
              <>
                <View className="px-4 pt-2.5 pb-1.5">
                  <Text className="text-[11px] font-bold uppercase tracking-wide" style={{ color: colors.textMuted }}>
                    {t.storeResults}
                  </Text>
                </View>
                {groupedStores.map((r) => {
                  const typeColor = storeTypeColors[r.storeType as keyof typeof storeTypeColors]?.base ?? colors.primary;
                  return (
                    <TouchableOpacity
                      key={r.id}
                      onPress={() => handleResultPress(r)}
                      className="flex-row items-center px-4 py-3"
                      style={{ borderBottomWidth: 1, borderBottomColor: colors.borderLight }}
                    >
                      <View
                        className="w-8 h-8 rounded-lg items-center justify-center"
                        style={{ backgroundColor: `${typeColor}18` }}
                      >
                        <MaterialIcons
                          name={STORE_TYPE_ICON[r.storeType] ?? "store"}
                          size={16}
                          color={typeColor}
                        />
                      </View>
                      <View className="flex-1 ml-3">
                        <Text className="text-sm font-semibold" style={{ color: colors.textPrimary }} numberOfLines={1}>
                          {r.name}
                        </Text>
                        <Text className="text-xs" style={{ color: colors.textMuted }} numberOfLines={1}>
                          {r.city}{r.halalCertified ? " · Halal certifié" : ""}
                        </Text>
                      </View>
                      {r.averageRating > 0 && (
                        <View className="flex-row items-center gap-0.5 ml-2">
                          <MaterialIcons name="star" size={12} color="#fbbf24" />
                          <Text className="text-xs font-bold" style={{ color: colors.textPrimary }}>
                            {r.averageRating.toFixed(1)}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
            {/* Address results section */}
            {groupedAddresses.length > 0 && (
              <>
                <View className="px-4 pt-2.5 pb-1.5">
                  <Text className="text-[11px] font-bold uppercase tracking-wide" style={{ color: colors.textMuted }}>
                    {t.addresses}
                  </Text>
                </View>
                {groupedAddresses.map((r, i) => (
                    <TouchableOpacity
                      key={r.banId}
                      onPress={() => handleResultPress(r)}
                      className="flex-row items-center px-4 py-3"
                      style={{
                        borderBottomWidth: i < groupedAddresses.length - 1 ? 1 : 0,
                        borderBottomColor: colors.borderLight,
                      }}
                    >
                      <MaterialIcons name="place" size={18} color={colors.textMuted} />
                      <View className="flex-1 ml-3">
                        <Text className="text-sm" style={{ color: colors.textPrimary }} numberOfLines={1}>
                          {r.label}
                        </Text>
                        <Text className="text-xs" style={{ color: colors.textMuted }}>
                          {r.postcode} {r.city}
                        </Text>
                      </View>
                    </TouchableOpacity>
                ))}
              </>
            )}
          </Animated.View>
        )}

        {/* Filter Chips */}
        <Animated.ScrollView
          entering={FadeInRight.delay(200).duration(400)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {filters.map((filter) => {
            const isActive = activeFilters.includes(filter.id);
            const filterLabel = t.filters[filter.filterKey];
            return (
              <TouchableOpacity
                key={filter.id}
                onPress={() => onToggleFilter(filter.id)}
                className="h-9 flex-row items-center gap-1.5 px-4 rounded-full"
                style={{
                  backgroundColor: isActive
                    ? colors.primary
                    : isDark
                      ? "rgba(30,41,59,0.8)"
                      : "rgba(255,255,255,0.9)",
                  borderWidth: isActive ? 0 : 1,
                  borderColor: colors.border,
                }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`${filterLabel}${isActive ? `, ${t.selected}` : ""}`}
              >
                {'storeType' in filter && filter.storeType ? (
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: isActive ? "#ffffff" : (storeTypeColors[filter.storeType as keyof typeof storeTypeColors]?.base ?? colors.textMuted),
                    }}
                  />
                ) : 'openNow' in filter ? (
                  <MaterialIcons name="schedule" size={14} color={isActive ? "#ffffff" : "#22c55e"} />
                ) : 'minRating' in filter ? (
                  <MaterialIcons name="star" size={14} color={isActive ? "#ffffff" : "#fbbf24"} />
                ) : null}
                <Text
                  className={`text-sm ${isActive ? "font-semibold" : "font-medium"}`}
                  style={{ color: isActive ? "#ffffff" : colors.textPrimary }}
                >
                  {filterLabel}
                </Text>
                {isActive && (
                  <MaterialIcons name="close" size={16} color="#ffffff" />
                )}
              </TouchableOpacity>
            );
          })}
        </Animated.ScrollView>
      </LinearGradient>
    </View>
  );
});
