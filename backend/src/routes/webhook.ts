import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, refreshTokens, subscriptionEvents } from "../db/schema/index.js";
import { logger } from "../lib/logger.js";
import { env } from "../lib/env.js";
import { invalidateUserTierCache } from "../trpc/context.js";
import { Sentry } from "../lib/sentry.js";

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

// ── Event classification ────────────────────────────────
const GRANT_ACCESS_EVENTS = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "UNCANCELLATION",
  "NON_RENEWING_PURCHASE",
]);
const REVOKE_ACCESS_EVENTS = new Set(["EXPIRATION"]);
const TRACK_ONLY_EVENTS = new Set([
  "CANCELLATION",
  "BILLING_ISSUE",
  "PRODUCT_CHANGE",
]);

export const webhookRoutes = new Hono();

webhookRoutes.post("/revenuecat", async (c) => {
  // ── 1. Auth ──
  const secret = env.REVENUECAT_WEBHOOK_SECRET;
  if (!secret) {
    logger.error("REVENUECAT_WEBHOOK_SECRET non configuré — webhook rejeté");
    return c.json({ error: "Webhook non configuré" }, 503);
  }
  const auth = c.req.header("Authorization");
  if (auth !== `Bearer ${secret}`) {
    return c.json({ error: "Non autorisé" }, 401);
  }

  // ── 2. Parse + validate ──
  const body: RevenueCatPayload = await c.req.json();
  const event = body.event;

  if (!event?.app_user_id || !event?.type) {
    return c.json({ error: "Payload invalide" }, 400);
  }

  // ── 3. Idempotency ──
  if (event.id) {
    const existing = await db.query.subscriptionEvents.findFirst({
      where: eq(subscriptionEvents.webhookEventId, event.id),
    });
    if (existing) return c.json({ status: "already_processed" }, 200);
  }

  const userId = event.app_user_id;
  const eventTime = new Date();

  // ── 4. Log event (always, even for unknown types) ──
  await db.insert(subscriptionEvents).values({
    userId,
    eventType: event.type as typeof subscriptionEvents.$inferInsert.eventType,
    provider: "revenuecat",
    productId: event.product_id ?? null,
    price: event.price ?? null,
    currency: event.currency ?? "EUR",
    environment: event.environment ?? "PRODUCTION",
    rawPayload: body,
    webhookEventId: event.id,
  });

  // ── 5. Process by event type ──
  if (GRANT_ACCESS_EVENTS.has(event.type)) {
    const result = await db
      .update(users)
      .set({
        subscriptionTier: "premium",
        subscriptionExpiresAt: event.expiration_at_ms
          ? new Date(event.expiration_at_ms)
          : null,
        subscriptionProvider: "revenuecat",
        subscriptionProductId: event.product_id,
        subscriptionExternalId: userId.startsWith("$RCAnonymous")
          ? userId
          : undefined,
        lastActiveAt: eventTime,
      })
      .where(eq(users.id, userId))
      .returning({ id: users.id });

    if (result.length === 0) {
      // CRITICAL: User paid but no DB row matched — revenue leak
      logger.error("WEBHOOK CRITICAL: paid-but-not-granted", {
        eventType: event.type,
        appUserId: userId,
        productId: event.product_id,
        isAnonymousId: userId.startsWith("$RCAnonymous"),
      });
      Sentry.captureMessage("RevenueCat webhook: paid-but-not-granted", {
        level: "fatal",
        extra: {
          eventType: event.type,
          appUserId: userId,
          productId: event.product_id,
          webhookEventId: event.id,
        },
      });
      // Return 200 to prevent RevenueCat retries (event is logged for manual reconciliation)
      return c.json({ status: "user_not_found", userId }, 200);
    }

    await invalidateUserTierCache(userId);

  } else if (REVOKE_ACCESS_EVENTS.has(event.type)) {
    // Naqiy 2-tier model: no account without subscription.
    // On expiration we: downgrade tier + revoke ALL refresh tokens.
    // Effect: the client's next token refresh fails → onAuthFailure → clean logout.
    // This is server-authoritative — no client-side force-logout logic needed.
    const result = await db
      .update(users)
      .set({
        subscriptionTier: "free",
        subscriptionExpiresAt: null,
        lastActiveAt: eventTime,
      })
      .where(eq(users.id, userId))
      .returning({ id: users.id });

    if (result.length === 0) {
      logger.warn("Webhook EXPIRATION: user not found", { userId });
    } else {
      // Revoke all refresh tokens — forces re-auth on next access token expiry
      await db
        .delete(refreshTokens)
        .where(eq(refreshTokens.userId, userId));
      await invalidateUserTierCache(userId);
      logger.info("Webhook EXPIRATION: tokens revoked, tier downgraded", { userId });
    }

  } else if (event.type === "BILLING_ISSUE") {
    // Grace period — don't revoke yet, but track for nudge emails
    // Apple/Google give 16-60 days of retry before EXPIRATION fires
    logger.warn("Webhook BILLING_ISSUE: problème de paiement", {
      userId,
      productId: event.product_id,
    });
    Sentry.captureMessage("RevenueCat: billing issue detected", {
      level: "warning",
      extra: { userId, productId: event.product_id },
    });

  } else if (event.type === "PRODUCT_CHANGE") {
    // User changed plan (monthly → annual or vice versa) — update productId
    const result = await db
      .update(users)
      .set({
        subscriptionProductId: event.product_id,
        subscriptionExpiresAt: event.expiration_at_ms
          ? new Date(event.expiration_at_ms)
          : undefined,
        lastActiveAt: eventTime,
      })
      .where(eq(users.id, userId))
      .returning({ id: users.id });

    if (result.length > 0) {
      await invalidateUserTierCache(userId);
    }

  } else if (event.type === "CANCELLATION") {
    // Don't revoke — user has access until expiration_at_ms
    // Just log for churn analytics
    logger.info("Webhook CANCELLATION: abonnement annulé (accès maintenu)", {
      userId,
      productId: event.product_id,
      expiresAt: event.expiration_at_ms
        ? new Date(event.expiration_at_ms).toISOString()
        : null,
    });
  }

  logger.info("Webhook RevenueCat traité", {
    eventType: event.type,
    userId,
    productId: event.product_id,
  });

  return c.json({ status: "ok" }, 200);
});
