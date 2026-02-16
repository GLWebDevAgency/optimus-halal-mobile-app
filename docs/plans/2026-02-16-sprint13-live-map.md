# Sprint 13 — Live Interactive Map Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the static map stub with an interactive Mapbox map, PostGIS geospatial backend, and API BAN geocoding.

**Architecture:** @rnmapbox/maps for WebGL-powered map rendering with native clustering. PostGIS extension on Railway PostgreSQL for O(log n) spatial queries via `ST_DWithin`. API BAN (api-adresse.data.gouv.fr) for free French address geocoding.

**Tech Stack:** @rnmapbox/maps, PostGIS, API BAN, expo-location, Drizzle ORM, tRPC

---

### Task 1: Create Sprint Branch + Fix ExpoImageManipulator Crash

**Files:**
- Modify: `optimus-halal/src/hooks/index.ts:87-91`
- Modify: `optimus-halal/app/report.tsx:31`
- Modify: `optimus-halal/app/settings/edit-profile.tsx:29`

**Step 1: Create sprint branch**

```bash
git checkout -b sprint13/live-map
```

**Step 2: Verify the barrel export fix is in place**

`useImageUpload` must NOT be in the barrel export (`src/hooks/index.ts`) because `expo-image-manipulator` requires a native module. It should be imported directly where used.

In `src/hooks/index.ts`, the IMAGE UPLOAD section should say:
```ts
// NOT barrel-exported: expo-image-manipulator requires native module.
// Import directly: import { useImageUpload } from '@/hooks/useImageUpload'
```

In `app/report.tsx`:
```ts
import { useHaptics, useTranslation } from "@/hooks";
import { useImageUpload } from "@/hooks/useImageUpload";
```

In `app/settings/edit-profile.tsx`:
```ts
import { useTranslation } from "@/hooks";
import { useImageUpload } from "@/hooks/useImageUpload";
```

**Step 3: Commit**

```bash
git add optimus-halal/src/hooks/index.ts optimus-halal/app/report.tsx optimus-halal/app/settings/edit-profile.tsx
git commit -m "fix: remove useImageUpload from barrel export (native module crash)"
```

---

### Task 2: PostGIS Migration — Enable Extension + Geography Column

**Files:**
- Create: `backend/drizzle/0002_add_postgis.sql`

**Step 1: Write the migration SQL**

Create `backend/drizzle/0002_add_postgis.sql`:

```sql
-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geography column to stores
ALTER TABLE "stores" ADD COLUMN "location" geography(Point, 4326);

-- Backfill from existing latitude/longitude
UPDATE "stores"
SET "location" = ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326)::geography
WHERE "latitude" IS NOT NULL AND "longitude" IS NOT NULL;

-- Create GiST index for fast spatial queries
CREATE INDEX "stores_location_gist_idx" ON "stores" USING GIST ("location");

-- Create trigger to auto-sync location from lat/long on INSERT/UPDATE
CREATE OR REPLACE FUNCTION sync_store_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stores_location_sync
BEFORE INSERT OR UPDATE OF latitude, longitude ON "stores"
FOR EACH ROW
EXECUTE FUNCTION sync_store_location();
```

**Step 2: Update Drizzle journal**

Update `backend/drizzle/meta/_journal.json` — add entry for migration `0002_add_postgis`:

```json
{
  "idx": 2,
  "version": "7",
  "when": 1771365600000,
  "tag": "0002_add_postgis",
  "breakpoints": true
}
```

**Step 3: Run the migration on local dev**

```bash
cd backend && pnpm drizzle-kit push
```

If `drizzle-kit push` doesn't pick up raw SQL, run directly:

```bash
psql $DATABASE_URL -f drizzle/0002_add_postgis.sql
```

**Step 4: Verify PostGIS is working**

```bash
psql $DATABASE_URL -c "SELECT PostGIS_Version();"
# Expected: something like "3.4 ..."

psql $DATABASE_URL -c "SELECT id, name, ST_AsText(location::geometry) FROM stores LIMIT 3;"
# Expected: rows with POINT(longitude latitude)
```

**Step 5: Commit**

```bash
git add backend/drizzle/0002_add_postgis.sql backend/drizzle/meta/_journal.json
git commit -m "feat(db): add PostGIS extension, geography column, GiST index, sync trigger"
```

---

### Task 3: Upgrade Store Router — PostGIS Queries

