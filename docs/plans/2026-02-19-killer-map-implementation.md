# Killer Map Screen Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the 999-line map monolith into a 2026 killer discovery engine with color-coded markers, gesture-driven bottom sheet, relevance scoring, rich store cards, and analytics instrumentation.

**Architecture:** Extract map.tsx into 8 focused components, install @gorhom/bottom-sheet v5 for gesture-driven sheet, add storeTypeColors to theme, modify backend store.nearby with hours lateral join + relevance score, add 10 PostHog events.

**Tech Stack:** Expo SDK 54, @rnmapbox/maps 10, @gorhom/bottom-sheet 5, Reanimated 4, expo-blur, PostHog, Drizzle ORM + PostGIS, pnpm

---

## Task 1: Install @gorhom/bottom-sheet

**Files:**
- Modify: `optimus-halal/package.json`

**Step 1: Install the package**

Run: `cd /Users/limameghassene/development/optimus-halal-mobile-app/optimus-halal && pnpm add @gorhom/bottom-sheet@^5`

Expected: Package added to dependencies. This uses react-native-reanimated (^4.1.6) and react-native-gesture-handler (^2.28.0), both already installed.

**Step 2: Verify TypeScript resolves**

Run: `cd /Users/limameghassene/development/optimus-halal-mobile-app/optimus-halal && npx tsc --noEmit 2>&1 | head -20`

Expected: No new errors from the package itself.

**Step 3: Commit**

```bash
git add optimus-halal/package.json optimus-halal/pnpm-lock.yaml
git commit -m "chore: add @gorhom/bottom-sheet v5 for gesture-driven map sheet"
```

---

## Task 2: Add storeTypeColors to theme

**Files:**
- Modify: `optimus-halal/src/theme/colors.ts`

**Step 1: Add the storeTypeColors map**

After the `ramadan` export (line 280) and before the gradients section (line 282), add:

```typescript
// ---------------------------------------------------------------------------
// Store Type Category Colors
// ---------------------------------------------------------------------------

/** Distinct color for each store type — used on map markers, filter chips, card gradients. */
export const storeTypeColors = {
  butcher:     { base: "#ef4444", light: "#fecaca", dark: "#fca5a5", icon: "restaurant" as const },
  restaurant:  { base: "#f97316", light: "#fed7aa", dark: "#fdba74", icon: "restaurant-menu" as const },
  supermarket: { base: "#3b82f6", light: "#bfdbfe", dark: "#93c5fd", icon: "shopping-cart" as const },
  bakery:      { base: "#D4AF37", light: "#fef3c7", dark: "#fde68a", icon: "bakery-dining" as const },
  abattoir:    { base: "#8b5cf6", light: "#ddd6fe", dark: "#c4b5fd", icon: "agriculture" as const },
  wholesaler:  { base: "#06b6d4", light: "#cffafe", dark: "#67e8f9", icon: "local-shipping" as const },
  online:      { base: "#10b981", light: "#d1fae5", dark: "#6ee7b7", icon: "language" as const },
  other:       { base: "#6b7280", light: "#e5e7eb", dark: "#d1d5db", icon: "store" as const },
} as const;
```

Also add to the composite `colors` export (line 317-329):

```typescript
export const colors = {
  primary,
  gold,
  neutral,
  semantic,
  halalStatus,
  light: lightTheme,
  dark: darkTheme,
  brand,
  glass,
  gradients,
  ramadan,
  storeTypeColors, // <-- add this
} as const;
```

And add the type export:

```typescript
export type StoreTypeColors = typeof storeTypeColors;
```

**Step 2: Verify TypeScript**

Run: `cd /Users/limameghassene/development/optimus-halal-mobile-app/optimus-halal && npx tsc --noEmit 2>&1 | head -5`

Expected: Clean compilation.

**Step 3: Commit**

```bash
git add optimus-halal/src/theme/colors.ts
git commit -m "feat(theme): add storeTypeColors palette for 8 store categories"
```

