import { z } from "zod";
import { eq, sql, ilike, desc, asc, gte, lte, and, inArray } from "drizzle-orm";
import { router, adminProcedure } from "../trpc.js";
import { waitlistLeads } from "../../db/schema/index.js";
import { logger } from "../../lib/logger.js";

export const adminWaitlistRouter = router({
  /** List waitlist leads with pagination, search, source filter */
  list: adminProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
        search: z.string().trim().optional(),
        source: z.string().optional(),
        sortBy: z.enum(["createdAt", "email", "source"]).default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, search, source, sortBy, sortOrder } = input;
      const offset = (page - 1) * limit;

      const conditions = [];
      if (search) {
        conditions.push(ilike(waitlistLeads.email, `%${search}%`));
      }
      if (source) {
        conditions.push(eq(waitlistLeads.source, source));
      }

      const where =
        conditions.length > 0
          ? conditions.length === 1
            ? conditions[0]
            : and(...conditions)
          : undefined;

      const sortColumn =
        sortBy === "email"
          ? waitlistLeads.email
          : sortBy === "source"
            ? waitlistLeads.source
            : waitlistLeads.createdAt;
      const orderFn = sortOrder === "asc" ? asc : desc;

      const [countResult] = await ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(waitlistLeads)
        .where(where);

      const items = await ctx.db
        .select()
        .from(waitlistLeads)
        .where(where)
        .orderBy(orderFn(sortColumn))
        .limit(limit)
        .offset(offset);

      return {
        items,
        total: countResult?.count ?? 0,
        page,
        totalPages: Math.ceil((countResult?.count ?? 0) / limit),
      };
    }),

  /** Waitlist stats: total, by source, by day (30d), UTM breakdown */
  stats: adminProcedure.query(async ({ ctx }) => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalResult, bySource, daily, topUtmCampaigns] = await Promise.all([
      ctx.db.select({ count: sql<number>`count(*)::int` }).from(waitlistLeads),
      ctx.db
        .select({
          source: waitlistLeads.source,
          count: sql<number>`count(*)::int`,
        })
        .from(waitlistLeads)
        .groupBy(waitlistLeads.source)
        .orderBy(sql`count(*) desc`),
      ctx.db
        .select({
          date: sql<string>`to_char(${waitlistLeads.createdAt}::date, 'YYYY-MM-DD')`,
          count: sql<number>`count(*)::int`,
        })
        .from(waitlistLeads)
        .where(gte(waitlistLeads.createdAt, thirtyDaysAgo))
        .groupBy(sql`${waitlistLeads.createdAt}::date`)
        .orderBy(sql`${waitlistLeads.createdAt}::date`),
      ctx.db
        .select({
          campaign: waitlistLeads.utmCampaign,
          count: sql<number>`count(*)::int`,
        })
        .from(waitlistLeads)
        .where(sql`${waitlistLeads.utmCampaign} IS NOT NULL`)
        .groupBy(waitlistLeads.utmCampaign)
        .orderBy(sql`count(*) desc`)
        .limit(10),
    ]);

    return {
      total: totalResult[0]?.count ?? 0,
      bySource,
      daily,
      topUtmCampaigns,
    };
  }),

  /** Delete a single waitlist lead */
  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .delete(waitlistLeads)
        .where(eq(waitlistLeads.id, input.id))
        .returning({ email: waitlistLeads.email });

      if (!deleted) {
        return { success: false, message: "Lead introuvable" };
      }

      logger.info("Admin: waitlist lead deleted", { email: deleted.email, by: ctx.userId });
      return { success: true, message: `${deleted.email} supprimé` };
    }),

  /** Bulk delete waitlist leads */
  deleteBulk: adminProcedure
    .input(z.object({ ids: z.array(z.string().uuid()).min(1).max(500) }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .delete(waitlistLeads)
        .where(inArray(waitlistLeads.id, input.ids))
        .returning({ id: waitlistLeads.id });

      logger.info("Admin: waitlist bulk delete", { count: result.length, by: ctx.userId });
      return { success: true, deletedCount: result.length };
    }),

  /** Export all waitlist leads as JSON (client converts to CSV) */
  export: adminProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        email: waitlistLeads.email,
        source: waitlistLeads.source,
        locale: waitlistLeads.locale,
        utmSource: waitlistLeads.utmSource,
        utmMedium: waitlistLeads.utmMedium,
        utmCampaign: waitlistLeads.utmCampaign,
        createdAt: waitlistLeads.createdAt,
      })
      .from(waitlistLeads)
      .orderBy(desc(waitlistLeads.createdAt));

    return rows;
  }),
});
