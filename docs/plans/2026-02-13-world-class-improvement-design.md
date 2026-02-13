# Optimus Halal — World-Class Improvement Design

> **Date** : 2026-02-13
> **Lead CTO** : Claude (Opus 4.6)
> **Round Table** : Claude + Gemini + Codex (gpt-5.2, partial — truncated at analysis phase)
> **Approach** : Layer by Layer (4 sprints)
> **Priority** : Foundations first

---

## Context

Optimus Halal is a React Native/Expo mobile app for halal product verification with a dedicated Node.js BFF (Hono + tRPC + Drizzle + PostgreSQL + Redis).

### Audit Scores (Round Table Consensus)

| Criteria | Claude | Gemini | Codex (partial) | Consensus |
|---|---|---|---|---|
| **Overall** | 6.3/10 | 5.8/10 | ~6/10 | **6/10** |
| Performance Mobile | 6/10 | 6/10 | — | **6/10** |
| Accessibility | 2/10 | 3/10 | — | **2.5/10** |
| UX/Micro-interactions | 7.5/10 | 7/10 | — | **7/10** |
| Architecture | 6.5/10 | 4/10 | noted issues | **5/10** |
| Security Backend | 7.5/10 | — | noted issues | **7/10** |
| Code Quality | 7/10 | — | TS strict ✅ | **7/10** |

### Verdict: REQUEST CHANGES (unanimous — all 3 AIs)

### Codex (gpt-5.2) Specific Findings

- **CORS too permissive** (`origin: "*"`) — token leakage risk via browser
- **Rate limiting uses last IP** in X-Forwarded-For (should be first or `cf-connecting-ip`)
- **Rate limiting non-atomic** (separate INCR + EXPIRE → race condition, should use Lua script)
- **Auth middleware duplicated** between `middleware/auth.ts` and `trpc/context.ts`
- **Positives**: TypeScript strict ✅, prepared statements ✅, Redis lazyConnect ✅, Zod env validation ✅

### Critical Issues Identified

1. **tRPC client cast as `any`** — zero end-to-end type safety (Claude + Gemini)
2. **No accessibility** — missing ARIA labels, roles, hints across all components (Claude + Gemini)
3. **No loading states** — no skeletons, no suspense boundaries (Claude + Gemini)
4. **No error boundaries** — crashes propagate unhandled to root (Claude + Gemini)
5. **React Query unused** — installed but all server state in Zustand (Claude)
6. **AsyncStorage over MMKV** — 30x slower for sync reads (Gemini)
7. **No list virtualization** — ScrollView + .map() everywhere (Claude + Gemini)
8. **No DB transactions** — race conditions on multi-step mutations (Claude)
9. **RTL not implemented** — Arabic in i18n but no layout mirroring (Gemini)
10. **150+ hardcoded French strings** — no extraction to translation files (Claude)

---

## Sprint 1 — Data Layer

**Goal**: End-to-end type safety, proper state management, robust error handling.

### 1.1 tRPC Type Safety E2E
- Remove `as any` cast in `optimus-halal/src/services/api/client.ts`
- Import `AppRouter` from backend via TypeScript path alias (`@backend/*`)
- Add `paths` to `tsconfig.json`: `"@backend/*": ["../backend/src/*"]`
- Result: full autocomplete on all 47 procedures

### 1.2 Zustand → React Query (server state only)
- Install `@tanstack/react-query` + `@trpc/react-query`
- Create `QueryClientProvider` in root layout
- Migrate API stores (`apiStores.ts`) to tRPC hooks:
  - `useUserStore.fetchProfile()` → `trpc.profile.me.useQuery()`
  - `useScanStore.scanBarcode()` → `trpc.scan.scanBarcode.useMutation()`
- Keep Zustand for client state only (theme, onboarding, UI preferences)

### 1.3 AsyncStorage → MMKV
- `react-native-mmkv` already in dependencies
- Create `MMKVStorage` adapter for Zustand persist
- Replace `AsyncStorage` in all persisted stores
- Gain: synchronous reads, ~30x faster

### 1.4 Error Handling Global
- **Backend**: Wrap multi-step mutations in Drizzle transactions (`db.transaction()`)
- **Frontend**: Create global `ErrorBoundary` + per-route error boundaries
- **tRPC**: Configure global `onError` in client for error logging

### 1.5 Token Refresh Automatic
- Implement custom tRPC `httpLink` with 401 retry logic
- Refresh token flow already in backend, wire it properly in client

---

## Sprint 2 — UI Foundations

**Goal**: Every screen handles 4 states (loading, error, empty, data) and lists are performant.

### 2.1 Loading Skeletons
- Create reusable `<Skeleton />` component (animated shimmer via Reanimated)
- Variants: `<ProductCardSkeleton />`, `<ProfileSkeleton />`, `<ListSkeleton count={N} />`
- Integrate with React Query: `isLoading ? <Skeleton /> : <Content />`
- Respect `prefers-reduced-motion`: static shimmer if enabled

### 2.2 Error Boundaries
- Global `<ErrorBoundary />` in `_layout.tsx` with branded "Oops" screen
- `<QueryErrorBoundary />` per route for tRPC errors (retry button)
- Design: SVG illustration + clear message + "Retry" CTA

