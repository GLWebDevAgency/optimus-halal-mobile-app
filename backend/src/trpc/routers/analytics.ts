/**
 * Analytics Router — Lifecycle & conversion tracking
 *
 * Tracks free→premium funnel signals server-side (source of truth).
 * Called from mobile when:
 *  - Paywall is shown (any trigger)
 *  - A premium feature is blocked (PremiumGate)
 *
 * Works for both anonymous devices AND registered users.
 * All operations are fire-and-forget (never fail the caller).
 */

import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { router, publicProcedure } from "../trpc.js";
import { users, devices } from "../../db/schema/index.js";
import { logger } from "../../lib/logger.js";

export const analyticsRouter = router({
  /**
   * Called from mobile every time the paywall is shown.
   * Works for guest (deviceId only) and registered users (userId).
   */
  trackPaywallSeen: publicProcedure
    .input(z.object({
      trigger: z.string().max(64).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const now = new Date();

      // Registered user
      if (ctx.userId) {
        ctx.db
          .update(users)
          .set({
            paywallSeenCount: sql`${users.paywallSeenCount} + 1`,
            paywallLastSeenAt: now,
            lastActiveAt: now,
          })
          .where(eq(users.id, ctx.userId))
          .catch((err: unknown) => logger.warn("analytics.trackPaywallSeen user failed", { err }));
      }

      // Device (always, guest or registered)
      if (ctx.deviceId) {
        ctx.db
          .update(devices)
          .set({
            paywallSeenCount: sql`${devices.paywallSeenCount} + 1`,
            paywallLastSeenAt: now,
            lastActiveAt: now,
          })
          .where(eq(devices.deviceId, ctx.deviceId))
          .catch((err: unknown) => logger.warn("analytics.trackPaywallSeen device failed", { err }));
      }

      return { ok: true };
    }),

  /**
   * Called from mobile when PremiumGate blocks access to a feature.
   */
  trackFeatureBlocked: publicProcedure
    .input(z.object({
      feature: z.string().max(64),
    }))
    .mutation(async ({ ctx }) => {
      const now = new Date();

      if (ctx.userId) {
        ctx.db
          .update(users)
          .set({
            featureBlockedCount: sql`${users.featureBlockedCount} + 1`,
            lastActiveAt: now,
          })
          .where(eq(users.id, ctx.userId))
          .catch((err: unknown) => logger.warn("analytics.trackFeatureBlocked user failed", { err }));
      }

      if (ctx.deviceId) {
        ctx.db
          .update(devices)
          .set({
            featureBlockedCount: sql`${devices.featureBlockedCount} + 1`,
            lastActiveAt: now,
          })
          .where(eq(devices.deviceId, ctx.deviceId))
          .catch((err: unknown) => logger.warn("analytics.trackFeatureBlocked device failed", { err }));
      }

      return { ok: true };
    }),

  /**
   * Save Expo push token for a guest device (no auth required).
   * For registered users, notification.registerPushToken handles it.
   */
  registerGuestPushToken: publicProcedure
    .input(z.object({
      token: z.string().max(500),
      platform: z.enum(["ios", "android"]),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.deviceId) return { ok: false };

      // Validate Expo push token format
      if (!input.token.startsWith("ExponentPushToken[")) return { ok: false };

      ctx.db
        .update(devices)
        .set({ pushToken: input.token })
        .where(eq(devices.deviceId, ctx.deviceId))
        .catch((err: unknown) => logger.warn("analytics.registerGuestPushToken failed", { err }));

      return { ok: true };
    }),
});