**Files:**
- Modify: `backend/src/trpc/routers/store.ts:67-113` (replace `nearby` procedure)

**Step 1: Replace Haversine `nearby` with PostGIS**

In `backend/src/trpc/routers/store.ts`, replace the existing `nearby` procedure (lines 67-113) with:

```ts
  nearby: publicProcedure
    .input(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
        radiusKm: z.number().min(0.1).max(50).default(5),
        storeType: z
          .enum([
            "supermarket", "butcher", "restaurant", "bakery",
            "abattoir", "wholesaler", "online", "other",
          ])
          .optional(),
        halalCertifiedOnly: z.boolean().default(false),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const radiusMeters = input.radiusKm * 1000;
      const point = sql`ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326)::geography`;

      const conditions = [
        eq(stores.isActive, true),
        sql`ST_DWithin(${stores.location}, ${point}, ${radiusMeters})`,
      ];

      if (input.storeType) conditions.push(eq(stores.storeType, input.storeType));
      if (input.halalCertifiedOnly) conditions.push(eq(stores.halalCertified, true));

      const items = await ctx.db
        .select({
          id: stores.id,
          name: stores.name,
          storeType: stores.storeType,
          imageUrl: stores.imageUrl,
          address: stores.address,
          city: stores.city,
          postalCode: stores.postalCode,
          phone: stores.phone,
          website: stores.website,
          latitude: stores.latitude,
          longitude: stores.longitude,
          halalCertified: stores.halalCertified,
          certifier: stores.certifier,
          certifierName: stores.certifierName,
          averageRating: stores.averageRating,
          reviewCount: stores.reviewCount,
          distance: sql<number>`ST_Distance(${stores.location}, ${point})`.as("distance"),
        })
        .from(stores)
        .where(and(...conditions))
        .orderBy(sql`distance`)
        .limit(input.limit);

      return items;
    }),
```

**Step 2: Add `location` reference in schema import**

The `stores.location` reference needs the column to exist in the Drizzle schema. Since we added it via raw SQL (not Drizzle), we need to add a custom column.

In `backend/src/db/schema/stores.ts`, add after the `longitude` line:

```ts
    // PostGIS geography column — managed by trigger, not directly written by Drizzle
    location: t.customType<{ data: unknown }>({
      dataType() { return "geography(Point, 4326)"; },
    })("location"),
```

**Important:** Import `customType` — it's already available from `drizzle-orm/pg-core` as `t.customType`.

Actually, Drizzle doesn't have a built-in geography type. We'll reference `location` in raw SQL only (via `sql` template), not via the schema column. The `stores.location` reference in SQL should use the raw column name:

Replace `${stores.location}` with `"stores"."location"` in the raw SQL:

```ts
sql`ST_DWithin("stores"."location", ${point}, ${radiusMeters})`
sql<number>`ST_Distance("stores"."location", ${point})`.as("distance")
```

**Step 3: Run backend to verify no TypeScript errors**

```bash
cd backend && pnpm tsc --noEmit
```

**Step 4: Test locally**

```bash
curl "http://localhost:3000/trpc/store.nearby?input=%7B%22latitude%22:48.8566,%22longitude%22:2.3522,%22radiusKm%22:5%7D"
```

**Step 5: Commit**

```bash
git add backend/src/trpc/routers/store.ts
git commit -m "feat(api): upgrade store.nearby to PostGIS ST_DWithin"
```

---

### Task 4: Install @rnmapbox/maps + Configure Expo

**Files:**
- Modify: `optimus-halal/package.json` (add @rnmapbox/maps, remove react-native-maps)
- Create: `optimus-halal/app.config.ts` (dynamic Expo config)
- Delete: `optimus-halal/app.json` (replaced by app.config.ts)
- Create: `optimus-halal/.env`
- Create: `optimus-halal/.env.example`

**Step 1: Install @rnmapbox/maps, remove react-native-maps**

```bash
cd optimus-halal
pnpm remove react-native-maps
npx expo install @rnmapbox/maps
```

**Step 2: Create `.env` with Mapbox tokens**

Create `optimus-halal/.env`:

```env
EXPO_PUBLIC_MAPBOX_TOKEN=pk.your_mapbox_public_token
MAPBOX_DOWNLOADS_TOKEN=sk.your_mapbox_download_token
```

Create `optimus-halal/.env.example`:

