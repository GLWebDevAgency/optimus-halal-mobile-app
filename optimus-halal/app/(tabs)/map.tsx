/**
 * Points of Sale Map Screen — Interactive Mapbox Map
 *
 * Features:
 * - @rnmapbox/maps with native clustering
 * - PostGIS-powered nearby store queries (ST_DWithin)
 * - API BAN geocoding (French address search)
 * - Store detail bottom sheet with directions deep link
 * - Dark/light map style via useTheme
 * - Location puck + "My location" FAB
 */

import React, { useState, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Linking,
  Platform,
  Keyboard,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useHaptics, useUserLocation, useMapStores, useGeocode } from "@/hooks";
import { useTranslation } from "@/hooks/useTranslation";
import { useTheme } from "@/hooks/useTheme";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  SlideInUp,
  FadeInUp,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
// Guard native Mapbox import — fails gracefully if dev client not rebuilt
let MapView: any, Camera: any, LocationPuck: any, ShapeSource: any, CircleLayer: any, SymbolLayer: any;
let MAPBOX_AVAILABLE = false;
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "";
try {
  if (!MAPBOX_TOKEN) {
    console.warn("EXPO_PUBLIC_MAPBOX_TOKEN is missing — map disabled.");
  } else {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Mapbox = require("@rnmapbox/maps");
    Mapbox.default.setAccessToken(MAPBOX_TOKEN);
    MapView = Mapbox.MapView;
    Camera = Mapbox.Camera;
    LocationPuck = Mapbox.LocationPuck;
    ShapeSource = Mapbox.ShapeSource;
    CircleLayer = Mapbox.CircleLayer;
    SymbolLayer = Mapbox.SymbolLayer;
    MAPBOX_AVAILABLE = true;
  }
} catch {
  console.warn("@rnmapbox/maps native code not available. Rebuild dev client required.");
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const CARD_WIDTH = 280;

// Default center: France
const FRANCE_CENTER: [number, number] = [2.3522, 46.6034];
const DEFAULT_ZOOM = 5;
const FOCUSED_ZOOM = 13;

// Filter → storeType mapping (backend enum values)
const FILTER_IDS = [
  { id: "butcher", filterKey: "butchers" as const, storeType: "butcher" as const },
  { id: "restaurant", filterKey: "restaurants" as const, storeType: "restaurant" as const },
  { id: "supermarket", filterKey: "grocery" as const, storeType: "supermarket" as const },
  { id: "certified", filterKey: "certified" as const, halalOnly: true },
];

// Store type icons
const STORE_TYPE_ICON: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  butcher: "restaurant",
  restaurant: "restaurant-menu",
  supermarket: "shopping-cart",
  bakery: "bakery-dining",
  abattoir: "agriculture",
  wholesaler: "local-shipping",
  online: "language",
  other: "store",
};

// ── GeoJSON Types ──────────────────────────────────────────
interface StoreFeatureProperties {
  id: string;
  name: string;
  storeType: string;
  imageUrl: string | null;
  address: string;
  city: string;
  postalCode: string | null;
  phone: string | null;
  website: string | null;
  certifier: string;
  certifierName: string | null;
  halalCertified: boolean;
  averageRating: number;
  reviewCount: number;
  distance: number;
}

// ── Helpers ────────────────────────────────────────────────
function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

function openDirections(lat: number, lon: number, name: string) {
  const encoded = encodeURIComponent(name);
  const url = Platform.select({
    ios: `maps://app?daddr=${lat},${lon}&q=${encoded}`,
    android: `geo:${lat},${lon}?q=${lat},${lon}(${encoded})`,
  });
  if (url) Linking.openURL(url);
}

function callStore(phone: string) {
  Linking.openURL(`tel:${phone}`);
}

