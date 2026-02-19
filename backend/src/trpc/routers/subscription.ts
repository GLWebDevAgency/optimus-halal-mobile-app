import { z } from "zod";
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
        .where(eq(users.id, ctx.userId));

      await ctx.db.insert(subscriptionEvents).values({
        userId: ctx.userId,
        eventType: "INITIAL_PURCHASE",
        provider: input.provider,
        productId: input.productId,
        environment: "PRODUCTION",
      });

      return { success: true, tier: "premium" as const };
    }),
});
