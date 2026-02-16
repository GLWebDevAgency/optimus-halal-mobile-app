-- Migration 0003: Composite indexes for 50K+ user scaling
-- All indexes use CONCURRENTLY to avoid write locks on production.
-- Run via psql, NOT drizzle-kit (CONCURRENTLY not supported in transactions).

-- ── Scans: user history page (ORDER BY scanned_at DESC) ──────
-- Existing: idx_scans_user_id (user_id only)
-- New: composite covering user_id + scanned_at DESC for sorted pagination
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scans_user_scanned
  ON scans (user_id, scanned_at DESC);

-- ── Favorites: user favorites listing ─────────────────────────
-- Existing: idx_favorites_user_product (user_id, product_id UNIQUE)
-- New: composite for sorted listing by creation date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_favorites_user_created
  ON favorites (user_id, created_at DESC);

-- ── Alerts: active alerts feed ────────────────────────────────
-- Partial index: skip inactive alerts entirely
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alerts_active_published
  ON alerts (published_at DESC)
  WHERE is_active = true;

-- ── Products: barcode scan covering index ─────────────────────
-- Index-only scan for the most common query: scan barcode → show product info
-- Avoids heap access by including frequently-read columns in the index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_barcode_cover
  ON products (barcode)
  INCLUDE (name, brand, halal_status, image_url, confidence_score);

-- ── Refresh tokens: cleanup + lookup ──────────────────────────
-- Speed up expired token cleanup and user token lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_refresh_tokens_expires
  ON refresh_tokens (expires_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_refresh_tokens_user
  ON refresh_tokens (user_id, created_at DESC);
