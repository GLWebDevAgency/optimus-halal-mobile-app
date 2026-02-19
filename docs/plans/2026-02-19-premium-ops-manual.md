# Optimus+ Premium — Operations Manual

**Date**: 2026-02-19
**Sprint**: 16-17 (Phase 3 — Monetisation)
**Status**: Code COMPLETE, awaiting manual setup

---

## 1. What Was Built (Summary)

### Backend (deployed to Railway)
| Component | Path | Description |
|-----------|------|-------------|
| Users subscription columns | `backend/src/db/schema/users.ts` | 5 new columns: subscriptionTier, subscriptionExpiresAt, subscriptionProvider, subscriptionProductId, subscriptionExternalId |
| subscription_events table | `backend/src/db/schema/subscriptions.ts` | Audit trail for all subscription events (purchases, renewals, cancellations) |
| Migration 0004 | `backend/drizzle/0004_bitter_green_goblin.sql` | SQL migration for all schema changes |
| premiumProcedure | `backend/src/trpc/trpc.ts` | tRPC middleware that blocks non-premium users |
| subscriptionRouter | `backend/src/trpc/routers/subscription.ts` | 3 procedures: getStatus, getHistory, verifyPurchase |
| RevenueCat webhook | `backend/src/routes/webhook.ts` | POST `/webhooks/revenuecat` — idempotent event handler |
| Favorites gate | `backend/src/trpc/routers/favorites.ts` | Free users limited to 5 favorites |
| Integration tests | `backend/src/__tests__/subscription.test.ts` | 4 tests (getStatus, verifyPurchase, getHistory, auto-downgrade) |

### Mobile (EAS build required)
| Component | Path | Description |
|-----------|------|-------------|
| Feature flags | `optimus-halal/src/constants/config.ts` | 6 new premium gates, all `false` by default |
| usePremium hook | `optimus-halal/src/hooks/usePremium.ts` | Feature-flagged subscription status hook |
| PremiumGate | `optimus-halal/src/components/ui/PremiumGate.tsx` | Wraps premium-only content |
| PremiumPaywall | `optimus-halal/app/settings/premium.tsx` | Full paywall screen with plans + features |
| Profile wiring | `optimus-halal/app/(tabs)/profile.tsx` | Optimus+ banner in profile settings |
| i18n (FR/EN/AR) | `optimus-halal/src/i18n/translations/` | 22 premium translation keys per locale |

---

## 2. Actions Manuelles Requises (TOI SEUL)

### 2.1 Railway — Appliquer la migration DB

La migration 0004 doit etre appliquee sur la base de production.

```bash
# Option A: Via Railway CLI
railway run npx drizzle-kit migrate

# Option B: Manuellement — copier le SQL de:
# backend/drizzle/0004_bitter_green_goblin.sql
# et l'executer dans le Railway Postgres console
```

