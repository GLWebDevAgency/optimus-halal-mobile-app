# Sprint 8: Testing & Observability — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add critical-path backend tests (15 procedures), Sentry crash reporting (backend + mobile), PostHog analytics (mobile), and wire tests into CI.

**Architecture:** Vitest + real PostgreSQL test database via `createCallerFactory` (tRPC v11). No mocks — tests run against actual Drizzle schema with a dedicated `optimus_test` database. Mobile: `@sentry/react-native` + `posthog-react-native`. CI: GitHub Actions Postgres service container.

**Tech Stack:** Vitest, @sentry/node, @sentry/react-native, posthog-react-native

---

## Task 1: Backend Test Infrastructure

**Files:**
- Create: `backend/vitest.config.ts`
- Create: `backend/src/__tests__/setup.ts`
- Create: `backend/src/__tests__/helpers/test-context.ts`
- Modify: `backend/package.json` (add scripts + devDeps)
- Modify: `backend/tsconfig.json` (include test files)
- Modify: `backend/src/lib/env.ts` (test mode bypass)

**Step 1: Install test dependencies**

```bash
cd backend && pnpm add -D vitest @vitest/coverage-v8
```

**Step 2: Create `backend/vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/__tests__/setup.ts"],
    include: ["src/__tests__/**/*.test.ts"],
    testTimeout: 15_000,
    hookTimeout: 30_000,
    pool: "forks",
    alias: {
      "@/*": path.resolve(__dirname, "./src/*"),
    },
  },
});
```

**Step 3: Create env bypass for tests in `backend/src/lib/env.ts`**

Replace the `loadEnv` function to allow test mode:

```ts
function loadEnv(): Env {
  // In test mode, use test defaults
  if (process.env.VITEST) {
    const testEnv = {
      DATABASE_URL: process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5433/optimus_test",
      REDIS_URL: process.env.REDIS_URL ?? "redis://localhost:6379",
      JWT_SECRET: "test-secret-at-least-32-chars-long-for-vitest",
      JWT_REFRESH_SECRET: "test-refresh-secret-at-least-32-chars-long",
      JWT_ACCESS_EXPIRY: "15m",
      JWT_REFRESH_EXPIRY: "7d",
      PORT: 0,
      NODE_ENV: "test",
      CORS_ORIGINS: "*",
      ...process.env,
    };
    return envSchema.parse(testEnv);
  }

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error(JSON.stringify({
      level: "error",
      time: new Date().toISOString(),
      msg: "Variables d'environnement invalides",
      errors: result.error.flatten().fieldErrors,
    }));
    process.exit(1);
  }
  return result.data;
}
```

**Step 4: Create `backend/src/__tests__/setup.ts`**

```ts
import { sql } from "drizzle-orm";
import { db } from "../db/index.js";
import * as schema from "../db/schema/index.js";

// Clean all tables before each test file
beforeEach(async () => {
  // Disable FK checks, truncate all tables, re-enable
  await db.execute(sql`
    DO $$ DECLARE r RECORD;
    BEGIN
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
      END LOOP;
    END $$;
  `);
});

afterAll(async () => {
  // Close DB connection pool
  await db.$client.end({ timeout: 5 });
});
```

**Step 5: Create `backend/src/__tests__/helpers/test-context.ts`**

```ts
import { createCallerFactory } from "@trpc/server";
import { appRouter } from "../../trpc/router.js";
import { db } from "../../db/index.js";
import { redis } from "../../lib/redis.js";
import type { Context } from "../../trpc/context.js";

const createCaller = createCallerFactory(appRouter);

export function createTestCaller(overrides: Partial<Context> = {}) {
  return createCaller({
    db,
    redis,
    userId: null,
    requestId: "test-request-id",
    ...overrides,
  });
}

export function createAuthenticatedCaller(userId: string) {
  return createTestCaller({ userId });
}

export { db, redis };
```

**Step 6: Add test scripts to `backend/package.json`**

Add to `scripts`:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

**Step 7: Verify setup compiles**

