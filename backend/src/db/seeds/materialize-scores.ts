/**
 * Materialize Trust Scores — Post-seed score computation
 *
 * Reads raw practice flags from `certifiers` + active events from
 * `certifier_events`, computes all 5 trust scores using the V4 engine
 * (with dynamic controversy time-decay), and UPDATEs the score columns.
 *
 * This runs as Phase 10 of the seed pipeline (after certifiers + events
 * are both seeded). The score columns serve as a materialized cache for
 * list endpoints (scan history, ranking fallback). The authoritative
 * source of truth for single-certifier lookups remains the runtime
 * engine in certifier-score.service.ts.
 *
 * No Redis dependency — this runs in the entrypoint.ts context
 * (pre-deploy, before the server starts).
 */

import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
  certifiers,
  certifierEvents,
  computeAllTrustScores,
  computeControversyPenalty,
} from "../schema/certifiers.js";

export async function materializeTrustScores(db: PostgresJsDatabase): Promise<number> {
  // 1. Load all certifiers (raw flags)
  const allCertifiers = await db
    .select({
      id: certifiers.id,
      controllersAreEmployees: certifiers.controllersAreEmployees,
      controllersPresentEachProduction: certifiers.controllersPresentEachProduction,
      hasSalariedSlaughterers: certifiers.hasSalariedSlaughterers,
      acceptsMechanicalSlaughter: certifiers.acceptsMechanicalSlaughter,
      acceptsElectronarcosis: certifiers.acceptsElectronarcosis,
      acceptsPostSlaughterElectrocution: certifiers.acceptsPostSlaughterElectrocution,
      acceptsStunning: certifiers.acceptsStunning,
      acceptsVsm: certifiers.acceptsVsm,
      transparencyPublicCharter: certifiers.transparencyPublicCharter,
      transparencyAuditReports: certifiers.transparencyAuditReports,
      transparencyCompanyList: certifiers.transparencyCompanyList,
    })
    .from(certifiers);

  // 2. Load all events in one query (avoid N+1)
  const allEvents = await db
    .select({
      certifierId: certifierEvents.certifierId,
      scoreImpact: certifierEvents.scoreImpact,
      occurredAt: certifierEvents.occurredAt,
      isActive: certifierEvents.isActive,
    })
    .from(certifierEvents);

  // Group events by certifier
  const eventsByCertifier = new Map<string, typeof allEvents>();
  for (const event of allEvents) {
    const list = eventsByCertifier.get(event.certifierId) ?? [];
    list.push(event);
    eventsByCertifier.set(event.certifierId, list);
  }

  // 3. Compute and update each certifier
  let count = 0;
  for (const c of allCertifiers) {
    const events = eventsByCertifier.get(c.id) ?? [];
    const dynamicPenalty = computeControversyPenalty(
      events.map((e) => ({
        scoreImpact: e.scoreImpact,
        occurredAt: e.occurredAt,
        isActive: e.isActive,
      })),
    );

    const scores = computeAllTrustScores({
      controllersAreEmployees: c.controllersAreEmployees,
      controllersPresentEachProduction: c.controllersPresentEachProduction,
      hasSalariedSlaughterers: c.hasSalariedSlaughterers,
      acceptsMechanicalPoultrySlaughter: c.acceptsMechanicalSlaughter,
      acceptsPoultryElectronarcosis: c.acceptsElectronarcosis,
      acceptsPoultryElectrocutionPostSlaughter: c.acceptsPostSlaughterElectrocution,
      acceptsStunningForCattleCalvesLambs: c.acceptsStunning,
      acceptsVsm: c.acceptsVsm,
      transparencyPublicCharter: c.transparencyPublicCharter,
      transparencyAuditReports: c.transparencyAuditReports,
      transparencyCompanyList: c.transparencyCompanyList,
      controversyPenalty: dynamicPenalty,
    });

    await db
      .update(certifiers)
      .set({
        trustScore: scores.trustScore,
        trustScoreHanafi: scores.trustScoreHanafi,
        trustScoreShafii: scores.trustScoreShafii,
        trustScoreMaliki: scores.trustScoreMaliki,
        trustScoreHanbali: scores.trustScoreHanbali,
        controversyPenalty: dynamicPenalty,
        updatedAt: new Date(),
      })
      .where(eq(certifiers.id, c.id));

    count++;
  }

  return count;
}
