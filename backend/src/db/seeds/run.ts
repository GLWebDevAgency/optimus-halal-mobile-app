/**
 * Seed Runner — Enterprise-grade data ingestion
 *
 * Usage: pnpm tsx src/db/seeds/run.ts
 *
 * Idempotent: uses ON CONFLICT upserts, safe to re-run.
 * Logs pipeline stats for monitoring.
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { sql } from "drizzle-orm";
import { loadCertifierSeedData } from "./certifiers.js";
import { loadStoreSeedData } from "./stores-halal.js";
import { BDS_SEED_DATA } from "./boycott-bds.js";
import { certifiers } from "../schema/certifiers.js";
import { stores } from "../schema/stores.js";
import { boycottTargets } from "../schema/boycott.js";
import * as schema from "../schema/index.js";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  const db = drizzle(client, { schema });

  console.log("━━━ Naqiy — Seed Pipeline ━━━\n");

  // ── Phase 1: Certifiers ─────────────────────────────────
  console.log("▶ Phase 1: Certifiers (certification-list.json)");
  const certifierData = await loadCertifierSeedData();
  console.log(`  Loaded ${certifierData.length} certifiers`);

  for (const certifier of certifierData) {
    await db
      .insert(certifiers)
      .values(certifier)
      .onConflictDoUpdate({
        target: certifiers.id,
        set: {
          name: certifier.name,
          website: certifier.website,
          creationYear: certifier.creationYear,
          controllersAreEmployees: certifier.controllersAreEmployees,
          controllersPresentEachProduction: certifier.controllersPresentEachProduction,
          hasSalariedSlaughterers: certifier.hasSalariedSlaughterers,
          acceptsMechanicalSlaughter: certifier.acceptsMechanicalSlaughter,
          acceptsElectronarcosis: certifier.acceptsElectronarcosis,
          acceptsPostSlaughterElectrocution: certifier.acceptsPostSlaughterElectrocution,
          acceptsStunning: certifier.acceptsStunning,
          halalAssessment: certifier.halalAssessment,
          trustScore: certifier.trustScore,
          notes: certifier.notes,
          updatedAt: new Date(),
        },
      });
  }

  // Print ranking
  const ranked = certifierData
    .sort((a, b) => (b.trustScore ?? 0) - (a.trustScore ?? 0))
    .map((c, i) => `  ${i + 1}. ${c.name} — Score: ${c.trustScore}/100 ${c.halalAssessment ? "✓" : "✗"}`);
  console.log(`\n  ── Trust Score Ranking ──`);
  ranked.forEach((r) => console.log(r));

  // ── Phase 2: Stores ─────────────────────────────────────
  console.log("\n▶ Phase 2: Halal Stores (AVS + Achahada)");
  const { stores: storeData, stats } = await loadStoreSeedData();

  console.log(`  Raw entries:       ${stats.totalRaw}`);
  console.log(`  Filtered inactive: ${stats.filteredInactive}`);
  console.log(`  Filtered bad geo:  ${stats.filteredBadGeo}`);
  console.log(`  Deduplicated:      ${stats.deduplicated}`);
  console.log(`  Final count:       ${stats.finalCount}`);
  console.log(`  By source:`, stats.bySource);
  console.log(`  By type:`, stats.byType);

  let inserted = 0;
  let updated = 0;
  for (const store of storeData) {
    const result = await db
      .insert(stores)
      .values(store)
      .onConflictDoUpdate({
        target: stores.sourceId,
        set: {
          name: store.name,
          address: store.address,
          city: store.city,
          postalCode: store.postalCode,
          latitude: store.latitude,
          longitude: store.longitude,
          phone: store.phone,
          email: store.email,
          website: store.website,
          logoUrl: store.logoUrl,
          description: store.description,
          rawData: store.rawData,
          updatedAt: new Date(),
        },
      })
      .returning({ id: stores.id });

    if (result.length > 0) inserted++;
  }

  console.log(`  Upserted: ${inserted} stores`);

  // ── Phase 3: Boycott Targets ──────────────────────────────
  console.log("\n▶ Phase 3: Boycott Targets (BDS seed data)");
  console.log(`  Loaded ${BDS_SEED_DATA.length} targets`);

  let boycottInserted = 0;
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
    boycottInserted++;
  }
  console.log(`  Upserted: ${boycottInserted} boycott targets`);

  // ── Summary ─────────────────────────────────────────────
  const [certCount] = await db.select({ count: sql<number>`count(*)::int` }).from(certifiers);
  const [storeCount] = await db.select({ count: sql<number>`count(*)::int` }).from(stores);
  const [boycottCount] = await db.select({ count: sql<number>`count(*)::int` }).from(boycottTargets);

  console.log("\n━━━ Seed Complete ━━━");
  console.log(`  Total certifiers in DB:      ${certCount.count}`);
  console.log(`  Total stores in DB:          ${storeCount.count}`);
  console.log(`  Total boycott targets in DB: ${boycottCount.count}`);

  await client.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
