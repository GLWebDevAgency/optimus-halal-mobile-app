/**
 * Certifier Score Service — Runtime Trust Score Computation
 *
 * Computes trust scores DYNAMICALLY from raw practice flags + certifier_events.
 * This is the authoritative source of truth for all trust scores in the app.
 *
 * The seed pipeline stores raw flags in `certifiers`, and events in `certifier_events`.
 * This service reads both tables and computes scores at runtime with:
 *   - Per-madhab weight tables (MADHAB_WEIGHTS from certifiers.ts)
 *   - Dynamic controversy penalty with time-decay (computeControversyPenalty)
 *   - Redis caching (TTL 1h — events change rarely)
 *
 * Why runtime instead of seed-time?
 *   1. controversyPenalty uses e^(-λt) time-decay — changes daily
 *   2. If weights are tuned, scores update immediately (no re-seed needed)
 *   3. Separation of concerns: seed = raw data, engine = intelligence
 */

import { eq } from "drizzle-orm";
import type { Database } from "../db/index.js";
import type Redis from "ioredis";
import {
  certifiers,
  certifierEvents,
  computeAllTrustScores,
  computeControversyPenalty,
  type MadhabKey,
} from "../db/schema/certifiers.js";
import { withCache } from "../lib/cache.js";
import { logger } from "../lib/logger.js";

export interface CertifierScores {
  trustScore: number;
  trustScoreHanafi: number;
  trustScoreShafii: number;
  trustScoreMaliki: number;
  trustScoreHanbali: number;
  controversyPenalty: number;
}

export interface CertifierPractices {
  controllersAreEmployees: boolean | null;
  controllersPresentEachProduction: boolean | null;
  hasSalariedSlaughterers: boolean | null;
  acceptsMechanicalSlaughter: boolean | null;
  acceptsElectronarcosis: boolean | null;
  acceptsPostSlaughterElectrocution: boolean | null;
  acceptsStunning: boolean | null;
  acceptsVsm: boolean | null;
  transparencyPublicCharter: boolean | null;
  transparencyAuditReports: boolean | null;
  transparencyCompanyList: boolean | null;
}

export interface CertifierWithScores {
  id: string;
  name: string;
  website: string | null;
  halalAssessment: boolean;
  scores: CertifierScores;
  practices: CertifierPractices;
}

/**
 * Compute trust scores for a certifier from raw DB data + live events.
 *
 * Pipeline:
 *   1. Read certifier raw flags from DB
 *   2. Read all active certifier_events
 *   3. computeControversyPenalty() with time-decay
 *   4. computeAllTrustScores() with dynamic penalty
 *   5. Cache result in Redis (TTL 1h)
 */