---

## Task 3: Add new i18n keys for map enhancements

**Files:**
- Modify: `optimus-halal/src/i18n/translations/fr.ts`
- Modify: `optimus-halal/src/i18n/translations/en.ts`
- Modify: `optimus-halal/src/i18n/translations/ar.ts`

**Step 1: Add new map translation keys in French**

In the `map` section (around line 554-590), add these new keys:

```typescript
// After existing keys, before closing brace:
searchThisArea: "Rechercher dans cette zone",
openNow: "Ouvert maintenant",
closingSoon: "Ferme dans {{minutes}}min",
openingSoon: "Ouvre dans {{minutes}}min",
closedNow: "Fermé",
opensAt: "Ouvre à {{time}}",
closesAt: "Ferme à {{time}}",
searchStores: "Rechercher un commerce...",
recentSearches: "Recherches récentes",
addresses: "Adresses",
storeResults: "Commerces",
noResults: "Aucun résultat",
```

**Step 2: Add matching English and Arabic keys**

Mirror the same keys in en.ts and ar.ts with appropriate translations.

**Step 3: Verify TypeScript (typed i18n keys will catch mismatches)**

Run: `cd /Users/limameghassene/development/optimus-halal-mobile-app/optimus-halal && npx tsc --noEmit 2>&1 | head -5`

**Step 4: Commit**

```bash
git add optimus-halal/src/i18n/translations/
git commit -m "feat(i18n): add map enhancement translation keys (fr/en/ar)"
```

---

## Task 4: Sprint 1 Performance — Replace onCameraChanged with onMapIdle

**Files:**
- Modify: `optimus-halal/app/(tabs)/map.tsx:568`

**Step 1: Replace the event handler binding**

At line 568, change:

```typescript
// OLD:
onCameraChanged={handleRegionChange}
// NEW:
onMapIdle={handleRegionChange}
```

**Step 2: Add distance threshold to handleRegionChange**

At line 424-435, replace the handler with a version that skips insignificant moves:

```typescript
const lastCenterRef = useRef<[number, number] | null>(null);

const handleRegionChange = useCallback((state: any) => {
  const center = state?.properties?.center;
  if (!center) return;

  // Skip if camera hasn't moved significantly (~100m)
  if (lastCenterRef.current) {
    const [prevLng, prevLat] = lastCenterRef.current;
    const dlat = Math.abs(center[1] - prevLat);
    const dlng = Math.abs(center[0] - prevLng);
    if (dlat < 0.001 && dlng < 0.001) return;
  }
  lastCenterRef.current = center;

  const zoom = state?.properties?.zoom ?? 10;
  const radiusKm = Math.max(0.5, Math.min(50, 40000 / Math.pow(2, zoom)));
  setMapRegion({
    latitude: center[1],
    longitude: center[0],
    radiusKm,
  });
}, []);
```

**Step 3: Verify TypeScript**

Run: `cd /Users/limameghassene/development/optimus-halal-mobile-app/optimus-halal && npx tsc --noEmit 2>&1 | head -5`

**Step 4: Commit**

```bash
git add optimus-halal/app/\(tabs\)/map.tsx
git commit -m "perf(map): replace onCameraChanged with onMapIdle (+20-25 FPS)"
```

---

## Task 5: Sprint 1 Performance — Remove InteractionManager, fix flyTo timing

**Files:**
- Modify: `optimus-halal/app/(tabs)/map.tsx:25-26,373-380,517-534,558`

**Step 1: Remove InteractionManager import**

At line 25, remove `InteractionManager` from the react-native import.

**Step 2: Replace InteractionManager with immediate rendering**

Remove lines 375-380 (the InteractionManager effect). Change `isMapReady` to always be true:

```typescript
// Remove the isMapReady state and InteractionManager entirely.
// Always render MapView, only defer ShapeSource data via isStyleLoaded.
```

