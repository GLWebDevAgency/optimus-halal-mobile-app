# Sprint 2: UI Foundations — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Every screen handles 4 states (loading, error, empty, data). Lists are performant. Images are optimized.

**Architecture:** Create reusable Skeleton components with Reanimated shimmer. Install FlashList for all scrollable lists. Add per-route QueryErrorBoundary. Create EmptyState component. Optimize all images via expo-image with blurhash.

**Tech Stack:** react-native-reanimated v4, @shopify/flash-list, expo-image v3, React Query suspense

---

## Task 1: Install FlashList

**Files:**
- Modify: `optimus-halal/package.json` (add dependency)

**Step 1: Install**

```bash
cd optimus-halal && pnpm add @shopify/flash-list
```

**Step 2: Verify**

```bash
pnpm tsc --noEmit 2>&1 | grep -c "error TS"
```
Expected: 0 errors.

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: install @shopify/flash-list for list virtualization"
```

---

## Task 2: Skeleton component with Reanimated shimmer

**Files:**
- Create: `optimus-halal/src/components/ui/Skeleton.tsx`

Create a reusable `<Skeleton />` component with animated shimmer effect:

```typescript
import React, { useEffect } from "react";
import { View, StyleSheet, type ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useReducedMotion,
} from "react-native-reanimated";

interface SkeletonProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width, height, borderRadius = 4, style }: SkeletonProps) {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    if (reducedMotion) return;
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 1000 }),
      -1,
      true
    );
  }, [reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 0.5 : opacity.value,
  }));

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: "#e5e7eb" },
        animatedStyle,
        style,
      ]}
    />
  );
}

// Pre-built skeleton variants
export function SkeletonText({ lines = 3, width = "100%" }: { lines?: number; width?: number | string }) {
  return (
    <View style={{ gap: 8 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? "60%" : width}
          height={14}
          borderRadius={4}
        />
      ))}
    </View>
  );
}

