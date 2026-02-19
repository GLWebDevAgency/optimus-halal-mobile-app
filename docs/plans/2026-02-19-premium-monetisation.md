# Premium Monetisation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the complete Optimus+ freemium system — DB, backend, mobile — all behind feature flags.

**Architecture:** Hybrid feature-flagged approach. Backend premium fields + tRPC subscription router + webhook handler + abstract mobile PurchaseProvider. `paymentsEnabled: false` = zero impact. See `docs/plans/2026-02-19-premium-monetisation-design.md`.

**Tech Stack:** Drizzle ORM + PostgreSQL (schema), Hono (webhooks), tRPC (subscription router), React Native (usePremium hook, PremiumGate, PremiumPaywall), MMKV (flag cache), PostHog (analytics).

---

## Task 1: DB Schema — Add subscription columns to users

**Files:**
- Modify: `backend/src/db/schema/users.ts:4-183`
- Modify: `backend/src/db/schema/index.ts` (export new table)

**Step 1: Add subscriptionTierEnum and columns to users table**

In `backend/src/db/schema/users.ts`, add enum before line 21:

```typescript
export const subscriptionTierEnum = pgEnum("subscription_tier", [
  "free",
  "premium",
]);
```

Add columns inside the `users` table (before line 60, after `updatedAt`):

```typescript
    // ── Subscription ──
    subscriptionTier: subscriptionTierEnum("subscription_tier")
      .notNull()
      .default("free"),
    subscriptionExpiresAt: t.timestamp("subscription_expires_at", {
      withTimezone: true,
    }),
    subscriptionProvider: t.varchar("subscription_provider", { length: 20 }),
    // 'revenuecat' | 'stripe' | 'manual'
    subscriptionProductId: t.varchar("subscription_product_id", {
      length: 100,
    }),
    subscriptionExternalId: t.varchar("subscription_external_id", {
      length: 255,
    }),
```

**Step 2: Add to safeUserColumns (line ~123-150)**

