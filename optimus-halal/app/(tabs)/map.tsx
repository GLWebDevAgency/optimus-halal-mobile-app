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

import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Linking,
  Platform,
  Keyboard,
  Share,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useHaptics, useUserLocation, useMapStores, useMapSearch } from "@/hooks";
import type { SearchResult } from "@/hooks";
import { useTranslation } from "@/hooks/useTranslation";
import { useTheme } from "@/hooks/useTheme";
import {
  StoreCard,
  StoreDetailCard,
  MapMarkerLayer,
  MapControls,
  MapSearchOverlay,
  CARD_WIDTH,
} from "@/components/map";
import type { StoreFeatureProperties } from "@/components/map";
import { trackEvent } from "@/lib/analytics";
import Animated, { FadeIn, FadeInRight } from "react-native-reanimated";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
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

// Default center: France
const FRANCE_CENTER: [number, number] = [2.3522, 46.6034];
const DEFAULT_ZOOM = 5;
const FOCUSED_ZOOM = 13;

// Module-level: persists across tab navigation (React unmount/remount)
// but resets on app restart (fresh animation on cold start)
let _hasAnimatedToUser = false;
let _lastViewport: { center: [number, number]; zoom: number } | null = null;

// Filter → storeType mapping (backend enum values)
const FILTER_IDS = [
  { id: "butcher", filterKey: "butchers" as const, storeType: "butcher" as const },
  { id: "restaurant", filterKey: "restaurants" as const, storeType: "restaurant" as const },
  { id: "supermarket", filterKey: "grocery" as const, storeType: "supermarket" as const },
  { id: "bakery", filterKey: "bakery" as const, storeType: "bakery" as const },
  { id: "certified", filterKey: "certified" as const, halalOnly: true },
  { id: "openNow", filterKey: "openNow" as const, openNow: true },
  { id: "rating", filterKey: "rating" as const, minRating: 4 },
];

// ── Helpers ────────────────────────────────────────────────
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

