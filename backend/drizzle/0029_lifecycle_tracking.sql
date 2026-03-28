-- ── 0029: Lifecycle tracking for free→premium conversion ─────────────────
-- Adds engagement signals to users (registered) and devices (anonymous/guest)
-- to enable funnel analysis and targeted conversion campaigns.

-- ── Table users (registered free + premium) ──────────────────────────────

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS first_scan_at      TIMESTAMPTZ,          -- "aha moment": 1er scan réussi
  ADD COLUMN IF NOT EXISTS last_active_at     TIMESTAMPTZ,          -- dernière activité enregistrée
  ADD COLUMN IF NOT EXISTS paywall_seen_count  INTEGER NOT NULL DEFAULT 0,  -- nb impressions paywall
  ADD COLUMN IF NOT EXISTS paywall_last_seen_at TIMESTAMPTZ,        -- dernière impression paywall
  ADD COLUMN IF NOT EXISTS feature_blocked_count INTEGER NOT NULL DEFAULT 0, -- nb de fois bloqué par premium gate
  ADD COLUMN IF NOT EXISTS quota_hits_count   INTEGER NOT NULL DEFAULT 0;   -- nb de fois quota atteint

-- ── Table devices (anonymous / guest / trial) ────────────────────────────

ALTER TABLE devices
  ADD COLUMN IF NOT EXISTS last_active_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paywall_seen_count  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paywall_last_seen_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS feature_blocked_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quota_hits_count    INTEGER NOT NULL DEFAULT 0;

-- ── Indexes pour les requêtes dashboard ──────────────────────────────────

CREATE INDEX IF NOT EXISTS users_last_active_idx       ON users (last_active_at DESC);
CREATE INDEX IF NOT EXISTS users_quota_hits_idx        ON users (quota_hits_count DESC) WHERE subscription_tier = 'free';
CREATE INDEX IF NOT EXISTS users_paywall_seen_idx      ON users (paywall_seen_count DESC) WHERE subscription_tier = 'free';
CREATE INDEX IF NOT EXISTS devices_last_active_idx     ON devices (last_active_at DESC);
CREATE INDEX IF NOT EXISTS devices_quota_hits_idx      ON devices (quota_hits_count DESC) WHERE converted_at IS NULL;
