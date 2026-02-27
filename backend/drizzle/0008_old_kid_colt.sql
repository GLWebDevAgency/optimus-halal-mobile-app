DO $$ BEGIN
  CREATE TYPE "public"."match_type" AS ENUM('exact', 'contains', 'word_boundary', 'regex');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ingredient_rulings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"compound_pattern" text NOT NULL,
	"match_type" "match_type" NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"ruling_default" "halal_status" NOT NULL,
	"ruling_hanafi" "halal_status",
	"ruling_shafii" "halal_status",
	"ruling_maliki" "halal_status",
	"ruling_hanbali" "halal_status",
	"confidence" double precision NOT NULL,
	"explanation_fr" text NOT NULL,
	"explanation_en" text,
	"explanation_ar" text,
	"scholarly_reference" text,
	"fatwa_source_url" text,
	"fatwa_source_name" text,
	"overrides_keyword" text,
	"category" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "articles" ALTER COLUMN "author" SET DEFAULT 'Naqiy Team';--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ingredient_rulings_priority_idx" ON "ingredient_rulings" USING btree ("priority");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ingredient_rulings_category_idx" ON "ingredient_rulings" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ingredient_rulings_active_idx" ON "ingredient_rulings" USING btree ("is_active");--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "certifiers" ADD COLUMN "trust_score_hanafi" integer DEFAULT 0 NOT NULL;
EXCEPTION WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "certifiers" ADD COLUMN "trust_score_shafii" integer DEFAULT 0 NOT NULL;
EXCEPTION WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "certifiers" ADD COLUMN "trust_score_maliki" integer DEFAULT 0 NOT NULL;
EXCEPTION WHEN duplicate_column THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "certifiers" ADD COLUMN "trust_score_hanbali" integer DEFAULT 0 NOT NULL;
EXCEPTION WHEN duplicate_column THEN null;
END $$;