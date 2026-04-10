/**
 * BoycottEngine — Brand boycott check (§11.1).
 *
 * Extracted from scan.ts `checkBoycott` helper.
 * Server-side gate: if boycottOptIn is false, return null immediately
 * (no computation, no DB query). Per spec §11.1.
 */

import { eq, sql, and } from "drizzle-orm";
import { boycottTargets } from "../db/schema/index.js";

export interface BoycottReport {
  matched: boolean;
  level: string | null;
  brand: string | null;
  targetName: string | null;
  reasonsSummaryFr: string | null;
  sourcesCount: number;
  targets: Array<{
    id: string;
    companyName: string;
    boycottLevel: string;
    severity: string;
    reasonSummary: string;
    sourceUrl: string | null;
    sourceName: string | null;
  }>;
}

/**
 * Evaluate boycott status for a brand.
 *
 * @param db - Drizzle DB instance
 * @param brand - Product brand string (can be null)
 * @param boycottOptIn - User preference; false = skip entirely
 * @returns BoycottReport if opted in, null if opted out
 */
export async function evaluateBoycott(
  db: any,
  brand: string | null | undefined,
  boycottOptIn: boolean,
): Promise<BoycottReport | null> {
  // Server-side gate (§11.1): user hasn't opted in → no computation
  if (!boycottOptIn) return null;

  if (!brand) {
    return {
      matched: false,
      level: null,
      brand: null,
      targetName: null,
      reasonsSummaryFr: null,
      sourcesCount: 0,
      targets: [],
    };
  }

  const brandLower = brand.toLowerCase();
  const matches = await db
    .select()
    .from(boycottTargets)
    .where(
      and(
        eq(boycottTargets.isActive, true),
        sql`EXISTS (
          SELECT 1 FROM unnest(${boycottTargets.brands}) AS b
          WHERE lower(b) = ${brandLower}
          OR ${brandLower} LIKE '%' || lower(b) || '%'
          OR lower(b) LIKE '%' || ${brandLower} || '%'
        )`,
      ),
    );

  if (matches.length === 0) {
    return {
      matched: false,
      level: null,
      brand,
      targetName: null,
      reasonsSummaryFr: null,
      sourcesCount: 0,
      targets: [],
    };
  }

  const firstMatch = matches[0];

  return {
    matched: true,
    level: firstMatch.boycottLevel,
    brand,
    targetName: firstMatch.companyName,
    reasonsSummaryFr: firstMatch.reasonSummary,
    sourcesCount: matches.length,
    targets: matches.map((t: any) => ({
      id: t.id,
      companyName: t.companyName,
      boycottLevel: t.boycottLevel,
      severity: t.severity,
      reasonSummary: t.reasonSummary,
      sourceUrl: t.sourceUrl,
      sourceName: t.sourceName,
    })),
  };
}
