# Sprint A — "Surface the Gold" Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Surface existing backend capabilities (gamification, reviews, favorites) in the mobile app and fix all broken stubs to achieve a polished, premium experience.

**Architecture:** The backend already has leaderboard, achievements, rewards, and review procedures. This sprint creates 3 new screens, wires 2 existing features to backend, and fixes 5 broken stubs. No new backend work needed except 1 new procedure for community votes.

**Tech Stack:** React Native 0.81.5, Expo Router, tRPC React Query, Reanimated, expo-image, FlashList v2

---

## Task 1: Add Missing Hooks to useLoyalty.ts

**Files:**
- Modify: `optimus-halal/src/hooks/useLoyalty.ts`

**Context:** Backend has 7 loyalty procedures. Only 3 have hooks. Need hooks for `getRewards`, `claimReward`, `getMyRewards`, `getHistory`.

**Step 1: Add the 4 missing hooks**

```typescript
// After existing useLeaderboard hook, add:

export function useLoyaltyHistory(limit = 20, offset = 0) {
  return trpc.loyalty.getHistory.useQuery(
    { limit, offset },
    { staleTime: 1000 * 60 * 2 }
  );
}

export function useRewards(category?: string) {
  return trpc.loyalty.getRewards.useQuery(
    { category, limit: 20 },
    { staleTime: 1000 * 60 * 10 }
  );
}

export function useClaimReward() {
  const utils = trpc.useUtils();
  return trpc.loyalty.claimReward.useMutation({
    onSuccess: () => {
      utils.loyalty.getBalance.invalidate();
      utils.loyalty.getRewards.invalidate();
      utils.loyalty.getMyRewards.invalidate();
    },
  });
}

export function useMyRewards() {
  return trpc.loyalty.getMyRewards.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
  });
}
```

**Step 2: Add hooks for product reviews**

Create new file: `optimus-halal/src/hooks/useReviews.ts`

```typescript
import { trpc } from "@/lib/trpc";

export function useCreateReview() {
  const utils = trpc.useUtils();
  return trpc.report.createReview.useMutation({
    onSuccess: () => {
      utils.report.invalidate();
    },
  });
}

export function useProductReviews(productId: string, limit = 10) {
  return trpc.report.getProductReviews.useQuery(
    { productId, limit, offset: 0 },
    { enabled: !!productId, staleTime: 1000 * 60 * 5 }
  );
}

export function useMarkHelpful() {
  return trpc.report.markHelpful.useMutation();
}
```

**Step 3: Export from hooks index**

Modify: `optimus-halal/src/hooks/index.ts` — add `export * from "./useReviews";`

**Step 4: TypeScript check**

Run: `cd optimus-halal && npx tsc --noEmit`
Expected: PASS (no errors)

**Step 5: Commit**

```bash
git add optimus-halal/src/hooks/useLoyalty.ts optimus-halal/src/hooks/useReviews.ts optimus-halal/src/hooks/index.ts
git commit -m "feat: add loyalty rewards + review hooks (backend already exists)"
```

---

## Task 2: Wire Favorites on scan-result to Backend

**Files:**
- Modify: `optimus-halal/app/scan-result.tsx:957-962` (favorites section)
- Modify: `optimus-halal/app/scan-result.tsx:1004-1008` (toggle handler)

**Context:** scan-result.tsx currently uses `useScanHistoryStore()` (MMKV local) for favorites. Should use `useAddFavorite()` / `useRemoveFavorite()` (tRPC backend). The backend favorites hooks already exist in `useFavorites.ts`. The local MMKV store means favorites are lost on reinstall and invisible to `settings/favorites.tsx`.

**Step 1: Replace MMKV favorites with backend hooks**

In scan-result.tsx, replace the favorites section (around lines 957-962):

```typescript
// OLD:
// const { toggleFavorite, isFavorite: checkIsFavorite } = useScanHistoryStore();
// const productIsFavorite = product ? checkIsFavorite(product.barcode) : false;

// NEW:
const favoritesQuery = trpc.favorites.list.useQuery(
  { limit: 200 },
  { staleTime: 1000 * 60 * 5 }
);
const addFavorite = useAddFavorite();
const removeFavorite = useRemoveFavorite();
const productIsFavorite = useMemo(
  () => favoritesQuery.data?.some((f: any) => f.barcode === product?.barcode) ?? false,
  [favoritesQuery.data, product?.barcode]
);
```

**Step 2: Update toggle handler**

Replace `handleToggleFavorite` (around lines 1004-1008):