// ── Main Map Screen ────────────────────────────────────────
export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { impact } = useHaptics();
  const { t } = useTranslation();
  const { isDark, colors } = useTheme();

  // Deep-link params from home carousel "Autour de vous"
  const { storeId: deepLinkStoreId, storeLat, storeLng, storeName } =
    useLocalSearchParams<{
      storeId?: string;
      storeLat?: string;
      storeLng?: string;
      storeName?: string;
    }>();
  const deepLinkHandledRef = useRef<string | null>(null);

  // Location
  const { location: userLocation, permission, isLoading: locationLoading, refresh: refreshLocation } = useUserLocation();

  // Map state
  const cameraRef = useRef<any>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => [240 + insets.bottom, "50%", "90%"], [insets.bottom]);
  // Initialize with France center so the query fires immediately —
  // waiting for onMapIdle can hang forever if Mapbox tiles fail to load
  const [mapRegion, setMapRegion] = useState<{
    latitude: number;
    longitude: number;
    radiusKm: number;
  }>({
    latitude: FRANCE_CENTER[1],
    longitude: FRANCE_CENTER[0],
    radiusKm: 50,
  });

  // Filters
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  // Hybrid search (stores + addresses) — 300ms debounce built into hook
  const { results: searchResults, isSearching: isSearchActive, search: hybridSearch, clear: clearSearch } = useMapSearch();
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
  const openNowFilter = activeFilters.includes("openNow");
  const minRatingFilter = activeFilters.includes("rating") ? 4 : undefined;

  // Fetch stores — mapRegion is always non-null (initialized with France center)
  const storesQuery = useMapStores(mapRegion, {
    storeType: storeTypeFilter,
    halalCertifiedOnly,
    openNow: openNowFilter,
    minRating: minRatingFilter,
    limit: 100,
  });

  const stores = useMemo(() => storesQuery.data ?? [], [storesQuery.data]);

  const hasShownListRef = useRef(false);

  useEffect(() => {
    if (stores.length > 0 && !hasShownListRef.current) {
      hasShownListRef.current = true;
    }
  }, [stores.length]);

  const [isStyleLoaded, setIsStyleLoaded] = useState(false);

  // Selected store data
  const selectedStore = useMemo(() => {
    if (!selectedStoreId) return null;
    return stores.find((s) => s.id === selectedStoreId) ?? null;
  }, [selectedStoreId, stores]);

  // Build GeoJSON for Mapbox ShapeSource
  const storesGeoJSON = useMemo(() => ({
    type: "FeatureCollection" as const,
    features: stores.map((s, index) => ({
      type: "Feature" as const,
      id: index,
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
        phone: s.phone,
        certifier: s.certifier,
        certifierName: s.certifierName,
        halalCertified: s.halalCertified,
        averageRating: s.averageRating,
        reviewCount: s.reviewCount,
        distance: s.distance,
        openStatus: s.openStatus ?? "unknown",
        openTime: s.openTime ?? null,
        closeTime: s.closeTime ?? null,
      } satisfies StoreFeatureProperties,
    })),
  }), [stores]);

  // Map style based on theme
  const mapStyleURL = isDark
    ? "mapbox://styles/mapbox/dark-v11"
    : "mapbox://styles/mapbox/light-v11";

  // "Search this area" — manual refresh fallback (shows after large pans)
  const lastCommittedCenterRef = useRef<[number, number] | null>(null);
  const [showSearchThisArea, setShowSearchThisArea] = useState(false);

  // ── Camera idle detection (Google Maps pattern) ─────────
  // Instead of relying on onMapIdle (tile-dependent, unreliable) or
  // a simple throttle (misses final deceleration position), we debounce:
  // save every camera state, fire region update Xms after the LAST change.
  const lastCenterRef = useRef<[number, number] | null>(null);
  const cameraIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCameraStateRef = useRef<any>(null);

  const commitRegionUpdate = useCallback((state: any, force = false) => {
    const center = state?.properties?.center;
    if (!center) return;

    // Quantize to ~110m grid (0.001°). This is the KEY perf optimization:
    // speculative prefetches during gesture produce the SAME quantized coords
    // as the final fetch → TanStack Query returns from memory cache instantly.
    const lat = Math.round(center[1] * 1000) / 1000;
    const lng = Math.round(center[0] * 1000) / 1000;

    // Skip if quantized position hasn't changed
    if (lastCenterRef.current) {
      const [prevLng, prevLat] = lastCenterRef.current;
      if (lat === prevLat && lng === prevLng) return;
    }

    const zoom = state?.properties?.zoom ?? 10;
    const radiusKm = Math.max(0.5, Math.min(50, 40000 / Math.pow(2, zoom)));

    // 2km gate: if the new center is < 2km from last committed center,
    // show "Search this area" button instead of auto-refetching.
    // This prevents excessive API calls during small pan adjustments.
    if (!force && lastCommittedCenterRef.current) {
      const [cLng, cLat] = lastCommittedCenterRef.current;
      // Fast equirectangular approximation (accurate enough for < 50km)
      const dLat = (lat - cLat) * 111.32;
      const dLng = (lng - cLng) * 111.32 * Math.cos((lat * Math.PI) / 180);
      const distKm = Math.sqrt(dLat * dLat + dLng * dLng);
      if (distKm < 2) {
        lastCenterRef.current = [lng, lat];
        _lastViewport = { center: [center[0], center[1]], zoom };
        setShowSearchThisArea(true);
        return;
      }
    }

    lastCenterRef.current = [lng, lat];
    setMapRegion({ latitude: lat, longitude: lng, radiusKm });

    // Persist viewport for tab remount restoration
    _lastViewport = { center: [center[0], center[1]], zoom };

    // Hide "search this area" on every successful region commit
    setShowSearchThisArea(false);
    lastCommittedCenterRef.current = [lng, lat];

    trackEvent("map_viewport_changed", {
      center_lat: Math.round(center[1] * 100) / 100,
      center_lng: Math.round(center[0] * 100) / 100,
      zoom_level: Math.round(zoom),
    });
  }, []);

  // Speculative prefetch: fires every ~1s DURING gesture to warm caches
  // (both TanStack Query in-memory and backend Redis). When the finger lifts,
  // the final position's quantized coords likely match a speculative fetch
  // → data appears from cache with 0ms network wait.
  const lastSpeculativeTsRef = useRef(0);

  // Camera handler with speculative prefetch + short post-gesture debounce.
  const handleCameraChanged = useCallback((state: any) => {
    lastCameraStateRef.current = state;

    if (cameraIdleTimerRef.current) clearTimeout(cameraIdleTimerRef.current);

    const isActive = state?.gestures?.isGestureActive;

    if (isActive) {
      // During gesture: speculative prefetch every 1s + 2s safety net
      const now = Date.now();
      if (now - lastSpeculativeTsRef.current > 1000) {
        lastSpeculativeTsRef.current = now;
        commitRegionUpdate(state);
      }
      // Safety net if no post-gesture event fires
      cameraIdleTimerRef.current = setTimeout(() => {
        commitRegionUpdate(lastCameraStateRef.current);
      }, 2000);
      return;
    }

    // Post-gesture: short 200ms debounce to capture final deceleration
    cameraIdleTimerRef.current = setTimeout(() => {
      commitRegionUpdate(lastCameraStateRef.current);
    }, 200);
  }, [commitRegionUpdate]);

  // Cleanup idle timer on unmount
  useEffect(() => {
    return () => {
      if (cameraIdleTimerRef.current) clearTimeout(cameraIdleTimerRef.current);
    };
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
      trackEvent("map_cluster_expanded", { cluster_size: feature.properties?.point_count ?? 0 });
      return;
    }

    // Individual marker
    const storeId = feature.properties?.id;
    if (storeId) {
      impact();
      setSelectedStoreId(storeId);
      trackEvent("map_store_tapped", { store_id: storeId, source: "marker" });
    }
  }, [impact]);

  const handleMyLocation = useCallback(() => {
    trackEvent("map_my_location_tapped", { had_location: !!userLocation });
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
    setActiveFilters((prev) => {
      const wasActive = prev.includes(filterId);
      const isTypeFilter = FILTER_IDS.some((f) => f.id === filterId && "storeType" in f);

      let next: string[];
      if (wasActive) {
        next = prev.filter((id) => id !== filterId);
      } else if (isTypeFilter) {
        // Type filters are mutually exclusive — deselect other types first
        const otherTypeIds = FILTER_IDS.filter((f) => "storeType" in f && f.id !== filterId).map((f) => f.id);
        next = [...prev.filter((id) => !otherTypeIds.includes(id)), filterId];
      } else {
        next = [...prev, filterId];
      }

      trackEvent("map_filter_toggled", { filter_id: filterId, action: wasActive ? "disabled" : "enabled" });
      return next;
    });
  }, [impact]);

  const handleSearchTextChange = useCallback((text: string) => {
    setSearchText(text);
    setShowSuggestions(true);
    hybridSearch(text);
  }, [hybridSearch]);

  const handleSearchResultPress = useCallback((result: SearchResult) => {
    impact();
    setShowSuggestions(false);
    clearSearch();
    Keyboard.dismiss();

    if (result.type === "store") {
      // Store result: fly-to + select + open detail
      setSearchText(result.name);
      setSelectedStoreId(result.id);
      trackEvent("map_search", { type: "store", store_id: result.id, store_name: result.name });
      cameraRef.current?.setCamera({
        centerCoordinate: [result.longitude, result.latitude],
        zoomLevel: 16,
        animationDuration: 1000,
        animationMode: "flyTo",
        padding: { bottom: SCREEN_HEIGHT * 0.3, top: 0, left: 0, right: 0 },
      });
    } else {
      // Address result: fly-to only
      setSearchText(result.label);
      trackEvent("map_search", { type: "address", address: result.label });
      cameraRef.current?.setCamera({
        centerCoordinate: [result.longitude, result.latitude],
        zoomLevel: FOCUSED_ZOOM,
        animationDuration: 800,
      });
    }
  }, [clearSearch, impact]);

  const handleSearchThisArea = useCallback(() => {
    // Force bypass the 2km gate and fetch at current camera position
    if (lastCameraStateRef.current) {
      commitRegionUpdate(lastCameraStateRef.current, true);
    }
    storesQuery.refetch();
    setShowSearchThisArea(false);
    trackEvent("map_search_this_area", {});
  }, [commitRegionUpdate, storesQuery]);

  const handleStoreCardPress = useCallback((store: typeof stores[number]) => {
    impact();
    setSelectedStoreId(store.id);
    trackEvent("map_store_tapped", { store_id: store.id, source: "card", distance_m: store.distance });
    cameraRef.current?.setCamera({
      centerCoordinate: [store.longitude, store.latitude],
      zoomLevel: 16,
      animationDuration: 800,
      animationMode: "flyTo",
      padding: { bottom: SCREEN_HEIGHT * 0.3, top: 0, left: 0, right: 0 },
    });
  }, [impact]);

  // Stable callback for StoreCard (avoids breaking React.memo with anonymous lambdas)
  const storesRef = useRef(stores);
  storesRef.current = stores;
  const handleStoreCardPressById = useCallback((storeId: string) => {
    const store = storesRef.current.find((s) => s.id === storeId);
    if (store) handleStoreCardPress(store);
  }, [handleStoreCardPress]);

  const handleCloseDetail = useCallback(() => {
    setSelectedStoreId(null);
  }, []);

  // Progressive zoom: fly to user on first load only.
  // _hasAnimatedToUser is module-level → survives tab navigation (no re-zoom).
  // _lastViewport is module-level → restores camera position on remount.
  const [hasAnimatedToUser, setHasAnimatedToUser] = useState(_hasAnimatedToUser);

  useEffect(() => {
    if (!isStyleLoaded || !cameraRef.current) return;

    // Returning to map tab — restore last viewport instantly (no animation)
    if (_hasAnimatedToUser && _lastViewport) {
      cameraRef.current.setCamera({
        centerCoordinate: _lastViewport.center,
        zoomLevel: _lastViewport.zoom,
        animationDuration: 0,
      });
      return;
    }

    // First load — fly to user location
    if (userLocation && !hasAnimatedToUser) {
      setHasAnimatedToUser(true);
      _hasAnimatedToUser = true;
      cameraRef.current.setCamera({
        centerCoordinate: [userLocation.longitude, userLocation.latitude],
        zoomLevel: FOCUSED_ZOOM,
        animationDuration: 2000,
        animationMode: "flyTo",
      });
    }
  }, [userLocation, hasAnimatedToUser, isStyleLoaded]);

  // Show "search this area" as manual retry when auto-fetch returned 0 results
  // and the user has interacted with the map (not initial load)
  useEffect(() => {
    if (!storesQuery.isFetching && storesQuery.data?.length === 0 && hasAnimatedToUser) {
      setShowSearchThisArea(true);
    }
  }, [storesQuery.isFetching, storesQuery.data?.length, hasAnimatedToUser]);

  // Auto-snap bottom sheet on store selection
  useEffect(() => {
    if (selectedStoreId) {
      bottomSheetRef.current?.snapToIndex(1); // half
    } else {
      bottomSheetRef.current?.snapToIndex(0); // peek
    }
  }, [selectedStoreId]);

  // Deep-link: fly to store from home carousel "Autour de vous"
  // Waits for map style to load, then animates camera + selects store + opens sheet
  useEffect(() => {
    if (!isStyleLoaded || !cameraRef.current) return;
    if (!deepLinkStoreId || !storeLat || !storeLng) return;
    // Prevent re-triggering on tab re-focus with same params
    if (deepLinkHandledRef.current === deepLinkStoreId) return;
    deepLinkHandledRef.current = deepLinkStoreId;

    const lat = parseFloat(storeLat);
    const lng = parseFloat(storeLng);
    if (isNaN(lat) || isNaN(lng)) return;

    // Skip the normal user-location fly-to — deep-link takes priority
    _hasAnimatedToUser = true;
    setHasAnimatedToUser(true);

    // Fly to store with padding for bottom sheet
    cameraRef.current.setCamera({
      centerCoordinate: [lng, lat],
      zoomLevel: 15,
      animationDuration: 1200,
      animationMode: "flyTo",
      padding: { bottom: SCREEN_HEIGHT * 0.3, top: 0, left: 0, right: 0 },
    });

    // Select the store to open bottom sheet detail card
    setSelectedStoreId(deepLinkStoreId);
    impact();

    trackEvent("map_deep_link", {
      store_id: deepLinkStoreId,
      store_name: storeName ?? "",
      source: "home_carousel",
    });
  }, [isStyleLoaded, deepLinkStoreId, storeLat, storeLng, storeName, impact, hasAnimatedToUser]);

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
        onCameraChanged={handleCameraChanged}
        onDidFinishLoadingMap={() => {
          setIsStyleLoaded(true);
          trackEvent("map_opened", { source: "tab_bar", has_location: !!userLocation });
        }}
      >
        <Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: FRANCE_CENTER,
            zoomLevel: DEFAULT_ZOOM,
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

        {/* Store markers with clustering — wait for style to load */}
        {isStyleLoaded && (
          <MapMarkerLayer
            ShapeSource={ShapeSource}
            CircleLayer={CircleLayer}
            SymbolLayer={SymbolLayer}
            geoJSON={storesGeoJSON}
            selectedStoreId={selectedStoreId}
            isDark={isDark}
            primaryColor={colors.primary}
            onPress={handleMarkerPress}
          />
        )}
      </MapView>

      {/* Search bar + suggestions + filter chips */}
      <MapSearchOverlay
        colors={colors}
        isDark={isDark}
        insetTop={insets.top}
        searchText={searchText}
        isSearchActive={isSearchActive}
        showSuggestions={showSuggestions}
        searchResults={searchResults}
        activeFilters={activeFilters}
        filters={FILTER_IDS}
        onSearchTextChange={handleSearchTextChange}
        onClearSearch={() => {
          setSearchText("");
          clearSearch();
          setShowSuggestions(false);
        }}
        onShowSuggestions={setShowSuggestions}
        onSearchResultPress={handleSearchResultPress}
        onToggleFilter={toggleFilter}
        t={{
          searchStores: t.map.searchStores,
          storeResults: t.map.storeResults,
          addresses: t.map.addresses,
          filters: t.map.filters as unknown as Record<string, string>,
          selected: t.common.selected,
        }}
      />

      {/* "Search this area" floating button */}
      {showSearchThisArea && (
        <Animated.View
          entering={FadeIn.duration(200)}
          className="absolute self-center"
          style={{ top: insets.top + 130, zIndex: 15 }}
        >
          <TouchableOpacity
            onPress={handleSearchThisArea}
            className="flex-row items-center gap-2 h-10 px-5 rounded-full"
            style={{
              backgroundColor: colors.primary,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 4,
            }}
            activeOpacity={0.8}
          >
            <MaterialIcons name="refresh" size={16} color="#fff" />
            <Text className="text-sm font-semibold text-white">{t.map.searchThisArea}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Map Controls — FAB, results badge, loading indicator */}
      <MapControls
        colors={colors}
        isDark={isDark}
        userLocation={userLocation}
        storeCount={stores.length}
        isSelectedStore={!!selectedStore}
        isFetching={storesQuery.isFetching}
        isLocationLoading={locationLoading}
        insetTop={insets.top}
        insetBottom={insets.bottom}
        onMyLocation={handleMyLocation}
        t={{
          myLocation: t.map.myLocation,
          stores: t.map.stores,
          store: t.map.store,
          locating: t.map.locating,
          searchResults: t.map.searchResults,
        }}
      />

      {/* Bottom Sheet — gesture-driven, Google Maps style */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        backgroundStyle={{
          backgroundColor: colors.card,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}
        handleIndicatorStyle={{
          backgroundColor: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)",
          width: 36,
          height: 4,
          borderRadius: 2,
        }}
        enableDynamicSizing={false}
        animateOnMount
        onChange={(index) => {
          // Haptic feedback on snap position change (Google Maps feel)
          impact();
        }}
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: isDark ? 0.4 : 0.15,
          shadowRadius: 12,
          elevation: 12,
        }}
      >
        <BottomSheetView style={{ flex: 1 }}>
          {selectedStore ? (
            /* Store Detail */
            <StoreDetailCard
              store={selectedStore as StoreFeatureProperties}
              onDirections={() => {
                trackEvent("map_get_directions", { store_id: selectedStore.id });
                openDirections(selectedStore.latitude, selectedStore.longitude, selectedStore.name);
              }}
              onCall={() => {
                trackEvent("map_call_store", { store_id: selectedStore.id });
                selectedStore.phone && callStore(selectedStore.phone);
              }}
              onShare={() => {
                trackEvent("map_share_store", { store_id: selectedStore.id });
                const certInfo = selectedStore.halalCertified ? " (Halal Certifié)" : "";
                Share.share({
                  message: `${selectedStore.name}${certInfo}\n${selectedStore.address}, ${selectedStore.city}\n\nDécouvert sur Optimus Halal`,
                });
              }}
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
              {(storesQuery.isLoading || locationLoading || (storesQuery.isFetching && stores.length === 0)) ? (
                <View className="flex-1 items-center justify-center py-8">
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text className="text-xs mt-2" style={{ color: colors.textMuted }}>
                    {locationLoading ? t.map.locating : t.map.searchResults}
                  </Text>
                </View>
              ) : stores.length === 0 ? (
                <View className="flex-1 items-center justify-center px-8 py-6">
                  <MaterialIcons name="explore" size={32} color={colors.textMuted} />
                  <Text className="text-sm mt-2 text-center" style={{ color: colors.textSecondary }}>
                    {t.map.noStoresFound}
                  </Text>
                </View>
              ) : (
                <FlatList
                  horizontal
                  data={stores}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item, index }) => (
                    <Animated.View
                      entering={hasShownListRef.current ? undefined : FadeInRight.delay(Math.min(index * 80, 400)).duration(300)}
                    >
                      <StoreCard
                        store={item as StoreFeatureProperties}
                        isSelected={item.id === selectedStoreId}
                        onPressId={handleStoreCardPressById}
                        colors={colors}
                      />
                    </Animated.View>
                  )}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
                  snapToInterval={CARD_WIDTH + 12}
                  decelerationRate="fast"
                  getItemLayout={(_, index) => ({
                    length: CARD_WIDTH + 12,
                    offset: (CARD_WIDTH + 12) * index,
                    index,
                  })}
                  windowSize={3}
                  maxToRenderPerBatch={5}
                  initialNumToRender={3}
                />
              )}
            </View>
          )}
        </BottomSheetView>
      </BottomSheet>

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
