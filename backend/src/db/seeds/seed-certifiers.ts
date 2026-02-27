/**
 * Certifier seed adapter — called by run-all.ts
 */

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { loadCertifierSeedData } from "./certifiers.js";
import { certifiers } from "../schema/certifiers.js";

export async function seedCertifiers(db: PostgresJsDatabase): Promise<number> {
  const data = await loadCertifierSeedData();
  let count = 0;

  for (const certifier of data) {
    await db
      .insert(certifiers)
      .values(certifier)
      .onConflictDoUpdate({
        target: certifiers.id,
        set: {
          name: certifier.name,
          website: certifier.website,
          creationYear: certifier.creationYear,
          controllersAreEmployees: certifier.controllersAreEmployees,
          controllersPresentEachProduction: certifier.controllersPresentEachProduction,
          hasSalariedSlaughterers: certifier.hasSalariedSlaughterers,
          acceptsMechanicalSlaughter: certifier.acceptsMechanicalSlaughter,
          acceptsElectronarcosis: certifier.acceptsElectronarcosis,
          acceptsPostSlaughterElectrocution: certifier.acceptsPostSlaughterElectrocution,
          acceptsStunning: certifier.acceptsStunning,
          acceptsVsm: certifier.acceptsVsm,
          // V4: Transparency indicators
          transparencyPublicCharter: certifier.transparencyPublicCharter,
          transparencyAuditReports: certifier.transparencyAuditReports,
          transparencyCompanyList: certifier.transparencyCompanyList,
          controversyPenalty: certifier.controversyPenalty,
          halalAssessment: certifier.halalAssessment,
          trustScore: certifier.trustScore,
          trustScoreHanafi: certifier.trustScoreHanafi,
          trustScoreShafii: certifier.trustScoreShafii,
          trustScoreMaliki: certifier.trustScoreMaliki,
          trustScoreHanbali: certifier.trustScoreHanbali,
          notes: certifier.notes,
          updatedAt: new Date(),
        },
      });
    count++;
  }

  return count;
}
