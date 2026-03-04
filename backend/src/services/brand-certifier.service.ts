/**
 * Brand-Certifier Lookup Service
 *
 * Provides brand-based certifier identification as a fallback (Tier 1c)
 * when OpenFoodFacts only returns a generic halal label without specifying
 * the certifying body.
 *
 * Matching algorithm:
 *   1. Split OFF brands on comma, trim, lowercase
 *   2. Query brand_certifiers for exact pattern match
 *   3. Filter: isActive, country, temporal validity
 *   4. Join certifiers for name
 *   5. Return highest-confidence confirmed match
 */

import { and, eq, isNull, or, gte, inArray, desc, asc } from "drizzle-orm";
import type { Database } from "../db/index.js";
import { brandCertifiers } from "../db/schema/brand-certifiers.js";
import { certifiers } from "../db/schema/certifiers.js";

export interface BrandCertifierMatch {
  certifierId: string;
  certifierName: string;
  source: string;
  sourceUrl: string | null;
  verificationStatus: string;
  confidence: number;
  productScope: string;
}

/**
 * Look up the certifier for a brand string from OpenFoodFacts.
 *
 * OFF brands are comma-separated (e.g., "Samia" or "Samia,Leader Price").
 * Each token is normalized (trimmed, lowercased) and matched against
 * the brand_certifiers table.
 *
 * Returns the best match (highest confidence, confirmed first) or null.
 */
export async function lookupBrandCertifier(
  db: Database,
  brandString: string | undefined | null,
  countryCode: string = "FR",
): Promise<BrandCertifierMatch | null> {
  if (!brandString) return null;

  // OFF brands can be comma-separated: "Samia,Leader Price"
  const tokens = brandString
    .split(",")
    .map((b) => b.trim().toLowerCase())
    .filter((b) => b.length > 0);

  if (tokens.length === 0) return null;

  const now = new Date().toISOString().slice(0, 10); // YYYY-MM-DD for date comparison

  const results = await db
    .select({
      certifierId: brandCertifiers.certifierId,
      certifierName: certifiers.name,
      source: brandCertifiers.source,
      sourceUrl: brandCertifiers.sourceUrl,
      verificationStatus: brandCertifiers.verificationStatus,
      confidence: brandCertifiers.confidence,
      productScope: brandCertifiers.productScope,
    })
    .from(brandCertifiers)
    .innerJoin(certifiers, eq(brandCertifiers.certifierId, certifiers.id))
    .where(
      and(
        eq(brandCertifiers.isActive, true),
        eq(brandCertifiers.countryCode, countryCode),
        inArray(brandCertifiers.brandPattern, tokens),
        // Temporal filter: effectiveUntil is null (still active) or in the future
        or(
          isNull(brandCertifiers.effectiveUntil),
          gte(brandCertifiers.effectiveUntil, now),
        ),
      ),
    )
    .orderBy(
      desc(brandCertifiers.confidence),
      asc(brandCertifiers.verificationStatus), // "confirmed" < "probable" < "unverified" (alphabetical)
    )
    .limit(1);

  return results[0] ?? null;
}