```env
EXPO_PUBLIC_MAPBOX_TOKEN=pk.your_mapbox_public_token
MAPBOX_DOWNLOADS_TOKEN=sk.your_mapbox_download_token
```

**Step 3: Convert `app.json` → `app.config.ts`**

Create `optimus-halal/app.config.ts`:

```ts
import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Optimus Halal",
  slug: "optimus-halal",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  scheme: "optimushalal",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#102216",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.optimushalal.app",
    infoPlist: {
      NSCameraUsageDescription:
        "Optimus Halal utilise la caméra pour scanner les codes-barres des produits.",
      NSFaceIDUsageDescription:
        "Utilisez Face ID pour une connexion sécurisée.",
      NSLocationWhenInUseUsageDescription:
        "Optimus Halal utilise votre localisation pour trouver les points de vente à proximité.",
    },
  },
  android: {
    package: "com.optimushalal.app",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#102216",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    permissions: [
      "android.permission.CAMERA",
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.USE_BIOMETRIC",
      "android.permission.RECORD_AUDIO",
      "android.permission.USE_FINGERPRINT",
    ],
  },
  web: {
    favicon: "./assets/favicon.png",
    bundler: "metro",
  },
  plugins: [
    "expo-router",
    [
      "expo-camera",
      {
        cameraPermission:
          "Optimus Halal utilise la caméra pour scanner les codes-barres.",
      },
    ],
    [
      "expo-local-authentication",
      {
        faceIDPermission: "Permet l'authentification par Face ID.",
      },
    ],
    "expo-secure-store",
    "expo-font",
    "@sentry/react-native",
    [
      "@rnmapbox/maps",
      {
        RNMapboxMapsDownloadToken: process.env.MAPBOX_DOWNLOADS_TOKEN,
      },
    ],
  ],
  runtimeVersion: {
    policy: "appVersion",
  },
  updates: {
    url: "https://u.expo.dev/74c0f55e-ea1c-4786-93a7-de4b27280104",
  },
  extra: {
    eas: {
      projectId: "74c0f55e-ea1c-4786-93a7-de4b27280104",
    },
    router: {},
  },
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  owner: "gl.dev",
});
```

**Step 4: Delete `app.json`**

```bash
rm optimus-halal/app.json
```

**Step 5: Verify config loads**

```bash
cd optimus-halal && npx expo config --type public
```

Expected: JSON output matching the config above, with `@rnmapbox/maps` in plugins.

**Step 6: Commit**

```bash
git add optimus-halal/app.config.ts optimus-halal/.env.example optimus-halal/package.json optimus-halal/pnpm-lock.yaml
git rm optimus-halal/app.json
git commit -m "feat: install @rnmapbox/maps, convert app.json to app.config.ts"
```

---

### Task 5: Create `useUserLocation` Hook

**Files:**
- Create: `optimus-halal/src/hooks/useUserLocation.ts`

**Step 1: Write the hook**

```ts
/**
 * useUserLocation — GPS location with permission handling
 *
 * Returns current coordinates, permission state, and a refresh function.
 * Uses expo-location for GPS access.
 */

import { useState, useEffect, useCallback } from "react";
import * as Location from "expo-location";

interface UserLocation {
  latitude: number;
  longitude: number;
}

type PermissionStatus = "undetermined" | "granted" | "denied";

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [permission, setPermission] = useState<PermissionStatus>("undetermined");
  const [isLoading, setIsLoading] = useState(true);

  const requestAndFetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const permStatus = status === "granted" ? "granted" : "denied";
      setPermission(permStatus);

      if (permStatus !== "granted") {
        setIsLoading(false);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
    } catch {
      // Silently fail — location is optional
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    requestAndFetch();
  }, [requestAndFetch]);

  return { location, permission, isLoading, refresh: requestAndFetch };
}
```

**Step 2: Export from barrel (safe — no native module at import time)**

In `optimus-halal/src/hooks/index.ts`, add before the IMAGE UPLOAD comment:

```ts
// ============================================
// LOCATION HOOK
// ============================================

export { useUserLocation } from './useUserLocation';
```

**Step 3: Commit**

```bash
git add optimus-halal/src/hooks/useUserLocation.ts optimus-halal/src/hooks/index.ts
git commit -m "feat: add useUserLocation hook (expo-location)"
```

---

### Task 6: Create `useMapStores` Hook

**Files:**
- Create: `optimus-halal/src/hooks/useMapStores.ts`

**Step 1: Write the hook**

