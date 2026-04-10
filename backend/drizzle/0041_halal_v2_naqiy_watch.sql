-- Migration: 0041_halal_v2_naqiy_watch.sql
-- Halal Engine V2 — Naqiy Watch (charter, certifier reports, corroborations)
-- Creates: report_category enum, certifier_report_status enum,
--          charter_versions, user_charter_signatures,
--          certifier_reports, report_corroborations + indexes.

-- ── Enums ─────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "report_category" AS ENUM (
    'fraud_labeling',
    'protocol_violation',
    'hygiene_contamination',
    'slaughter_practice_abuse',
    'documentation_missing',
    'transparency_lack',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "certifier_report_status" AS ENUM (
    'submitted',
    'under_review',
    'verified',
    'rejected',
    'insufficient_evidence',
    'duplicate'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── charter_versions ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "charter_versions" (
  "id"              varchar(30)   PRIMARY KEY,
  "effective_from"  date          NOT NULL,
  "content_fr"      text          NOT NULL,
  "content_en"      text          NOT NULL,
  "content_ar"      text          NOT NULL,
  "hash"            varchar(64)   NOT NULL,
  "is_current"      boolean       DEFAULT false NOT NULL,
  "created_at"      timestamptz   DEFAULT now() NOT NULL
);

-- ── user_charter_signatures ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "user_charter_signatures" (
  "user_id"     uuid          NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "charter_id"  varchar(30)   NOT NULL REFERENCES "charter_versions"("id"),
  "signed_at"   timestamptz   DEFAULT now() NOT NULL,
  "ip_address"  varchar(45),
  "user_agent"  text,
  PRIMARY KEY ("user_id", "charter_id")
);

-- ── certifier_reports ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "certifier_reports" (
  "id"                      uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  "reporter_user_id"        uuid          NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "reporter_pseudonym_id"   varchar(64)   NOT NULL,
  "certifier_id"            varchar(100)  NOT NULL REFERENCES "certifiers"("id"),
  "practice_tuple_id"       uuid          REFERENCES "practice_tuples"("id") ON DELETE SET NULL,
  "product_barcode"         varchar(50),
  "category"                report_category NOT NULL,
  "title"                   varchar(255)  NOT NULL,
  "description_fr"          text          NOT NULL,
  "evidence_urls"           text[]        NOT NULL,
  "evidence_types"          text[]        NOT NULL,
  "location"                text,
  "date_observed"           date,
  "charter_version"         varchar(30)   NOT NULL,
  "charter_signed_at"       timestamptz   NOT NULL,
  "status"                  certifier_report_status DEFAULT 'submitted' NOT NULL,
  "priority"                smallint      DEFAULT 3 NOT NULL,
  "assigned_admin_id"       uuid          REFERENCES "users"("id") ON DELETE SET NULL,
  "reviewed_at"             timestamptz,
  "review_notes"            text,
  "decision_rationale"      text,
  "resulting_event_id"      uuid          REFERENCES "certifier_events"("id") ON DELETE SET NULL,
  "created_at"              timestamptz   DEFAULT now() NOT NULL,
  "updated_at"              timestamptz   DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "cr_certifier_status_idx"
  ON "certifier_reports" ("certifier_id", "status");

CREATE INDEX IF NOT EXISTS "cr_admin_status_idx"
  ON "certifier_reports" ("assigned_admin_id", "status");

CREATE INDEX IF NOT EXISTS "cr_reporter_idx"
  ON "certifier_reports" ("reporter_user_id");

-- ── report_corroborations ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "report_corroborations" (
  "report_id"     uuid    NOT NULL REFERENCES "certifier_reports"("id") ON DELETE CASCADE,
  "user_id"       uuid    NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "evidence_urls" text[]  NOT NULL,
  "note"          text,
  "created_at"    timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY ("report_id", "user_id")
);