```typescript
const handleToggleFavorite = useCallback(() => {
  impact(ImpactFeedbackStyle.Medium);
  if (!product?.id) return;
  if (productIsFavorite) {
    removeFavorite.mutate({ productId: product.id });
  } else {
    addFavorite.mutate({ productId: product.id });
  }
}, [product, productIsFavorite, addFavorite, removeFavorite, impact]);
```

**Step 3: Add imports**

Add `useAddFavorite`, `useRemoveFavorite` to imports from `@/hooks`. Remove `useScanHistoryStore` import if no longer needed elsewhere in the file.

**Step 4: TypeScript check**

Run: `cd optimus-halal && npx tsc --noEmit`

**Step 5: Commit**

```bash
git add optimus-halal/app/scan-result.tsx
git commit -m "feat: wire scan-result favorites to backend (was local-only MMKV)"
```

---

## Task 3: Wire Community Vote to Backend

**Files:**
- Modify: `optimus-halal/app/scan-result.tsx:931-932` (vote state)
- Modify: `optimus-halal/app/scan-result.tsx:1844-1869` (vote buttons)

**Context:** Vote buttons exist in UI (thumbs up/down) but `setUserVote` is purely local state. Use `report.createReview` procedure (rating 5 = up, rating 1 = down) to persist votes. `report.createReview` takes `{ productId, rating: 1-5, comment? }`.

**Step 1: Add review mutation**

Near the vote state declaration (line ~932):

```typescript
// ── User Vote ──────────────────────────────────
const [userVote, setUserVote] = useState<"up" | "down" | null>(null);
const reviewMutation = useCreateReview();
```

**Step 2: Update vote handlers**

Replace the inline `onPress` handlers (lines ~1844-1869):

```typescript
onPress={() => {
  impact();
  const newVote = userVote === "up" ? null : "up";
  setUserVote(newVote);
  if (newVote && product?.id) {
    reviewMutation.mutate({
      productId: product.id,
      rating: 5,
    });
  }
}}
// ... and for down:
onPress={() => {
  impact();
  const newVote = userVote === "down" ? null : "down";
  setUserVote(newVote);
  if (newVote && product?.id) {
    reviewMutation.mutate({
      productId: product.id,
      rating: 1,
    });
  }
}}
```

**Step 3: Add import**

Add `useCreateReview` to imports from `@/hooks`.

**Step 4: TypeScript check**

Run: `cd optimus-halal && npx tsc --noEmit`

**Step 5: Commit**

```bash
git add optimus-halal/app/scan-result.tsx
git commit -m "feat: wire community vote to backend via createReview"
```

---

## Task 4: Leaderboard Screen

**Files:**
- Create: `optimus-halal/app/settings/leaderboard.tsx`

**Context:** `useLeaderboard(limit)` hook already exists. `loyalty.getLeaderboard` returns `Array<{ id, displayName, avatarUrl, level, experiencePoints, totalScans }>`. This needs a beautiful, gamified leaderboard screen with the user's position highlighted. Use existing design patterns from profile.tsx and certifier-ranking.tsx for layout reference.

**Step 1: Create the leaderboard screen**

Create `optimus-halal/app/settings/leaderboard.tsx` — full premium leaderboard with:
- Back button header with "Classement" title
- Podium top 3 (gold/silver/bronze with Avatar component)
- Remaining users in a FlashList with rank, avatar, display name, level badge, XP count, total scans
- Current user highlighted with a subtle glow border
- Loading skeleton, error state, empty state
- Use `useLeaderboard(50)` hook
- Use `useMe()` to identify current user for highlighting
- Animated entry with FadeInDown

Design reference: Premium feel matching the app's existing aesthetic (Islamic green accents, rounded cards, subtle borders). Use `useTheme()` for dark/light and `useTranslation()` for all labels.

**Step 2: Add i18n keys**

Add to `fr.ts`, `en.ts`, `ar.ts` under `leaderboard:` namespace:
```typescript
leaderboard: {
  title: "Classement",           // "Leaderboard" / "الترتيب"
  rank: "Rang",                  // "Rank" / "المرتبة"
  level: "Niveau",               // "Level" / "المستوى"
  xp: "XP",                     // same all locales
  scans: "scans",               // "scans" / "عمليات المسح"
  you: "Vous",                  // "You" / "أنت"
  empty: "Aucun classement disponible", // "No rankings available" / "لا يوجد ترتيب"
  emptyDesc: "Scannez des produits pour monter dans le classement !", // etc.
  top3: "Podium",               // "Podium" / "المنصة"
},
```

**Step 3: TypeScript check**

Run: `cd optimus-halal && npx tsc --noEmit`

**Step 4: Commit**