```ts
/**
 * useMapStores — Fetch nearby stores for the map viewport
 *
 * Debounces calls to trpc.store.nearby when camera moves.
 */

import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";

interface MapRegion {
  latitude: number;
  longitude: number;
  radiusKm: number;
}

interface UseMapStoresOptions {
  storeType?: "supermarket" | "butcher" | "restaurant" | "bakery" | "abattoir" | "wholesaler" | "online" | "other";
  halalCertifiedOnly?: boolean;
  limit?: number;
  debounceMs?: number;
}

export function useMapStores(
  region: MapRegion | null,
  options: UseMapStoresOptions = {},
) {
  const { storeType, halalCertifiedOnly = false, limit = 50, debounceMs = 300 } = options;
  const [debouncedRegion, setDebouncedRegion] = useState(region);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedRegion(region);
    }, debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [region?.latitude, region?.longitude, region?.radiusKm, debounceMs]);

  const query = trpc.store.nearby.useQuery(
    {
      latitude: debouncedRegion?.latitude ?? 0,
      longitude: debouncedRegion?.longitude ?? 0,
      radiusKm: debouncedRegion?.radiusKm ?? 5,
      storeType,
      halalCertifiedOnly,
      limit,
    },
    {
      enabled: debouncedRegion !== null,
      staleTime: 30_000,
      placeholderData: (prev) => prev,
    },
  );

  return query;
}
```

**Step 2: Export from barrel**

In `optimus-halal/src/hooks/index.ts`, add after useUserLocation:

```ts
export { useMapStores } from './useMapStores';
```

**Step 3: Commit**

```bash
git add optimus-halal/src/hooks/useMapStores.ts optimus-halal/src/hooks/index.ts
git commit -m "feat: add useMapStores hook (debounced nearby query)"
```

---

### Task 7: Create `useGeocode` Hook (API BAN)

**Files:**
- Create: `optimus-halal/src/hooks/useGeocode.ts`

**Step 1: Write the hook**

```ts
/**
 * useGeocode — French address geocoding via API BAN
 *
 * api-adresse.data.gouv.fr — free, no auth, French government.
 * Provides forward search (address → coords) and reverse (coords → address).
 */

import { useState, useCallback, useRef } from "react";

const BAN_BASE = "https://api-adresse.data.gouv.fr";

export interface GeocodeSuggestion {
  label: string;
  city: string;
  postcode: string;
  latitude: number;
  longitude: number;
}

export function useGeocode() {
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async (query: string) => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    // Cancel previous request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setIsSearching(true);
    try {
      const url = `${BAN_BASE}/search/?q=${encodeURIComponent(query)}&limit=5`;
      const res = await fetch(url, { signal: abortRef.current.signal });
      if (!res.ok) throw new Error(`BAN API ${res.status}`);

      const data = await res.json();
      const results: GeocodeSuggestion[] = (data.features ?? []).map(
        (f: any) => ({
          label: f.properties.label,
          city: f.properties.city,
          postcode: f.properties.postcode,
          longitude: f.geometry.coordinates[0],
          latitude: f.geometry.coordinates[1],
        }),
      );
      setSuggestions(results);
    } catch (err: any) {
      if (err.name !== "AbortError") setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const reverse = useCallback(
    async (lat: number, lon: number): Promise<string | null> => {
      try {
        const url = `${BAN_BASE}/reverse/?lat=${lat}&lon=${lon}`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        return data.features?.[0]?.properties?.label ?? null;
      } catch {
        return null;
      }
    },
    [],
  );

  const clearSuggestions = useCallback(() => setSuggestions([]), []);

  return { suggestions, isSearching, search, reverse, clearSuggestions };
}
```

**Step 2: Export from barrel**

In `optimus-halal/src/hooks/index.ts`, add after useMapStores:

```ts
export { useGeocode } from './useGeocode';
```

**Step 3: Commit**

```bash
git add optimus-halal/src/hooks/useGeocode.ts optimus-halal/src/hooks/index.ts
git commit -m "feat: add useGeocode hook (API BAN geocoding)"
```

---

### Task 8: Add i18n Keys for New Map Features

**Files:**
- Modify: `optimus-halal/src/i18n/translations/fr.ts` (map section)
- Modify: `optimus-halal/src/i18n/translations/en.ts` (map section)
- Modify: `optimus-halal/src/i18n/translations/ar.ts` (map section)

**Step 1: Add new keys to all 3 locales**

