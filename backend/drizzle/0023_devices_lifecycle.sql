-- Devices Lifecycle Table
-- Source of truth for device tracking, trial management, and scan quota.
-- Replaces ephemeral Redis trial keys and client-only MMKV trial state.

DO $$ BEGIN
  CREATE TYPE device_platform AS ENUM ('ios', 'android', 'web');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS devices (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id       VARCHAR(255) NOT NULL UNIQUE,

  -- Lifecycle timestamps (immutable once set)
  first_seen_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trial_started_at TIMESTAMPTZ,
  trial_expires_at TIMESTAMPTZ,

  -- Conversion tracking
  converted_at    TIMESTAMPTZ,
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Device metadata
  platform        device_platform,
  app_version     VARCHAR(20),
  os_version      VARCHAR(50),

  -- Scan quota (DB = source of truth)
  last_scan_date  DATE,
  scans_today     INTEGER NOT NULL DEFAULT 0,
  total_scans     INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS devices_user_id_idx ON devices(user_id);
CREATE INDEX IF NOT EXISTS devices_first_seen_idx ON devices(first_seen_at);
