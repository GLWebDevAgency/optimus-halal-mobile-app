/**
 * DB Entrypoint — Migrate + Seed + Verify
 *
 * Runs automatically before server start (Railway preDeployCommand).
 * Pattern: migrate → seed reference data → verify schema → exit.
 *
 * Usage:
 *   node dist/db/entrypoint.js          # Production (Railway)
 *   tsx src/db/entrypoint.ts             # Local dev
 *   NODE_ENV=test tsx src/db/entrypoint.ts  # Test DB setup
 *
 * Environment-aware:
 *   - production: migrate + seed reference data (certifiers, stores, boycott, additives, alerts, articles)
 *   - development: migrate + seed reference data
 *   - test: migrate only (tests manage their own data)
 *
 * All seeds are idempotent (ON CONFLICT DO UPDATE / DO NOTHING).
 */

import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { sql } from "drizzle-orm";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const nodeEnv = process.env.NODE_ENV ?? "development";
const isTest = nodeEnv === "test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = resolve(__dirname, "../../drizzle");

const client = postgres(url, { max: 1, prepare: false });
const db = drizzle(client);

const startTime = Date.now();

console.log("━━━ Optimus Halal — DB Entrypoint ━━━");
console.log(`  Environment: ${nodeEnv}`);
console.log(`  Migrations:  ${migrationsFolder}`);
console.log("");

// ── Phase 1: Migrate ──────────────────────────────────────

console.log("▶ Phase 1: Applying migrations...");
try {
  await migrate(db, { migrationsFolder });
  console.log("  ✅ Migrations applied\n");
} catch (err) {
  console.error("  ❌ Migration failed:", err);
  await client.end();
  process.exit(1);
}

// ── Phase 2: Seed reference data (skip in test) ───────────

if (!isTest) {
  console.log("▶ Phase 2: Seeding reference data...");
  try {
    // Dynamic import to keep entrypoint lean in test mode
    const { seedReferenceData } = await import("./seeds/run-all.js");
    await seedReferenceData(db);
    console.log("  ✅ Reference data seeded\n");
  } catch (err) {
    console.error("  ❌ Seed failed:", err);
    // Seed failure is non-fatal in development (tables may not exist yet)
    if (nodeEnv === "production") {
      await client.end();
      process.exit(1);
    }
    console.log("  ⚠️ Continuing despite seed error (non-production)\n");
  }
} else {
  console.log("▶ Phase 2: Skipping seeds (test environment)\n");
}

// ── Phase 3: Verify schema ────────────────────────────────

console.log("▶ Phase 3: Verifying schema...");
try {
  const result = await db.execute(sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);
  const tables = result.map((r: Record<string, unknown>) => r.table_name as string);
  const requiredTables = ["users", "products", "refresh_tokens", "scans", "additives", "stores"];
  const missing = requiredTables.filter((t) => !tables.includes(t));

  if (missing.length > 0) {
    console.error(`  ❌ Missing required tables: ${missing.join(", ")}`);
    await client.end();
    process.exit(1);
  }

  console.log(`  ✅ ${tables.length} tables verified (${requiredTables.length} required present)\n`);
} catch (err) {
  console.error("  ❌ Schema verification failed:", err);
  await client.end();
  process.exit(1);
}

// ── Done ──────────────────────────────────────────────────

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`━━━ DB Entrypoint complete (${elapsed}s) ━━━`);

await client.end();
process.exit(0);