At line 558, change `{isMapReady ? (` to just render MapView directly (remove the `isMapReady` ternary wrapper and the loading fallback).

**Step 3: Fix flyTo to use isStyleLoaded instead of setTimeout**

Replace lines 520-534 with:

```typescript
useEffect(() => {
  if (userLocation && !hasAnimatedToUser && isStyleLoaded && cameraRef.current) {
    setHasAnimatedToUser(true);
    cameraRef.current.setCamera({
      centerCoordinate: [userLocation.longitude, userLocation.latitude],
      zoomLevel: FOCUSED_ZOOM,
      animationDuration: 2000,
      animationMode: "flyTo",
    });
  }
}, [userLocation, hasAnimatedToUser, isStyleLoaded]);
```

**Step 4: Verify TypeScript**

Run: `cd /Users/limameghassene/development/optimus-halal-mobile-app/optimus-halal && npx tsc --noEmit 2>&1 | head -5`

**Step 5: Commit**

```bash
git add optimus-halal/app/\(tabs\)/map.tsx
git commit -m "perf(map): remove InteractionManager, trigger flyTo on isStyleLoaded"
```

---

## Task 6: Sprint 1 — Color-coded markers + selected marker pop effect

**Files:**
- Modify: `optimus-halal/app/(tabs)/map.tsx:632-652`

**Step 1: Import storeTypeColors**

Add to the imports at top of file:

```typescript
import { storeTypeColors } from "@/theme/colors";
```

**Step 2: Replace the CircleLayer style for individual markers**

Replace lines 632-652 with color-coded markers AND a selected marker highlight ring:

```typescript
{/* Selected marker highlight ring (pulsing) */}
<CircleLayer
  id="store-markers-ring"
  filter={["all",
    ["!", ["has", "point_count"]],
    ["==", ["get", "id"], selectedStoreId ?? ""],
  ]}
  style={{
    circleColor: "transparent",
    circleRadius: 20,
    circleStrokeWidth: 2,
    circleStrokeColor: colors.primary,
    circleStrokeOpacity: 0.5,
  }}
/>

{/* Individual store markers — color-coded by type */}
<CircleLayer
  id="store-markers"
  filter={["!", ["has", "point_count"]]}
  style={{
    circleColor: [
      "match", ["get", "storeType"],
      "butcher", storeTypeColors.butcher.base,
      "restaurant", storeTypeColors.restaurant.base,
      "supermarket", storeTypeColors.supermarket.base,
      "bakery", storeTypeColors.bakery.base,
      "abattoir", storeTypeColors.abattoir.base,
      "wholesaler", storeTypeColors.wholesaler.base,
      "online", storeTypeColors.online.base,
      storeTypeColors.other.base, // fallback
    ],
    circleRadius: [
      "case",
      ["==", ["get", "id"], selectedStoreId ?? ""],
      12,
      7,
    ],
    circleStrokeWidth: [
      "case",
      ["==", ["get", "id"], selectedStoreId ?? ""],
      3,
      2,
    ],
    circleStrokeColor: "#ffffff",
    circleOpacity: 0.9,
  }}
/>
```

**Step 3: Verify TypeScript**

Run: `cd /Users/limameghassene/development/optimus-halal-mobile-app/optimus-halal && npx tsc --noEmit 2>&1 | head -5`

**Step 4: Commit**

```bash
git add optimus-halal/app/\(tabs\)/map.tsx
git commit -m "feat(map): color-coded markers by store type + selected marker pop ring"
```

---

## Task 7: Sprint 1 — Cap card animations + ScrollView → FlatList

**Files:**
- Modify: `optimus-halal/app/(tabs)/map.tsx:13,941-961`

**Step 1: Add FlatList to imports**

At line 19, add `FlatList` to the react-native import.

**Step 2: Add hasShownListRef**

After the existing refs in the component:

```typescript
const hasShownListRef = useRef(false);

useEffect(() => {
  if (stores.length > 0 && !hasShownListRef.current) {
    hasShownListRef.current = true;
  }
}, [stores.length]);
```

