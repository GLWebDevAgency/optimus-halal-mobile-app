import { z } from "zod";
import { eq, desc, sql, and, gt } from "drizzle-orm";
import { router, protectedProcedure, publicProcedure } from "../trpc.js";
import {
  pointTransactions,
  rewards,
  userRewards,
  achievements,
  userAchievements,
  users,
} from "../../db/schema/index.js";
import { notFound, badRequest } from "../../lib/errors.js";

export const loyaltyRouter = router({
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    const [result] = await ctx.db
      .select({ total: sql<number>`COALESCE(SUM(${pointTransactions.points}), 0)::int` })
      .from(pointTransactions)
      .where(eq(pointTransactions.userId, ctx.userId));

    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.userId),
      columns: { level: true, experiencePoints: true },
    });

    return {
      points: result?.total ?? 0,
      level: user?.level ?? 1,
      experiencePoints: user?.experiencePoints ?? 0,
    };
  }),

  getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(pointTransactions)
        .where(eq(pointTransactions.userId, ctx.userId))
        .orderBy(desc(pointTransactions.createdAt))
        .limit(input.limit)
        .offset(input.offset);
    }),

  getRewards: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [
        eq(rewards.isActive, true),
        sql`(${rewards.expiresAt} IS NULL OR ${rewards.expiresAt} > NOW())`,
      ];
      if (input.category) {
        conditions.push(eq(rewards.category, input.category));
      }

      return ctx.db
        .select()
        .from(rewards)
        .where(sql`${sql.join(conditions, sql` AND `)}`)
        .orderBy(rewards.pointsCost)
        .limit(input.limit);
    }),

  claimReward: protectedProcedure
    .input(z.object({ rewardId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const reward = await ctx.db.query.rewards.findFirst({
        where: eq(rewards.id, input.rewardId),
      });
      if (!reward || !reward.isActive) throw notFound("Récompense introuvable");

      if (reward.remainingQuantity !== null && reward.remainingQuantity <= 0) {
        throw badRequest("Cette récompense n'est plus disponible");
      }

      // Check user balance
      const [balance] = await ctx.db
        .select({ total: sql<number>`COALESCE(SUM(${pointTransactions.points}), 0)::int` })
        .from(pointTransactions)
        .where(eq(pointTransactions.userId, ctx.userId));

      if ((balance?.total ?? 0) < reward.pointsCost) {
        throw badRequest("Points insuffisants");
      }

      // Atomically decrement quantity (prevents overselling via concurrent requests)
      if (reward.remainingQuantity !== null) {
        const [decremented] = await ctx.db
          .update(rewards)
          .set({ remainingQuantity: sql`${rewards.remainingQuantity} - 1` })
          .where(
            and(
              eq(rewards.id, reward.id),
              gt(rewards.remainingQuantity, 0)
            )
          )
          .returning({ remainingQuantity: rewards.remainingQuantity });

        if (!decremented) {
          throw badRequest("Cette récompense n'est plus disponible");
        }
      }

      // Deduct points
      await ctx.db.insert(pointTransactions).values({
        userId: ctx.userId,
        action: "redemption",
        points: -reward.pointsCost,
        description: `Échange: ${reward.name}`,
        referenceId: reward.id,
        referenceType: "reward",
      });

      // Create user reward with crypto-safe code
      const code = crypto.randomUUID().replace(/-/g, "").substring(0, 10).toUpperCase();
      const [claimed] = await ctx.db
        .insert(userRewards)
        .values({
          userId: ctx.userId,
          rewardId: reward.id,
          redemptionCode: code,
          expiresAt: reward.expiresAt,
        })
        .returning();

      return claimed;
    }),

  getMyRewards: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        userReward: userRewards,
        reward: rewards,
      })
      .from(userRewards)
      .innerJoin(rewards, eq(userRewards.rewardId, rewards.id))
      .where(eq(userRewards.userId, ctx.userId))
      .orderBy(desc(userRewards.claimedAt));
  }),

  // ── Achievements ────────────────────────────────────────

  getAchievements: protectedProcedure.query(async ({ ctx }) => {
    const allAchievements = await ctx.db.query.achievements.findMany({
      orderBy: (a, { asc }) => [asc(a.sortOrder)],
    });

    const unlocked = await ctx.db.query.userAchievements.findMany({
      where: eq(userAchievements.userId, ctx.userId),
    });

    const unlockedSet = new Set(unlocked.map((u) => u.achievementId));

    return allAchievements.map((a) => ({
      ...a,
      unlocked: unlockedSet.has(a.id),
      unlockedAt: unlocked.find((u) => u.achievementId === a.id)?.unlockedAt,
    }));
  }),

  getLeaderboard: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(20) }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select({
          id: users.id,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
          level: users.level,
          experiencePoints: users.experiencePoints,
          totalScans: users.totalScans,
        })
        .from(users)
        .where(eq(users.isActive, true))
        .orderBy(desc(users.experiencePoints))
        .limit(input.limit);
    }),
});
