-- Migration 0006: Map performance indexes
-- Targets: storeHours lookup, store name search (pg_trgm), active store rating filter

-- ── storeHours: currently NO indexes → full scan on every getById ────
-- Composite on (store_id, day_of_week) covers the JOIN + filter pattern
CREATE INDEX IF NOT EXISTS idx_store_hours_store_day
  ON store_hours (store_id, day_of_week);

-- ── pg_trgm: trigram index for fast ILIKE store name search ──────────
-- Phase 2 will add store name search to the nearby query;
-- creating the index now avoids a second migration.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_stores_name_trgm
  ON stores USING GIN (name gin_trgm_ops)
  WHERE is_active = true;

-- ── Partial index: active stores by rating ───────────────────────────
-- Supports "Note 4.0+" filter without scanning inactive stores
CREATE INDEX IF NOT EXISTS idx_stores_active_rating
  ON stores (average_rating DESC)
  WHERE is_active = true;
