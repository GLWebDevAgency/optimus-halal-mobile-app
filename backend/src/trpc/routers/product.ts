import { z } from "zod";
import { eq, ilike, or, desc, sql } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";
import { products, categories } from "../../db/schema/index.js";
import { notFound } from "../../lib/errors.js";

function escapeLike(str: string): string {
  return str.replace(/[%_\\]/g, "\\$&");
}

export const productRouter = router({
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.db.query.products.findFirst({
        where: eq(products.id, input.id),
      });
      if (!product) throw notFound("Produit introuvable");
      return product;
    }),

  getByBarcode: publicProcedure
    .input(z.object({ barcode: z.string() }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.db.query.products.findFirst({
        where: eq(products.barcode, input.barcode),
      });
      return product ?? null;
    }),

  search: publicProcedure
    .input(
      z.object({
        query: z.string().max(200).optional(),
        category: z.string().optional(),
        halalStatus: z.enum(["halal", "haram", "doubtful", "unknown"]).optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];

      if (input.query) {
        const q = escapeLike(input.query);
        conditions.push(
          or(
            ilike(products.name, `%${q}%`),
            ilike(products.brand, `%${q}%`)
          )
        );
      }

      if (input.halalStatus) {
        conditions.push(eq(products.halalStatus, input.halalStatus));
      }

      if (input.category) {
        conditions.push(eq(products.category, input.category));
      }

      const where = conditions.length > 0
        ? sql`${sql.join(conditions, sql` AND `)}`
        : undefined;

      const items = await ctx.db
        .select()
        .from(products)
        .where(where)
        .orderBy(desc(products.updatedAt))
        .limit(input.limit)
        .offset(input.offset);

      const [{ count }] = await ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(products)
        .where(where);

      return { items, total: count };
    }),

  getCategories: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.query.categories.findMany({
      orderBy: (cat, { asc }) => [asc(cat.sortOrder)],
    });
  }),

  getAlternatives: publicProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        limit: z.number().min(1).max(20).default(5),
      })
    )
    .query(async ({ ctx, input }) => {
      const product = await ctx.db.query.products.findFirst({
        where: eq(products.id, input.productId),
      });
      if (!product) throw notFound("Produit introuvable");

      // Find halal alternatives in same category
      const alternatives = await ctx.db
        .select()
        .from(products)
        .where(
          sql`${products.category} = ${product.category}
            AND ${products.halalStatus} = 'halal'
            AND ${products.id} != ${product.id}`
        )
        .orderBy(desc(products.confidenceScore))
        .limit(input.limit);

      return alternatives;
    }),
});
