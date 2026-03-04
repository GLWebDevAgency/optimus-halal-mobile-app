-- Google Places Enrichment + B2B Store Plans
-- Adds Google Places data columns to stores, creates google_reviews table,
-- and introduces the store_plan enum for B2B tiering.

-- Enum: store_plan
DO $$ BEGIN
  CREATE TYPE "store_plan" AS ENUM ('free', 'essential', 'premium');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

-- Google Places enrichment columns on stores
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "google_place_id" varchar(255);--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "google_maps_url" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "google_rating" real;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "google_review_count" integer;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "google_photos" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "google_enriched_at" timestamp with time zone;--> statement-breakpoint

-- B2B plan columns on stores
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "plan_level" "store_plan" NOT NULL DEFAULT 'free';--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "plan_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "plan_claimed_by" uuid;--> statement-breakpoint

-- FK: plan_claimed_by → users(id)
DO $$ BEGIN
  ALTER TABLE "stores" ADD CONSTRAINT "stores_plan_claimed_by_users_id_fk"
    FOREIGN KEY ("plan_claimed_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

-- Indexes on stores
CREATE UNIQUE INDEX IF NOT EXISTS "stores_google_place_id_idx" ON "stores" USING btree ("google_place_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stores_plan_level_idx" ON "stores" USING btree ("plan_level");--> statement-breakpoint

-- Google Reviews table
CREATE TABLE IF NOT EXISTS "google_reviews" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "store_id" uuid NOT NULL,
  "google_review_id" varchar(500) NOT NULL,
  "author_name" varchar(255) NOT NULL,
  "author_photo_uri" text,
  "rating" integer NOT NULL,
  "text" text,
  "publish_time" timestamp with time zone,
  "relative_time" varchar(100),
  "language_code" varchar(10) DEFAULT 'fr',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

-- FK: google_reviews.store_id → stores(id) CASCADE
DO $$ BEGIN
  ALTER TABLE "google_reviews" ADD CONSTRAINT "google_reviews_store_id_stores_id_fk"
    FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

-- Indexes on google_reviews
CREATE INDEX IF NOT EXISTS "google_reviews_store_idx" ON "google_reviews" USING btree ("store_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "google_reviews_review_id_idx" ON "google_reviews" USING btree ("google_review_id");--> statement-breakpoint

-- Brand-Certifier Mapping table (Tier 1c fallback)
CREATE TABLE IF NOT EXISTS "brand_certifiers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "brand_pattern" varchar(255) NOT NULL,
  "certifier_id" varchar(100) NOT NULL,
  "country_code" varchar(5) NOT NULL DEFAULT 'FR',
  "product_scope" varchar(100) NOT NULL DEFAULT '_all',
  "source" varchar(50) NOT NULL,
  "source_url" text,
  "verification_status" varchar(20) NOT NULL DEFAULT 'confirmed',
  "confidence" real NOT NULL DEFAULT 1.0,
  "effective_from" date,
  "effective_until" date,
  "notes" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

-- FK: brand_certifiers.certifier_id → certifiers(id) CASCADE
DO $$ BEGIN
  ALTER TABLE "brand_certifiers" ADD CONSTRAINT "brand_certifiers_certifier_id_certifiers_id_fk"
    FOREIGN KEY ("certifier_id") REFERENCES "certifiers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

-- Indexes on brand_certifiers
CREATE INDEX IF NOT EXISTS "brand_certifiers_pattern_idx" ON "brand_certifiers" USING btree ("brand_pattern");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brand_certifiers_certifier_idx" ON "brand_certifiers" USING btree ("certifier_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brand_certifiers_active_idx" ON "brand_certifiers" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "brand_certifiers_unique_idx" ON "brand_certifiers" USING btree ("brand_pattern", "certifier_id", "country_code", "product_scope");
