/**
 * Boycott seed adapter — called by run-all.ts
 */

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { BDS_SEED_DATA } from "./boycott-bds.js";
import { boycottTargets } from "../schema/boycott.js";

export async function seedBoycottTargets(db: PostgresJsDatabase): Promise<number> {
  let count = 0;

  for (const target of BDS_SEED_DATA) {
    await db
      .insert(boycottTargets)
      .values(target)
      .onConflictDoUpdate({
        target: boycottTargets.id,
        set: {
          companyName: target.companyName,
          brands: target.brands,
          parentCompany: target.parentCompany,
          sector: target.sector,
          boycottLevel: target.boycottLevel,
          severity: target.severity,
          reason: target.reason,
          reasonSummary: target.reasonSummary,
          sourceUrl: target.sourceUrl,
          sourceName: target.sourceName,
          verifiedBy: target.verifiedBy,
          isActive: target.isActive,
          updatedAt: new Date(),
        },
      });
    count++;
  }

  return count;
}
