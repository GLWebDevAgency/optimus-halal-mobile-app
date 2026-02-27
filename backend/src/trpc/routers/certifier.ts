import { z } from "zod";
import { eq } from "drizzle-orm";
import { router, publicProcedure } from "../trpc.js";
import { certifiers } from "../../db/schema/index.js";
import {
  getCertifierScores,
  getAllCertifierScores,
} from "../../services/certifier-score.service.js";

export const certifierRouter = router({
  /** Get all certifiers ranked by trust score (descending) — runtime-computed */
  ranking: publicProcedure.query(async ({ ctx }) => {
    const scored = await getAllCertifierScores(ctx.db, ctx.redis);
    return scored.map((c) => ({
      id: c.id,
      name: c.name,
      website: c.website,
      halalAssessment: c.halalAssessment,
      trustScore: c.scores.trustScore,
    }));
  }),

  /** Get a single certifier with full details + runtime-computed scores */
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Load full certifier row (raw flags + metadata)
      const certifier = await ctx.db.query.certifiers.findFirst({
        where: eq(certifiers.id, input.id),
      });
      if (!certifier) return null;

      // Compute live scores
      const scored = await getCertifierScores(ctx.db, ctx.redis, input.id);

      return {
        ...certifier,
        // Override pre-computed scores with runtime values
        trustScore: scored?.scores.trustScore ?? certifier.trustScore,
        trustScoreHanafi: scored?.scores.trustScoreHanafi ?? certifier.trustScoreHanafi,
        trustScoreShafii: scored?.scores.trustScoreShafii ?? certifier.trustScoreShafii,
        trustScoreMaliki: scored?.scores.trustScoreMaliki ?? certifier.trustScoreMaliki,
        trustScoreHanbali: scored?.scores.trustScoreHanbali ?? certifier.trustScoreHanbali,
        controversyPenalty: scored?.scores.controversyPenalty ?? certifier.controversyPenalty,
      };
    }),

  /** Get only certifiers that pass halal assessment — runtime-computed */
  trusted: publicProcedure.query(async ({ ctx }) => {
    const scored = await getAllCertifierScores(ctx.db, ctx.redis);
    return scored
      .filter((c) => c.halalAssessment)
      .map((c) => ({
        id: c.id,
        name: c.name,
        trustScore: c.scores.trustScore,
        website: c.website,
      }));
  }),
});