Run: `cd backend && pnpm typecheck`
Expected: 0 errors

**Step 8: Commit**

```bash
git add backend/vitest.config.ts backend/src/__tests__/ backend/package.json backend/tsconfig.json backend/src/lib/env.ts backend/pnpm-lock.yaml
git commit -m "test: set up Vitest infrastructure with test DB + tRPC caller"
```

---

## Task 2: Auth Router Tests

**Files:**
- Create: `backend/src/__tests__/auth.test.ts`
- Create: `backend/src/__tests__/helpers/seed.ts`

**Step 1: Create seed helper `backend/src/__tests__/helpers/seed.ts`**

```ts
import { db } from "../../db/index.js";
import { users } from "../../db/schema/index.js";
import { hashPassword } from "../../services/auth.service.js";

export const TEST_USER = {
  email: "test@optimus.fr",
  password: "Password123!",
  displayName: "Test User",
};

export async function seedTestUser() {
  const passwordHash = await hashPassword(TEST_USER.password);
  const [user] = await db
    .insert(users)
    .values({
      email: TEST_USER.email,
      passwordHash,
      displayName: TEST_USER.displayName,
    })
    .returning();
  return user;
}
```

**Step 2: Create `backend/src/__tests__/auth.test.ts`**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { createTestCaller, createAuthenticatedCaller } from "./helpers/test-context.js";
import { seedTestUser, TEST_USER } from "./helpers/seed.js";

