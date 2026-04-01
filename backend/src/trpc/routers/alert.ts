import { z } from "zod";
import { eq, and, desc, sql, gt, lt } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "../trpc.js";
import {
  alerts,
  alertCategories,
  alertReadStatus,
} from "../../db/schema/index.js";
import { notFound } from "../../lib/errors.js";

// ── Admin validation schemas ────────────────────────────

const createAlertSchema = z.object({
  title: z.string().min(5).max(255),
  summary: z.string().min(10).max(500),
  content: z.string().min(10),
  severity: z.enum(["info", "warning", "critical"]).default("info"),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  categoryId: z.string().max(50).optional(),
  imageUrl: z.string().url().optional().nullable(),
  sourceUrl: z.string().url().optional().nullable(),
  isActive: z.boolean().default(true),
  expiresAt: z.string().datetime().optional().nullable(),
});

const updateAlertSchema = createAlertSchema.partial().extend({
  id: z.string().uuid(),
});

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

      // Cursor-based pagination: fetch only items older than the cursor
      if (input.cursor) {
        const cursorAlert = await ctx.db.query.alerts.findFirst({
          where: eq(alerts.id, input.cursor),
          columns: { publishedAt: true },
        });
        if (!cursorAlert) return { items: [], nextCursor: undefined };
        conditions.push(lt(alerts.publishedAt, cursorAlert.publishedAt));
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

      // If recall-type alert, join product_recalls data
      let recallData = null;
      if (alert.productRecallId) {
        const { productRecalls } = await import("../../db/schema/product-recalls.js");
        const recall = await ctx.db.query.productRecalls.findFirst({
          where: eq(productRecalls.id, alert.productRecallId),
        });
        if (recall) {
          recallData = {
            id: recall.id,
            gtin: recall.gtin,
            brandName: recall.brandName,
            productName: recall.productName,
            subCategory: recall.subCategory,
            recallReason: recall.recallReason,
            healthRisks: recall.healthRisks,
            consumerActions: recall.consumerActions,
            healthPrecautions: recall.healthPrecautions,
            distributors: recall.distributors,
            geoScope: recall.geoScope,
            imageUrl: recall.imageUrl,
            pdfUrl: recall.pdfUrl,
            sourceUrl: recall.sourceUrl,
            publishedAt: recall.publishedAt,
            recallEndDate: recall.recallEndDate,
            lotIdentification: (recall as Record<string, unknown>).lotIdentification as string | null ?? null,
            saleStartDate: (recall as Record<string, unknown>).saleStartDate as string | null ?? null,
            saleEndDate: (recall as Record<string, unknown>).saleEndDate as string | null ?? null,
            temperatureStorage: (recall as Record<string, unknown>).temperatureStorage as string | null ?? null,
            compensation: (recall as Record<string, unknown>).compensation as string | null ?? null,
            legalNature: (recall as Record<string, unknown>).legalNature as string | null ?? null,
            contactNumber: (recall as Record<string, unknown>).contactNumber as string | null ?? null,
          };
        }
      }

      return { ...alert, recallData };
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
    const rows = await ctx.db
      .select({
        severity: alerts.severity,
        count: sql<number>`count(*)::int`,
      })
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
      )
      .groupBy(alerts.severity);

    let urgent = 0;
    let info = 0;
    for (const row of rows) {
      if (row.severity === "critical" || row.severity === "warning") {
        urgent += row.count;
      } else {
        info += row.count;
      }
    }

    return { count: urgent + info, urgent, info };
  }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    // Get all active, non-expired alerts that the user hasn't read yet
    const unreadAlerts = await ctx.db
      .select({ id: alerts.id })
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

    if (unreadAlerts.length === 0) return { success: true, count: 0 };

    const now = new Date();
    await ctx.db
      .insert(alertReadStatus)
      .values(
        unreadAlerts.map((a) => ({
          userId: ctx.userId,
          alertId: a.id,
          isRead: true,
          readAt: now,
        }))
      )
      .onConflictDoUpdate({
        target: [alertReadStatus.userId, alertReadStatus.alertId],
        set: { isRead: true, readAt: now },
      });

    return { success: true, count: unreadAlerts.length };
  }),

  getReadAlertIds: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        alertId: alertReadStatus.alertId,
        isDismissed: alertReadStatus.isDismissed,
      })
      .from(alertReadStatus)
      .where(
        and(
          eq(alertReadStatus.userId, ctx.userId),
          eq(alertReadStatus.isRead, true)
        )
      );

    const readIds: string[] = [];
    const dismissedIds: string[] = [];
    for (const row of rows) {
      readIds.push(row.alertId);
      if (row.isDismissed) dismissedIds.push(row.alertId);
    }

    return { readIds, dismissedIds };
  }),

  // ── Admin CRUD ──────────────────────────────────────

  /** Admin: list all alerts (active + inactive) with stats */
  adminList: adminProcedure
    .input(
      z.object({
        severity: z.enum(["info", "warning", "critical"]).optional(),
        category: z.string().optional(),
        isActive: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions: ReturnType<typeof eq>[] = [];
      if (input.severity) conditions.push(eq(alerts.severity, input.severity));
      if (input.category) conditions.push(eq(alerts.categoryId, input.category));
      if (input.isActive !== undefined) conditions.push(eq(alerts.isActive, input.isActive));

      const [items, [stats]] = await Promise.all([
        ctx.db
          .select()
          .from(alerts)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(alerts.publishedAt))
          .limit(input.limit)
          .offset(input.offset),
        ctx.db
          .select({
            total: sql<number>`count(*)::int`,
            active: sql<number>`count(*) filter (where ${alerts.isActive} = true)::int`,
            inactive: sql<number>`count(*) filter (where ${alerts.isActive} = false)::int`,
          })
          .from(alerts),
      ]);

      return { items, stats: stats ?? { total: 0, active: 0, inactive: 0 } };
    }),

  /** Admin: create a new alert */
  create: adminProcedure
    .input(createAlertSchema)
    .mutation(async ({ ctx, input }) => {
      const [alert] = await ctx.db
        .insert(alerts)
        .values({
          ...input,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
          publishedAt: new Date(),
        })
        .returning();

      return alert;
    }),

  /** Admin: update an existing alert */
  update: adminProcedure
    .input(updateAlertSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, expiresAt, ...data } = input;

      const [updated] = await ctx.db
        .update(alerts)
        .set({
          ...data,
          ...(expiresAt !== undefined ? { expiresAt: expiresAt ? new Date(expiresAt) : null } : {}),
        })
        .where(eq(alerts.id, id))
        .returning();

      if (!updated) throw notFound("Alerte");
      return updated;
    }),

  /** Admin: toggle active status */
  toggleActive: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.alerts.findFirst({
        where: eq(alerts.id, input.id),
        columns: { isActive: true },
      });
      if (!existing) throw notFound("Alerte");

      const [updated] = await ctx.db
        .update(alerts)
        .set({ isActive: !existing.isActive })
        .where(eq(alerts.id, input.id))
        .returning();

      return updated;
    }),

  /** Admin: delete an alert (hard delete, cascades read status) */
  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .delete(alerts)
        .where(eq(alerts.id, input.id))
        .returning({ id: alerts.id });

      if (!deleted) throw notFound("Alerte");
      return { success: true, id: deleted.id };
    }),
});
