# Killer Map Screen 2026 — Design Document

**Date**: 2026-02-19
**Status**: Approved
**Authors**: 6-Expert Multidisciplinary Audit (UI/UX, Psychology, Performance, Data, Marketing, Community)

## Vision

Transform the map from a utility screen ("where is the nearest halal store?") into a community-powered discovery engine ("what does my community think, and what should I know before I go?"). The map replaces WhatsApp group recommendations — faster, more trustworthy (certification verified), and just as personal.

## Current State

- `app/(tabs)/map.tsx` — 999-line monolith with 2 inline sub-components
- Mapbox MapView with CircleLayer/SymbolLayer clustering
- Search via French government API BAN (addresses only, no store name search)
- 4 filter chips, static Animated.View bottom sheet (no gestures)
- Backend `store.nearby`: PostGIS ST_DWithin, distance-only sorting, no hours data
- Zero PostHog analytics events on the map
- No store type color differentiation (all markers same color)
- No open/closed status on cards

## Architecture After Implementation

```
app/(tabs)/map.tsx                     ~200 lines (orchestrator + useMapScreen hook)
src/components/map/MapSearchBar.tsx    ~100 lines (search + full-screen overlay)
src/components/map/MapFilterChips.tsx  ~60 lines  (icon-led, color-coded)
src/components/map/StoreCard.tsx       ~100 lines (300px hero card, gradient fallback)
src/components/map/StoreDetailCard.tsx ~120 lines (inside bottom sheet)
src/components/map/MapControls.tsx     ~50 lines  (FABs, "search this area")
src/components/map/MapMarkerLayer.tsx  ~80 lines  (ShapeSource + layers)
src/components/map/MapSearchOverlay.tsx ~150 lines (full-screen, dual-rail)
src/components/map/constants.ts        ~40 lines  (colors, icons, filter config)
```

## New Dependencies

- `@gorhom/bottom-sheet@^5` — gesture-driven bottom sheet (Reanimated 4, UI thread)
- `expo-blur` (already installed) — glassmorphic surfaces
- `expo-linear-gradient` (verify installed) — store card gradient fallback

---

## Sprint 1 — Performance Foundation (1-2 days)

Quick wins for FPS and visual correctness. Zero risk, maximum impact.

### 1.1 Replace `onCameraChanged` with `onMapIdle`

**Why**: `onCameraChanged` fires every frame during camera animations (~120 calls per flyTo). Each call triggers `setMapRegion` → React re-render → debounce timer allocation. This is the #1 source of jank.

**Change**: In `map.tsx`, replace `onCameraChanged={handleRegionChange}` with `onMapIdle={handleRegionChange}`.

**Impact**: Reduces re-renders during animations from ~120 to ~1. Expected +20-25 FPS on mid-range Android.

### 1.2 Android StoreCard Elevation Fix

**Why**: `elevation` + `overflow: hidden` (from `rounded-xl`) clips shadows on Android.

**Change**: Split into outer container (shadow, no overflow) + inner container (overflow:hidden, borderRadius).

### 1.3 Store Type Color-Coded Markers

**Why**: All markers currently look identical. Color is the fastest pre-attentive visual attribute (<200ms).

**Change**: Add `storeTypeColors` to `theme/colors.ts`. Replace binary CircleLayer coloring with Mapbox `["match", ["get", "storeType"], ...]` expression.

| Type | Color | Hex |
|------|-------|-----|
| butcher | Red | #ef4444 |
| restaurant | Orange | #f97316 |
| supermarket | Blue | #3b82f6 |
| bakery | Gold | #D4AF37 |
| abattoir | Purple | #8b5cf6 |
| wholesaler | Cyan | #06b6d4 |
| online | Teal | #10b981 |
| other | Gray | #6b7280 |

### 1.4 Selected Marker Pop Effect

**Why**: Current selected state only increases radius 7→10 (43%), nearly imperceptible.

**Change**: Add pulse ring CircleLayer (semi-transparent, radius 22, stroke 2) + inner circle (radius 14, white stroke 3).

### 1.5 Cap Card Re-Entry Animations

**Why**: FadeInRight on all 50 cards runs for 4000ms (50 * 80ms delay) on every data refresh.

**Change**: Track `hasShownListRef`, skip entering animation after first render. Cap stagger at 5 cards max.

### 1.6 ScrollView → FlatList for Store Cards

**Why**: ScrollView renders all 50 cards upfront. Only ~3 visible at once.

**Change**: Replace with `FlatList` horizontal, `windowSize={3}`, `getItemLayout` for snap.

### 1.7 StatusBar for Android Edge-to-Edge

**Change**: Add `<StatusBar style={isDark ? "light" : "dark"} />` from expo-status-bar.

### 1.8 Remove InteractionManager

**Why**: InteractionManager waits for all pending interactions (+300ms unpredictable delay).

