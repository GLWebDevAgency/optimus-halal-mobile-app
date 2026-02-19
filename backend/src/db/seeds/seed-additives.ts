/**
 * Additives seed adapter — called by run-all.ts
 *
 * Re-exports the additive data from additives-seed.ts but accepts db as param.
 * 200+ E-numbers + 30+ madhab rulings.
 */

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { additives, additiveMadhabRulings } from "../schema/index.js";
import type { NewAdditive, NewAdditiveMadhabRuling } from "../schema/additives.js";

// Re-import data arrays from the existing seed file
// We duplicate the import approach here to avoid importing from a file that calls process.exit()
// The actual data lives in additives-seed.ts — this adapter wraps it for the unified runner

export async function seedAdditives(db: PostgresJsDatabase): Promise<number> {
  // Dynamic import to get the data without triggering the standalone runner
  const mod = await import("./additives-data.js");
  const additivesData: NewAdditive[] = mod.ADDITIVES_DATA;
  const madhabData: Omit<NewAdditiveMadhabRuling, "id" | "createdAt">[] = mod.MADHAB_RULINGS;

  let count = 0;

  for (const additive of additivesData) {
    await db
      .insert(additives)
      .values(additive)
      .onConflictDoUpdate({
        target: additives.code,
        set: {
          nameFr: additive.nameFr,
          nameEn: additive.nameEn,
          category: additive.category,
          halalStatusDefault: additive.halalStatusDefault,
          halalExplanationFr: additive.halalExplanationFr,
          origin: additive.origin,
          toxicityLevel: additive.toxicityLevel,
          adiMgPerKg: additive.adiMgPerKg,
          riskPregnant: additive.riskPregnant,
          riskChildren: additive.riskChildren,
          riskAllergic: additive.riskAllergic,
          healthEffectsFr: additive.healthEffectsFr,
          efsaStatus: additive.efsaStatus,
          bannedCountries: additive.bannedCountries,
          updatedAt: new Date(),
        },
      });
    count++;
  }

  for (const ruling of madhabData) {
    await db
      .insert(additiveMadhabRulings)
      .values(ruling)
      .onConflictDoNothing();
    count++;
  }

  return count;
}