// ── Store Detail Card ──────────────────────────────────────
const StoreDetailCard = React.memo(function StoreDetailCard({
  store,
  onDirections,
  onCall,
  onClose,
  colors,
}: {
  store: StoreFeatureProperties;
  onDirections: () => void;
  onCall: () => void;
  onClose: () => void;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  const { t } = useTranslation();
  const certLabel = store.certifier !== "none" ? store.certifier.toUpperCase() : null;

  return (
    <Animated.View entering={FadeInUp.duration(300)} className="px-5 pb-4">
      {/* Header row */}
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 pr-3">
          <Text
            className="text-lg font-bold"
            style={{ color: colors.textPrimary }}
            numberOfLines={1}
          >
            {store.name}
          </Text>
          <Text className="text-sm" style={{ color: colors.textSecondary }} numberOfLines={1}>
            {store.address}, {store.city}
          </Text>
        </View>
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

      {/* Badges row */}
      <View className="flex-row items-center gap-2 mb-3">
        {certLabel && (
          <View className="px-2 py-0.5 rounded" style={{ backgroundColor: colors.primaryLight }}>
            <Text className="text-xs font-bold" style={{ color: colors.primary }}>
              {certLabel}
            </Text>
          </View>
        )}
        {store.averageRating > 0 && (
          <View className="flex-row items-center gap-1">
            <MaterialIcons name="star" size={14} color="#fbbf24" />
            <Text className="text-xs font-bold" style={{ color: colors.textPrimary }}>
              {store.averageRating.toFixed(1)}
            </Text>
            <Text className="text-xs" style={{ color: colors.textMuted }}>
              ({store.reviewCount})
            </Text>
          </View>
        )}
        <View className="flex-row items-center gap-1">
          <MaterialIcons name="near-me" size={12} color={colors.textMuted} />
          <Text className="text-xs" style={{ color: colors.textMuted }}>
            {formatDistance(store.distance)}
          </Text>
        </View>
      </View>

      {/* Action buttons */}
      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={onDirections}
          className="flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl"
          style={{ backgroundColor: colors.primary }}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`${t.map.getDirections} ${store.name}`}
        >
          <MaterialIcons name="directions" size={20} color="#fff" />
          <Text className="text-sm font-semibold text-white">{t.map.getDirections}</Text>
        </TouchableOpacity>

        {store.phone && (
          <TouchableOpacity
            onPress={onCall}
            className="flex-row items-center justify-center gap-2 py-3 px-5 rounded-xl"
            style={{ backgroundColor: colors.buttonSecondary }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`${t.map.callStore} ${store.name}`}
          >
            <MaterialIcons name="phone" size={20} color={colors.textPrimary} />
            <Text className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
              {t.map.callStore}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
});

// ── Store List Card (horizontal scroll) ────────────────────
const StoreCard = React.memo(function StoreCard({
  store,
  isSelected,
  onPress,
  colors,
}: {
  store: StoreFeatureProperties;
  isSelected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  const certLabel = store.certifier !== "none" ? store.certifier.toUpperCase() : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={`${store.name}, ${store.city}, ${formatDistance(store.distance)}`}
      className="w-[280px] rounded-xl p-3"
      style={{
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: isSelected ? colors.primary : colors.cardBorder,
        shadowColor: isSelected ? colors.primary : "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isSelected ? 0.3 : 0.15,
        shadowRadius: 8,
        elevation: 4,
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
    </TouchableOpacity>
  );
});

// ── Main Map Screen ────────────────────────────────────────
export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { impact } = useHaptics();
  const { t } = useTranslation();
  const { isDark, colors } = useTheme();

  // Location
  const { location: userLocation, permission, isLoading: locationLoading, refresh: refreshLocation } = useUserLocation();

  // Map state
  const cameraRef = useRef<any>(null);
  const [mapRegion, setMapRegion] = useState<{
    latitude: number;
    longitude: number;
    radiusKm: number;
  } | null>(null);

  // Filters
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  // Geocode
  const { suggestions, search: geocodeSearch, clearSuggestions } = useGeocode();
  const [searchText, setSearchText] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Build filter options for useMapStores
  const storeTypeFilter = useMemo(() => {
    for (const f of FILTER_IDS) {
      if (activeFilters.includes(f.id) && "storeType" in f) {
        return f.storeType;
      }
    }
    return undefined;
  }, [activeFilters]);

  const halalCertifiedOnly = activeFilters.includes("certified");

  // Fetch stores
  const storesQuery = useMapStores(mapRegion, {
    storeType: storeTypeFilter,
    halalCertifiedOnly,
    limit: 50,
  });

  const stores = useMemo(() => storesQuery.data ?? [], [storesQuery.data]);

  // Selected store data
  const selectedStore = useMemo(() => {
    if (!selectedStoreId) return null;
    return stores.find((s) => s.id === selectedStoreId) ?? null;
  }, [selectedStoreId, stores]);

  // Build GeoJSON for Mapbox ShapeSource
  const storesGeoJSON = useMemo(() => ({
    type: "FeatureCollection" as const,
    features: stores.map((s) => ({
      type: "Feature" as const,
      id: s.id,
      geometry: {
        type: "Point" as const,
        coordinates: [s.longitude, s.latitude] as [number, number],
      },
      properties: {
        id: s.id,
        name: s.name,
        storeType: s.storeType,
        imageUrl: s.imageUrl,
        address: s.address,
        city: s.city,
        postalCode: s.postalCode,
        phone: s.phone,
        website: s.website,
        certifier: s.certifier,
        certifierName: s.certifierName,
        halalCertified: s.halalCertified,
        averageRating: s.averageRating,
        reviewCount: s.reviewCount,
        distance: s.distance,
      } satisfies StoreFeatureProperties,
    })),
  }), [stores]);

  // Map style based on theme
  const mapStyleURL = isDark
    ? "mapbox://styles/mapbox/dark-v11"
    : "mapbox://styles/mapbox/light-v11";

  // ── Handlers ───────────────────────────────────────────
  const handleRegionChange = useCallback((state: any) => {
    // @rnmapbox/maps v10: { properties: { center: [lng, lat], zoom } }
    const center = state?.properties?.center;
    if (!center) return;
    const zoom = state?.properties?.zoom ?? 10;
    const radiusKm = Math.max(0.5, Math.min(50, 40000 / Math.pow(2, zoom)));
    setMapRegion({
      latitude: center[1],
      longitude: center[0],
      radiusKm,
    });
  }, []);

  const handleMarkerPress = useCallback((event: any) => {
    const feature = event?.features?.[0];
    if (!feature) return;

    // If it's a cluster, zoom in
    if (feature.properties?.cluster) {
      const coords = feature.geometry?.coordinates;
      if (coords) {
        cameraRef.current?.setCamera({
          centerCoordinate: coords,
          zoomLevel: (feature.properties.clusterExpansionZoom ?? 12) + 1,
          animationDuration: 500,
        });
      }
      return;
    }

    // Individual marker
    const storeId = feature.properties?.id;
    if (storeId) {
      impact();
      setSelectedStoreId(storeId);
    }
  }, [impact]);

  const handleMyLocation = useCallback(() => {
    impact();
    if (userLocation) {
      cameraRef.current?.setCamera({
        centerCoordinate: [userLocation.longitude, userLocation.latitude],
        zoomLevel: FOCUSED_ZOOM,
        animationDuration: 800,
      });
    } else {
      refreshLocation();
    }
  }, [userLocation, refreshLocation, impact]);

  const toggleFilter = useCallback((filterId: string) => {
    impact();
    setActiveFilters((prev) =>
      prev.includes(filterId)
        ? prev.filter((id) => id !== filterId)
        : [...prev, filterId]
    );
  }, [impact]);

  const handleSearchTextChange = useCallback((text: string) => {
    setSearchText(text);
    setShowSuggestions(true);
    geocodeSearch(text);
  }, [geocodeSearch]);

  const handleSuggestionPress = useCallback((suggestion: { latitude: number; longitude: number; label: string }) => {
    impact();
    setSearchText(suggestion.label);
    setShowSuggestions(false);
    clearSuggestions();
    Keyboard.dismiss();
    cameraRef.current?.setCamera({
      centerCoordinate: [suggestion.longitude, suggestion.latitude],
      zoomLevel: FOCUSED_ZOOM,
      animationDuration: 800,
    });
  }, [clearSuggestions, impact]);

  const handleStoreCardPress = useCallback((store: typeof stores[number]) => {
    impact();
    setSelectedStoreId(store.id);
    cameraRef.current?.setCamera({
      centerCoordinate: [store.longitude, store.latitude],
      zoomLevel: 15,
      animationDuration: 600,
    });
  }, [impact]);

  const handleCloseDetail = useCallback(() => {
    setSelectedStoreId(null);
  }, []);

  // Initial camera position
  const initialCenter: [number, number] = userLocation
    ? [userLocation.longitude, userLocation.latitude]
    : FRANCE_CENTER;
  const initialZoom = userLocation ? FOCUSED_ZOOM : DEFAULT_ZOOM;

  // ── Render ─────────────────────────────────────────────

  // Fallback when Mapbox isn't available (missing token or native module)
  if (!MAPBOX_AVAILABLE) {
    return (
      <View className="flex-1 items-center justify-center px-8" style={{ backgroundColor: colors.background }}>
        <MaterialIcons name="map" size={64} color={colors.textMuted} />
        <Text className="text-lg font-bold mt-4 text-center" style={{ color: colors.textPrimary }}>
          {t.map.title}
        </Text>
        <Text className="text-sm mt-2 text-center leading-5" style={{ color: colors.textSecondary }}>
          {MAPBOX_TOKEN
            ? "La carte nécessite un rebuild du client de développement.\n\nLancez : npx expo prebuild && npx expo run:android"
            : "Le token Mapbox est manquant. Vérifiez EXPO_PUBLIC_MAPBOX_TOKEN dans votre fichier .env et relancez le build."}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Mapbox Map */}
      <MapView
        style={{ flex: 1 }}
        styleURL={mapStyleURL}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled
        compassViewPosition={2}
        compassViewMargins={{ x: 16, y: SCREEN_HEIGHT * 0.35 }}
        scaleBarEnabled={false}
        onCameraChanged={handleRegionChange}
      >
        <Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: initialCenter,
            zoomLevel: initialZoom,
          }}
          animationDuration={0}
        />

        {/* User location puck */}
        {permission === "granted" && (
          <LocationPuck
            puckBearingEnabled
            pulsing={{ isEnabled: true, color: colors.primary }}
          />
        )}

        {/* Store markers with clustering */}
        {stores.length > 0 && (
          <ShapeSource
            id="stores-source"
            shape={storesGeoJSON}
            cluster
            clusterRadius={50}
            clusterMaxZoomLevel={14}
            onPress={handleMarkerPress}
          >
            {/* Cluster circles */}
            <CircleLayer
              id="clusters"
              filter={["has", "point_count"]}
              style={{
                circleColor: colors.primary,
                circleRadius: [
                  "step",
                  ["get", "point_count"],
                  18,  // default
                  10, 24, // 10+ stores
                  50, 32, // 50+ stores
                ],
                circleOpacity: 0.85,
                circleStrokeWidth: 2,
                circleStrokeColor: "#ffffff",
              }}
            />

            {/* Cluster count text */}
            <SymbolLayer
              id="cluster-count"
              filter={["has", "point_count"]}
              style={{
                textField: ["get", "point_count_abbreviated"],
                textSize: 13,
                textColor: "#ffffff",
                textFont: ["DIN Pro Medium"],
                textAllowOverlap: true,
              }}
            />

            {/* Individual store markers */}
            <CircleLayer
              id="store-markers"
              filter={["!", ["has", "point_count"]]}
              style={{
                circleColor: [
                  "case",
                  ["get", "halalCertified"],
                  colors.primary,
                  isDark ? "#64748b" : "#94a3b8",
                ],
                circleRadius: [
                  "case",
                  ["==", ["get", "id"], selectedStoreId ?? ""],
                  10,
                  7,
                ],
                circleStrokeWidth: 2,
                circleStrokeColor: "#ffffff",
                circleOpacity: 0.9,
              }}
            />
          </ShapeSource>
        )}
      </MapView>

      {/* Top Header with gradient */}
      <View className="absolute top-0 left-0 right-0" style={{ zIndex: 10 }}>
        <LinearGradient
          colors={
            isDark
              ? ["rgba(16,34,23,0.95)", "rgba(16,34,23,0.6)", "transparent"]
              : ["rgba(246,248,247,0.95)", "rgba(246,248,247,0.6)", "transparent"]
          }
          style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 32 }}
        >
          {/* Search Bar */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            className="flex-row gap-3 mb-3"
          >
            <View
              className="flex-1 h-12 flex-row items-center px-4 rounded-xl"
              style={{
                backgroundColor: isDark ? "rgba(30,41,59,0.9)" : "rgba(255,255,255,0.95)",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <MaterialIcons name="search" size={20} color={colors.textMuted} />
              <TextInput
                value={searchText}
                onChangeText={handleSearchTextChange}
                placeholder={t.map.searchAddress}
                placeholderTextColor={colors.textMuted}
                className="flex-1 ml-3 text-base"
                style={{ color: colors.textPrimary }}
                returnKeyType="search"
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => {
                  // Delay to allow suggestion press
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
              />
              {searchText.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchText("");
                    clearSuggestions();
                    setShowSuggestions(false);
                  }}
                  hitSlop={8}
                >
                  <MaterialIcons name="close" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>

          {/* Geocode Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <Animated.View
              entering={FadeIn.duration(200)}
              className="rounded-xl mb-3 overflow-hidden"
              style={{
                backgroundColor: isDark ? "rgba(30,41,59,0.95)" : "rgba(255,255,255,0.98)",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              {suggestions.map((s, i) => (
                <TouchableOpacity
                  key={`${s.latitude}-${s.longitude}-${i}`}
                  onPress={() => handleSuggestionPress(s)}
                  className="flex-row items-center px-4 py-3"
                  style={{
                    borderBottomWidth: i < suggestions.length - 1 ? 1 : 0,
                    borderBottomColor: colors.borderLight,
                  }}
                >
                  <MaterialIcons name="place" size={18} color={colors.primary} />
                  <View className="flex-1 ml-3">
                    <Text className="text-sm" style={{ color: colors.textPrimary }} numberOfLines={1}>
                      {s.label}
                    </Text>
                    <Text className="text-xs" style={{ color: colors.textMuted }}>
                      {s.postcode} {s.city}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}

          {/* Filter Chips */}
          <Animated.ScrollView
            entering={FadeInRight.delay(200).duration(400)}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {FILTER_IDS.map((filter) => {
              const isActive = activeFilters.includes(filter.id);
              const filterLabel = t.map.filters[filter.filterKey];
              return (
                <TouchableOpacity
                  key={filter.id}
                  onPress={() => toggleFilter(filter.id)}
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
                  accessibilityLabel={`${filterLabel}${isActive ? `, ${t.common.selected}` : ""}`}
                >
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

      {/* Map Controls (right side) */}
      <View
        className="absolute right-4 gap-2"
        style={{ top: insets.top + 140, zIndex: 5 }}
      >
        {/* My Location FAB */}
        <TouchableOpacity
          onPress={handleMyLocation}
          className="w-11 h-11 rounded-xl items-center justify-center"
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
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t.map.myLocation}
        >
          <MaterialIcons
            name="my-location"
            size={22}
            color={userLocation ? colors.primary : colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      {/* Results count badge */}
      {stores.length > 0 && !selectedStore && (
        <Animated.View
          entering={FadeIn.delay(400).duration(400)}
          className="absolute right-4"
          style={{ bottom: 260 + insets.bottom, zIndex: 5 }}
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
              {stores.length} {stores.length > 1 ? t.map.stores : t.map.store}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Loading indicator */}
      {(storesQuery.isFetching || locationLoading) && (
        <View
          className="absolute left-4"
          style={{ bottom: 260 + insets.bottom, zIndex: 5 }}
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
              {locationLoading ? t.map.locating : t.map.searchResults}
            </Text>
          </View>
        </View>
      )}

      {/* Bottom Sheet */}
      <Animated.View
        entering={SlideInUp.delay(300).duration(500)}
        className="absolute bottom-0 left-0 right-0 rounded-t-2xl"
        style={{
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.cardBorder,
          minHeight: selectedStore ? 220 + insets.bottom : 240 + insets.bottom,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        {/* Handle */}
        <View className="w-full h-6 items-center justify-center pt-2">
          <View className="w-10 h-1 rounded-full" style={{ backgroundColor: colors.border }} />
        </View>

        {selectedStore ? (
          /* Store Detail */
          <StoreDetailCard
            store={selectedStore as StoreFeatureProperties}
            onDirections={() => openDirections(
              selectedStore.latitude,
              selectedStore.longitude,
              selectedStore.name,
            )}
            onCall={() => selectedStore.phone && callStore(selectedStore.phone)}
            onClose={handleCloseDetail}
            colors={colors}
          />
        ) : (
          /* Store List */
          <View className="flex-1 pb-4">
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 mb-3">
              <Text
                accessibilityRole="header"
                className="text-lg font-bold"
                style={{ color: colors.textPrimary }}
              >
                {t.map.nearYou}
              </Text>
              {stores.length > 0 && (
                <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
                  {stores.length} {stores.length > 1 ? t.map.stores : t.map.store}
                </Text>
              )}
            </View>

            {/* Store Cards */}
            {storesQuery.isPending && !storesQuery.data ? (
              <View className="flex-1 items-center justify-center py-8">
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : stores.length === 0 ? (
              <View className="flex-1 items-center justify-center px-8 py-6">
                <MaterialIcons name="explore" size={32} color={colors.textMuted} />
                <Text className="text-sm mt-2 text-center" style={{ color: colors.textSecondary }}>
                  {mapRegion ? t.map.noStoresFound : t.map.locating}
                </Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
                snapToInterval={CARD_WIDTH + 12}
                decelerationRate="fast"
              >
                {stores.map((store, index) => (
                  <Animated.View
                    key={store.id}
                    entering={FadeInRight.delay(index * 80).duration(300)}
                  >
                    <StoreCard
                      store={store as StoreFeatureProperties}
                      isSelected={store.id === selectedStoreId}
                      onPress={() => handleStoreCardPress(store)}
                      colors={colors}
                    />
                  </Animated.View>
                ))}
              </ScrollView>
            )}
          </View>
        )}
      </Animated.View>

      {/* Location denied banner */}
      {permission === "denied" && (
        <Animated.View
          entering={FadeIn.duration(400)}
          className="absolute left-4 right-4 rounded-xl p-4"
          style={{
            top: insets.top + 160,
            backgroundColor: isDark ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.1)",
            borderWidth: 1,
            borderColor: "rgba(239,68,68,0.3)",
            zIndex: 15,
          }}
        >
          <Text className="text-sm font-semibold" style={{ color: "#ef4444" }}>
            {t.map.locationDenied}
          </Text>
          <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
            {t.map.locationDeniedDesc}
          </Text>
          <TouchableOpacity
            onPress={() => Linking.openSettings()}
            className="mt-2 self-start px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: "rgba(239,68,68,0.2)" }}
          >
            <Text className="text-xs font-semibold" style={{ color: "#ef4444" }}>
              {t.map.openSettings}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}
