import { z } from "zod";
import { eq, and, desc, sql, gt } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";
import {
  alerts,
  alertCategories,
  alertReadStatus,
} from "../../db/schema/index.js";
import { notFound } from "../../lib/errors.js";

export const alertRouter = router({
  list: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        severity: z.enum(["info", "warning", "critical"]).optional(),
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [
        eq(alerts.isActive, true),
        sql`(${alerts.expiresAt} IS NULL OR ${alerts.expiresAt} > NOW())`,
      ];

      if (input.severity) {
        conditions.push(eq(alerts.severity, input.severity));
      }
      if (input.category) {
        conditions.push(eq(alerts.categoryId, input.category));
      }

      const items = await ctx.db
        .select()
        .from(alerts)
        .where(and(...conditions))
        .orderBy(desc(alerts.publishedAt))
        .limit(input.limit + 1);

      let nextCursor: string | undefined;
      if (items.length > input.limit) {
        const next = items.pop()!;
        nextCursor = next.id;
      }

      return { items, nextCursor };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const alert = await ctx.db.query.alerts.findFirst({
        where: eq(alerts.id, input.id),
      });
      if (!alert) throw notFound("Alerte introuvable");
      return alert;
    }),

  getCategories: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.query.alertCategories.findMany();
  }),

  markAsRead: protectedProcedure
    .input(z.object({ alertId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(alertReadStatus)
        .values({
          userId: ctx.userId,
          alertId: input.alertId,
          isRead: true,
          readAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [alertReadStatus.userId, alertReadStatus.alertId],
          set: { isRead: true, readAt: new Date() },
        });

      return { success: true };
    }),

  dismiss: protectedProcedure
    .input(z.object({ alertId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(alertReadStatus)
        .values({
          userId: ctx.userId,
          alertId: input.alertId,
          isDismissed: true,
          isRead: true,
          readAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [alertReadStatus.userId, alertReadStatus.alertId],
          set: { isDismissed: true, isRead: true, readAt: new Date() },
        });

      return { success: true };
    }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const [result] = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(alerts)
      .leftJoin(
        alertReadStatus,
        and(
          eq(alertReadStatus.alertId, alerts.id),
          eq(alertReadStatus.userId, ctx.userId)
        )
      )
      .where(
        and(
          eq(alerts.isActive, true),
          sql`(${alerts.expiresAt} IS NULL OR ${alerts.expiresAt} > NOW())`,
          sql`(${alertReadStatus.isRead} IS NULL OR ${alertReadStatus.isRead} = false)`
        )
      );

    return { count: result?.count ?? 0 };
  }),
});
