import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc.js";
import { favorites, favoriteFolders, products } from "../../db/schema/index.js";
import { notFound, conflict } from "../../lib/errors.js";

export const favoritesRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        folderId: z.string().uuid().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(favorites.userId, ctx.userId)];
      if (input.folderId) {
        conditions.push(eq(favorites.folderId, input.folderId));
      }

      const items = await ctx.db
        .select({
          id: favorites.id,
          productId: favorites.productId,
          folderId: favorites.folderId,
          notes: favorites.notes,
          createdAt: favorites.createdAt,
          product: {
            id: products.id,
            name: products.name,
            brand: products.brand,
            barcode: products.barcode,
            imageUrl: products.imageUrl,
            halalStatus: products.halalStatus,
            category: products.category,
          },
        })
        .from(favorites)
        .leftJoin(products, eq(favorites.productId, products.id))
        .where(and(...conditions))
        .orderBy(desc(favorites.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return items;
    }),

  add: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
        folderId: z.string().uuid().optional(),
        notes: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Premium gate: free users limited to 5 favorites
      if (ctx.subscriptionTier !== "premium") {
        const countResult = await ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(favorites)
          .where(eq(favorites.userId, ctx.userId))
          .then((r) => r[0] ?? { count: 0 });
        if (countResult.count >= 5) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Limite de 5 favoris atteinte. Passez a Optimus+ pour des favoris illimites.",
          });
        }
      }

      const existing = await ctx.db.query.favorites.findFirst({
        where: and(
          eq(favorites.userId, ctx.userId),
          eq(favorites.productId, input.productId)
        ),
      });

      if (existing) {
        throw conflict("Ce produit est déjà dans vos favoris");
      }

      const [fav] = await ctx.db
        .insert(favorites)
        .values({ ...input, userId: ctx.userId })
        .returning();

      return fav;
    }),

  remove: protectedProcedure
    .input(z.object({ productId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(favorites)
        .where(
          and(
            eq(favorites.userId, ctx.userId),
            eq(favorites.productId, input.productId)
          )
        );
      return { success: true };
    }),

  moveToFolder: protectedProcedure
    .input(
      z.object({
        favoriteId: z.string().uuid(),
        folderId: z.string().uuid().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(favorites)
        .set({ folderId: input.folderId })
        .where(and(eq(favorites.id, input.favoriteId), eq(favorites.userId, ctx.userId)))
        .returning();

      if (!updated) throw notFound("Favori introuvable");
      return updated;
    }),

  // ── Folders ────────────────────────────────────────────

  listFolders: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.favoriteFolders.findMany({
      where: eq(favoriteFolders.userId, ctx.userId),
      orderBy: (f, { asc }) => [asc(f.sortOrder)],
    });
  }),

  createFolder: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        color: z.string().max(7).optional(),
        icon: z.string().max(50).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [folder] = await ctx.db
        .insert(favoriteFolders)
        .values({ ...input, userId: ctx.userId })
        .returning();
      return folder;
    }),

  updateFolder: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        color: z.string().max(7).optional(),
        icon: z.string().max(50).optional(),
        sortOrder: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await ctx.db
        .update(favoriteFolders)
        .set(data)
        .where(and(eq(favoriteFolders.id, id), eq(favoriteFolders.userId, ctx.userId)))
        .returning();
      if (!updated) throw notFound("Dossier introuvable");
      return updated;
    }),

  deleteFolder: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership before operating
      const folder = await ctx.db.query.favoriteFolders.findFirst({
        where: and(eq(favoriteFolders.id, input.id), eq(favoriteFolders.userId, ctx.userId)),
      });
      if (!folder) throw notFound("Dossier introuvable");

      // Transaction: move favorites out + delete folder
      await ctx.db.transaction(async (tx) => {
        await tx
          .update(favorites)
          .set({ folderId: null })
          .where(eq(favorites.folderId, input.id));

        await tx
          .delete(favoriteFolders)
          .where(and(eq(favoriteFolders.id, input.id), eq(favoriteFolders.userId, ctx.userId)));
      });

      return { success: true };
    }),
});
