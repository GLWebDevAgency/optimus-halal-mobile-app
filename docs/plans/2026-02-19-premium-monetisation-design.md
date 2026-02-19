# Premium Monetisation — Design Document

**Date**: 2026-02-19
**Sprint**: Phase 3 / Sprint 16-17
**Status**: APPROVED

---

## 1. Objective

Transform Optimus Halal from a free utility into a sustainable freemium business.
Everything behind feature flags. Zero user impact until explicitly enabled.

---

## 2. Architecture Decision: Hybrid Feature-Flagged

**Chosen approach**: Backend-complete + abstract mobile provider + feature flags everywhere.

**Why**:
- RevenueCat has open crash issue (#1436) with Expo 54 — we build the architecture without depending on it
- Abstract `PurchaseProvider` interface lets us swap RevenueCat / Stripe / manual without touching business logic
- Feature flag `paymentsEnabled: false` = zero SDK calls, zero crashes, zero impact on free users
- Everything merges to `main` safely — toggle flag when ready

---

## 3. Database Schema (Migration 0004)

### 3.1 Users table additions

```sql
ALTER TABLE users ADD COLUMN subscription_tier VARCHAR(20) NOT NULL DEFAULT 'free';
-- Enum: 'free' | 'premium'

ALTER TABLE users ADD COLUMN subscription_expires_at TIMESTAMP WITH TIME ZONE;
-- NULL = no active subscription (or lifetime = far future)

ALTER TABLE users ADD COLUMN subscription_provider VARCHAR(20);
-- 'revenuecat' | 'stripe' | 'manual' | NULL

ALTER TABLE users ADD COLUMN subscription_product_id VARCHAR(100);
-- e.g. 'premium_monthly', 'premium_annual', 'premium_lifetime'

ALTER TABLE users ADD COLUMN subscription_external_id VARCHAR(255);
-- RevenueCat subscriber ID or Stripe subscription ID
```

### 3.2 Subscription events table (audit + idempotency)

```sql
CREATE TABLE subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  -- INITIAL_PURCHASE | RENEWAL | CANCELLATION | EXPIRATION | BILLING_ISSUE | PRODUCT_CHANGE
  provider VARCHAR(20) NOT NULL,
  product_id VARCHAR(100),
  price NUMERIC(10,2),
  currency VARCHAR(3) DEFAULT 'EUR',
  environment VARCHAR(20) NOT NULL DEFAULT 'PRODUCTION',
  -- SANDBOX | PRODUCTION
  raw_payload JSONB,
  webhook_event_id VARCHAR(255) UNIQUE, -- idempotency key
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sub_events_user ON subscription_events(user_id);
CREATE INDEX idx_sub_events_webhook ON subscription_events(webhook_event_id);
```

---

## 4. Feature Tiers

### Free (forever)

| Feature | Limit |
|---------|-------|
| Barcode scan + halal status | Unlimited |
| Basic map (stores nearby) | Yes |
| Favoris | 5 max |
| Scan history | 30 derniers |
| Boycott alerts | Yes |
| Basic trust score | Yes |
| Leaderboard + achievements | Basic |
| Community reports | Yes |

### Premium "Optimus+" (4.99 EUR/month or 29.99 EUR/year or 79.99 EUR lifetime)

| Feature | Detail |
|---------|--------|
| Unlimited favoris | No cap |
| Full scan history | All-time |
| Madhab-personalized alerts | Per-madhab filtering |
| Advanced health profile | Pregnancy, children, allergen deep scan |
| Offline scan cache | Last 100 scans available offline |
| Premium map | Reviews, photos, hours, Ramadan specials |
| "Conscious Consumer" badge | Profile + leaderboard flair |
| Priority support | Flagged in report queue |
| Ad-free | When ads are added later |

---

## 5. Backend Architecture

### 5.1 tRPC Router: `subscriptionRouter`

```typescript
subscriptionRouter = router({
  // Public: check own status
  getStatus: protectedProcedure → { tier, expiresAt, provider, productId }

  // Premium offerings (cached 1h)
  getOfferings: protectedProcedure → { monthly, annual, lifetime } prices

  // Mobile receipt validation
  verifyPurchase: protectedProcedure
    .input({ receiptData, provider, productId })
    → validates with RevenueCat/Stripe API → updates user tier

  // Restore purchases (mobile)
  restorePurchases: protectedProcedure → re-checks entitlements

  // Admin: manual grant (for support/testing)
  adminGrantPremium: adminProcedure
    .input({ userId, tier, durationDays })
    → sets subscription fields
})
```

### 5.2 Hono Webhook Routes (non-tRPC)

```
POST /webhooks/revenuecat
  - Verify Authorization header (bearer token)
  - Parse event, check idempotency (webhook_event_id)
  - Switch on event.type:
    INITIAL_PURCHASE / RENEWAL / NON_RENEWING_PURCHASE → set premium
    EXPIRATION → revoke premium
    CANCELLATION → log (access continues until expiration)
    BILLING_ISSUE → flag user, send notification
  - Return 200 immediately

POST /webhooks/stripe (future)
  - Same pattern with Stripe signature verification
```

### 5.3 Premium Middleware

```typescript
// New procedure that extends protectedProcedure
export const premiumProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.subscriptionTier !== 'premium') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Cette fonctionnalite necessite Optimus+',
    });
  }
  return next();
});
```

### 5.4 Feature-gated procedures

```typescript
// Example: unlimited favorites (premium) vs 5 max (free)
addFavorite: protectedProcedure.mutation(async ({ ctx, input }) => {
  if (ctx.user.subscriptionTier !== 'premium') {
    const count = await countFavorites(ctx.user.id);
    if (count >= 5) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Limite de 5 favoris atteinte. Passez a Optimus+ pour des favoris illimites.',
      });
    }
  }
  // ... add favorite
});
```

---

## 6. Mobile Architecture

### 6.1 Abstract Purchase Provider

```typescript
// src/services/purchases.ts
interface PurchaseProvider {
  init(): Promise<void>;
  getOfferings(): Promise<Offering[]>;
  purchase(productId: string): Promise<PurchaseResult>;
  restorePurchases(): Promise<CustomerInfo>;
  getCustomerInfo(): Promise<CustomerInfo>;
  identify(userId: string): Promise<void>;
  logout(): Promise<void>;
}

// Implementations:
// - RevenueCatProvider (real IAP)
// - MockProvider (dev/testing — always returns mock data)
// - NoopProvider (paymentsEnabled=false — returns free tier)
```

### 6.2 usePremium Hook

```typescript
// src/hooks/usePremium.ts
export function usePremium() {
  const { paymentsEnabled } = useFeatureFlagsStore();

  // Flag OFF → everyone is free, zero SDK calls
  if (!paymentsEnabled) {
    return {
      isPremium: false,
      isLoading: false,
      tier: 'free' as const,
      offerings: null,
      showPaywall: () => {},
    };
  }

  // Flag ON → real entitlement checks
  // ... RevenueCat/Stripe SDK calls
}
```

### 6.3 PremiumGate Component

```typescript
// src/components/PremiumGate.tsx
// Wraps premium-only content. Shows paywall if free user.
<PremiumGate feature="unlimited_favorites" fallback={<UpgradePrompt />}>
  <UnlimitedFavoritesList />
</PremiumGate>
```

### 6.4 PremiumPaywall Screen

```
Full-screen modal paywall:
  - Hero: app logo + "Optimus+" branding
  - Feature comparison table (free vs premium)
  - Price cards: Monthly | Annual (BEST VALUE badge) | Lifetime
  - CTA button with localized price
  - "Restore purchases" link
  - Terms + Privacy links
  - Close button (X)
```

---

## 7. Feature Flag System (World-Class)

### 7.1 Granular flags

```typescript
interface FeatureFlags {
  // Payment system
  paymentsEnabled: boolean;           // Master switch for all payment logic
  paywallEnabled: boolean;            // Show paywall UI (can disable independently)

  // Feature gates (independent of payments)
  favoritesLimitEnabled: boolean;     // Enforce 5-fav limit for free users
  scanHistoryLimitEnabled: boolean;   // Enforce 30-scan limit for free users
  offlineCacheEnabled: boolean;       // Enable offline scan cache feature
  premiumMapEnabled: boolean;         // Enable premium map features
  healthProfileEnabled: boolean;      // Enable advanced health profile

  // Existing flags
  marketplaceEnabled: boolean;
  gamificationEnabled: boolean;
  socialSharing: boolean;
  analyticsEnabled: boolean;
  pushNotifications: boolean;
  aiScanner: boolean;
  offlineMode: boolean;
}
```

### 7.2 Flag hierarchy

```
paymentsEnabled = false
  → All premium checks return false
  → No SDK initialization
  → No paywall shown
  → Feature gates inactive (everyone gets "premium" features for free)

paymentsEnabled = true
  → SDK initialized
  → paywallEnabled controls paywall visibility
  → Individual feature gates can be toggled independently
  → favoritesLimitEnabled = false → even free users get unlimited (grace period)
```

### 7.3 Remote flag override (future)

```
Local defaults → MMKV cache → Remote config API (future)
Priority: Remote > Cache > Local
```

---

## 8. Analytics Events (PostHog)

```
premium_paywall_shown    { trigger: string, screen: string }
premium_paywall_closed   { trigger: string, selected_plan: string | null }
premium_purchase_started { product_id: string, price: number }
premium_purchase_success { product_id: string, provider: string }
premium_purchase_failed  { product_id: string, error: string }
premium_restore_started  {}
premium_restore_success  { product_id: string }
premium_feature_gated    { feature: string, action: 'shown' | 'upgraded' }
```

---

## 9. Security

- Webhook signatures verified server-side (RevenueCat bearer token, Stripe HMAC)
- Receipt validation server-side only (never trust client)
- `subscription_events` table = full audit trail
- Idempotency via `webhook_event_id` UNIQUE constraint
- Premium status cached in Redis (TTL 5min) to avoid DB hit on every request
- `safeUserColumns` excludes subscription_external_id from API responses

---

## 10. Testing Strategy

- Unit: subscription tier checks, feature gate logic
- Integration: webhook event processing (Vitest)
- E2E: RevenueCat sandbox purchases (requires dev client)
- Mock provider for all non-payment tests

---

## 11. Rollout Plan

```
Phase A (this sprint): Build everything, flag OFF
  → DB migration, router, middleware, hooks, paywall UI
  → Merge to main, deploy to Railway
  → Zero user impact

Phase B (after dev client rebuild): Enable in sandbox
  → paymentsEnabled: true in dev only
  → Test RevenueCat sandbox purchases
  → Verify webhook flow end-to-end

Phase C (after App Store/Play Store product setup): Production
  → Configure products in App Store Connect + Play Console
  → Set up RevenueCat dashboard (entitlements, offerings)
  → Enable paymentsEnabled: true via remote config
  → Monitor conversion funnel
```

---

*Validated 2026-02-19 — Mode ultra expert, zero compromis*