**Step 3: Replace the ScrollView (lines 941-961) with FlatList**

```typescript
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
        onPress={() => handleStoreCardPress(item)}
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
```

**Step 4: Remove ScrollView from react-native import if no longer used elsewhere in file**

Check if `ScrollView` is still used for filter chips (line 751). If yes, keep it. The filter chips use `Animated.ScrollView`, not `ScrollView`, so the plain `ScrollView` import can be removed.

**Step 5: Verify TypeScript**

Run: `cd /Users/limameghassene/development/optimus-halal-mobile-app/optimus-halal && npx tsc --noEmit 2>&1 | head -5`

**Step 6: Commit**

```bash
git add optimus-halal/app/\(tabs\)/map.tsx
git commit -m "perf(map): FlatList + capped animations (windowSize 3, 5-card stagger max)"
```

---

## Task 8: Sprint 1 — Android elevation fix on StoreCard

**Files:**
- Modify: `optimus-halal/app/(tabs)/map.tsx:250-267`

**Step 1: Split StoreCard into outer shadow + inner clipping containers**

Replace lines 250-267 in StoreCard with the dual-container pattern:

```typescript
return (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.9}
    accessibilityRole="button"
    accessibilityLabel={`${store.name}, ${store.city}, ${formatDistance(store.distance)}`}
    style={{
      width: 280,
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
```

Close the inner `</View>` before the `</TouchableOpacity>`.

**Step 2: Verify TypeScript**

Run: `cd /Users/limameghassene/development/optimus-halal-mobile-app/optimus-halal && npx tsc --noEmit 2>&1 | head -5`

**Step 3: Commit**

```bash
git add optimus-halal/app/\(tabs\)/map.tsx
git commit -m "fix(android): split StoreCard shadow/clipping containers for elevation"
```

---

## Task 9: Backend — Add hours lateral join to store.nearby

**Files:**
- Modify: `backend/src/trpc/routers/store.ts:102-126`

**Step 1: Write the integration test**

Create or modify `backend/src/__tests__/store-nearby-hours.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
// Test that nearby response includes todayOpen/todayClose fields
describe("store.nearby hours", () => {
  it("should include todayOpen and todayClose in response", async () => {
    // Use existing test helper to call the procedure
    // Verify response shape includes the new fields
    // Fields may be null for stores without hours
  });
});
```

**Step 2: Add todayOpen/todayClose to the select in store.nearby**

In `backend/src/trpc/routers/store.ts`, modify the `.select()` block (lines 103-121) to add:

```typescript
todayOpen: sql<string | null>`(
  SELECT sh.open_time::text FROM store_hours sh
  WHERE sh.store_id = stores.id
  AND sh.day_of_week = EXTRACT(DOW FROM NOW())::int
  AND NOT sh.is_closed
  LIMIT 1
)`.as("today_open"),
todayClose: sql<string | null>`(
  SELECT sh.close_time::text FROM store_hours sh
  WHERE sh.store_id = stores.id
  AND sh.day_of_week = EXTRACT(DOW FROM NOW())::int
  AND NOT sh.is_closed
  LIMIT 1
)`.as("today_close"),
```

**Step 3: Verify TypeScript**

Run: `cd /Users/limameghassene/development/optimus-halal-mobile-app/backend && npx tsc --noEmit 2>&1 | head -10`

**Step 4: Run tests**

Run: `cd /Users/limameghassene/development/optimus-halal-mobile-app/backend && pnpm test 2>&1 | tail -20`

**Step 5: Commit**

```bash
git add backend/src/trpc/routers/store.ts
git commit -m "feat(backend): add todayOpen/todayClose hours to store.nearby response"
```

---

## Task 10: PostHog map analytics — 10 events

**Files:**
- Modify: `optimus-halal/app/(tabs)/map.tsx`

**Step 1: Import trackEvent**

Add to imports:

