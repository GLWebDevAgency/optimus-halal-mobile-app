import { z } from "zod";
import { eq, ilike, or, and, inArray } from "drizzle-orm";
import { publicProcedure, protectedProcedure, router } from "../trpc.js";
import { additives, additiveMadhabRulings } from "../../db/schema/index.js";

function escapeLike(str: string): string {
  return str.replace(/[%_\\]/g, "\\$&");
}

export const additiveRouter = router({
  list: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        halalStatus: z.enum(["halal", "haram", "doubtful", "unknown"]).optional(),
        limit: z.number().min(1).max(500).default(100),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(additives.isActive, true)];
      if (input.category) {
        conditions.push(eq(additives.category, input.category as any));
      }
      if (input.halalStatus) {
        conditions.push(eq(additives.halalStatusDefault, input.halalStatus));
      }

      return ctx.db
        .select()
        .from(additives)
        .where(and(...conditions))
        .limit(input.limit)
        .offset(input.offset)
        .orderBy(additives.code);
    }),

  getByCode: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ ctx, input }) => {
      const code = input.code.toUpperCase().replace(/^EN:/, "").replace(/^E/, "E");

      const [additive] = await ctx.db
        .select()
        .from(additives)
        .where(eq(additives.code, code))
        .limit(1);

      if (!additive) return null;

      const rulings = await ctx.db
        .select()
        .from(additiveMadhabRulings)
        .where(eq(additiveMadhabRulings.additiveCode, code));

      return { ...additive, madhabRulings: rulings };
    }),

  search: publicProcedure
    .input(z.object({ query: z.string().min(1).max(100) }))
    .query(async ({ ctx, input }) => {
      const q = `%${escapeLike(input.query)}%`;

      return ctx.db
        .select()
        .from(additives)
        .where(
          or(
            ilike(additives.code, q),
            ilike(additives.nameFr, q),
            ilike(additives.nameEn, q)
          )
        )
        .limit(20)
        .orderBy(additives.code);
    }),

  getForProduct: publicProcedure
    .input(
      z.object({
        additiveTags: z.array(z.string()).max(100),
        madhab: z
          .enum(["hanafi", "shafii", "maliki", "hanbali", "general"])
          .default("general"),
      })
    )
    .query(async ({ ctx, input }) => {
      if (input.additiveTags.length === 0) return [];

      // Normalize OFF tags: "en:e322i" → "E322"
      const codes = [
        ...new Set(
          input.additiveTags.map((tag) =>
            tag
              .replace(/^en:/, "")
              .toUpperCase()
              .replace(/[a-z]$/i, "")
          )
        ),
      ];

      const dbAdditives = await ctx.db
        .select()
        .from(additives)
        .where(inArray(additives.code, codes));

      // Batch fetch all madhab rulings in one query (fixes N+1)
      let rulingsByCode: Record<string, (typeof additiveMadhabRulings.$inferSelect)> = {};
      if (input.madhab !== "general" && codes.length > 0) {
        const allRulings = await ctx.db
          .select()
          .from(additiveMadhabRulings)
          .where(
            and(
              inArray(additiveMadhabRulings.additiveCode, codes),
              eq(additiveMadhabRulings.madhab, input.madhab)
            )
          );
        for (const r of allRulings) {
          rulingsByCode[r.additiveCode] = r;
        }
      }

      return dbAdditives.map((additive) => ({
        ...additive,
        madhabRuling: rulingsByCode[additive.code] ?? null,
      }));
    }),
});
