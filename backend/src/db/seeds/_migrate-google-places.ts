/**
 * Migration: Add Google Places enrichment columns + google_reviews table
 *
 * This is a one-time migration script that adds:
 *   - store_plan enum
 *   - Google Places columns to stores table
 *   - B2B plan columns to stores table
 *   - google_reviews table with indexes
 *
 * Usage:
 *   pnpm tsx --env-file=.env src/db/seeds/_migrate-google-places.ts
 */

import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL is required in .env");
  process.exit(1);
}

async function main() {
  const sql = postgres(DATABASE_URL!, { max: 1 });

  console.log("━━━ Migration: Google Places + B2B columns ━━━\n");

  // 1. Create store_plan enum
  console.log("  [1/4] Creating store_plan enum...");
  await sql`
    DO $$ BEGIN
      CREATE TYPE store_plan AS ENUM ('free', 'essential', 'premium');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `;
  console.log("        ✅ store_plan enum ready");

  // 2. Add Google Places columns to stores
  console.log("  [2/4] Adding Google Places columns to stores...");
  const googleCols = [
    { name: "google_place_id", def: "VARCHAR(255)" },
    { name: "google_maps_url", def: "TEXT" },
    { name: "google_rating", def: "REAL" },
    { name: "google_review_count", def: "INTEGER" },
    { name: "google_photos", def: "JSONB DEFAULT '[]'::jsonb" },
    { name: "google_enriched_at", def: "TIMESTAMPTZ" },
    { name: "plan_level", def: "store_plan NOT NULL DEFAULT 'free'" },
    { name: "plan_expires_at", def: "TIMESTAMPTZ" },
    { name: "plan_claimed_by", def: `UUID REFERENCES users(id)` },
  ];

  for (const col of googleCols) {
    await sql.unsafe(`
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS ${col.name} ${col.def}
    `);
  }
  console.log("        ✅ 9 columns added/verified");

  // 3. Add indexes
  console.log("  [3/4] Creating indexes...");
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS stores_google_place_id_idx ON stores (google_place_id)`;
  await sql`CREATE INDEX IF NOT EXISTS stores_plan_level_idx ON stores (plan_level)`;
  console.log("        ✅ Indexes created");

  // 4. Create google_reviews table
  console.log("  [4/4] Creating google_reviews table...");
  await sql`
    CREATE TABLE IF NOT EXISTS google_reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      google_review_id VARCHAR(500) NOT NULL,
      author_name VARCHAR(255) NOT NULL,
      author_photo_uri TEXT,
      rating INTEGER NOT NULL,
      text TEXT,
      publish_time TIMESTAMPTZ,
      relative_time VARCHAR(100),
      language_code VARCHAR(10) DEFAULT 'fr',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS google_reviews_store_idx ON google_reviews (store_id)`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS google_reviews_review_id_idx ON google_reviews (google_review_id)`;
  console.log("        ✅ google_reviews table ready");

  // 5. Create brand_certifiers table
  console.log("  [5/5] Creating brand_certifiers table...");
  await sql`
    CREATE TABLE IF NOT EXISTS brand_certifiers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      brand_pattern VARCHAR(255) NOT NULL,
      certifier_id VARCHAR(100) NOT NULL REFERENCES certifiers(id) ON DELETE CASCADE,
      country_code VARCHAR(5) NOT NULL DEFAULT 'FR',
      product_scope VARCHAR(100) NOT NULL DEFAULT '_all',
      source VARCHAR(50) NOT NULL,
      source_url TEXT,
      verification_status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
      confidence REAL NOT NULL DEFAULT 1.0,
      effective_from DATE,
      effective_until DATE,
      notes TEXT,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS brand_certifiers_pattern_idx ON brand_certifiers (brand_pattern)`;
  await sql`CREATE INDEX IF NOT EXISTS brand_certifiers_certifier_idx ON brand_certifiers (certifier_id)`;
  await sql`CREATE INDEX IF NOT EXISTS brand_certifiers_active_idx ON brand_certifiers (is_active)`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS brand_certifiers_unique_idx ON brand_certifiers (brand_pattern, certifier_id, country_code, product_scope)`;
  console.log("        ✅ brand_certifiers table ready");

  // Verify
  const [storeColCount] = await sql`
    SELECT count(*)::int AS count
    FROM information_schema.columns
    WHERE table_name = 'stores'
  `;
  const [reviewTableExists] = await sql`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_name = 'google_reviews'
    ) AS exists
  `;

  console.log(`\n  ✅ Migration complete`);
  console.log(`     stores: ${storeColCount.count} columns`);
  console.log(`     google_reviews: ${reviewTableExists.exists ? "EXISTS" : "MISSING"}`);

  await sql.end();
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
