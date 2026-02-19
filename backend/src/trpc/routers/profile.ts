import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc.js";
import { users, addresses, safeUserColumns, safeUserReturning } from "../../db/schema/index.js";
import { notFound } from "../../lib/errors.js";
import { env } from "../../lib/env.js";

export const profileRouter = router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.userId),
      columns: safeUserColumns,
    });
    if (!user) throw notFound("Utilisateur introuvable");
    return user;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        displayName: z.string().trim().min(2).max(100).optional(),
        phoneNumber: z.string().trim().max(20).optional(),
        avatarUrl: z.string().url().refine(
          (url) => {
            try {
              const { hostname } = new URL(url);
              const allowed = [
                "lh3.googleusercontent.com",
                "avatars.githubusercontent.com",
                "cloudflare-ipfs.com",
                "res.cloudinary.com",
                "i.imgur.com",
                "storage.googleapis.com",
                env.R2_PUBLIC_DOMAIN,
              ];
              return allowed.some((d) => hostname === d || hostname.endsWith("." + d));
            } catch {
              return false;
            }
          },
          { message: "URL d'avatar non autorisée" }
        ).optional(),
        bio: z.string().trim().max(500).optional(),
        city: z.string().trim().max(100).optional(),
        preferredLanguage: z.enum(["fr", "en", "ar"]).optional(),
        halalStrictness: z
          .enum(["relaxed", "moderate", "strict", "very_strict"])
          .optional(),
        dietaryRestrictions: z.array(z.string()).max(50).optional(),
        allergens: z.array(z.string()).max(50).optional(),
        madhab: z
          .enum(["hanafi", "shafii", "maliki", "hanbali", "general"])
          .optional(),
        isPregnant: z.boolean().optional(),
        hasChildren: z.boolean().optional(),
        notificationEnabled: z.boolean().optional(),
        biometricEnabled: z.boolean().optional(),
        darkMode: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(users)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(users.id, ctx.userId))
        .returning(safeUserReturning);

      if (!updated) throw notFound("Utilisateur introuvable");
      return updated;
    }),

  getAddresses: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.addresses.findMany({
      where: eq(addresses.userId, ctx.userId),
      orderBy: (addr, { desc }) => [desc(addr.isDefault), desc(addr.createdAt)],
    });
  }),

  addAddress: protectedProcedure
    .input(
      z.object({
        label: z.string().trim().max(50).optional(),
        addressType: z.enum(["home", "work", "other"]).default("home"),
        fullName: z.string().trim().min(2).max(100),
        phone: z.string().trim().max(20).optional(),
        street: z.string().trim().min(1),
        streetNumber: z.string().trim().max(20).optional(),
        apartment: z.string().trim().max(50).optional(),
        city: z.string().trim().min(1).max(100),
        postalCode: z.string().trim().min(1).max(10),
        country: z.string().trim().max(50).default("France"),
        instructions: z.string().trim().max(500).optional(),
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
        isDefault: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Transaction: reset default flag + insert new address
      return ctx.db.transaction(async (tx) => {
        if (input.isDefault) {
          await tx
            .update(addresses)
            .set({ isDefault: false })
            .where(eq(addresses.userId, ctx.userId));
        }

        const [address] = await tx
          .insert(addresses)
          .values({ ...input, userId: ctx.userId })
          .returning();

        return address;
      });
    }),

  updateAddress: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        label: z.string().trim().max(50).optional(),
        addressType: z.enum(["home", "work", "other"]).optional(),
        fullName: z.string().trim().min(2).max(100).optional(),
        phone: z.string().trim().max(20).optional(),
        street: z.string().trim().min(1).optional(),
        streetNumber: z.string().trim().max(20).optional(),
        apartment: z.string().trim().max(50).optional(),
        city: z.string().trim().min(1).max(100).optional(),
        postalCode: z.string().trim().min(1).max(10).optional(),
        instructions: z.string().trim().max(500).optional(),
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
        isDefault: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Transaction: reset default flag + update address
      return ctx.db.transaction(async (tx) => {
        if (data.isDefault) {
          await tx
            .update(addresses)
            .set({ isDefault: false })
            .where(eq(addresses.userId, ctx.userId));
        }

        const [updated] = await tx
          .update(addresses)
          .set(data)
          .where(and(eq(addresses.id, id), eq(addresses.userId, ctx.userId)))
          .returning();

        if (!updated) throw notFound("Adresse introuvable");
        return updated;
      });
    }),

  deleteAddress: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(addresses)
        .where(and(eq(addresses.id, input.id), eq(addresses.userId, ctx.userId)));
      return { success: true };
    }),

  getGamification: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.userId),
      columns: {
        level: true,
        experiencePoints: true,
        totalScans: true,
        currentStreak: true,
        longestStreak: true,
        lastScanDate: true,
      },
    });
    if (!user) throw notFound("Utilisateur introuvable");
    return user;
  }),
});
