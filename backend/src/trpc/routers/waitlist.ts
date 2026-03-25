import { z } from "zod";
import { sql } from "drizzle-orm";
import { router, publicProcedure } from "../trpc.js";
import { waitlistLeads } from "../../db/schema/index.js";
import { logger } from "../../lib/logger.js";

export const waitlistRouter = router({
  /** Inscrit un email à la waitlist (upsert — idempotent) */
  join: publicProcedure
    .input(
      z.object({
        email: z.string().email("Email invalide").max(320).transform((s) => s.toLowerCase().trim()),
        source: z.enum(["landing", "marketplace", "navbar", "cta"]).default("landing"),
        locale: z.string().max(5).default("fr"),
        utmSource: z.string().max(100).nullish(),
        utmMedium: z.string().max(100).nullish(),
        utmCampaign: z.string().max(100).nullish(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .insert(waitlistLeads)
        .values({
          email: input.email,
          source: input.source,
          locale: input.locale,
          utmSource: input.utmSource ?? null,
          utmMedium: input.utmMedium ?? null,
          utmCampaign: input.utmCampaign ?? null,
        })
        .onConflictDoUpdate({
          target: waitlistLeads.email,
          set: {
            source: input.source,
            utmSource: input.utmSource ?? sql`${waitlistLeads.utmSource}`,
            utmMedium: input.utmMedium ?? sql`${waitlistLeads.utmMedium}`,
            utmCampaign: input.utmCampaign ?? sql`${waitlistLeads.utmCampaign}`,
            updatedAt: new Date(),
          },
        })
        .returning({ id: waitlistLeads.id, createdAt: waitlistLeads.createdAt, updatedAt: waitlistLeads.updatedAt });

      const row = result[0]!;
      const isNew = row.createdAt.getTime() === row.updatedAt.getTime();

      logger.info("Waitlist inscription", {
        email: input.email,
        source: input.source,
        isNew,
      });

      return { status: isNew ? "created" as const : "existing" as const };
    }),
});
