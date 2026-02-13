# Sprint 1: Data Layer — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** End-to-end tRPC type safety, React Query for server state, MMKV for persistence, global error handling.

**Architecture:** Import `AppRouter` type from `backend/` into mobile app via TS path alias. Wrap tRPC around the existing React Query provider. Migrate Zustand persist from AsyncStorage to MMKV. Add ErrorBoundary at root. Harden backend with DB transactions and atomic rate limiting.

**Tech Stack:** tRPC v11 + React Query v5, react-native-mmkv v4, Zustand v5, Drizzle ORM, Redis

---

## Task 1: Import AppRouter type — kill `any` casts

**Files:**
- Modify: `optimus-halal/tsconfig.json` (add `@backend/*` path alias)
- Modify: `optimus-halal/src/services/api/client.ts:181,293` (replace `any` with `AppRouter`)

**Step 1: Add path alias to tsconfig.json**

In `optimus-halal/tsconfig.json`, add to `compilerOptions.paths`:

```json
"@backend/*": ["../backend/src/*"]
```

And add to `include`:

```json
"../backend/src/**/*.ts"
```

**Step 2: Replace `any` with `AppRouter` in client.ts**

At the top of `optimus-halal/src/services/api/client.ts`, add:

```typescript
import type { AppRouter } from "@backend/trpc/router";
```

Replace line 181:
```typescript
// BEFORE:
const client = createTRPCClient<any>({
// AFTER:
const client = createTRPCClient<AppRouter>({
```

Replace line 293:
```typescript
// BEFORE:
export const apiClient: any = createApiClient();
// AFTER:
export const apiClient = createApiClient();
```

Remove both `eslint-disable` comments above those lines.

**Step 3: Verify TypeScript compiles**

Run: `cd optimus-halal && npx tsc --noEmit`
Expected: 0 errors. Full autocomplete on `apiClient.auth.login.mutate(...)`, etc.

**Step 4: Commit**

```bash
git add optimus-halal/tsconfig.json optimus-halal/src/services/api/client.ts
git commit -m "feat: import AppRouter type, remove any casts — E2E type safety"
```

---

## Task 2: Create tRPC React Query integration

**Files:**
- Create: `optimus-halal/src/lib/trpc.ts` (tRPC React Query client)
- Modify: `optimus-halal/app/_layout.tsx` (add tRPC provider)

**Step 1: Create `optimus-halal/src/lib/trpc.ts`**

```typescript
import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@backend/trpc/router";
import { API_CONFIG } from "@services/api/config";
import { getAccessToken, getDeviceId } from "@services/api/client";

export const trpc = createTRPCReact<AppRouter>();

export function createTRPCClientForProvider() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${API_CONFIG.baseUrl}${API_CONFIG.trpcPath}`,
        transformer: superjson,
        headers: async () => {
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "X-App-Version": "1.0.0",
            "X-Platform": "mobile",
          };

          const token = getAccessToken();
          if (token) {
            headers["Authorization"] = `Bearer ${token}`;
          }

          const deviceId = await getDeviceId();
          headers["X-Device-Id"] = deviceId;

          return headers;
        },
      }),
    ],
  });
}
```

**Step 2: Wrap tRPC provider in `_layout.tsx`**

In `optimus-halal/app/_layout.tsx`, add imports:

```typescript
import { trpc, createTRPCClientForProvider } from "@/lib/trpc";
import { useState } from "react";
```

Inside `RootLayout`, before the return statement, add:

```typescript
const [trpcClient] = useState(() => createTRPCClientForProvider());
```

Wrap the existing `QueryClientProvider` with `trpc.Provider`:

```tsx
// BEFORE:
<QueryClientProvider client={queryClient}>
  ...
</QueryClientProvider>

// AFTER:
<trpc.Provider client={trpcClient} queryClient={queryClient}>
  <QueryClientProvider client={queryClient}>
    ...
  </QueryClientProvider>
</trpc.Provider>
```

**Step 3: Verify TypeScript compiles**

Run: `cd optimus-halal && npx tsc --noEmit`
Expected: 0 errors.

**Step 4: Commit**

```bash
git add optimus-halal/src/lib/trpc.ts optimus-halal/app/_layout.tsx
git commit -m "feat: wire tRPC React Query provider in root layout"
```

---

## Task 3: MMKV storage adapter

**Files:**
- Create: `optimus-halal/src/lib/storage.ts` (MMKV instance + Zustand adapter)
- Modify: `optimus-halal/src/store/index.ts` (replace AsyncStorage adapter)

**Step 1: Create `optimus-halal/src/lib/storage.ts`**

```typescript
import { MMKV } from "react-native-mmkv";
import type { StateStorage } from "zustand/middleware";

export const mmkv = new MMKV({ id: "optimus-halal" });