### 2.3 Empty States
- Component `<EmptyState icon={...} title={...} action={...} />`
- Per feature:
  - Empty favorites → "Scan your first product!"
  - Empty history → illustration + scan CTA
  - No search results → suggestions

### 2.4 List Virtualization
- Replace all `ScrollView` + `.map()` with `FlashList` (Shopify)
- Home: `FlashList` for horizontal product list
- Favorites: `FlashList` with `estimatedItemSize`
- Scan history: `FlashList` with infinite pagination
- Pull-to-refresh via React Query `refetch()`

### 2.5 Image Optimization
- Migrate from `Image` (RN) to `expo-image` everywhere
- Cache policy: `cachePolicy="memory-disk"`
- Blurhash placeholders for smooth loading

---

## Sprint 3 — Accessibility + i18n

**Goal**: WCAG 2.2 AA compliance, full RTL support, externalized strings.

### 3.1 Systematic Accessibility
- Audit all `src/components/ui/`:
  - `Button`: add `accessibilityRole="button"` + `accessibilityLabel`
  - `Input`: add `accessibilityLabel` + `accessibilityHint` + error announcement
  - `Card`: `accessibilityRole="summary"` if tappable
  - `IconButton`: mandatory label (not just icon)
- Focus management on screen transitions
- Scanner: `AccessibilityInfo.announceForAccessibility()` on successful scan
- Contrast: verify all text/background ratios (minimum 4.5:1)

### 3.2 RTL Support (Arabic)
- Implement `I18nManager.forceRTL(true)` when `locale === "ar"`
- Create `useRTL()` hook returning `isRTL` + style helpers
- Adapt components: `flexDirection`, `textAlign`, directional icons
- Test inverted layout on every screen

### 3.3 i18n String Extraction
- Extract ~150 hardcoded French strings to translation files
- Structure: `src/i18n/locales/{fr,en,ar}.json`
- Semantic keys: `auth.login.title`, `scan.result.halal_status`, etc.
- Integrate with existing `useTranslation()` hook
- Add EN and AR translations for critical strings

### 3.4 Reduced Motion
- Check `useReducedMotion()` from Reanimated on ALL animations
- Fallback: instant transitions (opacity 0→1, no slide/spring)
- Scanner: disable scan line animation if reduced motion

### 3.5 Accessible Haptics
- Add toggle in Settings: "Tactile vibrations"
- Respect system preference + user toggle
- Create `useHaptics()` wrapper that checks both

---

## Sprint 4 — UX Premium & Polish

**Goal**: Transform from "functional" to "award-winning" — fluid animations, memorable micro-interactions, pixel-perfect polish.

### 4.1 Navigation Transitions
- Shared Element Transitions between product list → product detail
- Custom scanner → result transition: overlay morphs into result card
- All transitions: 300ms ease-out, interruptible

### 4.2 Micro-interactions
- **Scan button**: subtle pulse when idle, scale down + haptic on press
- **Add to favorites**: heart "pop" animation (scale 1→1.3→1 + particle burst)
- **Halal score**: animated gauge (countUp + SVG arc)
- **Pull-to-refresh**: branded animation (Optimus logo spinning)
- **Swipe-to-delete**: red reveal with trash icon + haptic

### 4.3 Dark Mode Polish
- Fix white flash on startup (dynamic background color in AppInitializer)
- Review all shadows in dark mode (subtle border elevation instead)
- Adaptive status bar: `light-content` in dark, `dark-content` in light
- Splash screen: adapt color to system theme

### 4.4 Performance 60fps
- Profile re-renders with Flipper/React DevTools
- Memoize heavy components with `React.memo` + `useMemo`/`useCallback`
- All animations on UI thread via Reanimated worklets
- Preload critical images (avatar, icons) at startup

### 4.5 Global Polish
- `KeyboardAvoidingView` on all forms
- Safe area insets on all screens (notch, home indicator)
- Offline banner: detect connectivity + show subtle banner
- Swipe back on iOS, predictive back gesture on Android

### 4.6 Backend Polish
- Structured logging (pino instead of console.log)
- Extended health check (DB + Redis connectivity)
- Gzip compression on tRPC responses
- Redis cache on frequent read endpoints (products, categories)

---

## Round Table Cross-Review Protocol

Each sprint follows the Round Table protocol:
1. **Claude** implements the sprint
2. **Gemini** reviews via `gemini -p "REVIEW PROMPT" --yolo`
3. Both must score ≥ 7/10 and APPROVE before moving to next sprint
4. If REQUEST CHANGES → fix immediately → re-review

## Success Criteria

- [ ] Build: 0 errors, 0 warnings
- [ ] TypeScript strict mode — zero `any`
- [ ] WCAG 2.2 AA compliance (ARIA, keyboard, focus, contrast)
- [ ] `prefers-reduced-motion` on all animations
- [ ] All lists virtualized (FlashList)
- [ ] All images via expo-image with cache
- [ ] Error boundaries on every route
- [ ] Loading skeletons on every data-dependent screen
- [ ] 3 languages (FR, EN, AR) with RTL support
- [ ] 60fps animations on mid-range devices
- [ ] Token refresh automatic and transparent
- [ ] DB transactions on all multi-step mutations

## Target Score: 9/10+ (World-Class)