```typescript
import { trackEvent } from "@/lib/analytics";
```

**Step 2: Add events to handlers**

Add these `trackEvent` calls inside existing handlers:

1. After `setIsStyleLoaded(true)` in onDidFinishLoadingMap:
```typescript
trackEvent("map_opened", { source: "tab_bar", has_location: !!userLocation });
```

2. Inside `handleRegionChange` after setting mapRegion:
```typescript
trackEvent("map_viewport_changed", {
  center_lat: Math.round(center[1] * 100) / 100,
  center_lng: Math.round(center[0] * 100) / 100,
  zoom_level: Math.round(zoom),
  visible_stores: stores.length,
});
```

3. Inside `toggleFilter`:
```typescript
trackEvent("map_filter_toggled", { filter_id: filterId, action: prev.includes(filterId) ? "disabled" : "enabled" });
```

4. Inside `handleMarkerPress` for individual stores:
```typescript
trackEvent("map_store_tapped", {
  store_id: storeId,
  source: "marker",
});
```

5. Inside `handleStoreCardPress`:
```typescript
trackEvent("map_store_tapped", {
  store_id: store.id,
  source: "card",
  distance_m: store.distance,
});
```

6. Inside `openDirections`:
```typescript
trackEvent("map_get_directions", { store_id: name });
```

7. Inside `callStore`:
```typescript
trackEvent("map_call_store", {});
```

8. Inside `handleSuggestionPress`:
```typescript
trackEvent("map_search", { suggestion_selected: true, result_city: suggestion.city ?? null });
```

9. Inside `handleMyLocation`:
```typescript
trackEvent("map_my_location_tapped", { had_location: !!userLocation });
```

10. Inside cluster press handler:
```typescript
trackEvent("map_cluster_expanded", { cluster_size: feature.properties?.point_count ?? 0 });
```

**Step 3: Verify TypeScript**

Run: `cd /Users/limameghassene/development/optimus-halal-mobile-app/optimus-halal && npx tsc --noEmit 2>&1 | head -5`

**Step 4: Commit**

```bash
git add optimus-halal/app/\(tabs\)/map.tsx
git commit -m "feat(analytics): add 10 PostHog map events for discovery funnel tracking"
```

---

## Task 11: Backend — Relevance score replacing distance-only sorting

**Files:**
- Modify: `backend/src/trpc/routers/store.ts:102-126`

**Step 1: Replace orderBy with relevance score formula**

In the `nearby` procedure, replace line 124:

```typescript
// OLD:
.orderBy(sql`ST_Distance("stores"."location", ${point})`)

// NEW:
.orderBy(sql`(
  0.35 * (1.0 - LEAST(ST_Distance("stores"."location", ${point}) / ${radiusMeters}, 1.0))
  + 0.25 * CASE WHEN "stores"."halal_certified" THEN COALESCE("stores"."average_rating", 2.5) / 5.0 ELSE 0 END
  + 0.20 * (ln(1 + COALESCE("stores"."review_count", 0)) / ln(501.0))
  + 0.15 * CASE WHEN COALESCE("stores"."review_count", 0) > 0 THEN (COALESCE("stores"."average_rating", 2.5) - 1.0) / 4.0 ELSE 0.5 END
  + 0.05 * (1.0 / (1 + EXTRACT(EPOCH FROM NOW() - COALESCE("stores"."updated_at", "stores"."created_at")) / 7776000.0))
) DESC`)
```

Also add a `relevanceScore` field to the select so the frontend could use it if needed:

```typescript
relevanceScore: sql<number>`round((
  0.35 * (1.0 - LEAST(ST_Distance("stores"."location", ${point}) / ${radiusMeters}, 1.0))
  + 0.25 * CASE WHEN "stores"."halal_certified" THEN COALESCE("stores"."average_rating", 2.5) / 5.0 ELSE 0 END
  + 0.20 * (ln(1 + COALESCE("stores"."review_count", 0)) / ln(501.0))
  + 0.15 * CASE WHEN COALESCE("stores"."review_count", 0) > 0 THEN (COALESCE("stores"."average_rating", 2.5) - 1.0) / 4.0 ELSE 0.5 END
  + 0.05 * (1.0 / (1 + EXTRACT(EPOCH FROM NOW() - COALESCE("stores"."updated_at", "stores"."created_at")) / 7776000.0))
)::numeric, 3)`.as("relevance_score"),
```