```bash
git add optimus-halal/app/settings/leaderboard.tsx optimus-halal/src/i18n/translations/fr.ts optimus-halal/src/i18n/translations/en.ts optimus-halal/src/i18n/translations/ar.ts
git commit -m "feat: add leaderboard screen with podium + ranked list"
```

---

## Task 5: Achievements Screen

**Files:**
- Create: `optimus-halal/app/settings/achievements.tsx`

**Context:** `useAchievements()` hook already exists. Returns `Array<{ ...achievementFields, unlocked: boolean, unlockedAt: Date | undefined }>`. Build a trophy case / badge gallery showing locked (greyed) and unlocked (golden glow) achievements.

**Step 1: Create the achievements screen**

Create `optimus-halal/app/settings/achievements.tsx` — premium achievements gallery:
- Back button header with "Mes Trophées" title and count badge (X/total unlocked)
- Grid layout (2 columns) of achievement cards
- Each card: icon placeholder (MaterialIcons mapped by achievement type), title, description
- Unlocked: full color, golden border glow, unlock date shown
- Locked: greyscale, "???" description, lock icon overlay
- Progress ring if achievement has a progress field
- Use `useAchievements()` hook
- Loading skeleton, empty state
- Animated stagger entry

**Step 2: Add i18n keys**

Add to `fr.ts`, `en.ts`, `ar.ts` under `achievements:` namespace:
```typescript
achievements: {
  title: "Mes Trophées",        // "My Trophies" / "جوائزي"
  unlocked: "Débloqué",         // "Unlocked" / "مفتوح"
  locked: "Verrouillé",         // "Locked" / "مقفل"
  unlockedOn: "Obtenu le",      // "Earned on" / "حصلت عليه في"
  progress: "Progression",      // "Progress" / "التقدم"
  empty: "Scannez pour débloquer vos premiers trophées !", // etc.
  count: "{{unlocked}}/{{total}}", // same all locales
},
```

**Step 3: TypeScript check + Commit**

---

## Task 6: Rewards Catalog Screen

**Files:**
- Create: `optimus-halal/app/settings/rewards.tsx`

**Context:** Backend has `loyalty.getRewards` (list available), `loyalty.claimReward` (redeem), `loyalty.getMyRewards` (claimed list). Hooks were added in Task 1. Build a reward shop where users spend XP points.

**Step 1: Create the rewards screen**

Create `optimus-halal/app/settings/rewards.tsx` — premium rewards shop:
- Back button header with "Récompenses" title
- Points balance banner at top (from `useLoyaltyBalance()`) — big number with coin icon
- Category filter tabs (from reward.category) — horizontal chips
- Available rewards grid: card with icon, title, description, points cost, "Échanger" button
- Disabled state if user points < reward cost (greyed out, "X pts manquants")
- Confirmation modal before claiming (bottom sheet or Alert)
- "Mes Récompenses" section below — list of claimed rewards with redemption codes
- Use `useRewards()`, `useClaimReward()`, `useMyRewards()`, `useLoyaltyBalance()`
- Loading skeleton, empty state
- Haptic feedback on successful claim

**Step 2: Add i18n keys**

Add to `fr.ts`, `en.ts`, `ar.ts` under `rewards:` namespace:
```typescript
rewards: {
  title: "Récompenses",           // "Rewards" / "المكافآت"
  yourPoints: "Vos Points",       // "Your Points" / "نقاطك"
  claim: "Échanger",              // "Redeem" / "استبدال"
  claimed: "Obtenu",              // "Claimed" / "تم الاستلام"
  pointsMissing: "{{count}} pts manquants", // "{{count}} pts needed" / etc.
  confirmTitle: "Confirmer l'échange ?",   // etc.
  confirmBody: "Échanger {{cost}} points contre {{name}} ?",
  redemptionCode: "Code",         // "Code" / "الرمز"
  myRewards: "Mes Récompenses",   // "My Rewards" / "مكافآتي"
  empty: "Aucune récompense disponible",
  emptyDesc: "De nouvelles récompenses arrivent bientôt !",
  noClaimedRewards: "Échangez vos points pour des récompenses exclusives.",
},
```

**Step 3: TypeScript check + Commit**

---

## Task 7: Fix All Broken Stubs

**Files:**
- Modify: `optimus-halal/app/(tabs)/alerts.tsx:213-225`
- Modify: `optimus-halal/app/articles/[id].tsx:76-79`
- Modify: `optimus-halal/app/(tabs)/scanner.tsx:204-207`
- Modify: `optimus-halal/app/(tabs)/profile.tsx:196-199`

### Fix 7a: Alerts "View Source" link

In `alerts.tsx`, the `TouchableOpacity` at line 213 has no `onPress`. Add:

```tsx
onPress={() => {
  if (alert.sourceUrl) Linking.openURL(alert.sourceUrl);
}}
```

Add `import { Linking } from "react-native"` at top.

### Fix 7b: Articles external link

In `articles/[id].tsx`, replace `handleOpenSource` (line 76-79):

```typescript
const handleOpenSource = useCallback(() => {
  impact();
  if (article?.externalLink) Linking.openURL(article.externalLink);
}, [impact, article?.externalLink]);
```

Add `import { Linking } from "react-native"` at top.

### Fix 7c: Scanner history navigation

In `scanner.tsx`, fix `handleOpenHistory` (line 204-207):

```typescript
const handleOpenHistory = useCallback(async () => {
  impact();
  router.push("/settings/scan-history");
}, [impact, router]);
```

### Fix 7d: Profile settings gear

In `profile.tsx`, fix `handleSettings` (line 196-199):

```typescript
const handleSettings = useCallback(() => {
  impact();
  router.push("/settings/appearance");
}, [impact, router]);
```

Navigate to appearance (the most useful settings screen) since there's no dedicated settings hub yet.

### Fix 7e: Wire gamification screens into Profile menu

In `profile.tsx`, add navigation items for leaderboard, achievements, and rewards to the existing menu section. Use `router.push("/settings/leaderboard")`, etc.

**TypeScript check + Commit all fixes together:**

```bash
git add optimus-halal/app/(tabs)/alerts.tsx optimus-halal/app/articles/[id].tsx optimus-halal/app/(tabs)/scanner.tsx optimus-halal/app/(tabs)/profile.tsx
git commit -m "fix: wire all broken stubs (alerts link, articles link, scanner nav, profile settings)"
```

---

## Task 8: Priority 1 i18n Cleanup

**Files:**
- Modify: `optimus-halal/src/components/ui/StatusPill.tsx` — accept labels prop or use `useTranslation`
- Modify: `optimus-halal/app/settings/scan-history.tsx` — replace ~15 hardcoded strings
- Modify: `optimus-halal/app/settings/favorites.tsx` — replace ~25 hardcoded strings
- Modify: `optimus-halal/app/settings/boycott-list.tsx` — replace ~5 hardcoded strings
- Modify: `optimus-halal/app/settings/certifier-ranking.tsx` — replace ~6 hardcoded strings
- Modify: `optimus-halal/src/i18n/translations/fr.ts` — add ~30 new keys
- Modify: `optimus-halal/src/i18n/translations/en.ts` — add ~30 new keys
- Modify: `optimus-halal/src/i18n/translations/ar.ts` — add ~30 new keys

**Context:** Priority 1 strings are visible in production to all users. These are loading states, error messages, empty states, and status labels that are hardcoded in French. The marketplace screens (Priority 2) are behind a feature flag and can wait.

### Step 1: Add i18n keys to all 3 translation files

Add new namespaces: `scanHistory`, `favorites` (partial — some keys exist), `boycott`, `certifierRanking`, and common keys `loading`, `loadingError`, `retry`, `back`, `backHint`.

### Step 2: StatusPill — add `useTranslation` internally

StatusPill is a pure display component used everywhere. Add `useTranslation()` hook and replace the hardcoded `STATUS_CONFIG` labels with `t.scanResult.halal`, etc.

### Step 3: Update scan-history.tsx

Replace all 15+ hardcoded French strings with `t.scanHistory.*` and `t.common.*` keys.

### Step 4: Update favorites.tsx

Replace all 25+ hardcoded French strings with `t.favorites.*` and `t.common.*` keys.

### Step 5: Update boycott-list.tsx and certifier-ranking.tsx

Replace 5-6 hardcoded strings each.

### Step 6: TypeScript check

Run: `cd optimus-halal && npx tsc --noEmit`

### Step 7: Commit

```bash
git commit -m "feat(i18n): replace 50+ hardcoded French strings with translation keys"
```

---

## Execution Order

Tasks 1-3 are sequential (hooks needed first, then scan-result wiring).
Tasks 4-6 are independent (3 new screens, can be parallelized).
Task 7 is independent (stub fixes).
Task 8 is independent (i18n cleanup).

Recommended: 1 → 2 → 3 → [4, 5, 6 in parallel] → 7 → 8

## Post-Sprint Verification

1. `cd optimus-halal && npx tsc --noEmit` — must pass
2. `cd backend && pnpm test` — must pass (if local DB running)
3. Test on device: scan a product → vote → favorite → check favorites screen → check leaderboard
4. Verify all 5 fixed stubs work (alerts link, articles link, scanner history, profile settings, favorites search)
