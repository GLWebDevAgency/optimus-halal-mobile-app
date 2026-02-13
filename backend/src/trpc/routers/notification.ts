import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc.js";
import {
  notifications,
  pushTokens,
  notificationSettings,
} from "../../db/schema/index.js";
import { notFound } from "../../lib/errors.js";

export const notificationRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        type: z
          .enum(["alert", "promotion", "scan_result", "reward", "community", "system"])
          .optional(),
        unreadOnly: z.boolean().default(false),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(notifications.userId, ctx.userId)];
      if (input.type) conditions.push(eq(notifications.type, input.type));
      if (input.unreadOnly) conditions.push(eq(notifications.isRead, false));

      const items = await ctx.db
        .select()
        .from(notifications)
        .where(and(...conditions))
        .orderBy(desc(notifications.sentAt))
        .limit(input.limit)
        .offset(input.offset);

      return items;
    }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const [result] = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, ctx.userId),
          eq(notifications.isRead, false)
        )
      );
    return { count: result?.count ?? 0 };
  }),

  markAsRead: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(
          and(
            eq(notifications.id, input.id),
            eq(notifications.userId, ctx.userId)
          )
        );
      return { success: true };
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(
          eq(notifications.userId, ctx.userId),
          eq(notifications.isRead, false)
        )
      );
    return { success: true };
  }),

  // ── Push Tokens ─────────────────────────────────────────

  registerPushToken: protectedProcedure
    .input(
      z.object({
        token: z.string(),
        platform: z.enum(["ios", "android"]),
        deviceId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Upsert: deactivate old tokens for same device, insert new
      if (input.deviceId) {
        await ctx.db
          .update(pushTokens)
          .set({ isActive: false })
          .where(
            and(
              eq(pushTokens.userId, ctx.userId),
              eq(pushTokens.deviceId, input.deviceId)
            )
          );
      }

      const [token] = await ctx.db
        .insert(pushTokens)
        .values({
          userId: ctx.userId,
          token: input.token,
          platform: input.platform,
          deviceId: input.deviceId,
        })
        .returning();

      return token;
    }),

  unregisterPushToken: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(pushTokens)
        .set({ isActive: false })
        .where(
          and(
            eq(pushTokens.userId, ctx.userId),
            eq(pushTokens.token, input.token)
          )
        );
      return { success: true };
    }),

  // ── Settings ────────────────────────────────────────────

  getSettings: protectedProcedure.query(async ({ ctx }) => {
    let settings = await ctx.db.query.notificationSettings.findFirst({
      where: eq(notificationSettings.userId, ctx.userId),
    });

    if (!settings) {
      const [created] = await ctx.db
        .insert(notificationSettings)
        .values({ userId: ctx.userId })
        .returning();
      settings = created;
    }

    return settings;
  }),

  updateSettings: protectedProcedure
    .input(
      z.object({
        alertsEnabled: z.boolean().optional(),
        promotionsEnabled: z.boolean().optional(),
        scanResultsEnabled: z.boolean().optional(),
        rewardsEnabled: z.boolean().optional(),
        communityEnabled: z.boolean().optional(),
        quietHoursStart: z.string().max(5).optional(),
        quietHoursEnd: z.string().max(5).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.notificationSettings.findFirst({
        where: eq(notificationSettings.userId, ctx.userId),
      });

      if (existing) {
        const [updated] = await ctx.db
          .update(notificationSettings)
          .set({ ...input, updatedAt: new Date() })
          .where(eq(notificationSettings.userId, ctx.userId))
          .returning();
        return updated;
      }

      const [created] = await ctx.db
        .insert(notificationSettings)
        .values({ ...input, userId: ctx.userId })
        .returning();
      return created;
    }),
});