Add these keys inside the existing `map: { ... }` object in each translation file:

**French (`fr.ts`):**
```ts
    searchAddress: "Rechercher une adresse...",
    locating: "Localisation en cours...",
    locationDenied: "Accès à la localisation refusé",
    locationDeniedDesc: "Activez la localisation dans les réglages pour voir les magasins autour de vous.",
    openSettings: "Ouvrir les réglages",
    storeDetail: "Détails du magasin",
    hours: "Horaires",
    getDirections: "Itinéraire",
    callStore: "Appeler",
    certified: "Certifié",
    kmAway: "{{distance}} km",
    clusterCount: "{{count}} magasins",
    myLocation: "Ma position",
    searchResults: "Résultats de recherche",
```

**English (`en.ts`):**
```ts
    searchAddress: "Search an address...",
    locating: "Getting location...",
    locationDenied: "Location access denied",
    locationDeniedDesc: "Enable location in settings to see stores near you.",
    openSettings: "Open settings",
    storeDetail: "Store details",
    hours: "Hours",
    getDirections: "Get directions",
    callStore: "Call",
    certified: "Certified",
    kmAway: "{{distance}} km",
    clusterCount: "{{count}} stores",
    myLocation: "My location",
    searchResults: "Search results",
```

**Arabic (`ar.ts`):**
```ts
    searchAddress: "ابحث عن عنوان...",
    locating: "جارٍ تحديد الموقع...",
    locationDenied: "تم رفض الوصول إلى الموقع",
    locationDeniedDesc: "فعّل الموقع في الإعدادات لرؤية المتاجر القريبة.",
    openSettings: "فتح الإعدادات",
    storeDetail: "تفاصيل المتجر",
    hours: "ساعات العمل",
    getDirections: "الاتجاهات",
    callStore: "اتصال",
    certified: "معتمد",
    kmAway: "{{distance}} كم",
    clusterCount: "{{count}} متاجر",
    myLocation: "موقعي",
    searchResults: "نتائج البحث",
```

**Step 2: Commit**

```bash
git add optimus-halal/src/i18n/translations/fr.ts optimus-halal/src/i18n/translations/en.ts optimus-halal/src/i18n/translations/ar.ts
git commit -m "feat(i18n): add map geocoding and store detail keys (fr/en/ar)"
```

---

### Task 9: Rewrite Map Screen — Interactive Mapbox Map

**Files:**
- Modify: `optimus-halal/app/(tabs)/map.tsx` (full rewrite)

**Step 1: Initialize Mapbox at app entry**

In `optimus-halal/app/_layout.tsx`, add near the top (after imports):

```ts
import Mapbox from "@rnmapbox/maps";
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "");
```

**Step 2: Rewrite `map.tsx`**

Replace the entire content of `optimus-halal/app/(tabs)/map.tsx` with the interactive map implementation:

Key components:
- `MapView` from `@rnmapbox/maps` with dark/light style via `useTheme`
- `Camera` with `followUserLocation` on first load
- `LocationPuck` for user position indicator
- `ShapeSource` with `cluster={true}` for store markers
- Cluster layer (CircleLayer) + individual marker layer (SymbolLayer)
- Bottom sheet with store cards (keep existing `StoreCard` component)
- Search bar → `useGeocode` → address suggestions
- Filter chips (keep existing)
- "My location" FAB → camera flies to user position
- Tap marker → select store → show in bottom sheet
- Tap cluster → zoom in
- `onRegionDidChange` → update `useMapStores` region

The GeoJSON for stores is built from `useMapStores` data:

```ts
const storesGeoJSON: FeatureCollection = {
  type: "FeatureCollection",
  features: (stores ?? []).map((s) => ({
    type: "Feature",
    id: s.id,
    geometry: {
      type: "Point",
      coordinates: [s.longitude, s.latitude],
    },
    properties: {
      id: s.id,
      name: s.name,
      storeType: s.storeType,
      certifier: s.certifier,
      averageRating: s.averageRating,
      distance: s.distance,
    },
  })),
};
```

Map styles:
- Dark: `mapbox://styles/mapbox/dark-v11`
- Light: `mapbox://styles/mapbox/light-v11`

Camera default: France center `[2.3522, 46.6034]` zoom 5, then follows user location.

Cluster layer styling:
- Small clusters (2-10): 20px green circle
- Medium clusters (11-50): 30px circle
- Large clusters (50+): 40px circle
- Cluster count text in white

