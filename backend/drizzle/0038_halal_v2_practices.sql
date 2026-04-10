-- Migration: 0038_halal_v2_practices.sql
-- Halal Engine V2 — Practice knowledge base tables
-- Creates: practice_families, practices, practice_dossiers, practice_tuples + all indexes.

-- ── practice_families ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "practice_families" (
  "id"                varchar(50)   PRIMARY KEY,
  "name_fr"           varchar(100)  NOT NULL,
  "name_en"           varchar(100)  NOT NULL,
  "dimension_schema"  jsonb,
  "is_active"         boolean       DEFAULT true NOT NULL
);

-- ── practices ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "practices" (
  "id"                varchar(50)   PRIMARY KEY,
  "slug"              varchar(50)   NOT NULL UNIQUE,
  "family_id"         varchar(50)   NOT NULL REFERENCES "practice_families"("id"),
  "name_fr"           varchar(255)  NOT NULL,
  "name_en"           varchar(255)  NOT NULL,
  "name_ar"           varchar(255),
  "severity_tier"     smallint      NOT NULL,
  "active_dossier_id" uuid,
  "is_active"         boolean       DEFAULT true NOT NULL,
  "created_at"        timestamptz   DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "practices_family_idx"
  ON "practices" ("family_id");

-- ── practice_dossiers ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "practice_dossiers" (
  "id"              uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  "practice_id"     varchar(50)   NOT NULL REFERENCES "practices"("id") ON DELETE CASCADE,
  "version"         varchar(20)   NOT NULL,
  "schema_version"  varchar(30)   NOT NULL,
  "dossier_json"    jsonb         NOT NULL,
  "content_hash"    varchar(64)   NOT NULL,
  "verified_at"     timestamptz,
  "is_active"       boolean       DEFAULT false NOT NULL,
  "created_at"      timestamptz   DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "practice_dossiers_practice_version_idx"
  ON "practice_dossiers" ("practice_id", "version");

-- ── practice_tuples ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "practice_tuples" (
  "id"                          uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  "slug"                        varchar(80)   NOT NULL UNIQUE,
  "family_id"                   varchar(50)   NOT NULL REFERENCES "practice_families"("id"),
  "dimensions"                  jsonb         NOT NULL,
  "verdict_hanafi"              smallint      NOT NULL,
  "verdict_maliki"              smallint      NOT NULL,
  "verdict_shafii"              smallint      NOT NULL,
  "verdict_hanbali"             smallint      NOT NULL,
  "required_evidence"           text[]        DEFAULT '{}',
  "dossier_id"                  uuid          REFERENCES "practice_dossiers"("id"),
  "dossier_section_ref"         varchar(200)  NOT NULL,
  "fatwa_refs"                  text[]        DEFAULT '{}',
  "typical_mortality_pct_min"   real,
  "typical_mortality_pct_max"   real,
  "notes_fr"                    text,
  "notes_en"                    text,
  "notes_ar"                    text,
  "is_active"                   boolean       DEFAULT true NOT NULL,
  "created_at"                  timestamptz   DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "pt_family_idx"
  ON "practice_tuples" ("family_id");

CREATE INDEX IF NOT EXISTS "pt_dims_gin_idx"
  ON "practice_tuples" USING GIN ("dimensions");
