import { eq } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc.js";
import { users, subscriptionEvents } from "../../db/schema/index.js";

export const subscriptionRouter = router({
  /** Get current user's subscription status */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.userId),
      columns: {
        subscriptionTier: true,
        subscriptionExpiresAt: true,
        subscriptionProvider: true,
        subscriptionProductId: true,
      },
    });
    if (!user)
      return {
        tier: "free" as const,
        expiresAt: null,
        provider: null,
        productId: null,
      };

    // Check expiration — auto-downgrade if premium has lapsed
    if (
      user.subscriptionTier === "premium" &&
      user.subscriptionExpiresAt &&
      user.subscriptionExpiresAt < new Date()
    ) {
      await ctx.db
        .update(users)
        .set({ subscriptionTier: "free", subscriptionExpiresAt: null })
        .where(eq(users.id, ctx.userId));
      return {
        tier: "free" as const,
        expiresAt: null,
        provider: null,
        productId: null,
      };
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
      where: eq(subscriptionEvents.userId, ctx.userId),
      orderBy: (e, { desc }) => [desc(e.createdAt)],
      limit: 20,
    });
  }),

  // NOTE: Receipt verification is handled exclusively via RevenueCat webhooks
  // (see routes/webhook.ts). No client-side receipt endpoint is exposed
  // to prevent self-grant premium attacks (CVSS 8.1).
});