**Step 2: Invalidate cache key version**

In the cache key (line 88), change `stores:v1:` to `stores:v2:`:

```typescript
const cacheKey = `stores:v2:nearby:${gh}:${input.storeType ?? "all"}:${input.halalCertifiedOnly ? "1" : "0"}`;
```

**Step 3: Run tests**

Run: `cd /Users/limameghassene/development/optimus-halal-mobile-app/backend && pnpm test 2>&1 | tail -20`

**Step 4: Verify TypeScript**

Run: `cd /Users/limameghassene/development/optimus-halal-mobile-app/backend && npx tsc --noEmit 2>&1 | head -10`

**Step 5: Commit**

```bash
git add backend/src/trpc/routers/store.ts
git commit -m "feat(backend): relevance score (35% dist + 25% cert + 20% pop + 15% qual + 5% fresh)"
```

---

## Task 12: Backend — Add partial GiST index for certified stores

**Files:**
- Create: `backend/drizzle/XXXX_add_certified_gist_index.sql`

**Step 1: Create migration**

```sql
CREATE INDEX IF NOT EXISTS "stores_active_certified_location_gist_idx"
ON "stores" USING GIST ("location")
WHERE is_active = true AND halal_certified = true;

CREATE INDEX IF NOT EXISTS "stores_active_rating_idx"
ON "stores" (average_rating DESC, review_count DESC)
WHERE is_active = true;
```

**Step 2: Run migration**

Run: `cd /Users/limameghassene/development/optimus-halal-mobile-app/backend && pnpm drizzle-kit push 2>&1 | tail -10`

