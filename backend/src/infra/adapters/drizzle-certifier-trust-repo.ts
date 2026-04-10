/**
 * Drizzle adapter for ICertifierTrustRepo — Certified Track data access.
 *
 * Queries:
 *   - getAcceptedTuples: JOIN certifier_tuple_acceptance × practice_tuples
 *     WHERE is_current = true AND stance IN (accepts, conditional)
 *     Optional species filter via jsonb dimensions->>'species'
 *
 *   - getLiveEvents: certifier_events WHERE is_active = true within window
 */

import { db } from "../../db/index.js";
import { certifierTupleAcceptance } from "../../db/schema/certifier-tuple-acceptance.js";
import { practiceTuples } from "../../db/schema/practice-tuples.js";
import { certifierEvents } from "../../db/schema/certifiers.js";
import { eq, and, inArray, gte, sql } from "drizzle-orm";
import type {
  ICertifierTrustRepo,
  CertifierTupleView,
  CertifierAcceptanceView,
  CertifierEventView,
} from "../../domain/ports/certifier-trust-repo.js";

export class DrizzleCertifierTrustRepo implements ICertifierTrustRepo {
  async getAcceptedTuples(
    certifierId: string,
    species?: string,
  ): Promise<Array<{ tuple: CertifierTupleView; acceptance: CertifierAcceptanceView }>> {
    // Build WHERE conditions
    const conditions = [
      eq(certifierTupleAcceptance.certifierId, certifierId),
      eq(certifierTupleAcceptance.isCurrent, true),
      inArray(certifierTupleAcceptance.stance, ["accepts", "conditional"]),
      eq(practiceTuples.isActive, true),
    ];

    // Species filter via jsonb
    if (species) {
      conditions.push(
        sql`${practiceTuples.dimensions}->>'species' = ${species}`,
      );
    }

    const rows = await db
      .select({
        // Practice tuple fields
        tupleSlug: practiceTuples.slug,
        familyId: practiceTuples.familyId,
        dimensions: practiceTuples.dimensions,
        verdictHanafi: practiceTuples.verdictHanafi,
        verdictMaliki: practiceTuples.verdictMaliki,
        verdictShafii: practiceTuples.verdictShafii,
        verdictHanbali: practiceTuples.verdictHanbali,
        requiredEvidence: practiceTuples.requiredEvidence,
        dossierSectionRef: practiceTuples.dossierSectionRef,
        typicalMortalityPctMin: practiceTuples.typicalMortalityPctMin,
        typicalMortalityPctMax: practiceTuples.typicalMortalityPctMax,
        notesFr: practiceTuples.notesFr,
        // Acceptance fields
        stance: certifierTupleAcceptance.stance,
        evidenceLevel: certifierTupleAcceptance.evidenceLevel,
        evidenceDetails: certifierTupleAcceptance.evidenceDetails,
      })
      .from(certifierTupleAcceptance)
      .innerJoin(
        practiceTuples,
        eq(certifierTupleAcceptance.practiceTupleId, practiceTuples.id),
      )
      .where(and(...conditions));

    return rows.map((row) => ({
      tuple: {
        tupleSlug: row.tupleSlug,
        familyId: row.familyId,
        dimensions: row.dimensions as Record<string, unknown>,
        verdictHanafi: row.verdictHanafi,
        verdictMaliki: row.verdictMaliki,
        verdictShafii: row.verdictShafii,
        verdictHanbali: row.verdictHanbali,
        requiredEvidence: (row.requiredEvidence ?? []) as string[],
        dossierSectionRef: row.dossierSectionRef,
        typicalMortalityPctMin: row.typicalMortalityPctMin,
        typicalMortalityPctMax: row.typicalMortalityPctMax,
        notesFr: row.notesFr,
      },
      acceptance: {
        tupleSlug: row.tupleSlug,
        stance: row.stance,
        evidenceLevel: row.evidenceLevel,
        evidenceDetails: row.evidenceDetails as Record<string, unknown> | null,
      },
    }));
  }

  async getLiveEvents(
    certifierId: string,
    windowMonths: number,
  ): Promise<CertifierEventView[]> {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - windowMonths);
    const cutoffStr = cutoff.toISOString().split("T")[0]; // YYYY-MM-DD

    const rows = await db
      .select({
        scoreImpact: certifierEvents.scoreImpact,
        occurredAt: certifierEvents.occurredAt,
        isActive: certifierEvents.isActive,
      })
      .from(certifierEvents)
      .where(
        and(
          eq(certifierEvents.certifierId, certifierId),
          eq(certifierEvents.isActive, true),
          gte(certifierEvents.occurredAt, cutoffStr),
        ),
      );

    return rows.map((row) => ({
      scoreImpact: row.scoreImpact,
      occurredAt: row.occurredAt, // Already a string (PgDateString)
      isActive: row.isActive,
    }));
  }
}
