-- Products V2: Denormalized fields for search, filtering, and enrichment
-- Migration is ADDITIVE only — no columns removed, no renames
-- All new columns are nullable (no backfill required for existing rows)

-- ── Bloc A: Identite produit enrichie ────────────────────────
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "generic_name" varchar(500);
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "brand_owner" varchar(255);
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "quantity" varchar(100);
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "serving_size" varchar(100);
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "countries_tags" text[];

-- ── Bloc B: Ingredients & Allergenes (halal-critical) ────────
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "ingredients_text" text;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "allergens_tags" text[];
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "traces_tags" text[];
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "additives_tags" text[];
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "ingredients_analysis_tags" text[];

-- ── Bloc C: Nutrition denormalisee ───────────────────────────
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "nutriscore_grade" varchar(1);
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "nova_group" smallint;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "ecoscore_grade" varchar(1);
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "energy_kcal_100g" real;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "fat_100g" real;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "saturated_fat_100g" real;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "carbohydrates_100g" real;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "sugars_100g" real;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "fiber_100g" real;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "proteins_100g" real;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "salt_100g" real;

-- ── Bloc D: Labels & Certifications ─────────────────────────
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "labels_tags" text[];
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "emb_codes" varchar(255);

-- ── Bloc E: Origine & Tracabilite ───────────────────────────
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "origins_tags" text[];
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "manufacturing_places" varchar(500);

-- ── Bloc F: Images multi-sources ────────────────────────────
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "image_ingredients_url" text;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "image_nutrition_url" text;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "image_front_url" text;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "image_r2_key" varchar(255);

-- ── Bloc G: Qualite & Provenance ────────────────────────────
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "completeness" real;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "data_sources" text[] DEFAULT '{}';
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "off_last_modified" timestamptz;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "analysis_version" smallint DEFAULT 1;

-- ── Index V2 ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "products_brand_idx" ON "products" ("brand");
CREATE INDEX IF NOT EXISTS "products_completeness_idx" ON "products" ("completeness");
CREATE INDEX IF NOT EXISTS "products_countries_gin_idx" ON "products" USING gin ("countries_tags");
CREATE INDEX IF NOT EXISTS "products_labels_gin_idx" ON "products" USING gin ("labels_tags");
CREATE INDEX IF NOT EXISTS "products_allergens_gin_idx" ON "products" USING gin ("allergens_tags");
CREATE INDEX IF NOT EXISTS "products_additives_gin_idx" ON "products" USING gin ("additives_tags");
