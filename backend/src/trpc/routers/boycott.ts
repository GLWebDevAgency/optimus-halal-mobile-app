import { z } from "zod";
import { eq, sql, desc, and } from "drizzle-orm";
import { router, publicProcedure } from "../trpc.js";
import { boycottTargets } from "../../db/schema/index.js";
import { withCache } from "../../lib/cache.js";

export const boycottRouter = router({
  /**
   * Check if a brand is on any boycott list.
   * Used during scan to show ethical alerts.
   */
  checkBrand: publicProcedure
    .input(z.object({ brand: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const brandLower = input.brand.toLowerCase();

      // Search boycott_targets where any brand in the array matches
      const matches = await ctx.db
        .select()
        .from(boycottTargets)
        .where(
          and(
            eq(boycottTargets.isActive, true),
            sql`EXISTS (
              SELECT 1 FROM unnest(${boycottTargets.brands}) AS b
              WHERE lower(b) = ${brandLower}
              OR ${brandLower} LIKE '%' || lower(b) || '%'
              OR lower(b) LIKE '%' || ${brandLower} || '%'
            )`
          )
        );

      if (matches.length === 0) {
        return { isBoycotted: false, targets: [] };
      }

      return {
        isBoycotted: true,
        targets: matches.map((t) => ({
          id: t.id,
          companyName: t.companyName,
          boycottLevel: t.boycottLevel,
          severity: t.severity,
          reason: t.reason,
          reasonSummary: t.reasonSummary,
          sourceUrl: t.sourceUrl,
          sourceName: t.sourceName,
          logoUrl: t.logoUrl,
        })),
      };
    }),

  /**
   * List all boycott targets, optionally filtered by level.
   * Cached 1h — boycott list changes rarely.
   */
  list: publicProcedure
    .input(
      z.object({
        level: z.enum(["official_bds", "grassroots", "pressure", "community"]).optional(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Only cache first page without cursor (most common request)
      const cacheKey = !input.cursor
        ? `boycott:v1:list:${input.level ?? "all"}:${input.limit}`
        : null;

      const fetcher = async () => {
        const conditions = [eq(boycottTargets.isActive, true)];

        if (input.level) {
          conditions.push(eq(boycottTargets.boycottLevel, input.level));
        }

        const items = await ctx.db
          .select()
          .from(boycottTargets)
          .where(and(...conditions))
          .orderBy(desc(boycottTargets.addedAt))
          .limit(input.limit + 1);

        let nextCursor: string | undefined;
        if (items.length > input.limit) {
          const next = items.pop()!;
          nextCursor = next.id;
        }

        return { items, nextCursor };
      };

      if (cacheKey) {
        return withCache(ctx.redis, cacheKey, 3600, fetcher);
      }
      return fetcher();
    }),

  /**
   * Get a single boycott target by ID.
   */
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const target = await ctx.db.query.boycottTargets.findFirst({
        where: eq(boycottTargets.id, input.id),
      });
      return target ?? null;
    }),
});
