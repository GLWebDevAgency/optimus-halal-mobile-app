# Sprint 13 — Live Interactive Map

**Date**: 2026-02-16
**Branch**: `sprint13/live-map`
**Status**: Design Approved

## Overview

Replace the static map stub with a fully interactive map using @rnmapbox/maps, PostGIS for geospatial queries, and API BAN for French address geocoding.

## Architecture Decision

**Map library**: `@rnmapbox/maps` (WebGL, 60fps, native clustering, 25k MAU free)
**Geospatial DB**: PostGIS extension on Railway PostgreSQL
**Geocoding**: API BAN (`api-adresse.data.gouv.fr`) — free, no auth, French government

Rejected alternatives:
- `react-native-maps` — requires Google Maps API key (paid), no native clustering
- `@maplibre/maplibre-react-native` — smaller community, less polished

## Phases

### Phase A: PostGIS Backend Migration

1. **Enable PostGIS** on Railway PostgreSQL
2. **Migration `0002_add_postgis.sql`**:
   - `CREATE EXTENSION IF NOT EXISTS postgis`
   - Add `location geography(Point, 4326)` to `stores`
   - Backfill: `UPDATE stores SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography`
   - Create GiST index on `location`
   - Add trigger to auto-sync `location` from `latitude`/`longitude` on INSERT/UPDATE
3. **Upgrade `store.nearby`** — replace Haversine formula with:
   ```sql
   ST_DWithin(location, ST_SetSRID(ST_MakePoint($lon, $lat), 4326)::geography, $radius_m)
   ORDER BY ST_Distance(location, ...)
   ```
4. **New procedure `store.nearbyGeo`** — returns stores within viewport bounding box for map

### Phase B: @rnmapbox/maps Mobile Integration

1. **Dependencies**: Install `@rnmapbox/maps`, remove `react-native-maps`
2. **Config**: Convert `app.json` → `app.config.ts` for dynamic Mapbox token injection
3. **Hooks**:
   - `useUserLocation` — wraps `expo-location`, returns live coords + permission state
   - `useMapStores` — calls `store.nearbyGeo` debounced on camera move
   - `useGeocode` — API BAN search + reverse geocoding
4. **Map screen rewrite** (`app/(tabs)/map.tsx`):
   - `MapboxGL.MapView` with dark/light style (respects `useTheme`)
   - `ShapeSource` + `SymbolLayer` for store markers with native clustering
   - Camera follows user location on first load
   - Tap marker → store detail bottom sheet
   - Tap cluster → zoom in
   - "My location" button → fly to GPS position

### Phase C: API BAN Geocoding

1. Search bar → debounced API BAN `/search/` → address suggestions dropdown
2. Select suggestion → camera flies to coordinates + reload nearby stores
3. Reverse geocoding on "My Location" → display address label in UI

### Phase D: Directions + Store Detail (In-scope additions)

1. **Store detail bottom sheet**: Tap marker → expanded card with hours, certifier, rating, phone, address
2. **Directions**: Deep link to Apple Maps / Google Maps via `Linking.openURL`
   - `maps://` on iOS, `geo:` intent on Android

## Data Flow

```
User opens Map tab
  → expo-location → GPS coords
  → Camera centers on user → MapView renders tiles
  → onRegionDidChange → extract viewport center + radius
  → trpc.store.nearbyGeo(lat, lon, radiusKm) → PostGIS ST_DWithin
  → Returns stores[] with distance → GeoJSON → ShapeSource → markers
  → User searches "boucherie rue de la Paix"
  → API BAN /search/ → coordinates
  → Camera flies → re-query nearbyGeo → new markers
  → User taps marker → bottom sheet with store detail
  → User taps "Itinéraire" → Linking.openURL → native Maps app
```

## Files

### Create
| File | Purpose |
|------|---------|
| `backend/drizzle/0002_add_postgis.sql` | PostGIS extension + geography column + GiST index |
| `optimus-halal/app.config.ts` | Dynamic Expo config (Mapbox tokens from env) |
| `optimus-halal/.env` | EXPO_PUBLIC_MAPBOX_TOKEN + MAPBOX_DOWNLOADS_TOKEN |
| `optimus-halal/.env.example` | Placeholder env vars |
| `optimus-halal/src/hooks/useUserLocation.ts` | GPS location + permissions |
| `optimus-halal/src/hooks/useMapStores.ts` | Nearby stores for map viewport |
| `optimus-halal/src/hooks/useGeocode.ts` | API BAN geocoding |

### Modify
| File | Change |
|------|--------|
| `backend/src/db/schema/stores.ts` | Add `location` geography column |
| `backend/src/trpc/routers/store.ts` | PostGIS queries + `nearbyGeo` procedure |
| `optimus-halal/package.json` | Replace react-native-maps → @rnmapbox/maps |
| `optimus-halal/app/(tabs)/map.tsx` | Full rewrite — interactive map |
| `optimus-halal/src/hooks/index.ts` | Export new hooks |
| `optimus-halal/src/i18n/translations/*.ts` | New keys for geocoding, directions |

### Delete
| File | Reason |
|------|--------|
| `optimus-halal/app.json` | Replaced by `app.config.ts` |

## Environment Variables

| Var | Where | Value |
|-----|-------|-------|
| `EXPO_PUBLIC_MAPBOX_TOKEN` | Mobile `.env` | `pk.eyJ1...` (public token) |
| `MAPBOX_DOWNLOADS_TOKEN` | Mobile `.env` + EAS secrets | `sk.eyJ1...` (DOWNLOADS:READ only) |

## NOT in scope (V2)
- Alim'confiance hygiene data overlay
- API Sirene business verification
- Store photos gallery on map cards
- Turn-by-turn navigation (Mapbox Navigation SDK)
- Custom map style design
