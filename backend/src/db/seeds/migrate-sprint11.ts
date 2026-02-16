import { sql } from "drizzle-orm";
import { db } from "../index.js";

async function migrateSpring11() {
  console.log("🔧 Sprint 11 — Creating enums, tables, and columns...\n");

  const queries = [
    // Enums
    `DO $$ BEGIN CREATE TYPE additive_category AS ENUM ('colorant','preservative','antioxidant','emulsifier','stabilizer','thickener','flavor_enhancer','sweetener','acid','anti_caking','glazing_agent','humectant','raising_agent','sequestrant','other'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN CREATE TYPE additive_origin AS ENUM ('plant','animal','synthetic','mineral','insect','mixed'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN CREATE TYPE toxicity_level AS ENUM ('safe','low_concern','moderate_concern','high_concern'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN CREATE TYPE efsa_status AS ENUM ('approved','under_review','restricted','banned'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN CREATE TYPE madhab AS ENUM ('hanafi','shafii','maliki','hanbali','general'); EXCEPTION WHEN duplicate_object THEN null; END $$`,

    // Additives table
    `CREATE TABLE IF NOT EXISTS additives (
      code VARCHAR(10) PRIMARY KEY,
      name_fr VARCHAR(255) NOT NULL,
      name_en VARCHAR(255),
      name_ar VARCHAR(255),
      category additive_category NOT NULL,
      halal_status_default halal_status NOT NULL,
      halal_explanation_fr TEXT,
      halal_explanation_en TEXT,
      origin additive_origin NOT NULL,
      origin_details TEXT,
      toxicity_level toxicity_level NOT NULL DEFAULT 'safe',
      adi_mg_per_kg DOUBLE PRECISION,
      risk_pregnant BOOLEAN NOT NULL DEFAULT FALSE,
      risk_children BOOLEAN NOT NULL DEFAULT FALSE,
      risk_allergic BOOLEAN NOT NULL DEFAULT FALSE,
      health_effects_fr TEXT,
      health_effects_en TEXT,
      efsa_status efsa_status NOT NULL DEFAULT 'approved',
      banned_countries TEXT[],
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,

    // Madhab rulings table
    `CREATE TABLE IF NOT EXISTS additive_madhab_rulings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      additive_code VARCHAR(10) NOT NULL REFERENCES additives(code) ON DELETE CASCADE,
      madhab madhab NOT NULL,
      ruling halal_status NOT NULL,
      explanation_fr TEXT NOT NULL,
      explanation_en TEXT,
      scholarly_reference TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS madhab_ruling_unique_idx ON additive_madhab_rulings(additive_code, madhab)`,

    // Users new columns
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS madhab madhab NOT NULL DEFAULT 'general'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_pregnant BOOLEAN NOT NULL DEFAULT FALSE`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS has_children BOOLEAN NOT NULL DEFAULT FALSE`,
  ];

  for (const q of queries) {
    try {
      await db.execute(sql.raw(q));
      const label = q.replace(/\s+/g, " ").substring(0, 70);
      console.log(`  ✅ ${label}...`);
    } catch (err: any) {
      if (err.code === "42710" || err.code === "42701") {
        // duplicate_object or duplicate_column — already exists, skip
        console.log(`  ⏭️  Already exists, skipping...`);
      } else {
        throw err;
      }
    }
  }

  console.log("\n🎉 Sprint 11 schema migration complete!");
  process.exit(0);
}

migrateSpring11();