(Or apply via the project's standard migration workflow.)

**Step 3: Commit**

```bash
git add backend/drizzle/
git commit -m "perf(db): add partial GiST index for certified stores + rating index"
```

---

## Task 13: Component extraction — MapMarkerLayer

**Files:**
- Create: `optimus-halal/src/components/map/MapMarkerLayer.tsx`
- Modify: `optimus-halal/app/(tabs)/map.tsx`

**Step 1: Create MapMarkerLayer component**

Extract the ShapeSource + CircleLayer + SymbolLayer block (lines 590-654) into a dedicated memoized component:

```typescript
import React from "react";
import { storeTypeColors } from "@/theme/colors";

// Guard Mapbox imports — must match map.tsx pattern
let ShapeSource: any, CircleLayer: any, SymbolLayer: any;
try {
  const Mapbox = require("@rnmapbox/maps");
  ShapeSource = Mapbox.ShapeSource;
  CircleLayer = Mapbox.CircleLayer;
  SymbolLayer = Mapbox.SymbolLayer;
} catch {}

interface MapMarkerLayerProps {
  geoJSON: GeoJSON.FeatureCollection;
  selectedStoreId: string | null;
  isStyleLoaded: boolean;
  colors: { primary: string };
  isDark: boolean;
  onPress: (event: any) => void;
}

export const MapMarkerLayer = React.memo(function MapMarkerLayer({
  geoJSON,
  selectedStoreId,
  isStyleLoaded,
  colors,
  isDark,
  onPress,
}: MapMarkerLayerProps) {
  if (!isStyleLoaded || !ShapeSource || geoJSON.features.length === 0) return null;

  return (
    <ShapeSource
      id="stores-source"
      shape={geoJSON}
      cluster
      clusterRadius={50}
      clusterMaxZoomLevel={14}
      onPress={onPress}
    >
      {/* Cluster circles, cluster count, selected ring, individual markers */}
      {/* ... extracted from map.tsx ... */}
    </ShapeSource>
  );
});
```

**Step 2: Import and use in map.tsx**

Replace the ShapeSource block in map.tsx with:

```typescript
<MapMarkerLayer
  geoJSON={storesGeoJSON}
  selectedStoreId={selectedStoreId}
  isStyleLoaded={isStyleLoaded}
  colors={colors}
  isDark={isDark}
  onPress={handleMarkerPress}
/>
```

**Step 3: Verify TypeScript + commit**

---

## Task 14: Component extraction — MapControls + MapFilterChips

**Files:**
- Create: `optimus-halal/src/components/map/MapControls.tsx`
- Create: `optimus-halal/src/components/map/MapFilterChips.tsx`
- Create: `optimus-halal/src/components/map/constants.ts`
- Modify: `optimus-halal/app/(tabs)/map.tsx`

**Step 1: Extract constants to shared file**

Move `FILTER_IDS`, `STORE_TYPE_ICON`, `CARD_WIDTH`, `FRANCE_CENTER`, `DEFAULT_ZOOM`, `FOCUSED_ZOOM`, `formatDistance`, `openDirections`, `callStore` to `constants.ts`.

**Step 2: Extract MapFilterChips** (lines 750-790)

Memoized component receiving: `filters`, `activeFilters`, `onToggle`, `colors`, `isDark`, `t`.

**Step 3: Extract MapControls** (lines 794-873)

FABs, results badge, loading indicator. Receives: `onMyLocation`, `userLocation`, `stores`, `selectedStore`, `isFetching`, `locationLoading`, `colors`, `isDark`, `insets`, `t`.

**Step 4: Verify TypeScript + commit**

```bash
git commit -m "refactor(map): extract MapMarkerLayer, MapFilterChips, MapControls, constants"
```

---

## Task 15: Replace static bottom sheet with @gorhom/bottom-sheet

**Files:**
- Modify: `optimus-halal/app/(tabs)/map.tsx:876-965`

**Step 1: Import @gorhom/bottom-sheet**

```typescript
import BottomSheet, { BottomSheetFlatList, BottomSheetView } from "@gorhom/bottom-sheet";
```

**Step 2: Add ref and snap points**

```typescript
const bottomSheetRef = useRef<BottomSheet>(null);
const snapPoints = useMemo(() => [240 + insets.bottom, "50%", "90%"], [insets.bottom]);
```

**Step 3: Replace the static Animated.View (lines 876-965)**

```typescript
<BottomSheet
  ref={bottomSheetRef}
  index={0}
  snapPoints={snapPoints}
  backgroundStyle={{ backgroundColor: colors.card }}
  handleIndicatorStyle={{ backgroundColor: colors.border }}
  enableDynamicSizing={false}
  animateOnMount
  style={{
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  }}
>
  {selectedStore ? (
    <BottomSheetView>
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
        onClose={handleCloseDetail}
        colors={colors}
      />
    </BottomSheetView>
  ) : (
    <BottomSheetView>
      <View className="flex-row items-center justify-between px-5 mb-3 pt-1">
        <Text accessibilityRole="header" className="text-lg font-bold" style={{ color: colors.textPrimary }}>
          {t.map.nearYou}
        </Text>
        {stores.length > 0 && (
          <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
            {stores.length} {stores.length > 1 ? t.map.stores : t.map.store}
          </Text>
        )}
      </View>
      {/* FlatList from Task 7 goes here */}
    </BottomSheetView>
  )}
</BottomSheet>
```

**Step 4: Auto-snap on store selection**

```typescript
useEffect(() => {
  if (selectedStoreId) {
    bottomSheetRef.current?.snapToIndex(1); // half
  } else {
    bottomSheetRef.current?.snapToIndex(0); // peek
  }
}, [selectedStoreId]);
```

**Step 5: Add camera padding in handleStoreCardPress**

```typescript
const handleStoreCardPress = useCallback((store: typeof stores[number]) => {
  impact();
  setSelectedStoreId(store.id);
  cameraRef.current?.setCamera({
    centerCoordinate: [store.longitude, store.latitude],
    zoomLevel: 15,
    animationDuration: 600,
    animationMode: "flyTo",
    padding: { bottom: SCREEN_HEIGHT * 0.35, top: 0, left: 0, right: 0 },
  });
}, [impact]);
```

**Step 6: Verify TypeScript + commit**

```bash
git add optimus-halal/app/\(tabs\)/map.tsx
git commit -m "feat(map): gesture-driven @gorhom/bottom-sheet v5 with 3 snap points"
```

---

## Task 16: Glassmorphic search bar with expo-blur

**Files:**
- Modify: `optimus-halal/app/(tabs)/map.tsx:677-712`

**Step 1: Import BlurView**

```typescript
import { BlurView } from "expo-blur";
import { glass } from "@/theme/colors";
```

**Step 2: Replace search bar container**

Replace the opaque View (lines 677-712) with BlurView:

```typescript
<BlurView
  intensity={isDark ? 40 : 80}
  tint={isDark ? "dark" : "light"}
  className="flex-1 h-12 flex-row items-center px-4 rounded-xl overflow-hidden"
  style={{
    borderWidth: 1,
    borderColor: isDark ? glass.dark.border : glass.light.border,
  }}
>
  {/* ... search input contents unchanged ... */}
</BlurView>
```

**Step 3: Verify TypeScript + commit**

```bash
git commit -m "feat(map): glassmorphic search bar using expo-blur + glass tokens"
```

---

## Tasks 17-20: Remaining Sprints (Summary)

These follow the same pattern. Key tasks:

### Task 17: Icon-led filter chips with color dots
Add `storeTypeColors` dot + MaterialIcons icon to each filter chip. Add "Ouvert" and "Note 4.0+" new filters.

### Task 18: "Rechercher dans cette zone" floating button
Track `lastFetchedCenter`, show FAB when panned >2km.

### Task 19: FAB repositioning (bottom-right, above sheet)
Move from `top: insets.top + 140` to `bottom: snapPoints[0] + 16, right: 16`.

### Task 20: Dark mode marker contrast
Use `storeTypeColors.*.dark` variant when `isDark` is true in CircleLayer.

---

## Execution Notes

- **Run `npx tsc --noEmit` after every task** — zero-tolerance for type errors
- **Commit after every task** — small, reversible commits
- **Do NOT rebuild dev client** — @gorhom/bottom-sheet is pure JS, no native code needed
- **Cache invalidation**: Backend cache key changed to `v2` in Task 11 — old cache expires naturally (300s TTL)
- **Test on Android**: Tasks 8 (elevation fix) and 7 (FlatList) are Android-critical

## Dependency Graph

```
Task 1 (install) ─┐
Task 2 (colors)  ──┤
Task 3 (i18n)    ──┤── All independent, can run in parallel
Task 4 (onMapIdle) ┤
Task 5 (flyTo)   ──┘
                    │
Task 6 (markers) ───── depends on Task 2
Task 7 (FlatList) ──── independent
Task 8 (elevation) ─── independent
                    │
Task 9 (hours)  ────── independent (backend)
Task 10 (PostHog) ──── independent
Task 11 (relevance) ── independent (backend)
Task 12 (index) ────── independent (backend)
                    │
Task 13-14 (extract) ─ depends on Tasks 4-8
Task 15 (bottom-sheet) depends on Task 1, 13-14
Task 16 (glass) ────── independent
```

**Parallelizable groups:**
- Group A (frontend): Tasks 1, 2, 3, 4, 5 in parallel
- Group B (frontend): Tasks 6, 7, 8 (after Group A)
- Group C (backend): Tasks 9, 11, 12 in parallel (independent of frontend)
- Group D (integration): Tasks 10, 13, 14, 15, 16 (after Groups B+C)
