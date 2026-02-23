/**
 * Unified Reference Data Seeder
 *
 * Consolidates ALL reference data seeds into a single pipeline.
 * Called by entrypoint.ts on every deploy (idempotent — safe to re-run).
 *
 * Pipeline:
 *   1. Certifiers (18 French halal certifiers)
 *   2. Stores (AVS + Achahada halal stores)
 *   3. Boycott targets (BDS movement data)
 *   4. Additives + Madhab rulings (200+ E-numbers)
 *   5. Alert categories + Alerts (Al-Kanz + RappelConso)
 *   6. Articles (editorial content)
 *   7. Ingredient Rulings (47 scholarly-sourced halal rulings)
 *
 * All seeds use ON CONFLICT DO UPDATE (upsert) — safe to re-run on every deploy.
 */

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";

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

  // ── Summary ─────────────────────────────────────────────
  const totalCount = stats.reduce((sum, s) => sum + s.count, 0);
  console.log(`    ─── Total: ${totalCount} records across ${stats.length} phases`);

  return stats;
}
