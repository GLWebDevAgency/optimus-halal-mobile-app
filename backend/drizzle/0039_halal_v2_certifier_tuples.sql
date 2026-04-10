-- Migration: 0039_halal_v2_certifier_tuples.sql
-- Halal Engine V2 — Certifier stance on practice tuples (SCD type 2)
-- Creates: certifier_tuple_acceptance + partial indexes for is_current = true.

CREATE TABLE IF NOT EXISTS "certifier_tuple_acceptance" (
  "id"                  uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  "certifier_id"        varchar(100)  NOT NULL REFERENCES "certifiers"("id") ON DELETE CASCADE,
  "practice_tuple_id"   uuid          NOT NULL REFERENCES "practice_tuples"("id") ON DELETE CASCADE,
  "stance"              varchar(20)   NOT NULL,
  "evidence_level"      varchar(30)   NOT NULL,
  "evidence_details"    jsonb,
  "since"               date,
  "last_verified_at"    timestamptz,
  "verified_by_user_id" uuid          REFERENCES "users"("id") ON DELETE SET NULL,
  "valid_from"          timestamptz   DEFAULT now() NOT NULL,
  "valid_to"            timestamptz,
  "is_current"          boolean       DEFAULT true NOT NULL,
  "created_at"          timestamptz   DEFAULT now() NOT NULL
);

-- Partial index: current acceptance lookup per certifier
CREATE INDEX IF NOT EXISTS "cta_certifier_current_idx"
  ON "certifier_tuple_acceptance" ("certifier_id", "is_current")
  WHERE is_current = true;

-- Index on practice_tuple_id for reverse lookups
CREATE INDEX IF NOT EXISTS "cta_tuple_idx"
  ON "certifier_tuple_acceptance" ("practice_tuple_id");

-- Unique partial index: one current acceptance per certifier x tuple
CREATE UNIQUE INDEX IF NOT EXISTS "cta_certifier_tuple_current_idx"
  ON "certifier_tuple_acceptance" ("certifier_id", "practice_tuple_id")
  WHERE is_current = true;