Individual marker:
- Green circle (16px) with white border for halal certified
- Gray circle for non-certified
- SymbolLayer with store type icon

**Step 3: Verify TypeScript compilation**

```bash
cd optimus-halal && pnpm typecheck
```

**Step 4: Commit**

```bash
git add optimus-halal/app/(tabs)/map.tsx optimus-halal/app/_layout.tsx
git commit -m "feat: rewrite map screen with @rnmapbox/maps, clustering, geocoding"
```

---

### Task 10: Directions Deep Link + Store Detail Bottom Sheet

**Files:**
- Modify: `optimus-halal/app/(tabs)/map.tsx` (add store detail + directions)

**Step 1: Add directions helper**

```ts
import { Linking, Platform } from "react-native";

function openDirections(lat: number, lon: number, name: string) {
  const encoded = encodeURIComponent(name);
  const url = Platform.select({
    ios: `maps://app?daddr=${lat},${lon}&q=${encoded}`,
    android: `geo:${lat},${lon}?q=${lat},${lon}(${encoded})`,
  });
  if (url) Linking.openURL(url);
}
```

**Step 2: Add call helper**

```ts
function callStore(phone: string) {
  Linking.openURL(`tel:${phone}`);
}
```

**Step 3: Enhance bottom sheet**

When a store is selected (tapped marker), the bottom sheet expands to show:
- Store name, type, certifier badge
- Distance (from PostGIS)
- Rating + review count
- Address
- Phone (tap to call)
- "Itinéraire" button → `openDirections`
- "Appeler" button → `callStore`

**Step 4: Commit**

```bash
git add optimus-halal/app/(tabs)/map.tsx
git commit -m "feat: add store detail bottom sheet + directions deep link"
```

---

### Task 11: Rebuild Dev Client + Test

**Step 1: Prebuild with new native deps**

```bash
cd optimus-halal
npx expo prebuild --clean
```

**Step 2: Build iOS dev client**

```bash
npx expo run:ios
```

**Step 3: Test map features manually**

- [ ] Map loads with Mapbox tiles
- [ ] User location puck appears
- [ ] Store markers appear as green dots
- [ ] Clusters form when zooming out
- [ ] Tap cluster → zooms in
- [ ] Tap marker → store detail in bottom sheet
- [ ] Search address → API BAN suggestions appear
- [ ] Select suggestion → camera flies to location
- [ ] Filter chips filter markers
- [ ] "My location" button → camera flies to GPS
- [ ] "Itinéraire" → opens Apple Maps/Google Maps
- [ ] Dark/light mode switches map style

**Step 4: Run PostGIS migration on Railway production**

```bash
railway run psql -f backend/drizzle/0002_add_postgis.sql
```

**Step 5: Final commit**

```bash
git add -A
git commit -m "chore: rebuild dev client with @rnmapbox/maps native modules"
```

---

### Task 12: Cross-Review with Gemini (Table Ronde)

```bash
gemini -p "Review Sprint 13 changes for Optimus Halal. Focus on:
1. PostGIS migration safety (0002_add_postgis.sql)
2. @rnmapbox/maps setup (app.config.ts, token security)
3. useMapStores debounce + query efficiency
4. useGeocode abort controller handling
5. Map screen UX (clustering, camera, bottom sheet)
6. Security (no secrets in committed files, API BAN trust)
Rate: GO / NO-GO with severity per issue." --yolo
```

Fix any CRITICAL/HIGH issues identified.

---

### Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Branch + barrel export fix | hooks/index.ts, report.tsx, edit-profile.tsx |
| 2 | PostGIS migration | drizzle/0002_add_postgis.sql |
| 3 | PostGIS store.nearby upgrade | routers/store.ts |
| 4 | @rnmapbox/maps install + config | app.config.ts, .env, package.json |
| 5 | useUserLocation hook | hooks/useUserLocation.ts |
| 6 | useMapStores hook | hooks/useMapStores.ts |
| 7 | useGeocode hook (API BAN) | hooks/useGeocode.ts |
| 8 | i18n keys | translations/fr.ts, en.ts, ar.ts |
| 9 | Map screen rewrite | app/(tabs)/map.tsx, _layout.tsx |
| 10 | Directions + store detail | app/(tabs)/map.tsx |
| 11 | Dev client rebuild + test | native build |
| 12 | Gemini cross-review | Table Ronde |