/**
 * Zustand-compatible storage adapter using MMKV.
 * Synchronous under the hood but returns Promises for the interface.
 */
export const mmkvStorage: StateStorage = {
  getItem(name: string) {
    const value = mmkv.getString(name);
    return value ?? null;
  },
  setItem(name: string, value: string) {
    mmkv.set(name, value);
  },
  removeItem(name: string) {
    mmkv.delete(name);
  },
};
```

**Step 2: Replace AsyncStorage in `store/index.ts`**

In `optimus-halal/src/store/index.ts`:

Remove import:
```typescript
// REMOVE:
import AsyncStorage from "@react-native-async-storage/async-storage";
```

Remove the `zustandStorage` adapter (lines 14-25).

Add import:
```typescript
import { mmkvStorage } from "@/lib/storage";
```

Replace all occurrences of:
```typescript
storage: createJSONStorage(() => zustandStorage),
```
with:
```typescript
storage: createJSONStorage(() => mmkvStorage),
```

There are 7 stores that use `zustandStorage`: useAuthStore, useOnboardingStore, useThemeStore, useScanHistoryStore, useCartStore, useLanguageStore, usePreferencesStore, useFavoritesStore.

**Step 3: Verify TypeScript compiles**

Run: `cd optimus-halal && npx tsc --noEmit`
Expected: 0 errors.

**Step 4: Commit**

```bash
git add optimus-halal/src/lib/storage.ts optimus-halal/src/store/index.ts
git commit -m "feat: migrate Zustand persist from AsyncStorage to MMKV (~30x faster)"
```

---

## Task 4: Global ErrorBoundary component

**Files:**
- Create: `optimus-halal/src/components/ErrorBoundary.tsx`
- Modify: `optimus-halal/app/_layout.tsx` (wrap with ErrorBoundary)

**Step 1: Create `optimus-halal/src/components/ErrorBoundary.tsx`**

```tsx
import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary]", error.message, errorInfo.componentStack);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <View style={styles.container}>
          <Text style={styles.title}>Oups, une erreur est survenue</Text>
          <Text style={styles.message}>
            {__DEV__ ? this.state.error?.message : "Veuillez reessayer."}
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
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  message: { fontSize: 14, color: "#666", marginBottom: 24, textAlign: "center" },
  button: {
    backgroundColor: "#16a34a",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
```

**Step 2: Wrap root layout with ErrorBoundary**

In `optimus-halal/app/_layout.tsx`, add import:

```typescript
import { ErrorBoundary } from "@/components/ErrorBoundary";
```

Wrap the outermost element in `RootLayout` return:

```tsx
// BEFORE:
<trpc.Provider ...>
  <QueryClientProvider ...>
    ...
  </QueryClientProvider>
</trpc.Provider>

// AFTER:
<ErrorBoundary>
  <trpc.Provider ...>
    <QueryClientProvider ...>
      ...
    </QueryClientProvider>
  </trpc.Provider>
</ErrorBoundary>
```

**Step 3: Verify TypeScript compiles**

Run: `cd optimus-halal && npx tsc --noEmit`
Expected: 0 errors.

**Step 4: Commit**

```bash
git add optimus-halal/src/components/ErrorBoundary.tsx optimus-halal/app/_layout.tsx
git commit -m "feat: add global ErrorBoundary with retry in root layout"
```

---

## Task 5: Resolve store name conflicts

**Files:**
- Modify: `optimus-halal/src/store/index.ts` (rename 4 conflicting stores)
- Modify: all files importing from `@store/index` that use conflicting names

**Context:** 4 stores exist in BOTH `store/index.ts` and `store/apiStores.ts` with the same export name:
- `useAuthStore` — local (index.ts) vs API (apiStores.ts)
- `useCartStore` — local vs API
- `useFavoritesStore` — local vs API
- `useAlertsStore` — local vs API

**Step 1: Rename local stores in `store/index.ts`**

```typescript
// BEFORE -> AFTER:
export const useAuthStore -> export const useLocalAuthStore
export const useCartStore -> export const useLocalCartStore
export const useFavoritesStore -> export const useLocalFavoritesStore
export const useAlertsStore -> export const useLocalAlertsStore
```

Also rename the `useAuthStore.setState` reference inside the `onRehydrateStorage` callback:
```typescript
// BEFORE:
useAuthStore.setState({ isLoading: false });
// AFTER:
useLocalAuthStore.setState({ isLoading: false });
```

**Step 2: Find and update all imports**

Search for imports from `@/store` or `@store/index` that use these names. Update each file.

Run searches for: `useAuthStore.*from.*@/store`, `useCartStore.*from.*@/store`, `useFavoritesStore.*from.*@/store`, `useAlertsStore.*from.*@/store` — excluding apiStores imports.

Update every import to use the new name. For example:
```typescript
// BEFORE:
import { useAuthStore } from "@/store";
// AFTER:
import { useLocalAuthStore } from "@/store";
```

**Important:** The `_layout.tsx` currently imports `useAuthStore` from `@/store/apiStores` — that one does NOT change.

**Step 3: Verify TypeScript compiles**

Run: `cd optimus-halal && npx tsc --noEmit`
Expected: 0 errors.

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor: rename conflicting local stores to useLocal* prefix"
```

---

## Task 6: Backend — DB transactions for auth mutations

**Files:**
- Modify: `backend/src/trpc/routers/auth.ts` (wrap register + login in `db.transaction()`)

**Step 1: Wrap register mutation in transaction**

In `backend/src/trpc/routers/auth.ts`, the `register` mutation (lines 35-83) should wrap the insert + refresh token creation in a transaction:

```typescript
.mutation(async ({ ctx, input }) => {
  const passwordHash = await hashPassword(input.password);

  const result = await ctx.db.transaction(async (tx) => {
    let user;
    try {
      [user] = await tx
        .insert(users)
        .values({
          email: input.email.toLowerCase(),
          passwordHash,
          displayName: input.displayName,
          phoneNumber: input.phoneNumber,
        })
        .returning({
          id: users.id,
          email: users.email,
          displayName: users.displayName,
        });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("unique") || msg.includes("duplicate") || msg.includes("23505")) {
        throw conflict("Un compte avec cet email existe deja");
      }
      throw err;
    }

    const accessToken = await signAccessToken(user.id);
    const tokenId = crypto.randomUUID();
    const refreshToken = await signRefreshToken(user.id, tokenId);

    await tx.insert(refreshTokens).values({
      userId: user.id,
      tokenHash: await hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return { user, accessToken, refreshToken };
  });

  // Fire-and-forget welcome email (outside transaction)
  sendWelcomeEmail(result.user.email, result.user.displayName).catch((err) => {
    console.error("[auth:register] Failed to send welcome email:", {
      email: result.user.email,
      error: err instanceof Error ? err.message : String(err),
    });
  });

  return {
    user: { id: result.user.id, email: result.user.email, displayName: result.user.displayName },
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  };
}),
```

**Step 2: Wrap login mutation in transaction**

Same pattern for login (lines 95-147): wrap the token cleanup + insert in a transaction, with `tx` replacing `ctx.db` inside.

**Step 3: Verify backend compiles**

Run: `cd backend && npx tsc --noEmit`
Expected: 0 errors.

**Step 4: Commit**

```bash
git add backend/src/trpc/routers/auth.ts
git commit -m "fix: wrap auth register/login in DB transactions"
```

---

## Task 7: Backend — Deduplicate auth middleware

**Files:**
- Delete: `backend/src/middleware/auth.ts` (unused — auth handled in context.ts)
- Verify: `backend/src/index.ts` does NOT import `middleware/auth.ts`

**Step 1: Verify `middleware/auth.ts` is not imported anywhere**

Run: `grep -rn "middleware/auth" backend/src/`
Expected: Only the file itself, NOT imported in index.ts or anywhere else.

The auth verification lives in `context.ts:14-29` — the middleware file is dead code.

**Step 2: Delete the file**

```bash
rm backend/src/middleware/auth.ts
```

**Step 3: Verify backend compiles**

Run: `cd backend && npx tsc --noEmit`
Expected: 0 errors.

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor: remove dead auth middleware (auth handled in tRPC context)"
```

---

## Task 8: Backend — Atomic rate limiting

**Files:**
- Modify: `backend/src/middleware/rateLimit.ts`

**Context:** Current rate limiter uses separate INCR + EXPIRE Redis commands — race condition between them can cause keys without TTL. Also uses last IP in X-Forwarded-For (should be first = original client IP).

**Step 1: Fix IP extraction — use first IP**

```typescript
// BEFORE:
const ip = forwardedFor?.split(",").pop()?.trim() || "unknown";
// AFTER:
const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";
```

**Step 2: Replace separate INCR + EXPIRE with atomic pipeline**

Replace the try block body with a Redis pipeline that sends INCR and EXPIRE atomically in a single round trip:

```typescript
try {
  const pipe = redis.pipeline();
  pipe.incr(key);
  pipe.expire(key, windowSec, "NX"); // NX = only set TTL if none exists
  const results = await pipe;

  const current = (results?.[0]?.[1] as number) ?? 0;

  c.header("X-RateLimit-Limit", String(max));
  c.header("X-RateLimit-Remaining", String(Math.max(0, max - current)));

  if (current > max) {
    return c.json({ error: "Too many requests" }, 429);
  }
} catch (err) {
  // Fail-open: if Redis is down, allow the request through
  console.error("[rateLimit] Redis error, allowing request:", err instanceof Error ? err.message : err);
}
```

The `pipeline()` sends both commands in a single round trip. The `"NX"` flag on `EXPIRE` means "only set TTL if none exists" — this prevents resetting the window on every request and eliminates the race condition entirely.

**Step 3: Verify backend compiles**

Run: `cd backend && npx tsc --noEmit`
Expected: 0 errors.

**Step 4: Commit**

```bash
git add backend/src/middleware/rateLimit.ts
git commit -m "fix: atomic rate limiting with Redis pipeline, fix IP extraction"
```

---

## Task 9: Auth React Query hooks

**Files:**
- Create: `optimus-halal/src/hooks/useAuth.ts`

**Step 1: Create `optimus-halal/src/hooks/useAuth.ts`**

```typescript
import { trpc } from "@/lib/trpc";
import { setTokens, clearTokens } from "@services/api/client";
import { useQueryClient } from "@tanstack/react-query";

export function useMe() {
  return trpc.auth.me.useQuery(undefined, {
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      await setTokens(data.accessToken, data.refreshToken);
      queryClient.invalidateQueries({ queryKey: [["auth", "me"]] });
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return trpc.auth.register.useMutation({
    onSuccess: async (data) => {
      await setTokens(data.accessToken, data.refreshToken);
      queryClient.invalidateQueries({ queryKey: [["auth", "me"]] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await clearTokens();
      queryClient.clear();
    },
  });
}

export function useRequestPasswordReset() {
  return trpc.auth.requestPasswordReset.useMutation();
}

export function useResetPassword() {
  return trpc.auth.resetPassword.useMutation();
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd optimus-halal && npx tsc --noEmit`
Expected: 0 errors.

**Step 3: Commit**

```bash
git add optimus-halal/src/hooks/useAuth.ts
git commit -m "feat: add tRPC React Query auth hooks"
```

---

## Task 10: Scan and Favorites React Query hooks

**Files:**
- Create: `optimus-halal/src/hooks/useScan.ts`
- Create: `optimus-halal/src/hooks/useFavorites.ts`

**Step 1: Create `optimus-halal/src/hooks/useScan.ts`**

```typescript
import { trpc } from "@/lib/trpc";

export function useScanBarcode() {
  return trpc.scan.scanBarcode.useMutation();
}

export function useScanHistory(options?: { limit?: number }) {
  return trpc.scan.getHistory.useQuery(
    { limit: options?.limit ?? 20 },
    { staleTime: 1000 * 60 * 2 }
  );
}

export function useScanStats() {
  return trpc.scan.getStats.useQuery(undefined, {
    staleTime: 1000 * 60 * 10,
  });
}
```

**Step 2: Create `optimus-halal/src/hooks/useFavorites.ts`**

```typescript
import { trpc } from "@/lib/trpc";
import { useQueryClient } from "@tanstack/react-query";

export function useFavoritesList() {
  return trpc.favorites.list.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return trpc.favorites.toggle.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["favorites"]] });
    },
  });
}
```

**Step 3: Verify TypeScript compiles**

Run: `cd optimus-halal && npx tsc --noEmit`
Expected: 0 errors.

**Step 4: Commit**

```bash
git add optimus-halal/src/hooks/useScan.ts optimus-halal/src/hooks/useFavorites.ts
git commit -m "feat: add tRPC React Query hooks for scan and favorites"
```

---

## Task 11: Full build verification + Gemini review

**Step 1: Verify backend compiles**

Run: `cd backend && npx tsc --noEmit`
Expected: 0 errors.

**Step 2: Verify mobile app compiles**

Run: `cd optimus-halal && npx tsc --noEmit`
Expected: 0 errors.

**Step 3: Verify Expo bundles**

Run: `cd optimus-halal && npx expo export --platform ios --clear 2>&1 | tail -5`
Expected: "Export was successful."

**Step 4: Gemini cross-review**

Run Gemini CLI review on all Sprint 1 files:

```
gemini -p "Review Sprint 1 Data Layer changes:
1. optimus-halal/src/lib/trpc.ts
2. optimus-halal/src/lib/storage.ts
3. optimus-halal/src/components/ErrorBoundary.tsx
4. optimus-halal/src/hooks/useAuth.ts
5. optimus-halal/src/hooks/useScan.ts
6. optimus-halal/src/hooks/useFavorites.ts
7. optimus-halal/app/_layout.tsx
8. optimus-halal/src/store/index.ts
9. backend/src/trpc/routers/auth.ts
10. backend/src/middleware/rateLimit.ts

Score out of 10 and verdict: APPROVE or REQUEST CHANGES." --yolo
```

Expected: Score >= 7/10 and APPROVE.

**Step 5: Final commit (if all passes)**

```bash
git add -A
git commit -m "chore: Sprint 1 (Data Layer) complete"
```