**Contenu de la migration:**
- CREATE TYPE `subscription_tier` ('free', 'premium')
- CREATE TYPE `subscription_event_type` (8 types d'evenements)
- CREATE TABLE `subscription_events` (11 colonnes)
- ALTER TABLE `users` ADD 5 colonnes subscription
- Corrections de FK existantes (review_helpful_votes, scans)

### 2.2 Railway — Variable d'environnement

Ajouter dans Railway > Variables:

| Variable | Valeur | Description |
|----------|--------|-------------|
| `REVENUECAT_WEBHOOK_SECRET` | (a generer) | Token Bearer pour authentifier les webhooks RevenueCat |

**Comment generer le secret:**
```bash
openssl rand -hex 32
```

Copie ce secret — tu en auras besoin pour RevenueCat (section 2.3).

### 2.3 RevenueCat — Creer le compte + configurer

1. **Creer un compte** sur [https://app.revenuecat.com](https://app.revenuecat.com)

2. **Creer un projet** "Optimus Halal"

3. **Configurer les apps:**
   - Android: Package name `com.optimushalal.app` (verifier dans `app.json`)
   - iOS: Bundle ID (quand iOS sera pret)

4. **Configurer les Entitlements:**
   - Creer un entitlement: `premium` (identifier: `premium`)

5. **Configurer les Offerings:**
   - Offering par defaut: `default`
   - 3 packages:
     | Package | Identifier | Store Product ID |
     |---------|-----------|-----------------|
     | Monthly | `$rc_monthly` | `premium_monthly` |
     | Annual | `$rc_annual` | `premium_annual` |
     | Lifetime | `$rc_lifetime` | `premium_lifetime` |

6. **Configurer le Webhook:**
   - URL: `https://your-railway-domain.railway.app/webhooks/revenuecat`
   - Authorization header: `Bearer <le-secret-genere-en-2.2>`
   - Events a envoyer: ALL (INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION, BILLING_ISSUE, NON_RENEWING_PURCHASE, PRODUCT_CHANGE, UNCANCELLATION)

7. **API Keys:**
   - Copier la cle API publique (pour le SDK mobile — usage futur)
   - Copier la cle API secrete (pour la validation server-side — usage futur)

### 2.4 Google Play Console — Configurer les produits

1. **Aller dans** Google Play Console > Optimus Halal > Monetize > Products

2. **Creer les abonnements:**

   | Product ID | Nom | Prix | Duree |
   |-----------|-----|------|-------|
   | `premium_monthly` | Optimus+ Mensuel | 4,99 EUR | 1 mois |
   | `premium_annual` | Optimus+ Annuel | 29,99 EUR | 1 an |

3. **Creer l'achat unique (in-app product):**

   | Product ID | Nom | Prix |
   |-----------|-----|------|
   | `premium_lifetime` | Optimus+ A Vie | 79,99 EUR |

4. **Lier a RevenueCat:**
   - Dans RevenueCat > Project Settings > Google Play
   - Upload le fichier JSON de service account (Google Cloud > APIs & Services > Credentials)
   - Activer "Real-time Developer Notifications" (RTDN) vers RevenueCat

### 2.5 Apple App Store Connect (Quand iOS sera pret)

1. Creer les memes 3 produits dans App Store Connect
2. Lier a RevenueCat > Project Settings > Apple
3. Upload la Shared Secret (App Store Connect > Manage Shared Secret)
4. Configurer les Server Notifications V2 vers RevenueCat

### 2.6 PostHog — Verifier les evenements

Les evenements suivants sont traces automatiquement:

| Evenement | Quand | Donnees |
|-----------|-------|---------|
| `premium_paywall_shown` | Ouverture du paywall | `{ trigger: "settings" }` |
| `premium_purchase_started` | Tap sur S'abonner | `{ product_id: "monthly\|annual\|lifetime" }` |
| `premium_paywall_closed` | Tap sur X (fermer) | `{ selected_plan: "monthly\|annual\|lifetime" }` |

**Action:** Dans PostHog dashboard, creer un funnel:
1. `premium_paywall_shown` → 2. `premium_purchase_started` → 3. (future) `premium_purchase_success`

### 2.7 Sentry — Rien a faire

Sentry est deja configure (backend + mobile). Les erreurs du subscription router et du webhook seront automatiquement captees.

---

## 3. Feature Flags — Comment activer le premium

### Etat actuel: TOUT DESACTIVE

```typescript
// optimus-halal/src/constants/config.ts
paymentsEnabled: false,      // Master switch — ZERO impact
paywallEnabled: false,       // Paywall UI
favoritesLimitEnabled: false, // 5 favorites limit
// ... etc
```

### Phase A — Test en sandbox (apres dev client rebuild)

1. Modifier `config.ts`:
   ```typescript
   paymentsEnabled: true,
   paywallEnabled: true,
   ```
2. Builder un dev client avec `eas build --profile development`
3. Tester les achats en sandbox RevenueCat

### Phase B — Production

1. Configurer les produits dans Play Store / App Store (section 2.4/2.5)
2. Activer les flags:
   ```typescript
   paymentsEnabled: true,
   paywallEnabled: true,
   favoritesLimitEnabled: true,
   ```
3. Builder une nouvelle version EAS + soumettre

### Futur — Remote config

Les flags pourront etre controles a distance via une API (pas encore implemente). Priorite: Remote > Cache MMKV > Defaults locaux.

---

## 4. Architecture du Webhook (POST /webhooks/revenuecat)

```
RevenueCat Server
    |
    | POST /webhooks/revenuecat
    | Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>
    |
    v
Hono Webhook Handler (backend/src/routes/webhook.ts)
    |
    |-- 1. Verify Bearer token
    |-- 2. Parse event payload
    |-- 3. Check idempotency (webhook_event_id UNIQUE)
    |-- 4. Log event to subscription_events table
    |-- 5. Update user subscription tier:
    |       INITIAL_PURCHASE, RENEWAL, UNCANCELLATION → set premium
    |       EXPIRATION → revoke to free
    |       CANCELLATION → do nothing (access until expiry)
    |-- 6. Return 200 OK
```

**Idempotency**: Si RevenueCat renvoie le meme event (retry), le handler detecte le `webhook_event_id` duplique et retourne `200 already_processed`.

**Securite**: Le Bearer token est verifie AVANT tout traitement. Si invalide → 401.

---

## 5. Subscription Router (tRPC)

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `subscription.getStatus` | Query | Protected | Retourne tier/expiresAt/provider/productId. Auto-downgrade si expire. |
| `subscription.getHistory` | Query | Protected | 20 derniers evenements de subscription |
| `subscription.verifyPurchase` | Mutation | Protected | Valide un receipt et upgrade en premium. TODO: validation provider reelle. |

**Note**: `verifyPurchase` fait actuellement un upgrade direct (sans validation provider). La validation RevenueCat/Stripe sera ajoutee quand le SDK sera integre.

---

## 6. Pricing Reference

| Plan | Prix | Product ID | Equivalent annuel |
|------|------|-----------|-------------------|
| Mensuel | 4,99 EUR/mois | `premium_monthly` | 59,88 EUR |
| Annuel | 29,99 EUR/an | `premium_annual` | 29,99 EUR (-50%) |
| A vie | 79,99 EUR | `premium_lifetime` | - |

---

## 7. Checklist de lancement

- [ ] Migration 0004 appliquee sur Railway Postgres
- [ ] `REVENUECAT_WEBHOOK_SECRET` ajoute dans Railway env vars
- [ ] Compte RevenueCat cree + projet configure
- [ ] Entitlement `premium` cree dans RevenueCat
- [ ] 3 offerings configurees dans RevenueCat
- [ ] Webhook URL configuree dans RevenueCat dashboard
- [ ] Produits crees dans Google Play Console (3 products)
- [ ] Service account JSON uploade dans RevenueCat pour RTDN
- [ ] PostHog funnel cree (paywall_shown → purchase_started)
- [ ] Feature flags actives en dev (`paymentsEnabled: true`)
- [ ] Dev client rebuild avec RevenueCat SDK (futur)
- [ ] Tests sandbox OK
- [ ] Feature flags actives en prod
- [ ] EAS build + soumission store

---

## 8. Variables d'environnement — Reference complete

### Backend (Railway)

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `DATABASE_URL` | Oui | PostgreSQL connection string |
| `REDIS_URL` | Oui | Redis connection string |
| `JWT_SECRET` | Oui | Min 32 chars |
| `JWT_REFRESH_SECRET` | Oui | Min 32 chars |
| `PORT` | Non (3000) | Port du serveur |
| `NODE_ENV` | Non (development) | development/production/test |
| `CORS_ORIGINS` | Non (optimushalal.com) | Origines CORS autorisees |
| `SENTRY_DSN` | Non | Sentry backend DSN |
| `SENTRY_ENVIRONMENT` | Non (development) | Environment Sentry |
| `BREVO_API_KEY` | Non | Envoi d'emails (Brevo/Sendinblue) |
| `R2_ACCOUNT_ID` | Non | Cloudflare R2 storage |
| `R2_ACCESS_KEY_ID` | Non | R2 access key |
| `R2_SECRET_ACCESS_KEY` | Non | R2 secret key |
| `EXPO_ACCESS_TOKEN` | Non | Push notifications Expo |
| **`REVENUECAT_WEBHOOK_SECRET`** | **NOUVEAU** | Bearer token pour webhooks RevenueCat |

### Mobile (EAS / expo env)

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_SENTRY_DSN` | Sentry mobile DSN |
| `EXPO_PUBLIC_POSTHOG_API_KEY` | PostHog API key |
| `EXPO_PUBLIC_API_URL` | URL du backend (Railway) |

---

*Document genere le 2026-02-19 — Sprint 16-17 Premium Monetisation*
