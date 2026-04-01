/**
 * Content Source Router — Admin CRUD for monitored veille sources.
 *
 * Used by the admin dashboard to manage RSS feeds, websites, and social
 * accounts that Claude Cowork monitors daily for new content.
 */

import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { router, adminProcedure } from "../trpc.js";
import { contentSources } from "../../db/schema/content-sources.js";

const sourceTypeEnum = z.enum(["rss", "website", "instagram", "tiktok", "youtube"]);
const targetTypeEnum = z.enum(["alert", "article", "auto"]);

const createSourceSchema = z.object({
  name: z.string().min(2).max(100),
  url: z.string().url(),
  type: sourceTypeEnum.default("rss"),
  targetType: targetTypeEnum.default("auto"),
  categoryHint: z.string().max(50).optional().nullable(),
  isActive: z.boolean().default(true),
});

const updateSourceSchema = createSourceSchema.partial().extend({
  id: z.string().uuid(),
});

export const contentSourceRouter = router({
  /** List all sources with stats */
  list: adminProcedure.query(async ({ ctx }) => {
    const items = await ctx.db
      .select()
      .from(contentSources)
      .orderBy(desc(contentSources.isActive), contentSources.name);

    const active = items.filter((s) => s.isActive).length;

    return { items, stats: { total: items.length, active, inactive: items.length - active } };
  }),

  /** Create a new source */
  create: adminProcedure
    .input(createSourceSchema)
    .mutation(async ({ ctx, input }) => {
      const [source] = await ctx.db
        .insert(contentSources)
        .values(input)
        .returning();

      return source;
    }),

  /** Update an existing source */
  update: adminProcedure
    .input(updateSourceSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const [updated] = await ctx.db
        .update(contentSources)
        .set(data)
        .where(eq(contentSources.id, id))
        .returning();

      if (!updated) throw new Error("Source introuvable");
      return updated;
    }),

  /** Toggle active/inactive */
  toggleActive: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.contentSources.findFirst({
        where: eq(contentSources.id, input.id),
        columns: { isActive: true },
      });
      if (!existing) throw new Error("Source introuvable");

      const [updated] = await ctx.db
        .update(contentSources)
        .set({ isActive: !existing.isActive })
        .where(eq(contentSources.id, input.id))
        .returning();

      return updated;
    }),

  /** Delete a source */
  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .delete(contentSources)
        .where(eq(contentSources.id, input.id))
        .returning({ id: contentSources.id });

      if (!deleted) throw new Error("Source introuvable");
      return { success: true, id: deleted.id };
    }),

  /** Reset last_item_date (force re-fetch on next veille run) */
  resetFetch: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(contentSources)
        .set({ lastItemDate: null, lastFetchedAt: null, lastFetchCount: 0 })
        .where(eq(contentSources.id, input.id))
        .returning();

      if (!updated) throw new Error("Source introuvable");
      return updated;
    }),
});