export function SkeletonCard() {
  return (
    <View style={skeletonStyles.card}>
      <Skeleton width={80} height={80} borderRadius={12} />
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton width="70%" height={16} />
        <Skeleton width="40%" height={14} />
        <Skeleton width="30%" height={14} />
      </View>
    </View>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <View style={{ gap: 12, padding: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
});
```

Key points:
- Uses `useReducedMotion()` from Reanimated — static opacity if reduced motion enabled
- Shimmer via opacity pulse (0.3 <-> 0.7), not gradient (simpler, performant)
- Pre-built variants: `SkeletonText`, `SkeletonCard`, `SkeletonList`

**Step: Verify + Commit**

```bash
npx tsc --noEmit
git add src/components/ui/Skeleton.tsx
git commit -m "feat: add Skeleton component with Reanimated shimmer + reduced motion"
```

---

## Task 3: EmptyState component

**Files:**
- Create: `optimus-halal/src/components/ui/EmptyState.tsx`

```typescript
import React from "react";
import { View, Text, Pressable, StyleSheet, type ViewStyle } from "react-native";

interface EmptyStateProps {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function EmptyState({ title, message, actionLabel, onAction, style }: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {actionLabel && onAction && (
        <Pressable style={styles.button} onPress={onAction}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}
```

With styles matching the app's green (#16a34a) theme.

**Step: Verify + Commit**

```bash
git add src/components/ui/EmptyState.tsx
git commit -m "feat: add EmptyState component for empty data states"
```

---

## Task 4: QueryErrorBoundary for per-route errors

**Files:**
- Create: `optimus-halal/src/components/QueryErrorBoundary.tsx`

A lightweight error boundary specifically for tRPC/React Query errors, with a retry button that calls `queryClient.refetchQueries()`.

```typescript
import React, { Component, type ReactNode } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { QueryErrorResetBoundary } from "@tanstack/react-query";

interface Props {
  children: ReactNode;
}

export function QueryErrorBoundary({ children }: Props) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorCatcher onReset={reset}>{children}</ErrorCatcher>
      )}
    </QueryErrorResetBoundary>
  );
}

// Internal class component for error catching
class ErrorCatcher extends Component<
  { children: ReactNode; onReset: () => void },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  private handleRetry = () => {
    this.props.onReset();
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Erreur de chargement</Text>
          <Text style={styles.message}>
            Impossible de charger les donnees. Verifiez votre connexion.
          </Text>
          <Pressable style={styles.button} onPress={this.handleRetry}>
            <Text style={styles.buttonText}>Reessayer</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  message: { fontSize: 14, color: "#666", marginBottom: 24, textAlign: "center" },
  button: { backgroundColor: "#16a34a", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
```

**Step: Verify + Commit**

```bash
git add src/components/QueryErrorBoundary.tsx
git commit -m "feat: add QueryErrorBoundary with React Query reset integration"
```

---

## Task 5: Virtualize home screen lists with FlashList

**Files:**
- Modify: `optimus-halal/app/(tabs)/index.tsx`

Replace `ScrollView` + `.map()` patterns with `FlashList` for the home screen's horizontal product lists and vertical content.

Read the file first, identify all `.map()` rendering loops inside ScrollViews, and convert them to FlashList with `estimatedItemSize`.

For horizontal lists: `<FlashList horizontal estimatedItemSize={120} />`
For vertical lists: `<FlashList estimatedItemSize={80} />`

**Step: Verify + Commit**

```bash
git add app/(tabs)/index.tsx
git commit -m "feat: virtualize home screen lists with FlashList"
```

---

## Task 6: Virtualize favorites and scan history with FlashList

**Files:**
- Modify: `optimus-halal/app/settings/favorites.tsx`
- Modify: Any scan history screen that lists items

Replace ScrollView + .map() with FlashList. Add pull-to-refresh where applicable.

**Step: Verify + Commit**

```bash
git add -A
git commit -m "feat: virtualize favorites and scan history with FlashList"
```

---

## Task 7: Optimize images with expo-image

**Files:**
- Modify: All files using `Image` from `react-native` — migrate to `Image` from `expo-image`

Search: `grep -rn "from \"react-native\"" optimus-halal/app/ optimus-halal/src/ | grep "Image"`

For each file:
1. Change import from `react-native` to `expo-image`
2. Add `cachePolicy="memory-disk"` prop
3. Add `placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}` for remote images
4. Add `contentFit="cover"` where appropriate

**Step: Verify + Commit**

```bash
git add -A
git commit -m "feat: migrate all Image to expo-image with cache + blurhash placeholders"
```

---

## Task 8: Add loading skeletons to key screens

**Files:**
- Modify: `optimus-halal/app/(tabs)/index.tsx` (home — add skeleton while data loads)
- Modify: `optimus-halal/app/(tabs)/profile.tsx` (profile — skeleton for user data)
- Modify: `optimus-halal/app/settings/favorites.tsx` (favorites list skeleton)

For each screen that uses React Query hooks or `safeApiCall`:
1. Check `isLoading` state
2. Show `<SkeletonList />` or appropriate skeleton variant while loading
3. Show `<EmptyState />` when data is empty
4. Show actual content when data is present

Pattern:
```tsx
if (isLoading) return <SkeletonList count={5} />;
if (!data?.length) return <EmptyState title="Aucun resultat" />;
return <FlashList data={data} ... />;
```

**Step: Verify + Commit**

```bash
git add -A
git commit -m "feat: add loading skeletons and empty states to key screens"
```

---

## Task 9: Wrap tab screens with QueryErrorBoundary

**Files:**
- Modify: `optimus-halal/app/(tabs)/_layout.tsx` (wrap each tab with QueryErrorBoundary)

Add QueryErrorBoundary as a wrapper around each tab screen content, so tRPC errors show a retry button instead of crashing.

**Step: Verify + Commit**

```bash
git add -A
git commit -m "feat: wrap tab screens with QueryErrorBoundary"
```

---

## Task 10: Full build verification + Gemini review

**Step 1: TypeScript check**

```bash
cd optimus-halal && npx tsc --noEmit
cd ../backend && npx tsc --noEmit
```
Expected: 0 errors both.

**Step 2: Gemini cross-review**

```bash
gemini -p "Review Sprint 2 (UI Foundations) changes:
- Skeleton component with Reanimated shimmer + reduced motion
- EmptyState component
- QueryErrorBoundary with React Query reset
- FlashList virtualization (home, favorites, history)
- expo-image migration with cache + blurhash
- Loading/empty/error states on key screens

Score 1-10, verdict APPROVE or REQUEST CHANGES." --yolo
```

Expected: >= 7/10, APPROVE.
