/**
 * Article Router — Public read + Admin CRUD.
 *
 * Public: list (published only), getBySlug, getById
 * Admin: adminList (all statuses), create, update, delete, togglePublish
 */

import { z } from "zod";
import { eq, and, desc, lt, sql } from "drizzle-orm";
import { router, publicProcedure, adminProcedure } from "../trpc.js";
import { articles } from "../../db/schema/index.js";
import { notFound } from "../../lib/errors.js";

// ── Validation schemas ─────────────────────────────────

const articleTypeEnum = z.enum(["blog", "partner_news", "educational", "community"]);

const createArticleSchema = z.object({
  title: z.string().min(3).max(255),
  slug: z.string().min(3).max(255).regex(/^[a-z0-9-]+$/, "Slug invalide (lettres minuscules, chiffres, tirets)"),
  excerpt: z.string().max(500).optional(),
  content: z.string().optional(),
  coverImage: z.string().url().optional().nullable(),
  author: z.string().max(100).default("Naqiy Team"),
  type: articleTypeEnum.default("blog"),
  tags: z.array(z.string().max(50)).max(10).default([]),
  readTimeMinutes: z.number().int().min(1).max(60).default(3),
  externalLink: z.string().url().optional().nullable(),
  isPublished: z.boolean().default(false),
});

const updateArticleSchema = createArticleSchema.partial().extend({
  id: z.string().uuid(),
});

// ── Router ──────────────────────────────────────────────

export const articleRouter = router({
  // ── Public endpoints ──

  list: publicProcedure
    .input(
      z.object({
        type: articleTypeEnum.optional(),
        limit: z.number().min(1).max(50).default(10),
        cursor: z.string().uuid().optional(),
      }),
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
        if (!cursorArticle) return { items: [], nextCursor: undefined };
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
          eq(articles.isPublished, true),
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

  // ── Admin endpoints ──

  /** List all articles including drafts, with stats */
  adminList: adminProcedure
    .input(
      z.object({
        type: articleTypeEnum.optional(),
        isPublished: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions: ReturnType<typeof eq>[] = [];
      if (input.type) conditions.push(eq(articles.type, input.type));
      if (input.isPublished !== undefined) conditions.push(eq(articles.isPublished, input.isPublished));

      const [items, [stats]] = await Promise.all([
        ctx.db
          .select()
          .from(articles)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(articles.updatedAt))
          .limit(input.limit)
          .offset(input.offset),
        ctx.db
          .select({
            total: sql<number>`count(*)::int`,
            published: sql<number>`count(*) filter (where ${articles.isPublished} = true)::int`,
            drafts: sql<number>`count(*) filter (where ${articles.isPublished} = false)::int`,
          })
          .from(articles),
      ]);

      return { items, stats: stats ?? { total: 0, published: 0, drafts: 0 } };
    }),

  /** Create a new article (draft or published) */
  create: adminProcedure
    .input(createArticleSchema)
    .mutation(async ({ ctx, input }) => {
      const [article] = await ctx.db
        .insert(articles)
        .values({
          ...input,
          publishedAt: input.isPublished ? new Date() : new Date(),
        })
        .returning();

      return article;
    }),

  /** Update an existing article */
  update: adminProcedure
    .input(updateArticleSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const [updated] = await ctx.db
        .update(articles)
        .set(data)
        .where(eq(articles.id, id))
        .returning();

      if (!updated) throw notFound("Article");
      return updated;
    }),

  /** Toggle publish status */
  togglePublish: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.articles.findFirst({
        where: eq(articles.id, input.id),
        columns: { isPublished: true },
      });
      if (!existing) throw notFound("Article");

      const newStatus = !existing.isPublished;
      const [updated] = await ctx.db
        .update(articles)
        .set({
          isPublished: newStatus,
          publishedAt: newStatus ? new Date() : undefined,
        })
        .where(eq(articles.id, input.id))
        .returning();

      return updated;
    }),

  /** Delete an article (hard delete) */
  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .delete(articles)
        .where(eq(articles.id, input.id))
        .returning({ id: articles.id });

      if (!deleted) throw notFound("Article");
      return { success: true, id: deleted.id };
    }),
});
