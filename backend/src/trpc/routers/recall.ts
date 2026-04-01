/**
 * Recall Router — Product safety recall queries + admin moderation.
 *
 * Public: checkRecall (scan-time barcode lookup), list approved recalls
 * Admin:  listAll (with status filter), approve, reject, bulkApprove
 */

import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { router, publicProcedure, adminProcedure } from "../trpc.js";
import { productRecalls } from "../../db/schema/product-recalls.js";
import { admins } from "../../db/schema/admins.js";

export const recallRouter = router({
  /**
   * Scan-time recall check — called during barcode scan.
   * Returns active, approved recall for a given GTIN (if any).
   * Performance: indexed on gtin, ~0.3ms lookup.
   */
  checkRecall: publicProcedure
    .input(z.object({ barcode: z.string().min(8).max(14) }))
    .query(async ({ ctx, input }) => {
      // Normalize to 13-digit EAN
      const gtin = input.barcode.padStart(13, "0");

      const recall = await ctx.db
        .select()
        .from(productRecalls)
        .where(
          and(
            eq(productRecalls.gtin, gtin),
            eq(productRecalls.status, "approved"),
            // Only active recalls (no end date or end date in the future)
            sql`(${productRecalls.recallEndDate} IS NULL OR ${productRecalls.recallEndDate} > NOW())`,
          ),
        )
        .orderBy(desc(productRecalls.publishedAt))
        .limit(1);

      return recall[0] ?? null;
    }),

  /**
   * List approved recalls — public feed for the alerts screen.
   * Cursor-based pagination, newest first.
   */
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().uuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [
        eq(productRecalls.status, "approved"),
      ];

      if (input.cursor) {
        const cursorRecall = await ctx.db.query.productRecalls.findFirst({
          where: eq(productRecalls.id, input.cursor),
          columns: { publishedAt: true },
        });
        if (!cursorRecall) return { items: [], nextCursor: undefined };
        conditions.push(
          sql`${productRecalls.publishedAt} < ${cursorRecall.publishedAt}`,
        );
      }

      const items = await ctx.db
        .select()
        .from(productRecalls)
        .where(and(...conditions))
        .orderBy(desc(productRecalls.publishedAt))
        .limit(input.limit + 1);

      let nextCursor: string | undefined;
      if (items.length > input.limit) {
        const next = items.pop()!;
        nextCursor = next.id;
      }

      return { items, nextCursor };
    }),

  // ── Admin Moderation ────────────────────────────────────────

  /**
   * Admin: list all recalls with status filter + stats.
   */
  adminList: adminProcedure
    .input(
      z.object({
        status: z.enum(["pending", "approved", "rejected"]).optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = input.status
        ? [eq(productRecalls.status, input.status)]
        : [];

      const [items, stats] = await Promise.all([
        ctx.db
          .select()
          .from(productRecalls)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(productRecalls.publishedAt))
          .limit(input.limit)
          .offset(input.offset),
        ctx.db
          .select({
            status: productRecalls.status,
            count: sql<number>`count(*)::int`,
          })
          .from(productRecalls)
          .groupBy(productRecalls.status),
      ]);

      const counts = {
        pending: 0,
        approved: 0,
        rejected: 0,
      };
      for (const row of stats) {
        if (row.status in counts) {
          counts[row.status as keyof typeof counts] = row.count;
        }
      }

      return { items, counts, total: counts.pending + counts.approved + counts.rejected };
    }),

  /**
   * Admin: approve a recall (makes it visible to users).
   */
  approve: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const admin = await ctx.db.query.admins.findFirst({
        where: eq(admins.userId, ctx.userId),
        columns: { id: true },
      });

      const [updated] = await ctx.db
        .update(productRecalls)
        .set({
          status: "approved",
          reviewedBy: admin?.id ?? null,
          reviewedAt: new Date(),
        })
        .where(eq(productRecalls.id, input.id))
        .returning({ id: productRecalls.id });

      if (!updated) throw new Error("Rappel introuvable");
      return { success: true, id: updated.id };
    }),

  /**
   * Admin: reject a recall (hides it from users).
   */
  reject: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const admin = await ctx.db.query.admins.findFirst({
        where: eq(admins.userId, ctx.userId),
        columns: { id: true },
      });

      const [updated] = await ctx.db
        .update(productRecalls)
        .set({
          status: "rejected",
          reviewedBy: admin?.id ?? null,
          reviewedAt: new Date(),
        })
        .where(eq(productRecalls.id, input.id))
        .returning({ id: productRecalls.id });

      if (!updated) throw new Error("Rappel introuvable");
      return { success: true, id: updated.id };
    }),

  /**
   * Admin: bulk approve all pending recalls.
   */
  bulkApprove: adminProcedure.mutation(async ({ ctx }) => {
    const admin = await ctx.db.query.admins.findFirst({
      where: eq(admins.userId, ctx.userId),
      columns: { id: true },
    });

    const rows = await ctx.db
      .update(productRecalls)
      .set({
        status: "approved",
        reviewedBy: admin?.id ?? null,
        reviewedAt: new Date(),
      })
      .where(eq(productRecalls.status, "pending"))
      .returning({ id: productRecalls.id });

    return { success: true, count: rows.length };
  }),
});