**Change**: Always render MapView, defer only ShapeSource via 100ms setTimeout.

### 1.9 FlyTo on isStyleLoaded

**Why**: Current 600ms setTimeout is brittle — too slow on fast devices, race on slow ones.

**Change**: Trigger flyTo in useEffect gated on `isStyleLoaded && userLocation`.

---

## Sprint 2 — Core UX Transformation (2-3 days)

### 2.1 @gorhom/bottom-sheet v5

**Why**: Static Animated.View has no gesture interaction. Users expect drag-to-dismiss.

**Change**: 3 snap points (peek: 240px, half: 50%, full: 90%). `BottomSheetFlatList` for horizontal cards. Sheet snap on store selection.

### 2.2 Component Extraction

**Why**: 999-line monolith means every state change re-renders everything.

**Change**: Extract 7 components (see Architecture above). Each wrapped in `React.memo`. MapMarkerLayer never re-renders when search text changes.

### 2.3 Backend: Add Hours to `store.nearby`

**Why**: No hours data = no open/closed badges. "Open now" is the #1 filter on Google Maps.

**Change**: Lateral join in `store.nearby` to `storeHours` for today's open/close times:
```sql
SELECT sh.open_time, sh.close_time FROM store_hours sh
WHERE sh.store_id = stores.id
AND sh.day_of_week = EXTRACT(DOW FROM NOW())::int
AND NOT sh.is_closed LIMIT 1
```

### 2.4 Rich Store Cards

**Why**: Current 280px cards show almost nothing. No images, no hours, no live status.

**Change**: 300px cards with:
- Hero area (120px): store image or store-type gradient with icon + first letter
- Open/Closed badge overlaid on hero (green/red pill)
- Content: name, certification badge, rating, distance
- Gradient fallback uses `storeTypeColors[type].base → .light`

### 2.5 Full-Screen Search Overlay

**Why**: Current inline search only queries addresses (BAN API). Store name search (store.search tRPC) unused.

**Change**: Tap search bar → full-screen overlay with:
- Recent searches (MMKV persisted, last 5)
- Category grid (quick taps for store types)
- Dual-rail results: "Adresses" (BAN) + "Magasins" (store.search)

### 2.6 Glassmorphic Surfaces

**Why**: `glass` tokens exist in theme/colors.ts but unused on map.

**Change**: Search bar, filter chips, FABs wrapped in BlurView. Android fallback to semi-transparent View (already handled in sprint b760739).

### 2.7 Camera Padding for Bottom Sheet

**Why**: Selected markers hidden behind sheet.

**Change**: `padding: { bottom: SCREEN_HEIGHT * 0.35 }` in flyTo camera options.

### 2.8 Coordinated Selection Choreography

**Change**: On store tap: (1) camera flyTo at 0ms, (2) sheet snap to half at 100ms, (3) detail card entering animation at 200ms. Sequential, not simultaneous.

---

## Sprint 3 — Data Intelligence (1-2 days)

### 3.1 PostHog Map Analytics (10 Events)

**Must ship BEFORE ranking changes to establish baseline.**

Events: `map_opened`, `map_viewport_changed` (debounced 5s), `map_filter_toggled`, `map_store_tapped`, `map_get_directions`, `map_call_store`, `map_search`, `map_my_location_tapped`, `map_cluster_expanded`, `map_store_dismissed` (with `time_viewed_ms`).

### 3.2 Relevance Score

**Replace distance-only sorting with weighted formula:**

```
relevance = 0.35 * distance_score
          + 0.25 * certification_score (certifier trust_score / 100)
          + 0.20 * popularity_score (ln(1 + reviews) / ln(501))
          + 0.15 * quality_score ((avg_rating - 1) / 4, default 0.5)
          + 0.05 * freshness_score (1 / (1 + days_since_update / 90))
```

Computed in SQL, no ML needed at current scale.

### 3.3 halalStrictness Ranking Weights

| Strictness | cert_weight | Non-certified penalty |
|---|---|---|
| relaxed | 0.25 (default) | None |
| moderate | 0.30 | -0.05 |
| strict | 0.40 | -0.15 |
| very_strict | 0.50 | Filter out entirely |

### 3.4 Partial GiST Index

```sql
CREATE INDEX IF NOT EXISTS stores_active_certified_gist_idx
ON stores USING GIST (location)
WHERE is_active = true AND halal_certified = true;
```

### 3.5 Adaptive Cache TTL

Range 150s (sparse, zoomed) to 600s (dense, wide). Cache key includes radius band (near/mid/far).

---

## Sprint 4 — Engagement Polish (1-2 days)

### 4.1 Temporal Urgency Badges

- "Ferme dans 45min" (orange clock, <60min to close)
- "Ferme dans 20min" (red clock, <30min)
- "Ouvre dans 20min" (green dot)
- "Ouvert maintenant" filter: closed stores fade to 30% opacity

