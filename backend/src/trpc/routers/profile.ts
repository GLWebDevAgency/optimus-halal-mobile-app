import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc.js";
import { users, addresses } from "../../db/schema/index.js";
import { notFound } from "../../lib/errors.js";

export const profileRouter = router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.userId),
    });
    if (!user) throw notFound("Utilisateur introuvable");
    const { passwordHash: _, ...profile } = user;
    return profile;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        displayName: z.string().min(2).max(100).optional(),
        phoneNumber: z.string().max(20).optional(),
        avatarUrl: z.string().optional(),
        bio: z.string().max(500).optional(),
        city: z.string().max(100).optional(),
        preferredLanguage: z.enum(["fr", "en", "ar"]).optional(),
        halalStrictness: z
          .enum(["relaxed", "moderate", "strict", "very_strict"])
          .optional(),
        dietaryRestrictions: z.array(z.string()).optional(),
        allergens: z.array(z.string()).optional(),
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
        .returning();

      if (!updated) throw notFound("Utilisateur introuvable");
      const { passwordHash: _, ...profile } = updated;
      return profile;
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
        label: z.string().max(50).optional(),
        addressType: z.enum(["home", "work", "other"]).default("home"),
        fullName: z.string().min(2).max(100),
        phone: z.string().max(20).optional(),
        street: z.string().min(1),
        streetNumber: z.string().max(20).optional(),
        apartment: z.string().max(50).optional(),
        city: z.string().min(1).max(100),
        postalCode: z.string().min(1).max(10),
        country: z.string().max(50).default("France"),
        instructions: z.string().max(500).optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
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
        label: z.string().max(50).optional(),
        addressType: z.enum(["home", "work", "other"]).optional(),
        fullName: z.string().min(2).max(100).optional(),
        phone: z.string().max(20).optional(),
        street: z.string().min(1).optional(),
        streetNumber: z.string().max(20).optional(),
        apartment: z.string().max(50).optional(),
        city: z.string().min(1).max(100).optional(),
        postalCode: z.string().min(1).max(10).optional(),
        instructions: z.string().max(500).optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
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
