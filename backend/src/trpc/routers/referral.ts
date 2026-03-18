import { z } from "zod";
import { eq, sql, desc } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc.js";
import { referrals, users } from "../../db/schema/index.js";
import { notFound, badRequest, conflict } from "../../lib/errors.js";
import { logger } from "../../lib/logger.js";
import crypto from "node:crypto";

/** Generate a unique 6-char alphanumeric uppercase code */
function generateReferralCode(): string {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

export const referralRouter = router({
  /** Get current user's referral code + stats */
  getMyReferrals: protectedProcedure.query(async ({ ctx }) => {
    // Ensure user has a referral code
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.userId),
      columns: { referralCode: true },
    });

    let code = user?.referralCode;
    if (!code) {
      // Generate and persist
      code = generateReferralCode();
      await ctx.db
        .update(users)
        .set({ referralCode: code })
        .where(eq(users.id, ctx.userId));
    }

    // Count successful referrals
    const stats = await ctx.db
      .select({
        total: sql<number>`count(*)::int`,
        rewardDaysEarned: sql<number>`COALESCE(sum(${referrals.rewardDays}), 0)::int`,
      })
      .from(referrals)
      .where(eq(referrals.referrerId, ctx.userId))
      .then((r) => r[0] ?? { total: 0, rewardDaysEarned: 0 });

    // Recent referrals
    const recent = await ctx.db
      .select({
        id: referrals.id,
        rewardDays: referrals.rewardDays,
        rewardApplied: referrals.rewardApplied,
        createdAt: referrals.createdAt,
      })
      .from(referrals)
      .where(eq(referrals.referrerId, ctx.userId))
      .orderBy(desc(referrals.createdAt))
      .limit(20);

    return {
      code,
      totalReferrals: stats.total,
      totalRewardDays: stats.rewardDaysEarned,
      recent,
    };
  }),

  /** Apply a referral code during signup */
  applyCode: protectedProcedure
    .input(
      z.object({
        code: z
          .string()
          .min(4)
          .max(8)
          .transform((s) => s.toUpperCase().trim()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Find referrer by code
      const referrer = await ctx.db.query.users.findFirst({
        where: eq(users.referralCode, input.code),
        columns: { id: true },
      });

      if (!referrer) {
        throw notFound("Code de parrainage introuvable");
      }

      // Cannot refer yourself
      if (referrer.id === ctx.userId) {
        throw badRequest("Vous ne pouvez pas utiliser votre propre code");
      }

      // Check if already referred
      const existing = await ctx.db.query.referrals.findFirst({
        where: eq(referrals.refereeId, ctx.userId),
      });

      if (existing) {
        throw conflict("Vous avez deja utilise un code de parrainage");
      }

      // Create referral record
      const [referral] = await ctx.db
        .insert(referrals)
        .values({
          referrerId: referrer.id,
          refereeId: ctx.userId,
          rewardDays: 30,
        })
        .returning();

      // Extend referrer's subscription by 30 days
      // If subscriptionExpiresAt is null or in the past, set to now + 30 days
      // If in the future, extend by 30 days
      await ctx.db
        .update(users)
        .set({
          subscriptionExpiresAt: sql`
            CASE
              WHEN ${users.subscriptionExpiresAt} IS NULL OR ${users.subscriptionExpiresAt} < NOW()
              THEN NOW() + INTERVAL '30 days'
              ELSE ${users.subscriptionExpiresAt} + INTERVAL '30 days'
            END
          `,
          updatedAt: new Date(),
        })
        .where(eq(users.id, referrer.id));

      // Mark reward as applied
      await ctx.db
        .update(referrals)
        .set({ rewardApplied: true })
        .where(eq(referrals.id, referral.id));

      logger.info("Parrainage applique", {
        refereeId: ctx.userId,
        referrerId: referrer.id,
        code: input.code,
        rewardDays: 30,
      });

      return { success: true, referrerRewardDays: 30 };
    }),
});
