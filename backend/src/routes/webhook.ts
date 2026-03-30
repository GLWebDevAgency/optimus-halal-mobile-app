import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, subscriptionEvents } from "../db/schema/index.js";
import { logger } from "../lib/logger.js";
import { env } from "../lib/env.js";
import { invalidateUserTierCache } from "../trpc/context.js";

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
  // Verify authorization — secret must be configured and match
  const secret = env.REVENUECAT_WEBHOOK_SECRET;
  if (!secret) {
    logger.error("REVENUECAT_WEBHOOK_SECRET non configuré — webhook rejeté");
    return c.json({ error: "Webhook non configuré" }, 503);
  }
  const auth = c.req.header("Authorization");
  if (auth !== `Bearer ${secret}`) {
    return c.json({ error: "Non autorisé" }, 401);
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
    eventType: event.type as typeof subscriptionEvents.$inferInsert.eventType,
    provider: "revenuecat",
    productId: event.product_id ?? null,
    price: event.price ?? null,
    currency: event.currency ?? "EUR",
    environment: event.environment ?? "PRODUCTION",
    rawPayload: body,
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

  const eventTime = new Date();

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
        lastActiveAt: eventTime,
      })
      .where(eq(users.id, userId));
    await invalidateUserTierCache(userId);
  } else if (revokeAccess.includes(event.type)) {
    await db
      .update(users)
      .set({
        subscriptionTier: "free",
        subscriptionExpiresAt: null,
        lastActiveAt: eventTime,
      })
      .where(eq(users.id, userId));
    await invalidateUserTierCache(userId);
  }
  // CANCELLATION: do NOT revoke — user has access until expiration_at_ms

  logger.info("Webhook RevenueCat traite", {
    eventType: event.type,
    userId,
    productId: event.product_id,
  });

  return c.json({ status: "ok" }, 200);
});