describe("auth router", () => {
  describe("register", () => {
    it("creates a new user and returns tokens", async () => {
      const caller = createTestCaller();
      const result = await caller.auth.register({
        email: "new@optimus.fr",
        password: "SecurePass123!",
        displayName: "New User",
      });

      expect(result.user.email).toBe("new@optimus.fr");
      expect(result.user.displayName).toBe("New User");
      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
    });

    it("rejects duplicate email", async () => {
      await seedTestUser();
      const caller = createTestCaller();

      await expect(
        caller.auth.register({
          email: TEST_USER.email,
          password: "AnotherPass123!",
          displayName: "Duplicate",
        })
      ).rejects.toThrow(TRPCError);
    });

    it("rejects weak password (< 8 chars)", async () => {
      const caller = createTestCaller();

      await expect(
        caller.auth.register({
          email: "weak@optimus.fr",
          password: "short",
          displayName: "Weak",
        })
      ).rejects.toThrow();
    });
  });

  describe("login", () => {
    beforeEach(async () => {
      await seedTestUser();
    });

    it("returns tokens on valid credentials", async () => {
      const caller = createTestCaller();
      const result = await caller.auth.login({
        email: TEST_USER.email,
        password: TEST_USER.password,
      });

      expect(result.user.email).toBe(TEST_USER.email);
      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
    });

    it("rejects wrong password", async () => {
      const caller = createTestCaller();

      await expect(
        caller.auth.login({
          email: TEST_USER.email,
          password: "WrongPassword123!",
        })
      ).rejects.toThrow(TRPCError);
    });

    it("rejects non-existent email", async () => {
      const caller = createTestCaller();

      await expect(
        caller.auth.login({
          email: "nobody@optimus.fr",
          password: "whatever",
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("refresh", () => {
    it("issues new token pair and invalidates old refresh token", async () => {
      const caller = createTestCaller();
      const { refreshToken } = await caller.auth.register({
        email: "refresh@optimus.fr",
        password: "SecurePass123!",
        displayName: "Refresh Test",
      });

      const result = await caller.auth.refresh({ refreshToken });
      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
      expect(result.refreshToken).not.toBe(refreshToken);

      // Old token should be rejected (rotation)
      await expect(
        caller.auth.refresh({ refreshToken })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("me", () => {
    it("returns user profile for authenticated user", async () => {
      const user = await seedTestUser();
      const caller = createAuthenticatedCaller(user.id);

      const result = await caller.auth.me();
      expect(result.email).toBe(TEST_USER.email);
      expect(result.displayName).toBe(TEST_USER.displayName);
      // Must not expose password hash
      expect((result as any).passwordHash).toBeUndefined();
    });

    it("rejects unauthenticated request", async () => {
      const caller = createTestCaller();

      await expect(caller.auth.me()).rejects.toThrow(TRPCError);
    });
  });
});
```

**Step 3: Run tests to verify**

Run: `cd backend && pnpm test -- src/__tests__/auth.test.ts`
Expected: All 8 tests PASS

**Step 4: Commit**

```bash
git add backend/src/__tests__/auth.test.ts backend/src/__tests__/helpers/seed.ts
git commit -m "test: auth router — register, login, refresh, me (8 tests)"
```

---

## Task 3: Article + Stats Router Tests

**Files:**
- Create: `backend/src/__tests__/article.test.ts`
- Create: `backend/src/__tests__/stats.test.ts`
- Modify: `backend/src/__tests__/helpers/seed.ts` (add article + stats seeds)

**Step 1: Add seed helpers for articles and stats data**

Append to `backend/src/__tests__/helpers/seed.ts`:

```ts
import { articles, products, scans } from "../../db/schema/index.js";

export async function seedArticles(count = 5) {
  const items = Array.from({ length: count }, (_, i) => ({
    title: `Article ${i + 1}`,
    slug: `article-${i + 1}`,
    excerpt: `Excerpt for article ${i + 1}`,
    content: `Full content of article ${i + 1}`,
    type: "blog" as const,
    isPublished: true,
    publishedAt: new Date(Date.now() - i * 86_400_000), // Each 1 day apart
  }));

  return db.insert(articles).values(items).returning();
}

export async function seedProductAndScan(userId: string) {
  const [product] = await db
    .insert(products)
    .values({
      barcode: "3760020507350",
      name: "Test Product",
      brand: "Test Brand",
      halalStatus: "halal",
      confidenceScore: 95,
      ingredients: ["water", "sugar"],
    })
    .returning();

  const [scan] = await db
    .insert(scans)
    .values({
      userId,
      productId: product.id,
      barcode: product.barcode,
      halalStatus: "halal",
      confidenceScore: 95,
    })
    .returning();

  return { product, scan };
}
```

**Step 2: Create `backend/src/__tests__/article.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { TRPCError } from "@trpc/server";
import { createTestCaller } from "./helpers/test-context.js";
import { seedArticles } from "./helpers/seed.js";

describe("article router", () => {
  describe("list", () => {
    it("returns published articles ordered by date", async () => {
      await seedArticles(5);
      const caller = createTestCaller();

      const result = await caller.article.list({ limit: 10 });
      expect(result.items).toHaveLength(5);
      // Most recent first
      expect(result.items[0].title).toBe("Article 1");
    });

    it("paginates with cursor", async () => {
      const articles = await seedArticles(5);
      const caller = createTestCaller();

      const page1 = await caller.article.list({ limit: 2 });
      expect(page1.items).toHaveLength(2);
      expect(page1.nextCursor).toBeTruthy();

      const page2 = await caller.article.list({ limit: 2, cursor: page1.nextCursor! });
      expect(page2.items).toHaveLength(2);
      expect(page2.items[0].id).not.toBe(page1.items[0].id);
    });

    it("returns empty for invalid cursor", async () => {
      await seedArticles(3);
      const caller = createTestCaller();

      const result = await caller.article.list({
        limit: 10,
        cursor: "00000000-0000-0000-0000-000000000000",
      });
      expect(result.items).toHaveLength(0);
      expect(result.nextCursor).toBeUndefined();
    });
  });

  describe("getBySlug", () => {
    it("returns article by slug", async () => {
      await seedArticles(1);
      const caller = createTestCaller();

      const article = await caller.article.getBySlug({ slug: "article-1" });
      expect(article.title).toBe("Article 1");
    });

    it("throws NOT_FOUND for missing slug", async () => {
      const caller = createTestCaller();

      await expect(
        caller.article.getBySlug({ slug: "nonexistent" })
      ).rejects.toThrow(TRPCError);
    });
  });
});
```

**Step 3: Create `backend/src/__tests__/stats.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { createAuthenticatedCaller } from "./helpers/test-context.js";
import { seedTestUser, seedProductAndScan } from "./helpers/seed.js";

describe("stats router", () => {
  describe("userDashboard", () => {
    it("returns scan count and recent scans", async () => {
      const user = await seedTestUser();
      await seedProductAndScan(user.id);
      const caller = createAuthenticatedCaller(user.id);

      const dashboard = await caller.stats.userDashboard();
      expect(dashboard.totalScans).toBe(1);
      expect(dashboard.recentScans).toHaveLength(1);
    });

    it("returns zeroes for fresh user", async () => {
      const user = await seedTestUser();
      const caller = createAuthenticatedCaller(user.id);

      const dashboard = await caller.stats.userDashboard();
      expect(dashboard.totalScans).toBe(0);
      expect(dashboard.recentScans).toHaveLength(0);
    });
  });
});
```

**Step 4: Run all tests**

Run: `cd backend && pnpm test`
Expected: auth (8) + article (5) + stats (2) = 15 tests PASS

**Step 5: Commit**

```bash
git add backend/src/__tests__/article.test.ts backend/src/__tests__/stats.test.ts backend/src/__tests__/helpers/seed.ts
git commit -m "test: article + stats routers — pagination, cursor, dashboard (7 tests)"
```

---

## Task 4: Profile + Favorites Router Tests

**Files:**
- Create: `backend/src/__tests__/profile.test.ts`
- Create: `backend/src/__tests__/favorites.test.ts`
- Modify: `backend/src/__tests__/helpers/seed.ts` (add product seed)

**Step 1: Create `backend/src/__tests__/profile.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { TRPCError } from "@trpc/server";
import { createAuthenticatedCaller, createTestCaller } from "./helpers/test-context.js";
import { seedTestUser } from "./helpers/seed.js";

describe("profile router", () => {
  describe("getProfile", () => {
    it("returns profile without password hash", async () => {
      const user = await seedTestUser();
      const caller = createAuthenticatedCaller(user.id);

      const profile = await caller.profile.getProfile();
      expect(profile.email).toBe("test@optimus.fr");
      expect((profile as any).passwordHash).toBeUndefined();
    });

    it("rejects unauthenticated request", async () => {
      const caller = createTestCaller();
      await expect(caller.profile.getProfile()).rejects.toThrow(TRPCError);
    });
  });

  describe("updateProfile", () => {
    it("updates display name and returns updated profile", async () => {
      const user = await seedTestUser();
      const caller = createAuthenticatedCaller(user.id);

      const updated = await caller.profile.updateProfile({
        displayName: "New Name",
      });
      expect(updated.displayName).toBe("New Name");
    });

    it("updates halal strictness preference", async () => {
      const user = await seedTestUser();
      const caller = createAuthenticatedCaller(user.id);

      const updated = await caller.profile.updateProfile({
        halalStrictness: "strict",
      });
      expect(updated.halalStrictness).toBe("strict");
    });
  });
});
```

**Step 2: Create `backend/src/__tests__/favorites.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { TRPCError } from "@trpc/server";
import { createAuthenticatedCaller } from "./helpers/test-context.js";
import { seedTestUser, seedProductAndScan } from "./helpers/seed.js";

describe("favorites router", () => {
  describe("add + list + remove", () => {
    it("full CRUD lifecycle", async () => {
      const user = await seedTestUser();
      const { product } = await seedProductAndScan(user.id);
      const caller = createAuthenticatedCaller(user.id);

      // Add
      const fav = await caller.favorites.add({ productId: product.id });
      expect(fav.productId).toBe(product.id);

      // List
      const list = await caller.favorites.list({});
      expect(list).toHaveLength(1);
      expect(list[0].product?.name).toBe("Test Product");

      // Remove
      const removed = await caller.favorites.remove({ productId: product.id });
      expect(removed.success).toBe(true);

      // Verify empty
      const emptyList = await caller.favorites.list({});
      expect(emptyList).toHaveLength(0);
    });

    it("rejects duplicate favorite", async () => {
      const user = await seedTestUser();
      const { product } = await seedProductAndScan(user.id);
      const caller = createAuthenticatedCaller(user.id);

      await caller.favorites.add({ productId: product.id });

      await expect(
        caller.favorites.add({ productId: product.id })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("folders", () => {
    it("creates folder and moves favorite into it", async () => {
      const user = await seedTestUser();
      const { product } = await seedProductAndScan(user.id);
      const caller = createAuthenticatedCaller(user.id);

      const folder = await caller.favorites.createFolder({
        name: "Halal certifié",
        color: "#10b981",
      });
      expect(folder.name).toBe("Halal certifié");

      const fav = await caller.favorites.add({ productId: product.id });
      const moved = await caller.favorites.moveToFolder({
        favoriteId: fav.id,
        folderId: folder.id,
      });
      expect(moved.folderId).toBe(folder.id);
    });
  });
});
```

**Step 3: Run full test suite**

Run: `cd backend && pnpm test`
Expected: 15+ tests across auth, article, stats, profile, favorites — all PASS

**Step 4: Commit**

```bash
git add backend/src/__tests__/profile.test.ts backend/src/__tests__/favorites.test.ts backend/src/__tests__/helpers/seed.ts
git commit -m "test: profile + favorites routers — CRUD lifecycle, folders (6 tests)"
```

---

## Task 5: Sentry Backend Integration

**Files:**
- Modify: `backend/package.json` (add @sentry/node)
- Create: `backend/src/lib/sentry.ts`
- Modify: `backend/src/index.ts` (init Sentry + error capture)
- Modify: `backend/src/lib/env.ts` (add SENTRY_DSN)

**Step 1: Install Sentry**

```bash
cd backend && pnpm add @sentry/node
```

**Step 2: Add SENTRY_DSN to env schema**

In `backend/src/lib/env.ts`, add to the schema:
```ts
SENTRY_DSN: z.string().url().optional(),
SENTRY_ENVIRONMENT: z.string().default("development"),
```

**Step 3: Create `backend/src/lib/sentry.ts`**

```ts
import * as Sentry from "@sentry/node";
import { env } from "./env.js";

export function initSentry() {
  if (!env.SENTRY_DSN) return;

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT,
    tracesSampleRate: env.NODE_ENV === "production" ? 0.2 : 1.0,
    beforeSend(event) {
      // Strip sensitive data
      if (event.request?.headers) {
        delete event.request.headers["authorization"];
      }
      return event;
    },
  });
}

export { Sentry };
```

**Step 4: Wire Sentry into `backend/src/index.ts`**

Add at the TOP of the file (before Hono init):
```ts
import { initSentry, Sentry } from "./lib/sentry.js";
initSentry();
```

Modify the `onError` handler:
```ts
app.onError((err, c) => {
  Sentry.captureException(err, {
    extra: { path: c.req.path, method: c.req.method },
  });
  logger.error("Erreur interne du serveur", {
    error: err.message,
    path: c.req.path,
    method: c.req.method,
  });
  return c.json({ error: "Erreur interne du serveur" }, 500);
});
```

**Step 5: Verify typecheck**

Run: `cd backend && pnpm typecheck`
Expected: 0 errors

**Step 6: Commit**

```bash
git add backend/src/lib/sentry.ts backend/src/index.ts backend/src/lib/env.ts backend/package.json backend/pnpm-lock.yaml
git commit -m "feat: integrate Sentry crash reporting on backend"
```

---

## Task 6: Sentry Mobile Integration

**Files:**
- Modify: `optimus-halal/package.json` (add @sentry/react-native)
- Create: `optimus-halal/src/lib/sentry.ts`
- Modify: `optimus-halal/app/_layout.tsx` (init Sentry)
- Modify: `optimus-halal/src/constants/config.ts` (add SENTRY_DSN)

**Step 1: Install Sentry**

```bash
cd optimus-halal && npx expo install @sentry/react-native
```

Note: `expo install` ensures version compatibility with Expo SDK 54.

**Step 2: Add DSN to config**

In `optimus-halal/src/constants/config.ts`, add:
```ts
export const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? "";
```

**Step 3: Create `optimus-halal/src/lib/sentry.ts`**

```ts
import * as Sentry from "@sentry/react-native";
import { SENTRY_DSN } from "../constants/config";

export function initSentry() {
  if (!SENTRY_DSN) return;

  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    enableAutoSessionTracking: true,
    attachScreenshot: true,
    enableNativeFramesTracking: true,
  });
}

export { Sentry };
```

**Step 4: Initialize Sentry in root layout**

In `optimus-halal/app/_layout.tsx`, add at the top after imports:
```ts
import { initSentry } from "../src/lib/sentry";
initSentry();
```

**Step 5: Verify typecheck**

Run: `cd optimus-halal && npx tsc --noEmit`
Expected: 0 errors

**Step 6: Commit**

```bash
git add optimus-halal/src/lib/sentry.ts optimus-halal/app/_layout.tsx optimus-halal/src/constants/config.ts optimus-halal/package.json optimus-halal/package-lock.json
git commit -m "feat: integrate Sentry crash reporting on mobile"
```

---

## Task 7: PostHog Analytics (Mobile)

**Files:**
- Modify: `optimus-halal/package.json` (add posthog-react-native)
- Create: `optimus-halal/src/lib/analytics.ts`
- Modify: `optimus-halal/app/_layout.tsx` (init PostHog provider)
- Modify: `optimus-halal/src/constants/config.ts` (add POSTHOG_API_KEY)

**Step 1: Install PostHog**

```bash
cd optimus-halal && npx expo install posthog-react-native expo-file-system expo-application expo-device
```

Note: Some deps may already be installed — `expo install` handles deduplication.

**Step 2: Add config**

In `optimus-halal/src/constants/config.ts`, add:
```ts
export const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? "";
export const POSTHOG_HOST = "https://eu.i.posthog.com"; // EU instance for GDPR
```

**Step 3: Create `optimus-halal/src/lib/analytics.ts`**

```ts
import PostHog from "posthog-react-native";
import { POSTHOG_API_KEY, POSTHOG_HOST } from "../constants/config";

let posthog: PostHog | null = null;

export function initAnalytics() {
  if (!POSTHOG_API_KEY || __DEV__) return;

  posthog = new PostHog(POSTHOG_API_KEY, {
    host: POSTHOG_HOST,
    enableSessionReplay: false,
  });
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  posthog?.capture(event, properties);
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  posthog?.identify(userId, traits);
}

export function resetUser() {
  posthog?.reset();
}

export { posthog };
```

**Step 4: Initialize analytics in root layout**

In `optimus-halal/app/_layout.tsx`, add after Sentry init:
```ts
import { initAnalytics } from "../src/lib/analytics";
initAnalytics();
```

**Step 5: Add tracking to key user actions**

In `optimus-halal/src/hooks/useScan.ts`, add to `scanBarcode` mutation's `onSuccess`:
```ts
import { trackEvent } from "../lib/analytics";
// Inside onSuccess: trackEvent("scan_barcode", { barcode: variables.barcode });
```

In `optimus-halal/src/hooks/useFavorites.ts`, add to `addFavorite` mutation's `onSuccess`:
```ts
import { trackEvent } from "../lib/analytics";
// Inside onSuccess: trackEvent("add_favorite", { productId: variables.productId });
```

**Step 6: Verify typecheck**

Run: `cd optimus-halal && npx tsc --noEmit`
Expected: 0 errors

**Step 7: Commit**

```bash
git add optimus-halal/src/lib/analytics.ts optimus-halal/app/_layout.tsx optimus-halal/src/constants/config.ts optimus-halal/src/hooks/useScan.ts optimus-halal/src/hooks/useFavorites.ts optimus-halal/package.json optimus-halal/package-lock.json
git commit -m "feat: integrate PostHog analytics on mobile (scan + favorites events)"
```

---

## Task 8: CI Pipeline — Add Test Jobs

**Files:**
- Modify: `.github/workflows/backend-ci.yml` (add test job with Postgres service)
- Modify: `.github/workflows/mobile-ci.yml` (add test job placeholder)

**Step 1: Update `backend-ci.yml` — add test job with Postgres**

Add a `test` job between `check` and `build`:

```yaml
  # ── Test ──────────────────────────────────────
  test:
    name: Test
    runs-on: ubuntu-latest
    needs: check

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: optimus_test
        ports:
          - 5433:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
          cache-dependency-path: backend/pnpm-lock.yaml

      - run: pnpm install --frozen-lockfile

      - name: Push DB schema
        env:
          DATABASE_URL: postgres://postgres:postgres@localhost:5433/optimus_test
        run: pnpm run db:push

      - name: Run tests
        env:
          DATABASE_URL: postgres://postgres:postgres@localhost:5433/optimus_test
          REDIS_URL: redis://localhost:6379
        run: pnpm test
```

Update the `build` job to depend on `test` instead of `check`:
```yaml
  build:
    needs: test  # was: check
```

**Step 2: Verify YAML syntax**

Run: `cd /Users/limameghassene/development/optimus-halal-mobile-app && python3 -c "import yaml; yaml.safe_load(open('.github/workflows/backend-ci.yml'))"`
Expected: No errors

**Step 3: Commit**

```bash
git add .github/workflows/backend-ci.yml .github/workflows/mobile-ci.yml
git commit -m "ci: add Postgres + Redis test job to backend CI pipeline"
```

---

## Task 9: Local Test DB Setup + README

**Files:**
- Modify: `backend/.env.example` (add test DB URL)
- Create: `backend/scripts/setup-test-db.sh`

**Step 1: Add test DB URL to `.env.example`**

Append:
```
# Test database (local development)
# DATABASE_URL_TEST=postgres://postgres:postgres@localhost:5433/optimus_test
```

**Step 2: Create `backend/scripts/setup-test-db.sh`**

```bash
#!/bin/bash
# Starts a test Postgres + pushes schema. Run once before `pnpm test`.
set -euo pipefail

CONTAINER_NAME="optimus-test-db"
DB_PORT=5433

if docker ps -q -f name=$CONTAINER_NAME | grep -q .; then
  echo "Test DB already running on port $DB_PORT"
else
  echo "Starting test Postgres on port $DB_PORT..."
  docker run -d --name $CONTAINER_NAME \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_DB=optimus_test \
    -p $DB_PORT:5432 \
    postgres:16-alpine

  echo "Waiting for Postgres to be ready..."
  until docker exec $CONTAINER_NAME pg_isready -U postgres > /dev/null 2>&1; do
    sleep 1
  done
fi

echo "Pushing schema..."
DATABASE_URL="postgres://postgres:postgres@localhost:$DB_PORT/optimus_test" pnpm run db:push

echo "Test DB ready at localhost:$DB_PORT/optimus_test"
```

**Step 3: Make executable and commit**

```bash
chmod +x backend/scripts/setup-test-db.sh
git add backend/.env.example backend/scripts/setup-test-db.sh
git commit -m "chore: add local test DB setup script"
```

---

## Verification Checklist

After all tasks:

- [ ] `cd backend && pnpm test` — 15+ tests pass (auth 8, article 5, stats 2, profile 4, favorites 3)
- [ ] `cd backend && pnpm typecheck` — 0 errors
- [ ] `cd optimus-halal && npx tsc --noEmit` — 0 errors
- [ ] Sentry imports compile (no runtime test without DSN)
- [ ] PostHog imports compile (no runtime test without API key)
- [ ] CI YAML is valid
- [ ] All commits are clean and atomic
