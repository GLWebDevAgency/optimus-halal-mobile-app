-- Migration: 0040_halal_v2_evaluations.sql
-- Halal Engine V2 — Evaluation audit log
-- Creates: evaluation_status enum + halal_evaluations table + indexes.

DO $$ BEGIN
  CREATE TYPE "evaluation_status" AS ENUM ('ok', 'degraded', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "halal_evaluations" (
  "id"                  uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  "scan_id"             uuid          REFERENCES "scans"("id") ON DELETE SET NULL,
  "product_id"          uuid          REFERENCES "products"("id") ON DELETE SET NULL,
  "user_id"             uuid          REFERENCES "users"("id") ON DELETE SET NULL,
  "engine_version"      varchar(30)   NOT NULL,
  "user_madhab"         varchar(10),
  "user_strictness"     varchar(15),
  "user_tier"           varchar(10),
  "track"               varchar(15)   NOT NULL,
  "modules_fired"       text[]        DEFAULT '{}',
  "final_score"         smallint,
  "final_verdict"       varchar(30),
  "status"              evaluation_status DEFAULT 'ok' NOT NULL,
  "degradation_reason"  varchar(100),
  "trace"               jsonb         NOT NULL,
  "duration_ms"         integer,
  "created_at"          timestamptz   DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "he_product_idx"
  ON "halal_evaluations" ("product_id");

CREATE INDEX IF NOT EXISTS "he_created_idx"
  ON "halal_evaluations" ("created_at");

CREATE INDEX IF NOT EXISTS "he_status_idx"
  ON "halal_evaluations" ("status");

CREATE INDEX IF NOT EXISTS "he_user_idx"
  ON "halal_evaluations" ("user_id");