### 4.2 Icon-Led Filter Chips

Each chip gets: color dot + icon + label. Add 2 new filters:
- "Ouvert maintenant" (requires hours from Sprint 2.3)
- "Note 4.0+" (already in translations, unused)

### 4.3 "Rechercher dans cette zone" Button

Floating button appears when user pans >2km from last query center. Replaces invisible auto-refetch.

### 4.4 FAB Repositioning

Move "My Location" to bottom-right, above sheet. Standard Google Maps/Apple Maps position. Add "Re-search" FAB above it.

### 4.5 Dark Mode Marker Contrast

Use lighter palette values in dark mode. White stroke on all markers at 30% opacity.

### 4.6 Time-of-Day Smart Sorting

```
6-11h  → bakery, supermarket first
11-14h → restaurant, bakery first
14-18h → supermarket, butcher first
18-22h → restaurant, butcher first
```

Zero backend cost — sort in useMemo.

---

## Sprint 5 — Growth Foundation (2-3 days)

### 5.1 Store Share Card

Reuse ShareCard pattern. WhatsApp/Instagram optimized. Includes: store photo, name, certification badge, rating, mini-map, deep link, "Trouve sur Optimus Halal" branding.

### 5.2 Deep Linking

Expo universal links for `optimushalal.com/store/{slug}`. If app installed → open store on map. If not → web preview → app store.

### 5.3 Scanner → Map Cross-Link

After scanning halal product: "Ou acheter ce produit?" → map filtered by store type. Creates cross-feature retention loop.

### 5.4 "Ajouter un commerce" UGC Flow

GPS auto-fill address. User submits: name, type, photo. +50 XP reward. If store later claimed by owner → +200 XP bonus.

### 5.5 Photo Uploads

5 categories: vitrine, plats, certificat, menu, ambiance. R2 upload (already exists). +15 XP per approved photo. Moderation queue.

### 5.6 Tips "Bon a savoir"

Max 200 chars. Categories: conseil, a_savoir, bon_plan. Upvote/downvote. Best tip shown on marker popup.

---

## Backlog — Future Sprints

### Tier A (next 4-6 weeks)
- Ramadan mode (iftar countdown, suhoor, special menus, challenges)
- Vendredi Halal weekly anchor (curated Friday notification + prayer-time restaurant mode)
- Micro-reviews (4 quick-tap reactions after "get directions")
- Verified visit reviews (proximity check-in + gold badge)
- Store owner claiming (SIRET verification)
- Store web pages for SEO (Next.js on Vercel)
- Custom Mapbox Studio branded style

### Tier B (next 2-3 months)
- Implicit preference learning (after 10 sessions)
- User curated lists ("Mes boucheries de confiance")
- Auto-generated "Best of" lists per neighborhood
- Explorer achievements (connected to XP system)
- Neighborhood trending ("Tendance dans votre quartier")
- Store announcements ("Arrivage" notifications for butchers)
- Density heatmap layer (premium feature)

### Tier C (6+ months)
- Route preview on long press (Mapbox Directions API)
- Cluster spiderfication for dense urban areas
- Friend activity layer (phone hash contacts)
- Store owner dashboard + paid tiers (B2B revenue)
- Collaborative filtering (needs 50K+ users)
- Server-side spatial clustering (needs 5K+ stores)

---

## New Database Tables (Sprint 5+)

```
store_photos     — id, store_id, user_id, category, r2_key, status, created_at
store_tips       — id, store_id, user_id, text, category, upvotes, downvotes, created_at
checkins         — id, user_id, store_id, location, verified, created_at
store_claims     — id, store_id, user_id, status, verification_doc, created_at
store_announcements — id, store_id, type, text, photo_r2_key, expires_at, created_at
lists            — id, user_id, title, description, cover_r2_key, visibility, created_at
list_stores      — list_id, store_id, note, position
```

## Key Metrics

| Metric | Target (3 months) |
|--------|-------------------|
| Map sessions/week/user | 3+ |
| Store detail views per session | 2+ |
| "Get directions" conversion | 25%+ |
| Reviews per store (avg) | 5+ |
| Day-7 retention (map users) | 40%+ |
| Store shares/month | 5,000+ |
| Organic installs from shares | 500+/month |

## Design Principles

1. **Trust is the currency** — certification verification is existential for this app
2. **Subtlety over spectacle** — gamification must feel natural, not arcade
3. **Cultural authenticity** — Vendredi Halal and Ramadan mode signal "built by us, for us"
4. **Analytics before optimization** — ship PostHog events first, baseline 2 weeks, then rank
5. **WhatsApp is an ally** — bridge to it, don't fight it
6. **Progressive complexity** — new user sees clean map; 50-session user sees achievements
7. **3 notifications/week max** — respect beats engagement
