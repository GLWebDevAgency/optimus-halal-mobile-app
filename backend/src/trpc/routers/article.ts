import { z } from "zod";
import { eq, and, desc, lt } from "drizzle-orm";
import { router, publicProcedure } from "../trpc.js";
import { articles } from "../../db/schema/index.js";
import { notFound } from "../../lib/errors.js";

export const articleRouter = router({
  list: publicProcedure
    .input(
      z.object({
        type: z
          .enum(["blog", "partner_news", "educational", "community"])
          .optional(),
        limit: z.number().min(1).max(50).default(10),
        cursor: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(articles.isPublished, true)];

      if (input.type) {
        conditions.push(eq(articles.type, input.type));
      }

      if (input.cursor) {
        const cursorArticle = await ctx.db.query.articles.findFirst({
          where: eq(articles.id, input.cursor),
          columns: { publishedAt: true },
        });
        if (!cursorArticle) {
          return { items: [], nextCursor: undefined };
        }
        conditions.push(lt(articles.publishedAt, cursorArticle.publishedAt));
      }

      const items = await ctx.db
        .select()
        .from(articles)
        .where(and(...conditions))
        .orderBy(desc(articles.publishedAt))
        .limit(input.limit + 1);

      let nextCursor: string | undefined;
      if (items.length > input.limit) {
        const next = items.pop()!;
        nextCursor = next.id;
      }

      return { items, nextCursor };
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1).max(255) }))
    .query(async ({ ctx, input }) => {
      const article = await ctx.db.query.articles.findFirst({
        where: and(
          eq(articles.slug, input.slug),
          eq(articles.isPublished, true)
        ),
      });
      if (!article) throw notFound("Article");
      return article;
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const article = await ctx.db.query.articles.findFirst({
        where: eq(articles.id, input.id),
      });
      if (!article) throw notFound("Article");
      return article;
    }),
});
