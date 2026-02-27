/**
 * Unified Reference Data Seeder
 *
 * Consolidates ALL reference data seeds into a single pipeline.
 * Called by entrypoint.ts on every deploy (idempotent — safe to re-run).
 *
 * Pipeline:
 *   1. Certifiers (18 French halal certifiers — raw flags only)
 *   2. Stores (AVS + Achahada halal stores)
 *   3. Boycott targets (BDS movement data)
 *   4. Additives + Madhab rulings (200+ E-numbers)
 *   5. Alert categories + Alerts (Al-Kanz + RappelConso)
 *   6. Articles (editorial content)
 *   7. Ingredient Rulings (47 scholarly-sourced halal rulings)
 *   8. Certifier Events (controversy timeline for radical transparency)
 *   9. Scholarly References (sources catalog + trust score citations)
 *  10. Materialize Trust Scores (compute from raw flags + events, update DB columns)
 *
 * All seeds use ON CONFLICT DO UPDATE (upsert) — safe to re-run on every deploy.
 * Trust scores are computed at runtime by certifier-score.service.ts, but
 * materialized into DB columns here for list endpoints (history, ranking cache).
 */

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { eq, sql } from "drizzle-orm";

interface SeedStats {
  phase: string;
  count: number;
  durationMs: number;
}

export async function seedReferenceData(db: PostgresJsDatabase): Promise<SeedStats[]> {
  const stats: SeedStats[] = [];

  // ── Phase 1: Certifiers ─────────────────────────────────
  const t1 = Date.now();
  try {
    const { seedCertifiers } = await import("./seed-certifiers.js");
    const count = await seedCertifiers(db);
    stats.push({ phase: "Certifiers", count, durationMs: Date.now() - t1 });
    console.log(`    Certifiers: ${count} upserted (${Date.now() - t1}ms)`);
  } catch (err) {
    console.warn(`    Certifiers: skipped (${(err as Error).message})`);
  }

  // ── Phase 2: Stores ─────────────────────────────────────
  const t2 = Date.now();
  try {
    const { seedStores } = await import("./seed-stores.js");
    const count = await seedStores(db);
    stats.push({ phase: "Stores", count, durationMs: Date.now() - t2 });
    console.log(`    Stores: ${count} upserted (${Date.now() - t2}ms)`);
  } catch (err) {
    console.warn(`    Stores: skipped (${(err as Error).message})`);
  }

  // ── Phase 3: Boycott targets ────────────────────────────
  const t3 = Date.now();
  try {
    const { seedBoycottTargets } = await import("./seed-boycott.js");
    const count = await seedBoycottTargets(db);
    stats.push({ phase: "Boycott", count, durationMs: Date.now() - t3 });
    console.log(`    Boycott: ${count} upserted (${Date.now() - t3}ms)`);
  } catch (err) {
    console.warn(`    Boycott: skipped (${(err as Error).message})`);
  }

  // ── Phase 4: Additives + Madhab rulings ─────────────────
  const t4 = Date.now();
  try {
    const { seedAdditives } = await import("./seed-additives.js");
    const count = await seedAdditives(db);
    stats.push({ phase: "Additives", count, durationMs: Date.now() - t4 });
    console.log(`    Additives: ${count} upserted (${Date.now() - t4}ms)`);
  } catch (err) {
    console.warn(`    Additives: skipped (${(err as Error).message})`);
  }

  // ── Phase 5: Alert categories + Alerts ──────────────────
  const t5 = Date.now();
  try {
    const { seedAlerts } = await import("./seed-alerts.js");
    const count = await seedAlerts(db);
    stats.push({ phase: "Alerts", count, durationMs: Date.now() - t5 });
    console.log(`    Alerts: ${count} upserted (${Date.now() - t5}ms)`);
  } catch (err) {
    console.warn(`    Alerts: skipped (${(err as Error).message})`);
  }

  // ── Phase 6: Articles ───────────────────────────────────
  const t6 = Date.now();
  try {
    const { seedArticles } = await import("./seed-articles.js");
    const count = await seedArticles(db);
    stats.push({ phase: "Articles", count, durationMs: Date.now() - t6 });
    console.log(`    Articles: ${count} upserted (${Date.now() - t6}ms)`);
  } catch (err) {
    console.warn(`    Articles: skipped (${(err as Error).message})`);
  }

  // ── Phase 7: Ingredient Rulings ─────────────────────────
  const t7 = Date.now();
  try {
    const { seedIngredientRulings } = await import("./seed-ingredient-rulings.js");
    const count = await seedIngredientRulings(db);
    stats.push({ phase: "Ingredient Rulings", count, durationMs: Date.now() - t7 });
    console.log(`    Ingredient Rulings: ${count} upserted (${Date.now() - t7}ms)`);
  } catch (err) {
    console.warn(`    Ingredient Rulings: skipped (${(err as Error).message})`);
  }

  // ── Phase 8: Certifier Events ──────────────────────────
  const t8 = Date.now();
  try {
    const { seedCertifierEvents } = await import("./seed-certifier-events.js");
    const count = await seedCertifierEvents(db);
    stats.push({ phase: "Certifier Events", count, durationMs: Date.now() - t8 });
    console.log(`    Certifier Events: ${count} upserted (${Date.now() - t8}ms)`);
  } catch (err) {
    console.warn(`    Certifier Events: skipped (${(err as Error).message})`);
  }

  // ── Phase 9: Scholarly References ──────────────────────
  const t9 = Date.now();
  try {
    const { seedScholarly } = await import("./seed-scholarly.js");
    const count = await seedScholarly(db);
    stats.push({ phase: "Scholarly", count, durationMs: Date.now() - t9 });
    console.log(`    Scholarly: ${count} upserted (${Date.now() - t9}ms)`);
  } catch (err) {
    console.warn(`    Scholarly: skipped (${(err as Error).message})`);
  }

  // ── Phase 10: Materialize Trust Scores ─────────────────
  // Computes scores from raw flags + certifier_events with time-decay,
  // then UPDATE the certifiers table columns for list endpoints.
  // This is the same engine used at runtime — scores are consistent.
  const t10 = Date.now();
  try {
    const { materializeTrustScores } = await import("./materialize-scores.js");
    const count = await materializeTrustScores(db);
    stats.push({ phase: "Trust Scores", count, durationMs: Date.now() - t10 });
    console.log(`    Trust Scores: ${count} materialized (${Date.now() - t10}ms)`);
  } catch (err) {
    console.warn(`    Trust Scores: skipped (${(err as Error).message})`);
  }

  // ── Summary ─────────────────────────────────────────────
  const totalCount = stats.reduce((sum, s) => sum + s.count, 0);
  console.log(`    ─── Total: ${totalCount} records across ${stats.length} phases`);

  return stats;
}
