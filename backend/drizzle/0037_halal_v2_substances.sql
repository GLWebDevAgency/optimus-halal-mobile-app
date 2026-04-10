-- Migration: 0037_halal_v2_substances.sql
-- Halal Engine V2 — Substance knowledge base tables
-- Creates: substances, substance_dossiers, substance_match_patterns,
--          substance_scenarios, substance_madhab_rulings + all indexes.

-- ── substances ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "substances" (
  "id"                varchar(50)   PRIMARY KEY,
  "slug"              varchar(50)   NOT NULL UNIQUE,
  "name_fr"           varchar(255)  NOT NULL,
  "name_en"           varchar(255)  NOT NULL,
  "name_ar"           varchar(255),
  "e_numbers"         text[]        DEFAULT '{}',
  "tier"              smallint      NOT NULL,
  "priority_score"    smallint      NOT NULL,
  "fiqh_issues"       text[]        NOT NULL,
  "issue_type"        varchar(30)   NOT NULL,
  "active_dossier_id" uuid,
  "is_active"         boolean       DEFAULT true NOT NULL,
  "created_at"        timestamptz   DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "substances_tier_idx"
  ON "substances" ("tier");

CREATE INDEX IF NOT EXISTS "substances_priority_idx"
  ON "substances" ("priority_score");

-- ── substance_dossiers ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "substance_dossiers" (
  "id"                   uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  "substance_id"         varchar(50)   NOT NULL REFERENCES "substances"("id") ON DELETE CASCADE,
  "version"              varchar(20)   NOT NULL,
  "schema_version"       varchar(30)   NOT NULL,
  "dossier_json"         jsonb         NOT NULL,
  "content_hash"         varchar(64)   NOT NULL,
  "verified_at"          timestamptz,
  "verification_passes"  smallint,
  "fatwa_count"          smallint,
  "is_active"            boolean       DEFAULT false NOT NULL,
  "created_at"           timestamptz   DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "substance_dossiers_substance_version_idx"
  ON "substance_dossiers" ("substance_id", "version");

CREATE INDEX IF NOT EXISTS "substance_dossiers_json_gin_idx"
  ON "substance_dossiers" USING GIN ("dossier_json");

-- ── substance_match_patterns ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "substance_match_patterns" (
  "id"             bigserial     PRIMARY KEY,
  "substance_id"   varchar(50)   NOT NULL REFERENCES "substances"("id") ON DELETE CASCADE,
  "pattern_type"   varchar(30)   NOT NULL,
  "pattern_value"  text          NOT NULL,
  "lang"           varchar(5),
  "priority"       smallint      DEFAULT 50 NOT NULL,
  "confidence"     real          DEFAULT 1.0 NOT NULL,
  "source"         varchar(30)   DEFAULT 'dossier_compiler' NOT NULL
);

CREATE INDEX IF NOT EXISTS "smp_type_value_idx"
  ON "substance_match_patterns" ("pattern_type", "pattern_value");

CREATE INDEX IF NOT EXISTS "smp_substance_idx"
  ON "substance_match_patterns" ("substance_id");

-- ── substance_scenarios ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "substance_scenarios" (
  "id"                   bigserial     PRIMARY KEY,
  "substance_id"         varchar(50)   NOT NULL REFERENCES "substances"("id") ON DELETE CASCADE,
  "scenario_key"         varchar(80)   NOT NULL,
  "match_conditions"     jsonb         NOT NULL,
  "specificity"          smallint      NOT NULL,
  "score"                smallint      NOT NULL,
  "verdict"              varchar(30)   NOT NULL,
  "rationale_fr"         text          NOT NULL,
  "rationale_en"         text,
  "rationale_ar"         text,
  "dossier_section_ref"  varchar(100)
);

CREATE UNIQUE INDEX IF NOT EXISTS "ss_substance_scenario_idx"
  ON "substance_scenarios" ("substance_id", "scenario_key");

CREATE INDEX IF NOT EXISTS "ss_substance_specificity_idx"
  ON "substance_scenarios" ("substance_id", "specificity");

-- ── substance_madhab_rulings ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "substance_madhab_rulings" (
  "substance_id"          varchar(50)  NOT NULL REFERENCES "substances"("id") ON DELETE CASCADE,
  "madhab"                varchar(10)  NOT NULL,
  "ruling"                varchar(20)  NOT NULL,
  "contemporary_split"    boolean      DEFAULT false NOT NULL,
  "classical_sources"     text[]       DEFAULT '{}',
  "contemporary_sources"  text[]       DEFAULT '{}',
  PRIMARY KEY ("substance_id", "madhab")
);
