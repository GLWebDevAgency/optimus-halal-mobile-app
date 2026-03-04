/**
 * Brand-Certifier seed runner — called by run-all.ts (Phase 1.5)
 *
 * Idempotent upsert: uses the unique constraint
 * (brand_pattern, certifier_id, country_code, product_scope)
 * to avoid duplicates on re-run.
 */

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { brandCertifiers } from "../schema/brand-certifiers.js";
import { brandCertifiersSeedData } from "./brand-certifiers-seed.js";

export async function seedBrandCertifiers(db: PostgresJsDatabase): Promise<number> {
  let count = 0;

  for (const mapping of brandCertifiersSeedData) {
    await db
      .insert(brandCertifiers)
      .values(mapping)
      .onConflictDoUpdate({
        target: [
          brandCertifiers.brandPattern,
          brandCertifiers.certifierId,
          brandCertifiers.countryCode,
          brandCertifiers.productScope,
        ],
        set: {
          source: mapping.source,
          sourceUrl: mapping.sourceUrl ?? null,
          verificationStatus: mapping.verificationStatus,
          confidence: mapping.confidence,
          productScope: mapping.productScope,
          effectiveFrom: mapping.effectiveFrom ?? null,
          effectiveUntil: mapping.effectiveUntil ?? null,
          notes: mapping.notes ?? null,
          isActive: mapping.isActive,
          updatedAt: new Date(),
        },
      });
    count++;
  }

  return count;
}