export async function getCertifierScores(
  db: Database,
  redis: Redis,
  certifierId: string,
): Promise<CertifierWithScores | null> {
  const cacheKey = `certifier:scores:v5:${certifierId}`;

  return withCache(redis, cacheKey, 3600, async () => {
    // 1. Load raw certifier data
    const certifier = await db.query.certifiers.findFirst({
      where: eq(certifiers.id, certifierId),
      columns: {
        id: true,
        name: true,
        website: true,
        halalAssessment: true,
        controllersAreEmployees: true,
        controllersPresentEachProduction: true,
        hasSalariedSlaughterers: true,
        acceptsMechanicalSlaughter: true,
        acceptsElectronarcosis: true,
        acceptsPostSlaughterElectrocution: true,
        acceptsStunning: true,
        acceptsVsm: true,
        transparencyPublicCharter: true,
        transparencyAuditReports: true,
        transparencyCompanyList: true,
      },
    });

    if (!certifier) return null;

    // 2. Load active events for this certifier
    const events = await db
      .select({
        scoreImpact: certifierEvents.scoreImpact,
        occurredAt: certifierEvents.occurredAt,
        isActive: certifierEvents.isActive,
      })
      .from(certifierEvents)
      .where(eq(certifierEvents.certifierId, certifierId));

    // 3. Compute dynamic controversy penalty with time-decay
    const dynamicPenalty = computeControversyPenalty(
      events.map((e) => ({
        scoreImpact: e.scoreImpact,
        occurredAt: e.occurredAt,
        isActive: e.isActive,
      })),
    );

    // 4. Compute all trust scores with live penalty
    const scores = computeAllTrustScores({
      controllersAreEmployees: certifier.controllersAreEmployees,
      controllersPresentEachProduction: certifier.controllersPresentEachProduction,
      hasSalariedSlaughterers: certifier.hasSalariedSlaughterers,
      acceptsMechanicalPoultrySlaughter: certifier.acceptsMechanicalSlaughter,
      acceptsPoultryElectronarcosis: certifier.acceptsElectronarcosis,
      acceptsPoultryElectrocutionPostSlaughter: certifier.acceptsPostSlaughterElectrocution,
      acceptsStunningForCattleCalvesLambs: certifier.acceptsStunning,
      acceptsVsm: certifier.acceptsVsm,
      transparencyPublicCharter: certifier.transparencyPublicCharter,
      transparencyAuditReports: certifier.transparencyAuditReports,
      transparencyCompanyList: certifier.transparencyCompanyList,
      controversyPenalty: dynamicPenalty,
    });

    return {
      id: certifier.id,
      name: certifier.name,
      website: certifier.website,
      halalAssessment: certifier.halalAssessment,
      scores: {
        ...scores,
        controversyPenalty: dynamicPenalty,
      },
      practices: {
        controllersAreEmployees: certifier.controllersAreEmployees,
        controllersPresentEachProduction: certifier.controllersPresentEachProduction,
        hasSalariedSlaughterers: certifier.hasSalariedSlaughterers,
        acceptsMechanicalSlaughter: certifier.acceptsMechanicalSlaughter,
        acceptsElectronarcosis: certifier.acceptsElectronarcosis,
        acceptsPostSlaughterElectrocution: certifier.acceptsPostSlaughterElectrocution,
        acceptsStunning: certifier.acceptsStunning,
        acceptsVsm: certifier.acceptsVsm,
        transparencyPublicCharter: certifier.transparencyPublicCharter,
        transparencyAuditReports: certifier.transparencyAuditReports,
        transparencyCompanyList: certifier.transparencyCompanyList,
      },
    };
  });
}

/**
 * Batch-compute scores for all active certifiers.
 * Used by the ranking endpoint and the materialization pipeline.
 *
 * Returns certifiers sorted by universal trustScore descending.
 */
export async function getAllCertifierScores(
  db: Database,
  redis: Redis,
): Promise<CertifierWithScores[]> {
  const cacheKey = "certifier:scores:v5:all";

  return withCache(redis, cacheKey, 3600, async () => {
    // 1. Load all active certifiers
    const allCertifiers = await db
      .select({
        id: certifiers.id,
        name: certifiers.name,
        website: certifiers.website,
        halalAssessment: certifiers.halalAssessment,
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
      .from(certifiers)
      .where(eq(certifiers.isActive, true));

    // 2. Load ALL events in one query (avoid N+1)
    const allEvents = await db
      .select({
        certifierId: certifierEvents.certifierId,
        scoreImpact: certifierEvents.scoreImpact,
        occurredAt: certifierEvents.occurredAt,
        isActive: certifierEvents.isActive,
      })
      .from(certifierEvents);

    // Group events by certifierId
    const eventsByCertifier = new Map<string, typeof allEvents>();
    for (const event of allEvents) {
      const list = eventsByCertifier.get(event.certifierId) ?? [];
      list.push(event);
      eventsByCertifier.set(event.certifierId, list);
    }

    // 3. Compute scores for each certifier
    const results: CertifierWithScores[] = allCertifiers.map((c) => {
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

      return {
        id: c.id,
        name: c.name,
        website: c.website,
        halalAssessment: c.halalAssessment,
        scores: {
          ...scores,
          controversyPenalty: dynamicPenalty,
        },
        practices: {
          controllersAreEmployees: c.controllersAreEmployees,
          controllersPresentEachProduction: c.controllersPresentEachProduction,
          hasSalariedSlaughterers: c.hasSalariedSlaughterers,
          acceptsMechanicalSlaughter: c.acceptsMechanicalSlaughter,
          acceptsElectronarcosis: c.acceptsElectronarcosis,
          acceptsPostSlaughterElectrocution: c.acceptsPostSlaughterElectrocution,
          acceptsStunning: c.acceptsStunning,
          acceptsVsm: c.acceptsVsm,
          transparencyPublicCharter: c.transparencyPublicCharter,
          transparencyAuditReports: c.transparencyAuditReports,
          transparencyCompanyList: c.transparencyCompanyList,
        },
      };
    });

    // Sort by universal trustScore descending
    results.sort((a, b) => b.scores.trustScore - a.scores.trustScore);

    return results;
  });
}
