import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { router, publicProcedure } from "../trpc.js";
import { certifiers } from "../../db/schema/index.js";

export const certifierRouter = router({
  /** Get all certifiers ranked by trust score (descending) */
  ranking: publicProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: certifiers.id,
        name: certifiers.name,
        website: certifiers.website,
        creationYear: certifiers.creationYear,
        halalAssessment: certifiers.halalAssessment,
        trustScore: certifiers.trustScore,
        acceptsStunning: certifiers.acceptsStunning,
        controllersAreEmployees: certifiers.controllersAreEmployees,
        controllersPresentEachProduction: certifiers.controllersPresentEachProduction,
      })
      .from(certifiers)
      .where(eq(certifiers.isActive, true))
      .orderBy(desc(certifiers.trustScore));
  }),

  /** Get a single certifier with full details */
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const certifier = await ctx.db.query.certifiers.findFirst({
        where: eq(certifiers.id, input.id),
      });
      if (!certifier) {
        return null;
      }
      return certifier;
    }),

  /** Get only certifiers that pass halal assessment */
  trusted: publicProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: certifiers.id,
        name: certifiers.name,
        trustScore: certifiers.trustScore,
        website: certifiers.website,
      })
      .from(certifiers)
      .where(eq(certifiers.halalAssessment, true))
      .orderBy(desc(certifiers.trustScore));
  }),
});
