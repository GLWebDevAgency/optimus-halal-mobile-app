-- Scholarly References: Generic citation infrastructure for sourcing fiqh decisions.
-- Two tables: scholarly_sources (master catalog) + scholarly_citations (contextual links).

-- Enums
DO $$ BEGIN
  CREATE TYPE "scholarly_source_type" AS ENUM (
    'fiqh_manual', 'hadith_collection', 'quran', 'fatwa',
    'modern_fatwa', 'academic_paper', 'certifier_doc', 'institutional'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE "citation_domain" AS ENUM (
    'trust_score', 'ingredient_ruling', 'additive_ruling',
    'general_fiqh', 'blog', 'certifier_event'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE "scholarly_madhab" AS ENUM (
    'hanafi', 'shafii', 'maliki', 'hanbali', 'cross_school'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

-- Master catalog of scholarly works
CREATE TABLE IF NOT EXISTS "scholarly_sources" (
  "id" varchar(100) PRIMARY KEY NOT NULL,
  "title_ar" varchar(500) NOT NULL,
  "title_fr" varchar(500) NOT NULL,
  "title_en" varchar(500),
  "author_ar" varchar(255),
  "author_fr" varchar(255) NOT NULL,
  "source_type" "scholarly_source_type" NOT NULL,
  "primary_madhab" "scholarly_madhab",
  "century_hijri" integer,
  "year_published" integer,
  "external_url" text,
  "isbn" varchar(20),
  "description_fr" text,
  "description_ar" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

-- Contextual citations linking decisions to source passages
CREATE TABLE IF NOT EXISTS "scholarly_citations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "source_id" varchar(100) NOT NULL,
  "domain" "citation_domain" NOT NULL,
  "context_key" varchar(255) NOT NULL,
  "madhab" "scholarly_madhab",
  "volume" varchar(20),
  "page" varchar(50),
  "chapter" varchar(255),
  "passage_ar" text,
  "passage_fr" text,
  "passage_en" text,
  "relevance_fr" text NOT NULL,
  "relevance_ar" text,
  "display_order" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

-- Foreign key
ALTER TABLE "scholarly_citations" ADD CONSTRAINT "scholarly_citations_source_id_scholarly_sources_id_fk"
  FOREIGN KEY ("source_id") REFERENCES "scholarly_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- Indexes
CREATE INDEX IF NOT EXISTS "scholarly_sources_type_idx" ON "scholarly_sources" USING btree ("source_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scholarly_sources_madhab_idx" ON "scholarly_sources" USING btree ("primary_madhab");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scholarly_citations_domain_key_idx" ON "scholarly_citations" USING btree ("domain", "context_key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scholarly_citations_source_idx" ON "scholarly_citations" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scholarly_citations_madhab_idx" ON "scholarly_citations" USING btree ("madhab");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "scholarly_citations_unique_ctx_idx" ON "scholarly_citations" USING btree ("source_id", "domain", "context_key", "madhab");