Add these to `safeUserColumns` object (they're safe to expose except `subscriptionExternalId`):

```typescript
    subscriptionTier: users.subscriptionTier,
    subscriptionExpiresAt: users.subscriptionExpiresAt,
    subscriptionProvider: users.subscriptionProvider,
    subscriptionProductId: users.subscriptionProductId,
    // NOTE: subscriptionExternalId is NOT included (private)
```

Do the same in `safeUserReturning` (line ~156-183):

```typescript
    subscriptionTier: true,
    subscriptionExpiresAt: true,
    subscriptionProvider: true,
    subscriptionProductId: true,
    // NOTE: subscriptionExternalId excluded
```

**Step 3: Run TypeScript check**

```bash
cd backend && npx tsc --noEmit
```

Expected: PASS

**Step 4: Commit**

```bash
git add backend/src/db/schema/users.ts
git commit -m "feat(db): add subscription tier columns to users table"
```

---

## Task 2: DB Schema — Create subscription_events table

**Files:**
- Create: `backend/src/db/schema/subscriptions.ts`
- Modify: `backend/src/db/schema/index.ts` (add export)

**Step 1: Create subscription_events schema**

Create `backend/src/db/schema/subscriptions.ts`:

```typescript
import { pgTable as table, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./users";

export const subscriptionEventTypeEnum = pgEnum("subscription_event_type", [
  "INITIAL_PURCHASE",
  "RENEWAL",
  "CANCELLATION",
  "EXPIRATION",
  "BILLING_ISSUE",
  "NON_RENEWING_PURCHASE",
  "PRODUCT_CHANGE",
  "UNCANCELLATION",
]);

export const subscriptionEvents = table("subscription_events", (t) => ({
  id: t.uuid().primaryKey().defaultRandom(),
  userId: t
    .uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  eventType: subscriptionEventTypeEnum("event_type").notNull(),
  provider: t.varchar({ length: 20 }).notNull(),
  productId: t.varchar("product_id", { length: 100 }),
  price: t.doublePrecision(),
  currency: t.varchar({ length: 3 }).default("EUR"),
  environment: t.varchar({ length: 20 }).notNull().default("PRODUCTION"),
  rawPayload: t.jsonb("raw_payload"),
  webhookEventId: t.varchar("webhook_event_id", { length: 255 }).unique(),
  createdAt: t.timestamp("created_at", { withTimezone: true }).defaultNow(),
}));
```

**Step 2: Export from schema/index.ts**

Add to `backend/src/db/schema/index.ts`:

```typescript
export * from "./subscriptions";
```

**Step 3: Run TypeScript check**

```bash
cd backend && npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add backend/src/db/schema/subscriptions.ts backend/src/db/schema/index.ts
git commit -m "feat(db): create subscription_events table"
```

---

## Task 3: Generate Drizzle migration 0004

**Step 1: Build schema to dist**

```bash
cd backend && pnpm build
```

**Step 2: Generate migration**

```bash
npx drizzle-kit generate
```

Expected: Creates `backend/drizzle/0004_*.sql` with ALTER TABLE for users + CREATE TABLE for subscription_events.

**Step 3: Review the generated SQL**

Read the generated migration file. Verify it contains:
- `CREATE TYPE subscription_tier` enum
- `CREATE TYPE subscription_event_type` enum
- `ALTER TABLE users ADD COLUMN subscription_tier`
- `ALTER TABLE users ADD COLUMN subscription_expires_at`
- `ALTER TABLE users ADD COLUMN subscription_provider`
- `ALTER TABLE users ADD COLUMN subscription_product_id`
- `ALTER TABLE users ADD COLUMN subscription_external_id`
- `CREATE TABLE subscription_events`
- `CREATE UNIQUE INDEX` on `webhook_event_id`

**Step 4: Commit migration**

```bash
git add backend/drizzle/
git commit -m "feat(db): migration 0004 — subscription tier + events table"
```

---

## Task 4: Backend — premiumProcedure middleware

**Files:**
- Modify: `backend/src/trpc/trpc.ts:76` (add after protectedProcedure)
- Modify: `backend/src/trpc/context.ts:7-37` (add user subscription to context)

**Step 1: Add subscriptionTier to context**

In `backend/src/trpc/context.ts`, add to the Context interface and populate it from user query when token is valid. After verifying the access token, query the user's subscription tier and pass it as `subscriptionTier` in the context.

**Step 2: Add premiumProcedure in trpc.ts**

After line 76 in `backend/src/trpc/trpc.ts`:

```typescript
const isPremium = middleware(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (ctx.subscriptionTier !== "premium") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Cette fonctionnalite necessite Optimus+",
    });
  }
  return next({ ctx });
});

export const premiumProcedure = t.procedure.use(isAuthenticated).use(isPremium);
```

**Step 3: Run TypeScript check**

```bash
cd backend && npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add backend/src/trpc/trpc.ts backend/src/trpc/context.ts
git commit -m "feat(trpc): add premiumProcedure middleware with subscription tier check"
```

---

## Task 5: Backend — subscriptionRouter

**Files:**
- Create: `backend/src/trpc/routers/subscription.ts`
- Modify: `backend/src/trpc/router.ts:17,35` (import + merge)

**Step 1: Create subscription router**

Create `backend/src/trpc/routers/subscription.ts`:

```typescript
import { z } from "zod";
import { eq } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc";
import { users, subscriptionEvents } from "../../db/schema";

export const subscriptionRouter = router({
  /** Get current user's subscription status */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.userId!),
      columns: {
        subscriptionTier: true,
        subscriptionExpiresAt: true,
        subscriptionProvider: true,
        subscriptionProductId: true,
      },
    });
    if (!user) return { tier: "free" as const, expiresAt: null, provider: null, productId: null };

    // Check expiration
    if (
      user.subscriptionTier === "premium" &&
      user.subscriptionExpiresAt &&
      user.subscriptionExpiresAt < new Date()
    ) {
      // Expired — downgrade
      await ctx.db
        .update(users)
        .set({ subscriptionTier: "free", subscriptionExpiresAt: null })
        .where(eq(users.id, ctx.userId!));
      return { tier: "free" as const, expiresAt: null, provider: null, productId: null };
    }

    return {
      tier: user.subscriptionTier,
      expiresAt: user.subscriptionExpiresAt,
      provider: user.subscriptionProvider,
      productId: user.subscriptionProductId,
    };
  }),

  /** Get subscription event history */
  getHistory: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.subscriptionEvents.findMany({
      where: eq(subscriptionEvents.userId, ctx.userId!),
      orderBy: (e, { desc }) => [desc(e.createdAt)],
      limit: 20,
    });
  }),

  /** Verify a purchase receipt from mobile (provider-agnostic) */
  verifyPurchase: protectedProcedure
    .input(
      z.object({
        provider: z.enum(["revenuecat", "stripe"]),
        productId: z.string().trim().max(100),
        receiptData: z.string().max(10000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Validate receipt with provider API
      // For now, log the event and mark premium (will be replaced with real validation)
      await ctx.db
        .update(users)
        .set({
          subscriptionTier: "premium",
          subscriptionProvider: input.provider,
          subscriptionProductId: input.productId,
        })
        .where(eq(users.id, ctx.userId!));

      await ctx.db.insert(subscriptionEvents).values({
        userId: ctx.userId!,
        eventType: "INITIAL_PURCHASE",
        provider: input.provider,
        productId: input.productId,
        environment: "PRODUCTION",
      });

      return { success: true, tier: "premium" as const };
    }),
});
```

**Step 2: Register in router.ts**

In `backend/src/trpc/router.ts`, add import after line 17:

```typescript
import { subscriptionRouter } from "./routers/subscription";
```

Add to appRouter after line 35:

```typescript
  subscription: subscriptionRouter,
```

**Step 3: Run TypeScript check**

```bash
cd backend && npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add backend/src/trpc/routers/subscription.ts backend/src/trpc/router.ts
git commit -m "feat(trpc): add subscriptionRouter — getStatus, getHistory, verifyPurchase"
```

---

## Task 6: Backend — Webhook handler (Hono route)

**Files:**
- Create: `backend/src/routes/webhook.ts`
- Modify: `backend/src/index.ts:88` (mount route)

**Step 1: Create webhook handler**

Create `backend/src/routes/webhook.ts`:

```typescript
import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users, subscriptionEvents } from "../db/schema";

const REVENUECAT_SECRET = process.env.REVENUECAT_WEBHOOK_SECRET ?? "";

interface RevenueCatEvent {
  type: string;
  id: string;
  app_user_id: string;
  product_id?: string;
  entitlement_ids?: string[];
  expiration_at_ms?: number | null;
  price?: number;
  currency?: string;
  environment?: string;
  store?: string;
}

interface RevenueCatPayload {
  api_version: string;
  event: RevenueCatEvent;
}

export const webhookRoutes = new Hono();

webhookRoutes.post("/revenuecat", async (c) => {
  // Verify authorization
  const auth = c.req.header("Authorization");
  if (!REVENUECAT_SECRET || auth !== `Bearer ${REVENUECAT_SECRET}`) {
    return c.json({ error: "Non autorise" }, 401);
  }

  const body: RevenueCatPayload = await c.req.json();
  const event = body.event;

  if (!event?.app_user_id || !event?.type) {
    return c.json({ error: "Payload invalide" }, 400);
  }

  // Idempotency check
  if (event.id) {
    const existing = await db.query.subscriptionEvents.findFirst({
      where: eq(subscriptionEvents.webhookEventId, event.id),
    });
    if (existing) return c.json({ status: "already_processed" }, 200);
  }

  const userId = event.app_user_id;

  // Log the event
  await db.insert(subscriptionEvents).values({
    userId,
    eventType: event.type as any,
    provider: "revenuecat",
    productId: event.product_id ?? null,
    price: event.price ?? null,
    currency: event.currency ?? "EUR",
    environment: event.environment ?? "PRODUCTION",
    rawPayload: body as any,
    webhookEventId: event.id,
  });

  // Process event
  const grantAccess = [
    "INITIAL_PURCHASE",
    "RENEWAL",
    "UNCANCELLATION",
    "NON_RENEWING_PURCHASE",
  ];
  const revokeAccess = ["EXPIRATION"];

  if (grantAccess.includes(event.type)) {
    await db
      .update(users)
      .set({
        subscriptionTier: "premium",
        subscriptionExpiresAt: event.expiration_at_ms
          ? new Date(event.expiration_at_ms)
          : null,
        subscriptionProvider: "revenuecat",
        subscriptionProductId: event.product_id,
      })
      .where(eq(users.id, userId));
  } else if (revokeAccess.includes(event.type)) {
    await db
      .update(users)
      .set({
        subscriptionTier: "free",
        subscriptionExpiresAt: null,
      })
      .where(eq(users.id, userId));
  }
  // CANCELLATION: do NOT revoke — user has access until expiration_at_ms

  return c.json({ status: "ok" }, 200);
});
```

**Step 2: Mount in index.ts**

In `backend/src/index.ts`, after the tRPC handler (line ~88):

```typescript
import { webhookRoutes } from "./routes/webhook";
// ... after tRPC handler mount
app.route("/webhooks", webhookRoutes);
```

**Step 3: Run TypeScript check**

```bash
cd backend && npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add backend/src/routes/webhook.ts backend/src/index.ts
git commit -m "feat(webhooks): RevenueCat webhook handler with idempotency"
```

---

## Task 7: Backend — Integration test for subscription

**Files:**
- Create: `backend/src/__tests__/subscription.test.ts`

**Step 1: Write test**

Create `backend/src/__tests__/subscription.test.ts`:

```typescript
import { describe, it, expect, beforeAll } from "vitest";
import { createTestCaller } from "./helpers";

describe("subscription router", () => {
  let caller: Awaited<ReturnType<typeof createTestCaller>>;

  beforeAll(async () => {
    caller = await createTestCaller();
  });

  it("getStatus returns free tier by default", async () => {
    const status = await caller.subscription.getStatus();
    expect(status.tier).toBe("free");
    expect(status.expiresAt).toBeNull();
  });

  it("verifyPurchase upgrades to premium", async () => {
    const result = await caller.subscription.verifyPurchase({
      provider: "revenuecat",
      productId: "premium_monthly",
      receiptData: "mock-receipt",
    });
    expect(result.success).toBe(true);
    expect(result.tier).toBe("premium");

    // Verify status changed
    const status = await caller.subscription.getStatus();
    expect(status.tier).toBe("premium");
    expect(status.provider).toBe("revenuecat");
  });

  it("getHistory returns subscription events", async () => {
    const history = await caller.subscription.getHistory();
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history[0].eventType).toBe("INITIAL_PURCHASE");
  });
});
```

**Step 2: Run test**

```bash
cd backend && npx vitest run src/__tests__/subscription.test.ts
```

Expected: PASS (3 tests)

**Step 3: Commit**

```bash
git add backend/src/__tests__/subscription.test.ts
git commit -m "test: subscription router — getStatus, verifyPurchase, getHistory"
```

---

## Task 8: Backend — Feature gate favorites (5 max for free)

**Files:**
- Modify: `backend/src/trpc/routers/favorites.ts:49-75`

**Step 1: Add limit check to addFavorite**

In `backend/src/trpc/routers/favorites.ts`, inside the `add` mutation (after `{ ctx, input }` destructure, before the existing duplicate check), add:

```typescript
      // Premium gate: free users limited to 5 favorites
      if (ctx.subscriptionTier !== "premium") {
        const { count } = await ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(favorites)
          .where(eq(favorites.userId, ctx.userId!))
          .then((r) => r[0] ?? { count: 0 });
        if (count >= 5) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Limite de 5 favoris atteinte. Passez a Optimus+ pour des favoris illimites.",
          });
        }
      }
```

Import `sql` from `drizzle-orm` if not already imported.

**Step 2: Run TypeScript check + existing tests**

```bash
cd backend && npx tsc --noEmit && npx vitest run
```

**Step 3: Commit**

```bash
git add backend/src/trpc/routers/favorites.ts
git commit -m "feat(gate): limit free users to 5 favorites — premium gets unlimited"
```

---

## Task 9: Mobile — Granular feature flags

**Files:**
- Modify: `optimus-halal/src/constants/config.ts:30-58`

**Step 1: Add premium feature flags to FeatureFlags interface**

In `optimus-halal/src/constants/config.ts`, add to the `FeatureFlags` interface (before closing `}`):

```typescript
  // Premium gates
  paywallEnabled: boolean;
  favoritesLimitEnabled: boolean;
  scanHistoryLimitEnabled: boolean;
  offlineCacheEnabled: boolean;
  premiumMapEnabled: boolean;
  healthProfileEnabled: boolean;
```

Add defaults in `defaultFeatureFlags` (all `false` — gates inactive until enabled):

```typescript
  paywallEnabled: false,
  favoritesLimitEnabled: false,
  scanHistoryLimitEnabled: false,
  offlineCacheEnabled: false,
  premiumMapEnabled: false,
  healthProfileEnabled: false,
```

**Step 2: Run TypeScript check**

```bash
cd optimus-halal && npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add optimus-halal/src/constants/config.ts
git commit -m "feat(flags): add granular premium feature flags — all disabled by default"
```

---

## Task 10: Mobile — usePremium hook

**Files:**
- Create: `optimus-halal/src/hooks/usePremium.ts`
- Modify: `optimus-halal/src/hooks/index.ts` (export)

**Step 1: Create usePremium hook**

Create `optimus-halal/src/hooks/usePremium.ts`:

```typescript
import { useCallback, useMemo } from "react";
import { useFeatureFlagsStore } from "@/store";
import { trpc } from "@/lib/trpc";

type PremiumTier = "free" | "premium";

interface PremiumState {
  isPremium: boolean;
  isLoading: boolean;
  tier: PremiumTier;
  expiresAt: Date | null;
  provider: string | null;
  showPaywall: () => void;
}

export function usePremium(): PremiumState {
  const paymentsEnabled = useFeatureFlagsStore((s) => s.paymentsEnabled);

  // Flag OFF = free tier, zero API calls
  const statusQuery = trpc.subscription.getStatus.useQuery(undefined, {
    enabled: paymentsEnabled,
    staleTime: 5 * 60 * 1000, // 5min cache
  });

  const showPaywall = useCallback(() => {
    // Will be wired to PremiumPaywall modal in Task 12
    // For now, no-op
  }, []);

  return useMemo(() => {
    if (!paymentsEnabled) {
      return {
        isPremium: false,
        isLoading: false,
        tier: "free",
        expiresAt: null,
        provider: null,
        showPaywall,
      };
    }

    const data = statusQuery.data;
    return {
      isPremium: data?.tier === "premium",
      isLoading: statusQuery.isLoading,
      tier: (data?.tier ?? "free") as PremiumTier,
      expiresAt: data?.expiresAt ? new Date(data.expiresAt) : null,
      provider: data?.provider ?? null,
      showPaywall,
    };
  }, [paymentsEnabled, statusQuery.data, statusQuery.isLoading, showPaywall]);
}
```

**Step 2: Export from hooks/index.ts**

Add after the last export section (after line 114):

```typescript
// ── Premium ───────────────────────────────────
export { usePremium } from "./usePremium";
```

**Step 3: Run TypeScript check**

```bash
cd optimus-halal && npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add optimus-halal/src/hooks/usePremium.ts optimus-halal/src/hooks/index.ts
git commit -m "feat(hooks): usePremium — feature-flagged subscription status hook"
```

---

## Task 11: Mobile — PremiumGate component

**Files:**
- Create: `optimus-halal/src/components/ui/PremiumGate.tsx`

**Step 1: Create PremiumGate**

Create `optimus-halal/src/components/ui/PremiumGate.tsx`:

```typescript
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { usePremium, useTranslation, useTheme, useHaptics } from "@/hooks";
import { useFeatureFlagsStore } from "@/store";

interface PremiumGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Wraps premium-only content.
 * If paymentsEnabled=false OR user is premium: renders children.
 * If paymentsEnabled=true AND user is free: renders fallback or upgrade prompt.
 */
export function PremiumGate({ feature, children, fallback }: PremiumGateProps) {
  const paymentsEnabled = useFeatureFlagsStore((s) => s.paymentsEnabled);
  const { isPremium, showPaywall } = usePremium();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { impact } = useHaptics();

  // Gates inactive when payments disabled
  if (!paymentsEnabled || isPremium) {
    return <>{children}</>;
  }

  if (fallback) return <>{fallback}</>;

  // Default upgrade prompt
  return (
    <View
      style={{
        padding: 20,
        alignItems: "center",
        backgroundColor: isDark ? "rgba(19,236,106,0.05)" : "rgba(19,236,106,0.03)",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: isDark ? "rgba(19,236,106,0.15)" : "rgba(19,236,106,0.1)",
        margin: 16,
      }}
    >
      <MaterialIcons name="workspace-premium" size={32} color="#13ec6a" />
      <Text
        style={{
          color: colors.textPrimary,
          fontSize: 16,
          fontWeight: "700",
          marginTop: 8,
          textAlign: "center",
        }}
      >
        Optimus+
      </Text>
      <Text
        style={{
          color: colors.textSecondary,
          fontSize: 13,
          textAlign: "center",
          marginTop: 4,
        }}
      >
        {t.common.premiumRequired ?? "Cette fonctionnalite necessite Optimus+"}
      </Text>
      <TouchableOpacity
        onPress={() => {
          impact();
          showPaywall();
        }}
        style={{
          marginTop: 12,
          backgroundColor: "#13ec6a",
          paddingHorizontal: 24,
          paddingVertical: 10,
          borderRadius: 12,
        }}
        accessibilityRole="button"
        accessibilityLabel="Upgrade to Optimus+"
      >
        <Text style={{ color: "#0d1b13", fontWeight: "700", fontSize: 14 }}>
          {t.common.upgrade ?? "Passer a Optimus+"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
```

**Step 2: Add i18n keys**

In `fr.ts`, `en.ts`, `ar.ts` — add to `common` section:

```typescript
// FR
premiumRequired: "Cette fonctionnalite necessite Optimus+",
upgrade: "Passer a Optimus+",

// EN
premiumRequired: "This feature requires Optimus+",
upgrade: "Upgrade to Optimus+",

// AR
premiumRequired: "هذه الميزة تتطلب Optimus+",
upgrade: "الترقية إلى Optimus+",
```

**Step 3: Run TypeScript check**

```bash
cd optimus-halal && npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add optimus-halal/src/components/ui/PremiumGate.tsx optimus-halal/src/i18n/translations/
git commit -m "feat(ui): PremiumGate component — wraps premium-only content with upgrade prompt"
```

---

## Task 12: Mobile — PremiumPaywall screen

**Files:**
- Create: `optimus-halal/app/settings/premium.tsx`

**Step 1: Create paywall screen**

Full-screen modal with:
- Hero: Optimus+ branding with gradient
- Feature comparison (free vs premium)
- Price cards: Monthly (4.99) | Annual (29.99, BEST VALUE) | Lifetime (79.99)
- CTA button
- Restore purchases link
- Close (X) button

This is a large UI component. Create `optimus-halal/app/settings/premium.tsx` with:
- Uses `useTheme`, `useTranslation`, `useHaptics`, `usePremium`
- Feature flag check: if `!paymentsEnabled`, show "Bientot disponible" message
- Purchase flow: calls `trpc.subscription.verifyPurchase` (placeholder until RevenueCat SDK)
- PostHog events: `premium_paywall_shown`, `premium_purchase_started`

**Step 2: Wire usePremium.showPaywall**

Update `usePremium.ts` to navigate to the paywall:

```typescript
import { router } from "expo-router";

const showPaywall = useCallback(() => {
  if (paymentsEnabled) {
    router.push("/settings/premium" as any);
  }
}, [paymentsEnabled]);
```

**Step 3: Run TypeScript check**

```bash
cd optimus-halal && npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add optimus-halal/app/settings/premium.tsx optimus-halal/src/hooks/usePremium.ts
git commit -m "feat(ui): PremiumPaywall screen — pricing cards, feature comparison, CTA"
```

---

## Task 13: Final integration — wire everything + analytics

**Files:**
- Modify: `optimus-halal/app/settings/_layout.tsx` (add premium route)
- Modify: `optimus-halal/app/(tabs)/profile.tsx` (add "Optimus+" button in settings)

**Step 1: Add premium screen to settings stack**

Add route in settings layout.

**Step 2: Add "Optimus+" entry in profile/settings**

Show premium badge or "Upgrade" button depending on tier.

**Step 3: Add PostHog analytics events**

Track: `premium_paywall_shown`, `premium_feature_gated`, `premium_purchase_started`.

**Step 4: Run full TypeScript check (both projects)**

```bash
cd backend && npx tsc --noEmit
cd ../optimus-halal && npx tsc --noEmit
```

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: wire premium paywall to settings + analytics events"
```

---

## Task 14: Full commit — Sprint 16-17 Premium Monetisation

**Step 1: Run backend tests**

```bash
cd backend && npx vitest run
```

Expected: All tests pass including new subscription tests.

**Step 2: Verify feature flag safety**

Confirm `paymentsEnabled: false` by default — no user sees premium features until flag is toggled.

**Step 3: Tag the sprint**

```bash
git tag sprint-17-premium-monetisation
```

---

## Execution Dependencies

```
Task 1 (users schema) → Task 2 (events table) → Task 3 (migration)
Task 4 (premiumProcedure) depends on Task 1
Task 5 (subscriptionRouter) depends on Tasks 1, 2, 4
Task 6 (webhook) depends on Tasks 1, 2
Task 7 (tests) depends on Task 5
Task 8 (favorites gate) depends on Task 4
Task 9 (feature flags) → standalone
Task 10 (usePremium hook) depends on Task 5, 9
Task 11 (PremiumGate) depends on Task 10
Task 12 (PaywallScreen) depends on Tasks 10, 11
Task 13 (wire up) depends on Task 12
Task 14 (final) depends on all
```

**Parallel tracks:**
- Backend: Tasks 1→2→3→4→5→6→7→8
- Mobile: Tasks 9→10→11→12→13
- Mobile depends on backend Task 5 (for tRPC types)

---

*Plan validated 2026-02-19 — 14 tasks, TDD, feature-flagged, zero compromis*
